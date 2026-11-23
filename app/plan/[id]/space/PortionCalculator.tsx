'use client'

import { useEffect, useState } from 'react'
import { withArticle, type Activity } from '@/lib/feeding'
import {
  ACTIVITY_CHOICES,
  cleanNutritionProfile,
  formatAmount,
  portionResult,
  profileWeightLb,
  type FoodUnit,
  type NutritionPlan,
  type NutritionProfile,
  type WeightUnit,
} from '@/lib/nutrition-types'
import { trackEvent } from '@/lib/mixpanel-client'
import s from './space.module.css'

interface Props {
  sessionId: string
  plan: NutritionPlan
  /** The owner's answers, saved with the add-on */
  saved: unknown
  /** Tells the page the dog's weight in pounds, to mark its row in the portion table */
  onWeight: (lb: number | null) => void
  readOnly: boolean
}

const storageKey = (sessionId: string) => `pawcraft_portions_${sessionId}`
const text = (n: number | null) => (n === null ? '' : String(n))
const number = (value: string) => {
  const n = parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** What the server has, or failing that what this device remembers. */
function startingProfile(sessionId: string, saved: unknown): NutritionProfile {
  if (saved) return cleanNutritionProfile(saved)
  try {
    const local = localStorage.getItem(storageKey(sessionId))
    if (local) return cleanNutritionProfile(JSON.parse(local))
  } catch { /* private mode */ }
  return cleanNutritionProfile(null)
}

/**
 * The plan's portions for this dog, kept current. It opens on the answers the
 * plan was written from; the owner changes the weight, the activity or the food
 * as they change, and gets the day's calories, the amount per meal and the treat
 * allowance again. Saved with the add-on so it shows on every device and prints
 * in the PDF. (The plan's text is not rewritten: it says to come back here.)
 */
export function PortionCalculator({ sessionId, plan, saved, onWeight, readOnly }: Props) {
  const [start] = useState(() => startingProfile(sessionId, saved))
  // Typed values are kept as text so a half-typed number is never rewritten
  const [weight, setWeight] = useState(text(start.weight))
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(start.weightUnit)
  const [activity, setActivity] = useState<Activity>(start.activity)
  const [foodKcal, setFoodKcal] = useState(text(start.foodKcal))
  const [foodUnit, setFoodUnit] = useState<FoodUnit>(start.foodUnit)
  // Nothing is saved until the customer changes something
  const [touched, setTouched] = useState(false)

  // Everything else the owner told us (body shape, neutering…) stays as it was given
  const profile = cleanNutritionProfile({ ...start, weight: number(weight), weightUnit, activity, foodKcal: number(foodKcal), foodUnit })
  const result = portionResult(profile, plan)
  const lb = profileWeightLb(profile)
  const snapshot = JSON.stringify(profile)

  useEffect(() => {
    onWeight(lb)
  }, [lb, onWeight])

  // Keep what was entered: on this device at once, with the add-on a moment later
  useEffect(() => {
    if (!touched || readOnly) return
    try { localStorage.setItem(storageKey(sessionId), snapshot) } catch { /* private mode */ }

    const timer = setTimeout(() => {
      fetch('/api/addons/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, addon_id: 'nutrition_plan', settings: JSON.parse(snapshot) }),
      }).catch(() => { /* this device still has it */ })
    }, 900)
    return () => clearTimeout(timer)
  }, [touched, snapshot, sessionId, readOnly])

  const edit = <T,>(set: (value: T) => void) => (value: T) => {
    if (!touched) {
      trackEvent('portion_calculator_used', { session_id: sessionId })
      setTouched(true)
    }
    set(value)
  }

  const segments = <T extends string>(label: string, options: { id: T; label: string }[], value: T, onChange: (id: T) => void) => (
    <div className={s.segments2} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`${s.segment2} ${value === option.id ? s.segment2On : ''}`}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          disabled={readOnly}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  const meals = plan.mealsPerDay

  return (
    <section className={s.card}>
      <div className={s.cardHead}>
        <h2 className={s.h2}>{plan.dogName}&apos;s portions</h2>
        <p className={s.body2}>From your answers. Change the weight or the food here whenever they change, and the amounts follow.</p>
      </div>

      <div className={s.calcFields}>
        <div className={s.calcField}>
          <label className={s.subLabel} htmlFor="portion-weight">{plan.dogName}&apos;s weight</label>
          <div className={s.calcRow}>
            <input
              id="portion-weight"
              className={s.calcInput}
              inputMode="decimal"
              placeholder={weightUnit === 'lb' ? 'e.g. 42' : 'e.g. 19'}
              value={weight}
              onChange={(e) => edit(setWeight)(e.target.value)}
              readOnly={readOnly}
            />
            {segments('Weight unit', [{ id: 'lb', label: 'lb' }, { id: 'kg', label: 'kg' }], weightUnit, edit(setWeightUnit))}
          </div>
        </div>

        {/* A growing dog is fed for growth: activity does not change the amount */}
        {!plan.growing && (
          <div className={s.calcField}>
            <span className={s.subLabel}>How active is {plan.dogName}?</span>
            {segments(
              'Activity',
              ACTIVITY_CHOICES,
              activity,
              edit(setActivity),
            )}
            <p className={s.caption}>{ACTIVITY_CHOICES.find((c) => c.id === activity)?.hint}</p>
          </div>
        )}

        <div className={s.calcField}>
          <label className={s.subLabel} htmlFor="portion-kcal">Calories in your food</label>
          <div className={s.calcRow}>
            <input
              id="portion-kcal"
              className={s.calcInput}
              inputMode="decimal"
              placeholder={foodUnit === 'cup' ? 'e.g. 380' : 'e.g. 3650'}
              value={foodKcal}
              onChange={(e) => edit(setFoodKcal)(e.target.value)}
              readOnly={readOnly}
            />
            {segments('Calories are per', [{ id: 'cup', label: 'kcal / cup' }, { id: 'kg', label: 'kcal / kg' }], foodUnit, edit(setFoodUnit))}
          </div>
          <p className={s.caption}>On the bag or can, near the feeding guide. Leave it empty to see calories only.</p>
        </div>
      </div>

      {result ? (
        <div className={s.calcResult} aria-live="polite">
          <div className={s.calcTotal}>
            <span>Calories a day</span>
            <strong>{result.dailyKcal.toLocaleString('en-US')}</strong>
          </div>
          <ul className={s.calcLines}>
            <li><span>From meals</span><strong>{result.mealKcal.toLocaleString('en-US')} kcal</strong></li>
            <li><span>Treats and training rewards, at most</span><strong>{result.treatKcal.toLocaleString('en-US')} kcal</strong></li>
            {result.perDay !== null && result.perMeal !== null && (
              <>
                <li><span>Food a day</span><strong>{formatAmount(result.perDay, result.amountUnit)}</strong></li>
                <li><span>Per meal, {meals} meals a day</span><strong>{formatAmount(result.perMeal, result.amountUnit)}</strong></li>
              </>
            )}
          </ul>
          <p className={s.caption}>
            A starting point for {withArticle(plan.stageLabel)}. {plan.growing
              ? `${plan.dogName} is growing: weigh again every two weeks and update the weight here.`
              : `Check ${plan.dogName}'s body condition after two weeks and adjust, as chapter 2 explains.`}
          </p>
        </div>
      ) : (
        <p className={`${s.calcEmpty} ${s.body2}`}>Enter {plan.dogName}&apos;s weight to see the numbers.</p>
      )}
    </section>
  )
}
