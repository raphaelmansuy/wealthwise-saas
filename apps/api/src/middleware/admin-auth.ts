import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { User } from '@clerk/clerk-sdk-node'
import { clerkClient as baseClerkClient, getTokenVerificationOptions } from '../lib/clerk'

const BEARER_PREFIX = 'Bearer '

type ClerkClient = typeof baseClerkClient

let activeClerkClient: ClerkClient = baseClerkClient

export const __setClerkClientForTesting = (client: ClerkClient | null) => {
  activeClerkClient = client ?? baseClerkClient
}

const extractBearerToken = (authHeader?: string | null): string | null => {
  if (!authHeader) return null
  if (!authHeader.startsWith(BEARER_PREFIX)) return null
  const token = authHeader.slice(BEARER_PREFIX.length).trim()
  return token.length > 0 ? token : null
}

const isAdminUser = (user: User): boolean => {
  const metadata = user.publicMetadata ?? {}
  const role = typeof metadata.role === 'string' ? metadata.role.toLowerCase() : null
  const booleanFlag = metadata.isAdmin === true
  return role === 'admin' || booleanFlag
}

export const requireAdmin = async (c: Context): Promise<User> => {
  const authHeader = c.req.header('Authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }

  const verificationOptions = getTokenVerificationOptions()

  let payload
  try {
    payload = await activeClerkClient.verifyToken(token, verificationOptions)
  } catch (error) {
    c.get('logger')?.warn?.('Admin token verification failed', { error })
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }

  if (!payload?.sub) {
    throw new HTTPException(401, { message: 'Invalid token payload' })
  }

  let user: User
  try {
    user = await activeClerkClient.users.getUser(payload.sub)
  } catch (error) {
    c.get('logger')?.error?.('Failed to fetch Clerk user for admin route', { error })
    throw new HTTPException(401, { message: 'User not found' })
  }

  if (!isAdminUser(user)) {
    throw new HTTPException(403, { message: 'Forbidden' })
  }

  c.set('authUser', user)
  return user
}
