# Priority 0 – Immediate Remediation Plan

Assessment date: 25 Sep 2025
Scope: Deliverable execution blueprint for tasks P0-1 through P0-4 within three days.

---

## P0-1 · Enforce Clerk admin auth on `/api/admin/*` (apps/api/src/index.ts)

**Objective:** Guard administrative API endpoints with Clerk authentication and role authorization.

- [x] **Recon:** Catalogue every admin endpoint (`/api/admin/sync-orders`, `/api/admin/sync-stats`, future `/api/admin/**`).
- [x] **Helper module:** Create `apps/api/src/middleware/admin-auth.ts` exporting `requireAdmin(ctx)` that:
  - [x] Extracts and validates the `Authorization` header, failing with 401 if missing/malformed.
  - [x] Uses `clerkClient.verifyToken(token, tokenVerificationOptions)` with explicit audience/authorized party/clock skew settings.
  - [x] Fetches the Clerk user record and asserts `publicMetadata.role === 'admin'` or `publicMetadata.isAdmin === true`; respond 403 otherwise.
  - [x] Maps errors (expired token ⇒ 401, verification failure ⇒ 401, missing admin role ⇒ 403) and ensures redacted logging.
- [x] **Route integration:** Wrap every `/api/admin/*` handler with `await requireAdmin(c)` before business logic.
- [x] **Schema update:** Mark these routes as `bearerAuth` + “Admin only” in the OpenAPI definition.
- [x] **Testing:** Add Bun/Jest tests (`apps/api/src/__tests__/admin-auth.test.ts`) covering missing token, non-admin token, valid admin token.
- [x] **Docs:** Document required Clerk metadata (role/isAdmin) in the security README or onboarding runbook.

## P0-2 · Lock down `/admin` pages in Next.js (apps/web)

**Objective:** Ensure only authenticated admins can access the admin interface, with graceful redirects for others.

- [x] Adjust `isPublicRoute` in `middleware.ts` to exclude `/admin/(.*)` from the public list.
- [x] Introduce `const isAdminRoute = createRouteMatcher(['/admin(.*)'])` and:
  - [x] Call `auth()` and enforce protection for admin routes.
  - [x] Fetch the current user/session and redirect non-admins to `/dashboard?error=forbidden`.
- [x] Convert the admin root (`app/admin/layout.tsx`) to apply a server-side guard that redirects unauthorized users before hydration.
- [x] Keep client-side “Access Restricted” UI for defense in depth (but rely on server redirect).
- [x] Verify `_next` assets remain excluded via `config.matcher`.
- [ ] Testing:
  - [ ] Write middleware tests (Playwright/Cypress/Next test utilities) for unauthenticated ⇒ redirect, authenticated non-admin ⇒ redirect, admin ⇒ success.
- [x] Update docs describing how to grant admin roles via Clerk metadata.

## P0-3 · Remove sensitive secret logging (packages/db, apps/api)

**Objective:** Eliminate leakage of secrets, tokens, and PII from logs.

- [x] Audit logging statements:
  - [x] `packages/db/index.ts` prints full `DATABASE_URL` and resolved host.
  - [x] `apps/api/src/index.ts` logs Stripe webhook secret prefixes and raw headers.
  - [x] Startup banners emitting environment details.
- [x] Replace with a shared redaction helper (e.g., `maskIdentifier`) or remove entirely.
- [x] Ensure Stripe webhook handler logs only event type + success/failure booleans.
- [ ] Add ESLint rule or custom lint check preventing `console.log(process.env.*)` usage.
- [ ] Scan deployment scripts (`deploy/`, `scripts/`) for `echo`/`printf` of secrets and sanitize as needed.
- [ ] Validate logs during local run to confirm no sensitive data appears.
- [x] Communicate new logging policy in contributing/security docs.

## P0-4 · Require signed API keys on public payment endpoints (apps/api)

**Objective:** Authenticate and authorize callers for public POST/GET endpoints handling payments/orders.

- [x] Inventory unauthenticated endpoints (`/api/create-payment-intent`, `/api/create-provisional-order`, `/api/orders/:paymentIntentId`, `/api/invoices/:paymentIntentId`, etc.).
- [x] Decide credential approach:
  - [x] Introduce `PUBLIC_API_KEYS` env var storing hashed keys.
  - [ ] Leverage Clerk service tokens for first-party services.
- [x] Implement middleware `apps/api/src/middleware/api-key.ts` that:
  - [x] Validates required headers (`x-api-key`, `x-timestamp`, `x-nonce`).
  - [x] Performs constant-time comparison against stored hashed keys.
  - [x] Enforces timestamp freshness (±5 minutes).
  - [ ] Records nonce usage in Redis or Postgres with TTL to block replays. _(Currently using in-memory TTL store; follow-up needed for multi-instance deployments.)_
- [x] Apply middleware to each public endpoint before route logic.
- [x] Skip middleware for Stripe webhooks (continue using Stripe signature verification) but retain replay safeguards.
- [x] Update OpenAPI spec documenting the API key scheme and required headers.
- [x] Testing matrix (`apps/api/src/__tests__/api-key.test.ts`):
  - [x] Missing key ⇒ 401.
  - [x] Invalid key ⇒ 401.
  - [x] Stale timestamp/duplicate nonce ⇒ 409 (or chosen error code).
  - [x] Valid signed request ⇒ 200.
- [x] Update `.env.example`, deployment docs, and client integrations to include the new headers and rotation guidance (`docs/public-api-auth.md`).
- [x] Add Next.js server-side proxy (`apps/web/app/api/public/[...path]/route.ts`) to sign browser-originating requests without exposing secrets.

---

**Tracking:** Log each checklist item in Jira Epic “AppSec Hardening Q4 2025 – Priority 0” and review status daily during the remediation window.
