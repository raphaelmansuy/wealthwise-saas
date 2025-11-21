#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
log_success() { echo -e "${GREEN}✅ $*${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $*${NC}"; }
log_error() { echo -e "${RED}❌ $*${NC}"; }
log_step() { echo -e "${PURPLE}🔄 $*${NC}"; }
log_header() {
  echo -e "${CYAN}\n=================================="
  echo -e "$*"
  echo -e "==================================${NC}"
}

fatal() {
  log_error "$*"
  exit 1
}

require_tools() {
  local missing=()
  for tool in "$@"; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      missing+=("$tool")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    fatal "Missing required tools: ${missing[*]}"
  fi
}

ensure_gcloud_project() {
  local project_id="$1"
  log_step "Setting active GCP project to ${project_id}"
  gcloud config set project "$project_id" >/dev/null
}

# Converts AUTHORIZED_NETWORKS env var into gcloud ready arguments.
# Input format: "home=203.0.113.10/32,office=198.51.100.77/32"
# Output: prints lines "home=203.0.113.10/32" etc.
parse_authorized_networks() {
  local raw="${1:-}"
  if [[ -z "$raw" ]]; then
    return 0
  fi

  IFS=',' read -ra pairs <<< "$raw"
  for pair in "${pairs[@]}"; do
    local trimmed="${pair// /}"
    if [[ -n "$trimmed" ]]; then
      echo "$trimmed"
    fi
  done
}

current_public_ip() {
  local endpoints=(
    "https://ipinfo.io/ip"
    "https://ifconfig.me"
    "https://icanhazip.com"
  )

  local ip
  for endpoint in "${endpoints[@]}"; do
    ip="$(curl -fsS "${endpoint}" 2>/dev/null || true)"
    ip="${ip//$'\r\n'/}"
    ip="${ip//$'\n'/}"
    ip="${ip//$'\r'/}"
    if [[ -n "${ip}" ]]; then
      echo "${ip}"
      return 0
    fi
  done

  return 1
}
