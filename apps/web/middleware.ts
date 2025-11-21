import { clerkMiddleware, clerkClient, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { hasAdminRole } from '@/lib/auth/admin-role'

const isPublicRoute = createRouteMatcher(['/', '/dashboard', '/sign-in(.*)', '/sign-up(.*)', '/payment/success'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return
  }

  if (isAdminRoute(req)) {
    const session = await auth()

    if (!session.userId) {
      await auth.protect()
      return
    }

    try {
      const client = await clerkClient()
      const user = await client.users.getUser(session.userId)
      if (!hasAdminRole(user.publicMetadata)) {
        const url = new URL('/dashboard?error=forbidden', req.url)
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Failed to authorize admin route', error)
      const url = new URL('/dashboard?error=forbidden', req.url)
      return NextResponse.redirect(url)
    }

    return
  }

  await auth.protect()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
