export type ClerkPublicMetadata = Record<string, unknown> | null | undefined

export const hasAdminRole = (metadata: ClerkPublicMetadata): boolean => {
  if (!metadata) return false
  const roleValue = metadata['role']
  const role = typeof roleValue === 'string' ? roleValue.toLowerCase() : null
  const isAdminFlag = metadata['isAdmin'] === true
  return role === 'admin' || isAdminFlag
}
