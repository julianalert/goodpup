'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import s from './page.module.css'

export default function SuccessPage() {
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null)
  const [dogName, setDogName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Read the Stripe session ID from the URL (?stripe_session_id=cs_...)
    const params = new URLSearchParams(window.location.search)
    setStripeSessionId(params.get('stripe_session_id'))

    // Read dog/email from sessionStorage (still present from the form flow)
    try {
      const stored = sessionStorage.getItem('pawplan_form')
      if (stored) {
        const form = JSON.parse(stored)
        setDogName(form.dogName ?? null)
        setEmail(form.email ?? null)
      }
    } catch {}
  }, [])

  return (
    <div className={s.page}>
      <nav className={s.nav}>
        <a href="/" className={s.navLogo}>Paw<span>Plan</span></a>
      </nav>

      <main className={s.main}>
        <div className={s.card}>
          <div className={s.iconWrap}>🎉</div>

          <h1 className={s.title}>
            Payment confirmed.<br />
            <em>{dogName ? `${dogName}'s plan is on its way.` : 'Your plan is on its way.'}</em>
          </h1>

          <p className={s.subtitle}>
            {email
              ? <>We&apos;re generating the plan now and will send it to <strong>{email}</strong> in the next few minutes.</>
              : <>We&apos;re generating your personalized 30-day plan now. Check your inbox in a few minutes.</>
            }
          </p>

          <div className={s.steps}>
            <div className={s.step}>
              <span className={s.stepIcon}>✅</span>
              <div>
                <strong>Payment confirmed</strong>
                Your order has been securely processed by Stripe.
              </div>
            </div>
            <div className={s.step}>
              <span className={s.stepIcon}>⚙️</span>
              <div>
                <strong>Plan generation in progress</strong>
                Our AI is building a personalised 30-day program based on{dogName ? ` ${dogName}'s` : ' your dog\'s'} exact profile.
              </div>
            </div>
            <div className={s.step}>
              <span className={s.stepIcon}>📧</span>
              <div>
                <strong>PDF arriving in your inbox</strong>
                {email ? `Sent to ${email}.` : 'Check the email you provided.'} Check spam if it doesn&apos;t arrive within 5 minutes.
              </div>
            </div>
          </div>

          {stripeSessionId && (
            <div className={s.refNote}>
              Order ref: <span>{stripeSessionId}</span>
            </div>
          )}

          <Link href="/" className={s.btnHome}>Back to homepage</Link>
        </div>
      </main>
    </div>
  )
}
