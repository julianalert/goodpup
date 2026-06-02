import type { SubmissionRow } from './supabase'

const AGE_LABELS: Record<string, string> = {
  puppy_under6: 'puppy under 6 months',
  puppy_6to12: 'young puppy (6–12 months)',
  adolescent: 'adolescent (1–2 years)',
  adult: 'adult (2–7 years)',
  senior: 'senior (7+ years)',
}

const PROBLEM_LABELS: Record<string, string> = {
  leash_pulling: 'pulling on leash',
  recall: "poor recall (won't come when called)",
  jumping: 'jumping on people',
  barking: 'excessive barking',
  aggression: 'reactivity / aggression toward other dogs or people',
  separation: 'separation anxiety',
  destruction: 'chewing and destruction',
  basic_obedience: 'lack of basic obedience (sit, stay, down)',
  potty: 'potty training issues',
  biting: 'biting and mouthing',
  stealing: 'stealing food or items',
  fearful: 'fear and anxiety',
}

const LIVING_LABELS: Record<string, string> = {
  apartment: 'apartment with no garden',
  house_no_garden: 'house with no garden',
  house_garden: 'house with an enclosed garden',
  rural: 'rural setting with lots of outdoor space',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  first_dog: 'this is their first dog ever',
  some_experience: 'they have had dogs before but are not a professional',
  experienced: 'they are an experienced dog owner',
}

const HISTORY_LABELS: Record<string, string> = {
  none: 'no prior training whatsoever',
  some_home: 'some basic training attempted at home',
  classes: 'attended group training classes',
  trainer: 'previously worked with a private trainer',
}

export function buildPrompt(row: SubmissionRow): string {
  const problems = (row.problems ?? []).map(p => PROBLEM_LABELS[p] ?? p).join(', ')
  const age = AGE_LABELS[row.dog_age ?? ''] ?? row.dog_age ?? 'unknown age'
  const living = LIVING_LABELS[row.living ?? ''] ?? row.living ?? 'unknown living situation'
  const experience = EXPERIENCE_LABELS[row.experience ?? ''] ?? row.experience ?? 'unknown experience'
  const history = HISTORY_LABELS[row.training_history ?? ''] ?? 'no prior training'
  const dogName = row.dog_name ?? 'the dog'
  const dogBreed = row.dog_breed ?? 'mixed breed'
  const dailyTime = row.daily_time ?? 20

  return `
You are an expert dog trainer and behaviourist with 20+ years of experience.
Your task is to generate a complete, personalised 30-day dog training plan as a
well-structured HTML document.

## Dog profile
- Name: ${dogName}
- Breed: ${dogBreed}
- Age: ${age}
- Main problems to address: ${problems}
- Additional context from owner: ${row.problem_context || 'None provided'}
- Daily training time available: ${dailyTime} minutes
- Living situation: ${living}
- Owner experience level: ${experience}
- Prior training history: ${history}

## Your output

Generate a complete HTML document for a personalised 30-day training plan.
Use the following EXACT structure and HTML skeleton.
Fill every section with content that is genuinely specific to ${dogName}'s
breed (${dogBreed}), age (${age}), and problems (${problems}).

CRITICAL RULES:
- Never use generic advice that could apply to any dog
- Every insight must reference the specific breed characteristics of a ${dogBreed}
- Adapt all exercise durations to fit within ${dailyTime} minutes per day
- Adapt all outdoor/indoor exercise recommendations to a ${living}
- If the owner is ${experience}, adjust the complexity and jargon level accordingly
- Week 1 must always focus on foundation and attention — never jump to outdoor work
- Always identify and explain the ROOT CAUSE of each problem, not just the symptoms
- The mistakes section must contain ${dogBreed}-specific mistakes, not generic ones
- Tone: warm, expert, encouraging — like a brilliant friend who happens to be a dog trainer

## HTML structure to follow

Output ONLY the content inside <body> tags (no DOCTYPE, no <html>, no <head>).
Use this exact section structure:

<!-- SECTION 1: DIAGNOSTIC -->
<section class="section" id="diagnostic">
  <div class="section-label">Section 01</div>
  <h2>${dogName}'s Profile &amp; Temperament Diagnostic</h2>

  <div class="diag-grid">
    <div class="diag-card">
      <div class="diag-card-label">Breed drive level</div>
      <div class="diag-card-value"><!-- e.g. Very High --></div>
      <div class="diag-card-sub"><!-- one sentence why --></div>
      <div class="score-bar-wrap"><div class="score-bar"><div class="score-bar-fill" style="width: 85%"></div></div></div>
    </div>
    <!-- repeat for Trainability, Mental stimulation need, Reactivity baseline -->
  </div>

  <div class="trait-list">
    <span class="trait positive"><!-- positive trait specific to ${dogBreed} --></span>
    <span class="trait watch"><!-- watch trait specific to ${dogBreed} --></span>
  </div>

  <div class="callout callout-green">
    <span class="callout-icon">💡</span>
    <div class="callout-text">
      <strong>Root cause:</strong> <!-- explain WHY ${dogName} has these specific problems -->
    </div>
  </div>
</section>

<!-- SECTION 2: 30-DAY PROGRAM -->
<section class="section" id="program">
  <div class="section-label">Section 02</div>
  <h2>Your 30-Day Program</h2>
  <p><!-- brief intro --></p>

  <div class="week-block">
    <div class="week-header">
      <span class="week-badge">Week 1 · Days 1–7</span>
      <div>
        <div class="week-title"><!-- week theme --></div>
        <div class="week-desc"><!-- one-line description --></div>
      </div>
    </div>
    <div class="callout callout-amber">
      <span class="callout-icon">⚠️</span>
      <div class="callout-text"><strong>Week 1 rule:</strong> <!-- key constraint --></div>
    </div>
    <table class="day-table">
      <thead><tr><th>Day</th><th>Exercise</th><th>Goal</th><th>Duration</th></tr></thead>
      <tbody>
        <tr>
          <td><span class="day-name">Mon</span></td>
          <td><!-- exercise description --></td>
          <td><!-- measurable goal --></td>
          <td><span class="duration-badge"><!-- e.g. 3 × 5 min --></span></td>
        </tr>
        <!-- 7 rows total, Mon–Sun -->
      </tbody>
    </table>
  </div>
  <!-- Repeat .week-block for weeks 2, 3, 4 -->
</section>

<!-- SECTION 3: MISTAKES TO AVOID -->
<section class="section" id="mistakes">
  <div class="section-label">Section 03</div>
  <h2>Common Mistakes to Avoid</h2>
  <ul class="mistakes-list">
    <li class="mistake-item">
      <div class="mistake-x">✕</div>
      <div class="mistake-content">
        <h4><!-- mistake title specific to ${dogBreed} --></h4>
        <p><!-- why it's a mistake for this breed/age --></p>
      </div>
    </li>
    <!-- 5 items total -->
  </ul>
</section>

<!-- SECTION 4: WEEKLY CHECKLIST -->
<section class="section" id="checklist">
  <div class="section-label">Section 04</div>
  <h2>Weekly Progress Checklist</h2>
  <div class="checklist">
    <div class="check-week">
      <div class="check-week-title">✓ Week 1 milestones</div>
      <div class="check-item"><div class="checkbox"></div><div class="check-text"><!-- concrete measurable milestone, e.g. "${dogName} holds a sit for 10 s with TV on" --></div></div>
      <!-- 3–4 items -->
    </div>
    <!-- Repeat for weeks 2, 3, 4 -->
  </div>
</section>

Now generate the full plan for ${dogName}. Be thorough, specific, and genuinely useful.
`.trim()
}
