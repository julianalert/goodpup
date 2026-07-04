import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram, FaTiktok } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import { FaqItem, AnimateOnScroll } from './_components/HomeComponents'
import NavToolsDropdown from './_components/NavToolsDropdown'
import { LIST_PRICE_LABEL, PRICE_LABEL } from '@/lib/pricing'
import s from './page.module.css'

export const metadata: Metadata = {
  title: "PawCraft — Your Dog's Personalized 30-Day Training Plan",
  description: 'AI-powered personalised dog training plans. Breed-specific, problem-focused, and ready to work.',
  openGraph: {
    title: "PawCraft — Your Dog's Personalized 30-Day Training Plan",
    description: 'AI-powered personalised dog training plans. Breed-specific, problem-focused, and ready to work.',
    url: '/',
    type: 'website',
  },
  twitter: {
    title: "PawCraft — Your Dog's Personalized 30-Day Training Plan",
    description: 'AI-powered personalised dog training plans. Breed-specific, problem-focused, and ready to work.',
  },
  alternates: {
    canonical: '/',
  },
}

const FAQ_ITEMS = [
  {
    question: "How personalised is this really?",
    answer: "Very. The plan is generated from scratch for your dog based on their breed (including breed-specific temperament and drive levels), age, your top behaviour problems, how much time you can train per day, and whether you live in an apartment, house, or rural setting. Two dogs of different breeds or ages will receive completely different plans.",
  },
  {
    question: "What if my dog's breed is unusual or mixed?",
    answer: 'No problem. You can enter any breed or mix. If your dog is a mixed breed, describe the dominant mix (e.g. "Lab/Shepherd mix") and the AI will account for the behavioural traits of both breeds when building the plan.',
  },
  {
    question: "How quickly will I see results?",
    answer: "Most owners notice a meaningful difference within the first 2 weeks when following the plan consistently. Week 1 focuses on building the foundational habits that everything else rests on. Don't skip it, even if the exercises feel basic.",
  },
  {
    question: "I'm a first-time dog owner. Is this too advanced for me?",
    answer: "No. We ask about your experience level in the form and the plan adapts accordingly. First-time owners get more explanation and simpler progressions. The plan is written in plain language with no jargon.",
  },
  {
    question: "What if I'm not happy with the plan?",
    answer: "We offer a 30-day money-back guarantee, no questions asked. If the plan isn't useful to you, email us and we'll refund you immediately.",
  },
  {
    question: "Is this a subscription?",
    answer: `No. It's a one-time ${PRICE_LABEL} payment. You get the plan, it's yours forever, and you'll never be charged again. No hidden fees.`,
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* NAV */}
      <nav className={s.nav}>
        <Link href="/" className={s.navLogo}>
          <img src="/icon.png" alt="" className="appIcon" width={28} height={28} />
          Paw<span>Craft</span>
        </Link>
        <div className={s.navLinks}>
          <Link href="/dogs" className={s.navLink}>Dogs</Link>
          <Link href="/blog" className={s.navLink}>Blog</Link>
          <NavToolsDropdown />
        </div>
        <a href="#pricing" className={s.navCta}>Get my plan →</a>
      </nav>

      {/* HERO */}
      <div className={s.hero}>
        <div className={s.container}>
          <div className={s.heroEyebrow}>🐕 Built for your dog, not a template</div>
          <h1>A personalized training plan for your dog,<br /><em>built in minutes.</em></h1>
          <p className={s.heroSub}>Answer a few questions about your dog and get a custom training plan that actually fits them: no generic advice, no guesswork.</p>
          <div className={s.heroCtaGroup}>
            <Link href="/form" className={s.btnPrimary}>Build my dog&apos;s plan 🐾</Link>
            <span className={s.heroMicro}>🐶 Works for any breed, any age, any behavior</span>
          </div>
        </div>
      </div>

      {/* PROOF BAR */}
      <div className={s.proofBar}>
        <div className={s.proofItem}><span className={s.proofIcon}>🐾</span> <strong>2,400+</strong> plans generated</div>
        <div className={s.proofItem}><span className={s.proofIcon}>⭐</span> <strong>4.9/5</strong> average rating</div>
        <div className={s.proofItem}><span className={s.proofIcon}>🐕</span> <strong>180+</strong> breeds covered</div>
        <div className={s.proofItem}><span className={s.proofIcon}>⚡</span> Delivered in under 60 seconds</div>
      </div>

      {/* PROBLEM SECTION */}
      <section className={s.section}>
        <div className={s.container}>
          <AnimateOnScroll className={s.problemIntro}>
            <span className={s.sectionLabel}>The problem</span>
            <h2 className={s.h2}>You&apos;ve tried everything.<br /><em>Nothing sticks.</em></h2>
            <p className={s.lead}>Sound familiar? You&apos;ve watched the YouTube videos, read the Reddit threads, maybe even hired a trainer for a session or two. And yet…</p>
          </AnimateOnScroll>

          <div className={s.problemList}>
            {[
              { emoji: '🦮', title: 'The pulling hasn\'t stopped', body: 'Every walk is a battle. You\'ve tried stopping, turning, treats, but nothing lasts more than a few minutes before it\'s back to tug of war.' },
              { emoji: '🔊', title: 'The barking is ruining your peace', body: 'At the mailman, the neighbours, other dogs, shadows. You\'ve stopped having friends over because you\'re embarrassed. You\'ve tried "quiet." It doesn\'t work.' },
              { emoji: '😤', title: 'Obeys at home, ignores you outside', body: 'Your dog sits perfectly in the living room. Outside? It\'s like you don\'t exist. Every distraction wipes out every command you\'ve ever taught.' },
              { emoji: '📱', title: 'Generic advice doesn\'t fit your dog', body: 'The tips are written for "dogs." Not for your 2-year-old, high-energy Border Collie who\'s lived in an apartment his whole life and fixates on cyclists.' },
            ].map((item) => (
              <AnimateOnScroll key={item.title} className={s.problemItem}>
                <span className={s.problemEmoji}>{item.emoji}</span>
                <div className={s.problemContent}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          <AnimateOnScroll className={s.agitateBox}>
            <p><strong>Here&apos;s the uncomfortable truth:</strong> the reason most dog training advice fails is not that you&apos;re a bad owner. It&apos;s that the advice wasn&apos;t built for your dog.</p>
            <p>Generic YouTube videos, one-size-fits-all guides, and even group classes treat every dog the same. But a reactive 18-month-old Malinois and a food-obsessed 5-year-old Labrador need completely different approaches. <strong>Following the wrong plan doesn&apos;t just waste time. It can make things worse.</strong></p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* WHY GENERIC FAILS */}
      <section className={s.sectionAlt}>
        <div className={s.container}>
          <span className={s.sectionLabel}>Why it keeps failing</span>
          <h2 className={s.h2}>The advice that&apos;s <em>everywhere</em><br />is built for no one.</h2>
          <p className={s.lead}>Online dog training content is optimised for clicks, not results. Here&apos;s why it almost always falls short for your specific situation.</p>

          <div className={s.whyGrid}>
            {[
              { icon: '🎯', title: 'Breed drives are ignored', body: 'A Border Collie has herding instincts that make leash reactivity almost inevitable without the right outlets. A Beagle is nose-driven to the point of selective deafness. Generic advice skips all of this.' },
              { icon: '📅', title: 'Age changes everything', body: 'Adolescent dogs (1–2 years) are neurologically rewiring. Techniques that work on puppies actively fail on teenagers. And senior dogs have physical limits that most guides completely ignore.' },
              { icon: '🏙️', title: 'Your environment matters', body: 'Training a dog in an apartment on a busy city street is a completely different challenge from training one in a suburban garden. Same dog, radically different approach needed.' },
              { icon: '🔗', title: 'Root cause vs symptoms', body: 'Barking, pulling, and jumping are symptoms. The cause is usually under-stimulation, anxiety, or unmet breed needs. Treating the symptom while ignoring the cause creates a revolving door of new problems.' },
            ].map((card) => (
              <AnimateOnScroll key={card.title} className={s.whyCard}>
                <span className={s.whyCardIcon}>{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSFORMATION LISTICLE */}
      <section className={s.sectionAlt}>
        <div className={s.container}>
          <AnimateOnScroll className={s.transformIntro}>
            <span className={s.sectionLabel}>The dog you deserve</span>
            <h2 className={s.h2}>If this is the dog<br /><em>you want…</em></h2>
          </AnimateOnScroll>

          <div className={s.transformGrid}>
            {[
              { emoji: '🦮', text: 'A dog that doesn\'t pull on the leash' },
              { emoji: '🤝', text: 'A dog that trusts you, and you trust them' },
              { emoji: '🏠', text: 'A dog that doesn\'t destroy anything' },
              { emoji: '💡', text: 'A dog you actually understand' },
              { emoji: '🦘', text: 'A dog that doesn\'t jump on everyone' },
              { emoji: '📣', text: 'A dog that comes back when called and can be off-leash' },
              { emoji: '🎓', text: 'A dog that knows a wide range of commands' },
              { emoji: '👂', text: 'A dog that listens in any situation' },
              { emoji: '🗺️', text: 'A dog you can take anywhere' },
              { emoji: '😌', text: 'A happy dog, settled and at ease in their own skin' },
              { emoji: '💚', text: 'A dog that won\'t develop behavioural disorders' },
              { emoji: '🎯', text: 'A dog that stays focused even around other dogs' },
            ].map((item) => (
              <AnimateOnScroll
                key={item.text}
                className={s.transformItem}
              >
                <span className={s.transformCheck}>{item.emoji}</span>
                <span>{item.text}</span>
              </AnimateOnScroll>
            ))}
          </div>

          <AnimateOnScroll className={s.transformCta}>
            <p>…then you need a plan built around <em>your</em> dog. Not a generic guide. Not a YouTube video. Not another course. A real, structured program that addresses the root cause, not just the symptoms.</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* SOLUTION */}
      <section className={s.section}>
        <div className={s.container}>
          <AnimateOnScroll className={s.solutionIntro}>
            <span className={s.sectionLabel}>The solution</span>
            <h2 className={s.h2}>A training plan built <em>around<br />your actual dog.</em></h2>
            <p className={s.lead}>PawCraft uses AI to do what a $150/hr private trainer would do in an initial consultation: analyse your dog&apos;s specific profile and build a step-by-step program from scratch. In 60 seconds. For {PRICE_LABEL}.</p>
          </AnimateOnScroll>

          <div className={s.solutionSteps}>
            {[
              { n: '1', title: 'You tell us about your dog', body: 'Breed, age, main problems, how much time you have, where you live. Takes about 2 minutes. No account needed, no subscription required.' },
              { n: '2', title: 'Our AI builds the plan', body: 'In under 60 seconds, it analyses your dog\'s breed temperament, identifies the root cause of each problem, and generates a day-by-day 30-day program written specifically for your dog\'s profile.' },
              { n: '3', title: 'You get a complete, ready-to-use plan', body: 'Delivered straight to your inbox. No app to download. No video library to navigate. Just a clear, structured plan you can start today.' },
            ].map((step) => (
              <AnimateOnScroll key={step.n} className={s.solutionStep}>
                <div className={s.stepNumber}>{step.n}</div>
                <div className={s.stepContent}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className={s.sectionDark}>
        <div className={s.container}>
          <span className={`${s.sectionLabel} ${s.sectionLabelLight}`}>What&apos;s inside your plan</span>
          <h2 className={`${s.h2} ${s.h2Light}`}>Everything a private trainer<br />would charge <em>$150 for.</em></h2>
          <p className={`${s.lead} ${s.leadLight}`}>Your plan is a full 30-day document covering five sections, all written for your dog specifically.</p>

          <div className={s.deliverables}>
            {[
              { icon: '🔬', title: 'Breed & temperament diagnostic', body: 'Understand why your dog behaves the way they do: drive levels, trainability score, breed-specific instincts, and the root cause of their specific issues.' },
              { icon: '📅', title: 'Day-by-day 30-day program', body: 'Every day planned out: what to do, for how long, what success looks like. No guessing what comes next.' },
              { icon: '🏋️', title: 'Detailed exercises with timing', body: 'Each exercise comes with step-by-step instructions, exact duration, frequency, and how to know when your dog has got it.' },
              { icon: '⚠️', title: 'Mistakes to avoid for your breed & age', body: 'The most common owner errors that kill progress, specific to your dog\'s breed, age, and problems. Not generic tips. Actual landmines to dodge.' },
              { icon: '✅', title: 'Weekly progress checklist', body: 'Concrete milestones for each week so you know exactly when you\'re ready to move forward, and when to repeat a phase.' },
              { icon: '💡', title: 'Root cause explanation', body: 'A plain-English breakdown of why your dog does what they do, so you understand the logic behind every exercise and can adapt when needed.' },
            ].map((d) => (
              <AnimateOnScroll key={d.title} className={s.deliverable}>
                <span className={s.deliverableIcon}>{d.icon}</span>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className={s.sectionAlt}>
        <div className={s.container}>
          <span className={s.sectionLabel}>How it compares</span>
          <h2 className={s.h2}>The plan that makes sense<br />at <em>every level.</em></h2>
          <p className={s.lead}>You could spend $300+ on a group course or $600+ on private sessions. Or you could start here with something built for your dog, for {PRICE_LABEL}.</p>

          <table className={s.vsTable}>
            <thead>
              <tr>
                <th></th>
                <th>Generic guides / YouTube</th>
                <th>PawCraft</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Built for your breed &amp; age</td><td><span className={s.cross}>✕ One size fits all</span></td><td><span className={s.check}>✓ Yes, fully personalised</span></td></tr>
              <tr><td>Addresses root causes</td><td><span className={s.cross}>✕ Treats symptoms only</span></td><td><span className={s.check}>✓ Diagnosis + solution</span></td></tr>
              <tr><td>Day-by-day structured plan</td><td><span className={s.cross}>✕ Random tips &amp; videos</span></td><td><span className={s.check}>✓ 30 days, fully mapped</span></td></tr>
              <tr><td>Works for your living situation</td><td><span className={s.cross}>✕ Assumes you have a garden</span></td><td><span className={s.check}>✓ Apartment, house, rural</span></td></tr>
              <tr><td>Ready to start today</td><td><span className={s.cross}>✕ Hours of videos to watch first</span></td><td><span className={s.check}>✓ In your inbox in 60 sec</span></td></tr>
              <tr><td>Cost</td><td>Free (but costs you time &amp; frustration)</td><td><strong style={{ color: 'var(--green)' }}>{PRICE_LABEL}, one-time</strong></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className={s.section}>
        <div className={s.container}>
          <span className={s.sectionLabel}>Real results</span>
          <h2 className={s.h2}>What dog owners are saying</h2>

          <div className={s.testimonialsGrid}>
            {[
              { initials: 'SL', name: 'Sarah L.', dog: 'Koda · Husky · 2 years', quote: 'I\'ve spent $400 on group classes and nothing clicked. This plan finally explained WHY Koda does what he does, and within 2 weeks the leash pulling has dropped by like 80%.' },
              { initials: 'MR', name: 'Marcus R.', dog: 'Pepper · Aussie Shepherd · 18 months', quote: 'The breed diagnostic section alone was worth it. I didn\'t realise half of Pepper\'s \'bad\' behaviour was just her herding instincts with no outlet. Game changer.' },
              { initials: 'JK', name: 'Jamie K.', dog: 'Bruno · French Bulldog · 3 years', quote: `My trainer quoted me $600 for a 6-session package. I tried this first for ${PRICE_LABEL} and honestly, the plan is more detailed than what the trainer gave me in session 1.` },
            ].map((t) => (
              <AnimateOnScroll key={t.name} className={s.testimonial}>
                <div className={s.stars}>★★★★★</div>
                <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
                <div className={s.testimonialAuthor}>
                  <div className={s.authorAvatar}>{t.initials}</div>
                  <div className={s.authorInfo}>
                    <div className={s.authorName}>{t.name}</div>
                    <div className={s.authorDog}>{t.dog}</div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className={s.sectionAlt} id="pricing">
        <div className={s.containerNarrow}>
          <div style={{ textAlign: 'center', marginBottom: 0 }}>
            <span className={s.sectionLabel} style={{ display: 'block', textAlign: 'center' }}>Simple pricing</span>
            <h2 className={s.h2} style={{ textAlign: 'center' }}>One plan. One price.<br /><em>Zero surprises.</em></h2>
          </div>

          <div className={s.valueAnchor}>
            <div className={s.valueAnchorItem}>
              <span className={s.vaLabel}>Private trainer</span>
              <span className={s.vaValue}>$100–$150/hr</span>
            </div>
            <div className={s.vaDivider}></div>
            <div className={s.valueAnchorItem}>
              <span className={s.vaLabel}>Group course</span>
              <span className={s.vaValue}>$200–$400</span>
            </div>
            <div className={s.vaDivider}></div>
            <div className={s.valueAnchorItem}>
              <span className={s.vaLabel}>PawCraft</span>
              <span className={s.vaValue} style={{ color: 'var(--green)' }}>{PRICE_LABEL}</span>
            </div>
          </div>

          <div className={s.pricingCard}>
            <div className={s.pricingBadge}>Most popular</div>
            <div className={s.priceDisplay}>
              <span className={s.priceOld}>{LIST_PRICE_LABEL}</span>
              <span className={s.priceNew}>{PRICE_LABEL}</span>
            </div>
            <div className={s.priceSub}>One-time payment · No subscription · Instant delivery</div>
            <ul className={s.priceFeatures}>
              {['Breed & temperament diagnostic', 'Complete 30-day day-by-day program', 'Detailed exercises with duration & frequency', 'Breed-specific mistakes to avoid', 'Weekly progress checklist', 'Delivered as an interaqctive plan to your inbox', 'Works for any breed, age, or problem'].map((f) => (
                <li key={f} className={s.priceFeature}>{f}</li>
              ))}
            </ul>
            <Link href="/form" className={s.btnCtaMain}>Build my dog&apos;s plan →</Link>
            <div className={s.pricingMicro}>
              🔒 Secure payment · 30-day money-back guarantee<br />
              No account needed · Works on any device
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={s.section}>
        <div className={s.containerNarrow}>
          <span className={s.sectionLabel}>Got questions</span>
          <h2 className={s.h2}>Everything you <em>need to know</em></h2>

          <div className={s.faqList}>
            {FAQ_ITEMS.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <div className={s.finalCta}>
        <div className={s.containerNarrow}>
          <h2>Stop guessing.<br /><em>Start with the right plan.</em></h2>
          <p>Your dog isn&apos;t bad. They just need an approach built for them, not a recycled guide written for every dog on the planet.</p>
          <Link href="/form" className={s.btnPrimary}>Get my dog&apos;s plan for {PRICE_LABEL}</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <div className={s.footerBrand}>
            <Image src="/icon.png" alt="PawCraft" width={32} height={32} className={s.footerIcon} />
          </div>
          <p className={s.footerTagline}>30-day personalised dog training plans</p>
          <Link href="/dogs" className={s.footerDogsLink}>
            Browse all breed training guides →
          </Link>
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
          <p className={s.footerLegal}>© 2026 PawCraft. Results may vary. Always consult a veterinary professional for medical or severe behavioural issues.</p>
        </div>
      </footer>
    </>
  )
}
