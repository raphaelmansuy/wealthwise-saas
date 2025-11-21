# Remediation Roadmap

Assessment date: 25 Sep 2025
Owners are suggested based on existing team structure—adjust as needed.

## Priority 0 – Immediate (0-3 days)

| ID | Task | Owner | Effort | Impact | Notes |
| --- | --- | --- | --- | --- | --- |
| P0-1 | Enforce Clerk auth + role check on `/api/admin/sync-orders` and `/api/admin/sync-stats`. | Backend | S | Blocker | Reuse Clerk org/role metadata or dedicated `isAdmin` flag. |
| P0-2 | Update `apps/web/middleware.ts` so `/admin/**` is protected; add admin-only guard in UI. | Frontend | S | Blocker | Create admin route matcher and fallback redirect. |
| P0-3 | Remove sensitive secret logging (`DATABASE_URL`, Stripe webhook prefix). | Backend | S | High | Replace with redacted logging helper. |
| P0-4 | Require signed API keys or user auth on public payment/order endpoints. | Backend | M | High | ✅ HMAC-signed keys (`requirePublicApiKey`) with nonce/timestamp checks, Next.js proxy at `/api/public/*`, and docs at `docs/public-api-auth.md`. Follow-up: persist nonce store for multi-instance deployments. |

## Priority 1 – Near Term (1-2 weeks)

| ID | Task | Owner | Effort | Impact | Notes |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Implement centralized logging policy: scrub PII and secrets, set log levels per route. | Platform | M | High | Add logger wrapper w/ sensitive field filters. |
| P1-2 | Introduce API rate limiting (IP + token) for public endpoints and Stripe webhook retries. | Backend | M | High | Consider Hono middleware + Redis. |
| P1-3 | Harden CORS: explicit allow-list per env, restrict headers/methods, add preflight caching. | Backend | S | Medium | Dynamic allow-list resolver shipped; still add preflight caching + lint to catch missing origins. |
| P1-4 | Validate request payloads with Zod (`zValidator`) for all POST/PUT routes. | Backend | M | Medium | Prevent mass assignment & type confusion. |
| P1-5 | Configure Dependabot/Snyk for all `package.json` manifests. | Platform | S | Medium | Automate dependency updates. |
| P1-6 | Add anti-replay middleware (HMAC signatures, nonce store, timestamp window) to public APIs. | Backend | M | High | ✅ Covered by API key middleware (timestamp window + nonce TTL). Follow-up: externalize nonce cache (Redis/Postgres) and enforce HTTPS in prod. |

## Priority 2 – Mid Term (2-4 weeks)

| ID | Task | Owner | Effort | Impact | Notes |
| --- | --- | --- | --- | --- | --- |
| P2-1 | Enforce TLS for DB connections in code (`sslmode=require`, reject self-signed in prod). | Platform | M | High | Align with `DB_REQUIRE_SSL` flag. |
| P2-2 | Migrate deployment scripts to infrastructure-as-code (Terraform or Pulumi). | DevOps | L | Medium | Enables policy enforcement and audit trails. |
| P2-3 | Add automated security tests (OWASP Zap/Burp pipeline, unit tests for auth boundaries). | QA | M | Medium | Integrate into CI. |
| P2-4 | Encrypt sensitive columns (customer email/phone) or use tokenization. | Backend | L | Medium | Evaluate KMS or Vault. |
| P2-5 | Build admin activity logging and alerting (Sentry/SIEM). | Platform | M | Medium | Support incident response. |

## Priority 3 – Long Term (4-8 weeks)

| ID | Task | Owner | Effort | Impact | Notes |
| --- | --- | --- | --- | --- | --- |
| P3-1 | Implement feature-level authorization service (RBAC/ABAC) across frontend + API. | Security | L | High | Scales with future roles. |
| P3-2 | Adopt secret management service (Google Secret Manager) with rotation schedule. | DevOps | M | High | Avoid `.env` distribution. |
| P3-3 | Introduce DAST/SAST tooling (CodeQL, Semgrep) in CI. | Security | M | Medium | Continuous detection. |
| P3-4 | Conduct formal penetration test post-remediation. | Security | M | Medium | External validation. |

## Quick Wins & Guardrails

- Document clear **runbooks** for Stripe webhook retries and failure handling.
- Add a **security checklist** to PR templates (auth, input validation, logging).
- Mandate **code review from security champion** on anything touching auth or payments.

## Tracking & Reporting

- Create a Jira epic “AppSec Hardening Q4 2025” with subtasks for each item.
- Review progress weekly in engineering syncs; escalate blockers to CTO.
- After Priority 0 & 1 completion, rerun this audit to update risk posture.
