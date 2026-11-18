import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import {
  PiArrowRightBold,
  PiBrainFill,
  PiBuildingsFill,
  PiCalendarCheckFill,
  PiCheckBold,
  PiCheckCircleFill,
  PiClockFill,
  PiDogFill,
  PiEarFill,
  PiEnvelopeSimpleFill,
  PiLightningFill,
  PiListChecksFill,
  PiLockSimpleFill,
  PiMagnifyingGlassFill,
  PiPawPrintFill,
  PiPersonSimpleWalkFill,
  PiQuotesFill,
  PiSealCheckFill,
  PiShieldCheckFill,
  PiSparkleFill,
  PiSpeakerHighFill,
  PiStarFill,
  PiBarbellFill,
  PiHouseLineFill,
  PiTreeFill,
  PiWarningFill,
  PiXCircleFill,
  PiYoutubeLogoFill,
} from 'react-icons/pi'
import { FaqItem, AnimateOnScroll } from './_components/HomeComponents'
import SiteNav from './_components/SiteNav'
import { LIST_PRICE_LABEL, PRICE_LABEL } from '@/lib/pricing'
import { SITE_EMAIL } from '@/lib/site'
import s from './page.module.css'

import ownerPhoto from '@/public/images/dog-size-calculator.png'
import guiltyPhoto from '@/public/images/how-big-will-my-puppy-get.png'
import beaglePhoto from '@/public/images/dog-bmi-calculator.png'
import walkPhoto from '@/public/images/dog-size-calculator-2.png'
import calmPhoto from '@/public/images/dog-bmi.png'

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

const BREEDS = [
  'Labrador Retriever', 'French Bulldog', 'Golden Retriever', 'German Shepherd', 'Border Collie',
  'Siberian Husky', 'Beagle', 'Australian Shepherd', 'Dachshund', 'Poodle', 'Cavapoo', 'Boxer',
  'Corgi', 'Belgian Malinois', 'Shih Tzu', 'Cocker Spaniel', 'Pit Bull Terrier', 'Rescue mix',
  'Bernese Mountain Dog', 'Jack Russell', 'Vizsla', 'Labradoodle', 'Rottweiler', 'Shiba Inu',
]

const WISHES = [
  'A dog that doesn\'t pull on the leash',
  'A dog that trusts you, and you trust them',
  'A dog that doesn\'t destroy anything',
  'A dog you actually understand',
  'A dog that doesn\'t jump on everyone',
  'A dog that comes back when called and can be off-leash',
  'A dog that knows a wide range of commands',
  'A dog that listens in any situation',
  'A dog you can take anywhere',
  'A happy dog, settled and at ease in their own skin',
  'A dog that won\'t develop behavioural disorders',
  'A dog that stays focused even around other dogs',
]

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* NAV */}
      <SiteNav ctaHref="#pricing" ctaLabel="Get my plan →" />

      {/* HERO */}
      <header className={s.hero}>
        <div className={s.heroGrid}>
          <div className={s.heroCopy}>
            <div className={s.heroEyebrow}><PiSparkleFill aria-hidden="true" /> Built for your dog, not a template</div>
            <h1>A personalized training plan for your dog, <em>built in minutes.</em></h1>
            <p className={s.heroSub}>Answer a few questions about your dog and get a custom training plan that actually fits them: no generic advice, no guesswork.</p>
            <div className={s.heroCtaRow}>
              <Link href="/form" className={s.btnPrimary}>
                Build my dog&apos;s plan <PiArrowRightBold aria-hidden="true" />
              </Link>
              <a href="#inside" className={s.btnGhost}>See what&apos;s inside</a>
            </div>
            <div className={s.heroTrust}>
              <div className={s.avatarStack} aria-hidden="true">
                {[guiltyPhoto, beaglePhoto, walkPhoto, calmPhoto].map((p, i) => (
                  <span key={i}><Image src={p} alt="" fill sizes="44px" /></span>
                ))}
              </div>
              <div>
                <div className={s.heroStars}>
                  <span aria-hidden="true">★★★★★</span> <strong>4.9/5</strong>
                </div>
                <div className={s.heroTrustText}>Works for any breed, any age, any behavior</div>
              </div>
            </div>
          </div>

          <div className={s.heroVisual}>
            <div className={s.heroBackdrop} aria-hidden="true" />
            <div className={s.heroPhoto}>
              <Image
                src={ownerPhoto}
                alt="Smiling woman hugging her Australian Shepherd on a porch swing"
                fill
                sizes="(max-width: 960px) 90vw, 540px"
                placeholder="blur"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            <div className={`${s.floatCard} ${s.floatDrive}`} aria-hidden="true">
              <div className={s.fdRow}><span>Herding drive</span><strong>Very high</strong></div>
              <div className={s.miniBar}><span style={{ width: '90%' }} /></div>
            </div>

            <div className={`${s.floatCard} ${s.floatToday}`} aria-hidden="true">
              <div className={s.ftLabel}><PiCalendarCheckFill /> Today · Day 12</div>
              <div className={s.ftTitle}>Loose-leash U-turns</div>
              <div className={s.ftBadges}><span>2 × 8 min</span><span>Hallway → street</span></div>
            </div>

            <div className={`${s.floatCard} ${s.floatPlan}`} aria-hidden="true">
              <div className={s.fpHead}>
                <span className={s.fpIcon}><PiPawPrintFill /></span>
                <div>
                  <div className={s.fpTitle}>Milo&apos;s 30-day plan</div>
                  <div className={s.fpMeta}>Australian Shepherd · 18 mo</div>
                </div>
              </div>
              <div className={s.fpProgressLabel}><span>Week 2 of 4</span><span>40%</span></div>
              <div className={s.miniBar}><span style={{ width: '40%' }} /></div>
            </div>
          </div>
        </div>
      </header>

      {/* STATS + BREED MARQUEE */}
      <section className={s.stats} aria-label="PawCraft in numbers">
        <div className={s.statsGrid}>
          {[
            { Icon: PiPawPrintFill, n: '2,400+', l: 'plans generated' },
            { Icon: PiStarFill, n: '4.9/5', l: 'average rating' },
            { Icon: PiDogFill, n: '180+', l: 'breeds covered' },
            { Icon: PiLightningFill, n: '< 60 sec', l: 'to get your plan' },
          ].map(({ Icon, n, l }) => (
            <div key={l} className={s.stat}>
              <span className={s.statIcon} aria-hidden="true"><Icon /></span>
              <div>
                <div className={s.statNum}>{n}</div>
                <div className={s.statLabel}>{l}</div>
              </div>
            </div>
          ))}
        </div>
        <div className={s.marquee} aria-hidden="true">
          <div className={s.marqueeTrack}>
            {[...BREEDS, ...BREEDS].map((b, i) => (
              <span key={i} className={s.breedChip}><PiPawPrintFill /> {b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className={s.section}>
        <div className={s.wrap}>
          <div className={s.problemGrid}>
            <AnimateOnScroll className={s.problemPhotoCol}>
              <div className={s.problemPhoto}>
                <Image
                  src={guiltyPhoto}
                  alt="Golden retriever sitting next to a puddle on the floor, looking guilty"
                  fill
                  sizes="(max-width: 960px) 90vw, 440px"
                  placeholder="blur"
                />
                <div className={s.photoSticker}>Sound familiar?</div>
              </div>
            </AnimateOnScroll>

            <div>
              <AnimateOnScroll className={s.problemIntro}>
                <span className={s.sectionLabel}>The problem</span>
                <h2 className={s.h2}>You&apos;ve tried everything.<br /><em>Nothing sticks.</em></h2>
                <p className={s.lead}>Sound familiar? You&apos;ve watched the YouTube videos, read the Reddit threads, maybe even hired a trainer for a session or two. And yet…</p>
              </AnimateOnScroll>

              <div className={s.problemCards}>
                {[
                  { Icon: PiPersonSimpleWalkFill, tone: s.tileCoral, title: 'The pulling hasn\'t stopped', body: 'Every walk is a battle. You\'ve tried stopping, turning, treats, but nothing lasts more than a few minutes before it\'s back to tug of war.' },
                  { Icon: PiSpeakerHighFill, tone: s.tileAmber, title: 'The barking is ruining your peace', body: 'At the mailman, the neighbours, other dogs, shadows. You\'ve stopped having friends over because you\'re embarrassed. You\'ve tried "quiet." It doesn\'t work.' },
                  { Icon: PiEarFill, tone: s.tileGreen, title: 'Obeys at home, ignores you outside', body: 'Your dog sits perfectly in the living room. Outside? It\'s like you don\'t exist. Every distraction wipes out every command you\'ve ever taught.' },
                  { Icon: PiYoutubeLogoFill, tone: s.tileInk, title: 'Generic advice doesn\'t fit your dog', body: 'The tips are written for "dogs." Not for your 2-year-old, high-energy Border Collie who\'s lived in an apartment his whole life and fixates on cyclists.' },
                ].map(({ Icon, tone, title, body }, i) => (
                  <AnimateOnScroll key={title} delay={i * 80}>
                    <div className={s.problemCard}>
                      <span className={`${s.iconTile} ${tone}`} aria-hidden="true"><Icon /></span>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>

          <AnimateOnScroll className={s.truthBox}>
            <span className={s.truthIcon} aria-hidden="true"><PiWarningFill /></span>
            <div>
              <p><strong>Here&apos;s the uncomfortable truth:</strong> the reason most dog training advice fails is not that you&apos;re a bad owner. It&apos;s that the advice wasn&apos;t built for your dog.</p>
              <p>Generic YouTube videos, one-size-fits-all guides, and even group classes treat every dog the same. But a reactive 18-month-old Malinois and a food-obsessed 5-year-old Labrador need completely different approaches. <strong>Following the wrong plan doesn&apos;t just waste time. It can make things worse.</strong></p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* WHY GENERIC FAILS */}
      <section className={s.sectionWhite}>
        <div className={s.wrap}>
          <div className={s.sectionHead}>
            <span className={s.sectionLabel}>Why it keeps failing</span>
            <h2 className={s.h2}>The advice that&apos;s <em>everywhere</em><br />is built for no one.</h2>
            <p className={s.lead}>Online dog training content is optimised for clicks, not results. Here&apos;s why it almost always falls short for your specific situation.</p>
          </div>

          <div className={s.bento}>
            <AnimateOnScroll className={s.bentoPhoto}>
              <Image
                src={beaglePhoto}
                alt="Beagle with its nose to the grass while its owner calls it from across a park"
                fill
                sizes="(max-width: 960px) 90vw, 400px"
                placeholder="blur"
              />
              <div className={s.bentoCaption}>
                <span className={s.capTag}>Real-world example</span>
                <p>Nose down, ears off. A Beagle&apos;s scent drive beats a generic recall drill every time.</p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll className={s.bentoCard} delay={60}>
              <span className={`${s.iconTile} ${s.tileGreen}`} aria-hidden="true"><PiDogFill /></span>
              <h3>Breed drives are ignored</h3>
              <p>A Border Collie has herding instincts that make leash reactivity almost inevitable without the right outlets. A Beagle is nose-driven to the point of selective deafness. Generic advice skips all of this.</p>
              <div className={s.bentoViz} aria-hidden="true">
                <div className={s.vizTitle}>Border Collie · drive profile</div>
                {[['Herding', 95], ['Prey', 62], ['Scent', 38]].map(([label, v]) => (
                  <div key={label} className={s.meterRow}>
                    <span>{label}</span>
                    <div className={s.miniBar}><span style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll className={s.bentoCard} delay={120}>
              <span className={`${s.iconTile} ${s.tileAmber}`} aria-hidden="true"><PiClockFill /></span>
              <h3>Age changes everything</h3>
              <p>Adolescent dogs (1–2 years) are neurologically rewiring. Techniques that work on puppies actively fail on teenagers. And senior dogs have physical limits that most guides completely ignore.</p>
              <div className={s.bentoViz} aria-hidden="true">
                <div className={s.ageLine}>
                  <span>Puppy</span>
                  <span className={s.ageHot}>Teen</span>
                  <span>Adult</span>
                  <span>Senior</span>
                </div>
                <div className={s.ageNote}>1–2 yrs: different brain, different plan</div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll className={s.bentoCard} delay={60}>
              <span className={`${s.iconTile} ${s.tileInk}`} aria-hidden="true"><PiBuildingsFill /></span>
              <h3>Your environment matters</h3>
              <p>Training a dog in an apartment on a busy city street is a completely different challenge from training one in a suburban garden. Same dog, radically different approach needed.</p>
              <div className={s.bentoViz} aria-hidden="true">
                <div className={s.envRow}>
                  <span><PiBuildingsFill /> Apartment</span>
                  <span><PiHouseLineFill /> House</span>
                  <span><PiTreeFill /> Rural</span>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll className={s.bentoCard} delay={120}>
              <span className={`${s.iconTile} ${s.tileCoral}`} aria-hidden="true"><PiMagnifyingGlassFill /></span>
              <h3>Root cause vs symptoms</h3>
              <p>Barking, pulling, and jumping are symptoms. The cause is usually under-stimulation, anxiety, or unmet breed needs. Treating the symptom while ignoring the cause creates a revolving door of new problems.</p>
              <div className={s.bentoViz} aria-hidden="true">
                <div className={s.iceLabel}>What you see</div>
                <div className={s.iceChips}><span>Barking</span><span>Pulling</span><span>Jumping</span></div>
                <div className={s.iceWater} />
                <div className={s.iceLabel}>What&apos;s really going on</div>
                <div className={`${s.iceChips} ${s.iceDeep}`}><span>Under-stimulation</span><span>Anxiety</span><span>Unmet breed needs</span></div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* TRANSFORMATION */}
      <section className={s.section}>
        <div className={s.wrap}>
          <div className={s.transformGrid}>
            <AnimateOnScroll className={s.transformPhotoCol}>
              <div className={s.transformPhoto}>
                <Image
                  src={walkPhoto}
                  alt="Man walking a relaxed Siberian Husky on a loose leash along a sunny forest path"
                  fill
                  sizes="(max-width: 960px) 90vw, 520px"
                  placeholder="blur"
                />
              </div>
              <div className={`${s.photoBadge} ${s.photoBadgeTop}`}><PiCheckCircleFill aria-hidden="true" /> Loose leash</div>
              <div className={`${s.photoBadge} ${s.photoBadgeBottom}`}><PiCheckCircleFill aria-hidden="true" /> Focused on you</div>
            </AnimateOnScroll>

            <div>
              <AnimateOnScroll>
                <span className={s.sectionLabel}>The dog you deserve</span>
                <h2 className={s.h2}>If this is the dog<br /><em>you want…</em></h2>
              </AnimateOnScroll>
              <ul className={s.wishList}>
                {WISHES.map((text) => (
                  <li key={text}><PiCheckCircleFill aria-hidden="true" /> <span>{text}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <AnimateOnScroll className={s.transformCta}>
            <p>…then you need a plan built around <em>your</em> dog. Not a generic guide. Not a YouTube video. Not another course. A real, structured program that addresses the root cause, not just the symptoms.</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={s.sectionWhite}>
        <div className={s.wrap}>
          <div className={s.sectionHeadCenter}>
            <span className={s.sectionLabel}>The solution</span>
            <h2 className={s.h2}>A training plan built <em>around<br />your actual dog.</em></h2>
            <p className={s.lead}>PawCraft uses AI to do what a $150/hr private trainer would do in an initial consultation: analyse your dog&apos;s specific profile and build a step-by-step program from scratch. In 60 seconds. For {PRICE_LABEL}.</p>
          </div>

          <div className={s.steps}>
            <AnimateOnScroll className={s.stepCard}>
              <div className={s.stepMock} aria-hidden="true">
                <div className={s.mockField}><span>Dog&apos;s name</span><div>Milo</div></div>
                <div className={s.mockField}><span>Breed</span><div>Australian Shepherd</div></div>
                <div className={s.mockFieldLabel}>Main problems</div>
                <div className={s.mockChips}>
                  <span className={s.mockChipOn}><PiCheckBold /> Leash pulling</span>
                  <span className={s.mockChipOn}><PiCheckBold /> Barking</span>
                  <span>Jumping</span>
                  <span>Recall</span>
                </div>
              </div>
              <div className={s.stepNum}>1</div>
              <h3>You tell us about your dog</h3>
              <p>Breed, age, main problems, how much time you have, where you live. Takes about 2 minutes. No account needed, no subscription required.</p>
            </AnimateOnScroll>

            <AnimateOnScroll className={s.stepCard} delay={100}>
              <div className={s.stepMock} aria-hidden="true">
                <div className={s.aiHead}><span className={s.aiSpark}><PiSparkleFill /></span> Building Milo&apos;s plan…</div>
                <ul className={s.aiList}>
                  <li className={s.aiDone}><PiCheckCircleFill /> Breed temperament analysed</li>
                  <li className={s.aiDone}><PiCheckCircleFill /> Root causes identified</li>
                  <li className={s.aiActive}><span className={s.aiDot} /> Scheduling 30 days of exercises</li>
                </ul>
                <div className={s.aiBar}><span /></div>
              </div>
              <div className={s.stepNum}>2</div>
              <h3>Our AI builds the plan</h3>
              <p>In under 60 seconds, it analyses your dog&apos;s breed temperament, identifies the root cause of each problem, and generates a day-by-day 30-day program written specifically for your dog&apos;s profile.</p>
            </AnimateOnScroll>

            <AnimateOnScroll className={s.stepCard} delay={200}>
              <div className={s.stepMock} aria-hidden="true">
                <div className={`${s.mailRow} ${s.mailDim}`}>
                  <span className={s.mailAvatarDim} />
                  <div><div className={s.mailLineA} /><div className={s.mailLineB} /></div>
                </div>
                <div className={`${s.mailRow} ${s.mailNew}`}>
                  <span className={s.mailAvatar}><Image src="/icon.png" alt="" width={24} height={24} /></span>
                  <div>
                    <div className={s.mailFrom}>PawCraft <span>now</span></div>
                    <div className={s.mailSubject}>Milo&apos;s 30-day plan is ready</div>
                    <div className={s.mailPreview}>Week 1 starts with focus &amp; foundation…</div>
                  </div>
                </div>
                <div className={s.mailBtn}>Open my plan <PiArrowRightBold /></div>
              </div>
              <div className={s.stepNum}>3</div>
              <h3>You get a complete, ready-to-use plan</h3>
              <p>Delivered straight to your inbox. No app to download. No video library to navigate. Just a clear, structured plan you can start today.</p>
            </AnimateOnScroll>
          </div>

          <div className={s.centerCta}>
            <Link href="/form" className={s.btnPrimary}>
              Start with my dog&apos;s profile <PiArrowRightBold aria-hidden="true" />
            </Link>
            <span className={s.centerCtaMicro}>Takes about 2 minutes</span>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className={s.sectionDark} id="inside">
        <div className={s.wrap}>
          <div className={s.insideGrid}>
            <div>
              <span className={`${s.sectionLabel} ${s.sectionLabelLight}`}>What&apos;s inside your plan</span>
              <h2 className={`${s.h2} ${s.h2Light}`}>Everything a private trainer<br />would charge <em>$150 for.</em></h2>
              <p className={`${s.lead} ${s.leadLight}`}>Your plan is a full 30-day document covering five sections, all written for your dog specifically.</p>

              <ul className={s.deliverList}>
                {[
                  { Icon: PiBrainFill, title: 'Breed & temperament diagnostic', body: 'Understand why your dog behaves the way they do: drive levels, trainability score, breed-specific instincts, and the root cause of their specific issues.' },
                  { Icon: PiCalendarCheckFill, title: 'Day-by-day 30-day program', body: 'Every day planned out: what to do, for how long, what success looks like. No guessing what comes next.' },
                  { Icon: PiBarbellFill, title: 'Detailed exercises with timing', body: 'Each exercise comes with step-by-step instructions, exact duration, frequency, and how to know when your dog has got it.' },
                  { Icon: PiWarningFill, title: 'Mistakes to avoid for your breed & age', body: 'The most common owner errors that kill progress, specific to your dog\'s breed, age, and problems. Not generic tips. Actual landmines to dodge.' },
                  { Icon: PiListChecksFill, title: 'Weekly progress checklist', body: 'Concrete milestones for each week so you know exactly when you\'re ready to move forward, and when to repeat a phase.' },
                  { Icon: PiSealCheckFill, title: 'Root cause explanation', body: 'A plain-English breakdown of why your dog does what they do, so you understand the logic behind every exercise and can adapt when needed.' },
                ].map(({ Icon, title, body }) => (
                  <li key={title} className={s.deliverItem}>
                    <span className={s.deliverIcon} aria-hidden="true"><Icon /></span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <AnimateOnScroll className={s.planMockCol}>
              <div className={s.planMock} role="img" aria-label="Preview of a personalised PawCraft training plan for Milo, an 18-month-old Australian Shepherd">
                <div className={s.pmChrome}>
                  <span /><span /><span />
                  <div className={s.pmUrl}><PiLockSimpleFill /> pawcraftplan.com/plan/milo</div>
                </div>
                <div className={s.pmCover}>
                  <div className={s.pmCoverLabel}>Personalised 30-day training plan</div>
                  <div className={s.pmCoverTitle}>Milo&apos;s <em>training plan</em></div>
                  <div className={s.pmMeta}>
                    <div><span>Breed</span>Australian Shepherd</div>
                    <div><span>Age</span>18 months</div>
                    <div><span>Focus</span>Leash pulling · Barking</div>
                  </div>
                </div>
                <div className={s.pmBody}>
                  <div className={s.pmSection}>01 · Temperament diagnostic</div>
                  <div className={s.pmDiag}>
                    {[
                      ['Breed drive', 'Very high', 92],
                      ['Trainability', 'High', 80],
                      ['Stimulation need', 'Very high', 95],
                      ['Reactivity', 'Moderate', 55],
                    ].map(([label, value, pct]) => (
                      <div key={label} className={s.pmDiagCard}>
                        <div className={s.pmDiagLabel}>{label}</div>
                        <div className={s.pmDiagValue}>{value}</div>
                        <div className={s.miniBar}><span style={{ width: `${pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <div className={s.pmTraits}>
                    <span className={s.pmTraitPos}>Fast learner</span>
                    <span className={s.pmTraitPos}>Eager to work</span>
                    <span className={s.pmTraitWatch}>Motion-sensitive</span>
                  </div>

                  <div className={s.pmSection}>02 · 30-day program</div>
                  <div className={s.pmWeek}>
                    <div className={s.pmWeekHead}>
                      <span className={s.pmWeekBadge}>Week 2 · Days 8–14</span>
                      <span className={s.pmWeekTitle}>Focus in motion</span>
                    </div>
                    {[
                      ['Mon', 'Pattern game at the front door', '3 × 5 min'],
                      ['Tue', 'Loose-leash U-turns in the hallway', '2 × 8 min'],
                      ['Wed', 'Flirt-pole herding outlet, with rules', '10 min'],
                    ].map(([d, ex, dur]) => (
                      <div key={d} className={s.pmDay}>
                        <span className={s.pmDayName}>{d}</span>
                        <span>{ex}</span>
                        <span className={s.pmDur}>{dur}</span>
                      </div>
                    ))}
                  </div>

                  <div className={s.pmSection}>04 · Week 2 milestones</div>
                  <div className={s.pmChecks}>
                    <div className={s.pmCheck}><span className={`${s.pmBox} ${s.pmBoxOn}`}><PiCheckBold /></span> Holds eye contact for 5 s at the open door</div>
                    <div className={s.pmCheck}><span className={`${s.pmBox} ${s.pmBoxOn}`}><PiCheckBold /></span> Walks 20 m on a loose leash indoors</div>
                    <div className={s.pmCheck}><span className={s.pmBox} /> Stays quiet when a cyclist passes</div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className={s.sectionWhite}>
        <div className={s.wrapNarrow}>
          <div className={s.sectionHeadCenter}>
            <span className={s.sectionLabel}>How it compares</span>
            <h2 className={s.h2}>The plan that makes sense<br />at <em>every level.</em></h2>
            <p className={s.lead}>You could spend $300+ on a group course or $600+ on private sessions. Or you could start here with something built for your dog, for {PRICE_LABEL}.</p>
          </div>

          <div className={s.vsWrap}>
            <table className={s.vsTable}>
              <thead>
                <tr>
                  <th></th>
                  <th>Generic guides / YouTube</th>
                  <th><span className={s.vsBrand}><PiPawPrintFill aria-hidden="true" /> PawCraft</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Built for your breed & age', 'One size fits all', 'Yes, fully personalised'],
                  ['Addresses root causes', 'Treats symptoms only', 'Diagnosis + solution'],
                  ['Day-by-day structured plan', 'Random tips & videos', '30 days, fully mapped'],
                  ['Works for your living situation', 'Assumes you have a garden', 'Apartment, house, rural'],
                  ['Ready to start today', 'Hours of videos to watch first', 'In your inbox in 60 sec'],
                ].map(([feature, them, us]) => (
                  <tr key={feature}>
                    <td>{feature}</td>
                    <td><span className={s.cross}><PiXCircleFill aria-hidden="true" /> {them}</span></td>
                    <td><span className={s.check}><PiCheckCircleFill aria-hidden="true" /> {us}</span></td>
                  </tr>
                ))}
                <tr>
                  <td>Cost</td>
                  <td>Free (but costs you time &amp; frustration)</td>
                  <td><strong className={s.vsPrice}>{PRICE_LABEL}, one-time</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className={s.section}>
        <div className={s.wrap}>
          <div className={s.sectionHeadCenter}>
            <span className={s.sectionLabel}>Real results</span>
            <h2 className={s.h2}>What dog owners are saying</h2>
            <div className={s.ratingSummary}>
              <span className={s.ratingStars} aria-hidden="true">★★★★★</span>
              <span><strong>4.9/5</strong> average from 2,400+ plans</span>
            </div>
          </div>

          <div className={s.testimonialsGrid}>
            {[
              { initials: 'SL', name: 'Sarah L.', dog: 'Koda · Husky · 2 years', result: 'Leash pulling down ~80% in 2 weeks', quote: 'I\'ve spent $400 on group classes and nothing clicked. This plan finally explained WHY Koda does what he does, and within 2 weeks the leash pulling has dropped by like 80%.' },
              { initials: 'MR', name: 'Marcus R.', dog: 'Pepper · Aussie Shepherd · 18 months', result: 'Herding instincts finally explained', quote: 'The breed diagnostic section alone was worth it. I didn\'t realise half of Pepper\'s \'bad\' behaviour was just her herding instincts with no outlet. Game changer.', featured: true },
              { initials: 'JK', name: 'Jamie K.', dog: 'Bruno · French Bulldog · 3 years', result: 'More detail than a $600 trainer package', quote: `My trainer quoted me $600 for a 6-session package. I tried this first for ${PRICE_LABEL} and honestly, the plan is more detailed than what the trainer gave me in session 1.` },
            ].map((t, i) => (
              <AnimateOnScroll key={t.name} className={`${s.testimonial} ${t.featured ? s.testimonialFeatured : ''}`} delay={i * 100}>
                <div className={s.testimonialTop}>
                  <PiQuotesFill className={s.quoteMark} aria-hidden="true" />
                  <div className={s.stars} aria-label="5 out of 5 stars">★★★★★</div>
                </div>
                <div className={s.resultChip}><PiCheckCircleFill aria-hidden="true" /> {t.result}</div>
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
      <section className={s.sectionWhite} id="pricing">
        <div className={s.wrap}>
          <div className={s.pricingGrid}>
            <div>
              <span className={s.sectionLabel}>Simple pricing</span>
              <h2 className={s.h2}>One plan. One price.<br /><em>Zero surprises.</em></h2>
              <p className={s.lead}>Compare what it usually costs to get a structured plan for your dog.</p>

              <div className={s.costChart}>
                {[
                  { label: 'Private trainer · 6 sessions', value: '$600+', pct: 100 },
                  { label: 'Group course', value: '$200–$400', pct: 50 },
                  { label: 'PawCraft', value: PRICE_LABEL, pct: 5, us: true },
                ].map((row) => (
                  <div key={row.label} className={`${s.costRow} ${row.us ? s.costRowUs : ''}`}>
                    <div className={s.costTop}>
                      <span>{row.us && <PiPawPrintFill aria-hidden="true" />} {row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                    <div className={s.costBar}><span style={{ width: `${row.pct}%` }} /></div>
                  </div>
                ))}
                <div className={s.costNote}>Private trainers typically charge $100–$150/hr.</div>
              </div>

              <div className={s.guarantee}>
                <PiShieldCheckFill aria-hidden="true" />
                <div>
                  <strong>30-day money-back guarantee</strong>
                  <span>Not useful? Email us and we&apos;ll refund you immediately. No questions asked.</span>
                </div>
              </div>
            </div>

            <AnimateOnScroll className={s.pricingCardWrap}>
              <div className={s.pricingCard}>
                <div className={s.pricingBadge}>Most popular</div>
                <div className={s.pricingDog} aria-hidden="true">
                  <Image src={ownerPhoto} alt="" fill sizes="72px" />
                </div>
                <div className={s.pricingName}>Personalised 30-day plan</div>
                <div className={s.priceDisplay}>
                  <span className={s.priceOld}>{LIST_PRICE_LABEL}</span>
                  <span className={s.priceNew}>{PRICE_LABEL}</span>
                </div>
                <div className={s.priceSub}>One-time payment · No subscription · Instant delivery</div>
                <ul className={s.priceFeatures}>
                  {['Breed & temperament diagnostic', 'Complete 30-day day-by-day program', 'Detailed exercises with duration & frequency', 'Breed-specific mistakes to avoid', 'Weekly progress checklist', 'Delivered as an interactive plan to your inbox', 'Works for any breed, age, or problem'].map((f) => (
                    <li key={f} className={s.priceFeature}><PiCheckCircleFill aria-hidden="true" /> {f}</li>
                  ))}
                </ul>
                <Link href="/form" className={s.btnCtaMain}>Build my dog&apos;s plan <PiArrowRightBold aria-hidden="true" /></Link>
                <div className={s.pricingMicro}>
                  <span><PiLockSimpleFill aria-hidden="true" /> Secure payment</span>
                  <span><PiShieldCheckFill aria-hidden="true" /> 30-day guarantee</span>
                  <span><PiEnvelopeSimpleFill aria-hidden="true" /> No account needed</span>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={s.section}>
        <div className={s.wrap}>
          <div className={s.faqGrid}>
            <div className={s.faqAside}>
              <span className={s.sectionLabel}>Got questions</span>
              <h2 className={s.h2}>Everything you <em>need to know</em></h2>
              <a href={`mailto:${SITE_EMAIL}`} className={s.faqContact}>
                <span className={s.faqContactIcon} aria-hidden="true"><PiEnvelopeSimpleFill /></span>
                <span>
                  <strong>Still unsure?</strong>
                  <span>Email us, a human will reply.</span>
                </span>
              </a>
            </div>
            <div className={s.faqList}>
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={s.finalCta}>
        <div className={s.containerNarrow}>
          <div className={s.dogRow} aria-hidden="true">
            {[beaglePhoto, guiltyPhoto, ownerPhoto, walkPhoto, calmPhoto].map((p, i) => (
              <span key={i}><Image src={p} alt="" fill sizes="88px" /></span>
            ))}
          </div>
          <h2>Stop guessing.<br /><em>Start with the right plan.</em></h2>
          <p>Your dog isn&apos;t bad. They just need an approach built for them, not a recycled guide written for every dog on the planet.</p>
          <Link href="/form" className={s.btnLight}>
            Get my dog&apos;s plan for {PRICE_LABEL} <PiArrowRightBold aria-hidden="true" />
          </Link>
          <div className={s.finalMicro}>
            <span><PiShieldCheckFill aria-hidden="true" /> 30-day money-back guarantee</span>
            <span><PiLightningFill aria-hidden="true" /> Ready in under 60 seconds</span>
          </div>
        </div>
      </section>

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
            <a href={`mailto:${SITE_EMAIL}`} aria-label="Contact">
              <HiOutlineMail />
            </a>
          </div>
          <p className={s.footerLegal}>© 2026 PawCraft. Results may vary. Always consult a veterinary professional for medical or severe behavioural issues.</p>
        </div>
      </footer>
    </>
  )
}
