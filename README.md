# SaaS Starter Kit

A production-ready SaaS starter kit with authentication, payments, and modern UI components. Built with Next.js 14, Hono.js, PostgreSQL, and Stripe.

## 🚀 Quick Start

### Local Development (Docker)

```bash
# Clone and setup
git clone <your-repo>
cd modern_saas_template
cp .env.example .env

# Start all services with hot reloading
docker-compose up --build

# Access your app
# Frontend: http://localhost:8080
# API: http://localhost:3001
# Database: localhost:5432
```

### Cloud Deployment (Google Cloud)

```bash
# 1. Configure deployment
cd deploy
cp .env.example .env
# Fill in required secrets and project settings

# 2. Run the deployment script (provisions infra + deploys services)
./deploy-production.sh
```

### Alternative Local Development

```bash
# Requires local PostgreSQL
bun install
bun run dev
```

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Zustand
- **Backend**: Hono.js API with OpenAPI/Swagger docs
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Clerk authentication
- **Payments**: Stripe with webhooks
- **Email**: Resend
- **Monitoring**: Sentry
- **Analytics**: PostHog
- **Deployment**: Google Cloud (gcloud CLI + Docker) / Vercel
- **Runtime**: Bun
- **Monorepo**: Turbo

## 📁 Project Structure

```text
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Hono.js backend
├── packages/
│   ├── db/           # Database schema & queries
│   ├── ui/           # Shared UI components
│   └── auth/         # Auth utilities
├── deploy/           # Docker deployment automation
└── docker/           # Docker configuration
```

## 🔧 Key Features

### Authentication & User Management

- Clerk-powered authentication
- Protected routes and middleware
- User profiles and account management
- Admin dashboard access

### Payment Processing

- Full Stripe integration
- Payment intents and webhooks
- Order management with sync capabilities
- Invoice and receipt generation

### Database & API

- Type-safe PostgreSQL queries with Drizzle
- RESTful API with comprehensive endpoints
- OpenAPI/Swagger documentation
- Provisional order handling

### Developer Experience

- Docker-first development
- Hot reloading across all services
- TypeScript throughout
- ESLint and Prettier configured

## 🛠️ Development Commands

```bash
# Development
bun run dev:docker          # Start Docker development
bun run dev:local           # Start local development

# Database
bun run db:push             # Push schema changes
bun run db:studio           # Open Drizzle Studio
bun run db:seed             # Seed database

# Docker management
bun run docker:up           # Start services
bun run docker:down         # Stop services
bun run docker:logs         # View logs

# Utilities
bun run lint                # Run linting
bun run build               # Production build
```

## 🔐 Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@db:5432/saas_db"

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# Monitoring (Sentry)
SENTRY_DSN="https://..."

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
```

## 📚 API Documentation

- **Swagger UI**: `http://localhost:3001/docs`
- **OpenAPI Spec**: `http://localhost:3001/doc`

## 🚀 Deployment

### Google Cloud (Single Environment)

Complete infrastructure and application deployment:

```bash
# Configure deployment variables and secrets
cd deploy
cp .env.example .env
# Fill in secrets and adjust config.sh if needed

# Provision infrastructure and deploy services (single environment)
./deploy-production.sh
```

Features:

- 🏗️ Infrastructure provisioning via Google Cloud CLI scripts
- 🐳 Containerized deployment (Docker)
- 🗄️ Automated Cloud SQL creation and migrations
- 📊 Monitoring and logging hooks
- 💰 Cost-optimized ($15-25/month)

See [deploy/PRODUCTION-GUIDE.md](deploy/PRODUCTION-GUIDE.md) for detailed instructions on the dev environment deployment.

### Vercel (Alternative)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Manual Deployment

```bash
bun run build
bun run start
```

## 📖 Available Routes

- `/` - Landing page
- `/dashboard` - User dashboard
- `/profile` - User profile management
- `/products` - Product catalog
- `/admin` - Admin dashboard
- `/admin/order-sync` - Order synchronization
- `/sign-in`, `/sign-up` - Authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
