// The structured plan ("plan v2") and the progress a customer records against it.
// Safe to import from client and server code: types and small pure helpers only.

// ── Plan content (generated once, stored in submissions.plan_json) ──────────

export interface PlanScore {
  /** e.g. "Drive level" */
  label: string
  /** e.g. "Very high" */
  level: string
  /** 0–100, drives the bar */
  percent: number
  why: string
}

export interface PlanProfile {
  /** One sentence: what life with this dog looks like after the 30 days */
  headline: string
  scores: PlanScore[]
  strengths: string[]
  watchouts: string[]
  rootCauses: { problem: string; explanation: string }[]
  /** Present when the dog's problems carry a risk of someone getting hurt */
  safety: { management: string; vet: string; professional: string } | null
}

export interface PlanWeek {
  week: number
  title: string
  focus: string
  /** The one rule to hold to this week */
  rule: string
  /** Concrete, checkable signs the week worked */
  milestones: string[]
}

export interface PlanExercise {
  name: string
  minutes: number
  /** Why this matters for this dog, one sentence */
  why: string
  /** Things to have at hand; empty when nothing is needed */
  needs: string[]
  /** One action per step */
  steps: string[]
  /** What "it worked" looks like today */
  success: string
  /** What to do when the dog doesn't get it */
  ifStuck: string
}

export interface PlanDay {
  day: number
  title: string
  /** One sentence: what today is for */
  focus: string
  exercises: PlanExercise[]
}

export interface PlanToolkit {
  /** "What to do when…" scripts for the heat of the moment */
  emergencies: { situation: string; steps: string[] }[]
  mistakes: { title: string; why: string }[]
  kit: { item: string; why: string }[]
  /** Rules everyone in the home follows, short enough to stick on the fridge */
  houseRules: string[]
}

export interface PlanV2 {
  version: 2
  profile: PlanProfile
  weeks: PlanWeek[]
  days: PlanDay[]
  toolkit: PlanToolkit
}

// ── Progress (one row per item in plan_progress) ────────────────────────────

export type ProgressKind = 'exercise' | 'day' | 'milestone' | 'rating'

export type DayFeel = 'tough' | 'ok' | 'nailed'

export interface ExerciseProgress { done: boolean; steps: number[] }
export interface DayProgress { done: boolean; feel?: DayFeel; note?: string; at: string }
export interface MilestoneProgress { done: boolean }
export interface RatingProgress { score: number; at: string }

export interface ProgressEntry {
  kind: ProgressKind
  key: string
  value: unknown
}

/** Progress as the page holds it: `${kind}:${key}` → value */
export type ProgressMap = Record<string, unknown>

export const progressId = (kind: ProgressKind, key: string) => `${kind}:${key}`

// Keys. One place so the page and the API agree on their shape.
export const exerciseKey = (day: number, index: number) => `d${day}.e${index}`
export const dayKey = (day: number) => `d${day}`
export const milestoneKey = (week: number, index: number) => `w${week}.m${index}`
/** checkpoint 0 = before starting, 1–4 = end of that week */
export const ratingKey = (problem: string, checkpoint: number) => `${problem}@${checkpoint}`

export const PROGRESS_KEY_PATTERNS: Record<ProgressKind, RegExp> = {
  exercise: /^d([1-9]|[12]\d|30)\.e[0-5]$/,
  day: /^d([1-9]|[12]\d|30)$/,
  milestone: /^w[1-4]\.m\d$/,
  rating: /^[a-z_]{2,30}@[0-4]$/,
}

export const TOTAL_DAYS = 30

/** Week 1 = days 1–7, week 2 = 8–14, week 3 = 15–21, week 4 = 22–30 */
export function weekOfDay(day: number): number {
  return Math.min(4, Math.ceil(day / 7))
}

export function daysOfWeek(week: number): number[] {
  const first = (week - 1) * 7 + 1
  const last = week === 4 ? TOTAL_DAYS : week * 7
  return Array.from({ length: last - first + 1 }, (_, i) => first + i)
}

export function isPlanV2(value: unknown): value is PlanV2 {
  return Boolean(
    value && typeof value === 'object' &&
    (value as PlanV2).version === 2 &&
    Array.isArray((value as PlanV2).days) &&
    Array.isArray((value as PlanV2).weeks),
  )
}

/** "willow" → "Willow", "mr bean" → "Mr Bean". Owners often type the name in lower case. */
export function properName(raw: string | null | undefined, fallback: string): string {
  const name = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!name) return fallback
  return name.replace(/(^|[\s-])(\p{L})/gu, (_, gap: string, letter: string) => gap + letter.toUpperCase())
}
