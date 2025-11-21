# Security Findings

Assessment date: 25 Sep 2025

## Methodology

- **Architecture review** of the monorepo structure, Docker topology, and deployment scripts.
- **Source inspection** of key security touch-points (`apps/api/src/index.ts`, `apps/web/middleware.ts`, `packages/db`).
- **Threat modeling** focused on authentication/authorization, data protection, and supply-chain exposure.

## Architecture & Infrastructure

| Area | Observation | Risk | Evidence |
| --- | --- | --- | --- |
| Docker defaults | Development `docker-compose.yml` ships with hard-coded `user/password` credentials and exposes PostgreSQL on `0.0.0.0:5432`. | Medium | `docker-compose.yml` (db service). |
| Secret management | Secrets are injected via `.env` without rotation guidance; deployment scripts expect `.env` checked in locally. | Medium | `README.md`, `deploy/config.sh`. |
| Cloud SQL config | `DB_REQUIRE_SSL` flag exists, but no enforcement in application; local `postgres` client will happily connect without TLS. | Medium | `deploy/config.sh`, `packages/db/index.ts`. |
| Deployment logging | GCP deployment scripts do not mask secrets when echoing environment variables. | Low | `deploy/deploy-production.sh` (not executed, but pattern observed). |

## Frontend (Next.js)

| Area | Observation | Risk | Evidence |
| --- | --- | --- | --- |
| Route protection | Middleware treats `/admin/(.*)` as a _public_ route, bypassing auth. Any unauthenticated user can reach admin pages. | **High** | `apps/web/middleware.ts`. |
| Exposed runtime values | `NEXT_PUBLIC_API_URL` points to API; if misconfigured, browsers may call internal admin routes directly. | Medium | `docker-compose.yml` (web service). |
| Client-side secrets | No leakage detected; Clerk publishable key usage is correct. | Low | `apps/web/app/layout.tsx` (reviewed). |

## Backend (Hono API)

| Area | Observation | Risk | Evidence |
| --- | --- | --- | --- |
| Admin authentication | `/api/admin/sync-orders` and `/api/admin/sync-stats` lack any auth checks (`// TODO` comment). | **Critical** | `apps/api/src/index.ts` (admin endpoints). |
| Public API authentication | Public endpoints like `/api/create-payment-intent` accept requests without API keys or auth, enabling automated abuse. | **High** | `apps/api/src/index.ts` (payment + provisional order routes). |
| Token verification | `clerkClient.verifyToken` used directly without `audience` or `clockSkew` controls; tokens accepted from any origin. | High | `apps/api/src/index.ts` (`/api/user/*` handlers). |
| CORS configuration | Default `allowedOrigins` is empty (blocking all), but when set it allows `allowHeaders: ['*']` and exposes admin endpoints to any JS origin on that list. | Medium | `apps/api/src/index.ts`. |
| Rate limiting | No rate limiting or abuse protection on public endpoints (payment intent creation, webhooks, etc.). | Medium | Entire `app`. |
| Replay protection | Requests lack nonce/timestamp validation or request signing, enabling traffic injection and replay of payment/order calls. | High | `apps/api/src/index.ts` (public POST handlers). |
| Input validation | Only Stripe webhooks rely on Stripe validation; other JSON payloads are manually parsed without Zod schemas. | Medium | `create-payment-intent`, `create-provisional-order`. |
| Secret logging | Startup logs print `DATABASE_URL`, Stripe webhook secret prefix, and other sensitive data. | **High** | `packages/db/index.ts`, `apps/api/src/index.ts` (webhook handler). |
| Error handling | Detailed error messages (e.g., token verification errors) logged with full stack, potentially leaking PII. | Medium | `/api/user/profile`, `/api/user/orders`. |

## Database Layer (Drizzle `packages/db`)

| Area | Observation | Risk | Evidence |
| --- | --- | --- | --- |
| Connection logging | Prints full `DATABASE_URL` including credentials on startup. | **High** | `packages/db/index.ts`. |
| Pool configuration | Graceful shutdown handled, but no query timeouts or max lifetime set—could be DoS vector under heavy load. | Medium | Same file. |
| Schema | Orders table stores customer PII (email, phone) without encryption at rest. Consider column-level encryption or tokenization. | Medium | `packages/db/schema.ts`. |

## Third-Party Integrations

| Area | Observation | Risk | Evidence |
| --- | --- | --- | --- |
| Stripe | Uses official SDK; webhook secrets logged partially. No retries or signature rotation management. | Medium | `apps/api/src/index.ts`. |
| Clerk | Frontend integration ok, but backend lacks RBAC checks (no admin role enforcement). | High | `apps/api/src/index.ts`, `apps/web/middleware.ts`. |
| Resend | API key passed to both web and api containers; ensure emails only originate server-side. | Medium | `docker-compose.yml`. |
| Sentry/Posthog | Instrumentation present; ensure DSNs loaded only server-side (currently yes). | Low | `docker-compose.yml`, `apps/web`. |

## Logging & Monitoring

- **PII in logs**: Order sync service logs full order payloads (IDs, status, timestamps). Combine with secret logging – high risk of leaking PII and credentials.
- **Missing audit trail**: No user action logging or admin audit events.
- **Unhandled errors**: Several catch blocks swallow errors and return generic messages without alerting (e.g., webhook failures).

## Secure Development Lifecycle

- **Dependency health**: No automated dependency scanning (Snyk, Dependabot) configured.
- **Testing**: Limited security-focused tests; only functional tests observed.
- **Infrastructure-as-Code**: Shell scripts manage GCP resources, but lack guardrails (no policy enforcement, no Terraform).

## Summary Heatmap

| Risk Level | Count | Key Themes |
| --- | --- | --- |
| Critical | 1 | Missing admin API authorization |
| High | 4 | Route protection, secret leakage, token validation, log hygiene |
| Medium | 12 | CORS, rate limiting, input validation, infrastructure defaults |
| Low | 4 | Deployment UX, monitoring gaps |

Address the critical/high issues immediately, then iterate through medium risks as part of hardening sprints.
