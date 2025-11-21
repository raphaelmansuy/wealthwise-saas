import { createClerkClient, type VerifyTokenOptions } from '@clerk/clerk-sdk-node'

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY must be set in the environment')
}

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

const DEFAULT_CLOCK_SKEW_MS = Number(process.env.CLERK_CLOCK_SKEW_MS ?? 10_000)

const parseAudience = (): VerifyTokenOptions['audience'] => {
  const raw = process.env.CLERK_JWT_AUDIENCE || process.env.CLERK_ALLOWED_AUDIENCES
  if (!raw) return undefined
  const audiences = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  if (audiences.length === 0) return undefined
  return audiences.length === 1 ? audiences[0] : audiences
}

const parseAuthorizedParties = (): VerifyTokenOptions['authorizedParties'] => {
  const raw = process.env.CLERK_JWT_AUTHORIZED_PARTIES
  if (!raw) return undefined
  const parties = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return parties.length > 0 ? parties : undefined
}

export const getTokenVerificationOptions = (): VerifyTokenOptions => ({
  audience: parseAudience(),
  authorizedParties: parseAuthorizedParties(),
  clockSkewInMs: DEFAULT_CLOCK_SKEW_MS,
})
