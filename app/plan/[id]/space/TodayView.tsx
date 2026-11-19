'use client'

import { useState } from 'react'
import {
  PiArrowLeftBold, PiArrowRightBold, PiCameraBold, PiCheckBold, PiClockBold, PiFireFill,
  PiLockSimpleFill, PiShieldCheckBold, PiTrophyFill, PiXBold,
} from 'react-icons/pi'
import { dayKey, exerciseKey, weekOfDay, TOTAL_DAYS, type DayFeel, type PlanDay, type PlanV2 } from '@/lib/plan-types'
import { dueCheckpoint, getDay, getExercise, ratingChange, type Journey } from '@/lib/plan-progress'
import { trackEvent } from '@/lib/mixpanel-client'
import { ExerciseCard } from './ExerciseCard'
import { RatingCard } from './RatingCard'
import type { ProgressStore } from './useProgress'
import s from './space.module.css'

interface Props {
  sessionId: string
  dogName: string
  problems: { id: string; label: string }[]
  plan: PlanV2
  journey: Journey
  store: ProgressStore
  hasPhoto: boolean
  /** Hour of the daily reminder email, or null when reminders are off */
  reminderHour: number | null
  /** A day opened from the journey; null = follow the program */
  openDay: number | null
  onCloseDay: () => void
  onShowTab: (tab: 'journey' | 'progress' | 'profile') => void
}

const FEELS: { id: DayFeel; label: string; reply: string }[] = [
  { id: 'tough', label: 'Tough', reply: "Tough days are part of it, and they don't undo the good ones. Tomorrow, open \"If it's not working\" on the first exercise before you start, and keep the sessions short." },
  { id: 'ok', label: 'OK', reply: 'Solid. Showing up every day matters more than any single perfect session.' },
  { id: 'nailed', label: 'Nailed it', reply: 'That is what it looks like when it clicks. Enjoy it.' },
]

const formatHour = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'am' : 'pm'}`

const minutesOf = (day: PlanDay) => day.exercises.reduce((total, e) => total + e.minutes, 0)

export function TodayView({ sessionId, dogName, problems, plan, journey, store, hasPhoto, reminderHour, openDay, onCloseDay, onShowTab }: Props) {
  const [startedEarly, setStartedEarly] = useState(false)
  const [skippedBaseline, setSkippedBaseline] = useState(false)
  // "Make it yours" nudge: remembered per plan on this device once dismissed
  const setupKey = `pawcraft_setup_${sessionId}`
  const [setupDismissed, setSetupDismissed] = useState(() => {
    try { return localStorage.getItem(setupKey) === '1' } catch { return false }
  })
  const dismissSetup = () => {
    setSetupDismissed(true)
    try { localStorage.setItem(setupKey, '1') } catch { /* private mode */ }
  }

  const problemIds = problems.map((p) => p.id)
  const checkpoint = dueCheckpoint(store.progress, problemIds, journey.doneDays.length)
  const following = openDay === null

  // ── All 30 days done ───────────────────────────────────────────────────
  if (following && journey.currentDay === null) {
    return (
      <div className={s.stack}>
        <section className={`${s.card} ${s.celebrate}`}>
          <div className={s.bigIcon}><PiTrophyFill aria-hidden /></div>
          <h2 className={s.heroTitle}>30 days. Done.</h2>
          <p className={s.cardText}>
            You and {dogName} finished the whole program: {journey.exercisesDone} exercises and {journey.minutesTrained} minutes of training.
            Most people never get past week one.
          </p>
          <div className={s.changeList}>
            {problems.map((p) => {
              const change = ratingChange(store.progress, p.id)
              if (!change) return null
              return (
                <div key={p.id} className={s.changeRow}>
                  <span>{p.label}</span>
                  <strong>{change.first} → {change.latest}</strong>
                </div>
              )
            })}
          </div>
          <button type="button" className={s.btnPrimary} onClick={() => onShowTab('progress')}>See {dogName}&apos;s progress</button>
        </section>
        {checkpoint !== null && <RatingCard checkpoint={checkpoint} problems={problems} dogName={dogName} store={store} />}
      </div>
    )
  }

  const dayNumber = openDay ?? journey.currentDay ?? TOTAL_DAYS
  const day = plan.days[dayNumber - 1]

  // ── Today's day is finished; the next one is for tomorrow ──────────────
  if (following && journey.nextOpensTomorrow && !startedEarly) {
    const finished = journey.lastFinishedDay ?? dayNumber - 1
    const saved = getDay(store.progress, finished)
    const reply = FEELS.find((f) => f.id === saved?.feel)?.reply
    const weekJustEnded = finished % 7 === 0 || finished === TOTAL_DAYS

    return (
      <div className={s.stack}>
        <section className={`${s.card} ${s.celebrate}`}>
          <div className={s.bigIcon}><PiCheckBold aria-hidden /></div>
          <h2 className={s.heroTitle}>Day {finished} done</h2>
          {journey.streak > 1 && (
            <div className={s.streakLine}><PiFireFill aria-hidden /> {journey.streak} days in a row</div>
          )}
          {reply && <p className={s.cardText}>{reply}</p>}
        </section>

        {checkpoint !== null && checkpoint > 0 && (
          <RatingCard checkpoint={checkpoint} problems={problems} dogName={dogName} store={store} />
        )}

        {weekJustEnded && (
          <button type="button" className={`${s.card} ${s.nudge}`} onClick={() => onShowTab('journey')}>
            <span>
              <strong>Week {weekOfDay(finished)} is complete.</strong> Tick off the milestones {dogName} has reached.
            </span>
            <PiArrowRightBold aria-hidden />
          </button>
        )}

        <section className={`${s.card} ${s.tomorrow}`}>
          <div className={s.eyebrow}><PiLockSimpleFill aria-hidden /> Tomorrow · Day {day.day}</div>
          <h3 className={s.cardTitle}>{day.title}</h3>
          <p className={s.cardText}>{day.focus}</p>
          <ul className={s.previewList}>
            {day.exercises.map((e, i) => <li key={i}>{e.name} <span>{e.minutes} min</span></li>)}
          </ul>
          <p className={s.fine}>
            Dogs learn between sessions, so one day at a time works best. Come back tomorrow.
          </p>
          <button type="button" className={s.linkBtn} onClick={() => setStartedEarly(true)}>
            Start Day {day.day} now anyway
          </button>
        </section>
      </div>
    )
  }

  // ── A day to work through ──────────────────────────────────────────────
  const states = day.exercises.map((_, i) => getExercise(store.progress, day.day, i))
  const allDone = states.every((state) => state.done)
  const savedDay = getDay(store.progress, day.day)
  const week = plan.weeks[weekOfDay(day.day) - 1]
  const showBaseline = following && checkpoint === 0 && !skippedBaseline && journey.doneDays.length === 0

  return (
    <div className={s.stack}>
      {!following && (
        <button type="button" className={s.backLink} onClick={onCloseDay}>
          <PiArrowLeftBold aria-hidden /> Back to {journey.currentDay ? `Day ${journey.currentDay}` : 'today'}
        </button>
      )}

      {showBaseline && (
        <RatingCard checkpoint={0} problems={problems} dogName={dogName} store={store} onSkip={() => setSkippedBaseline(true)} />
      )}

      <header className={s.dayHead}>
        <div className={s.eyebrow}>
          {following ? 'Today' : savedDay ? 'Completed' : 'Preview'} · Day {day.day} of {TOTAL_DAYS} · Week {week.week}
        </div>
        <h1 className={s.dayTitle}>{day.title}</h1>
        <p className={s.dayFocus}>{day.focus}</p>
        <div className={s.dayMeta}>
          <span><PiClockBold aria-hidden /> {minutesOf(day)} min</span>
          <span>{day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}</span>
        </div>
      </header>

      {following && !showBaseline && !hasPhoto && !setupDismissed && journey.doneDays.length < 3 && (
        <div className={s.setupNudge}>
          <button type="button" className={s.setupNudgeMain} onClick={() => onShowTab('profile')}>
            <PiCameraBold aria-hidden />
            <span>
              <strong>Make this space {dogName}&apos;s.</strong>{' '}
              Add a photo{reminderHour !== null ? `, and choose when the daily email arrives (now ${formatHour(reminderHour)})` : ' and turn on a daily reminder'}.
            </span>
          </button>
          <button type="button" className={s.setupNudgeClose} onClick={dismissSetup} aria-label="Dismiss">
            <PiXBold aria-hidden />
          </button>
        </div>
      )}

      {week.rule && (
        <div className={s.rule}>
          <span className={s.blockLabel}>This week&apos;s rule</span>
          {week.rule}
        </div>
      )}

      {plan.profile.safety && day.day <= 3 && (
        <button type="button" className={s.safetyLink} onClick={() => onShowTab('profile')}>
          <PiShieldCheckBold aria-hidden />
          <span>Read the safety notes for {dogName} before you start</span>
          <PiArrowRightBold aria-hidden />
        </button>
      )}

      <DayExercises key={`exercises-${day.day}`} day={day} states={states} store={store} sessionId={sessionId} />

      {savedDay ? (
        <section className={`${s.card} ${s.dayDone}`}>
          <PiCheckBold aria-hidden />
          <div>
            <strong>Day {day.day} is done.</strong>
            {savedDay.note && <p className={s.note}>&ldquo;{savedDay.note}&rdquo;</p>}
          </div>
        </section>
      ) : allDone ? (
        <CheckIn
          key={`checkin-${day.day}`}
          dayNumber={day.day}
          dogName={dogName}
          onFinish={(feel, note) => {
            store.save('day', dayKey(day.day), { done: true, feel, ...(note ? { note } : {}), at: new Date().toISOString() })
            trackEvent('plan_day_completed', { session_id: sessionId, day: day.day, feel })
            // Back to the normal rhythm: the day after this one waits for tomorrow again
            setStartedEarly(false)
            if (!following) onCloseDay()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      ) : (
        <p className={s.fine}>Finish every exercise to complete Day {day.day}.</p>
      )}
    </div>
  )
}

function DayExercises({ day, states, store, sessionId }: {
  day: PlanDay
  states: ReturnType<typeof getExercise>[]
  store: ProgressStore
  sessionId: string
}) {
  // Open the first exercise that still needs doing
  const [open, setOpen] = useState<number | null>(() => {
    const next = states.findIndex((state) => !state.done)
    return next === -1 ? null : next
  })

  return (
    <div className={s.exercises}>
      {day.exercises.map((exercise, i) => (
        <ExerciseCard
          key={i}
          number={i + 1}
          exercise={exercise}
          state={states[i]}
          open={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
          onChange={(next) => {
            store.save('exercise', exerciseKey(day.day, i), next)
            if (next.done && !states[i].done) {
              trackEvent('plan_exercise_completed', { session_id: sessionId, day: day.day, exercise: i + 1 })
              // Move on to the next one that is still open
              const following = states.findIndex((state, j) => j !== i && !state.done)
              setOpen(following === -1 ? null : following)
            }
          }}
        />
      ))}
    </div>
  )
}

function CheckIn({ dayNumber, dogName, onFinish }: {
  dayNumber: number
  dogName: string
  onFinish: (feel: DayFeel, note: string) => void
}) {
  const [feel, setFeel] = useState<DayFeel | null>(null)
  const [note, setNote] = useState('')

  return (
    <section className={`${s.card} ${s.checkin}`}>
      <h2 className={s.cardTitle}>How did today go?</h2>
      <div className={s.feels}>
        {FEELS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`${s.feel} ${feel === f.id ? s.feelOn : ''}`}
            aria-pressed={feel === f.id}
            onClick={() => setFeel(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <textarea
        className={s.noteInput}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={600}
        rows={2}
        placeholder={`Anything to remember about ${dogName} today? (optional)`}
      />
      <button
        type="button"
        className={s.btnPrimary}
        disabled={!feel}
        onClick={() => feel && onFinish(feel, note.trim())}
      >
        {feel ? `Finish Day ${dayNumber}` : 'Pick how it went'}
      </button>
    </section>
  )
}
