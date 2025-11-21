#!/usr/bin/env bash

# Pragmatic production deployment script for the Modern SaaS template.
# Replaces Terraform with gcloud-driven provisioning and deployment steps.

set -o errexit
set -o pipefail
set -o nounset
set -o errtrace

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

source "${SCRIPT_DIR}/scripts/common.sh"
source "${SCRIPT_DIR}/config.sh"

ENV_FILE="${SCRIPT_DIR}/.env"
API_SERVICE_ACCOUNT_EMAIL="${API_SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
WEB_SERVICE_ACCOUNT_EMAIL="${WEB_SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
REGISTRY_HOST="${REGION}-docker.pkg.dev"
REGISTRY_URL="${REGISTRY_HOST}/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}"
CLOUD_SQL_CONNECTION_NAME=""
DATABASE_PUBLIC_IP=""
DEPLOYED_API_URL=""
DEPLOYED_WEB_URL=""
IMAGE_TAG=""
AUTHORIZED_NETWORK_ENTRIES=()
TEMP_AUTHORIZED_NETWORK=""
CLOUD_SQL_INSTANCE_READY=false
DEPLOYMENT_FAILED=false
ALLOW_TEMP_AUTHORIZED_NETWORK=true
ORIGINAL_REQUIRE_SSL_STATE=""
SSL_REQUIREMENT_TEMP_DISABLED=false

normalize_boolean() {
  local value
  value="${1:-}"
  value="$(printf '%s' "${value}" | tr '[:upper:]' '[:lower:]')"
  case "${value}" in
    true|1|yes|on) echo "true" ;;
    false|0|no|off|"") echo "false" ;;
    *) echo "${value}" ;;
  esac
}

retry_command() {
  local attempts="$1"
  shift
  local delay="$1"
  shift
  local cmd=("$@")

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if "${cmd[@]}"; then
      return 0
    fi

    if (( attempt < attempts )); then
      log_warning "Command '${cmd[*]}' failed (attempt ${attempt}/${attempts}); retrying in ${delay}s..."
      sleep "${delay}"
    fi
  done

  log_error "Command '${cmd[*]}' failed after ${attempts} attempts"
  return 1
}

wait_for_database_connection() {
  local host="$1"
  local port="${2:-5432}"
  local attempts="${3:-12}"
  local delay="${4:-10}"

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if python3 - "$host" "$port" <<'PY'
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.settimeout(5)
    try:
        sock.connect((host, port))
    except OSError:
        sys.exit(1)

sys.exit(0)
PY
    then
      log_success "Database ${host}:${port} is reachable"
      return 0
    fi

    log_warning "Database ${host}:${port} not reachable yet (attempt ${attempt}/${attempts}); retrying in ${delay}s..."
    sleep "${delay}"
  done

  return 1
}

show_banner() {
  echo -e "${CYAN}\n  🚀 PRODUCTION DEPLOYMENT" \
          "\n     SaaS Application on GCP" \
          "\n     ${API_CUSTOM_DOMAIN} + ${WEB_CUSTOM_DOMAIN}${NC}\n"
}

usage() {
  cat <<EOF
Usage: $0 [--infrastructure-only|--app-only|--help]

Options:
  --infrastructure-only   Provision infrastructure and skip application deployment
  --app-only             Build images, run migrations and deploy services only
  --help                 Show this help message
EOF
}

load_env_file() {
  log_header "Loading Environment"
  if [[ ! -f "${ENV_FILE}" ]]; then
    fatal "Missing ${ENV_FILE}. Copy deploy/.env.example and populate secrets first."
  fi

  set -o allexport
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +o allexport
  log_success "Environment variables loaded"
}

require_env_vars() {
  local missing=()
  for var in "$@"; do
    if [[ -z "${!var:-}" ]]; then
      missing+=("$var")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    fatal "Missing required environment variables in ${ENV_FILE}: ${missing[*]}"
  fi
}

check_prerequisites() {
  log_header "Checking Prerequisites"
  require_tools gcloud docker bun python3 curl

  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    fatal "No active Google Cloud authentication found. Run 'gcloud auth login'."
  fi

  if ! docker info >/dev/null 2>&1; then
    fatal "Docker daemon is not running. Start Docker Desktop or your container runtime."
  fi

  ensure_gcloud_project "${PROJECT_ID}"
  log_success "Prerequisites satisfied"
}

url_encode() {
  python3 - <<'PY' "$1"
import sys, urllib.parse
print(urllib.parse.quote_plus(sys.argv[1]))
PY
}

build_authorized_networks() {
  AUTHORIZED_NETWORK_ENTRIES=()
  TEMP_AUTHORIZED_NETWORK=""

  while read -r pair; do
    [[ -z "$pair" ]] && continue
    AUTHORIZED_NETWORK_ENTRIES+=("$pair")
  done < <(parse_authorized_networks "${AUTHORIZED_NETWORKS}")

  if (( ${#AUTHORIZED_NETWORK_ENTRIES[@]} > 0 )); then
    log_info "Authorized networks requested:"
    for entry in "${AUTHORIZED_NETWORK_ENTRIES[@]}"; do
      log_info "  • ${entry}"
    done
    return
  fi

  if [[ "${ALLOW_TEMP_AUTHORIZED_NETWORK}" != "true" ]]; then
    log_info "Temporary authorized network creation disabled."
    return
  fi

  local ip
  ip="$(current_public_ip)"
  if [[ -n "$ip" ]]; then
    TEMP_AUTHORIZED_NETWORK="${ip}/32"
    log_warning "No authorized networks configured; temporarily allowing current IP ${ip}/32 for migrations."
  else
    log_warning "Unable to detect current public IP; configure AUTHORIZED_NETWORKS to ensure database access."
  fi
}

get_current_authorized_networks_csv() {
  gcloud sql instances describe "${DB_INSTANCE_NAME}" --format=json --quiet \
  | python3 - <<'PY'
import json
import sys

raw = sys.stdin.read()
if not raw.strip():
  print('', end='')
  raise SystemExit(0)

data = json.loads(raw)
networks = (
  data.get("settings", {})
    .get("ipConfiguration", {})
    .get("authorizedNetworks")
  or []
)

parts = []
for item in networks:
  value = item.get("value")
  if not value:
    continue
  name = item.get("name")
  parts.append(f"{name}={value}" if name else value)

print(','.join(parts), end='')
PY
}

update_authorized_networks() {
  local action="$1"
  shift || true

  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    return
  fi

  local entries=("$@")
  if (( ${#entries[@]} == 0 )); then
    return
  fi

  local current_csv
  current_csv="$(get_current_authorized_networks_csv)"

  local new_csv
  new_csv="$(python3 - "${action}" "${current_csv}" "${entries[@]}" <<'PY'
import sys

action = sys.argv[1]
current = sys.argv[2] if len(sys.argv) > 2 else ""
updates = sys.argv[3:]


def parse(csv: str):
    if not csv:
        return []
    return [part for part in csv.split(',') if part]


existing = parse(current)

if action == "add":
    result = existing[:]
    for entry in updates:
        if entry and entry not in result:
            result.append(entry)
elif action == "remove":
    result = [entry for entry in existing if entry not in updates]
else:
    raise SystemExit("unknown action")

print(','.join(result), end='')
PY
)"

  local trimmed_current="${current_csv//[$'\n\r ']/}"
  local trimmed_new="${new_csv//[$'\n\r ']/}"
  local sanitized_new="${trimmed_new}"

  if [[ "${trimmed_current}" == "${trimmed_new}" ]]; then
    log_info "Authorized networks already up to date"
    return
  fi

  if [[ -z "${trimmed_new}" ]]; then
    log_step "Clearing authorized networks on ${DB_INSTANCE_NAME}"
    gcloud sql instances patch "${DB_INSTANCE_NAME}" \
      --authorized-networks="" \
      --quiet >/dev/null
    log_info "Authorized networks cleared"
  else
    log_step "Updating authorized networks on ${DB_INSTANCE_NAME}"
    gcloud sql instances patch "${DB_INSTANCE_NAME}" \
      --authorized-networks="${sanitized_new}" \
      --quiet >/dev/null
    log_info "Authorized networks now: ${sanitized_new}"
  fi
}

ensure_authorized_networks() {
  local entries=("$@")
  if (( ${#entries[@]} == 0 )); then
    log_info "No authorized network changes requested"
    return
  fi

  log_header "Authorized Networks"
  update_authorized_networks add "${entries[@]}"
}

remove_temporary_authorized_network() {
  if [[ -z "${TEMP_AUTHORIZED_NETWORK}" ]]; then
    return
  fi

  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    TEMP_AUTHORIZED_NETWORK=""
    return
  fi

  log_step "Revoking temporary network access ${TEMP_AUTHORIZED_NETWORK}"
  update_authorized_networks remove "${TEMP_AUTHORIZED_NETWORK}"
  TEMP_AUTHORIZED_NETWORK=""
}

get_current_require_ssl() {
  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    echo ""
    return
  fi

  gcloud sql instances describe "${DB_INSTANCE_NAME}" \
    --format="value(settings.ipConfiguration.requireSsl)" \
    --quiet 2>/dev/null || echo ""
}

set_require_ssl() {
  local enable
  enable="$(normalize_boolean "$1")"

  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    return
  fi

  if [[ "${enable}" == "true" ]]; then
    log_step "Enabling SSL requirement on ${DB_INSTANCE_NAME}"
    gcloud sql instances patch "${DB_INSTANCE_NAME}" \
      --require-ssl \
      --quiet >/dev/null
  else
    log_step "Disabling SSL requirement on ${DB_INSTANCE_NAME}"
    gcloud sql instances patch "${DB_INSTANCE_NAME}" \
      --no-require-ssl \
      --quiet >/dev/null
  fi
}

ensure_ssl_requirement() {
  local desired="$1"
  local desired_normalized
  desired_normalized="$(normalize_boolean "${desired}")"

  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    return
  fi

  local current_raw
  current_raw="$(get_current_require_ssl)"
  local current
  current="$(normalize_boolean "${current_raw}")"

  if [[ "${desired_normalized}" == "true" && "${current}" != "true" ]]; then
    set_require_ssl true
  elif [[ "${desired_normalized}" != "true" && "${current}" == "true" ]]; then
    set_require_ssl false
  else
    log_info "SSL requirement already set to ${current} on ${DB_INSTANCE_NAME}"
  fi
}

temporarily_disable_ssl_requirement_for_migrations() {
  if [[ "$(normalize_boolean "${DB_REQUIRE_SSL}")" != "true" ]]; then
    return
  fi

  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    return
  fi

  local current_raw
  current_raw="$(get_current_require_ssl)"
  local current
  current="$(normalize_boolean "${current_raw}")"
  ORIGINAL_REQUIRE_SSL_STATE="${current}"

  if [[ "${current}" == "true" ]]; then
    log_warning "Temporarily disabling SSL requirement for migrations on ${DB_INSTANCE_NAME}"
    set_require_ssl false
    SSL_REQUIREMENT_TEMP_DISABLED=true
  else
    log_info "SSL requirement already disabled for ${DB_INSTANCE_NAME}"
  fi
}

restore_ssl_requirement() {
  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    return
  fi

  ensure_ssl_requirement "${DB_REQUIRE_SSL}"
  SSL_REQUIREMENT_TEMP_DISABLED=false
}

prepare_authorized_networks_for_migrations() {
  if [[ "${CLOUD_SQL_INSTANCE_READY}" != "true" ]]; then
    return
  fi

  local additions=()
  if [[ ${AUTHORIZED_NETWORK_ENTRIES+set} == set && ${#AUTHORIZED_NETWORK_ENTRIES[@]} -gt 0 ]]; then
    additions+=("${AUTHORIZED_NETWORK_ENTRIES[@]}")
  fi
  if [[ -n "${TEMP_AUTHORIZED_NETWORK}" ]]; then
    additions+=("${TEMP_AUTHORIZED_NETWORK}")
  fi

  if (( ${#additions[@]} == 0 )); then
    local existing_csv
    existing_csv="$(get_current_authorized_networks_csv)"
    local trimmed="${existing_csv//[$'\n\r ']/}"
    if [[ -z "${trimmed}" ]]; then
      log_warning "No authorized networks configured on ${DB_INSTANCE_NAME}. Database migrations may fail without connectivity."
    else
      log_info "Existing authorized networks detected: ${existing_csv}"
    fi
    return
  fi

  ensure_authorized_networks "${additions[@]}"
}

on_error() {
  local exit_code=$?
  local line_no="${1:-}"
  shift || true
  local command="${1:-}"

  DEPLOYMENT_FAILED=true
  log_error "Command failed with exit code ${exit_code} at line ${line_no}: ${command}"
}

cleanup_on_exit() {
  remove_temporary_authorized_network || true
  restore_ssl_requirement || true
  if [[ "${DEPLOYMENT_FAILED}" == "true" ]]; then
    log_error "Deployment terminated with errors. Review the logs above for details."
  fi
}

ensure_artifact_registry() {
  log_header "Artifact Registry"
  if gcloud artifacts repositories describe "${ARTIFACT_REGISTRY_REPOSITORY}" \
      --location="${REGION}" >/dev/null 2>&1; then
    log_info "Repository ${ARTIFACT_REGISTRY_REPOSITORY} already exists"
  else
    log_step "Creating Artifact Registry repository ${ARTIFACT_REGISTRY_REPOSITORY}"
    gcloud artifacts repositories create "${ARTIFACT_REGISTRY_REPOSITORY}" \
      --repository-format=DOCKER \
      --location="${REGION}" \
      --description="Container registry for Modern SaaS template" \
      --immutable-tags
    log_success "Artifact Registry repository created"
  fi
}

ensure_service_account() {
  local account_id="$1"
  local display_name="$2"
  local email="$3"

  if gcloud iam service-accounts describe "${email}" >/dev/null 2>&1; then
    log_info "Service account ${email} exists"
  else
    log_step "Creating service account ${account_id}"
    gcloud iam service-accounts create "${account_id}" \
      --display-name="${display_name}"
    log_success "Service account ${email} created"
  fi
}

grant_service_account_roles() {
  local email="$1"
  shift
  for role in "$@"; do
    log_step "Ensuring ${email} has role ${role}"
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="serviceAccount:${email}" \
      --role="${role}" \
      --quiet >/dev/null
  done
}

ensure_cloud_sql_instance() {
  log_header "Cloud SQL Instance"
  if gcloud sql instances describe "${DB_INSTANCE_NAME}" >/dev/null 2>&1; then
    log_info "Cloud SQL instance ${DB_INSTANCE_NAME} already exists"
  else
    log_step "Creating Cloud SQL instance ${DB_INSTANCE_NAME}"
    gcloud sql instances create "${DB_INSTANCE_NAME}" \
      --project="${PROJECT_ID}" \
      --database-version=POSTGRES_15 \
      --tier="${DB_TIER}" \
      --region="${REGION}" \
      --storage-size="${DB_DISK_SIZE_GB}" \
      --storage-auto-increase \
      --availability-type=ZONAL \
      --backup-start-time="${DB_BACKUP_START_TIME}" \
    --no-enable-point-in-time-recovery \
      --quiet
    log_success "Cloud SQL instance created"
  fi

  CLOUD_SQL_CONNECTION_NAME="$(gcloud sql instances describe "${DB_INSTANCE_NAME}" --format="value(connectionName)")"
  DATABASE_PUBLIC_IP="$(gcloud sql instances describe "${DB_INSTANCE_NAME}" --format="value(ipAddresses[0].ipAddress)")"
  CLOUD_SQL_INSTANCE_READY=true
  ORIGINAL_REQUIRE_SSL_STATE="$(normalize_boolean "$(get_current_require_ssl)")"
  ensure_ssl_requirement "${DB_REQUIRE_SSL}"

  if [[ -z "${DATABASE_PUBLIC_IP}" ]]; then
    log_warning "Cloud SQL instance ${DB_INSTANCE_NAME} has no public IP address. Configure one or use a Cloud SQL Auth Proxy for migrations."
  fi
}

ensure_database_and_user() {
  log_header "Database & User"
  if gcloud sql databases list --instance="${DB_INSTANCE_NAME}" --format="value(name)" | grep -Fx "${DB_NAME}" >/dev/null; then
    log_info "Database ${DB_NAME} already exists"
  else
    log_step "Creating database ${DB_NAME}"
    gcloud sql databases create "${DB_NAME}" --instance="${DB_INSTANCE_NAME}"
  fi

  if gcloud sql users list --instance="${DB_INSTANCE_NAME}" --format="value(name)" | grep -Fx "${DB_USER}" >/dev/null; then
    log_step "Updating password for user ${DB_USER}"
    gcloud sql users set-password "${DB_USER}" --instance="${DB_INSTANCE_NAME}" --password="${DB_PASSWORD}" --host="%"
  else
    log_step "Creating database user ${DB_USER}"
    gcloud sql users create "${DB_USER}" --instance="${DB_INSTANCE_NAME}" --password="${DB_PASSWORD}" --host="%"
  fi

  log_success "Database ${DB_NAME} and user ${DB_USER} ready"
}

run_database_migrations() {
  log_header "Database Migrations"
  if [[ -z "${DATABASE_PUBLIC_IP}" ]]; then
    fatal "Database public IP not resolved."
  fi

  if ! wait_for_database_connection "${DATABASE_PUBLIC_IP}" 5432 12 10; then
    fatal "Unable to reach database ${DATABASE_PUBLIC_IP}:5432 after multiple attempts."
  fi

  temporarily_disable_ssl_requirement_for_migrations

  local previous_database_url="${DATABASE_URL:-}"
  local encoded_password
  encoded_password="$(url_encode "${DB_PASSWORD}")"
  local db_url="postgresql://${DB_USER}:${encoded_password}@${DATABASE_PUBLIC_IP}:5432/${DB_NAME}?sslmode=disable"
  export DATABASE_URL="${db_url}"
  log_step "Running migrations via Drizzle"
  pushd "${ROOT_DIR}/packages/db" >/dev/null
  bun install
  bun run generate
  if ! retry_command 3 15 bun run push; then
    fatal "Database migrations failed to apply after multiple attempts."
  fi
  bun run seed
  popd >/dev/null
  restore_ssl_requirement
  if [[ -n "${previous_database_url}" ]]; then
    export DATABASE_URL="${previous_database_url}"
  else
    unset DATABASE_URL || true
  fi
  log_success "Database migrations and seed complete"
}

build_and_push_images() {
  log_header "Building & Publishing Images"
  IMAGE_TAG="$(date +%Y%m%d%H%M%S)"
  local api_image="${REGISTRY_URL}/api:${IMAGE_TAG}"
  local web_image="${REGISTRY_URL}/web:${IMAGE_TAG}"

  if [[ -z "${DOCKER_DEFAULT_PLATFORM:-}" ]]; then
    export DOCKER_DEFAULT_PLATFORM="linux/amd64"
    log_info "Using Docker default platform ${DOCKER_DEFAULT_PLATFORM} for cross-platform compatibility"
  else
    log_info "Docker default platform already set to ${DOCKER_DEFAULT_PLATFORM}"
  fi

  log_step "Configuring Docker authentication"
  gcloud auth configure-docker "${REGISTRY_HOST}" --quiet

  log_step "Building API container"
  pushd "${ROOT_DIR}" >/dev/null
  docker build -f deploy/dockerfiles/Dockerfile.api -t "${api_image}" .

  log_step "Building Web container"
  local web_build_args=(
    "--build-arg" "NEXT_PUBLIC_API_URL=https://${API_CUSTOM_DOMAIN}"
  )
  [[ -n "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" ]] && web_build_args+=("--build-arg" "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}")
  [[ -n "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" ]] && web_build_args+=("--build-arg" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}")
  [[ -n "${NEXT_PUBLIC_CLERK_SIGN_IN_URL:-}" ]] && web_build_args+=("--build-arg" "NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL}")
  [[ -n "${NEXT_PUBLIC_CLERK_SIGN_UP_URL:-}" ]] && web_build_args+=("--build-arg" "NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL}")
  [[ -n "${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:-}" ]] && web_build_args+=("--build-arg" "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}")
  [[ -n "${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:-}" ]] && web_build_args+=("--build-arg" "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}")
  docker build -f deploy/dockerfiles/Dockerfile.web -t "${web_image}" "${web_build_args[@]}" .

  log_step "Pushing images"
  docker push "${api_image}"
  docker push "${web_image}"
  popd >/dev/null

  log_success "Images pushed (${IMAGE_TAG})"
}

join_env_vars() {
  local IFS=','
  echo "$*"
}

deploy_cloud_run_services() {
  log_header "Deploying Cloud Run Services"
  local encoded_password="$(url_encode "${DB_PASSWORD}")"
  local db_url="postgresql://${DB_USER}:${encoded_password}@localhost:5432/${DB_NAME}?host=/cloudsql/${CLOUD_SQL_CONNECTION_NAME}&sslmode=require"
  local api_image="${REGISTRY_URL}/api:${IMAGE_TAG}"
  local web_image="${REGISTRY_URL}/web:${IMAGE_TAG}"

  local api_envs=()
  api_envs+=("DATABASE_URL=${db_url}")
  api_envs+=("NODE_ENV=production")
  api_envs+=("PGSSLMODE=require")
  api_envs+=("CORS_ORIGINS=https://${WEB_CUSTOM_DOMAIN}")
  [[ -n "${CLERK_SECRET_KEY:-}" ]] && api_envs+=("CLERK_SECRET_KEY=${CLERK_SECRET_KEY}")
  [[ -n "${STRIPE_SECRET_KEY:-}" ]] && api_envs+=("STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}")
  [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]] && api_envs+=("STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}")
  [[ -n "${RESEND_API_KEY:-}" ]] && api_envs+=("RESEND_API_KEY=${RESEND_API_KEY}")
  [[ -n "${SENTRY_DSN:-}" ]] && api_envs+=("SENTRY_DSN=${SENTRY_DSN}")
  [[ -n "${PUBLIC_API_KEYS:-}" ]] && api_envs+=("PUBLIC_API_KEYS=${PUBLIC_API_KEYS}")
  [[ -n "${PUBLIC_API_TIMESTAMP_WINDOW_MS:-}" ]] && api_envs+=("PUBLIC_API_TIMESTAMP_WINDOW_MS=${PUBLIC_API_TIMESTAMP_WINDOW_MS}")
  [[ -n "${ALLOW_INSECURE_PUBLIC_API:-}" ]] && api_envs+=("ALLOW_INSECURE_PUBLIC_API=${ALLOW_INSECURE_PUBLIC_API}")

  log_step "Deploying ${API_SERVICE_NAME}"
  gcloud run deploy "${API_SERVICE_NAME}" \
    --image="${api_image}" \
    --region="${REGION}" \
    --platform=managed \
    --service-account="${API_SERVICE_ACCOUNT_EMAIL}" \
    --cpu="${API_CPU}" \
    --memory="${API_MEMORY}" \
    --max-instances="${API_MAX_INSTANCES}" \
    --min-instances="${API_MIN_INSTANCES}" \
    --timeout="${RUN_TIMEOUT_SECONDS}" \
    --add-cloudsql-instances="${CLOUD_SQL_CONNECTION_NAME}" \
    --set-env-vars="$(join_env_vars "${api_envs[@]}")" \
    --allow-unauthenticated \
    --quiet

  local web_envs=()
  web_envs+=("NODE_ENV=production")
  web_envs+=("NEXT_PUBLIC_API_URL=https://${API_CUSTOM_DOMAIN}")
  [[ -n "${CLERK_SECRET_KEY:-}" ]] && web_envs+=("CLERK_SECRET_KEY=${CLERK_SECRET_KEY}")
  [[ -n "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" ]] && web_envs+=("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}")
  [[ -n "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" ]] && web_envs+=("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}")
  [[ -n "${NEXT_PUBLIC_POSTHOG_KEY:-}" ]] && web_envs+=("NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY}")
  web_envs+=("NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com")
  [[ -n "${PUBLIC_API_KEY_SECRET:-}" ]] && web_envs+=("PUBLIC_API_KEY_SECRET=${PUBLIC_API_KEY_SECRET}")
  [[ -n "${ALLOW_INSECURE_PUBLIC_API:-}" ]] && web_envs+=("ALLOW_INSECURE_PUBLIC_API=${ALLOW_INSECURE_PUBLIC_API}")

  log_step "Deploying ${WEB_SERVICE_NAME}"
  gcloud run deploy "${WEB_SERVICE_NAME}" \
    --image="${web_image}" \
    --region="${REGION}" \
    --platform=managed \
    --service-account="${WEB_SERVICE_ACCOUNT_EMAIL}" \
    --cpu="${WEB_CPU}" \
    --memory="${WEB_MEMORY}" \
    --max-instances="${WEB_MAX_INSTANCES}" \
    --min-instances="${WEB_MIN_INSTANCES}" \
    --timeout="${RUN_TIMEOUT_SECONDS}" \
    --set-env-vars="$(join_env_vars "${web_envs[@]}")" \
    --allow-unauthenticated \
    --quiet

  DEPLOYED_API_URL="$(gcloud run services describe "${API_SERVICE_NAME}" --region="${REGION}" --format="value(status.url)")"
  DEPLOYED_WEB_URL="$(gcloud run services describe "${WEB_SERVICE_NAME}" --region="${REGION}" --format="value(status.url)")"

  log_success "Cloud Run services updated"
}

configure_custom_domains() {
  [[ "${ENABLE_CUSTOM_DOMAINS}" != "true" ]] && return
  log_header "Custom Domains"

  if [[ -n "${WEB_CUSTOM_DOMAIN}" ]]; then
    if gcloud beta run domain-mappings describe "${WEB_CUSTOM_DOMAIN}" --region="${REGION}" --platform=managed >/dev/null 2>&1; then
      log_info "Domain mapping for ${WEB_CUSTOM_DOMAIN} exists"
    else
      log_step "Creating domain mapping for ${WEB_CUSTOM_DOMAIN}"
      if ! output=$(gcloud beta run domain-mappings create \
        --region="${REGION}" \
        --service="${WEB_SERVICE_NAME}" \
        --domain="${WEB_CUSTOM_DOMAIN}" \
        --platform=managed \
        --quiet 2>&1); then
        if [[ "${output}" == *"already exists"* ]]; then
          log_info "Domain mapping for ${WEB_CUSTOM_DOMAIN} already exists (skipping)"
        else
          log_error "Failed to create domain mapping for ${WEB_CUSTOM_DOMAIN}: ${output}"
          return 1
        fi
      fi
    fi
  fi

  if [[ -n "${API_CUSTOM_DOMAIN}" ]]; then
    if gcloud beta run domain-mappings describe "${API_CUSTOM_DOMAIN}" --region="${REGION}" --platform=managed >/dev/null 2>&1; then
      log_info "Domain mapping for ${API_CUSTOM_DOMAIN} exists"
    else
      log_step "Creating domain mapping for ${API_CUSTOM_DOMAIN}"
      if ! output=$(gcloud beta run domain-mappings create \
        --region="${REGION}" \
        --service="${API_SERVICE_NAME}" \
        --domain="${API_CUSTOM_DOMAIN}" \
        --platform=managed \
        --quiet 2>&1); then
        if [[ "${output}" == *"already exists"* ]]; then
          log_info "Domain mapping for ${API_CUSTOM_DOMAIN} already exists (skipping)"
        else
          log_error "Failed to create domain mapping for ${API_CUSTOM_DOMAIN}: ${output}"
          return 1
        fi
      fi
    fi
  fi

  log_info "Remember to configure DNS CNAME records pointing to ghs.googlehosted.com"
}

run_health_checks() {
  log_header "Health Checks"

  if [[ -n "${DEPLOYED_API_URL}" ]]; then
    log_step "Checking API service"
    if curl -fsS "${DEPLOYED_API_URL}/health" >/dev/null; then
      log_success "API health check passed"
    else
      log_warning "API health check failed (service may still be warming up)"
    fi
  fi

  if [[ -n "${DEPLOYED_WEB_URL}" ]]; then
    log_step "Checking Web service"
    if curl -fsS "${DEPLOYED_WEB_URL}" >/dev/null; then
      log_success "Web health check passed"
    else
      log_warning "Web health check failed (service may still be warming up)"
    fi
  fi
}

show_summary() {
  log_header "Deployment Summary"
  cat <<EOF
🎉 Deployment completed successfully!

Cloud Run URLs:
  API: ${DEPLOYED_API_URL:-N/A}
  Web: ${DEPLOYED_WEB_URL:-N/A}

Custom Domains:
  API: https://${API_CUSTOM_DOMAIN}
  Web: https://${WEB_CUSTOM_DOMAIN}

Cloud SQL:
  Instance: ${DB_INSTANCE_NAME}
  Connection: ${CLOUD_SQL_CONNECTION_NAME}
  Public IP: ${DATABASE_PUBLIC_IP}

Estimated Monthly Cost: ${ESTIMATED_MONTHLY_COST}

Next Steps:
  1. Configure DNS CNAME records as noted above
  2. Run ./setup-stripe-webhook.sh for Stripe webhooks
  3. Monitor services: gcloud run services logs read ${API_SERVICE_NAME} --region=${REGION}
EOF
}

provision_infrastructure() {
  ensure_artifact_registry
  ensure_service_account "${API_SERVICE_ACCOUNT_ID}" "Cloud Run API" "${API_SERVICE_ACCOUNT_EMAIL}"
  ensure_service_account "${WEB_SERVICE_ACCOUNT_ID}" "Cloud Run Web" "${WEB_SERVICE_ACCOUNT_EMAIL}"
  grant_service_account_roles "${API_SERVICE_ACCOUNT_EMAIL}" \
    roles/cloudsql.client \
    roles/logging.logWriter \
    roles/monitoring.metricWriter \
    roles/artifactregistry.reader
  grant_service_account_roles "${WEB_SERVICE_ACCOUNT_EMAIL}" \
    roles/logging.logWriter \
    roles/monitoring.metricWriter \
    roles/artifactregistry.reader
  ensure_cloud_sql_instance
  ensure_database_and_user
}

main() {
  local infrastructure_only=false
  local app_only=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --infrastructure-only) infrastructure_only=true ;;
      --app-only) app_only=true ;;
      --help) usage; exit 0 ;;
      *) fatal "Unknown option: $1" ;;
    esac
    shift
  done

  if [[ "${infrastructure_only}" == "true" && "${app_only}" == "true" ]]; then
    fatal "Cannot combine --infrastructure-only and --app-only"
  fi

  if [[ "${infrastructure_only}" == "true" ]]; then
    ALLOW_TEMP_AUTHORIZED_NETWORK=false
  fi

  show_banner
  check_prerequisites
  load_env_file
  local required_env_vars=(DB_PASSWORD)
  if [[ "${infrastructure_only}" != "true" ]]; then
    required_env_vars+=(
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      CLERK_SECRET_KEY
      STRIPE_SECRET_KEY
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      STRIPE_WEBHOOK_SECRET
    )
  fi
  require_env_vars "${required_env_vars[@]}"

  build_authorized_networks

  if [[ "${app_only}" != "true" ]]; then
    provision_infrastructure
  else
    log_info "Skipping infrastructure provisioning (--app-only)"
    CLOUD_SQL_CONNECTION_NAME="$(gcloud sql instances describe "${DB_INSTANCE_NAME}" --format="value(connectionName)")"
    DATABASE_PUBLIC_IP="$(gcloud sql instances describe "${DB_INSTANCE_NAME}" --format="value(ipAddresses[0].ipAddress)")"
    CLOUD_SQL_INSTANCE_READY=true
  ORIGINAL_REQUIRE_SSL_STATE="$(normalize_boolean "$(get_current_require_ssl)")"
  ensure_ssl_requirement "${DB_REQUIRE_SSL}"
    if [[ -z "${CLOUD_SQL_CONNECTION_NAME}" ]]; then
      fatal "Unable to locate Cloud SQL instance ${DB_INSTANCE_NAME}. Run with --infrastructure-only first to provision it."
    fi
  fi

  if [[ "${infrastructure_only}" == "true" ]]; then
    log_info "Skipping application deployment (--infrastructure-only)"
    return
  fi

  prepare_authorized_networks_for_migrations
  build_and_push_images
  run_database_migrations
  remove_temporary_authorized_network
  deploy_cloud_run_services
  configure_custom_domains
  run_health_checks
  show_summary
}

trap 'on_error ${LINENO} "${BASH_COMMAND}"' ERR
trap cleanup_on_exit EXIT

main "$@"