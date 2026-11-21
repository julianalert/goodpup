'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/mixpanel-client'
import s from './page.module.css'

const GEN_STEPS = [
  'Analysing breed profile & temperament',
  'Identifying root causes of issues',
  'Building week-by-week program',
  'Writing daily exercises & schedules',
  'Compiling mistakes to avoid',
  'Sending to your inbox ✓',
]

// How long to show each step label (ms) — purely cosmetic, polling drives the real transition
const GEN_DELAYS = [0, 4000, 8000, 12000, 17000, 22000]

type GenState = 'generating' | 'ready' | 'failed'

// How many times this page retries a failed generation by itself before showing the
// error card, and how long it ignores a 'failed' status right after asking again.
const AUTO_RETRIES = 2
const RETRY_GRACE_MS = 20_000

// The Stripe checkout ID from the return URL goes along with the request so the server
// can confirm the payment with Stripe itself if the webhook hasn't arrived yet.
function generateRequestBody(sessionId: string): string {
  const stripeSessionId = new URLSearchParams(window.location.search).get('stripe_session_id')
  return JSON.stringify({ session_id: sessionId, stripe_session_id: stripeSessionId ?? undefined })
}

export default function SuccessPage() {
  const router = useRouter()
  const [dogName, setDogName] = useState<string | null>(null)
  const [genState, setGenState] = useState<GenState>('generating')
  const [genStepIndex, setGenStepIndex] = useState(0)
  const sessionIdRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const autoRetriesRef = useRef(0)
  const retriedAtRef = useRef(0)

  useEffect(() => {
    let sessionId: string | null = null

    // 1. Try sessionStorage (normal post-form flow)
    try {
      sessionId = sessionStorage.getItem('pawcraft_session_id')
      const stored = sessionStorage.getItem('pawcraft_form')
      if (stored) {
        const form = JSON.parse(stored)
        setDogName(form.dogName ?? null)
      }
    } catch { /* ignore */ }

    if (sessionId) {
      startGeneration(sessionId)
      return () => {
        if (pollRef.current) clearInterval(pollRef.current)
        timersRef.current.forEach(clearTimeout)
      }
    }

    // 2. Fallback: recover session_id from Stripe session ID in URL
    //    (email recovery flow — sessionStorage is empty in a fresh browser tab)
    const stripeSessionId = new URLSearchParams(window.location.search).get('stripe_session_id')
    if (!stripeSessionId) {
      setGenState('failed')
      return
    }

    fetch(`/api/session-from-stripe?stripe_session_id=${encodeURIComponent(stripeSessionId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('not found')
        const json = await res.json()
        const recoveredId: string = json.session_id
        if (json.dog_name) setDogName(json.dog_name)
        try {
          sessionStorage.setItem('pawcraft_session_id', recoveredId)
        } catch { /* ignore */ }
        startGeneration(recoveredId)
      })
      .catch(() => setGenState('failed'))

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      timersRef.current.forEach(clearTimeout)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  // Ask the server to generate (the Stripe webhook asks too; only one of them runs)
  function requestGeneration(sessionId: string) {
    retriedAtRef.current = Date.now()
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: generateRequestBody(sessionId),
    }).catch(err => console.error('[success] generate trigger failed:', err))
  }

  function startStepAnimation() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = GEN_DELAYS.map((delay, i) => setTimeout(() => setGenStepIndex(i), delay))
  }

  // Poll for status every 3 s. A failed attempt is retried from here without the
  // buyer doing anything; the error card only shows once those retries are used up.
  function pollStatus(sessionId: string) {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/plan-status?session_id=${sessionId}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.plan_status === 'ready') {
          clearInterval(pollRef.current!)
          setGenState('ready')
          trackEvent('plan_generated', { session_id: sessionId })
          setTimeout(() => {
            router.push(`/plan/${sessionId}`)
          }, 800)
        } else if (data.plan_status === 'failed') {
          // A request we just sent may not have flipped the status yet
          if (Date.now() - retriedAtRef.current < RETRY_GRACE_MS) return

          if (autoRetriesRef.current < AUTO_RETRIES) {
            autoRetriesRef.current += 1
            trackEvent('plan_generation_retried', { session_id: sessionId, retry: autoRetriesRef.current, automatic: true })
            requestGeneration(sessionId)
            return
          }

          clearInterval(pollRef.current!)
          setGenState('failed')
        }
      } catch { /* keep polling */ }
    }, 3000)
  }

  function startGeneration(sessionId: string) {
    sessionIdRef.current = sessionId

    trackEvent('plan_generation_started', { session_id: sessionId })

    startStepAnimation()
    requestGeneration(sessionId)
    pollStatus(sessionId)
  }

  const handleRetry = () => {
    const sessionId = sessionIdRef.current
    if (!sessionId) return
    setGenState('generating')
    setGenStepIndex(0)
    autoRetriesRef.current = 0

    startStepAnimation()
    requestGeneration(sessionId)
    pollStatus(sessionId)
  }

  if (genState === 'failed') {
    return (
      <div className={s.page}>
        <nav className={s.nav}>
          <a href="/" className={s.navLogo}>
            <img src="/icon.png" alt="" className="appIcon" width={28} height={28} />
            Paw<span>Craft</span>
          </a>
        </nav>
        <main className={s.main}>
          <div className={s.genCard}>
            <div className={s.errorIcon}>⚠️</div>
            <h2 className={s.genTitle}>This is taking longer than it should</h2>
            <p className={s.genSub}>
              Your payment is safe. We keep retrying {dogName ? `${dogName}'s` : 'your'} plan automatically and will email it to you as soon as it&apos;s ready, so you can close this page. Or try again now:
            </p>
            <button className={s.btnRetry} onClick={handleRetry}>
              Try again now
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <a href="/" className={s.navLogo}>
          <img src="/icon.png" alt="" className="appIcon" width={28} height={28} />
          Paw<span>Craft</span>
        </a>
      </nav>

      <main className={s.main}>
        <div className={s.genCard}>
          {/* Spinner */}
          <div className={s.spinnerWrap}>
            {genState === 'ready' ? (
              <div className={s.checkmark}>✓</div>
            ) : (
              <div className={s.spinner} />
            )}
          </div>

          <h2 className={s.genTitle}>
            {genState === 'ready'
              ? `${dogName ? `${dogName}'s` : 'Your'} plan is ready!`
              : `Generating ${dogName ? `${dogName}'s` : 'your'} plan…`}
          </h2>

          <p className={s.genSub}>
            {genState === 'ready'
              ? 'Redirecting you now…'
              : 'This can take up to 5 minutes. Please keep this page open.'}
          </p>

          {/* Step list */}
          <div className={s.stepList}>
            {GEN_STEPS.map((label, i) => {
              const done = genState === 'ready' || i < genStepIndex
              const active = genState !== 'ready' && i === genStepIndex
              return (
                <div
                  key={i}
                  className={`${s.stepRow} ${done ? s.stepDone : ''} ${active ? s.stepActive : ''}`}
                >
                  <span className={s.stepDot}>
                    {done ? '✓' : active ? '·' : '○'}
                  </span>
                  <span className={s.stepLabel}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
