# CI/CD Pipeline and Deployment Automation

## Overview

This document outlines the automated deployment pipeline for the Modern SaaS Template on Google Cloud Platform, optimized for cost-efficiency and developer productivity.

## Pipeline Architecture

### CI/CD Workflow Visualization

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor': '#E8F4FD',
  'primaryTextColor': '#2D3748',
  'primaryBorderColor': '#4A90E2',
  'lineColor': '#4A90E2',
  'secondaryColor': '#F0F9FF',
  'tertiaryColor': '#E2E8F0',
  'background': '#FFFFFF',
  'mainBkg': '#F7FAFC',
  'secondBkg': '#EDF2F7'
}}}%%

flowchart LR
    subgraph Dev["👨‍💻 Development"]
        Code[💻 Code Changes]
        PR[🔄 Pull Request]
    end
    
    subgraph CI["🔄 Continuous Integration"]
        Trigger[⚡ Workflow Trigger]
        Tests[🧪 Run Tests<br/>Unit • Integration • E2E]
        Build[🏗️ Build Containers<br/>Web • API]
        Security[🔒 Security Scan<br/>Vulnerabilities • Secrets]
    end
    
    subgraph Registry["📦 Artifact Storage"]
        Push[📤 Push Images]
        Store[(🗄️ Artifact Registry<br/>$0.05/month)]
    end
    
    subgraph Deploy["🚀 Deployment"]
        WebDeploy[🌐 Deploy Web<br/>Cloud Run]
        APIDeploy[⚡ Deploy API<br/>Cloud Run]
        DBMigrate[🗄️ DB Migration<br/>Cloud SQL]
    end
    
    subgraph Verify["✅ Verification"]
        Health[❤️ Health Checks]
        Smoke[💨 Smoke Tests]
        Rollback[↩️ Auto Rollback]
    end
    
    Code --> Trigger
    PR --> Trigger
    Trigger --> Tests
    Tests --> Build
    Build --> Security
    Security --> Push
    Push --> Store
    Store --> WebDeploy
    Store --> APIDeploy
    WebDeploy --> DBMigrate
    APIDeploy --> DBMigrate
    DBMigrate --> Health
    Health --> Smoke
    Smoke --> Rollback
    
    style Code fill:#E8F4FD,stroke:#4A90E2,stroke-width:2px,color:#2D3748
    style Tests fill:#E6FFFA,stroke:#38B2AC,stroke-width:2px,color:#2D3748
    style Build fill:#FFF5F5,stroke:#E53E3E,stroke-width:2px,color:#2D3748
    style WebDeploy fill:#F0FFF4,stroke:#38A169,stroke-width:2px,color:#2D3748
    style APIDeploy fill:#FFFAF0,stroke:#DD6B20,stroke-width:2px,color:#2D3748
    style Health fill:#FAF5FF,stroke:#805AD5,stroke-width:2px,color:#2D3748
```

### Components

- **GitHub Actions**: Primary CI/CD platform (free for public repos, cost-effective for private)
- **Cloud Build**: Alternative GCP-native option
- **Artifact Registry**: Container image storage
- **Cloud Run**: Deployment target
- **Cloud SQL**: Database migrations

### Deployment Flow

1. **Code Push** → GitHub Repository
2. **Trigger Build** → GitHub Actions or Cloud Build
3. **Run Tests** → Unit, Integration, E2E
4. **Build Images** → Frontend and API containers
5. **Push to Registry** → Artifact Registry
6. **Deploy Services** → Cloud Run
7. **Run Migrations** → Database updates
8. **Health Checks** → Service verification

## Approach 1: GitHub Actions (Recommended)

### Cost Benefits

- **Free tier**: 2,000 minutes/month for private repos
- **No GCP compute costs** for CI/CD pipeline
- **Efficient resource usage**: Pay only for GitHub runner time

### Workflow Configuration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Google Cloud

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: us-central1
  REPOSITORY: saas-repo

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run linting
        run: bun run lint

      - name: Run tests
        run: bun run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build API image
        run: |
          docker build -f apps/api/Dockerfile \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:${{ github.sha }} \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:latest \
            .

      - name: Build Web image
        run: |
          docker build -f apps/web/Dockerfile \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:${{ github.sha }} \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:latest \
            .

      - name: Push images
        run: |
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:${{ github.sha }}
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:latest
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:${{ github.sha }}
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:latest

      - name: Deploy API to Cloud Run
        run: |
          gcloud run deploy saas-api-prod \
            --image=${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:${{ github.sha }} \
            --platform=managed \
            --region=${{ env.REGION }} \
            --allow-unauthenticated \
            --memory=512Mi \
            --cpu=1 \
            --concurrency=100 \
            --min-instances=0 \
            --max-instances=5 \
            --timeout=60 \
            --execution-environment=gen2 \
            --set-env-vars="DATABASE_URL=${{ secrets.DATABASE_URL }},CLERK_SECRET_KEY=${{ secrets.CLERK_SECRET_KEY }},STRIPE_SECRET_KEY=${{ secrets.STRIPE_SECRET_KEY }}"

      - name: Deploy Web to Cloud Run
        run: |
          API_URL=$(gcloud run services describe saas-api-prod --platform=managed --region=${{ env.REGION }} --format='value(status.url)')

          gcloud run deploy saas-web-prod \
            --image=${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:${{ github.sha }} \
            --platform=managed \
            --region=${{ env.REGION }} \
            --allow-unauthenticated \
            --memory=1Gi \
            --cpu=1 \
            --concurrency=100 \
            --min-instances=0 \
            --max-instances=10 \
            --timeout=60 \
            --execution-environment=gen2 \
            --set-env-vars="NEXT_PUBLIC_API_URL=${API_URL},DATABASE_URL=${{ secrets.DATABASE_URL }},NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}"

      - name: Run database migrations
        run: |
          # Install dependencies in a container context
          docker run --rm \
            -v ${{ github.workspace }}:/workspace \
            -w /workspace \
            -e DATABASE_URL="${{ secrets.DATABASE_URL }}" \
            oven/bun:latest \
            bash -c "cd packages/db && bun install && bun run push"

      - name: Health check
        run: |
          API_URL=$(gcloud run services describe saas-api-prod --platform=managed --region=${{ env.REGION }} --format='value(status.url)')
          WEB_URL=$(gcloud run services describe saas-web-prod --platform=managed --region=${{ env.REGION }} --format='value(status.url)')

          echo "API Health Check: ${API_URL}/health"
          curl -f "${API_URL}/health" || exit 1

          echo "Web Health Check: ${WEB_URL}"
          curl -f "${WEB_URL}" || exit 1

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and deploy to staging
        run: |
          # Build images
          docker build -f apps/api/Dockerfile -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:staging .
          docker build -f apps/web/Dockerfile -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:staging .

          # Push images
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:staging
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:staging

          # Deploy API
          gcloud run deploy saas-api-staging \
            --image=${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/api:staging \
            --platform=managed \
            --region=${{ env.REGION }} \
            --allow-unauthenticated \
            --memory=512Mi \
            --cpu=1 \
            --min-instances=0 \
            --max-instances=3 \
            --set-env-vars="DATABASE_URL=${{ secrets.DATABASE_URL_STAGING }}"

          # Deploy Web
          API_URL=$(gcloud run services describe saas-api-staging --platform=managed --region=${{ env.REGION }} --format='value(status.url)')
          gcloud run deploy saas-web-staging \
            --image=${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPOSITORY }}/web:staging \
            --platform=managed \
            --region=${{ env.REGION }} \
            --allow-unauthenticated \
            --memory=1Gi \
            --cpu=1 \
            --min-instances=0 \
            --max-instances=5 \
            --set-env-vars="NEXT_PUBLIC_API_URL=${API_URL}"
```

### Required Secrets

Set these in GitHub repository settings:

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCP_SA_KEY={"type": "service_account", ...}  # Service account JSON

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_URL_STAGING=postgresql://user:pass@host:5432/db_staging

# Authentication
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Payments
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Other services
RESEND_API_KEY=re_...
SENTRY_DSN=https://...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```

## Approach 2: Cloud Build

### Cost Considerations

- **Build time charges**: $0.003/build-minute
- **Free tier**: 120 build-minutes/day
- **Estimated cost**: $10-30/month for active development

### Cloud Build Configuration

Create `cloudbuild.yaml`:

```yaml
steps:
  # Install dependencies
  - name: "oven/bun:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        bun install
        bun run lint
        bun run test

  # Build API image
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "-f"
      - "apps/api/Dockerfile"
      - "-t"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/api:$SHORT_SHA"
      - "-t"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/api:latest"
      - "."

  # Build Web image
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "build"
      - "-f"
      - "apps/web/Dockerfile"
      - "-t"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/web:$SHORT_SHA"
      - "-t"
      - "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/web:latest"
      - "."

  # Push images
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "push",
        "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/api:$SHORT_SHA",
      ]

  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "push",
        "${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/web:$SHORT_SHA",
      ]

  # Deploy API
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: "gcloud"
    args:
      - "run"
      - "deploy"
      - "saas-api-${_ENV}"
      - "--image=${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/api:$SHORT_SHA"
      - "--region=${_REGION}"
      - "--platform=managed"
      - "--allow-unauthenticated"
      - "--memory=512Mi"
      - "--cpu=1"
      - "--min-instances=0"
      - "--max-instances=5"

  # Deploy Web
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        API_URL=$$(gcloud run services describe saas-api-${_ENV} --platform=managed --region=${_REGION} --format='value(status.url)')
        gcloud run deploy saas-web-${_ENV} \
          --image=${_REGION}-docker.pkg.dev/$PROJECT_ID/${_REPOSITORY}/web:$SHORT_SHA \
          --region=${_REGION} \
          --platform=managed \
          --allow-unauthenticated \
          --memory=1Gi \
          --cpu=1 \
          --min-instances=0 \
          --max-instances=10 \
          --set-env-vars="NEXT_PUBLIC_API_URL=$${API_URL}"

substitutions:
  _REGION: us-central1
  _REPOSITORY: saas-repo
  _ENV: prod

options:
  machineType: "E2_HIGHCPU_8" # Cost-efficient machine type
  logging: CLOUD_LOGGING_ONLY
```

### Set Up Cloud Build Triggers

```bash
# Connect to GitHub repository
gcloud builds triggers create github \
  --repo-name=your-repo-name \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_ENV=prod

# Staging trigger
gcloud builds triggers create github \
  --repo-name=your-repo-name \
  --repo-owner=your-github-username \
  --branch-pattern="^develop$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_ENV=staging
```

## Container Optimization

### Multi-stage Dockerfile (API)

Create optimized `apps/api/Dockerfile`:

```dockerfile
# Build stage
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN cd apps/api && bun run build

# Production stage
FROM oven/bun:slim AS runner
WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api
USER api

EXPOSE 3001

CMD ["bun", "run", "dist/index.js"]
```

### Multi-stage Dockerfile (Web)

Create optimized `apps/web/Dockerfile`:

```dockerfile
# Dependencies stage
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* bun.lock* ./
COPY apps/web/package.json ./apps/web/
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  elif [ -f bun.lock ]; then bun install --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN cd apps/web && npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/web/server.js"]
```

## Database Migration Strategy

### Automated Migrations

Create `scripts/migrate.sh`:

```bash
#!/bin/bash
set -e

echo "Running database migrations..."

# Wait for database to be ready
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "Waiting for database..."
  sleep 2
done

# Run migrations
cd packages/db
bun run push

echo "Migrations completed successfully"
```

### Migration in CI/CD

```yaml
- name: Run database migrations
  run: |
    # Install dependencies
    bun install

    # Run migrations
    cd packages/db
    bun run push
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Cost Optimization for CI/CD

### GitHub Actions Optimization

1. **Use efficient runners**: ubuntu-latest (free tier)
2. **Cache dependencies**: Bun cache, Docker layer cache
3. **Parallel jobs**: Run tests and builds in parallel
4. **Conditional deployments**: Only deploy on main branch

### Cloud Build Optimization

1. **Machine type**: Use E2_HIGHCPU_8 for faster builds
2. **Build caching**: Enable Docker layer caching
3. **Concurrent builds**: Limit to reduce costs
4. **Build triggers**: Only on specific branches

### Example with Caching

```yaml
- name: Cache Bun dependencies
  uses: actions/cache@v3
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
    restore-keys: |
      ${{ runner.os }}-bun-

- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

## Monitoring and Notifications

### Deployment Notifications

```yaml
- name: Notify deployment success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: "Deployment to production successful! 🚀"
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

- name: Notify deployment failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: "Deployment to production failed! ❌"
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Health Check Monitoring

```bash
# Post-deployment health checks
curl -f $API_URL/health || exit 1
curl -f $WEB_URL || exit 1

# Performance check (optional)
curl -w "@curl-format.txt" -o /dev/null -s $WEB_URL
```

## Security Best Practices

### Service Account Setup

```bash
# Create deployment service account
gcloud iam service-accounts create github-deploy \
  --display-name="GitHub Deployment Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Generate key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-deploy@$PROJECT_ID.iam.gserviceaccount.com
```

### Environment Separation

- **Development**: Feature branches → staging environment
- **Staging**: develop branch → staging environment
- **Production**: main branch → production environment

## Rollback Strategy

### Automated Rollback

```yaml
- name: Rollback on failure
  if: failure()
  run: |
    # Get previous revision
    PREVIOUS_REVISION=$(gcloud run revisions list \
      --service=saas-api-prod \
      --region=${{ env.REGION }} \
      --format="value(metadata.name)" \
      --limit=2 | tail -n1)

    # Rollback to previous revision
    gcloud run services update-traffic saas-api-prod \
      --to-revisions=$PREVIOUS_REVISION=100 \
      --region=${{ env.REGION }}
```

### Manual Rollback

```bash
# List revisions
gcloud run revisions list --service=saas-api-prod --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic saas-api-prod \
  --to-revisions=saas-api-prod-00002=100 \
  --region=us-central1
```

## Performance Monitoring

### Deployment Metrics

Track these metrics:

- **Build time**: Target < 5 minutes
- **Deployment time**: Target < 2 minutes
- **Success rate**: Target > 95%
- **Rollback frequency**: Target < 5%

### Cost Tracking

```bash
# Monthly CI/CD cost report
gcloud billing budgets create \
  --billing-account=$BILLING_ACCOUNT \
  --display-name="CI/CD Pipeline Budget" \
  --budget-amount=20 \
  --threshold-rule=percent=80,basis=CURRENT_SPEND
```

This CI/CD setup provides a robust, cost-effective deployment pipeline that scales with your team and application needs while maintaining high reliability and security standards.
