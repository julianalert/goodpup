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

// ── Safety ─────────────────────────────────────────────────────────────────
// Extra rules for plans where a mistake can get a person or a dog hurt. Half of
// buyers pick reactivity/aggression or biting, so this is a main path, not an edge case.
function buildSafetyRules(row: SubmissionRow, dogName: string): string {
  const problems = row.problems ?? []
  const isPuppy = row.dog_age === 'puppy_under6' || row.dog_age === 'puppy_6to12'
  const isSenior = row.dog_age === 'senior'
  const aggression = problems.includes('aggression')
  const biting = problems.includes('biting')
  const fearful = problems.includes('fearful')

  const rules: string[] = []

  if (aggression || biting || fearful) {
    rules.push(
      `Open Section 02, right after the intro paragraph, with one <div class="callout callout-red"> safety callout (icon ⚠️, same inner markup as the other callouts) that covers, briefly and without alarm: (a) management comes first — how to stop ${dogName} rehearsing the behaviour while training is in progress (distance, barriers, leash, avoiding known triggers); (b) a vet check to rule out pain or illness comes before training if the behaviour started suddenly, has recently got worse, or the dog is a senior; (c) when to stop and bring in a certified behaviourist or veterinary behaviourist: any bite that broke skin, aggression directed at a child, behaviour that is escalating, or no improvement after two weeks of consistent work.`,
      `Never schedule off-leash or unbarriered contact between ${dogName} and something ${dogName} reacts to (other dogs, strangers, children, resident pets) on any of the 30 days. Exposure work happens at a distance where ${dogName} can still take food and look away, on leash or behind a barrier. Reducing that distance gradually is the only progression. Direct greetings and shared free space come after this program, and with a professional if there is any bite history — say so in Week 4.`,
      `Never tell the owner to reach for, corner, hold down, stare down, or physically correct ${dogName} during a reaction, or to take things from ${dogName}'s mouth by force. No punishment, no "flooding", no prong, choke or shock collars.`,
      'Every milestone in Section 04 must be reachable inside these rules: no milestone may require unbarriered contact with a trigger.',
    )
  }

  if (aggression || (biting && !isPuppy)) {
    rules.push(
      `Include basket-muzzle conditioning early in the program as a positive, treat-based exercise, presented as an ordinary safety tool that gives ${dogName} more freedom, not as a punishment or a label.`,
    )
  }

  if (biting && isPuppy) {
    rules.push(
      `${dogName} is a puppy: explain that mouthing is normal development and teach bite inhibition and redirection. Also list the signs that are NOT normal puppy mouthing and need a professional (stiff body, hard stare, growling over food or objects, bites with no play signals).`,
    )
  }

  if (isSenior) {
    rules.push(
      `${dogName} is a senior: say in the Section 01 callout that new or worsening behaviour in an older dog is often medical (pain, hearing or sight loss, cognitive decline) and that a vet check comes first. Keep every exercise low-impact.`,
    )
  }

  if (rules.length === 0) return ''

  return `
## Safety rules — these override every other instruction
${rules.map((r) => `- ${r}`).join('\n')}
`
}

export function buildPrompt(row: SubmissionRow): string {
  const problems = (row.problems ?? []).map(p => PROBLEM_LABELS[p] ?? p).join(', ')
  const age = AGE_LABELS[row.dog_age ?? ''] ?? row.dog_age ?? 'unknown age'
  const living = LIVING_LABELS[row.living ?? ''] ?? row.living ?? 'unknown living situation'
  const experience = EXPERIENCE_LABELS[row.experience ?? ''] ?? row.experience ?? 'unknown experience'
  const history = HISTORY_LABELS[row.training_history ?? ''] ?? 'no prior training'
  const dogName = row.dog_name?.trim() || 'the dog'
  const breedKnown = Boolean(row.dog_breed?.trim())
  // Unknown breed: the template's "specific to <breed>" slots point at the dog instead
  const dogBreed = row.dog_breed?.trim() || dogName
  const dailyTime = row.daily_time ?? 20
  const safetyRules = buildSafetyRules(row, dogName)

  return `
You are an expert dog trainer and behaviourist with 20+ years of experience.
Your task is to generate a complete, personalised 30-day dog training plan as a
well-structured HTML document.

## Dog profile
- Name: ${dogName}
- Breed: ${breedKnown ? dogBreed : 'unknown (not provided)'}
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
${breedKnown ? `breed (${dogBreed}), ` : ''}age (${age}), and problems (${problems}).

CRITICAL RULES:
- Never use generic advice that could apply to any dog
${breedKnown
    ? `- Ground the plan in the breed characteristics of a ${dogBreed} wherever they genuinely change the advice`
    : `- The breed is unknown: never guess one. Build the plan from ${dogName}'s age, the behaviour described and the owner's context`}
- Adapt all exercise durations to fit within ${dailyTime} minutes per day
- Adapt all outdoor/indoor exercise recommendations to a ${living}
- If the owner is ${experience}, adjust the complexity and jargon level accordingly
- Week 1 builds foundation and attention in low-distraction settings before harder environments (the exception is potty training, which happens outdoors from Day 1)
- Always identify and explain the ROOT CAUSE of each problem, not just the symptoms
- The mistakes section must contain mistakes specific to this dog's ${breedKnown ? 'breed, ' : ''}age and problems, not generic ones
- The program has EXACTLY 30 day rows, labelled "Day 1" to "Day 30" with no gaps and no repeats: Week 1 = Days 1–7, Week 2 = Days 8–14, Week 3 = Days 15–21, Week 4 = Days 22–30 (nine rows). Never use weekday names.
- Depth: each Exercise cell is a complete mini-lesson the owner can follow with the page open in one hand. Start with the exercise name in <strong>, then say exactly what to do: the set-up, the cue, what to mark and reward, how many repetitions, and what to do if ${dogName} struggles. Aim for 70–120 words per day; a one-line exercise is not enough.
- In each day row, the Duration cell is the time only, in a few words (e.g. "3 × 5 min"). Anything longer belongs in the Exercise cell.
- Tone: warm, expert, encouraging — like a brilliant friend who happens to be a dog trainer
${safetyRules}
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
          <td><span class="day-name">Day 1</span></td>
          <td><strong><!-- exercise name --></strong> <!-- full step-by-step instructions, 70–120 words --></td>
          <td><!-- measurable goal --></td>
          <td><span class="duration-badge"><!-- time only, e.g. 3 × 5 min --></span></td>
        </tr>
        <!-- 7 rows total: Day 1 to Day 7 -->
      </tbody>
    </table>
  </div>
  <!-- Repeat .week-block for Week 2 (Days 8–14), Week 3 (Days 15–21) and Week 4 (Days 22–30, nine rows) -->
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
