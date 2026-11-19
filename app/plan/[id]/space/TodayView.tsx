'use client'

import { useState } from 'react'
import type { IconType } from 'react-icons'
import {
  PiArrowLeft, PiCamera, PiCaretRight, PiCheckBold, PiCheckCircleFill, PiClock, PiFireFill, PiFlag,
  PiListChecks, PiLockSimple, PiPushPinFill, PiShieldCheck, PiSmiley, PiSmileyMeh, PiSmileySad,
  PiTrophyFill, PiX,
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

const FEELS: { id: DayFeel; label: string; Icon: IconType; reply: string }[] = [
  { id: 'tough', label: 'Tough', Icon: PiSmileySad, reply: "Tough days are part of it, and they don't undo the good ones. Tomorrow, open \"If it's not working\" on the first exercise before you start, and keep the sessions short." },
  { id: 'ok', label: 'OK', Icon: PiSmileyMeh, reply: 'Solid. Showing up every day matters more than any single perfect session.' },
  { id: 'nailed', label: 'Nailed it', Icon: PiSmiley, reply: 'That is what it looks like when it clicks. Enjoy it.' },
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
    const changes = problems
      .map((p) => ({ ...p, change: ratingChange(store.progress, p.id) }))
      .filter((p) => p.change !== null)

    return (
      <div className={s.stack}>
        <section className={`${s.card} ${s.celebrate}`}>
          <div className={s.celebrateIcon}><PiTrophyFill aria-hidden /></div>
          <h1 className={s.title}>30 days. Done.</h1>
          <p className={s.lead}>
            You and {dogName} finished the whole program: {journey.exercisesDone} exercises and {journey.minutesTrained} minutes of training.
            Most people never get past week one.
          </p>
          {changes.length > 0 && (
            <ul className={s.changeList}>
              {changes.map((p) => (
                <li key={p.id}><span>{p.label}</span><strong>{p.change!.first} → {p.change!.latest}</strong></li>
              ))}
            </ul>
          )}
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
          <div className={s.celebrateIcon}><PiCheckBold aria-hidden /></div>
          <h1 className={s.title}>Day {finished} done</h1>
          {journey.streak > 1 && (
            <div className={s.streakChip}><PiFireFill aria-hidden /> {journey.streak} days in a row</div>
          )}
          {reply && <p className={s.lead}>{reply}</p>}
        </section>

        {checkpoint !== null && checkpoint > 0 && (
          <RatingCard checkpoint={checkpoint} problems={problems} dogName={dogName} store={store} />
        )}

        {weekJustEnded && (
          <button type="button" className={s.rowLink} onClick={() => onShowTab('journey')}>
            <span className={s.rowIcon}><PiFlag aria-hidden /></span>
            <span className={s.rowText}>
              <strong>Week {weekOfDay(finished)} is complete</strong>
              <span>Tick off the milestones {dogName} has reached</span>
            </span>
            <PiCaretRight className={s.chevron} aria-hidden />
          </button>
        )}

        <section className={s.card}>
          <div className={s.cardHead}>
            <div className={`${s.kicker} ${s.kickerMuted}`}><PiLockSimple aria-hidden /> Tomorrow · Day {day.day}</div>
            <h2 className={s.h2}>{day.title}</h2>
            <p className={s.body2}>{day.focus}</p>
          </div>
          <ul className={s.previewList}>
            {day.exercises.map((e, i) => <li key={i}>{e.name} <span>{e.minutes} min</span></li>)}
          </ul>
          <p className={s.caption}>Dogs learn between sessions, so one day at a time works best.</p>
          <button type="button" className={s.textBtn} onClick={() => setStartedEarly(true)}>
            Start Day {day.day} now anyway
          </button>
        </section>
      </div>
    )
  }

  // ── A day to work through ──────────────────────────────────────────────
  const states = day.exercises.map((_, i) => getExercise(store.progress, day.day, i))
  const doneCount = states.filter((state) => state.done).length
  const allDone = doneCount === states.length
  const savedDay = getDay(store.progress, day.day)
  const week = plan.weeks[weekOfDay(day.day) - 1]
  const showBaseline = following && checkpoint === 0 && !skippedBaseline && journey.doneDays.length === 0
  const showSafety = Boolean(plan.profile.safety) && day.day <= 3
  const showSetup = following && !hasPhoto && !setupDismissed && journey.doneDays.length < 3

  return (
    <div className={s.stack}>
      {!following && (
        <button type="button" className={s.back} onClick={onCloseDay}>
          <PiArrowLeft aria-hidden /> Back to {journey.currentDay ? `Day ${journey.currentDay}` : 'today'}
        </button>
      )}

      <header className={s.hero}>
        <div className={s.kicker}>
          Day {day.day} · Week {week.week}
          {!following && <span className={s.badge}>{savedDay ? 'Completed' : 'Preview'}</span>}
        </div>
        <h1 className={s.title}>{day.title}</h1>
        <p className={s.lead}>{day.focus}</p>
        <div className={s.heroMeta}>
          <span><PiClock aria-hidden /> {minutesOf(day)} min</span>
          <span>
            <PiListChecks aria-hidden />
            {doneCount > 0
              ? `${doneCount} of ${states.length} done`
              : `${states.length} ${states.length === 1 ? 'exercise' : 'exercises'}`}
          </span>
        </div>
        <div className={s.segments} aria-hidden>
          {states.map((state, i) => <span key={i} className={`${s.segment} ${state.done ? s.segmentDone : ''}`} />)}
        </div>
      </header>

      {showBaseline && (
        <RatingCard checkpoint={0} problems={problems} dogName={dogName} store={store} onSkip={() => setSkippedBaseline(true)} />
      )}

      {week.rule && (
        <div className={s.rule}>
          <PiPushPinFill aria-hidden />
          <div>
            <strong>This week&apos;s rule</strong>
            <p>{week.rule}</p>
          </div>
        </div>
      )}

      {showSafety && (
        <button type="button" className={s.rowLink} onClick={() => onShowTab('profile')}>
          <span className={`${s.rowIcon} ${s.rowIconDanger}`}><PiShieldCheck aria-hidden /></span>
          <span className={s.rowText}>
            <strong>Safety notes for {dogName}</strong>
            <span>Read these before you start</span>
          </span>
          <PiCaretRight className={s.chevron} aria-hidden />
        </button>
      )}

      <section className={s.section} aria-labelledby="exercises-title">
        <div className={s.sectionHead}>
          <h2 id="exercises-title" className={s.h2}>Exercises</h2>
        </div>
        <DayExercises key={`exercises-${day.day}`} day={day} states={states} store={store} sessionId={sessionId} />
      </section>

      {savedDay ? (
        <section className={s.dayDone}>
          <PiCheckCircleFill aria-hidden />
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
        <p className={`${s.caption} ${s.center}`}>Finish every exercise to complete Day {day.day}.</p>
      )}

      {showSetup && (
        <div className={s.rowLink}>
          <span className={s.rowIcon}><PiCamera aria-hidden /></span>
          <button type="button" className={s.rowText} onClick={() => onShowTab('profile')}>
            <strong>Make this space {dogName}&apos;s</strong>
            <span>
              Add a photo{reminderHour !== null ? ` and pick when the daily email arrives (now ${formatHour(reminderHour)})` : ' and turn on a daily reminder'}.
            </span>
          </button>
          <button type="button" className={s.dismiss} onClick={dismissSetup} aria-label="Dismiss">
            <PiX aria-hidden />
          </button>
        </div>
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
      <h2 className={s.h2}>How did today go?</h2>
      <div className={s.feels}>
        {FEELS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`${s.feel} ${feel === id ? s.feelOn : ''}`}
            aria-pressed={feel === id}
            onClick={() => setFeel(id)}
          >
            <Icon aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <textarea
        className={s.textarea}
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
