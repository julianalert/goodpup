'use client'

import { useEffect, useRef, useState } from 'react'
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

  // Phones get a fixed pay bar; it steps aside while the main pay button is on screen
  const mainCtaRef = useRef<HTMLButtonElement>(null)
  const [mainCtaVisible, setMainCtaVisible] = useState(false)

  useEffect(() => {
    const el = mainCtaRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setMainCtaVisible(entry.isIntersecting), { threshold: 0.6 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleCheckout = async (source: 'order_box' | 'sticky_bar') => {
    if (checkoutState === 'loading') return
    setCheckoutState('loading')

    trackEvent('checkout_started', {
      source,
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
          <div className={`${s.heroCard} ${s.secHero}`}>
            <div className={s.heroTag}><span className={s.heroTagDot} />Almost there</div>
            <h1>Your plan is being <em>built for {data.dogName}.</em></h1>
          </div>

          {/* WHAT'S INSIDE */}
          <div className={`${s.card} ${s.secInside}`}>
            <div className={s.cardHeader}>
              <div className={s.cardHeaderIcon}>📦</div>
              <div className={s.cardTitle}>What&apos;s inside your plan</div>
            </div>
            <div className={s.cardBody}>
              <div className={s.insideList}>
                {[
                  {
                    title: `${data.dogBreed} temperament diagnostic`,
                    body: `Drive levels, trainability, breed-specific instincts, and the root cause of ${data.dogName}'s ${data.problems.slice(0, 2).map((p) => PROBLEM_LABELS[p]).join(' and ')}, explained clearly.`,
                  },
                  { title: 'Day-by-day 30-day program', body: 'Every single day planned out across 4 weeks: what to do, for how long, and what success looks like before moving forward.' },
                  { title: 'Detailed exercises with timing', body: `Step-by-step instructions, exact duration, session frequency, and progression markers written for ${data.dailyTime}-min daily sessions.` },
                  { title: `${data.dogBreed} mistakes to avoid`, body: `The most common errors owners make, the ones that silently kill progress with ${data.dogBreed.includes(' ') ? 'this breed' : data.dogBreed + 's'}.` },
                  { title: 'Weekly progress checklist', body: 'Concrete milestones for each week. Tick them off to know when you\'re ready to advance, and when to repeat a phase.' },
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

          {/* TRUST SIGNALS */}
          <div className={`${s.card} ${s.secTrust}`}>
            <div className={s.cardHeader}>
              <div className={s.cardHeaderIcon}>🛡</div>
              <div className={s.cardTitle}>Why you can trust this</div>
            </div>
            <div className={s.cardBody}>
              <div className={s.trustList}>
                {[
                  { icon: '⚡', text: <><strong>Ready in a few minutes.</strong> The moment payment clears, your plan is generated and sent straight to your inbox.</> },
                  { icon: '🎯', text: <><strong>Built only for {data.dogName}.</strong> Every section (the diagnostic, the exercises, the mistakes list) is generated from {data.dogName}&apos;s specific profile. Not a template with your dog&apos;s name dropped in.</> },
                  { icon: '📄', text: <><strong>A real, usable document.</strong> You get a polished PDF you can open on your phone during walks, print, or share with your partner. No app, no login, no faff.</> },
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

          {/* PLAN SUMMARY */}
          <div className={`${s.card} ${s.secSummary}`}>
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

        </div>

        {/* RIGHT — ORDER BOX */}
        <div className={s.colRight}>
          <div className={s.orderBox}>

            <div className={s.orderBoxHeader}>
              <svg className={s.orderPaw} viewBox="0 0 100 100" aria-hidden="true">
                <ellipse cx="22" cy="40" rx="9" ry="12" transform="rotate(-20 22 40)" />
                <ellipse cx="41" cy="24" rx="9" ry="13" transform="rotate(-8 41 24)" />
                <ellipse cx="62" cy="24" rx="9" ry="13" transform="rotate(8 62 24)" />
                <ellipse cx="80" cy="40" rx="9" ry="12" transform="rotate(20 80 40)" />
                <path d="M51 46c-13 0-25 12-25 24 0 9 7 13 14 13 5 0 7-2 11-2s6 2 11 2c7 0 14-4 14-13 0-12-12-24-25-24z" />
              </svg>
              <div className={s.orderBoxTitle}>Your order</div>
              <div className={s.orderPlanName}>Personalized 30-Day Training Plan</div>
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
                ref={mainCtaRef}
                type="button"
                className={s.btnCheckout}
                onClick={() => handleCheckout('order_box')}
                disabled={checkoutState === 'loading'}
                style={checkoutState === 'loading' ? { opacity: 0.75, cursor: 'default' } : {}}
              >
                {checkoutState === 'loading' ? 'Redirecting to secure payment…' : 'Get my plan →'}
                {checkoutState === 'error' && <small style={{ color: '#ffb3ae' }}>Something went wrong, please try again</small>}
              </button>

              <div className={s.orderMicro}>
                <div className={s.orderMicroItem}><span className={s.microIcon}>🔒</span> Secured by Stripe · SSL encrypted</div>
                <div className={s.orderMicroItem}><span className={s.microIcon}>📧</span> Sent straight to your inbox</div>
                <div className={s.orderMicroItem}><span className={s.microIcon}>🐾</span> Your own personal space online</div>
                <div className={s.orderMicroItem}><span className={s.microIcon}>🚫</span> No subscription, ever</div>
              </div>

              <div className={s.urgencyBar}>
                <span className={s.urgencyDot} />
                <span>Launch price ends soon. Normally {LIST_PRICE_LABEL}.</span>
              </div>
            </div>

            <div className={s.bottomTrust}>
              <div className={s.btItem}>💳 Visa / Mastercard / Amex</div>
              <div className={s.btItem}>🔒 SSL secure</div>
              <div className={s.btItem}>⚡ Ready in minutes</div>
            </div>

          </div>
        </div>

      </div>

      {/* MOBILE PAY BAR — hidden on desktop, and while the main pay button is in view */}
      <div className={`${s.stickyCta} ${mainCtaVisible ? s.stickyCtaHidden : ''}`} aria-hidden={mainCtaVisible}>
        <div className={s.stickyPrice}>
          <div className={s.stickyPriceRow}>
            <span className={s.stickyNew}>{PRICE_LABEL}</span>
            <span className={s.stickyOld}>{LIST_PRICE_LABEL}</span>
          </div>
          <div className={s.stickySub}>One-time payment</div>
        </div>
        <button
          type="button"
          className={s.stickyBtn}
          onClick={() => handleCheckout('sticky_bar')}
          disabled={checkoutState === 'loading'}
          tabIndex={mainCtaVisible ? -1 : undefined}
        >
          {checkoutState === 'loading' ? 'Redirecting…' : checkoutState === 'error' ? 'Try again →' : 'Get my plan →'}
        </button>
      </div>
    </>
  )
}
