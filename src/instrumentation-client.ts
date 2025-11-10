import posthog from 'posthog-js'

// Initialize PostHog for Next.js
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: 'identified_only',
    // Use 2025 defaults for optimal configuration
    defaults: '2025-05-24',
    // Enable session replay with privacy-first settings
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '.ph-no-capture',
      recordCrossOriginIframes: false,
    },
    // Autocapture clicks, form submissions, and page views
    autocapture: {
      dom_event_allowlist: ['click', 'change', 'submit'],
      element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea', 'label'],
    },
    // Development logging
    loaded: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ PostHog initialized successfully')
      }
    },
  })
}

export default posthog
