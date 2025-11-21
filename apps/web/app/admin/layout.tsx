import type { ReactNode } from 'react'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { hasAdminRole } from '@/lib/auth/admin-role'

const ADMIN_REDIRECT_URL = '/dashboard?error=forbidden'
const ADMIN_SIGN_IN_REDIRECT = '/sign-in?redirect_url=/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  if (!session.userId) {
    redirect(ADMIN_SIGN_IN_REDIRECT)
  }

  const client = await clerkClient()
  const user = await client.users.getUser(session.userId)

  if (!hasAdminRole(user.publicMetadata)) {
    redirect(ADMIN_REDIRECT_URL)
  }

  return <>{children}</>
}
