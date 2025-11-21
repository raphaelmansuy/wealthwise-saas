# Infrastructure Provisioning Guide - Google Cloud Platform

## Overview

This guide explains how to provision and operate the production infrastructure for the Modern SaaS Template on Google Cloud Platform (GCP) using the script-driven workflow that lives in `deploy/deploy-production.sh`. The script automates provisioning, configuration, and deployment for the following components:

- **Artifact Registry** for container images
- **Cloud SQL (PostgreSQL)** for the primary database
- **Cloud Run** services for the API and web application
- **Custom domain mappings** and SSL certificates
- **Database migrations and seed data**

> There is no Terraform dependency anymore. All automation is handled through the Google Cloud CLI.

## Prerequisites

### Required tools

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI)
- [Docker](https://docs.docker.com/get-docker/)
- [Bun](https://bun.sh/docs/installation)
- macOS or Linux shell with `curl` and `python3`

### Google Cloud project preparation

1. **Create or select a project and set it as default**

   ```bash
   gcloud projects create your-saas-project-id --name="Modern SaaS"
   gcloud config set project your-saas-project-id
   ```

2. **Enable required services**

   ```bash
   gcloud services enable \
     run.googleapis.com \
     sqladmin.googleapis.com \
     artifactregistry.googleapis.com \
     compute.googleapis.com \
     cloudbuild.googleapis.com
   ```

3. **Authenticate**

   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

4. **Create a bucket for backups (optional but recommended)**

   ```bash
   gsutil mb gs://your-saas-backups
   ```

## Deployment workflow

1. **Clone the repository and install dependencies**

   ```bash
   git clone https://github.com/raphaelmansuy/modern_saas_template.git
   cd modern_saas_template
   bun install
   ```

2. **Configure deployment settings**

   - Copy and edit environment secrets:

     ```bash
     cp deploy/.env.example deploy/.env
     vim deploy/.env
     ```

   - Review `deploy/config.sh` and adjust project-specific values (project ID, region, custom domains, instance sizes, etc.).

3. **Run the deployment script**

   ```bash
   cd deploy
   ./deploy-production.sh
   ```

   The script performs the following actions:

   | Step | Description |
   | ---- | ----------- |
   | 1 | Verifies prerequisites and loads secrets from `deploy/.env` |
   | 2 | Creates Artifact Registry (if needed) and configures Docker auth |
   | 3 | Provisions Cloud SQL instance, database, and user |
   | 4 | Builds and pushes API/Web Docker images |
   | 5 | Runs database migrations and seeds data |
   | 6 | Deploys Cloud Run services with the correct environment variables |
   | 7 | Configures Cloud Run domain mappings (if enabled) |
   | 8 | Runs basic health checks and prints a summary |

4. **Follow the post-deployment checklist**

   - Configure DNS CNAME records if custom domains were enabled
   - Run `./deploy/setup-stripe-webhook.sh` to register Stripe webhooks
   - Test the web and API endpoints, including Clerk authentication flows

## Infrastructure components

### Artifact Registry

- Repository name is controlled by `ARTIFACT_REGISTRY_REPOSITORY`
- Located in the same region as your services (default `us-central1`)
- Images are tagged with a timestamp (e.g., `api:20240924-123045`)
- Docker login is handled automatically by `gcloud auth configure-docker`

### Cloud SQL (PostgreSQL)

- Instance name: `${PROJECT_NAME}-db` (configurable)
- Tier defaults to `db-f1-micro` for cost efficiency
- Backups run daily at `DB_BACKUP_START_TIME`
- `DB_PASSWORD` must be set in `deploy/.env`
- Authorized networks can be preset via `AUTHORIZED_NETWORKS`; if empty the script will temporarily allow your current public IP so migrations can run

### Cloud Run services

Two services are deployed:

| Service | Purpose | Image | Defaults |
| ------- | ------- | ----- | -------- |
| `${PROJECT_NAME}-api` | Hono.js backend | `api:<timestamp>` | 1 vCPU, 512Mi, max 3 instances |
| `${PROJECT_NAME}-web` | Next.js frontend | `web:<timestamp>` | 1 vCPU, 512Mi, max 5 instances |

Key runtime environment variables:

- `DATABASE_URL` generated with a Cloud SQL unix socket connection string
- `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, and the Clerk/Stripe keys from `.env`

The script deploys with `--allow-unauthenticated`, making both services publicly accessible. Adjust after deployment if you require additional restrictions.

### Custom domains

- Controlled by `API_CUSTOM_DOMAIN`, `WEB_CUSTOM_DOMAIN`, and `ENABLE_CUSTOM_DOMAINS`
- Domain mappings are created via `gcloud beta run domain-mappings`
- DNS instructions in the deployment summary will always point to `ghs.googlehosted.com`
- SSL certificates are managed automatically by Google once DNS is verified

## Configuration reference

### `deploy/config.sh`

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PROJECT_ID` | GCP project ID | `saas-app-001` |
| `REGION` | Deployment region | `us-central1` |
| `API_SERVICE_NAME` / `WEB_SERVICE_NAME` | Cloud Run service names | Derived from `PROJECT_NAME` |
| `ARTIFACT_REGISTRY_REPOSITORY` | Docker repository name | `${PROJECT_NAME}-repo` |
| `DB_TIER` | Cloud SQL machine tier | `db-f1-micro` |
| `AUTHORIZED_NETWORKS` | Comma list of `name=cidr` entries allowed to access the DB | empty |
| `API_MEMORY`, `WEB_MEMORY` | Cloud Run memory allocation | `512Mi` |
| `ENABLE_CUSTOM_DOMAINS` | Toggle DNS automation | `true` |

Override any value by exporting the variable before running the script, e.g.:

```bash
PROJECT_ID=my-production-project REGION=us-east1 ./deploy-production.sh
```

### `deploy/.env`

Required values:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DB_PASSWORD` (minimum 16 characters)

Optional services:

- `RESEND_API_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`

## Validation & monitoring

After deployment, use the following commands to verify the environment:

```bash
# List Cloud Run services and URLs
gcloud run services list --region=$(bash -c 'source deploy/config.sh; echo $REGION')

# View recent logs
gcloud run services logs read $(bash -c 'source deploy/config.sh; echo $API_SERVICE_NAME') \
  --region=$(bash -c 'source deploy/config.sh; echo $REGION') --limit=100

# Inspect Cloud SQL instance
gcloud sql instances describe $(bash -c 'source deploy/config.sh; echo $DB_INSTANCE_NAME')
```

Health checks are performed automatically by the script. You can re-run them manually:

```bash
curl -f https://api.elitizon.com/health
curl -f https://saas.elitizon.com
```

## Troubleshooting

| Symptom | Possible cause | Resolution |
| ------- | -------------- | ---------- |
| `gcloud` authentication error | No active account | Run `gcloud auth login` and re-run the script |
| Database migration failed | Local IP not authorized | Add your IP to `AUTHORIZED_NETWORKS` or rerun the script to auto-detect |
| Cloud Run deploy fails with image not found | Docker push failed / auth expired | Re-run the script; it will rebuild and push images |
| Custom domains show 404 | DNS not updated or still propagating | Verify CNAME records and wait up to 60 minutes |
| Stripe webhook events fail | `STRIPE_WEBHOOK_SECRET` missing | Update `deploy/.env` and rerun with `--app-only` |

When something goes wrong mid-run, the script can be restarted safely. Use flags to limit the scope:

- `./deploy-production.sh --infrastructure-only`
- `./deploy-production.sh --app-only`

## Ongoing maintenance

1. **Application changes**: Re-run `./deploy-production.sh --app-only` after merging code.
2. **Database schema updates**: Modify `packages/db/schema.ts`, then run migrations locally and redeploy.
3. **Credentials rotation**: Update `deploy/.env` and redeploy with `--app-only`.
4. **Scaling adjustments**: Tune Cloud Run limits in `deploy/config.sh` (memory, instances) and rerun the script.
5. **Cost monitoring**: Configure budgets in the GCP Billing console; estimated monthly cost is `$40-80` based on usage.

## Appendix: Manual commands reference

While the script should cover day-to-day operations, the following commands are useful for manual inspection or hot fixes:

```bash
# Connect to the database using Cloud SQL proxy
cloud-sql-proxy $(bash -c 'source deploy/config.sh; echo $CLOUD_SQL_CONNECTION_NAME')

# Trigger only domain mapping step (example)
gcloud beta run domain-mappings create \
  --service=$(bash -c 'source deploy/config.sh; echo $WEB_SERVICE_NAME') \
  --domain=saas.elitizon.com \
  --region=$(bash -c 'source deploy/config.sh; echo $REGION')

# Update a single env var without full redeploy (temporary change)
gcloud run services update $(bash -c 'source deploy/config.sh; echo $API_SERVICE_NAME') \
  --region=$(bash -c 'source deploy/config.sh; echo $REGION') \
  --set-env-vars=FEATURE_FLAG_EXPERIMENT=true
```

The deployment script remains the source of truth. Keep `deploy/config.sh` and `deploy/.env` up to date in version control (excluding secrets) so that every environment can be reproduced reliably.
