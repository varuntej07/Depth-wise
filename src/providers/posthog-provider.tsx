'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import posthog from '@/instrumentation-client'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Hook to identify users when they sign in
export function PostHogAuthIdentifier() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Identify the user with PostHog
      posthog.identify(session.user.id!, {
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.image,
      })
    } else if (status === 'unauthenticated') {
      // Reset user identity when logged out
      posthog.reset()
    }
  }, [session, status])

  return null
}
