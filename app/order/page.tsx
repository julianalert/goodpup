'use client'

import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/mixpanel-client'
import { DISCOUNT_LABEL, LIST_PRICE_LABEL, PRICE_LABEL } from '@/lib/pricing'
import s from './page.module.css'

const PROBLEM_LABELS: Record<string, string> = {
  leash_pulling: 'Pulls on leash',
  recall: "Won't come when called",
  jumping: 'Jumps on people',
  barking: 'Excessive barking',
  aggression: 'Reactivity / aggression',
  separation: 'Separation anxiety',
  destruction: 'Chewing / destruction',
  basic_obedience: 'Basic obedience',
  potty: 'Potty training',
  biting: 'Biting / mouthing',
  stealing: 'Stealing food',
  fearful: 'Fear / anxiety',
}

const LIVING_LABELS: Record<string, string> = {
  apartment: 'Apartment (no garden)',
  house_no_garden: 'House (no garden)',
  house_garden: 'House + garden',
  rural: 'Rural / countryside',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  first_dog: 'First dog ever',
  some_experience: 'Had dogs before',
  experienced: 'Experienced owner',
}

const AGE_LABELS: Record<string, string> = {
  puppy_under6: 'Puppy (under 6 months)',
  puppy_6to12: 'Young pup (6–12 months)',
  adolescent: 'Adolescent (1–2 years)',
  adult: 'Adult (2–7 years)',
  senior: 'Senior (7+ years)',
}

interface FormData {
  dogName: string
  dogBreed: string
  dogAge: string
  problems: string[]
  problemContext: string
  experience: string
  living: string
  dailyTime: number
  trainingHistory: string
  email: string
}

const DEFAULT_DATA: FormData = {
  dogName: 'Max',
  dogBreed: 'Border Collie',
  dogAge: 'adolescent',
  problems: ['leash_pulling', 'aggression'],
  problemContext: '',
  experience: 'some_experience',
  living: 'apartment',
  dailyTime: 25,
  trainingHistory: 'some_home',
  email: 'you@email.com',
}

export default function OrderPage() {
  const [data, setData] = useState<FormData>(DEFAULT_DATA)
  const [checkoutState, setCheckoutState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    // 1. Try sessionStorage first (normal post-form flow)
    try {
      const stored = sessionStorage.getItem('pawcraft_form')
      if (stored) setData(JSON.parse(stored))

      const sid = sessionStorage.getItem('pawcraft_session_id')
      if (sid) {
        setSessionId(sid)
        return
      }
    } catch { /* ignore */ }

    // 2. Fallback: load from URL ?session_id param (abandoned-cart email flow)
    const params = new URLSearchParams(window.location.search)
    const urlSessionId = params.get('session_id')
    if (!urlSessionId) return

    setSessionId(urlSessionId)

    fetch(`/api/submission-data?session_id=${encodeURIComponent(urlSessionId)}`)
      .then(async (res) => {
        if (!res.ok) return
        const json = await res.json()
        setData(json)
        // Hydrate sessionStorage so downstream pages (success) still work
        try {
          sessionStorage.setItem('pawcraft_form', JSON.stringify(json))
          sessionStorage.setItem('pawcraft_session_id', urlSessionId)
        } catch { /* ignore */ }
      })
      .catch(() => { /* keep DEFAULT_DATA */ })
  }, [])

  const handleCheckout = async () => {
    setCheckoutState('loading')

    trackEvent('checkout_started', {
      session_id: sessionId ?? undefined,
      dog_breed: data.dogBreed,
      problem_count: data.problems.length,
    })

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })

      const json = await res.json()

      if (!res.ok || !json.url) {
        console.error('[order] checkout error:', json.error)
        setCheckoutState('error')
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = json.url
    } catch (err) {
      console.error('[order] checkout fetch failed:', err)
      setCheckoutState('error')
    }
  }

  const dogPillText = [
    '🐾',
    data.dogName,
    '·',
    data.dogBreed,
    data.dogAge ? `· ${AGE_LABELS[data.dogAge]}` : '',
    data.problems.length > 0 ? `· ${data.problems.map((p) => PROBLEM_LABELS[p]).join(' + ')}` : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      {/* NAV */}
      <nav className={s.nav}>
        <a href="/" className={s.navLogo}>
          <img src="/icon.png" alt="" className="appIcon" width={28} height={28} />
          Paw<span>Craft</span>
        </a>
        <div className={s.navSecure}>🔒 Secure checkout</div>
      </nav>

      {/* PROGRESS STRIP */}
      <div className={s.progressStrip}>
        <div className={s.progressSteps}>
          <div className={`${s.progStep} ${s.progStepDone}`}>
            <div className={s.progDot}>✓</div>
            About your dog
          </div>
          <div className={`${s.progLine} ${s.progLineDone}`} />
          <div className={`${s.progStep} ${s.progStepActive}`}>
            <div className={s.progDot}>2</div>
            Review &amp; pay
          </div>
          <div className={s.progLine} />
          <div className={s.progStep}>
            <div className={s.progDot}>3</div>
            Get your plan
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className={s.pageWrap}>

        {/* LEFT */}
        <div className={s.colLeft}>

          {/* HERO CARD */}
          <div className={s.heroCard}>
            <div className={s.heroTag}>✦ Almost there</div>
            <h1>Your plan is being <em>built for {data.dogName}.</em></h1>
            <p>One payment and our AI will generate a complete, breed-specific 30-day training program tailored to {data.dogName}&apos;s exact profile and your situation. Delivered to your inbox in under 60 seconds.</p>
            <div className={s.dogPill}>{dogPillText}</div>
          </div>

          {/* PLAN SUMMARY */}
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardHeaderIcon}>📋</div>
              <div className={s.cardTitle}>Your plan summary</div>
            </div>
            <div className={s.cardBody}>
              <div className={s.summaryBlock}>
                <div className={s.summaryRow}>
                  <span className={s.sumKey}>Dog</span>
                  <span className={s.sumVal}>{data.dogName}</span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.sumKey}>Breed &amp; age</span>
                  <span className={s.sumVal}>{data.dogBreed}{data.dogAge ? ` · ${AGE_LABELS[data.dogAge]}` : ''}</span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.sumKey}>Focus areas</span>
                  <span className={s.sumVal}>
                    <div className={s.sumTags}>
                      {data.problems.map((p) => (
                        <span key={p} className={s.sumTag}>{PROBLEM_LABELS[p]}</span>
                      ))}
                    </div>
                  </span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.sumKey}>Daily training time</span>
                  <span className={s.sumVal}>{data.dailyTime} min/day</span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.sumKey}>Living situation</span>
                  <span className={s.sumVal}>{data.living ? LIVING_LABELS[data.living] : '-'}</span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.sumKey}>Experience level</span>
                  <span className={s.sumVal}>{data.experience ? EXPERIENCE_LABELS[data.experience] : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* WHAT'S INSIDE */}
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardHeaderIcon}>📦</div>
              <div className={s.cardTitle}>What&apos;s inside your plan</div>
            </div>
            <div className={s.cardBody}>
              <div className={s.insideList}>
                {[
                  {
                    title: `${data.dogBreed} temperament diagnostic`,
                    body: `Drive levels, trainability, breed-specific instincts, and the root cause of ${data.dogName}'s ${data.problems.slice(0, 2).map((p) => PROBLEM_LABELS[p]).join(' and ')} — explained clearly.`,
                  },
                  { title: 'Day-by-day 30-day program', body: 'Every single day planned out across 4 weeks — what to do, for how long, and what success looks like before moving forward.' },
                  { title: 'Detailed exercises with timing', body: `Step-by-step instructions, exact duration, session frequency, and progression markers written for ${data.dailyTime}-min daily sessions.` },
                  { title: `${data.dogBreed} mistakes to avoid`, body: `The most common errors owners make — the ones that silently kill progress with ${data.dogBreed.includes(' ') ? 'this breed' : data.dogBreed + 's'}.` },
                  { title: 'Weekly progress checklist', body: 'Concrete milestones for each week — tick them off to know when you\'re ready to advance, and when to repeat a phase.' },
                ].map((item, i) => (
                  <div key={i} className={s.insideItem}>
                    <div className={s.insideNum}>{i + 1}</div>
                    <div className={s.insideText}>
                      <h4>{item.title}</h4>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SAMPLE PREVIEW */}
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardHeaderIcon}>👁</div>
              <div className={s.cardTitle}>Preview — a glimpse of your plan</div>
            </div>
            <div className={s.cardBody}>
              <div className={s.previewStrip}>
                <div className={s.previewRow}>
                  <div className={s.previewWeek}>Week 1</div>
                  <div className={s.previewContent}>
                    <div className={s.previewDay}>Monday: Name recognition &amp; attention</div>
                    <div className={s.previewEx}>3 × 5-min sessions indoors. Say {data.dogName}&apos;s name, mark with &quot;yes&quot;, reward. Goal: 10/10 response before moving outside.</div>
                  </div>
                </div>
                <div className={s.previewRow}>
                  <div className={s.previewWeek}>Week 1</div>
                  <div className={s.previewContent}>
                    <div className={s.previewDay}>Tuesday: Eye contact hold</div>
                    <div className={s.previewEx}>2 × 8-min sessions. Hold treat at eye level, reward 3 seconds of voluntary eye contact. Build to 5 seconds with TV on.</div>
                  </div>
                </div>
                <div className={`${s.previewRow} ${s.previewBlur}`}>
                  <div className={s.previewWeek}>Week 2</div>
                  <div className={s.previewContent}>
                    <div className={s.previewDay}>Monday: First outdoor session</div>
                    <div className={s.previewEx}>Quiet street, 15 min. Stop every time leash tightens. Wait for slack, reward immediately. Goal: 5 voluntary check-ins.</div>
                  </div>
                </div>
                <div className={`${s.previewRow} ${s.previewBlur}`}>
                  <div className={s.previewWeek}>Week 2</div>
                  <div className={s.previewContent}>
                    <div className={s.previewDay}>Wednesday: Threshold work</div>
                    <div className={s.previewEx}>Spot a dog at 50m. Ask for sit, reward calm focus. Do not allow closer. This is where reactivity is broken.</div>
                  </div>
                </div>
              </div>
              <div className={s.previewUnlock}>🔒 Unlock all 30 days + full exercises →</div>
            </div>
          </div>

          {/* TRUST SIGNALS */}
          <div className={s.card}>
            <div className={s.cardHeader}>
              <div className={s.cardHeaderIcon}>🛡</div>
              <div className={s.cardTitle}>Why you can trust this</div>
            </div>
            <div className={s.cardBody}>
              <div className={s.trustList}>
                {[
                  { icon: '⚡', text: <><strong>Ready in under 60 seconds.</strong> The moment payment clears, your plan is generated and sent straight to your inbox. No waiting.</> },
                  { icon: '🎯', text: <><strong>Built only for {data.dogName}.</strong> Every section — the diagnostic, the exercises, the mistakes list — is generated from {data.dogName}&apos;s specific profile. Not a template with your dog&apos;s name dropped in.</> },
                  { icon: '📄', text: <><strong>A real, usable document.</strong> You get a polished PDF you can open on your phone during walks, print, or share with your partner. No app, no login, no faff.</> },
                  { icon: '🔄', text: <><strong>30-day money-back guarantee.</strong> If the plan isn&apos;t useful, email us within 30 days and we&apos;ll refund you in full. No questions, no forms.</> },
                  { icon: '🔒', text: <><strong>Safe &amp; secure payment.</strong> Processed by Stripe. We never see or store your card details.</> },
                ].map((item, i) => (
                  <div key={i} className={s.trustItem}>
                    <span className={s.trustIcon}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className={s.miniTestimonial}>
                <div className={s.miniStars}>★★★★★</div>
                <div className={s.miniQuote}>&ldquo;My trainer quoted me $600 for a 6-session package. I tried PawCraft first for {PRICE_LABEL}. Honestly, the plan was more detailed than what he gave me in session one.&rdquo;</div>
                <div className={s.miniAuthor}>
                  <div className={s.miniAvatar}>JK</div>
                  <div>
                    <div className={s.miniName}>Jamie K.</div>
                    <div className={s.miniDog}>Bruno · French Bulldog · 3 years</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT — ORDER BOX */}
        <div className={s.colRight}>
          <div className={s.orderBox}>

            <div className={s.orderBoxHeader}>
              <div className={s.orderBoxTitle}>Your order</div>
              <div className={s.orderPlanName}>Personalized 30-Day Training Plan</div>
              <div className={s.orderPriceRow}>
                <span className={s.orderPriceOld}>{LIST_PRICE_LABEL}</span>
                <span className={s.orderPriceNew}>{PRICE_LABEL}</span>
              </div>
              <div className={s.orderPriceSub}>Limited launch price · One-time payment</div>
            </div>

            <div className={s.orderBoxBody}>
              <div className={s.orderLine}>
                <span className={s.orderLineLabel}>30-day personalized plan</span>
                <span className={s.orderLineValue}>{LIST_PRICE_LABEL}.00</span>
              </div>
              <div className={s.orderLine}>
                <span className={s.orderLineLabel}>Launch discount</span>
                <span className={`${s.orderLineValue} ${s.orderLineValueGreen}`}>{DISCOUNT_LABEL}</span>
              </div>

              <hr className={s.orderDivider} />

              <div className={s.orderTotal}>
                <span className={s.orderTotalLabel}>Total today</span>
                <span className={s.orderTotalValue}>{PRICE_LABEL}</span>
              </div>

              <button
                className={s.btnCheckout}
                onClick={handleCheckout}
                disabled={checkoutState === 'loading'}
                style={checkoutState === 'loading' ? { opacity: 0.75, cursor: 'default' } : {}}
              >
                {checkoutState === 'loading' ? 'Redirecting to secure payment…' : `Pay ${PRICE_LABEL} — Get my plan`}
                {checkoutState === 'idle' && <small>Delivered to your inbox in &lt; 60 seconds</small>}
                {checkoutState === 'error' && <small style={{ color: '#ffb3ae' }}>Something went wrong — please try again</small>}
              </button>

              <div className={s.orderMicro}>
                <div className={s.orderMicroItem}><span className={s.microIcon}>🔒</span> Secured by Stripe · SSL encrypted</div>
                <div className={s.orderMicroItem}><span className={s.microIcon}>↩️</span> 30-day money-back guarantee</div>
                <div className={s.orderMicroItem}><span className={s.microIcon}>📧</span> Sent instantly to your inbox</div>
                <div className={s.orderMicroItem}><span className={s.microIcon}>🚫</span> No subscription — ever</div>
              </div>

              <div className={s.guaranteeBox}>
                <span className={s.guaranteeIcon}>🛡️</span>
                <div className={s.guaranteeText}>
                  <strong>30-day money-back guarantee</strong>
                  If the plan doesn&apos;t help, email us within 30 days for a full refund. No questions asked.
                </div>
              </div>

              <div className={s.urgencyBar}>
                <span className={s.urgencyDot} />
                <span>Launch price ends soon — normally {LIST_PRICE_LABEL}</span>
              </div>
            </div>

            <div className={s.bottomTrust}>
              <div className={s.btItem}>💳 Visa / Mastercard / Amex</div>
              <div className={s.btItem}>🔒 SSL secure</div>
              <div className={s.btItem}>⚡ Instant delivery</div>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}
