import mixpanel from 'mixpanel-browser'

let initialized = false

export function initMixpanel() {
  if (typeof window === 'undefined' || initialized) return

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) {
    console.warn('[mixpanel] NEXT_PUBLIC_MIXPANEL_TOKEN is not set')
    return
  }

  mixpanel.init(token, {
    debug: process.env.NODE_ENV !== 'production',
    track_pageview: false,
    persistence: 'localStorage',
  })

  mixpanel.register({ platform: 'web' })
  initialized = true
}

export function trackEvent(
  event: string,
  properties?: Record<string, string | number | boolean | string[] | null | undefined>,
) {
  if (typeof window === 'undefined') return
  if (!initialized) initMixpanel()
  if (!initialized) return
  mixpanel.track(event, properties)
}

export function identifyUser(
  userId: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === 'undefined') return
  if (!initialized) initMixpanel()
  if (!initialized) return
  mixpanel.identify(userId)
  if (properties) mixpanel.people.set(properties)
}

export { mixpanel }
