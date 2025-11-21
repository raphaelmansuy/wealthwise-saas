# Quick Start Guide for Single-Environment Deployment

## 🚀 Single Environment Deployment

This deployment is optimized for:

- **Domains**: `api.elitizon.com` and `saas.elitizon.com`
- **Single environment** (no dev/staging complexity)
- **Cost-optimized** GCP architecture ($15-25/month)
- **No VPC required** (Cloud SQL public IP with short-lived allow lists)

## Prerequisites

1. **Google Cloud Platform**:

   - Project ID: `saas-app-001`
   - Billing enabled
   - gcloud CLI authenticated
   - Docker Desktop (or compatible daemon) running locally

2. **Domain Access**:

   - Control over `elitizon.com` DNS settings
   - Ability to add CNAME records

3. **External Service Accounts**:
   - Clerk.com account (authentication)
   - Stripe account (payments)
   - Optional: Resend, Sentry, PostHog accounts

## 🎯 Quick Deployment (30 minutes)

### Step 1: Configure Secrets

```bash
# Copy and edit environment file
cp deploy/.env.example deploy/.env
vim deploy/.env
```


- Schedule monthly log export cleanup or reduce log retention to 7 days to stay within the free tier.
- Avoid unnecessary background jobs; batch cron-style work to run from Cloud Run jobs instead of keeping services warm.
- Review Artifact Registry images quarterly and delete unused tags to avoid storage creep.
- If traffic spikes, scale vertically (larger instance) before increasing min instances to keep idle cost near zero.
- For predictable workloads, reserve capacity only after usage stabilizes to avoid paying for idle reservations.
**Required secrets in `deploy/.env`:**

```env
# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_YOUR_KEY"
CLERK_SECRET_KEY="sk_live_YOUR_KEY"

# Stripe Payments (REQUIRED)
STRIPE_SECRET_KEY="sk_live_YOUR_KEY"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"

# Public API Security (REQUIRED)
PUBLIC_API_KEYS="primary:YOUR_PRODUCTION_SECRET_KEY"
PUBLIC_API_TIMESTAMP_WINDOW_MS="300000"
ALLOW_INSECURE_PUBLIC_API="false"

# Public API Proxy
PUBLIC_API_KEY_SECRET="your_shared_api_key_secret"

# Optional services
RESEND_API_KEY="re_YOUR_KEY"
SENTRY_DSN="https://YOUR_SENTRY_DSN"
NEXT_PUBLIC_POSTHOG_KEY="phc_YOUR_KEY"
```

### Step 2: Review Deployment Config

`deploy/config.sh` holds sane defaults for a cost-optimized single environment. Update it if you need to override:


```bash
vim deploy/config.sh
```

### Step 3: Deploy Everything

```bash
# Run complete deployment
cd deploy
./deploy-production.sh
```

This will:

1. 🏗️ Provision infrastructure with gcloud (Artifact Registry, Cloud SQL, Cloud Run, domains)
2. 📦 Build and push Docker images
3. 🗄️ Run database migrations and seeds
4. 🚀 Deploy API and Web services with fresh env vars
5. 🔍 Execute health checks and print a summary

**What to expect:**

- The script verifies required CLI tools and that Docker is running before doing anything destructive.
- If `AUTHORIZED_NETWORKS` is empty, it temporarily adds your current public IP for database migrations and revokes it automatically on success.
- Re-running the script is safe: existing resources are reused, service accounts keep their roles, and only changed pieces are updated.

### Step 4: Configure DNS

Add these DNS records to your domain registrar:

```text
# Web Application
Type: CNAME
Name: saas
Value: ghs.googlehosted.com

# API
Type: CNAME
Name: api
Value: ghs.googlehosted.com
```

**DNS propagation takes 15-60 minutes.**

## ⚡ Configure Stripe Webhooks

After deployment, you need to configure Stripe webhooks for payment processing:

### Quick Setup (Recommended)

Run the automated webhook setup script:

```bash
cd deploy
./setup-stripe-webhook.sh
```

This script will guide you through the webhook configuration process.

### Manual Setup

If you prefer manual setup:

### Step 1: Get Your Webhook URL

Your webhook endpoint will be: `https://api.elitizon.com/api/webhooks`

### Step 2: Configure in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://api.elitizon.com/api/webhooks`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**

### Step 3: Get Webhook Secret

1. Click on your newly created webhook
2. Copy the **Signing secret** (starts with `whsec_`)
3. Add it to `deploy/.env`:

```env
STRIPE_WEBHOOK_SECRET="whsec_your_actual_secret_here"
```

### Step 4: Redeploy with Webhook Secret

```bash
# Update API service with webhook secret
./deploy-production.sh --app-only
```

### Step 5: Test Webhook

Test your webhook using Stripe CLI:

```bash
# Install Stripe CLI if not already installed
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Test the webhook
stripe trigger payment_intent.succeeded --api-key sk_live_YOUR_KEY
```

Check your API logs to verify webhook processing:

```bash
gcloud run services logs read saas-app-001-api --region=us-central1
```

## 🎉 You're live

Once DNS propagates:

- **Web App**: [https://saas.elitizon.com](https://saas.elitizon.com)
- **API**: [https://api.elitizon.com](https://api.elitizon.com)
- **Swagger Docs**: [https://api.elitizon.com/docs](https://api.elitizon.com/docs)

## 🔧 Management Commands

```bash
# View services
gcloud run services list --region=us-central1

# View logs
gcloud run services logs read saas-app-001-api --region=us-central1
gcloud run services logs read saas-app-001-web --region=us-central1

# Update service (after code changes)
./deploy-production.sh --app-only

# Infrastructure changes only (skip rebuilds)
./deploy-production.sh --infrastructure-only

# Connect to database
gcloud sql connect saas-app-001-db --user=saas_user
```

## 💰 Cost Management

Stay within the $15-25/month budget by keeping the default infrastructure profile and monitoring the bill each month.

### Cost Breakdown

| Service | Configuration | Approx Monthly | Notes |
|---------|---------------|----------------|-------|
| Cloud SQL | `db-f1-micro`, 10GB SSD | $7-9 | Includes automatic backups and 1GB RAM suitable for small workloads. |
| Cloud Run API | 1 vCPU / 512Mi, min 0, max 3 | $3-5 | Only billed on request time; defaults stay within free tier for light usage. |
| Cloud Run Web | 1 vCPU / 512Mi, min 0, max 5 | $2-4 | Static-heavy traffic benefits from CDN caching to stay low. |
| Artifact Registry & Cloud Build | 1GB storage, on-demand builds | $1-2 | Costs scale with image count and build frequency. |
| Networking & Logging | Managed SSL, Cloud Logging | $1-3 | Covers load balancing, certificate management, and log retention. |

**Total:** ~$15-25/month with <10k monthly visits and moderate API traffic.

### Ultra Cost Optimization Features

- Zero-minimum Cloud Run instances eliminate idle compute cost while still supporting burst scaling.
- Shared `db-f1-micro` Cloud SQL instance keeps database spend minimal without manual maintenance.
- Single region deployment reduces replication charges and keeps latency predictable for US users.
- Managed SSL certificates and Cloud Run domain mappings are free, avoiding third-party certificate spend.
- Temporary authorized networks prevent long-lived Cloud SQL IP allow lists that could incur VPN/VPC expenses.

### Cost Comparison

| Configuration | Monthly Cost | Best For |
|--------------|-------------|----------|
| **Ultra (Current)** | $15-25/month | Startups, MVPs, <10K users |
| Standard | $40-80/month | Growing SaaS, 10K-100K users |
| Enterprise | $100-300/month | Large scale, compliance needs |

### Performance Expectations

- Cold starts typically <2s; keep Stripe webhooks warm by hitting `/api/health` hourly if sub-second response times are required.
- Handles short bursts of ~50 requests/minute before autoscaling; increase `MAX_INSTANCES` if sustained throughput is needed.
- Cloud SQL micro tier supports thousands of row-level transactions per day; upgrade to `db-g1-small` once CPU exceeds 60% average.

### Cost Optimization Tips

- Enable a billing alert to track spend (optional):

   ```bash
   gcloud beta billing budgets create --billing-account=YOUR_ACCOUNT --display-name=saas-app-001-budget --budget-amount=25USD
   ```

- Schedule monthly log export cleanup or reduce log retention to 7 days to stay within the free tier.
- Avoid unnecessary background jobs; batch cron-style work to run from Cloud Run jobs instead of keeping services warm.
- Review Artifact Registry images quarterly and delete unused tags to avoid storage creep.
- If traffic spikes, scale vertically (larger instance) before increasing min instances to keep idle cost near zero.


## 🔒 Security & Compliance

✅ **Authentication**: Clerk integration with route protection  
✅ **Database**: Cloud SQL with SSL enforcement and curated authorized networks (temporary allowances auto-cleaned)  
✅ **SSL/TLS**: Automatic HTTPS for custom domains  
✅ **CORS**: Configured for your domains only  
✅ **Secrets**: Environment variables (not in code)  
✅ **Container Security**: Non-root users, health checks, multi-stage builds  
✅ **Network**: HTTPS-only, service account separation  
✅ **Monitoring**: Connection logging, backup retention

### Security Level: PRODUCTION-READY ✅

### Security Considerations


## 🚨 Troubleshooting

### Common issues

1. **"Authentication failed"**

   ```bash
   gcloud auth login
   gcloud config set project saas-app-001
   ```

2. **"Database connection failed"**

   - Check `deploy/.env` has correct secrets
   - Ensure your IP is allowed in `deploy/config.sh` (`AUTHORIZED_NETWORKS`) or rerun the script to add it automatically

3. **"Domain not working"**

   - DNS takes 15-60 minutes to propagate
   - Verify CNAME records point to `ghs.googlehosted.com`

4. **"Build failed"**

   ```bash
   # Clear Docker cache and rebuild
   docker system prune -a
   ./deploy-production.sh
   ```

5. **"Docker daemon is not running"**

   - Start Docker Desktop (or your preferred runtime) and re-run the script.
   - The script now checks this automatically before running builds.

### Get help

```bash
# Check deployment status
gcloud run services describe saas-app-001-api --region=us-central1
gcloud run services describe saas-app-001-web --region=us-central1

# View recent deployments
gcloud run revisions list --service=saas-app-001-api --region=us-central1
```

## 🔄 Updates & Maintenance

### Code updates

```bash
# After making code changes
./deploy-production.sh --app-only
```

### Adding environment variables

```bash
# Update deploy/.env
vim deploy/.env

# Redeploy services with new environment
./deploy-production.sh --app-only
```

### Database changes

```bash
# Add migration in packages/db/schema.ts
# Then run:
cd packages/db
bun run generate
bun run push
```

### Advanced CLI Flags

```bash
# Provision infrastructure only (no builds or deploys)
./deploy-production.sh --infrastructure-only

# Deploy application changes using existing infrastructure
./deploy-production.sh --app-only
```


Congratulations! Your SaaS application is now live in production! 🎊
