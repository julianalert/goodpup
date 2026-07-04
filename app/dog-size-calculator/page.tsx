import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram, FaTiktok } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import NavToolsDropdown from '@/app/_components/NavToolsDropdown'
import DogSizeCalculator from './_components/DogSizeCalculator'
import { CalcFaqItem } from './_components/CalcFaqItem'
import s from './page.module.css'

export const metadata: Metadata = {
  title: 'Puppy Size Calculator — How Big Will My Dog Get? | PawCraft',
  description:
    "Use our free puppy size calculator to estimate how big your dog will get as an adult. Enter your puppy's current weight, age, and breed size for an instant estimate based on veterinary growth curves.",
  openGraph: {
    title: 'Puppy Size Calculator — How Big Will My Dog Get? | PawCraft',
    description:
      "Free tool: estimate your puppy's adult size based on current weight, age, and breed size category.",
    url: '/dog-size-calculator',
    type: 'website',
    images: [{ url: '/opengraph-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Puppy Size Calculator — How Big Will My Dog Get? | PawCraft',
    description:
      "Free tool: estimate your puppy's adult size based on current weight, age, and breed size category.",
  },
  alternates: {
    canonical: '/dog-size-calculator',
  },
}

const FAQ_ITEMS = [
  {
    question: "How accurate is the puppy size calculator?",
    answer:
      "The calculator uses a growth curve model based on breed size categories and produces a reliable estimate with a ±12% range. For pure breeds, the estimate tends to be more accurate because breeders can tell you the expected adult weight range. For mixed breeds, you should treat the result as a broad guide rather than a precise prediction. Genetics account for most of the variance — puppies from large-framed parents will generally land toward the top of the range.",
  },
  {
    question: "My puppy's breed is mixed — which size should I select?",
    answer:
      "For a mixed breed, try to select the size category that best matches the larger of the two parent breeds, or the one that best matches your puppy's current build. If you know both parents' weights, a simple and reliable rule is to average them and add 10% — males tend to be slightly heavier than their female parent. The calculator's range accounts for genetic variation, so even an approximate size selection will give you a useful ballpark.",
  },
  {
    question: "At what age is a dog fully grown?",
    answer:
      "It depends heavily on breed size. Small breeds (under 10 kg) typically reach full size by 9–10 months. Medium breeds (10–25 kg) are usually done by 12–15 months. Large breeds (25–45 kg) can continue growing until 18–24 months, and giant breeds like Great Danes and Saint Bernards may not fully fill out until 2–3 years of age. 'Fully grown' in terms of height happens earlier than full adult body mass — dogs can gain muscle and chest depth for months after they stop growing taller.",
  },
  {
    question: "Can I use this for a dog over 1 year old?",
    answer:
      "If your dog is over 12 months and a small or medium breed, they're likely already at or near adult size — the calculator will tell you this. For large and giant breeds that are still growing past 12 months, the calculator will still produce a useful estimate. For any dog that appears to have stopped growing, their current weight is essentially their adult weight and no calculation is needed.",
  },
  {
    question: "Does spaying or neutering affect adult size?",
    answer:
      "Research suggests that early spaying or neutering (before the growth plates close) can slightly increase adult height in some dogs, particularly large and giant breeds, because the sex hormones that signal growth plate closure are removed. The effect on body weight is less clear-cut. If your dog was spayed or neutered before 6 months, their final size may land toward the higher end of the calculator's range. This is worth discussing with your vet if you're a large-breed owner.",
  },
  {
    question: "My puppy seems much smaller or larger than expected — should I be concerned?",
    answer:
      "Not necessarily. There's significant individual variation even within the same litter. If your puppy is eating well, active, and gaining weight steadily week over week, they're likely developing normally — they may just land outside the statistical average for their breed size. If your puppy has stopped gaining weight, is significantly underweight, or you notice signs of illness, consult your vet. A growth chart review at your puppy's regular vaccinations is the best way to track development.",
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Puppy Size Calculator',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  description:
    "A free tool that estimates a puppy's adult weight based on current weight, age in weeks, and breed size category.",
  url: 'https://mypawcraft.com/dog-size-calculator',
  provider: { '@type': 'Organization', name: 'PawCraft', url: 'https://mypawcraft.com' },
}

export default function DogSizeCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <Link href="/form" className={s.navCta}>Get my dog&apos;s plan →</Link>
      </nav>

      <main>
        {/* HERO */}
        <section className={s.hero}>
          <div className={s.container}>
            <div className={s.heroEyebrow}>📏 Free tool — no sign-up required</div>
            <h1>
              How big will<br />
              <em>my puppy get?</em>
            </h1>
            <p className={s.heroSub}>
              Enter your puppy&apos;s current weight, age in weeks, and breed size to get an instant adult size estimate based on veterinary growth curves.
            </p>

            <DogSizeCalculator />

            <p className={s.heroMicro}>
              Based on breed size growth curves · ±12% range · Always confirm with your vet
            </p>
          </div>
        </section>

        {/* PROOF BAR */}
        <div className={s.proofBar}>
          <div className={s.proofItem}><strong>Free</strong> — no account needed</div>
          <div className={s.proofItem}><strong>Breed-adjusted</strong> growth curves</div>
          <div className={s.proofItem}><strong>Small · Medium · Large · Giant</strong></div>
          <div className={s.proofItem}><strong>kg &amp; lbs</strong> — both units</div>
        </div>

        {/* HOW TO USE */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>Getting started</span>
            <h2 className={s.h2}>How to use this calculator</h2>
            <p className={s.lead}>
              The calculator needs three pieces of information: your puppy&apos;s weight today, their age in weeks, and the size category they&apos;ll fall into as an adult. Here&apos;s how to get each one right.
            </p>

            <div className={s.stepsList}>
              <div className={s.step}>
                <div className={s.stepNum}>1</div>
                <div>
                  <h3>Weigh your puppy accurately</h3>
                  <p>
                    For the most accurate result, weigh your puppy on the same day you use the calculator. Kitchen scales work well for small puppies. For larger pups, stand on a bathroom scale holding your puppy, then weigh yourself alone and subtract. Most vet clinics will also weigh your puppy for free — it&apos;s worth doing regularly in the first year. The more precise your current weight measurement, the more reliable the adult size estimate will be.
                  </p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>2</div>
                <div>
                  <h3>Know your puppy&apos;s age in weeks</h3>
                  <p>
                    If you adopted your puppy from a breeder or rescue, they should be able to give you an exact date of birth. If not, your vet can make a rough estimate based on teeth development and body proportions. Enter the age in weeks — for example, a 3-month-old puppy is approximately 13 weeks. The calculator works best for puppies between 6 and 52 weeks. For older puppies still growing, it will still provide a useful estimate.
                  </p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>3</div>
                <div>
                  <h3>Select the right breed size category</h3>
                  <p>
                    Breed size is the most important variable in predicting adult weight because different size dogs grow at very different rates and for very different lengths of time. If you know the breed, check a breed standard for the typical adult weight range and pick the matching category. For mixed breeds, use the larger parent&apos;s size as your guide. The dropdown includes example breeds for each category to help you decide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PUPPY DEVELOPMENT */}
        <section className={s.sectionAlt}>
          <div className={s.container}>
            <span className={s.sectionLabel}>The science of growth</span>
            <h2 className={s.h2}>Understanding <em>puppy development stages</em></h2>

            <div className={s.splitRow}>
              <div className={s.splitText}>
                <p>
                  Puppies don&apos;t grow at a constant rate from birth to adulthood. Growth is rapid in the first few months, then gradually slows as the puppy approaches skeletal maturity. This non-linear growth is why a simple &quot;multiply by two&quot; rule only works reliably at very specific ages for specific breed sizes, and why a growth-curve model produces a better estimate across the full range of puppy ages.
                </p>
                <p>
                  The key developmental stage is when the growth plates — the soft cartilage near the ends of the long bones — close and harden into bone. Once this happens, the dog cannot grow any taller. Growth plate closure happens earlier in small breeds (around 8–10 months) and much later in giant breeds (18–24 months). This is why giant breed puppies remain &quot;puppyish&quot; in both body and behaviour for far longer than their smaller counterparts.
                </p>
                <p>
                  Understanding this also has practical implications for exercise. High-impact activities like long runs, jumping, and rough play on hard surfaces can damage open growth plates in young large and giant breed puppies. Most vets recommend limiting these activities until growth plates are confirmed closed — typically via an X-ray at 12–18 months for large breeds.
                </p>
              </div>
              <div>
                <Image
                  src="/images/how-big-will-my-puppy-get.png"
                  alt="Puppy growing into adult dog"
                  width={800}
                  height={500}
                  className={s.sectionImg}
                />
              </div>
            </div>
          </div>
        </section>

        {/* FOUR FACTORS */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>What shapes adult size</span>
            <h2 className={s.h2}>Four factors that determine <em>how big your dog gets</em></h2>
            <p className={s.lead}>
              Adult size is never determined by a single factor. Understanding the four main contributors helps explain why two puppies of the same breed can end up at noticeably different adult weights.
            </p>

            <div className={s.factorGrid}>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>🧬</span>
                <h3>Genetics</h3>
                <p>
                  The single biggest predictor of adult size. A puppy&apos;s genetic blueprint sets the upper and lower boundaries of how large they can grow. For pure breeds, breed standards give a reliable expected range. For mixed breeds, knowing the parent breeds and their typical sizes gives the best prediction. If you don&apos;t know the mix, a DNA test can provide useful breed composition information.
                </p>
              </div>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>🥩</span>
                <h3>Nutrition during growth</h3>
                <p>
                  Adequate nutrition allows a puppy to reach its genetic size potential. Chronic underfeeding in the first year can result in a dog that is permanently smaller than its genetic potential. Overfeeding, particularly in large and giant breeds, can cause puppies to grow too fast — leading to joint and skeletal problems rather than a larger adult size. The goal is steady, consistent growth, not fast growth.
                </p>
              </div>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>⚥</span>
                <h3>Sex</h3>
                <p>
                  Males are typically 10–20% heavier than females of the same breed. This is an important variable the calculator doesn&apos;t ask about, which is why the output is a range rather than a single number. If you know your puppy&apos;s sex, expect males to land toward the top of the estimated range and females toward the bottom. Some breeds show a more pronounced size difference between sexes than others.
                </p>
              </div>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>🏥</span>
                <h3>Health and early experiences</h3>
                <p>
                  Serious illness, intestinal parasites, or prolonged malnutrition in the first few months of life can impair growth. Puppies raised in poor conditions before adoption may have a slower start and ultimately reach a slightly smaller adult size than their genetics would otherwise allow. With good care after adoption, most puppies recover well and reach close to their expected size, though severe early deprivation can have lasting effects.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* GROWTH MILESTONES */}
        <section className={s.sectionAlt}>
          <div className={s.container}>
            <span className={s.sectionLabel}>Breed size growth guide</span>
            <h2 className={s.h2}>Growth milestones by <em>breed size</em></h2>

            <div className={`${s.splitRow} ${s.splitRowReverse}`}>
              <div>
                <Image
                  src="/images/dog-size-calculator.png"
                  alt="Puppy next to size comparison chart"
                  width={600}
                  height={400}
                  className={s.sectionImg}
                />
              </div>
              <div className={s.splitText}>
                <h3>Small breeds — mature fastest</h3>
                <p>
                  Small breeds (Chihuahua, Pomeranian, Shih Tzu, Miniature Dachshund) typically reach 50% of their adult weight by 12–14 weeks and are essentially fully grown by 9–10 months. This fast maturation means their growth window is short — nutritional gaps during the first six months have less time to be corrected compared to larger breeds.
                </p>
                <h3 style={{ marginTop: '16px' }}>Large and giant breeds — the long road to maturity</h3>
                <p>
                  Large breeds like Labradors and German Shepherds reach 50% of adult weight around 4–5 months, but continue growing for another year or more. Giant breeds like Great Danes and Saint Bernards may only be at 40–45% of adult weight at 6 months and will continue gaining muscle and frame until their second or even third birthday. During this extended growth period, diet and exercise management is especially important.
                </p>
                <ul>
                  <li>Small breeds: full size by 9–10 months</li>
                  <li>Medium breeds: full size by 12–15 months</li>
                  <li>Large breeds: full size by 18–24 months</li>
                  <li>Giant breeds: full size by 24–36 months</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HEALTHY GROWTH SIGNS */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>What to watch for</span>
            <h2 className={s.h2}>Signs of <em>healthy puppy development</em></h2>
            <p className={s.lead}>
              Adult size prediction is useful, but the most important thing is that your puppy is growing well right now. These five indicators tell you far more than any calculator can.
            </p>

            <div className={s.mistakesList}>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>📈</span>
                <div className={s.mistakeContent}>
                  <h3>Consistent week-on-week weight gain</h3>
                  <p>
                    A healthy puppy should gain weight every week for the first six months. Weigh your puppy at least once a week and track it. A small puppy might gain 50–100 g per week; a giant breed might gain 1–2 kg per week. The exact number matters less than the trend — steady, uninterrupted upward progress is the sign you want to see. A week without gain, or weight loss, warrants a vet check.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>💪</span>
                <div className={s.mistakeContent}>
                  <h3>Good muscle tone without visible ribs</h3>
                  <p>
                    You should be able to feel your puppy&apos;s ribs with gentle pressure but not see them prominently. A puppy that looks too lean — where the hip bones, spine, and ribs are all clearly visible — may not be getting enough food or has an underlying health issue. A puppy that looks round and heavy at a young age may be on a path to joint problems. Aim for lean and athletic, not fat or bony.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>🐾</span>
                <div className={s.mistakeContent}>
                  <h3>Paws that look proportionally large</h3>
                  <p>
                    Big paws relative to the body are one of the most reliable informal signals that a puppy will grow into a large adult dog. The paws tend to grow first, and the body catches up over time. If your puppy&apos;s paws look comically large, it&apos;s a reasonable sign that there&apos;s significant growth still ahead of them — regardless of how small they look right now.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>😄</span>
                <div className={s.mistakeContent}>
                  <h3>High energy and enthusiasm</h3>
                  <p>
                    A well-nourished, healthy puppy is curious, playful, and full of energy between sleep periods. Lethargy, disinterest in food, persistent vomiting or diarrhoea, or reluctance to play are all signs that something may be affecting growth. Puppies sleep a lot — that&apos;s normal — but when they&apos;re awake they should be engaged with the world around them.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>🦷</span>
                <div className={s.mistakeContent}>
                  <h3>On-schedule teething</h3>
                  <p>
                    Puppies start losing their baby teeth and growing adult teeth between 12 and 24 weeks. The timing of teething is a useful developmental marker — if your puppy is still on baby teeth past 6 months, it&apos;s worth mentioning to your vet. A puppy whose development appears delayed in one area may be experiencing nutritional or health issues that could also affect final adult size.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '44px' }}>
              <Image
                src="/images/dog-size-calculator-2.png"
                alt="Healthy puppy being weighed on a scale"
                width={880}
                height={440}
                className={s.sectionImg}
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={s.sectionAlt}>
          <div className={s.containerNarrow}>
            <span className={s.sectionLabel}>Questions answered</span>
            <h2 className={s.h2}>Frequently asked <em>questions</em></h2>

            <div className={s.faqList}>
              {FAQ_ITEMS.map(item => (
                <CalcFaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <div className={s.finalCta}>
          <div className={s.containerNarrow}>
            <h2>Knowing your dog&apos;s size is the first step.<br /><em>Training them well is the next.</em></h2>
            <p>
              Get a personalised 30-day training plan built specifically for your dog&apos;s breed, age, and behaviour challenges — so you&apos;re ready for every stage of their growth.
            </p>
            <Link href="/form" className={s.btnPrimary}>Get my dog&apos;s plan →</Link>
          </div>
        </div>

        {/* FOOTER */}
        <footer className={s.footer}>
          <div className={s.footerInner}>
            <div className={s.footerBrand}>
              <Image src="/icon.png" alt="PawCraft" width={32} height={32} className={s.footerIcon} />
            </div>
            <p className={s.footerTagline}>Free tools and personalised dog training plans</p>
            <Link href="/dogs" className={s.footerDogsLink}>Browse all breed training guides →</Link>
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
            <p className={s.footerLegal}>© 2026 PawCraft. This calculator provides general guidance only. Always consult a veterinary professional for health or developmental concerns.</p>
          </div>
        </footer>
      </main>
    </>
  )
}
