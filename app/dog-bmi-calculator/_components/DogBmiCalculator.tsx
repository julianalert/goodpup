'use client'

import { useState, useMemo } from 'react'
import s from '../page.module.css'

type WeightUnit = 'kg' | 'lbs'
type HeightUnit = 'cm' | 'in'

type BmiCategory = 'underweight' | 'ideal' | 'overweight' | 'obese'

const CATEGORIES: Record<BmiCategory, { label: string; bcsRange: string; color: string; advice: string }> = {
  underweight: {
    label: 'Underweight',
    bcsRange: 'BCS 1–3',
    color: '#C4850A',
    advice: "Your dog may be too lean. Ribs, spine and hip bones are likely very visible. Consult your vet to rule out illness and review the diet.",
  },
  ideal: {
    label: 'Healthy weight',
    bcsRange: 'BCS 4–5',
    color: '#1A6B4A',
    advice: "Your dog is at a healthy weight. Ribs should be easily felt but not visibly prominent. Maintain current feeding and exercise habits.",
  },
  overweight: {
    label: 'Overweight',
    bcsRange: 'BCS 6–7',
    color: '#C4850A',
    advice: "Your dog is carrying excess weight. Ribs are hard to feel beneath fat. Reduce portions by 10–15% and increase daily exercise gradually.",
  },
  obese: {
    label: 'Obese',
    bcsRange: 'BCS 8–9',
    color: '#B84034',
    advice: "Your dog is obese. This significantly increases the risk of joint disease, diabetes, and heart problems. Please consult your vet for a supervised weight-loss plan.",
  },
}

function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'ideal'
  if (bmi < 30) return 'overweight'
  return 'obese'
}

function toKg(w: number, unit: WeightUnit) { return unit === 'kg' ? w : w * 0.453592 }
function toCm(h: number, unit: HeightUnit) { return unit === 'cm' ? h : h * 2.54 }

export default function DogBmiCalculator() {
  const [weight, setWeight] = useState('')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg')
  const [height, setHeight] = useState('')
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm')
  const [submitted, setSubmitted] = useState(false)

  const result = useMemo(() => {
    if (!submitted) return null
    const w = parseFloat(weight)
    const h = parseFloat(height)
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) return null
    const kg = toKg(w, weightUnit)
    const m = toCm(h, heightUnit) / 100
    const bmi = kg / (m * m)
    const category = getBmiCategory(bmi)
    return { bmi, category }
  }, [submitted, weight, weightUnit, height, heightUnit])

  function handleChange() { setSubmitted(false) }

  return (
    <div className={s.calcCard}>
      <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }} onChange={handleChange} noValidate>
        <div className={s.calcGrid}>
          {/* Weight */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="bmi-weight">Dog&apos;s weight</label>
            <div className={s.calcWeightRow}>
              <input
                id="bmi-weight"
                type="number" min="0.5" max="120" step="0.1"
                placeholder={weightUnit === 'kg' ? 'e.g. 25' : 'e.g. 55'}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className={s.calcInput}
                required
              />
              <div className={s.calcUnitToggle}>
                <button type="button" className={`${s.calcUnitBtn} ${weightUnit === 'kg' ? s.calcUnitBtnActive : ''}`} onClick={() => { setWeightUnit('kg'); setSubmitted(false) }}>kg</button>
                <button type="button" className={`${s.calcUnitBtn} ${weightUnit === 'lbs' ? s.calcUnitBtnActive : ''}`} onClick={() => { setWeightUnit('lbs'); setSubmitted(false) }}>lbs</button>
              </div>
            </div>
          </div>

          {/* Height */}
          <div className={s.calcField}>
            <label className={s.calcLabel} htmlFor="bmi-height">Height at withers</label>
            <div className={s.calcWeightRow}>
              <input
                id="bmi-height"
                type="number" min="10" max="120" step="0.5"
                placeholder={heightUnit === 'cm' ? 'e.g. 56' : 'e.g. 22'}
                value={height}
                onChange={e => setHeight(e.target.value)}
                className={s.calcInput}
                required
              />
              <div className={s.calcUnitToggle}>
                <button type="button" className={`${s.calcUnitBtn} ${heightUnit === 'cm' ? s.calcUnitBtnActive : ''}`} onClick={() => { setHeightUnit('cm'); setSubmitted(false) }}>cm</button>
                <button type="button" className={`${s.calcUnitBtn} ${heightUnit === 'in' ? s.calcUnitBtnActive : ''}`} onClick={() => { setHeightUnit('in'); setSubmitted(false) }}>in</button>
              </div>
            </div>
            <span className={s.calcHint}>Measure from floor to top of shoulder blades</span>
          </div>
        </div>

        <button type="submit" className={s.calcBtn}>
          Calculate BMI →
        </button>
      </form>

      {submitted && result && (() => {
        const cat = CATEGORIES[result.category]
        return (
          <div className={s.calcResult} role="region" aria-live="polite">
            <div className={s.calcResultTitle}>Dog BMI result</div>
            <div className={s.calcResultMain}>
              <span className={s.calcResultValue} style={{ color: cat.color }}>{result.bmi.toFixed(1)}</span>
              <span className={s.calcResultSub} style={{ color: cat.color, fontWeight: 500 }}>{cat.label}</span>
            </div>

            {/* BMI scale bar */}
            <div className={s.bmiScale}>
              <div className={s.bmiScaleBar}>
                <div className={s.bmiScaleSeg} style={{ background: '#C4850A', flex: 1 }} title="Underweight" />
                <div className={s.bmiScaleSeg} style={{ background: '#1A6B4A', flex: 1.3 }} title="Ideal" />
                <div className={s.bmiScaleSeg} style={{ background: '#C4850A', flex: 1 }} title="Overweight" />
                <div className={s.bmiScaleSeg} style={{ background: '#B84034', flex: 1 }} title="Obese" />
              </div>
              <div className={s.bmiScaleLabels}>
                <span>Underweight</span>
                <span>Ideal</span>
                <span>Overweight</span>
                <span>Obese</span>
              </div>
            </div>

            <div className={s.calcResultMeta}>
              <span>{cat.bcsRange} equivalent</span>
              <span className={s.calcResultDivider}>·</span>
              <span>Ideal range: 18.5 – 25</span>
            </div>
            <p className={s.bmiAdvice}>{cat.advice}</p>
            <p className={s.calcDisclaimer}>
              Dog BMI uses the same formula as human BMI (weight ÷ height²) adapted for canine measurements. It is a screening tool, not a diagnosis. Body Condition Score assessed by a vet is the gold standard.
            </p>
          </div>
        )
      })()}

      {submitted && !result && (
        <p className={s.calcError}>Please enter a valid weight and height to see your result.</p>
      )}
    </div>
  )
}
