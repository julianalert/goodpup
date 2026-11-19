import { TOTAL_DAYS } from './plan-types'

// Pure decision logic for the daily reminder emails: given what we know about a
// plan and the current time, should an email go out now, and which one?
// No I/O here, so every rule below can be tested directly.

export const DEFAULT_REMINDER_HOUR = 8
/** Used until the customer has opened their space once (that is when we learn their timezone) */
export const DEFAULT_TIMEZONE = 'America/New_York'
/** After this many reminders in a row with no day finished, we stop writing */
export const MAX_UNANSWERED = 5
/** Days without training before the reminder changes to the "pick it back up" email */
const LAPSE_AFTER_DAYS = 2
/** No reminder this soon after the "plan is ready" email */
const QUIET_AFTER_READY_HOURS = 10

export type ReminderKind = 'daily' | 'lapse' | 'last'

export interface ReminderInput {
  now: Date
  remindersEnabled: boolean
  reminderHour: number
  timezone: string | null
  planReadyAt: string | null
  lastReminderAt: string | null
  remindersUnanswered: number
  /** Finished days: number and when it was finished */
  doneDays: { day: number; at: string }[]
}

export type ReminderDecision =
  | { send: false; reason: string }
  | { send: true; kind: ReminderKind; day: number; unanswered: number; weekJustCompleted: number | null }

/** Is this a timezone name the runtime knows? */
export function isValidTimezone(tz: string | null | undefined): tz is string {
  if (!tz || tz.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Calendar day and hour on the customer's own clock */
export function localClock(date: Date, timezone: string): { day: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) }
}

const daysBetween = (fromDay: string, toDay: string) =>
  Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000)

export function decideReminder(input: ReminderInput): ReminderDecision {
  if (!input.remindersEnabled) return { send: false, reason: 'reminders are off' }

  const timezone = isValidTimezone(input.timezone) ? input.timezone : DEFAULT_TIMEZONE
  const local = localClock(input.now, timezone)

  if (local.hour !== input.reminderHour) return { send: false, reason: 'not their reminder hour' }

  if (input.lastReminderAt && localClock(new Date(input.lastReminderAt), timezone).day === local.day) {
    return { send: false, reason: 'already reminded today' }
  }

  const done = new Set(input.doneDays.map((d) => d.day))
  let nextDay: number | null = null
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    if (!done.has(day)) { nextDay = day; break }
  }
  if (nextDay === null) return { send: false, reason: 'program finished' }

  // Latest sign of life: the last finished day, or the plan becoming ready
  const finishedAt = input.doneDays
    .map((d) => new Date(d.at))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

  if (finishedAt && localClock(finishedAt, timezone).day === local.day) {
    return { send: false, reason: 'already trained today' }
  }

  const readyAt = input.planReadyAt ? new Date(input.planReadyAt) : null
  if (!finishedAt && readyAt && input.now.getTime() - readyAt.getTime() < QUIET_AFTER_READY_HOURS * 3_600_000) {
    return { send: false, reason: 'plan was delivered a few hours ago' }
  }

  // A day finished since the last reminder means they are answering: start counting again
  const lastReminder = input.lastReminderAt ? new Date(input.lastReminderAt) : null
  const answered = Boolean(finishedAt && lastReminder && finishedAt > lastReminder)
  const unansweredSoFar = answered ? 0 : input.remindersUnanswered

  if (unansweredSoFar >= MAX_UNANSWERED) return { send: false, reason: 'stopped after unanswered reminders' }

  const lastActive = finishedAt ?? readyAt
  const idleDays = lastActive ? daysBetween(localClock(lastActive, timezone).day, local.day) : 0

  const unanswered = unansweredSoFar + 1
  const kind: ReminderKind = unanswered >= MAX_UNANSWERED ? 'last' : idleDays >= LAPSE_AFTER_DAYS ? 'lapse' : 'daily'

  // The first morning of a new week doubles as the recap of the week just finished
  const weekJustCompleted = kind === 'daily' && finishedAt && [8, 15, 22].includes(nextDay) ? (nextDay - 1) / 7 : null

  return { send: true, kind, day: nextDay, unanswered, weekJustCompleted }
}
