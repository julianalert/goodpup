import {
  dayKey,
  exerciseKey,
  progressId,
  ratingKey,
  TOTAL_DAYS,
  type DayFeel,
  type DayProgress,
  type ExerciseProgress,
  type PlanV2,
  type ProgressMap,
  type RatingProgress,
} from './plan-types'

// Pure helpers that turn the saved progress into what the training space shows.
// No React, no I/O: everything here takes the progress map (and "now") as input.

/** Days done before each behaviour check-in opens: start, then the end of weeks 1–4 */
export const CHECKPOINT_AFTER_DAYS = [0, 7, 14, 21, 30]
export const CHECKPOINT_LABELS = ['Start', 'Week 1', 'Week 2', 'Week 3', 'Week 4']

/** Calendar day in the visitor's own timezone, e.g. "2026-11-19" */
export function localDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getExercise(progress: ProgressMap, day: number, index: number): ExerciseProgress {
  const saved = progress[progressId('exercise', exerciseKey(day, index))] as Partial<ExerciseProgress> | undefined
  return { done: saved?.done === true, steps: Array.isArray(saved?.steps) ? saved.steps : [] }
}

export function getDay(progress: ProgressMap, day: number): DayProgress | null {
  const saved = progress[progressId('day', dayKey(day))] as DayProgress | undefined
  return saved?.done ? saved : null
}

export function getRating(progress: ProgressMap, problem: string, checkpoint: number): number | null {
  const saved = progress[progressId('rating', ratingKey(problem, checkpoint))] as RatingProgress | undefined
  return typeof saved?.score === 'number' ? saved.score : null
}

export interface Journey {
  /** Day numbers finished, ascending */
  doneDays: number[]
  /** The next day to do; null once all 30 are done */
  currentDay: number | null
  /** The day finished most recently, by time */
  lastFinishedDay: number | null
  /** The previous day was finished today, so the next one is meant for tomorrow */
  nextOpensTomorrow: boolean
  /** Consecutive calendar days with a finished day, counting back from today */
  streak: number
  minutesTrained: number
  exercisesDone: number
  /** How each finished day felt, by day number */
  feels: Record<number, DayFeel | undefined>
}

export function computeJourney(plan: PlanV2, progress: ProgressMap, now: Date): Journey {
  const doneDays: number[] = []
  const feels: Journey['feels'] = {}
  const trainedOn = new Set<string>()
  let lastFinishedAt: Date | null = null
  let lastFinishedDay: number | null = null

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const saved = getDay(progress, day)
    if (!saved) continue
    doneDays.push(day)
    feels[day] = saved.feel
    const at = saved.at ? new Date(saved.at) : null
    if (at && !Number.isNaN(at.getTime())) {
      trainedOn.add(localDay(at))
      if (!lastFinishedAt || at > lastFinishedAt) { lastFinishedAt = at; lastFinishedDay = day }
    }
  }

  let currentDay: number | null = null
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    if (!doneDays.includes(day)) { currentDay = day; break }
  }

  const today = localDay(now)
  const nextOpensTomorrow = Boolean(currentDay && lastFinishedAt && localDay(lastFinishedAt) === today)

  // Streak: walk back one calendar day at a time. A day not trained yet today doesn't break it.
  let streak = 0
  const cursor = new Date(now)
  if (!trainedOn.has(today)) cursor.setDate(cursor.getDate() - 1)
  while (trainedOn.has(localDay(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  let minutesTrained = 0
  let exercisesDone = 0
  for (const day of plan.days) {
    day.exercises.forEach((exercise, index) => {
      if (getExercise(progress, day.day, index).done) {
        exercisesDone += 1
        minutesTrained += exercise.minutes
      }
    })
  }

  return { doneDays, currentDay, lastFinishedDay, nextOpensTomorrow, streak, minutesTrained, exercisesDone, feels }
}

/**
 * The behaviour check-in the owner should fill in now, if any: the latest one that
 * has opened (enough days done) and still has a problem without a score.
 */
export function dueCheckpoint(progress: ProgressMap, problems: string[], daysDone: number): number | null {
  if (problems.length === 0) return null
  for (let checkpoint = CHECKPOINT_AFTER_DAYS.length - 1; checkpoint >= 0; checkpoint--) {
    if (daysDone < CHECKPOINT_AFTER_DAYS[checkpoint]) continue
    const missing = problems.some((p) => getRating(progress, p, checkpoint) === null)
    return missing ? checkpoint : null
  }
  return null
}

/** First and latest score for a problem, for the "8 → 4" summary. */
export function ratingChange(progress: ProgressMap, problem: string): { first: number; latest: number } | null {
  const scores = CHECKPOINT_AFTER_DAYS.map((_, c) => getRating(progress, problem, c)).filter((s): s is number => s !== null)
  if (scores.length < 2) return null
  return { first: scores[0], latest: scores[scores.length - 1] }
}
