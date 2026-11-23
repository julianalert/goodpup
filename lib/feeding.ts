// How much a dog needs to eat, in one place: the free food calculator on the site
// and the nutrition plan add-on use the same formula, so they can never disagree.
// Safe to import from client and server code: constants and pure functions only.

export type Activity = 'low' | 'moderate' | 'high'

/** Multiplier on resting energy for the dog's stage of life */
export const LIFE_STAGE_FACTOR = {
  puppy: 2.5,
  adult: 1.6,
  senior: 1.2,
} as const

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  low: 1.0,
  moderate: 1.2,
  high: 1.4,
}

export const ACTIVITY_LABELS: Record<Activity, string> = {
  low: 'Quiet',
  moderate: 'Active',
  high: 'Very active',
}

export const KG_PER_LB = 0.453592

/** Resting energy requirement in kcal a day: 70 × kg^0.75 */
export const restingKcal = (kg: number) => 70 * Math.pow(kg, 0.75)

/** Calories a day, before rounding. 0 for a weight that makes no sense. */
export function dailyKcal(kg: number, stageFactor: number, activity: Activity): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  return restingKcal(kg) * stageFactor * ACTIVITY_FACTOR[activity]
}

// ── The nutrition plan's own view of life stage ────────────────────────────
// The quiz knows the dog's age more finely than the public calculator's three
// stages, and the plan is something people follow for months, so it is more
// careful than the calculator in two ways, both about growing dogs:
//   - an older puppy gets its own, lower factor (growth slows after six months);
//   - a growing dog is fed for growth alone. Its factor is not multiplied by
//     activity as well: that stacks to well over three times resting energy,
//     and overfeeding a growing dog, a large breed above all, harms its joints.

export interface FeedingStage {
  factor: number
  /** e.g. "puppy under 6 months" */
  label: string
  /** Still growing: its weight today is below the breed's adult range */
  growing: boolean
}

const FEEDING_STAGES: Record<string, FeedingStage> = {
  puppy_under6: { factor: LIFE_STAGE_FACTOR.puppy, label: 'puppy under 6 months', growing: true },
  puppy_6to12: { factor: 2.0, label: 'puppy of 6 to 12 months', growing: true },
  adolescent: { factor: LIFE_STAGE_FACTOR.adult, label: 'young adult (1 to 2 years)', growing: false },
  adult: { factor: LIFE_STAGE_FACTOR.adult, label: 'adult', growing: false },
  senior: { factor: LIFE_STAGE_FACTOR.senior, label: 'senior', growing: false },
}

/** "adult" → "an adult", "senior" → "a senior": the stage labels are written to follow an article */
export const withArticle = (phrase: string) => `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`

/** From the quiz's age answer. An unknown age is fed as an adult. */
export function feedingStage(dogAge: string | null | undefined): FeedingStage {
  return FEEDING_STAGES[dogAge ?? ''] ?? FEEDING_STAGES.adult
}

/** Calories a day for the nutrition plan. Activity only counts once the dog has stopped growing. */
export function planKcal(kg: number, stage: Pick<FeedingStage, 'factor' | 'growing'>, activity: Activity): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  return stage.growing ? restingKcal(kg) * stage.factor : dailyKcal(kg, stage.factor, activity)
}

export interface PortionRow {
  lb: number
  kg: number
  /** kcal a day at each activity level, rounded to the nearest 10. All three are equal for a growing dog. */
  low: number
  moderate: number
  high: number
}

const round10 = (n: number) => Math.round(n / 10) * 10

/** One row of the plan's table. `adjust` is the dog's own energyAdjustment(). */
export function portionRow(lb: number, stage: Pick<FeedingStage, 'factor' | 'growing'>, adjust = 1): PortionRow {
  const kg = lb * KG_PER_LB
  return {
    lb,
    kg: Math.round(kg * 10) / 10,
    low: round10(planKcal(kg, stage, 'low') * adjust),
    moderate: round10(planKcal(kg, stage, 'moderate') * adjust),
    high: round10(planKcal(kg, stage, 'high') * adjust),
  }
}

/** "30–55 lbs" → [30, 55]. Null when the text is not a range in pounds. */
export function parseWeightRange(text: string | null | undefined): [number, number] | null {
  const match = /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*(?:lbs?|pounds)/i.exec(text ?? '')
  if (!match) return null
  const low = Number(match[1])
  const high = Number(match[2])
  return low > 0 && high >= low ? [low, high] : null
}

/** A step that gives a table of about six to ten rows: 1, 2, 5, 10 or 20 lb */
function stepFor(span: number): number {
  if (span <= 7) return 1
  if (span <= 16) return 2
  if (span <= 45) return 5
  if (span <= 110) return 10
  return 20
}

/**
 * The weights the plan's portion table lists. With the breed's adult range, the
 * table runs a little either side of it (a growing puppy starts well below it);
 * without one, it covers small to giant dogs.
 */
export function portionWeights(adultRange: [number, number] | null, growing: boolean): number[] {
  if (!adultRange) return [5, 10, 15, 20, 30, 40, 50, 60, 70, 80, 100, 120]

  const [low, high] = adultRange
  const from = growing ? Math.max(2, low * 0.2) : low * 0.85
  const to = high * 1.15
  const step = stepFor(to - from)

  const weights: number[] = []
  for (let lb = Math.max(step, Math.floor(from / step) * step); lb <= Math.ceil(to / step) * step; lb += step) weights.push(lb)
  return weights
}

// ── What the owner's answers change ────────────────────────────────────────
// The nutrition plan asks about the dog's body and whether it is neutered.
// Both move the target a little; neither replaces a vet for a dog that is
// far from its ideal weight, and the plan says so.

export type BodyCondition = 'thin' | 'ideal' | 'heavy' | 'obese'
export type Neutered = 'yes' | 'no' | 'unsure'

/** A gentle first correction: about a tenth, then check again in two weeks */
const CONDITION_FACTOR: Record<BodyCondition, number> = {
  thin: 1.1,
  ideal: 1,
  heavy: 0.9,
  obese: 0.85,
}

// An adult that is not neutered burns a little more: 1.8 × resting energy against 1.6
const INTACT_ADULT_FACTOR = 1.8 / LIFE_STAGE_FACTOR.adult

/**
 * Multiplier on the day's calories for this dog's body condition and neuter
 * status. A growing dog is left alone: its amount is never cut or pushed
 * without a vet.
 */
export function energyAdjustment(
  stage: Pick<FeedingStage, 'factor' | 'growing'>,
  condition: BodyCondition | null | undefined,
  neutered: Neutered | null | undefined,
): number {
  if (stage.growing) return 1
  const intact = neutered === 'no' && stage.factor === LIFE_STAGE_FACTOR.adult ? INTACT_ADULT_FACTOR : 1
  return (CONDITION_FACTOR[condition ?? 'ideal'] ?? 1) * intact
}
