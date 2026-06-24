import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram, FaTiktok } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import s from './page.module.css'

export const metadata: Metadata = {
  title: 'PawCraft Affiliate Program — Earn 50% Per Sale',
  description: 'Partner with PawCraft and earn 50% commission on every dog training plan you refer. $13.50 per sale, monthly payouts, no cap.',
  openGraph: {
    title: 'PawCraft Affiliate Program — Earn 50% Per Sale',
    description: 'Partner with PawCraft and earn 50% commission on every dog training plan you refer.',
    url: '/affiliates',
    type: 'website',
  },
  alternates: {
    canonical: '/affiliates',
  },
}

const STEPS = [
  {
    num: '01',
    title: 'Get your link',
    body: 'We give you a unique referral link. Share it anywhere — stories, blog posts, newsletters, YouTube descriptions.',
  },
  {
    num: '02',
    title: 'Your audience buys',
    body: 'They land, they pay $27, they get their custom 30-day plan. Our conversion-tested funnel converts at 6–8%, so it does the selling for you.',
  },
  {
    num: '03',
    title: 'You get paid',
    body: 'We track every sale tied to your link. Monthly payouts via PayPal or Wise. No thresholds, no delays.',
  },
]

const FIT_CARDS = [
  {
    icon: '📝',
    title: 'Dog bloggers & content sites',
    body: 'Training content already drives purchase intent. Add your link to "best tips" articles and breed guides.',
  },
  {
    icon: '📧',
    title: 'Newsletter writers',
    body: 'A single mention in a dedicated dog newsletter outperforms most paid placements. High intent, low friction.',
  },
  {
    icon: '📌',
    title: 'Pinterest & social creators',
    body: 'Dog training is one of the top-performing niches on Pinterest. Your pins compound over time.',
  },
  {
    icon: '🎙️',
    title: 'Podcasters & YouTubers',
    body: 'Verbal shoutouts with a unique link convert well. Easy to mention, easy to track, easy to earn.',
  },
]

const PRODUCT_FEATURES = [
  'Breed-specific training approach, not generic tips',
  'Day-by-day 30-session structure',
  'Adapts to puppy vs adult vs rescue',
  'Covers the #1 problem the owner flags in the form',
  'Instant PDF delivery, no waiting',
  'No subscription — zero buyer hesitation',
]

export default function AffiliatesPage() {
  return (
    <>
      {/* NAV */}
      <nav className={s.nav}>
        <div className={s.container}>
          <Link href="/" className={s.navLogo}>
            Paw<span>Craft</span>
          </Link>
          <div className={s.navBadge}>Partner Program</div>
        </div>
      </nav>

      {/* HERO */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroEyebrow}>Revenue Share Partnership</div>
          <h1>
            Earn 50% on every dog owner you send our way — <em>forever</em>
          </h1>
          <p className={s.heroSub}>
            PawCraft turns any dog owner into a trained-dog parent in 30 days. You share the link. We handle everything else.
          </p>
          <div className={s.heroCtaGroup}>
            <a
              href="mailto:hello@mypawcraft.com?subject=Affiliate%20Partner%20Application"
              className={s.btnPrimary}
            >
              Apply to partner →
            </a>
            <a href="#how-it-works" className={s.btnGhost}>
              How it works
            </a>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className={s.statsStrip}>
        <div className={s.statCell}>
          <span className={s.statNum}>$27</span>
          <span className={s.statLabel}>One-time product price</span>
        </div>
        <div className={s.statCell}>
          <span className={s.statNum}>50%</span>
          <span className={s.statLabel}>Your commission, always</span>
        </div>
        <div className={s.statCell}>
          <span className={s.statNum}>$13.50</span>
          <span className={s.statLabel}>Per sale, no cap</span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className={s.section} id="how-it-works">
        <div className={s.container}>
          <span className={s.sectionLabel}>Simple by design</span>
          <h2 className={s.h2}>Three steps from your first share <em>to your first payout</em></h2>
          <div className={s.stepsGrid}>
            {STEPS.map((step) => (
              <div key={step.num} className={s.stepCard}>
                <div className={s.stepNum}>{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMISSION */}
      <section className={s.sectionDark}>
        <div className={s.container}>
          <div className={s.commissionCard}>
            <div className={s.commissionLeft}>
              <h2>A fair deal, <em>built for the long run</em></h2>
              <p>
                No sliding scales, no expiring commissions, no fine print. If your link drove the sale, you get half.
                We want partners who stay — so we made the terms worth staying for.
              </p>
            </div>
            <div className={s.commissionRight}>
              <div className={s.commRow}>
                <span className={s.commLabel}>Product price</span>
                <span className={s.commValue}>$27</span>
              </div>
              <div className={`${s.commRow} ${s.commRowHighlight}`}>
                <span className={s.commLabel}>Your cut per sale</span>
                <span className={s.commValue}>$13.50</span>
              </div>
              <div className={s.commRow}>
                <span className={s.commLabel}>1 sale / day</span>
                <span className={s.commValue}>$405 / mo</span>
              </div>
              <div className={s.commRow}>
                <span className={s.commLabel}>10 sales / day</span>
                <span className={s.commValue}>$4,050 / mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT */}
      <section className={s.sectionAlt}>
        <div className={s.container}>
          <span className={s.sectionLabel}>What you&apos;re promoting</span>
          <h2 className={s.h2}>A product your audience <em>actually wants</em></h2>
          <div className={s.productCard}>
            <div className={s.productLeft}>
              <h3>30-day personalized dog training plan</h3>
              <span className={s.pricePill}>One-time · $27</span>
              <p>
                Each plan is fully personalised to the dog&apos;s breed, age, and the owner&apos;s specific problem —
                from basic obedience to separation anxiety. Delivered instantly as a PDF.
              </p>
            </div>
            <ul className={s.featureList}>
              {PRODUCT_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* WHO THIS WORKS FOR */}
      <section className={s.section}>
        <div className={s.container}>
          <span className={s.sectionLabel}>Who this works for</span>
          <h2 className={s.h2}>If your audience includes dog owners, <em>there&apos;s a fit here</em></h2>
          <div className={s.fitGrid}>
            {FIT_CARDS.map((card) => (
              <div key={card.title} className={s.fitCard}>
                <span className={s.fitIcon}>{card.icon}</span>
                <h4>{card.title}</h4>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKING NOTE */}
      <div className={s.trackingWrap}>
        <div className={s.container}>
          <div className={s.trackingNote}>
            <span className={s.trackingIcon}>🔗</span>
            <div>
              <h4>How we track your sales</h4>
              <p>
                You get a unique link with your handle (e.g.{' '}
                <strong>mypawcraft.com/?ref=yourname</strong>). Every click sets a 30-day cookie. If they buy within
                that window, the sale is yours — even if they come back days later. We log every conversion in real
                time and share a monthly report before payout.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA BOTTOM */}
      <div className={s.finalCta}>
        <div className={s.containerNarrow}>
          <h2>Ready to start <em>earning?</em></h2>
          <p>
            Send us a quick note with who you are and where your audience lives. We&apos;ll get you set up within 24 hours.
          </p>
          <a
            href="mailto:hello@mypawcraft.com?subject=Affiliate%20Partner%20Application"
            className={s.btnPrimary}
          >
            Apply now — it&apos;s free →
          </a>
          <p className={s.contactLine}>
            Or reach out directly at{' '}
            <a href="mailto:hello@mypawcraft.com">hello@mypawcraft.com</a>
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <Image src="/icon.png" alt="PawCraft" width={32} height={32} className={s.footerIcon} />
          </div>
          <p className={s.footerTagline}>30-day personalised dog training plans</p>
          <div className={s.footerSocial}>
            <a href="https://www.instagram.com/trypawcraft/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="https://www.tiktok.com/@seraphova" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <FaTiktok />
            </a>
            <a href="mailto:hello@mypawcraft.com" aria-label="Contact">
              <HiOutlineMail />
            </a>
          </div>
          <p className={s.footerLegal}>© 2026 PawCraft · All commissions tracked and paid monthly</p>
        </div>
      </footer>
    </>
  )
}
