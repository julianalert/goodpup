'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cleanAddonIds, isAddonId, type AddonId, type AddonState } from '@/lib/addons'
import { trackEvent } from '@/lib/mixpanel-client'

export interface AddonsStore {
  addons: AddonState[]
  /** The add-on being sent to checkout right now */
  unlocking: AddonId | null
  unlockFailed: boolean
  /** Back from paying, waiting for the server to confirm it */
  confirming: boolean
  /** A failed add-on has used up this page's own retries; the server keeps trying */
  stuck: boolean
  /** Send the customer to pay for an add-on */
  unlock: (id: AddonId) => void
  /** Ask for a failed add-on again, by hand */
  retry: () => void
  /** Send the answers an add-on was waiting for; that starts its writing. False when they could not be sent. */
  submitIntake: (id: AddonId, answers: unknown) => Promise<boolean>
}

// How often this page asks for a failed add-on again by itself, and how long it
// ignores a status that a request it just sent has not had time to change.
const AUTO_RETRIES = 2
const GRACE_MS = 20_000
const POLL_MS = 5_000

const inFlight = (a: AddonState) => a.status === 'pending' || a.status === 'generating'

function readStates(json: unknown): AddonState[] | null {
  const list = (json as { addons?: unknown })?.addons
  if (!Array.isArray(list)) return null
  return list.filter((a): a is AddonState => Boolean(a) && isAddonId((a as AddonState).id))
}

/**
 * The customer's add-ons, kept current while one is being generated.
 *
 * The server starts a paid add-on on its own (after the plan, and after an unlock
 * payment); this page asks too, so the customer never waits on a webhook or a
 * sweep, and whoever asks first does the work. With `readOnly` (the admin's look
 * at a customer's space) it only shows what it was given.
 */
export function useAddons(sessionId: string, initial: AddonState[], readOnly = false): AddonsStore {
  const [addons, setAddons] = useState(initial)
  const [unlocking, setUnlocking] = useState<AddonId | null>(null)
  const [unlockFailed, setUnlockFailed] = useState(false)
  // Back from paying for an add-on: the address carries the checkout to confirm
  const [confirming, setConfirming] = useState(
    () => !readOnly && new URLSearchParams(window.location.search).has('addon_checkout'),
  )
  const [stuck, setStuck] = useState(false)
  const askedAt = useRef(0)
  const autoRetries = useRef(0)

  // Statuses come without content; what is already on the page is kept
  const merge = useCallback((next: AddonState[]) => {
    setAddons((current) => next.map((a) => {
      const had = current.find((c) => c.id === a.id)
      return a.status === 'ready' && a.content === null && had?.content
        ? { ...a, content: had.content, settings: a.settings ?? had.settings }
        : a
    }))
  }, [])

  const load = useCallback(async (withContent: boolean): Promise<AddonState[] | null> => {
    try {
      const res = await fetch(`/api/addons?session_id=${encodeURIComponent(sessionId)}${withContent ? '&content=1' : ''}`)
      return res.ok ? readStates(await res.json()) : null
    } catch {
      return null
    }
  }, [sessionId])

  /** Ask the server to generate whatever is paid and waiting. Resolves to the states it answers with. */
  const request = useCallback(async (stripeSessionId?: string): Promise<AddonState[] | null> => {
    askedAt.current = Date.now()
    try {
      const res = await fetch('/api/addons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, stripe_session_id: stripeSessionId }),
      })
      return res.ok ? readStates(await res.json()) : null
    } catch (err) {
      console.error('[addons] generate request failed:', err)
      return null
    }
  }, [sessionId])

  const ask = useCallback((stripeSessionId?: string) => {
    void request(stripeSessionId).then((next) => {
      if (next) merge(next)
    })
  }, [request, merge])

  // On arrival: back from an unlock payment, or an add-on is waiting for its turn
  useEffect(() => {
    if (readOnly) return
    const url = new URL(window.location.href)
    const checkoutId = url.searchParams.get('addon_checkout')

    if (checkoutId) {
      // Clean the address so a reload does not report the payment again
      url.searchParams.delete('addon_checkout')
      window.history.replaceState(null, '', `${url.pathname}${url.search}#profile`)
      trackEvent('addon_checkout_completed', { session_id: sessionId })
      void request(checkoutId).then((next) => {
        if (next) merge(next)
        setConfirming(false)
      })
    } else if (initial.some((a) => a.status === 'pending' || a.status === 'failed')) {
      void request().then((next) => {
        if (next) merge(next)
      })
    }
  // Once, when the space opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const failed = addons.some((a) => a.status === 'failed')
  const watching = !readOnly && (addons.some(inFlight) || (failed && !stuck))

  // While something is being written: check on it every few seconds
  useEffect(() => {
    if (!watching) return

    const timer = setInterval(async () => {
      const next = await load(false)
      if (!next) return

      // Just became ready: fetch it once with its content
      const arrived = next.some((a) => a.status === 'ready' && !addons.find((c) => c.id === a.id)?.content)
      if (arrived) {
        const full = await load(true)
        merge(full ?? next)
        trackEvent('addon_ready_seen', { session_id: sessionId })
        return
      }
      merge(next)

      // A request we just sent may not have changed the status yet
      if (Date.now() - askedAt.current < GRACE_MS) return

      if (next.some((a) => a.status === 'failed')) {
        if (autoRetries.current < AUTO_RETRIES) {
          autoRetries.current += 1
          ask()
        } else {
          setStuck(true)
        }
      } else if (next.some((a) => a.status === 'pending')) {
        // Paid but nobody has started it: ask again
        ask()
      }
    }, POLL_MS)

    return () => clearInterval(timer)
  }, [watching, addons, load, merge, ask, sessionId])

  const unlock = useCallback((id: AddonId) => {
    if (readOnly || unlocking) return
    setUnlocking(id)
    setUnlockFailed(false)
    trackEvent('addon_unlock_clicked', { session_id: sessionId, addon: id })

    fetch('/api/addons/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, addons: cleanAddonIds([id]) }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.url) throw new Error(json?.error ?? 'no checkout url')
        // Off to Stripe Checkout
        window.location.href = json.url
      })
      .catch((err) => {
        console.error('[addons] unlock failed:', err)
        setUnlocking(null)
        setUnlockFailed(true)
      })
  }, [readOnly, unlocking, sessionId])

  const retry = useCallback(() => {
    autoRetries.current = 0
    setStuck(false)
    ask()
  }, [ask])

  const submitIntake = useCallback(async (id: AddonId, answers: unknown): Promise<boolean> => {
    if (readOnly) return false
    askedAt.current = Date.now()
    try {
      const res = await fetch('/api/addons/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, addon_id: id, answers }),
      })
      const json = await res.json().catch(() => null)
      // 409 = already answered (another tab, a double tap): show what is really going on
      const next = readStates(json)
      if (next && (res.ok || res.status === 409)) {
        merge(next)
        return true
      }
      return false
    } catch (err) {
      console.error('[addons] intake failed:', err)
      return false
    }
  }, [readOnly, sessionId, merge])

  return { addons, unlocking, unlockFailed, confirming, stuck, unlock, retry, submitIntake }
}
