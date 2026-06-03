import Mixpanel from 'mixpanel'

let client: Mixpanel.Mixpanel | null = null

function getMixpanel(): Mixpanel.Mixpanel | null {
  if (client) return client

  const token = process.env.MIXPANEL_TOKEN ?? process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) {
    console.warn('[mixpanel] MIXPANEL_TOKEN is not set')
    return null
  }

  client = Mixpanel.init(token)
  return client
}

export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  const mp = getMixpanel()
  if (!mp) return

  mp.track(event, {
    distinct_id: distinctId,
    platform: 'web',
    $insert_id: crypto.randomUUID(),
    ...properties,
  })
}

export function setUserProfile(
  distinctId: string,
  properties: Record<string, string | number | boolean | null | undefined>,
) {
  const mp = getMixpanel()
  if (!mp) return
  mp.people.set(distinctId, properties)
}
