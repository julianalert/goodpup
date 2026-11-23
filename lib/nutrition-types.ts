// The nutrition plan add-on, as stored in submission_addons.content, and what the
// owner tells us about the dog before it is written (submission_addons.settings).
// Safe to import from client and server code: types and small pure helpers only.
//
// Its chapters and printable pages are built from the same blocks as the breed
// handbook's (lib/handbook-types.ts), so both share one renderer.

import {
  ACTIVITY_FACTOR,
  KG_PER_LB,
  energyAdjustment,
  planKcal,
  type Activity,
  type BodyCondition,
  type Neutered,
  type PortionRow,
} from './feeding'
import type { HandbookSection } from './handbook-types'

export type NutritionChapterId =
  | 'how_much' | 'what' | 'schedule' | 'treats' | 'foods' | 'switching' | 'tracking' | 'special'

export interface NutritionChapter {
  id: NutritionChapterId
  /** 2–9; chapter 1 is the feeding profile built from the plan's own fields */
  number: number
  title: string
  intro: string
  sections: HandbookSection[]
}

export type NutritionSheetId = 'feeding_chart' | 'weight_log' | 'shopping' | 'switch_schedule' | 'unsafe_foods'

export interface NutritionSheet {
  id: NutritionSheetId
  title: string
  note: string
  groups: { label: string; items: string[] }[]
}

export interface NutritionPlan {
  version: 1
  addon: 'nutrition_plan'
  /** "Max's Nutrition Plan" */
  title: string
  dogName: string
  /** Empty when the owner gave no breed */
  breed: string
  subtitle: string
  // Chapter 1, the feeding profile
  profileIntro: string
  facts: { label: string; value: string }[]
  keyPoints: string[]
  // The numbers. Worked out by lib/feeding.ts, never by the model.
  mealsPerDay: number
  /** Multiplier on resting energy for this dog's age, and how to describe it */
  stageFactor: number
  stageLabel: string
  /** Still growing: fed for growth alone, so activity does not change the amount */
  growing: boolean
  /** Calories a day by weight and activity, across the weights this dog could be */
  portions: PortionRow[]
  /** Where the table's weights come from, e.g. "the Border Collie's usual adult weight" */
  portionsNote: string
  // Chapters 2–9
  chapters: NutritionChapter[]
  sheets: NutritionSheet[]
  generatedAt: string
}

// ── The fixed shape of the plan ────────────────────────────────────────────

export const PROFILE_TITLE = (name: string) => `${name}'s feeding profile`

export const NUTRITION_CHAPTERS: { id: NutritionChapterId; number: number; title: (name: string) => string }[] = [
  { id: 'how_much', number: 2, title: () => 'How much to feed' },
  { id: 'what', number: 3, title: () => 'What to feed' },
  { id: 'schedule', number: 4, title: () => 'The daily schedule' },
  { id: 'treats', number: 5, title: () => 'Training treats without overfeeding' },
  { id: 'foods', number: 6, title: () => 'Safe and unsafe foods' },
  { id: 'switching', number: 7, title: () => 'Changing food and tummy troubles' },
  { id: 'tracking', number: 8, title: () => 'Weight and condition tracking' },
  { id: 'special', number: 9, title: (name) => `Special cases for ${name}` },
]

export const NUTRITION_SHEETS: { id: NutritionSheetId; title: (name: string) => string }[] = [
  { id: 'feeding_chart', title: (name) => `${name}'s feeding chart` },
  { id: 'weight_log', title: () => 'Weight and condition log' },
  { id: 'shopping', title: () => 'Shopping checklist' },
  { id: 'switch_schedule', title: () => 'Food switch schedule' },
  { id: 'unsafe_foods', title: () => 'Never feed these' },
]

export function isNutritionPlan(value: unknown): value is NutritionPlan {
  return Boolean(
    value && typeof value === 'object' &&
    (value as NutritionPlan).addon === 'nutrition_plan' &&
    (value as NutritionPlan).version === 1 &&
    Array.isArray((value as NutritionPlan).chapters) &&
    Array.isArray((value as NutritionPlan).portions),
  )
}

// ── What the owner tells us about the dog ──────────────────────────────────
// Asked in the training space once the add-on is paid for; the plan is written
// only when these are answered (ADDONS.nutrition_plan.intake). Saved in
// submission_addons.settings, where the portion calculator later updates the
// weight, activity and food as they change.

/** Share of the day's calories that may come from treats */
export const TREAT_SHARE = 0.1

export type WeightUnit = 'lb' | 'kg'
/** How the food's label states its calories */
export type FoodUnit = 'cup' | 'kg'

/** One choice in the question form */
export interface Choice<T extends string> { id: T; label: string; hint?: string }

export type Sex = 'male' | 'female'
export const SEX_CHOICES: Choice<Sex>[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
]

export const NEUTERED_CHOICES: Choice<Neutered>[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'unsure', label: 'Not sure' },
]

export const CONDITION_CHOICES: Choice<BodyCondition>[] = [
  { id: 'thin', label: 'Too thin', hint: 'Ribs, spine and hip bones show' },
  { id: 'ideal', label: 'Just right', hint: 'Ribs easy to feel, waist visible from above' },
  { id: 'heavy', label: 'A bit heavy', hint: 'Ribs hard to feel, waist barely there' },
  { id: 'obese', label: 'Very overweight', hint: 'No waist, ribs cannot be felt' },
]

export const ACTIVITY_CHOICES: Choice<Activity>[] = [
  { id: 'low', label: 'Quiet', hint: 'Short walks, mostly resting' },
  { id: 'moderate', label: 'Active', hint: 'Daily walks and play' },
  { id: 'high', label: 'Very active', hint: 'Runs, sport or working most days' },
]

export type FoodType = 'dry' | 'wet' | 'mixed' | 'fresh' | 'raw'
export const FOOD_CHOICES: Choice<FoodType>[] = [
  { id: 'dry', label: 'Dry kibble' },
  { id: 'wet', label: 'Wet food' },
  { id: 'mixed', label: 'Dry and wet' },
  { id: 'fresh', label: 'Fresh or home-cooked' },
  { id: 'raw', label: 'Raw' },
]

export type MealsNow = '1' | '2' | '3' | 'free'
export const MEALS_CHOICES: Choice<MealsNow>[] = [
  { id: '1', label: 'One' },
  { id: '2', label: 'Two' },
  { id: '3', label: 'Three or more' },
  { id: 'free', label: 'Bowl always full' },
]

export type TreatHabit = 'rare' | 'some' | 'many'
export const TREAT_CHOICES: Choice<TreatHabit>[] = [
  { id: 'rare', label: 'Rarely' },
  { id: 'some', label: 'A few a day' },
  { id: 'many', label: 'A lot', hint: 'Many treats, chews or table scraps' },
]

export type Concern = 'sensitive_stomach' | 'itchy_skin' | 'picky' | 'eats_fast' | 'begs'
export const CONCERN_CHOICES: Choice<Concern>[] = [
  { id: 'sensitive_stomach', label: 'Sensitive stomach' },
  { id: 'itchy_skin', label: 'Itchy skin or a suspected food allergy' },
  { id: 'picky', label: 'Picky eater' },
  { id: 'eats_fast', label: 'Eats too fast' },
  { id: 'begs', label: 'Begs or steals food' },
]

export const NOTES_MAX = 400

export interface NutritionProfile {
  /** The dog's weight today. The one answer nothing can be worked out without. */
  weight: number | null
  weightUnit: WeightUnit
  sex: Sex | null
  neutered: Neutered | null
  condition: BodyCondition | null
  activity: Activity
  foodType: FoodType | null
  /** kcal per cup, or per kg of food, as printed on the bag. Optional. */
  foodKcal: number | null
  foodUnit: FoodUnit
  mealsNow: MealsNow | null
  treats: TreatHabit | null
  concerns: Concern[]
  /** A diagnosed condition or a prescription diet: the vet's instructions come first */
  medical: boolean | null
  /** Anything else, in the owner's words */
  notes: string
}

const inRange = (value: unknown, min: number, max: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null

const pick = <T extends string>(value: unknown, choices: Choice<T>[]): T | null =>
  choices.some((c) => c.id === value) ? (value as T) : null

/** Whatever was stored or sent, as a profile that is safe to compute with and to put in a prompt. */
export function cleanNutritionProfile(value: unknown): NutritionProfile {
  const raw = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const weightUnit: WeightUnit = raw.weightUnit === 'kg' ? 'kg' : 'lb'
  const foodUnit: FoodUnit = raw.foodUnit === 'kg' ? 'kg' : 'cup'
  const concerns = Array.isArray(raw.concerns) ? raw.concerns : []
  return {
    weight: inRange(raw.weight, 0.5, weightUnit === 'kg' ? 120 : 260),
    weightUnit,
    sex: pick(raw.sex, SEX_CHOICES),
    neutered: pick(raw.neutered, NEUTERED_CHOICES),
    condition: pick(raw.condition, CONDITION_CHOICES),
    activity: typeof raw.activity === 'string' && raw.activity in ACTIVITY_FACTOR ? (raw.activity as Activity) : 'moderate',
    foodType: pick(raw.foodType, FOOD_CHOICES),
    // Dry food runs roughly 250–600 kcal a cup and 2,500–5,500 a kg; wet food far lower
    foodKcal: inRange(raw.foodKcal, foodUnit === 'kg' ? 300 : 30, foodUnit === 'kg' ? 7000 : 900),
    foodUnit,
    mealsNow: pick(raw.mealsNow, MEALS_CHOICES),
    treats: pick(raw.treats, TREAT_CHOICES),
    concerns: CONCERN_CHOICES.map((c) => c.id).filter((id) => concerns.includes(id)),
    medical: typeof raw.medical === 'boolean' ? raw.medical : null,
    notes: typeof raw.notes === 'string' ? raw.notes.replace(/\s+/g, ' ').trim().slice(0, NOTES_MAX) : '',
  }
}

/** The questions that must be answered before the plan can be written */
export type RequiredAnswer = 'weight' | 'sex' | 'neutered' | 'condition' | 'foodType' | 'mealsNow' | 'treats' | 'medical'

/** Which required answers are still missing. Empty = ready to write the plan. */
export function missingAnswers(profile: NutritionProfile): RequiredAnswer[] {
  const missing: RequiredAnswer[] = []
  if (profile.weight === null) missing.push('weight')
  if (profile.sex === null) missing.push('sex')
  if (profile.neutered === null) missing.push('neutered')
  if (profile.condition === null) missing.push('condition')
  if (profile.foodType === null) missing.push('foodType')
  if (profile.mealsNow === null) missing.push('mealsNow')
  if (profile.treats === null) missing.push('treats')
  if (profile.medical === null) missing.push('medical')
  return missing
}

export const profileWeightKg = (profile: Pick<NutritionProfile, 'weight' | 'weightUnit'>): number | null =>
  profile.weight === null ? null : profile.weightUnit === 'kg' ? profile.weight : profile.weight * KG_PER_LB

export const profileWeightLb = (profile: Pick<NutritionProfile, 'weight' | 'weightUnit'>): number | null =>
  profile.weight === null ? null : profile.weightUnit === 'lb' ? profile.weight : profile.weight / KG_PER_LB

// ── The numbers ────────────────────────────────────────────────────────────

export interface PortionResult {
  /** Everything the dog eats in a day */
  dailyKcal: number
  /** Of which meals… */
  mealKcal: number
  /** …and treats, training rewards included */
  treatKcal: number
  /** Food a day and per meal, in cups or grams. Null until the food's calories are known. */
  perDay: number | null
  perMeal: number | null
  amountUnit: 'cups' | 'g'
}

/**
 * This dog's day, from its profile. The plan's text quotes these figures and the
 * calculator recomputes them as the weight or the food changes, with the same
 * function, so they can never disagree. Null without a weight.
 */
export function portionResult(
  profile: NutritionProfile,
  plan: Pick<NutritionPlan, 'stageFactor' | 'growing' | 'mealsPerDay'>,
): PortionResult | null {
  const kg = profileWeightKg(profile)
  if (kg === null) return null
  const stage = { factor: plan.stageFactor, growing: Boolean(plan.growing) }
  const total = planKcal(kg, stage, profile.activity) * energyAdjustment(stage, profile.condition, profile.neutered)
  if (total <= 0) return null

  const treatKcal = total * TREAT_SHARE
  const mealKcal = total - treatKcal
  const amountUnit = profile.foodUnit === 'cup' ? 'cups' : 'g'

  let perDay: number | null = null
  if (profile.foodKcal) {
    perDay = profile.foodUnit === 'cup' ? mealKcal / profile.foodKcal : (mealKcal / profile.foodKcal) * 1000
  }
  const meals = Math.max(1, plan.mealsPerDay)

  return {
    dailyKcal: Math.round(total / 10) * 10,
    mealKcal: Math.round(mealKcal / 10) * 10,
    treatKcal: Math.round(treatKcal / 10) * 10,
    perDay,
    perMeal: perDay === null ? null : perDay / meals,
    amountUnit,
  }
}

/** 1.3 cups → "1 1/4 cups"; 212.4 g → "210 g". Kitchen-friendly, not falsely precise. */
export function formatAmount(amount: number, unit: 'cups' | 'g'): string {
  if (unit === 'g') return `${Math.max(5, Math.round(amount / 5) * 5)} g`

  // Cups to the nearest quarter, written the way a measuring cup is marked
  const quarters = Math.max(1, Math.round(amount * 4))
  const whole = Math.floor(quarters / 4)
  const fraction = ['', '1/4', '1/2', '3/4'][quarters % 4]
  const text = [whole > 0 ? String(whole) : '', fraction].filter(Boolean).join(' ')
  return `${text} ${quarters > 4 ? 'cups' : 'cup'}`
}
