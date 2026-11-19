'use client'

import { useEffect, useRef, useState } from 'react'
import {
  PiArrowCounterClockwiseBold, PiCaretDownBold, PiCheckBold, PiClockBold,
  PiPauseFill, PiPlayFill, PiQuestionBold, PiTargetBold,
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

  return (
    <div className={`${s.timer} ${running ? s.timerRunning : ''} ${finished ? s.timerDone : ''}`}>
      <button type="button" className={s.timerMain} onClick={toggle}>
        {running ? <PiPauseFill aria-hidden /> : <PiPlayFill aria-hidden />}
        <span className={s.timerClock}>{clock(left)}</span>
        <span className={s.timerLabel}>
          {finished ? "Time's up. Start again" : running ? 'Pause' : started ? 'Resume' : `Start ${minutes}-minute timer`}
        </span>
      </button>
      {started && !running && !finished && (
        <button type="button" className={s.timerReset} onClick={reset} aria-label="Reset timer">
          <PiArrowCounterClockwiseBold aria-hidden />
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
    <section className={`${s.exercise} ${state.done ? s.exerciseDone : ''} ${open ? s.exerciseOpen : ''}`}>
      <button type="button" className={s.exerciseHead} onClick={onToggle} aria-expanded={open}>
        <span className={s.exerciseNum}>{state.done ? <PiCheckBold aria-hidden /> : number}</span>
        <span className={s.exerciseTitle}>
          <span className={s.exerciseName}>{exercise.name}</span>
          <span className={s.exerciseMeta}>
            <PiClockBold aria-hidden /> {exercise.minutes} min
            {!state.done && stepsDone > 0 && <> · {stepsDone} of {exercise.steps.length} steps</>}
            {state.done && <> · Done</>}
          </span>
        </span>
        <PiCaretDownBold className={s.caret} aria-hidden />
      </button>

      {open && (
        <div className={s.exerciseBody}>
          {exercise.why && <p className={s.why}>{exercise.why}</p>}

          {exercise.needs.length > 0 && (
            <div className={s.needs}>
              <span className={s.needsLabel}>You need</span>
              {exercise.needs.map((need) => <span key={need} className={s.chip}>{need}</span>)}
            </div>
          )}

          <ol className={s.steps}>
            {exercise.steps.map((step, i) => {
              const checked = state.steps.includes(i)
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={`${s.step} ${checked ? s.stepDone : ''}`}
                    onClick={() => toggleStep(i)}
                    aria-pressed={checked}
                  >
                    <span className={s.stepBox}>{checked ? <PiCheckBold aria-hidden /> : i + 1}</span>
                    <span className={s.stepText}>{step}</span>
                  </button>
                </li>
              )
            })}
          </ol>

          <Timer minutes={exercise.minutes} />

          {exercise.success && (
            <div className={s.success}>
              <PiTargetBold aria-hidden />
              <div>
                <span className={s.blockLabel}>You&apos;re done when</span>
                {exercise.success}
              </div>
            </div>
          )}

          {exercise.ifStuck && (
            <div className={s.help}>
              <button type="button" className={s.helpToggle} onClick={() => setHelpOpen((v) => !v)} aria-expanded={helpOpen}>
                <PiQuestionBold aria-hidden />
                <span>If it&apos;s not working</span>
                <PiCaretDownBold className={`${s.caret} ${helpOpen ? s.caretOpen : ''}`} aria-hidden />
              </button>
              {helpOpen && <p className={s.helpText}>{exercise.ifStuck}</p>}
            </div>
          )}

          <button type="button" className={state.done ? s.btnGhost : s.btnPrimary} onClick={toggleDone}>
            {state.done ? 'Mark as not done' : 'Mark exercise done'}
          </button>
        </div>
      )}
    </section>
  )
}
