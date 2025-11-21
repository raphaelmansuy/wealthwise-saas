# Custom Domain Setup for SaaS Application

This document explains how to set up custom domains for your SaaS application deployed on Google Cloud Run while keeping your main domain DNS with your current provider.

## Overview

Your application will be available at:

- **Frontend**: <https://saas.elitizon.com>
- **API**: <https://api.elitizon.com>

**Important**: This approach keeps your main `elitizon.com` domain with your current DNS provider and only adds subdomains pointing to Google Cloud Run.

## Prerequisites

1. You own the domain `elitizon.com`
2. Access to your current DNS provider's management panel
3. Google Cloud project with billing enabled and `gcloud` CLI authenticated
4. `deploy/deploy-production.sh` configured with your custom domains (`ENABLE_CUSTOM_DOMAINS=true` in `deploy/config.sh`)

## Step-by-Step Setup

### 1. Deploy infrastructure with custom domains enabled

The production deployment script provisions (or reuses) Cloud Run domain mappings whenever `ENABLE_CUSTOM_DOMAINS=true` in `deploy/config.sh`.

```bash
cd deploy
./deploy-production.sh
```

This will:

- Ensure Cloud Run services exist
- Create or update domain mappings for `saas.elitizon.com` and `api.elitizon.com`
- Output DNS records that need to be added at your registrar (safe to copy on every run)

### 2. Add DNS records at your current DNS provider

After the script runs, add these CNAME records at your DNS provider:

**For saas.elitizon.com:**

- **Type**: CNAME
- **Name**: saas
- **Value**: ghs.googlehosted.com
- **TTL**: 300 (or your provider's default)

**For api.elitizon.com:**

- **Type**: CNAME
- **Name**: api  
- **Value**: ghs.googlehosted.com
- **TTL**: 300 (or your provider's default)

### 3. Wait for DNS Propagation

- DNS changes typically take 10-60 minutes to propagate
- You can check status with: `dig saas.elitizon.com` or `nslookup api.elitizon.com`

### 4. Verify SSL Certificates

Google will automatically provision SSL certificates after DNS verification. Check status:

```bash
# Check certificate status
gcloud compute ssl-certificates list
```

### 5. Update Clerk configuration

In your Clerk dashboard (<https://clerk.com>):

1. **Add Production Domains**:
   - Frontend: `https://saas.elitizon.com`
   - API: `https://api.elitizon.com`

2. **Update Environment Variables**:
   - Use the same publishable key: `pk_test_cm9idXN0LXJheS05NC5jbGVyay5hY2NvdW50cy5kZXYk`
   - Ensure the domain is allowed in Clerk's settings

3. **Update Redirect URLs**:
   - Sign-in URL: `https://saas.elitizon.com/sign-in`
   - Sign-up URL: `https://saas.elitizon.com/sign-up`
   - After sign-in: `https://saas.elitizon.com/dashboard`
   - After sign-up: `https://saas.elitizon.com/dashboard`

### 6. Redeploy when domains change

If you update domains or environment variables, redeploy the Cloud Run services to pick up the changes:

```bash
cd deploy
./deploy-production.sh --app-only
```

> **Tip:** Set `ENABLE_CUSTOM_DOMAINS=false` if you want to skip domain mapping creation during a deployment run (for example, when testing in a sandbox project).

## Environment Variables

### Production Environment Variables

The application will automatically use these domains when `ENVIRONMENT=prod`:

```env
NEXT_PUBLIC_API_URL=https://api.elitizon.com
CORS_ORIGINS=https://saas.elitizon.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cm9idXN0LXJheS05NC5jbGVyay5hY2NvdW50cy5kZXYk
```

### Development Environment Variables

For development, it will continue using Cloud Run URLs:

```env
NEXT_PUBLIC_API_URL=https://saas-app-dev-api-wszhkynzxa-uc.a.run.app
CORS_ORIGINS=https://saas-app-dev-web-wszhkynzxa-uc.a.run.app
```

## Deployment configuration

Custom domains are controlled through `deploy/config.sh`:

- `WEB_CUSTOM_DOMAIN="saas.elitizon.com"`
- `API_CUSTOM_DOMAIN="api.elitizon.com"`
- `ENABLE_CUSTOM_DOMAINS=true`

Any updates should be committed before rerunning the deployment script. Existing mappings are updated in place when values change.

### Troubleshooting

#### Domain Not Resolving

1. **Check DNS Propagation**:

   ```bash
   dig saas.elitizon.com
   nslookup api.elitizon.com
   ```

2. **Verify CNAME Records**:

   ```bash
   dig CNAME saas.elitizon.com
   dig CNAME api.elitizon.com
   ```

   Should return `ghs.googlehosted.com`

3. **Check Domain Mapping Status**:

   ```bash
   gcloud run domain-mappings list --region=us-central1
   ```

#### SSL Certificate Issues

1. **Check Certificate Status**:

   ```bash
   gcloud compute ssl-certificates list
   gcloud compute ssl-certificates describe saas-app-dev-web-ssl
   ```

2. **Common Issues**:
   - DNS CNAME records not properly configured
   - Domain verification failed (check CNAME values)
   - Certificate still provisioning (can take up to 60 minutes after DNS is verified)

#### Clerk Authentication Issues

1. **Domain Mismatch**: Ensure all domains are added to Clerk dashboard
2. **CORS Issues**: Check that API allows requests from frontend domain
3. **Environment Variables**: Verify all Clerk env vars are correctly set

#### Cloud Run Domain Mapping

1. **Check Domain Mapping Status**:

   ```bash
   gcloud run domain-mappings list --region=us-central1
   ```

2. **Verify Service URLs**:

   ```bash
   gcloud run services list --region=us-central1
   ```

## Security Considerations

1. **SSL/TLS**: Automatically handled by Google Cloud
2. **CORS**: Configure to only allow your frontend domain
3. **Authentication**: Ensure Clerk is properly configured for production
4. **Database**: Restrict access from specific IP ranges in production (see `AUTHORIZED_NETWORKS` in `deploy/config.sh`)

## Cost Implications

- **SSL Certificates**: Free with Google-managed certificates
- **Domain Mapping**: No additional cost
- **DNS**: No change (continues with your current provider)
- **Total Additional Cost**: $0/month for custom domains

## Monitoring

Set up monitoring for:

- SSL certificate expiration
- DNS resolution
- Domain mapping health
- Application availability at custom domains

## Backup Plan

Keep the original Cloud Run URLs as fallback:

- API: <https://saas-app-dev-api-wszhkynzxa-uc.a.run.app>
- Web: <https://saas-app-dev-web-wszhkynzxa-uc.a.run.app>

You can always switch back by updating environment variables.
