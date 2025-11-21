#!/bin/bash
# Stripe Webhook Setup Script for Production
# This script helps you configure Stripe webhooks for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo -e "${CYAN}"
echo "🔧 Stripe Webhook Setup for Production"
echo "======================================="
echo -e "${NC}"

# Configuration
API_DOMAIN="api.elitizon.com"
WEBHOOK_URL="https://${API_DOMAIN}/api/webhooks"

log_info "Production webhook URL: $WEBHOOK_URL"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    log_error "Stripe CLI is not installed."
    echo ""
    echo "Please install it:"
    echo "  macOS: brew install stripe/stripe-cli/stripe"
    echo "  Other: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if logged in to Stripe
if ! stripe config --list &> /dev/null; then
    log_error "Please login to Stripe CLI first:"
    echo "  stripe login"
    exit 1
fi

# Check if .env file exists
if [ ! -f "deploy/.env" ]; then
    log_warning "deploy/.env file not found."
    log_info "Please create deploy/.env from deploy/.env.example first"
    exit 1
fi

echo "🎯 Next steps to configure your webhook:"
echo ""
echo "1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks"
echo "2. Click 'Add endpoint'"
echo "3. Enter endpoint URL: $WEBHOOK_URL"
echo "4. Select these events:"
echo "   - payment_intent.succeeded"
echo "   - payment_intent.payment_failed"
echo "5. Click 'Add endpoint'"
echo "6. Copy the webhook signing secret (starts with whsec_)"
echo "7. Add it to deploy/.env:"
echo '   STRIPE_WEBHOOK_SECRET="whsec_your_actual_secret"'
echo "8. Redeploy: ./deploy-production.sh --app-only"
echo ""

# Offer to create webhook programmatically
read -p "🤖 Would you like to create the webhook automatically? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Creating webhook endpoint programmatically..."
    
    # Create webhook using Stripe CLI
    WEBHOOK_OUTPUT=$(stripe webhooks create \
        --url="$WEBHOOK_URL" \
        --enabled-events="payment_intent.succeeded,payment_intent.payment_failed" \
        --description="Production webhook for SaaS app" 2>&1)
    
    if [ $? -eq 0 ]; then
        log_success "Webhook endpoint created successfully!"
        
        # Extract webhook ID and show next steps
        WEBHOOK_ID=$(echo "$WEBHOOK_OUTPUT" | grep -o 'we_[a-zA-Z0-9]*' | head -1)
        
        if [ -n "$WEBHOOK_ID" ]; then
            log_info "Webhook ID: $WEBHOOK_ID"
            echo ""
            log_info "Now get the webhook secret:"
            echo "  stripe webhooks retrieve $WEBHOOK_ID --format=json | jq -r .secret"
            echo ""
            log_info "Or view in dashboard:"
            echo "  https://dashboard.stripe.com/webhooks/$WEBHOOK_ID"
        fi
    else
        log_error "Failed to create webhook automatically:"
        echo "$WEBHOOK_OUTPUT"
        echo ""
        log_info "Please create the webhook manually using the steps above."
    fi
else
    log_info "Please follow the manual steps above to create your webhook."
fi

echo ""
echo "📋 After configuring the webhook:"
echo "1. Test it: stripe trigger payment_intent.succeeded"
echo "2. Check logs: gcloud run services logs read saas-app-api --region=us-central1"
echo "3. Verify order creation in your application"
echo ""
log_success "Webhook setup guide completed!"