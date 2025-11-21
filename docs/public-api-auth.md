# Public API Authentication Guide

All unauthenticated payment/order endpoints now require signed requests protected by an API key, timestamp, nonce, and HMAC signature. This document explains how to configure keys and sign requests from trusted clients or backend services.

## 1. Configure Environment Variables

Set the following variables in your environment (see `.env.example` and `deploy/.env.example` for reference):

```env
PUBLIC_API_KEYS="primary:your-64-char-secret-key"
PUBLIC_API_TIMESTAMP_WINDOW_MS=300000
ALLOW_INSECURE_PUBLIC_API=false
```

- `PUBLIC_API_KEYS` accepts a comma-separated list of `label:key` pairs. The **key** is the shared secret used to sign requests.
- `PUBLIC_API_TIMESTAMP_WINDOW_MS` controls the allowed drift between the caller clock and the API server. The default is 5 minutes (300000 ms).
- `ALLOW_INSECURE_PUBLIC_API` should remain `false` outside of isolated development environments.

> **Rotation tip:** Maintain two labels (for example `primary` and `secondary`) to support zero-downtime key rotation. Deploy the new key with a second label, roll clients over to the new key, and then remove the old one.

## 2. Construct the Signature

Each request must include these headers:

| Header | Purpose |
| --- | --- |
| `x-api-key` | One of the key secrets configured in `PUBLIC_API_KEYS` |
| `x-timestamp` | ISO 8601 timestamp representing when the request was signed |
| `x-nonce` | Unique identifier per request (UUID recommended). Prevents replay. |
| `x-signature` | Lowercase hex HMAC-SHA256 signature. |

The signature payload is built by joining the uppercase method, the request path (no domain/query string), the timestamp, the nonce, and the raw request body with newline characters:

```text
METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY
```

Compute the HMAC using the API secret as the key and SHA-256 as the digest, then encode the result as lowercase hex.

### TypeScript example

```ts
import crypto from 'crypto'

interface SignedRequestHeaders {
  'x-api-key': string
  'x-timestamp': string
  'x-nonce': string
  'x-signature': string
}

export const signRequest = (options: {
  apiKey: string
  secret: string
  method: string
  path: string
  body?: unknown
}): SignedRequestHeaders => {
  const timestamp = new Date().toISOString()
  const nonce = crypto.randomUUID()
  const bodyString = options.body ? JSON.stringify(options.body) : ''
  const payload = [
    options.method.toUpperCase(),
    options.path,
    timestamp,
    nonce,
    bodyString,
  ].join('\n')

  const signature = crypto
    .createHmac('sha256', options.secret)
    .update(payload)
    .digest('hex')

  return {
    'x-api-key': options.apiKey,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  }
}
```

### Fetching a payment intent

```ts
const headers = signRequest({
  apiKey: process.env.PUBLIC_API_KEY!,
  secret: process.env.PUBLIC_API_SECRET!,
  method: 'POST',
  path: '/api/create-payment-intent',
  body: { productId: 1, quantity: 2 },
})

const response = await fetch('https://api.example.com/api/create-payment-intent', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  body: JSON.stringify({ productId: 1, quantity: 2 }),
})
```

If any header is missing, invalid, or reused, the API returns:

- `401 Unauthorized` for missing/invalid key, signature, or stale timestamp.
- `409 Conflict` when a nonce is replayed within the freshness window.

## 3. Replay Protection

The API keeps a per-key nonce cache for the duration of the freshness window to reject replayed requests. In production, you should back this cache with Redis or Postgres to support multiple API instances—track follow-up in the Priority 0 remediation plan.

## 4. Using the Next.js proxy (recommended for browsers)

The Next.js web app exposes a server-side proxy at `/api/public/*`. Browser code should call these routes instead of hitting `https://api.yourdomain.com` directly. The proxy injects the required signing headers with the server-only `PUBLIC_API_KEY_SECRET` value and forwards the response.

Example:

```ts
// Client-side call inside the web app
await fetch('/api/public/create-payment-intent', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ productId: 1, quantity: 2 }),
})
```

The proxy only allows payment endpoints (`create-payment-intent`, `create-provisional-order`, `orders`, `invoices`). Keep the secret out of `NEXT_PUBLIC_*` variables and rotate it alongside the API key entries.

### Local development setup

- Add matching secrets to `.env` (or `.env.local`) at the repo root:
  - `PUBLIC_API_KEYS="primary:your-local-secret"`
  - `PUBLIC_API_KEY_SECRET="your-local-secret"`
- When running inside Docker, set `INTERNAL_API_URL="http://api:8080"` so the Next.js proxy can reach the API service. For local host-only runs, keep it pointed at `http://localhost:3001`.
- When using Docker (`docker-compose up`), the environment values are forwarded automatically to both `api` and `web` services.
- For `bun run dev`/`turbo dev`, export the same variables in your shell or load them via a local `.env` file before starting the processes.
- Leave `ALLOW_INSECURE_PUBLIC_API` set to `false` so that local traffic exercises the signed-request path.

## 5. Client Integration Checklist

- [ ] Store API secrets in a secure server-side location (never in the browser).
- [ ] Ensure system time is in sync (NTP) to avoid timestamp drift.
- [ ] Generate nonces with RFC 4122 UUIDs or comparable entropy.
- [ ] Log request IDs and nonces for traceability (omit secrets from logs).
- [ ] Implement key rotation playbooks and revoke old keys promptly.

For additional details, see `specs/audit-app-sec/03_priority0_plan.md`.
