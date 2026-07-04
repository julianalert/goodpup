'use client'

import { useState, useMemo } from 'react'
import s from '../page.module.css'

type Unit = 'kg' | 'lbs'
type BreedSize = 'small' | 'medium' | 'large' | 'giant'

// Maturity age in weeks and growth exponent per breed size
const BREED_CONFIG: Record<BreedSize, { maturityWeeks: number; label: string; exampleBreeds: string; adultRangeKg: string }> = {
  small:  { maturityWeeks: 40,  label: 'Small',  exampleBreeds: 'Chihuahua, Pomeranian, Shih Tzu, Dachshund', adultRangeKg: 'under 10 kg' },
  medium: { maturityWeeks: 52,  label: 'Medium', exampleBreeds: 'Cocker Spaniel, Border Collie, Beagle, Whippet', adultRangeKg: '10–25 kg' },
  large:  { maturityWeeks: 78,  label: 'Large',  exampleBreeds: 'Labrador, Golden Retriever, German Shepherd, Husky', adultRangeKg: '25–45 kg' },
  giant:  { maturityWeeks: 110, label: 'Giant',  exampleBreeds: 'Great Dane, Saint Bernard, Newfoundland, Mastiff', adultRangeKg: 'over 45 kg' },
}

const GROWTH_EXPONENT = 0.65

function toKg(weight: number, unit: Unit): number {
  return unit === 'kg' ? weight : weight * 0.453592
}

function fromKg(weight: number, unit: Unit): number {
  return unit === 'kg' ? weight : weight / 0.453592
}

function calcAdultWeight(
  currentWeightKg: number,
  currentAgeWeeks: number,
  breedSize: BreedSize,
): { estimateKg: number; lowKg: number; highKg: number; percentGrown: number; weeksToMaturity: number } {
  const { maturityWeeks } = BREED_CONFIG[breedSize]
  const fraction = Math.pow(currentAgeWeeks / maturityWeeks, GROWTH_EXPONENT)
  const clampedFraction = Math.min(fraction, 1)
  const estimateKg = currentWeightKg / clampedFraction
  const lowKg = estimateKg * 0.88
  const highKg = estimateKg * 1.12
  const percentGrown = Math.round(clampedFraction * 100)
  const weeksToMaturity = Math.max(0, maturityWeeks - currentAgeWeeks)
  return { estimateKg, lowKg, highKg, percentGrown, weeksToMaturity }
}

function fmt(kg: number, unit: Unit, decimals = 1): string {
  const val = fromKg(kg, unit)
  return `${val.toFixed(decimals)} ${unit}`
}

export default function DogSizeCalculator() {
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState<Unit>('kg')
  const [ageWeeks, setAgeWeeks] = useState('')
  const [breedSize, setBreedSize] = useState<BreedSize>('medium')
  const [submitted, setSubmitted] = useState(false)

  const result = useMemo(() => {
    if (!submitted) return null
    const w = parseFloat(weight)
    const a = parseFloat(ageWeeks)
    if (isNaN(w) || w <= 0 || isNaN(a) || a <= 0) return null
    const weightKg = toKg(w, unit)
    if (a >= BREED_CONFIG[breedSize].maturityWeeks) return null
    return calcAdultWeight(weightKg, a, breedSize)
  }, [submitted, weight, ageWeeks, unit, breedSize])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  const isAtMaturity = (() => {
    const a = parseFloat(ageWeeks)
    return !isNaN(a) && a >= BREED_CONFIG[breedSize].maturityWeeks
  })()

  const config = BREED_CONFIG[breedSize]

  return (
    <div className={s.calcCard}>
      <form onSubmit={handleSubmit} onChange={() => setSubmitted(false)} noValidate>
        <div className={s.calcGrid}>
          {/* Current weight */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="size-weight">Current weight</label>
            <div className={s.calcWeightRow}>
              <input
                id="size-weight"
                type="number"
                min="0.2"
                max="100"
                step="0.1"
                placeholder={unit === 'kg' ? 'e.g. 4.5' : 'e.g. 10'}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className={s.calcInput}
                required
              />
              <div className={s.calcUnitToggle}>
                <button type="button" className={`${s.calcUnitBtn} ${unit === 'kg' ? s.calcUnitBtnActive : ''}`} onClick={() => { setUnit('kg'); setSubmitted(false) }}>kg</button>
                <button type="button" className={`${s.calcUnitBtn} ${unit === 'lbs' ? s.calcUnitBtnActive : ''}`} onClick={() => { setUnit('lbs'); setSubmitted(false) }}>lbs</button>
              </div>
            </div>
          </div>

          {/* Age in weeks */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="size-age">Age (weeks)</label>
            <input
              id="size-age"
              type="number"
              min="4"
              max="104"
              step="1"
              placeholder="e.g. 12"
              value={ageWeeks}
              onChange={e => setAgeWeeks(e.target.value)}
              className={s.calcInput}
              required
            />
          </div>

          {/* Breed size */}
          <div className={s.calcField} style={{ gridColumn: '1 / -1' }}>
            <label className={s.calcLabel} htmlFor="size-breed">Breed size</label>
            <select id="size-breed" className={s.calcSelect} value={breedSize} onChange={e => setBreedSize(e.target.value as BreedSize)}>
              <option value="small">Small — under 10 kg adult (e.g. Chihuahua, Shih Tzu)</option>
              <option value="medium">Medium — 10–25 kg adult (e.g. Beagle, Border Collie)</option>
              <option value="large">Large — 25–45 kg adult (e.g. Labrador, German Shepherd)</option>
              <option value="giant">Giant — over 45 kg adult (e.g. Great Dane, Mastiff)</option>
            </select>
          </div>
        </div>

        <button type="submit" className={s.calcBtn}>
          Estimate adult size →
        </button>
      </form>

      {submitted && isAtMaturity && (
        <div className={s.calcResult} role="region" aria-live="polite">
          <div className={s.calcResultTitle}>Already fully grown</div>
          <p className={s.calcDisclaimer}>
            Your dog is at or past the expected maturity age for a {config.label.toLowerCase()} breed ({config.maturityWeeks} weeks). Their current weight is likely close to their adult weight.
          </p>
        </div>
      )}

      {submitted && !isAtMaturity && result && (
        <div className={s.calcResult} role="region" aria-live="polite">
          <div className={s.calcResultTitle}>Estimated adult weight</div>
          <div className={s.calcResultMain}>
            <span className={s.calcResultValue}>{fmt(result.estimateKg, unit)}</span>
          </div>
          <div className={s.calcResultRange}>
            Likely range: {fmt(result.lowKg, unit)} – {fmt(result.highKg, unit)}
          </div>
          <div className={s.calcResultMeta}>
            <span>{result.percentGrown}% of adult size now</span>
            <span className={s.calcResultDivider}>·</span>
            <span>~{Math.round(result.weeksToMaturity / 4)} months to full size</span>
            <span className={s.calcResultDivider}>·</span>
            <span>{config.label} breed</span>
          </div>
          <p className={s.calcDisclaimer}>
            Estimate based on breed size growth curves. Mixed breeds and individual variation can shift the actual result by ±15%. Genetics, nutrition, and health all influence final adult size.
          </p>
        </div>
      )}

      {submitted && !isAtMaturity && !result && (
        <p className={s.calcError}>Please enter a valid weight and age to see your estimate.</p>
      )}
    </div>
  )
}
