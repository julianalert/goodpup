'use client'

import { useCallback, useEffect, useState } from 'react'

export interface SpaceSettings {
  remindersEnabled: boolean
  /** 0–23 on the customer's own clock */
  reminderHour: number
  /** Timezone already on file, if any */
  timezone: string | null
  /** Small square photo of the dog, as a data URL */
  photo: string | null
}

export interface SettingsStore {
  settings: SpaceSettings
  /** Change settings: shown at once, saved in the background. Resolves to false if the save failed. */
  update: (changes: Partial<Pick<SpaceSettings, 'remindersEnabled' | 'reminderHour' | 'photo'>>) => Promise<boolean>
}

async function post(sessionId: string, body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/plan-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, ...body }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function useSettings(sessionId: string, initial: SpaceSettings, adminView = false): SettingsStore {
  const [settings, setSettings] = useState(initial)

  // The reminder hour means "on your clock", so the server needs to know which clock.
  // Sent once, silently, and again only if the customer's timezone changes.
  // Never from the admin's own look at the space: that clock is not the customer's.
  useEffect(() => {
    if (adminView) return
    let timezone: string | undefined
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch { /* very old browser: the server falls back to a default */ }
    if (timezone && timezone !== initial.timezone) void post(sessionId, { timezone })
  }, [sessionId, initial.timezone, adminView])

  const update = useCallback<SettingsStore['update']>(async (changes) => {
    const previous = settings
    setSettings({ ...settings, ...changes })

    const body: Record<string, unknown> = {}
    if ('remindersEnabled' in changes) body.reminders_enabled = changes.remindersEnabled
    if ('reminderHour' in changes) body.reminder_hour = changes.reminderHour
    if ('photo' in changes) body.dog_photo = changes.photo

    const ok = await post(sessionId, body)
    if (!ok) setSettings(previous)
    return ok
  }, [sessionId, settings])

  return { settings, update }
}
