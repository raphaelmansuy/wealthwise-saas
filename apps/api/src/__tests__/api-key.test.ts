import { describe, it, expect, afterEach } from 'bun:test'
import crypto from 'crypto'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'

const API_SECRET = 'test-api-secret-1234567890abcdef1234567890abcdef1234567890abcdef1234'
const TIMESTAMP_WINDOW_MS = 300000

process.env.PUBLIC_API_KEYS ??= `primary:${API_SECRET}`
process.env.ALLOW_INSECURE_PUBLIC_API = 'false'
process.env.PUBLIC_API_TIMESTAMP_WINDOW_MS = `${TIMESTAMP_WINDOW_MS}`

const { requirePublicApiKey, __resetNonceStoreForTesting } = await import('../middleware/api-key')

interface ContextOptions {
  method?: string
  path?: string
  body?: Record<string, unknown> | string | null
  headers?: Record<string, string>
}

type TestContext = Context & { __store?: Map<string, unknown> }

const signHeaders = ({
  method,
  path,
  body,
  apiKey = API_SECRET,
  secret = API_SECRET,
  timestamp = new Date().toISOString(),
  nonce = crypto.randomUUID(),
}: {
  method: string
  path: string
  body?: Record<string, unknown> | string | null
  apiKey?: string
  secret?: string
  timestamp?: string
  nonce?: string
}) => {
  const bodyString = body
    ? typeof body === 'string'
      ? body
      : JSON.stringify(body)
    : ''

  const payload = [
    method.toUpperCase(),
    path,
    timestamp,
    nonce,
    bodyString,
  ].join('\n')

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  return {
    'x-api-key': apiKey,
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  }
}

const createContext = ({
  method = 'POST',
  path = '/api/create-payment-intent',
  body = { productId: 1 },
  headers = {},
}: ContextOptions = {}): { ctx: TestContext; store: Map<string, unknown> } => {
  const store = new Map<string, unknown>()
  const bodyString = body
    ? typeof body === 'string'
      ? body
      : JSON.stringify(body)
    : ''

  const requestHeaders: Record<string, string> = {
    ...(body != null ? { 'content-type': 'application/json' } : {}),
    ...headers,
  }

  const raw = new Request(`http://localhost${path}`, {
    method,
    headers: requestHeaders,
    body: method === 'GET' ? undefined : bodyString,
  })

  const ctx = {
    req: {
      raw,
      method,
      path,
      header: (name: string) => raw.headers.get(name) ?? null,
    },
    set: (key: string, value: unknown) => {
      store.set(key, value)
    },
    get: (key: string) => store.get(key),
  } as unknown as TestContext

  ctx.__store = store

  return { ctx, store }
}

afterEach(() => {
  __resetNonceStoreForTesting()
})

describe('requirePublicApiKey', () => {
  it('throws 401 when authentication headers are missing', async () => {
    const { ctx } = createContext({ headers: {} })

    await expect(requirePublicApiKey(ctx)).rejects.toMatchObject({ status: 401 })
  })

  it('throws 401 when API key is invalid', async () => {
    const method = 'POST'
    const path = '/api/create-payment-intent'
    const body = { productId: 2 }
    const headers = signHeaders({ method, path, body, apiKey: 'invalid-key', secret: 'invalid-key' })
    const { ctx } = createContext({ method, path, body, headers })

    await expect(requirePublicApiKey(ctx)).rejects.toMatchObject({ status: 401 })
  })

  it('throws 401 when timestamp is outside the allowed window', async () => {
    const method = 'POST'
    const path = '/api/create-payment-intent'
    const body = { productId: 3 }
    const staleTimestamp = new Date(Date.now() - TIMESTAMP_WINDOW_MS - 1000).toISOString()
    const headers = signHeaders({ method, path, body, timestamp: staleTimestamp })
    const { ctx } = createContext({ method, path, body, headers })

    await expect(requirePublicApiKey(ctx)).rejects.toMatchObject({ status: 401 })
  })

  it('throws 409 when nonce is replayed', async () => {
    const method = 'POST'
    const path = '/api/create-payment-intent'
    const body = { productId: 4 }
    const nonce = crypto.randomUUID()
    const headers = signHeaders({ method, path, body, nonce })

    const first = createContext({ method, path, body, headers })
    const second = createContext({ method, path, body, headers })

    await expect(requirePublicApiKey(first.ctx)).resolves.toBeUndefined()
    await expect(requirePublicApiKey(second.ctx)).rejects.toMatchObject({ status: 409 })
  })

  it('allows valid signed requests and stores the API key label', async () => {
    const method = 'POST'
    const path = '/api/create-payment-intent'
    const body = { productId: 5 }
    const headers = signHeaders({ method, path, body })
    const { ctx, store } = createContext({ method, path, body, headers })

    await expect(requirePublicApiKey(ctx)).resolves.toBeUndefined()
    expect(store.get('apiKeyLabel')).toBe('primary')
  })
})
