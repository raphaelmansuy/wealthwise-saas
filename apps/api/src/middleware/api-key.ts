import crypto from 'crypto'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

const API_KEY_HEADER = 'x-api-key'
const TIMESTAMP_HEADER = 'x-timestamp'
const NONCE_HEADER = 'x-nonce'
const SIGNATURE_HEADER = 'x-signature'

const DEFAULT_WINDOW_MS = parseInt(process.env.PUBLIC_API_TIMESTAMP_WINDOW_MS || '', 10) || 5 * 60 * 1000
const allowInsecure = process.env.ALLOW_INSECURE_PUBLIC_API === 'true'

interface ApiKeyRecord {
  label: string
  rawKey: string
  hash: Buffer
}

const parseApiKeys = (): ApiKeyRecord[] => {
  const raw = process.env.PUBLIC_API_KEYS
  if (!raw) return []

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [label, key] = entry.includes(':') ? entry.split(':', 2) : ['default', entry]
      const rawKey = key.trim()
      if (!rawKey) {
        throw new Error('PUBLIC_API_KEYS contains an empty key entry')
      }
      return {
        label: label.trim() || 'default',
        rawKey,
        hash: crypto.createHash('sha256').update(rawKey).digest(),
      }
    })
}

const configuredKeys = parseApiKeys()

if (!allowInsecure && configuredKeys.length === 0) {
  console.warn('PUBLIC_API_KEYS not configured; public API endpoints will reject requests')
}

class NonceStore {
  private readonly ttlMs: number
  private readonly store = new Map<string, number>()

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs
  }

  private key(record: ApiKeyRecord, nonce: string) {
    return `${record.label}:${nonce}`
  }

  mark(record: ApiKeyRecord, nonce: string, timestampMs: number) {
    this.cleanup()
    this.store.set(this.key(record, nonce), timestampMs)
  }

  has(record: ApiKeyRecord, nonce: string): boolean {
    this.cleanup()
    return this.store.has(this.key(record, nonce))
  }

  reset() {
    this.store.clear()
  }

  private cleanup() {
    const threshold = Date.now() - this.ttlMs
    for (const [key, value] of this.store.entries()) {
      if (value < threshold) {
        this.store.delete(key)
      }
    }
  }
}

const nonceStore = new NonceStore(DEFAULT_WINDOW_MS)

const toBuffer = (input: string) => Buffer.from(input, 'utf8')

const timingSafeEquals = (a: Buffer, b: Buffer) => {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

const findKeyRecord = (apiKey: string): ApiKeyRecord | undefined => {
  const candidate = crypto.createHash('sha256').update(apiKey).digest()
  return configuredKeys.find((record) => timingSafeEquals(candidate, record.hash))
}

const parseTimestamp = (value: string | null): number | null => {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

const buildSignaturePayload = async (c: Context, timestamp: string, nonce: string): Promise<string> => {
  const cloned = c.req.raw.clone()
  const body = await cloned.text()
  const method = c.req.method.toUpperCase()
  const path = c.req.path
  return [method, path, timestamp, nonce, body].join('\n')
}

const verifySignature = async (c: Context, record: ApiKeyRecord, timestamp: string, nonce: string, providedSignature: string) => {
  const payload = await buildSignaturePayload(c, timestamp, nonce)
  const expected = crypto.createHmac('sha256', record.rawKey).update(payload).digest('hex')
  const provided = providedSignature.trim().toLowerCase()
  if (!timingSafeEquals(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))) {
    throw new HTTPException(401, { message: 'Invalid API signature' })
  }
}

const ensureConfigured = () => {
  if (configuredKeys.length > 0) {
    return
  }
  throw new HTTPException(503, { message: 'Public API keys are not configured' })
}

export const __resetNonceStoreForTesting = () => {
  nonceStore.reset()
}

export const requirePublicApiKey = async (c: Context) => {
  if (allowInsecure) {
    return
  }

  ensureConfigured()

  const apiKey = c.req.header(API_KEY_HEADER)
  const timestampHeader = c.req.header(TIMESTAMP_HEADER)
  const nonce = c.req.header(NONCE_HEADER)
  const signature = c.req.header(SIGNATURE_HEADER)

  if (!apiKey || !timestampHeader || !nonce || !signature) {
    throw new HTTPException(401, { message: 'Missing API authentication headers' })
  }

  const timestampMs = parseTimestamp(timestampHeader)
  if (!timestampMs) {
    throw new HTTPException(401, { message: 'Invalid timestamp format' })
  }

  const now = Date.now()
  if (Math.abs(now - timestampMs) > DEFAULT_WINDOW_MS) {
    throw new HTTPException(401, { message: 'Request timestamp outside of allowed window' })
  }

  const record = findKeyRecord(apiKey)
  if (!record) {
    throw new HTTPException(401, { message: 'Invalid API key' })
  }

  if (nonceStore.has(record, nonce)) {
    throw new HTTPException(409, { message: 'Replay detected for nonce' })
  }

  await verifySignature(c, record, timestampHeader, nonce, signature)

  nonceStore.mark(record, nonce, timestampMs)
  c.set('apiKeyLabel', record.label)
}
