# Clerk.com Configuration Guide for SaaS Stack

This guide explains how to configure Clerk.com authentication for your SaaS application running on Google Cloud Run with custom domains.

## Overview

Your SaaS application uses:
- **Frontend**: https://saas.elitizon.com (Next.js)
- **API**: https://api.elitizon.com (Hono.js)
- **Authentication**: Clerk.com

## Prerequisites

- Clerk.com account
- Custom domains configured and working (saas.elitizon.com, api.elitizon.com)
- Application deployed on Google Cloud Run

## Step 1: Create/Access Your Clerk Application

### Option A: Create New Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **"Create Application"**
3. Choose your application name (e.g., "Elitizon SaaS")
4. Select authentication methods:
   - ✅ Email/Password
   - ✅ Google OAuth (recommended)
   - ✅ GitHub OAuth (optional)
   - ✅ Magic Links (recommended)

### Option B: Use Existing Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your existing application
3. Navigate to **Settings**

## Step 2: Configure Domain Settings

### 2.1 Add Production Domain

1. In Clerk Dashboard, go to **Settings** → **Domains**
2. Add your production domain:
   - **Domain**: `saas.elitizon.com`
   - **Environment**: Production
3. Click **"Add Domain"**

### 2.2 Configure Allowed Origins

1. Go to **Settings** → **API Keys**
2. Under **"Allowed Origins"**, add:
   - `https://saas.elitizon.com`
   - `https://api.elitizon.com`
   - `http://localhost:3000` (for development)

## Step 3: Configure Authentication URLs

### 3.1 Sign-in/Sign-up URLs

1. Go to **Settings** → **Paths**
2. Configure the following paths:

**Sign-in Page:**
- **Path**: `/sign-in`
- **URL**: `https://saas.elitizon.com/sign-in`

**Sign-up Page:**
- **Path**: `/sign-up`
- **URL**: `https://saas.elitizon.com/sign-up`

### 3.2 Redirect URLs

Configure post-authentication redirects:

**After Sign-in:**
- **URL**: `https://saas.elitizon.com/dashboard`

**After Sign-up:**
- **URL**: `https://saas.elitizon.com/dashboard`

**After Sign-out:**
- **URL**: `https://saas.elitizon.com/`

## Step 4: Get API Keys

### 4.1 Publishable Key

1. Go to **API Keys** section
2. Copy the **Publishable Key** (starts with `pk_live_` or `pk_test_`)
3. This will be used as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### 4.2 Secret Key

1. In the same section, copy the **Secret Key** (starts with `sk_live_` or `sk_test_`)
2. This will be used as `CLERK_SECRET_KEY`

## Step 5: Update Environment Variables

### 5.1 Web Application Environment Variables

Update your Cloud Run web service with these environment variables:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
CLERK_SECRET_KEY=sk_live_your_secret_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# API Configuration
NEXT_PUBLIC_API_URL=https://api.elitizon.com
```

### 5.2 API Application Environment Variables

Update your Cloud Run API service:

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_live_your_secret_key_here

# CORS Configuration
CORS_ORIGINS=https://saas.elitizon.com
```

## Step 6: Deploy Updated Environment Variables

### 6.1 Using Deployment Script

```bash
# Update the deployment script with your production keys
cd /path/to/your/project

# Deploy web service with new environment variables
ENVIRONMENT=prod ./deploy/scripts/deploy-services.sh --web-only

# Deploy API service with new environment variables  
ENVIRONMENT=prod ./deploy/scripts/deploy-services.sh --api-only
```

### 6.2 Manual gcloud Commands

```bash
# Update web service
gcloud run services update saas-app-dev-web \
  --region=us-central1 \
  --set-env-vars="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key" \
  --set-env-vars="CLERK_SECRET_KEY=sk_live_your_secret_key"

# Update API service
gcloud run services update saas-app-dev-api \
  --region=us-central1 \
  --set-env-vars="CLERK_SECRET_KEY=sk_live_your_secret_key" \
  --set-env-vars="CORS_ORIGINS=https://saas.elitizon.com"
```

## Step 7: Configure Social Providers (Optional)

### 7.1 Google OAuth

1. Go to **Settings** → **Social Providers**
2. Enable **Google**
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Configure authorized redirect URIs in Google Console:
   - `https://saas.elitizon.com/api/auth/callback/google`

### 7.2 GitHub OAuth

1. Enable **GitHub** in Social Providers
2. Add GitHub OAuth App credentials
3. Set Authorization callback URL:
   - `https://saas.elitizon.com/api/auth/callback/github`

## Step 8: Configure Webhooks (Optional)

### 8.1 User Sync Webhooks

1. Go to **Settings** → **Webhooks**
2. Create new webhook endpoint:
   - **URL**: `https://api.elitizon.com/webhooks/clerk`
   - **Events**: Select relevant events (user.created, user.updated, etc.)

### 8.2 Implement Webhook Handler

Add webhook handling in your API:

```typescript
// apps/api/src/routes/webhooks.ts
app.post('/webhooks/clerk', async (c) => {
  const body = await c.req.json()
  const eventType = c.req.header('clerk-event-type')
  
  switch (eventType) {
    case 'user.created':
      // Handle new user creation
      break
    case 'user.updated':
      // Handle user updates
      break
  }
  
  return c.json({ received: true })
})
```

## Step 9: Test Authentication Flow

### 9.1 Test Sign-up

1. Go to `https://saas.elitizon.com`
2. Click **"Sign Up"** or **"Create Account"**
3. Complete the registration process
4. Verify redirect to dashboard

### 9.2 Test Sign-in

1. Go to `https://saas.elitizon.com/sign-in`
2. Sign in with existing credentials
3. Verify redirect to dashboard

### 9.3 Test Protected Routes

1. Try accessing `https://saas.elitizon.com/dashboard` without authentication
2. Should redirect to sign-in page
3. After authentication, should access dashboard successfully

## Step 10: Security Best Practices

### 10.1 Environment-Specific Keys

- **Development**: Use `pk_test_` and `sk_test_` keys
- **Production**: Use `pk_live_` and `sk_live_` keys
- **Never commit secret keys to version control**

### 10.2 CORS Configuration

Ensure your API only accepts requests from your frontend domain:

```typescript
// In your API configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || []
app.use('*', cors({
  origin: corsOrigins,
  credentials: true
}))
```

### 10.3 Secure Headers

Configure security headers in your Next.js application:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Troubleshooting

### Common Issues

1. **"Invalid publishable key"**
   - Verify you're using the correct environment key (test/live)
   - Check the domain matches Clerk configuration

2. **CORS errors**
   - Ensure your domain is added to Clerk's allowed origins
   - Verify API CORS configuration includes your frontend domain

3. **Redirect loops**
   - Check that redirect URLs in Clerk match your application routes
   - Verify middleware configuration

4. **Authentication not persisting**
   - Ensure cookies are properly configured
   - Check that your domain supports secure cookies (HTTPS)

### Debug Commands

```bash
# Check current environment variables
gcloud run services describe saas-app-dev-web --region=us-central1 --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"

# Check service logs
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="saas-app-dev-web"' --limit=50

# Test API connectivity
curl -X GET https://api.elitizon.com/health
```

## Production Checklist

- [ ] Production Clerk application created
- [ ] Custom domain added to Clerk (`saas.elitizon.com`)
- [ ] Allowed origins configured
- [ ] Sign-in/sign-up URLs configured
- [ ] Redirect URLs configured
- [ ] Production API keys obtained
- [ ] Environment variables updated in Cloud Run
- [ ] Services redeployed with new environment variables
- [ ] Authentication flow tested
- [ ] Social providers configured (if needed)
- [ ] Webhooks configured (if needed)
- [ ] Security headers implemented
- [ ] CORS properly configured

## Support Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Node.js SDK](https://clerk.com/docs/references/nodejs/overview)
- [Clerk Community Discord](https://discord.com/invite/b5rXHjAg7A)

---

**Note**: Replace all placeholder values (`your_key_here`, etc.) with your actual Clerk API keys and configuration values.