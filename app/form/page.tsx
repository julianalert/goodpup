'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import s from './page.module.css'
// Save step data via the server-side API route (never writes to Supabase directly from the browser)
async function saveStepToApi(data: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (err) {
    // Log but don't block the user — data loss is better than a broken form
    console.error('[form] saveStep failed:', err)
  }
}

const PROBLEM_LABELS: Record<string, string> = {
  leash_pulling: 'Pulls on leash',
  recall: "Won't come when called",
  jumping: 'Jumps on people',
  barking: 'Excessive barking',
  aggression: 'Reactivity / aggression',
  separation: 'Separation anxiety',
  destruction: 'Chewing / destruction',
  basic_obedience: 'Basic obedience',
  potty: 'Potty training',
  biting: 'Biting / mouthing',
  stealing: 'Stealing food',
  fearful: 'Fear / anxiety',
}

const LIVING_LABELS: Record<string, string> = {
  apartment: 'Apartment (no garden)',
  house_no_garden: 'House (no garden)',
  house_garden: 'House + garden',
  rural: 'Rural / countryside',
}

const AGE_LABELS: Record<string, string> = {
  puppy_under6: 'Puppy (under 6 months)',
  puppy_6to12: 'Young pup (6–12 months)',
  adolescent: 'Adolescent (1–2 years)',
  adult: 'Adult (2–7 years)',
  senior: 'Senior (7+ years)',
}

interface FormData {
  dogName: string
  dogBreed: string
  dogAge: string
  problems: string[]
  problemContext: string
  experience: string
  living: string
  dailyTime: number
  trainingHistory: string
  email: string
}

const GEN_STEPS = [
  'Analysing breed profile & temperament',
  'Identifying root causes of issues',
  'Building week-by-week program',
  'Writing daily exercises & schedules',
  'Compiling mistakes to avoid',
  'Sending to your inbox ✓',
]

const GEN_DELAYS = [0, 900, 1900, 2900, 4000, 5200]

export default function FormPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genStepIndex, setGenStepIndex] = useState(-1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Stable session ID — created once per page load, persisted across steps
  const sessionId = useRef<string>(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  )

  const [form, setForm] = useState<FormData>({
    dogName: '',
    dogBreed: '',
    dogAge: '',
    problems: [],
    problemContext: '',
    experience: '',
    living: '',
    dailyTime: 20,
    trainingHistory: '',
    email: '',
  })

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }, [])

  const toggleProblem = useCallback((value: string) => {
    setForm((prev) => {
      const has = prev.problems.includes(value)
      if (has) return { ...prev, problems: prev.problems.filter((p) => p !== value) }
      if (prev.problems.length >= 3) return prev
      return { ...prev, problems: [...prev.problems, value] }
    })
    setErrors((prev) => { const e = { ...prev }; delete e.problems; return e })
  }, [])

  const validate = (currentStep: number): boolean => {
    const e: Record<string, string> = {}
    if (currentStep === 1) {
      if (!form.dogName.trim()) e.dogName = 'Please enter your dog\'s name'
      if (!form.dogBreed.trim()) e.dogBreed = 'Please enter the breed'
      if (!form.dogAge) e.dogAge = 'Please select your dog\'s age'
    }
    if (currentStep === 2) {
      if (form.problems.length === 0) e.problems = 'Please select at least one problem'
    }
    if (currentStep === 3) {
      if (!form.experience) e.experience = 'Please select your experience level'
      if (!form.living) e.living = 'Please select your living situation'
    }
    if (currentStep === 5) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email address'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Map each step number to the fields that were filled on that step
  const getStepPayload = (currentStep: number) => {
    switch (currentStep) {
      case 1: return {
        dog_name: form.dogName,
        dog_breed: form.dogBreed,
        dog_age: form.dogAge,
      }
      case 2: return {
        problems: form.problems,
        problem_context: form.problemContext || null,
      }
      case 3: return {
        experience: form.experience,
        living: form.living,
      }
      case 4: return {
        daily_time: form.dailyTime,
        training_history: form.trainingHistory || null,
      }
      case 5: return {
        email: form.email,
        status: 'completed' as const,
      }
      default: return {}
    }
  }

  // Steps 1-4: fire-and-forget, never blocks navigation or shows spinner
  const saveStepBackground = (currentStep: number) => {
    saveStepToApi({
      session_id: sessionId.current,
      current_step: currentStep,
      ...getStepPayload(currentStep),
    })
  }

  const goNext = async () => {
    if (!validate(step)) return
    if (step === 5) {
      await submit()
      return
    }
    saveStepBackground(step)
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setStep((s) => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    setSaving(true)
    // Save final step with status = 'completed'
    await saveStepToApi({
      session_id: sessionId.current,
      current_step: 5,
      email: form.email,
      status: 'completed',
    })
    setSaving(false)

    // Store form data in sessionStorage for the order page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pawcraft_form', JSON.stringify(form))
      sessionStorage.setItem('pawcraft_session_id', sessionId.current)
    }

    // Navigate directly to /order — generation animation is preserved below but not used yet
    router.push('/order')
  }

  // NOTE: generation animation is intentionally kept but not triggered.
  // Re-enable by replacing the router.push above with:
  //   setGenerating(true)
  //   GEN_DELAYS.forEach((delay, i) => { setTimeout(() => setGenStepIndex(i), delay) })
  //   setTimeout(() => router.push('/order'), 7000)

  const progress = ((step - 1) / 5) * 100

  const optionCard = (name: string, value: string, icon: string, label: React.ReactNode, checked: boolean, onChange: () => void) => (
    <label key={value} className={s.optionCard} onClick={onChange}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <div className={`${s.optionLabel} ${checked ? s.optionLabelSelected : ''}`}>
        <span className={s.optionIcon}>{icon}</span>
        <span className={s.optionText}>{label}</span>
      </div>
    </label>
  )

  if (generating) {
    return (
      <>
        <div className={s.header}>
          <div className={s.logo}>
            <img src="/icon.png" alt="" className="appIcon" width={28} height={28} />
            Paw<span>Craft</span>
          </div>
          <span className={s.headerBadge}>30-Day Training Plan</span>
        </div>
        <div className={s.hero}>
          <div className={s.heroEyebrow}>Takes 2 minutes · Instant results</div>
          <h1>Tell us about your dog.<br />We&apos;ll build <em>their 30-day personalised training plan.</em></h1>
          <p className={s.heroSub}>Answer 5 quick questions so our AI can generate a program that actually fits your dog, not a generic guide.</p>
        </div>
        <div className={s.formWrap}>
          <div className={s.formCard}>
            <div className={s.progressBarTrack}>
              <div className={s.progressBarFill} style={{ width: '100%' }} />
            </div>
            <div className={s.successStep}>
              <div className={s.successIcon}>🐾</div>
              <div className={s.successTitle}>Generating your plan…</div>
              <p className={s.successSub}>Hang tight. Our AI is building a personalized 30-day program just for your dog.</p>
              <div className={s.generatingSteps}>
                {GEN_STEPS.map((label, i) => {
                  const isDone = i < genStepIndex
                  const isActive = i === genStepIndex
                  return (
                    <div key={i} className={`${s.genStep} ${isDone ? s.genStepDone : ''} ${isActive ? s.genStepActive : ''}`}>
                      <span className={`${s.genDot} ${isDone ? s.genDotDone : ''} ${isActive ? s.genDotActive : ''}`} />
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className={s.header}>
        <div className={s.logo}>
          <img src="/icon.png" alt="" className="appIcon" width={28} height={28} />
          Paw<span>Craft</span>
        </div>
        <span className={s.headerBadge}>30-Day Training Plan</span>
      </div>

      <div className={s.hero}>
        <div className={s.heroEyebrow}>Takes 2 minutes · Instant results</div>
        <h1>Tell us about your dog.<br />We&apos;ll build <em>their 30-day personalised training plan.</em></h1>
        <p className={s.heroSub}>Answer 5 quick questions so our AI can generate a program that actually fits your dog, not a generic guide.</p>
        <div className={s.trustRow}>
          {['Breed-specific', 'Age-adapted', 'Problem-focused', 'Ready in 60 sec'].map((t) => (
            <div key={t} className={s.trustItem}><span className={s.trustDot} />{t}</div>
          ))}
        </div>
      </div>

      <div className={s.formWrap}>
        <div className={s.formCard}>
          <div className={s.progressBarTrack}>
            <div className={s.progressBarFill} style={{ width: `${progress}%` }} />
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className={s.step}>
              <div className={s.stepIndicator}>Step 1 of 5</div>
              <div className={s.stepTitle}>About your dog</div>
              <div className={s.stepSub}>The basics help us calibrate the whole plan.</div>

              <div className={s.fieldRow}>
                <div className={s.field}>
                  <label className={s.fieldLabel}>Dog&apos;s name <span className={s.required}>*</span></label>
                  <input
                    className={`${s.input} ${errors.dogName ? s.inputError : ''}`}
                    type="text"
                    placeholder="e.g. Max"
                    value={form.dogName}
                    onChange={(e) => set('dogName', e.target.value)}
                    autoComplete="off"
                  />
                  {errors.dogName && <div className={s.fieldError}>{errors.dogName}</div>}
                </div>
                <div className={s.field}>
                  <label className={s.fieldLabel}>Breed <span className={s.required}>*</span></label>
                  <input
                    className={`${s.input} ${errors.dogBreed ? s.inputError : ''}`}
                    type="text"
                    placeholder="e.g. Border Collie"
                    value={form.dogBreed}
                    onChange={(e) => set('dogBreed', e.target.value)}
                    autoComplete="off"
                  />
                  {errors.dogBreed && <div className={s.fieldError}>{errors.dogBreed}</div>}
                </div>
              </div>

              <div className={s.field}>
                <label className={s.fieldLabel}>Age <span className={s.required}>*</span></label>
                <div className={`${s.optionGrid} ${s.optionGridCols3}`}>
                  {[
                    { value: 'puppy_under6', icon: '🐣', label: <>Puppy<small>Under 6 months</small></> },
                    { value: 'puppy_6to12', icon: '🐾', label: <>Young pup<small>6–12 months</small></> },
                    { value: 'adolescent', icon: '⚡', label: <>Adolescent<small>1–2 years</small></> },
                    { value: 'adult', icon: '🐕', label: <>Adult<small>2–7 years</small></> },
                    { value: 'senior', icon: '🧓', label: <>Senior<small>7+ years</small></> },
                  ].map((opt) => optionCard('dogAge', opt.value, opt.icon, opt.label, form.dogAge === opt.value, () => set('dogAge', opt.value)))}
                </div>
                {errors.dogAge && <div className={s.fieldError}>{errors.dogAge}</div>}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className={s.step}>
              <div className={s.stepIndicator}>Step 2 of 5</div>
              <div className={s.stepTitle}>What are the main issues?</div>
              <div className={s.stepSub}>Select up to 3 problems. The plan will prioritise these.</div>

              <div className={s.field}>
                <div className={s.problemGrid}>
                  {[
                    { value: 'leash_pulling', icon: '🦮', label: 'Pulls on leash' },
                    { value: 'recall', icon: '📣', label: "Won't come when called" },
                    { value: 'jumping', icon: '🦘', label: 'Jumps on people' },
                    { value: 'barking', icon: '🔊', label: 'Excessive barking' },
                    { value: 'aggression', icon: '😤', label: 'Reactivity / aggression' },
                    { value: 'separation', icon: '😰', label: 'Separation anxiety' },
                    { value: 'destruction', icon: '🏠', label: 'Chewing / destruction' },
                    { value: 'basic_obedience', icon: '🎓', label: 'Basic obedience (sit, stay…)' },
                    { value: 'potty', icon: '🚽', label: 'Potty training' },
                    { value: 'biting', icon: '😬', label: 'Biting / mouthing' },
                    { value: 'stealing', icon: '🍖', label: 'Stealing food / items' },
                    { value: 'fearful', icon: '😨', label: 'Fear / anxiety' },
                  ].map((p) => (
                    <label
                      key={p.value}
                      className={s.problemTag}
                      onClick={() => toggleProblem(p.value)}
                    >
                      <span className={`${s.problemTagLabel} ${form.problems.includes(p.value) ? s.problemTagLabelSelected : ''}`}>
                        <span className={s.tagIcon}>{p.icon}</span> {p.label}
                      </span>
                    </label>
                  ))}
                </div>
                <div className={`${s.selectionHint} ${form.problems.length >= 3 ? s.selectionHintWarn : ''}`}>
                  {form.problems.length >= 3 ? '⚠ Maximum 3 problems selected' : `${form.problems.length} of 3 selected`}
                </div>
                {errors.problems && <div className={s.fieldError}>{errors.problems}</div>}
              </div>

              <div className={s.field}>
                <label className={s.fieldLabel}>Any context that would help? <span style={{ fontWeight: 300, color: 'var(--ink-light)' }}>(optional)</span></label>
                <textarea
                  className={s.textarea}
                  placeholder="e.g. Max pulls badly when he sees other dogs, but is fine at home. Started 6 months ago after we moved to a busy city..."
                  value={form.problemContext}
                  onChange={(e) => set('problemContext', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className={s.step}>
              <div className={s.stepIndicator}>Step 3 of 5</div>
              <div className={s.stepTitle}>Your situation</div>
              <div className={s.stepSub}>Helps us adapt the training intensity and methods.</div>

              <div className={s.field}>
                <label className={s.fieldLabel}>Your experience level <span className={s.required}>*</span></label>
                <div className={`${s.optionGrid} ${s.optionGridCols3}`}>
                  {[
                    { value: 'first_dog', icon: '🌱', label: 'First dog ever' },
                    { value: 'some_experience', icon: '🐕', label: 'Had dogs before' },
                    { value: 'experienced', icon: '🏆', label: 'Experienced owner' },
                  ].map((opt) => optionCard('experience', opt.value, opt.icon, opt.label, form.experience === opt.value, () => set('experience', opt.value)))}
                </div>
                {errors.experience && <div className={s.fieldError}>{errors.experience}</div>}
              </div>

              <div className={s.field}>
                <label className={s.fieldLabel}>Where do you live? <span className={s.required}>*</span></label>
                <div className={`${s.optionGrid} ${s.optionGridCols2}`}>
                  {[
                    { value: 'apartment', icon: '🏢', label: <>Apartment<small>No garden</small></> },
                    { value: 'house_no_garden', icon: '🏠', label: <>House<small>No garden</small></> },
                    { value: 'house_garden', icon: '🌿', label: <>House + garden<small>Enclosed outdoor space</small></> },
                    { value: 'rural', icon: '🌾', label: <>Rural / countryside<small>Lots of space</small></> },
                  ].map((opt) => optionCard('living', opt.value, opt.icon, opt.label, form.living === opt.value, () => set('living', opt.value)))}
                </div>
                {errors.living && <div className={s.fieldError}>{errors.living}</div>}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className={s.step}>
              <div className={s.stepIndicator}>Step 4 of 5</div>
              <div className={s.stepTitle}>Time &amp; commitment</div>
              <div className={s.stepSub}>Be honest: we&apos;ll build a plan you can actually stick to.</div>

              <div className={s.field}>
                <label className={s.fieldLabel}>How much time can you dedicate per day? <span className={s.required}>*</span></label>
                <div className={s.rangeValueDisplay}>{form.dailyTime} minutes/day</div>
                <div className={s.rangeWrap}>
                  <input
                    type="range"
                    className={s.rangeInput}
                    min={10} max={60} step={5}
                    value={form.dailyTime}
                    onChange={(e) => set('dailyTime', Number(e.target.value))}
                  />
                  <div className={s.rangeLabels}>
                    <span className={s.rangeLabel}>10 min</span>
                    <span className={s.rangeLabel}>60 min</span>
                  </div>
                </div>
                <div className={s.callout}>
                  <strong>💡 Good to know:</strong> Most dogs make excellent progress with just 15–20 min/day of focused training. Consistency beats duration every time.
                </div>
              </div>

              <div className={s.field}>
                <label className={s.fieldLabel}>Has your dog had any training before?</label>
                <div className={`${s.optionGrid} ${s.optionGridCols2}`}>
                  {[
                    { value: 'none', icon: '🆕', label: 'No training yet' },
                    { value: 'some_home', icon: '🏡', label: 'Some basics at home' },
                    { value: 'classes', icon: '🎒', label: 'Attended classes' },
                    { value: 'trainer', icon: '👨‍🏫', label: 'Worked with a trainer' },
                  ].map((opt) => optionCard('trainingHistory', opt.value, opt.icon, opt.label, form.trainingHistory === opt.value, () => set('trainingHistory', opt.value)))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className={s.step}>
              <div className={s.stepIndicator}>Step 5 of 5</div>
              <div className={s.stepTitle}>Where to send your plan?</div>
              <div className={s.stepSub}>Your personalized plan will be ready in under 60 seconds.</div>

              <div className={s.field}>
                <label className={s.fieldLabel}>Email address <span className={s.required}>*</span></label>
                <input
                  type="email"
                  className={`${s.input} ${errors.email ? s.inputError : ''}`}
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
                {errors.email && <div className={s.fieldError}>{errors.email}</div>}
              </div>

              <div style={{ marginTop: 24 }}>
                <div className={s.summarySectionTitle}>📋 Your plan summary</div>
                <div className={s.summaryRow}>
                  <span className={s.summaryKey}>Dog</span>
                  <span className={s.summaryVal}>{form.dogName || '-'}</span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.summaryKey}>Breed &amp; age</span>
                  <span className={s.summaryVal}>{form.dogBreed}{form.dogAge ? ` · ${AGE_LABELS[form.dogAge]}` : ''}</span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.summaryKey}>Focus areas</span>
                  <span className={s.summaryVal}>
                    <div className={s.summaryTags}>
                      {form.problems.length > 0
                        ? form.problems.map((p) => <span key={p} className={s.summaryTag}>{PROBLEM_LABELS[p]}</span>)
                        : '-'}
                    </div>
                  </span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.summaryKey}>Daily time</span>
                  <span className={s.summaryVal}>{form.dailyTime} min/day</span>
                </div>
                <div className={s.summaryRow}>
                  <span className={s.summaryKey}>Living situation</span>
                  <span className={s.summaryVal}>{form.living ? LIVING_LABELS[form.living] : '-'}</span>
                </div>
              </div>

              <div className={`${s.callout} ${s.calloutGreen}`} style={{ marginTop: 20 }}>
                <strong>🔒 Your data is private.</strong> We only use it to generate your plan and send it to your inbox. No spam, ever.
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className={s.stepFooter}>
            <div className={s.stepDots}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`${s.stepDot} ${n < step ? s.stepDotDone : ''} ${n === step ? s.stepDotActive : ''}`}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {step > 1 && (
                <button className={s.btnBack} onClick={goBack} disabled={saving}>← Back</button>
              )}
              <button className={s.btnNext} onClick={goNext} disabled={saving}>
                {saving ? 'Saving…' : step === 5 ? 'Generate my plan' : 'Continue'}
                {!saving && <span>→</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
