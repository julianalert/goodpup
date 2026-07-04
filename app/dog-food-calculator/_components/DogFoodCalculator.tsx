'use client'

import { useState, useMemo } from 'react'
import s from '../page.module.css'

type Unit = 'kg' | 'lbs'
type LifeStage = 'puppy' | 'adult' | 'senior'
type Activity = 'low' | 'moderate' | 'high'
type FoodType = 'dry' | 'wet' | 'raw'

const LIFE_STAGE_FACTOR: Record<LifeStage, number> = {
  puppy: 2.5,
  adult: 1.6,
  senior: 1.2,
}
const ACTIVITY_FACTOR: Record<Activity, number> = {
  low: 1.0,
  moderate: 1.2,
  high: 1.4,
}
// kcal per 100 g of food
const FOOD_KCAL: Record<FoodType, number> = {
  dry: 350,
  wet: 85,
  raw: 180,
}

function toKg(weight: number, unit: Unit): number {
  return unit === 'kg' ? weight : weight * 0.453592
}

function calcResult(weight: number, unit: Unit, stage: LifeStage, activity: Activity, food: FoodType) {
  const kg = toKg(weight, unit)
  if (kg <= 0) return null
  const rer = 70 * Math.pow(kg, 0.75)
  const dailyKcal = rer * LIFE_STAGE_FACTOR[stage] * ACTIVITY_FACTOR[activity]
  const gramsPerDay = (dailyKcal / FOOD_KCAL[food]) * 100
  const cupsPerDay = gramsPerDay / 100        // rough: 1 cup ≈ 100 g dry kibble
  const ozPerDay = gramsPerDay / 28.35
  const perMeal = gramsPerDay / 2
  return { dailyKcal: Math.round(dailyKcal), gramsPerDay: Math.round(gramsPerDay), cupsPerDay, ozPerDay, perMeal: Math.round(perMeal) }
}

export default function DogFoodCalculator() {
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<Unit>('kg')
  const [stage, setStage] = useState<LifeStage>('adult')
  const [activity, setActivity] = useState<Activity>('moderate')
  const [food, setFood] = useState<FoodType>('dry')
  const [submitted, setSubmitted] = useState(false)

  const result = useMemo(() => {
    if (!submitted) return null
    const w = parseFloat(weight)
    if (isNaN(w) || w <= 0) return null
    return calcResult(w, unit, stage, activity, food)
  }, [submitted, weight, unit, stage, activity, food])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  function handleChange() {
    setSubmitted(false)
  }

  const foodLabel = food === 'dry' ? 'dry kibble' : food === 'wet' ? 'wet food' : 'raw food'

  return (
    <div className={s.calcCard}>
      <form onSubmit={handleSubmit} onChange={handleChange} noValidate>
        <div className={s.calcGrid}>
          {/* Weight */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="calc-weight">Dog&apos;s weight</label>
            <div className={s.calcWeightRow}>
              <input
                id="calc-weight"
                type="number"
                min="0.5"
                max="120"
                step="0.1"
                placeholder={unit === 'kg' ? 'e.g. 12' : 'e.g. 26'}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className={s.calcInput}
                required
              />
              <div className={s.calcUnitToggle}>
                <button
                  type="button"
                  className={`${s.calcUnitBtn} ${unit === 'kg' ? s.calcUnitBtnActive : ''}`}
                  onClick={() => { setUnit('kg'); setSubmitted(false) }}
                >
                  kg
                </button>
                <button
                  type="button"
                  className={`${s.calcUnitBtn} ${unit === 'lbs' ? s.calcUnitBtnActive : ''}`}
                  onClick={() => { setUnit('lbs'); setSubmitted(false) }}
                >
                  lbs
                </button>
              </div>
            </div>
          </div>

          {/* Life stage */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="calc-stage">Life stage</label>
            <select id="calc-stage" className={s.calcSelect} value={stage} onChange={e => setStage(e.target.value as LifeStage)}>
              <option value="puppy">Puppy (under 1 year)</option>
              <option value="adult">Adult (1–7 years)</option>
              <option value="senior">Senior (7+ years)</option>
            </select>
          </div>

          {/* Activity */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="calc-activity">Activity level</label>
            <select id="calc-activity" className={s.calcSelect} value={activity} onChange={e => setActivity(e.target.value as Activity)}>
              <option value="low">Low — mostly resting</option>
              <option value="moderate">Moderate — daily walks</option>
              <option value="high">High — very active / working dog</option>
            </select>
          </div>

          {/* Food type */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="calc-food">Food type</label>
            <select id="calc-food" className={s.calcSelect} value={food} onChange={e => setFood(e.target.value as FoodType)}>
              <option value="dry">Dry kibble</option>
              <option value="wet">Wet food (canned)</option>
              <option value="raw">Raw diet</option>
            </select>
          </div>
        </div>

        <button type="submit" className={s.calcBtn}>
          Calculate daily portion →
        </button>
      </form>

      {submitted && result && (
        <div className={s.calcResult} role="region" aria-live="polite" aria-label="Calculator result">
          <div className={s.calcResultTitle}>
            Daily recommended amount
          </div>
          <div className={s.calcResultMain}>
            <span className={s.calcResultValue}>{result.gramsPerDay} g</span>
            <span className={s.calcResultSub}>per day of {foodLabel}</span>
          </div>
          <div className={s.calcResultMeta}>
            {food === 'dry' && (
              <span>≈ {result.cupsPerDay.toFixed(1)} cups/day</span>
            )}
            {food === 'wet' && (
              <span>≈ {result.ozPerDay.toFixed(1)} oz/day</span>
            )}
            {food === 'raw' && (
              <span>≈ {result.ozPerDay.toFixed(1)} oz/day</span>
            )}
            <span className={s.calcResultDivider}>·</span>
            <span>{result.perMeal} g per meal (2×/day)</span>
            <span className={s.calcResultDivider}>·</span>
            <span>{result.dailyKcal} kcal/day</span>
          </div>
          <p className={s.calcDisclaimer}>
            This estimate uses the RER formula (70 × kg<sup>0.75</sup>) adjusted for life stage and activity. Always check your specific food&apos;s calorie content and consult your vet for precise guidance.
          </p>
        </div>
      )}

      {submitted && !result && (
        <p className={s.calcError}>Please enter a valid weight to see your results.</p>
      )}
    </div>
  )
}
