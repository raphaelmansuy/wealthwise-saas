'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/Toast'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  if (!publishableKey) {
    console.error('❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set!')
    throw new Error('Missing Clerk publishable key')
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <ToastProvider>
        {children}
      </ToastProvider>
    </ClerkProvider>
  )
}
