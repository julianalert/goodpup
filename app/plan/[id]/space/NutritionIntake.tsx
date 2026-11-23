'use client'

import { useEffect, useRef, useState } from 'react'
import { PiCheckCircleFill } from 'react-icons/pi'
import type { AddonDog } from '@/lib/addons'
import {
  ACTIVITY_CHOICES,
  CONCERN_CHOICES,
  CONDITION_CHOICES,
  FOOD_CHOICES,
  MEALS_CHOICES,
  NEUTERED_CHOICES,
  NOTES_MAX,
  SEX_CHOICES,
  TREAT_CHOICES,
  cleanNutritionProfile,
  missingAnswers,
  type Choice,
  type Concern,
  type NutritionProfile,
  type RequiredAnswer,
} from '@/lib/nutrition-types'
import { trackEvent } from '@/lib/mixpanel-client'
import s from './space.module.css'

interface Props {
  sessionId: string
  dog: AddonDog
  title: string
  /** Sends the answers. Resolves to false when they could not be sent. */
  onSubmit: (answers: NutritionProfile) => Promise<boolean>
  /** The admin's look at a customer's space: nothing can be sent */
  readOnly: boolean
}

/** What is typed is kept as text until it is sent, so a half-typed number is never rewritten */
type Draft = Omit<NutritionProfile, 'weight' | 'foodKcal'> & { weight: string; foodKcal: string }

const draftKey = (sessionId: string) => `pawcraft_intake_${sessionId}_nutrition_plan`
const number = (value: string) => {
  const n = parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
const toProfile = (draft: Draft): NutritionProfile =>
  cleanNutritionProfile({ ...draft, weight: number(draft.weight), foodKcal: number(draft.foodKcal) })

/** Answers begun earlier on this device, so a reload or a phone call loses nothing. */
function startingDraft(sessionId: string): Draft {
  let saved: Record<string, unknown> = {}
  try {
    saved = JSON.parse(localStorage.getItem(draftKey(sessionId)) ?? '{}') ?? {}
  } catch { /* private mode, or nothing saved */ }
  const clean = cleanNutritionProfile(saved)
  return {
    ...clean,
    weight: typeof saved.weight === 'string' ? saved.weight : '',
    foodKcal: typeof saved.foodKcal === 'string' ? saved.foodKcal : '',
    // "Active" is only a default once the owner has chosen it
    activity: clean.activity,
  }
}

/**
 * The questions the nutrition plan is written from, asked once the add-on is
 * paid for. Twelve short answers; submitting them starts the writing. Nothing is
 * generated before, so the plan's numbers are this dog's own from the first line.
 */
export function NutritionIntake({ sessionId, dog, title, onSubmit, readOnly }: Props) {
  const [draft, setDraft] = useState<Draft>(() => startingDraft(sessionId))
  const [missing, setMissing] = useState<RequiredAnswer[]>([])
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [started, setStarted] = useState(false)
  // Counts the tries to send with answers missing: each one scrolls to the first gap
  const [attempts, setAttempts] = useState(0)
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    try { localStorage.setItem(draftKey(sessionId), JSON.stringify(draft)) } catch { /* private mode */ }
  }, [draft, sessionId])

  // After a try with answers missing, bring the first unanswered question into view
  useEffect(() => {
    if (attempts === 0) return
    form.current?.querySelector('[data-missing="true"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [attempts])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    if (!started) {
      setStarted(true)
      trackEvent('addon_intake_started', { session_id: sessionId, addon: 'nutrition_plan' })
    }
    setDraft((d) => ({ ...d, [key]: value }))
    setMissing((m) => m.filter((field) => field !== key))
    setFailed(false)
  }

  // From the latest draft, not the one this render saw: two quick taps must both count
  const toggleConcern = (id: Concern) =>
    setDraft((d) => ({ ...d, concerns: d.concerns.includes(id) ? d.concerns.filter((c) => c !== id) : [...d.concerns, id] }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (sending || readOnly) return

    const profile = toProfile(draft)
    const unanswered = missingAnswers(profile)
    if (unanswered.length > 0) {
      setMissing(unanswered)
      setAttempts((n) => n + 1)
      return
    }

    setSending(true)
    setFailed(false)
    trackEvent('addon_intake_submitted', { session_id: sessionId, addon: 'nutrition_plan' })
    const ok = await onSubmit(profile)
    if (ok) {
      try { localStorage.removeItem(draftKey(sessionId)) } catch { /* private mode */ }
    } else {
      setSending(false)
      setFailed(true)
    }
  }

  const name = dog.name
  const isMissing = (field: RequiredAnswer) => missing.includes(field)

  /** A question: its label, an optional note, its answer, and "please answer" when skipped */
  const question = (label: string, field: RequiredAnswer | null, body: React.ReactNode, note?: string) => (
    <div className={s.question} data-missing={field !== null && isMissing(field)}>
      <span className={s.questionLabel}>{label}</span>
      {note && <p className={s.caption}>{note}</p>}
      {body}
      {field !== null && isMissing(field) && <p className={s.fieldError}>Please answer this one.</p>}
    </div>
  )

  /** Short answers side by side */
  const segments = <T extends string>(label: string, choices: Choice<T>[], value: T | null, onChange: (id: T) => void) => (
    <div className={s.segments2} role="group" aria-label={label} style={{ gridTemplateColumns: `repeat(${choices.length}, 1fr)` }}>
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          className={`${s.segment2} ${value === choice.id ? s.segment2On : ''}`}
          aria-pressed={value === choice.id}
          onClick={() => onChange(choice.id)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  )

  /** Longer answers, one per line, with what each one means */
  const options = <T extends string>(label: string, choices: Choice<T>[], selected: (id: T) => boolean, onChange: (id: T) => void) => (
    <div className={s.options} role="group" aria-label={label}>
      {choices.map((choice) => {
        const on = selected(choice.id)
        return (
          <button key={choice.id} type="button" className={`${s.option} ${on ? s.optionOn : ''}`} aria-pressed={on} onClick={() => onChange(choice.id)}>
            <span className={s.optionMark}>{on && <PiCheckCircleFill aria-hidden />}</span>
            <span className={s.optionText}>
              <strong>{choice.label}</strong>
              {choice.hint && <span>{choice.hint}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <section className={s.card}>
      <div className={s.cardHead}>
        <div className={s.kicker}>Add-on · paid, thank you</div>
        <h2 className={s.h2}>{title}</h2>
        <p className={s.body2}>
          A dozen quick questions about {name}, about two minutes. The plan is written from your answers as soon as you send them, so every number in it is {name === 'your dog' ? 'your dog’s' : `${name}’s`} own.
        </p>
      </div>

      <form ref={form} className={s.questions} onSubmit={submit} noValidate>
        {question(`What does ${name} weigh?`, 'weight', (
          <div className={s.calcRow}>
            <input
              className={s.calcInput}
              inputMode="decimal"
              aria-label="Weight"
              placeholder={draft.weightUnit === 'lb' ? 'e.g. 42' : 'e.g. 19'}
              value={draft.weight}
              onChange={(e) => set('weight', e.target.value)}
            />
            {segments('Weight unit', [{ id: 'lb', label: 'lb' }, { id: 'kg', label: 'kg' }], draft.weightUnit, (id) => set('weightUnit', id))}
          </div>
        ), 'A recent weight is fine. No scale? Weigh yourself holding the dog, then alone, and subtract.')}

        {question('Male or female?', 'sex', segments('Sex', SEX_CHOICES, draft.sex, (id) => set('sex', id)))}

        {question('Neutered or spayed?', 'neutered', segments('Neutered or spayed', NEUTERED_CHOICES, draft.neutered, (id) => set('neutered', id)))}

        {question(`What shape is ${name} in?`, 'condition',
          options('Body shape', CONDITION_CHOICES, (id) => draft.condition === id, (id) => set('condition', id)),
          'Run flat fingers along the ribs, then look from above.')}

        {question(`How active is ${name}?`, null,
          options('Activity', ACTIVITY_CHOICES, (id) => draft.activity === id, (id) => set('activity', id)))}

        {question(`What does ${name} eat today?`, 'foodType',
          options('Food', FOOD_CHOICES, (id) => draft.foodType === id, (id) => set('foodType', id)))}

        {question('Calories in that food, if you know them', null, (
          <div className={s.calcRow}>
            <input
              className={s.calcInput}
              inputMode="decimal"
              aria-label="Calories in the food"
              placeholder={draft.foodUnit === 'cup' ? 'e.g. 380' : 'e.g. 3650'}
              value={draft.foodKcal}
              onChange={(e) => set('foodKcal', e.target.value)}
            />
            {segments('Calories are per', [{ id: 'cup', label: 'kcal / cup' }, { id: 'kg', label: 'kcal / kg' }], draft.foodUnit, (id) => set('foodUnit', id))}
          </div>
        ), 'Printed on the bag or can, near the feeding guide. With it, the plan gives the exact amount per meal. You can skip it and add it later.')}

        {question('How many meals a day?', 'mealsNow', segments('Meals a day', MEALS_CHOICES, draft.mealsNow, (id) => set('mealsNow', id)))}

        {question('Treats, chews and table scraps?', 'treats', segments('Treats', TREAT_CHOICES, draft.treats, (id) => set('treats', id)))}

        {question('Anything going on? Tick all that apply', null,
          options('Concerns', CONCERN_CHOICES, (id) => draft.concerns.includes(id), toggleConcern))}

        {question(`Has a vet diagnosed a condition, or put ${name} on a prescription diet?`, 'medical',
          segments('Medical condition', [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }], draft.medical === null ? null : draft.medical ? 'yes' : 'no', (id) => set('medical', id === 'yes')),
          'If yes, the plan is written to fit around your vet’s instructions.')}

        {question('Anything else we should know? (optional)', null, (
          <textarea
            className={s.textarea}
            rows={3}
            maxLength={NOTES_MAX}
            aria-label="Anything else"
            placeholder={`e.g. ${name} gets leftovers at dinner, or only eats when someone is in the room`}
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        ))}

        {!readOnly && (
          <>
            <button type="submit" className={s.btnPrimary} disabled={sending}>
              {sending ? 'Sending your answers…' : `Write ${name === 'your dog' ? 'the' : `${name}’s`} plan`}
            </button>
            {missing.length > 0 && (
              <p className={`${s.fieldError} ${s.center}`}>
                {missing.length === 1 ? 'One question still needs an answer.' : `${missing.length} questions still need an answer.`}
              </p>
            )}
            {failed && <p className={`${s.fieldError} ${s.center}`}>Your answers could not be sent. Please try again.</p>}
            <p className={`${s.caption} ${s.center}`}>Ready a few minutes after you send them. We email you too.</p>
          </>
        )}
      </form>
    </section>
  )
}
