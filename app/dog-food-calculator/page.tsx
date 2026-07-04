import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram, FaTiktok } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import NavToolsDropdown from '@/app/_components/NavToolsDropdown'
import DogFoodCalculator from './_components/DogFoodCalculator'
import { CalcFaqItem } from './_components/CalcFaqItem'
import s from './page.module.css'

export const metadata: Metadata = {
  title: 'Dog Food Calculator — How Much Should I Feed My Dog? | PawCraft',
  description:
    'Use our free dog food calculator to find out exactly how much to feed your dog every day. Enter weight, life stage, activity level and food type for an instant, science-based portion estimate.',
  openGraph: {
    title: 'Dog Food Calculator — How Much Should I Feed My Dog? | PawCraft',
    description:
      'Free tool: get a personalised daily portion recommendation for your dog based on weight, age, activity and food type.',
    url: '/dog-food-calculator',
    type: 'website',
    images: [{ url: '/opengraph-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dog Food Calculator — How Much Should I Feed My Dog? | PawCraft',
    description:
      'Free tool: get a personalised daily portion recommendation for your dog based on weight, age, activity and food type.',
  },
  alternates: {
    canonical: '/dog-food-calculator',
  },
}

const FAQ_ITEMS = [
  {
    question: 'How accurate is the dog food calculator?',
    answer:
      "The calculator uses the Resting Energy Requirement (RER) formula — 70 × (body weight in kg)^0.75 — which is the same starting point used by veterinary nutritionists worldwide. We then apply life-stage and activity multipliers. The result is a solid baseline, but every dog is an individual: monitor your dog's body condition score and adjust portions up or down by 10–15% every 2–3 weeks as needed. Always verify the calorie content printed on your specific bag or can, as it varies between brands.",
  },
  {
    question: 'How often should I feed my dog?',
    answer:
      'Most adult dogs do well on two meals per day — morning and evening — which helps maintain steady blood sugar and reduces the risk of bloat. Puppies under 6 months need 3–4 smaller meals per day because their stomachs are small and their energy demands per kilogram are very high. Senior dogs generally thrive on the same twice-daily schedule as adults, though some do better with smaller, more frequent meals if they have digestive sensitivities.',
  },
  {
    question: 'My dog is a healthy weight — should I still track portions?',
    answer:
      "Yes. Even dogs at a healthy weight can drift into overfeeding over time, especially as they age and become less active. Obesity is the most common preventable health condition in dogs, affecting over 50% of dogs in the UK. Using a kitchen scale for dry kibble — rather than a cup — is the single most reliable habit for keeping portion sizes consistent and your dog's weight stable over the long term.",
  },
  {
    question: 'Does the calculator work for wet food and raw diets?',
    answer:
      "Yes. Select 'wet food' or 'raw diet' from the food type dropdown. The calculator adjusts its output because wet and raw foods have a much lower calorie density per gram than dry kibble — wet food is roughly 70–80% water. The gram amounts for wet and raw diets will be substantially larger than for dry kibble, which is expected and correct. For raw feeding, use the gram recommendation as a starting point and fine-tune based on your dog's body condition over several weeks.",
  },
  {
    question: "Should I include treats in the daily portion?",
    answer:
      "Yes, treats should be counted as part of your dog's total daily calorie intake. As a rule, treats should make up no more than 10% of daily calories. If your dog receives a lot of training treats during the day, reduce their main meal portions accordingly. High-value training treats are often calorie-dense despite being small, so it's easy to accidentally overfeed without realising.",
  },
  {
    question: "When should I see a vet about my dog's diet?",
    answer:
      "A calculator is a helpful starting point, but your vet is the right person to consult for any dog that is significantly underweight or overweight, has a medical condition such as kidney disease, diabetes, pancreatitis, or allergies, is pregnant or lactating, or is not thriving on their current diet. These situations require tailored nutritional guidance that goes beyond what a general portion calculator can provide.",
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Dog Food Calculator',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  description:
    'A free tool that calculates the recommended daily food portion for a dog based on weight, life stage, activity level, and food type.',
  url: 'https://mypawcraft.com/dog-food-calculator',
  provider: { '@type': 'Organization', name: 'PawCraft', url: 'https://mypawcraft.com' },
}

export default function DogFoodCalculatorPage() {
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
            <div className={s.heroEyebrow}>🥣 Free tool — no sign-up required</div>
            <h1>
              How much should you feed<br />
              <em>your dog every day?</em>
            </h1>
            <p className={s.heroSub}>
              Enter your dog's weight, life stage, activity level, and food type to get a science-based daily portion in seconds.
            </p>

            <DogFoodCalculator />

            <p className={s.heroMicro}>
              Based on the veterinary RER formula · Results are estimates · Always check your food's label
            </p>
          </div>
        </section>

        {/* PROOF BAR */}
        <div className={s.proofBar}>
          <div className={s.proofItem}><strong>Free</strong> — no account needed</div>
          <div className={s.proofItem}><strong>Vet-derived</strong> RER formula</div>
          <div className={s.proofItem}><strong>Dry · Wet · Raw</strong> diets supported</div>
          <div className={s.proofItem}><strong>kg &amp; lbs</strong> — both units</div>
        </div>

        {/* HOW TO USE */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>Getting started</span>
            <h2 className={s.h2}>How to use this calculator</h2>
            <p className={s.lead}>
              The calculator takes four inputs and returns your dog's estimated daily food requirement in grams, along with a cups or ounces conversion and a per-meal split. Here's what each field means and why it matters.
            </p>

            <div className={s.stepsList}>
              <div className={s.step}>
                <div className={s.stepNum}>1</div>
                <div>
                  <h3>Enter your dog's current weight</h3>
                  <p>
                    Use your dog's current body weight in kilograms or pounds. If you don't have a recent measurement, most vet clinics will weigh your dog for free on request, and many pet shops have walk-on scales. Avoid using a target weight unless your vet has prescribed a weight-loss plan — the calculator works best with actual weight. For puppies, use today's weight rather than an estimated adult weight.
                  </p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>2</div>
                <div>
                  <h3>Select life stage and activity level</h3>
                  <p>
                    Life stage has a large effect on calorie needs. Puppies require significantly more energy per kilogram than adult dogs because they are still growing muscle, bone, and organ tissue. Senior dogs generally need fewer calories than adults, as their metabolism slows and they tend to be less active. Activity level captures how much energy your dog burns day to day: a Border Collie who runs twice daily needs considerably more food than a Basset Hound who prefers the sofa.
                  </p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>3</div>
                <div>
                  <h3>Choose your food type and read the results</h3>
                  <p>
                    Select dry kibble, wet food, or raw diet. The calculator accounts for the very different calorie densities of each format — dry kibble typically contains around 350 kcal per 100 g, while wet food averages closer to 85 kcal per 100 g due to its high water content. The result shows grams per day, a cups or ounces equivalent, the per-meal split based on two meals a day, and the estimated calorie total so you can cross-check against your food's packaging.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* UNDERSTANDING NUTRITION */}
        <section className={s.sectionAlt}>
          <div className={s.container}>
            <span className={s.sectionLabel}>The science behind portions</span>
            <h2 className={s.h2}>Understanding your dog's <em>nutritional needs</em></h2>

            <div className={s.splitRow}>
              <div className={s.splitText}>
                <p>
                  Dogs are not small humans, and their calorie needs don't scale linearly with body weight. A 5 kg dog does not need exactly half the food of a 10 kg dog. Instead, energy requirements scale with metabolic body weight — a concept captured by the Resting Energy Requirement (RER) formula used by veterinary nutritionists:
                </p>
                <p>
                  <strong>RER = 70 × (body weight in kg)<sup>0.75</sup></strong>
                </p>
                <p>
                  RER represents the calories a dog needs at rest simply to keep vital organs functioning — heart, kidneys, lungs, and brain. From this baseline, we multiply by factors for life stage and daily activity to arrive at the Maintenance Energy Requirement (MER): the actual amount your dog needs on a typical day.
                </p>
                <p>
                  Understanding this formula helps explain why small dogs often seem to eat a surprisingly large amount relative to their size, and why very large breeds like Great Danes don't eat proportionally as much as you might expect. It also explains why a neutered, sedentary adult dog can gain weight even when fed the manufacturer's "recommended" portion — those recommendations are averages, and your dog may be below-average in terms of energy output.
                </p>
              </div>
              <div>
                <Image
                  src="/images/dog-food-calculator-2.png"
                  alt="Dog next to a full food bowl"
                  width={800}
                  height={500}
                  className={s.sectionImg}
                />
              </div>
            </div>
          </div>
        </section>

        {/* FACTORS */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>What changes the number</span>
            <h2 className={s.h2}>Four factors that affect <em>portion size</em></h2>
            <p className={s.lead}>
              No single factor determines how much your dog should eat. The right daily portion is always a combination of the four variables below. Change any one of them and the calculation shifts.
            </p>

            <div className={s.factorGrid}>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>⚖️</span>
                <h3>Body weight</h3>
                <p>
                  The most obvious factor. Heavier dogs need more calories simply to maintain their mass. But remember the 0.75 exponent: a dog twice the weight of another does not need twice the food — closer to 1.7 times. Always use current measured weight, not estimated or desired weight, for accurate results.
                </p>
              </div>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>🐾</span>
                <h3>Life stage</h3>
                <p>
                  Puppies need up to 2.5 times their RER to fuel growth. Adult dogs in normal health require around 1.6 times RER. Senior dogs typically need closer to 1.2 times RER, as their metabolic rate slows with age. Neutered dogs also tend to need around 10–15% fewer calories than intact dogs of the same size and activity level.
                </p>
              </div>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>🏃</span>
                <h3>Activity level</h3>
                <p>
                  A working sheepdog or a competitive agility dog can easily burn twice the calories of a lap dog with the same body weight. We classify activity as low (mostly resting, short daily outings), moderate (one or two good walks per day), or high (extended daily exercise, working, or sport). When in doubt, start with "moderate" and adjust based on your dog's body condition score over a few weeks.
                </p>
              </div>
              <div className={s.factorCard}>
                <span className={s.factorCardIcon}>🥩</span>
                <h3>Food type and calorie density</h3>
                <p>
                  The same 200-gram portion of dry kibble and wet food contains radically different amounts of calories. Dry kibble packs roughly 350 kcal per 100 g; wet food sits around 85 kcal per 100 g; raw diets land somewhere in between at around 180 kcal per 100 g. This is why switching from dry to wet food without adjusting quantity leads to rapid weight loss, and vice versa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* READING LABELS */}
        <section className={s.sectionAlt}>
          <div className={s.container}>
            <span className={s.sectionLabel}>Label literacy</span>
            <h2 className={s.h2}>How to read a dog food label <em>properly</em></h2>

            <div className={`${s.splitRow} ${s.splitRowReverse}`}>
              <div>
                <Image
                  src="/images/dog-food-calculator.png"
                  alt="Owner reading a dog food bag label"
                  width={600}
                  height={400}
                  className={s.sectionImg}
                />
              </div>
              <div className={s.splitText}>
                <h3>The metabolisable energy (ME) figure is what matters</h3>
                <p>
                  Pet food manufacturers in the UK and EU are required to declare a "typical analysis" on packaging — crude protein, crude fat, crude fibre, moisture, and crude ash. What they are not required to state (but often do) is the metabolisable energy in kcal per 100 g or per kg. This is the number you need to accurately cross-check against our calculator's calorie estimate.
                </p>
                <p>
                  If you can't find it on the bag, check the brand's website. Failing that, you can estimate it using the modified Atwater formula: multiply crude protein % by 3.5, fat % by 8.5, and digestible carbohydrate % by 3.5, then sum the results. This gives a rough kcal-per-100g estimate you can use alongside our tool.
                </p>
                <h3 style={{ marginTop: '16px' }}>Feeding guides on packaging are starting points</h3>
                <p>
                  The feeding guide table on your dog food bag is calculated for the average dog at the average activity level. Your dog may need more or less. Use the package guide as a cross-reference alongside this calculator, and trust what your dog's body condition tells you over time more than any printed table.
                </p>
                <ul>
                  <li>A body condition score (BCS) of 4–5 out of 9 is ideal</li>
                  <li>You should be able to feel — but not see — your dog's ribs</li>
                  <li>From above, your dog should have a visible waist</li>
                  <li>Adjust portions by 10% every 2–3 weeks if BCS drifts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* MISTAKES */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>What to avoid</span>
            <h2 className={s.h2}>Common dog feeding <em>mistakes</em></h2>
            <p className={s.lead}>
              Even well-intentioned owners regularly make these five feeding errors. Avoiding them is often more impactful than any change in food brand or recipe.
            </p>

            <div className={s.mistakesList}>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>📏</span>
                <div className={s.mistakeContent}>
                  <h3>Measuring with cups instead of scales</h3>
                  <p>
                    A "cup" of kibble can vary by 20–30% depending on how loosely or tightly it's filled. Over days and weeks, that variance compounds into meaningful overfeeding or underfeeding. A kitchen scale that measures in grams costs a few pounds and eliminates this error entirely. Use it every single time, even when it feels overly precise — your dog's long-term health is worth the thirty seconds it takes.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>🍪</span>
                <div className={s.mistakeContent}>
                  <h3>Forgetting to count treats and table scraps</h3>
                  <p>
                    Treats are food. A handful of training treats given throughout the day can add 100–200 kcal on top of regular meals — equivalent to an entire extra meal for a small breed. If your dog is gaining weight despite eating their normal portion, treats and scraps are almost always the hidden culprit. Log everything your dog eats for a week and you'll likely find the answer.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>🔄</span>
                <div className={s.mistakeContent}>
                  <h3>Switching foods without adjusting portions</h3>
                  <p>
                    Changing from a 320 kcal/100 g kibble to a 390 kcal/100 g kibble while feeding the same gram weight will result in your dog consuming roughly 20% more calories per day. Any time you switch food — even between flavours of the same brand — check the calorie density and re-run the calculator to confirm your portion is still appropriate.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>😴</span>
                <div className={s.mistakeContent}>
                  <h3>Not adjusting for reduced activity in older dogs</h3>
                  <p>
                    Many owners continue feeding their dog the same amount from adulthood into old age, not realising that a 9-year-old dog often has a 20–30% lower metabolic rate than they did at 3. This is one of the most common routes to obesity in senior dogs. If your dog is slowing down noticeably — taking shorter walks, sleeping more — it's time to reassess their daily portion using the "senior" life stage in the calculator.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>🍽️</span>
                <div className={s.mistakeContent}>
                  <h3>Free-feeding dry kibble all day</h3>
                  <p>
                    Leaving a bowl of food out all day may seem convenient, but it removes your ability to monitor appetite — one of the earliest indicators of illness or stress. It also makes portion control impossible and can train dogs to eat out of boredom rather than hunger. Timed meals give you a reliable daily check on your dog's appetite and make it far easier to notice if something is off.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '44px' }}>
              <Image
                src="/images/how-much-should-i-feed-my-dog.png"
                alt="Dog looking up at owner with empty food bowl"
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
            <h2>Great nutrition is half the picture.<br /><em>Training is the other half.</em></h2>
            <p>
              A well-fed dog is a dog with the energy and focus to learn. Give yours a personalised 30-day training plan built around their breed, age, and specific behaviour challenges.
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
            <p className={s.footerLegal}>© 2026 PawCraft. This calculator provides general guidance only. Always consult a veterinary professional for medical or specialist dietary advice.</p>
          </div>
        </footer>
      </main>
    </>
  )
}
