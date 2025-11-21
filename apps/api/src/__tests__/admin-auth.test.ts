import { describe, expect, afterEach, it } from 'bun:test'
import { HTTPException } from 'hono/http-exception'
import type { Context } from 'hono'

process.env.CLERK_SECRET_KEY ??= 'sk_test_dummy'

const { requireAdmin, __setClerkClientForTesting } = await import('../middleware/admin-auth')

const createContext = (headers: Record<string, string | undefined>): Context => {
  const headerLookup = new Map<string, string>()
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      headerLookup.set(key.toLowerCase(), value)
    }
  }

  return {
    req: {
      header: (name: string) => headerLookup.get(name.toLowerCase()) ?? null,
    },
    set: () => undefined,
    get: () => undefined,
  } as unknown as Context
}

afterEach(() => {
  __setClerkClientForTesting(null)
})

describe('requireAdmin', () => {
  it('throws 401 when authorization header is missing', async () => {
    const ctx = createContext({})
    await expect(requireAdmin(ctx)).rejects.toBeInstanceOf(HTTPException)
  })

  it('throws 401 when token verification fails', async () => {
    __setClerkClientForTesting({
      verifyToken: async () => {
        throw new Error('invalid token')
      },
      users: {
        getUser: async () => ({})
      },
    } as any)

    const ctx = createContext({ Authorization: 'Bearer bad-token' })
    await expect(requireAdmin(ctx)).rejects.toBeInstanceOf(HTTPException)
  })

  it('throws 403 when user is not admin', async () => {
    __setClerkClientForTesting({
      verifyToken: async () => ({ sub: 'user_123' }),
      users: {
        getUser: async () => ({
          id: 'user_123',
          publicMetadata: { role: 'member' },
        }),
      },
    } as any)

    const ctx = createContext({ Authorization: 'Bearer valid-token' })
    await expect(requireAdmin(ctx)).rejects.toBeInstanceOf(HTTPException)
  })

  it('returns the user when token and role are valid', async () => {
    const mockUser = {
      id: 'user_admin',
      publicMetadata: { role: 'admin' },
    } as any

    __setClerkClientForTesting({
      verifyToken: async () => ({ sub: 'user_admin' }),
      users: {
        getUser: async () => mockUser,
      },
    } as any)

    const ctx = createContext({ Authorization: 'Bearer valid-token' })
  await expect(requireAdmin(ctx)).resolves.toMatchObject({ id: 'user_admin' })
  })
})
