#!/usr/bin/env bash

# -----------------------------------------------------------------------------
# Deployment configuration for the Modern SaaS template.
# Edit the values below to match your GCP project and resource preferences.
# You can override any value by exporting an environment variable before
# running deploy-production.sh (e.g. PROJECT_ID=my-project ./deploy-production.sh)
# -----------------------------------------------------------------------------

# Core project settings
PROJECT_ID="${PROJECT_ID:-saas-app-001}"
PROJECT_NAME="${PROJECT_NAME:-saas-app-001}"
REGION="${REGION:-us-central1}"

# Cloud Run service names and custom domains
API_SERVICE_NAME="${API_SERVICE_NAME:-${PROJECT_NAME}-api}"
WEB_SERVICE_NAME="${WEB_SERVICE_NAME:-${PROJECT_NAME}-web}"
API_CUSTOM_DOMAIN="${API_CUSTOM_DOMAIN:-api.elitizon.com}"
WEB_CUSTOM_DOMAIN="${WEB_CUSTOM_DOMAIN:-saas.elitizon.com}"

# Artifact Registry
ARTIFACT_REGISTRY_REPOSITORY="${ARTIFACT_REGISTRY_REPOSITORY:-${PROJECT_NAME}-repo}"

# Cloud SQL settings
DB_INSTANCE_NAME="${DB_INSTANCE_NAME:-${PROJECT_NAME}-db}"
DB_NAME="${DB_NAME:-saas_db}"
DB_USER="${DB_USER:-saas_user}"
DB_TIER="${DB_TIER:-db-f1-micro}"
DB_DISK_SIZE_GB="${DB_DISK_SIZE_GB:-10}"
DB_AUTO_RESIZE_LIMIT_GB="${DB_AUTO_RESIZE_LIMIT_GB:-100}"
DB_BACKUP_START_TIME="${DB_BACKUP_START_TIME:-03:00}"
# Database security
DB_REQUIRE_SSL="${DB_REQUIRE_SSL:-true}"

# When AUTHORIZED_NETWORKS is empty the script will try to detect the current
# public IP address and allow it temporarily for migrations.
# Format: "home=203.0.113.10/32,office=198.51.100.77/32"
AUTHORIZED_NETWORKS="${AUTHORIZED_NETWORKS:-}"

# Cloud Run compute configuration
API_CPU="${API_CPU:-1}"
API_MEMORY="${API_MEMORY:-512Mi}"
API_MAX_INSTANCES="${API_MAX_INSTANCES:-3}"
API_MIN_INSTANCES="${API_MIN_INSTANCES:-0}"

WEB_CPU="${WEB_CPU:-1}"
WEB_MEMORY="${WEB_MEMORY:-512Mi}"
WEB_MAX_INSTANCES="${WEB_MAX_INSTANCES:-5}"
WEB_MIN_INSTANCES="${WEB_MIN_INSTANCES:-0}"

RUN_TIMEOUT_SECONDS="${RUN_TIMEOUT_SECONDS:-60}"

# Service Accounts
API_SERVICE_ACCOUNT_ID="${API_SERVICE_ACCOUNT_ID:-cloudrun-api-sa}"
WEB_SERVICE_ACCOUNT_ID="${WEB_SERVICE_ACCOUNT_ID:-cloudrun-web-sa}"

# Domain mapping toggle. Set to "false" to skip custom domains during deploy.
ENABLE_CUSTOM_DOMAINS="${ENABLE_CUSTOM_DOMAINS:-true}"

# Budget configuration (informational only)
ESTIMATED_MONTHLY_COST="${ESTIMATED_MONTHLY_COST:-\$15-25/month}"
