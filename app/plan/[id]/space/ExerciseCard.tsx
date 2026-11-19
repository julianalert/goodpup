'use client'

import { useEffect, useRef, useState } from 'react'
import {
  PiArrowCounterClockwise, PiCaretDown, PiCheckBold, PiLifebuoy, PiPauseFill, PiPlayFill, PiTarget,
} from 'react-icons/pi'
import type { ExerciseProgress, PlanExercise } from '@/lib/plan-types'
import s from './space.module.css'

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** Countdown for one exercise. Keeps true time even if the phone locks mid-session. */
function Timer({ minutes }: { minutes: number }) {
  const total = minutes * 60
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)
  const endsAt = useRef(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) {
        setRunning(false)
        try { navigator.vibrate?.([200, 100, 200]) } catch { /* not supported */ }
      }
    }, 250)
    return () => clearInterval(id)
  }, [running])

  const toggle = () => {
    if (running) {
      setRunning(false)
      return
    }
    const from = left === 0 ? total : left
    setLeft(from)
    endsAt.current = Date.now() + from * 1000
    setRunning(true)
  }

  const reset = () => {
    setRunning(false)
    setLeft(total)
  }

  const finished = left === 0
  const started = left !== total
  const label = finished
    ? "Time's up. Start the timer again"
    : running ? 'Pause timer' : started ? 'Resume timer' : `Start a ${minutes}-minute timer`

  return (
    <div className={s.timer}>
      <button
        type="button"
        className={`${s.timerBtn} ${running ? s.timerRunning : ''} ${finished ? s.timerDone : ''}`}
        onClick={toggle}
        aria-label={label}
        title={label}
      >
        {running ? <PiPauseFill aria-hidden /> : <PiPlayFill aria-hidden />}
        <span aria-live={running ? 'off' : 'polite'}>{finished ? "Time's up" : clock(left)}</span>
      </button>
      {started && !running && !finished && (
        <button type="button" className={s.timerReset} onClick={reset} aria-label="Reset timer" title="Reset timer">
          <PiArrowCounterClockwise aria-hidden />
        </button>
      )}
    </div>
  )
}

interface Props {
  number: number
  exercise: PlanExercise
  state: ExerciseProgress
  open: boolean
  onToggle: () => void
  onChange: (next: ExerciseProgress) => void
}

export function ExerciseCard({ number, exercise, state, open, onToggle, onChange }: Props) {
  const [helpOpen, setHelpOpen] = useState(false)
  const stepsDone = state.steps.filter((i) => i < exercise.steps.length).length

  const toggleStep = (index: number) => {
    const steps = state.steps.includes(index)
      ? state.steps.filter((i) => i !== index)
      : [...state.steps, index].sort((a, b) => a - b)
    // Ticking the last step finishes the exercise; unticking one reopens it
    onChange({ steps, done: steps.length >= exercise.steps.length })
  }

  const toggleDone = () => {
    onChange(state.done
      ? { steps: [], done: false }
      : { steps: exercise.steps.map((_, i) => i), done: true })
  }

  return (
    <section className={`${s.ex} ${state.done ? s.exDone : ''} ${open ? s.exOpen : ''}`}>
      <button type="button" className={s.exHead} onClick={onToggle} aria-expanded={open}>
        <span className={s.exStatus}>{state.done ? <PiCheckBold aria-label="Done" /> : number}</span>
        <span className={s.exHeadText}>
          <span className={s.exName}>{exercise.name}</span>
          <span className={s.exMeta}>
            {exercise.minutes} min
            {state.done ? ' · Done' : stepsDone > 0 ? ` · ${stepsDone} of ${exercise.steps.length} steps` : ''}
          </span>
        </span>
        <PiCaretDown className={s.caret} aria-hidden />
      </button>

      {open && (
        <div className={s.exBody}>
          {exercise.why && <p className={s.exWhy}>{exercise.why}</p>}

          {exercise.needs.length > 0 && (
            <div>
              <span className={s.subLabel}>You&apos;ll need</span>
              <ul className={s.chips}>
                {exercise.needs.map((need) => <li key={need} className={s.chip}>{need}</li>)}
              </ul>
            </div>
          )}

          <div>
            <span className={s.subLabel}>Steps</span>
            <ol className={s.checklist}>
              {exercise.steps.map((step, i) => {
                const checked = state.steps.includes(i)
                return (
                  <li key={i}>
                    <button
                      type="button"
                      className={`${s.check} ${checked ? s.checkOn : ''}`}
                      onClick={() => toggleStep(i)}
                      aria-pressed={checked}
                    >
                      <span className={s.checkBox}>{checked ? <PiCheckBold aria-hidden /> : i + 1}</span>
                      <span className={s.checkText}>{step}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          {exercise.success && (
            <div className={s.goal}>
              <PiTarget aria-hidden />
              <div>
                <strong>You&apos;re done when</strong>
                <p>{exercise.success}</p>
              </div>
            </div>
          )}

          {exercise.ifStuck && (
            <div>
              <button type="button" className={s.helpToggle} onClick={() => setHelpOpen((v) => !v)} aria-expanded={helpOpen}>
                <PiLifebuoy aria-hidden />
                <span>If it&apos;s not working</span>
                <PiCaretDown className={`${s.caret} ${helpOpen ? s.caretOpen : ''}`} aria-hidden />
              </button>
              {helpOpen && <p className={s.helpText}>{exercise.ifStuck}</p>}
            </div>
          )}

          <div className={s.exActions}>
            {!state.done && <Timer minutes={exercise.minutes} />}
            <button type="button" className={state.done ? s.btnSecondary : s.btnPrimary} onClick={toggleDone}>
              {state.done ? 'Mark as not done' : 'Mark as done'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
