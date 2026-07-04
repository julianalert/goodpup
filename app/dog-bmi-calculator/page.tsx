import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FaInstagram, FaTiktok } from 'react-icons/fa'
import { HiOutlineMail } from 'react-icons/hi'
import NavToolsDropdown from '@/app/_components/NavToolsDropdown'
import DogBmiCalculator from './_components/DogBmiCalculator'
import { CalcFaqItem } from './_components/CalcFaqItem'
import s from './page.module.css'

export const metadata: Metadata = {
  title: 'Dog BMI Calculator — Is My Dog a Healthy Weight? | PawCraft',
  description:
    "Use our free dog BMI calculator to find out if your dog is underweight, healthy, overweight, or obese. Enter weight and height at the withers for an instant body condition assessment.",
  openGraph: {
    title: 'Dog BMI Calculator — Is My Dog a Healthy Weight? | PawCraft',
    description:
      "Free tool: calculate your dog's BMI and body condition score equivalent in seconds.",
    url: '/dog-bmi-calculator',
    type: 'website',
    images: [{ url: '/opengraph-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dog BMI Calculator — Is My Dog a Healthy Weight? | PawCraft',
    description:
      "Free tool: calculate your dog's BMI and body condition score equivalent in seconds.",
  },
  alternates: {
    canonical: '/dog-bmi-calculator',
  },
}

const FAQ_ITEMS = [
  {
    question: "Is dog BMI the same as human BMI?",
    answer:
      "The formula is identical — weight divided by height squared — but the measurement point for height differs. For dogs, height is measured at the withers (the highest point of the shoulder blades), not the top of the head. The BMI categories are also the same as the human scale, though vets typically prefer the Body Condition Score (BCS) system on a 1–9 scale for its greater clinical nuance. BMI is a useful quick check; BCS is the more thorough assessment.",
  },
  {
    question: "What is the withers and how do I measure it?",
    answer:
      "The withers is the ridge between your dog's shoulder blades — the highest point of the back when the dog is standing naturally with its head level. To measure, stand your dog on a flat surface, ensure they are standing squarely (not slouched or stretched), and use a tape measure or ruler from the floor straight up to the withers. For wriggly dogs, marking the wall at withers height with a pencil while they stand against it can make the measurement easier.",
  },
  {
    question: "My dog's BMI says overweight but they look fine — why?",
    answer:
      "BMI can underestimate body fat in very muscular dogs like Staffordshire Bull Terriers, Greyhounds with deep chests, or heavily built working breeds. A dog with a lot of lean muscle mass will produce a higher BMI without necessarily carrying excess fat. In these cases, use the physical checks: can you feel the ribs with gentle pressure without a thick fat layer? Is there a visible waist from above and a belly tuck from the side? If yes, your dog is likely fine despite the BMI number.",
  },
  {
    question: "How much should I reduce my dog's food if they are overweight?",
    answer:
      "Start with a 10–15% reduction in daily food intake and increase daily walking time by 15–20 minutes. Reassess body condition every 2–3 weeks. Weight loss in dogs should be gradual — aim for no more than 1–2% of body weight per week. Faster weight loss can cause muscle loss and other health problems. If your dog is significantly obese (BMI over 35), consult your vet before starting a weight loss programme, as they may need a prescription weight-management diet.",
  },
  {
    question: "What health problems are linked to obesity in dogs?",
    answer:
      "Overweight and obese dogs face significantly elevated risk of osteoarthritis and joint disease, type 2 diabetes mellitus, respiratory difficulties, high blood pressure, heart disease, certain cancers, and a shortened life expectancy. Studies suggest that dogs kept at a lean body condition live an average of 1.8 years longer than their overweight counterparts. Even reducing a mildly overweight dog to an ideal body condition can meaningfully reduce joint pain and improve quality of life.",
  },
  {
    question: "Can I use this calculator for puppies?",
    answer:
      "BMI is best suited for adult dogs whose skeletal frame is fully developed, typically dogs over 12–18 months depending on breed size. For puppies still growing, height and weight are changing rapidly week by week, making BMI a moving target. For puppies, body condition is better assessed visually and by feel, guided by your vet at each vaccination visit. If you want to estimate your puppy's adult size instead, try our Puppy Size Calculator.",
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Dog BMI Calculator',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  description:
    "A free tool that calculates a dog's BMI from weight and height at the withers and maps the result to a body condition category.",
  url: 'https://mypawcraft.com/dog-bmi-calculator',
  provider: { '@type': 'Organization', name: 'PawCraft', url: 'https://mypawcraft.com' },
}

export default function DogBmiCalculatorPage() {
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
            <div className={s.heroEyebrow}>⚖️ Free tool — no sign-up required</div>
            <h1>
              Is my dog a<br />
              <em>healthy weight?</em>
            </h1>
            <p className={s.heroSub}>
              Enter your dog&apos;s weight and height at the withers to calculate their BMI and see where they sit on the body condition scale — instantly.
            </p>

            <DogBmiCalculator />

            <p className={s.heroMicro}>
              Uses the standard weight ÷ height² formula · Mapped to Body Condition Score · Always confirm with your vet
            </p>
          </div>
        </section>

        {/* PROOF BAR */}
        <div className={s.proofBar}>
          <div className={s.proofItem}><strong>Free</strong> — no account needed</div>
          <div className={s.proofItem}><strong>BMI + BCS</strong> equivalent shown</div>
          <div className={s.proofItem}><strong>Underweight to Obese</strong> scale</div>
          <div className={s.proofItem}><strong>kg/lbs &amp; cm/in</strong> supported</div>
        </div>

        {/* HOW TO USE */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>Getting started</span>
            <h2 className={s.h2}>How to measure your dog <em>accurately</em></h2>
            <p className={s.lead}>
              The BMI calculation is only as reliable as the two measurements you put in. Here is how to get both right, even with a wriggly dog.
            </p>

            <div className={s.stepsList}>
              <div className={s.step}>
                <div className={s.stepNum}>1</div>
                <div>
                  <h3>Weigh your dog on a flat scale</h3>
                  <p>
                    For dogs under about 15 kg, a baby scale or kitchen scale placed on a flat floor gives accurate results. For larger dogs, stand on a bathroom scale holding your dog, note the combined weight, then weigh yourself alone and subtract. Many vet clinics and pet shops have walk-on scales your dog can step onto directly. Always use the same scale each time for consistency — different scales can read slightly differently.
                  </p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>2</div>
                <div>
                  <h3>Measure height at the withers</h3>
                  <p>
                    Stand your dog on a hard, flat surface. The withers is the highest point between the shoulder blades — not the top of the neck or head. Ask your dog to stand squarely with all four paws on the floor and head held at a natural level. Place a ruler or book flat on the withers and mark the wall at that height, then measure from the floor to the mark. For wiggly dogs, a second person helping hold the dog still makes this much easier.
                  </p>
                </div>
              </div>
              <div className={s.step}>
                <div className={s.stepNum}>3</div>
                <div>
                  <h3>Enter both values and read your result</h3>
                  <p>
                    Enter the weight and withers height in your preferred units (kg/lbs and cm/inches). The calculator will compute your dog&apos;s BMI, display the category with a colour-coded scale, show the equivalent Body Condition Score range, and give you tailored advice based on where your dog falls. Use the result as a starting point for a conversation with your vet if anything concerns you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BMI AND BODY CONDITION */}
        <section className={s.sectionAlt}>
          <div className={s.container}>
            <span className={s.sectionLabel}>Understanding your result</span>
            <h2 className={s.h2}>Dog BMI and <em>body condition explained</em></h2>

            <div className={s.splitRow}>
              <div className={s.splitText}>
                <p>
                  Body Mass Index was originally developed for humans but applies to dogs because the fundamental relationship between weight and skeletal frame size holds across mammals. A dog that weighs more relative to its height is carrying more mass, and beyond a certain threshold that excess mass is fat rather than muscle or bone.
                </p>
                <p>
                  Veterinary professionals most commonly assess body condition using the Body Condition Score (BCS) — a hands-on, visual assessment scored on a scale of 1 to 9, where 4–5 is ideal. BMI and BCS correlate well in most dogs and our calculator maps your BMI result to the equivalent BCS range so you can speak the same language as your vet.
                </p>
                <p>
                  Where BMI and BCS diverge is in very muscular breeds. A Staffordshire Bull Terrier or a working Greyhound may produce a BMI in the overweight range while actually being at a perfectly healthy body fat percentage. In these cases, the hands-on BCS check — running your hands along the ribs, assessing waist definition from above, and checking for a belly tuck from the side — is more informative than BMI alone.
                </p>
              </div>
              <div>
                <Image
                  src="/images/dog-bmi.png"
                  alt="Vet assessing dog body condition"
                  width={800}
                  height={500}
                  className={s.sectionImg}
                />
              </div>
            </div>
          </div>
        </section>

        {/* FOUR CATEGORIES */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>The four BMI zones</span>
            <h2 className={s.h2}>What each BMI category <em>means for your dog</em></h2>
            <p className={s.lead}>
              The BMI scale has four zones. Each one tells a different story about your dog&apos;s current health and what, if anything, needs to change.
            </p>

            <div className={s.factorGrid}>
              <div className={s.factorCard} style={{ borderColor: 'rgba(196,133,10,0.3)', background: '#FDF3E0' }}>
                <span className={s.factorCardIcon}>📉</span>
                <h3>Underweight (BMI under 18.5 · BCS 1–3)</h3>
                <p>
                  Ribs, spine, and hip bones are prominently visible and easy to see from a distance. The dog has little to no fat covering and may lack muscle mass as well. Causes include insufficient food, poor nutrient absorption, intestinal parasites, dental pain that prevents eating, or underlying illness. An underweight dog should be seen by a vet to identify the cause before simply increasing food.
                </p>
              </div>
              <div className={s.factorCard} style={{ borderColor: 'rgba(26,107,74,0.3)' }}>
                <span className={s.factorCardIcon}>✅</span>
                <h3>Healthy weight (BMI 18.5–25 · BCS 4–5)</h3>
                <p>
                  Ribs are easily felt with gentle pressure but not visible. There is a visible waist when viewed from above, and a gentle upward tuck of the belly from the side. The dog has a lean, athletic appearance. This is the target zone — maintaining it throughout life is associated with reduced joint disease, fewer metabolic problems, and a significantly longer lifespan compared to overweight dogs.
                </p>
              </div>
              <div className={s.factorCard} style={{ borderColor: 'rgba(196,133,10,0.3)', background: '#FDF3E0' }}>
                <span className={s.factorCardIcon}>⚠️</span>
                <h3>Overweight (BMI 25–30 · BCS 6–7)</h3>
                <p>
                  Ribs are palpable but with noticeable fat deposits. The waist is barely visible and the belly is slightly rounded. Overweight dogs tire more quickly on walks and often have reduced enthusiasm for exercise — which then makes the weight problem worse. A modest reduction in daily food (10–15%) combined with longer daily walks is usually sufficient to reverse mild overweight within 2–3 months.
                </p>
              </div>
              <div className={s.factorCard} style={{ borderColor: 'rgba(184,64,52,0.3)', background: '#FDF0EE' }}>
                <span className={s.factorCardIcon}>🚨</span>
                <h3>Obese (BMI over 30 · BCS 8–9)</h3>
                <p>
                  Ribs cannot be felt beneath a thick fat layer. The waist is absent and there may be fat deposits over the neck, shoulders, and base of the tail. Obese dogs are at high risk of osteoarthritis, type 2 diabetes, respiratory problems, and early death. Obesity at this level typically requires a supervised veterinary weight-loss plan — do not attempt rapid weight loss through severe restriction without professional guidance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REACHING HEALTHY WEIGHT */}
        <section className={s.sectionAlt}>
          <div className={s.container}>
            <span className={s.sectionLabel}>Practical steps</span>
            <h2 className={s.h2}>How to help your dog reach <em>a healthy weight</em></h2>

            <div className={`${s.splitRow} ${s.splitRowReverse}`}>
              <div>
                <Image
                  src="/images/is-my-dog-overweight.png"
                  alt="Dog on a walk with owner"
                  width={600}
                  height={400}
                  className={s.sectionImg}
                />
              </div>
              <div className={s.splitText}>
                <h3>For overweight dogs: reduce first, then move more</h3>
                <p>
                  The most effective approach is a combination of dietary restriction and increased activity, but the order matters. Start by reducing food portions by 10–15% — this alone produces meaningful results without the injury risk of suddenly increasing exercise in a dog that is deconditioned. After two weeks of successful calorie reduction, gradually extend daily walks by 10–15 minutes per week.
                </p>
                <p>
                  Measure food by weight using a kitchen scale rather than cups. Switch from high-calorie treats to low-calorie alternatives like carrot sticks, cucumber, or commercial low-fat treats. Count all food including treats, dental chews, and table scraps as part of the daily total.
                </p>
                <h3 style={{ marginTop: '16px' }}>For underweight dogs: increase gradually</h3>
                <p>
                  Do not try to rapidly catch an underweight dog up by doubling their food. Increase portions by 10% per week and monitor closely. If the dog is not gaining weight despite eating well, a vet check is needed to rule out malabsorption, parasites, or illness. Highly digestible, nutrient-dense foods are preferable to large volumes of low-quality food.
                </p>
                <ul>
                  <li>Weigh your dog fortnightly and track the trend</li>
                  <li>Use the food calculator to recalculate portions as weight changes</li>
                  <li>Aim for 1–2% body weight change per week maximum</li>
                  <li>Recheck BMI every 4–6 weeks during a weight management programme</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HEALTHY WEIGHT SIGNS */}
        <section className={s.section}>
          <div className={s.container}>
            <span className={s.sectionLabel}>The physical check</span>
            <h2 className={s.h2}>Five ways to tell if your dog is <em>the right weight</em></h2>
            <p className={s.lead}>
              No calculator replaces the hands-on body condition check. These five assessments take under a minute and give you a reliable read on your dog&apos;s condition between vet visits.
            </p>

            <div className={s.mistakesList}>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>👐</span>
                <div className={s.mistakeContent}>
                  <h3>The rib test</h3>
                  <p>
                    Run your flattened hands along both sides of your dog&apos;s ribcage with light pressure. At a healthy weight, you should feel each individual rib without pressing hard, but the ribs should not be prominently visible. If you cannot feel the ribs at all through a fat pad, your dog is overweight. If the ribs are sharply prominent and visible from across the room, your dog is underweight.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>👀</span>
                <div className={s.mistakeContent}>
                  <h3>The waist check (from above)</h3>
                  <p>
                    Stand above your dog and look down at their back. A healthy-weight dog should have a clear hourglass shape — wider at the chest and hips, noticeably narrower at the waist just behind the ribcage. A dog that is the same width from shoulders to hips, or wider at the middle, is overweight. Some deep-chested breeds like Greyhounds have a more exaggerated tuck that is completely normal for their breed.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>🐕</span>
                <div className={s.mistakeContent}>
                  <h3>The belly tuck (from the side)</h3>
                  <p>
                    Look at your dog from the side. The abdomen should tuck upward as it goes from the ribcage toward the hind legs — a gentle concavity. A sagging, rounded belly with no upward tuck is a reliable sign of excess abdominal fat. In contrast, an extreme tuck with visible hip bones and spine is a sign of being underweight. Both extremes are worth addressing.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>🏃</span>
                <div className={s.mistakeContent}>
                  <h3>Exercise tolerance</h3>
                  <p>
                    A dog at a healthy weight should be able to complete their usual walk without heavy panting, excessive rest breaks, or reluctance to continue. Overweight dogs tire noticeably faster and may sit or stop mid-walk. If your dog is lagging behind on walks they used to handle easily, or panting heavily after modest exertion, weight is a likely contributor — though a vet check to rule out respiratory or cardiac causes is also warranted.
                  </p>
                </div>
              </div>
              <div className={s.mistakeItem}>
                <span className={s.mistakeIcon}>💤</span>
                <div className={s.mistakeContent}>
                  <h3>Energy and coat condition</h3>
                  <p>
                    Dogs at a healthy weight tend to have a shiny, full coat and generally good energy levels appropriate for their age and breed. Overweight dogs often have dull coats — excess body fat can disrupt the balance of fatty acids available for skin and coat health. Underweight dogs may have dry, thin, or patchy coats as the body prioritises energy over coat maintenance. These are secondary signals but useful ones to notice.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '44px' }}>
              <Image
                src="/images/dog-bmi-calculator.png"
                alt="Owner checking dog body condition score"
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
            <h2>A healthy body needs a<br /><em>trained mind to match.</em></h2>
            <p>
              Good nutrition and weight management set your dog up physically. A personalised training plan gives them the mental stimulation and structure they need to thrive every day.
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
            <p className={s.footerLegal}>© 2026 PawCraft. This calculator provides general guidance only. Always consult a veterinary professional for weight management or health concerns.</p>
          </div>
        </footer>
      </main>
    </>
  )
}
