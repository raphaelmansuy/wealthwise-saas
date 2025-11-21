import { describe, expect, it } from 'bun:test'
import { hasAdminRole } from './admin-role'

describe('hasAdminRole', () => {
  it('returns false when metadata is null', () => {
    expect(hasAdminRole(null)).toBe(false)
  })

  it('returns true when role is admin', () => {
    expect(hasAdminRole({ role: 'admin' })).toBe(true)
  })

  it('is case-insensitive for role', () => {
    expect(hasAdminRole({ role: 'AdMiN' })).toBe(true)
  })

  it('returns true when isAdmin flag is true', () => {
    expect(hasAdminRole({ isAdmin: true })).toBe(true)
  })

  it('returns false when no admin indicators are set', () => {
    expect(hasAdminRole({ role: 'user', isAdmin: false })).toBe(false)
  })
})
