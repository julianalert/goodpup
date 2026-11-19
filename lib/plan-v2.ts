import Anthropic from '@anthropic-ai/sdk'
import type { SubmissionRow } from './supabase'
import { getBreedContext } from './breed-context'
import {
  daysOfWeek,
  properName,
  TOTAL_DAYS,
  type PlanDay,
  type PlanExercise,
  type PlanProfile,
  type PlanToolkit,
  type PlanV2,
  type PlanWeek,
} from './plan-types'

// Server-side only. Generates the structured plan in two stages:
//   1. Blueprint — one call: the dog's profile, the four weeks, an outline of all
//      30 days (titles + exercise names + minutes) and the toolkit.
//   2. Detail — four calls side by side, one per week: the full step-by-step
//      exercises for that week's days, written against the shared outline.
// Splitting it keeps every call short (a whole plan in one response takes too
// long for one function run) and lets a single bad week be retried on its own.

const MODEL = 'claude-sonnet-5-5'

const AGE_LABELS: Record<string, string> = {
  puppy_under6: 'puppy under 6 months',
  puppy_6to12: 'young puppy (6–12 months)',
  adolescent: 'adolescent (1–2 years)',
  adult: 'adult (2–7 years)',
  senior: 'senior (7+ years)',
}

export const PROBLEM_LABELS: Record<string, string> = {
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
  first_dog: 'first dog ever',
  some_experience: 'has had dogs before, not a professional',
  experienced: 'experienced dog owner',
}

const HISTORY_LABELS: Record<string, string> = {
  none: 'no prior training',
  some_home: 'some basic training at home',
  classes: 'attended group classes',
  trainer: 'has worked with a private trainer',
}

// ── Prompts ────────────────────────────────────────────────────────────────

interface Dog {
  name: string
  breed: string | null
  age: string
  dailyTime: number
  problems: string[]
  profileText: string
}

function describeDog(row: SubmissionRow): Dog {
  const name = properName(row.dog_name, 'the dog')
  const breed = row.dog_breed?.trim() || null
  const age = AGE_LABELS[row.dog_age ?? ''] ?? 'age unknown'
  const dailyTime = Math.min(60, Math.max(10, row.daily_time ?? 20))
  const problems = (row.problems ?? []).map((p) => PROBLEM_LABELS[p] ?? p)

  const profileText = [
    `Name: ${name}`,
    `Breed: ${breed ?? 'unknown (not provided — never guess one)'}`,
    `Age: ${age}`,
    `Problems the owner wants solved, in their order: ${problems.join('; ') || 'general training'}`,
    `In the owner's words: ${row.problem_context?.trim() || '(nothing added)'}`,
    `Training time available: ${dailyTime} minutes a day`,
    `Home: ${LIVING_LABELS[row.living ?? ''] ?? 'not specified'}`,
    `Owner: ${EXPERIENCE_LABELS[row.experience ?? ''] ?? 'experience not specified'}`,
    `Training so far: ${HISTORY_LABELS[row.training_history ?? ''] ?? 'not specified'}`,
  ].join('\n')

  return { name, breed, age, dailyTime, problems, profileText }
}

/** Extra rules for plans where a mistake can get a person or a dog hurt. */
function safetyRules(row: SubmissionRow, name: string): { rules: string[]; safetyBlockRequired: boolean } {
  const problems = row.problems ?? []
  const isPuppy = row.dog_age === 'puppy_under6' || row.dog_age === 'puppy_6to12'
  const isSenior = row.dog_age === 'senior'
  const aggression = problems.includes('aggression')
  const biting = problems.includes('biting')
  const fearful = problems.includes('fearful')
  const risky = aggression || biting || fearful

  const rules: string[] = []

  if (risky) {
    rules.push(
      `Never schedule off-leash or unbarriered contact between ${name} and something ${name} reacts to (other dogs, strangers, children, resident pets) on any of the 30 days. Exposure work happens at a distance where ${name} can still take food and look away, on leash or behind a barrier. Reducing that distance gradually is the only progression. Direct greetings and shared free space come after this program, and with a professional if there is any bite history.`,
      `Never tell the owner to reach for, corner, hold down, stare down or physically correct ${name} during a reaction, or to take things from ${name}'s mouth by force.`,
      'Every milestone must be reachable inside these rules: none may require unbarriered contact with a trigger.',
    )
  }
  if (aggression || (biting && !isPuppy)) {
    rules.push(
      `Include basket-muzzle conditioning early in the program as a positive, treat-based exercise, presented as an ordinary safety tool that gives ${name} more freedom, never as a punishment or a label.`,
    )
  }
  if (biting && isPuppy) {
    rules.push(
      `${name} is a puppy: treat mouthing as normal development and teach bite inhibition and redirection. Name the signs that are NOT normal puppy mouthing and need a professional (stiff body, hard stare, growling over food or objects, bites with no play signals).`,
    )
  }
  if (isSenior) {
    rules.push(
      `${name} is a senior: new or worsening behavior in an older dog is often medical (pain, hearing or sight loss, cognitive decline), so a vet check comes first. Keep every exercise low-impact.`,
    )
  }

  return { rules, safetyBlockRequired: risky || isSenior }
}

function systemPrompt(row: SubmissionRow, dog: Dog): string {
  const { rules } = safetyRules(row, dog.name)

  return `You are the head trainer at PawCraft. You write paid, personalised 30-day training programs for dog owners. The owner follows the program on their phone, one day at a time, with the dog next to them, so everything you write has to be something they can do right now without interpreting it.

How you train
- Reward-based, force-free methods only: a marker and rewards, management, gradual exposure below the dog's threshold. No punishment, intimidation, "dominance" ideas, flooding, or prong, choke or shock collars.
- You find the cause of a behavior (breed instincts, age, environment, what the behavior gets the dog) and train an alternative. You do not just suppress the symptom.
- Skills are built in order: low distraction first, then duration, distance and distraction, one at a time. Later days reuse earlier skills by the same name.
- Management, meaning preventing the dog from rehearsing the problem, runs alongside training from Day 1.

How you write
- To the owner as "you", about the dog by name. Warm, direct and confident, like a brilliant friend who trains dogs for a living. No filler, no hype.
- Plain text only: no HTML, no markdown, no emoji. American English.
- Specific to this dog: its breed, age, home and the owner's own words. Nothing that would read the same for any dog. Bring up the breed where it changes what to do, not in every sentence.
- Match the owner's experience. For a first-time owner, explain a training term the first time it appears.
- Concrete numbers: how many repetitions, how many seconds, how far away.
${rules.length ? `\nSafety rules — these override every other instruction\n${rules.map((r) => `- ${r}`).join('\n')}\n` : ''}`
}

function blueprintPrompt(row: SubmissionRow, dog: Dog, breedContext: string | null): string {
  const { safetyBlockRequired } = safetyRules(row, dog.name)

  return `<dog>
${dog.profileText}
</dog>
${breedContext ? `\n<breed_reference>\n${breedContext}\n</breed_reference>\n` : ''}
Design ${dog.name}'s 30-day program. Fill every field of the response:

profile
- headline: one sentence describing daily life with ${dog.name} once these 30 days have worked. Honest: what a month can really change.
- scores: exactly four, labelled "Drive", "Trainability", "Mental stimulation need" and "Reactivity baseline". level is one or two words (e.g. "Very high"). percent is 0–100${breedContext ? '; base it on the reference scores, adjusted for this dog' : ''}. why is one sentence about this dog.
- strengths: 3–5 short phrases you will build on. watchouts: 3–5 short phrases to plan around.
- rootCauses: one entry per problem the owner listed, in their order. problem is a short label (2–4 words). explanation is 3–5 sentences on why ${dog.name} does this, using what the owner told you.
- safety: ${safetyBlockRequired
    ? `required for this dog. management = how to stop ${dog.name} rehearsing the behavior while training is under way (distance, barriers, leash, avoiding known triggers). vet = when a vet check comes before training. professional = the exact signs that mean stop and bring in a certified behaviorist or veterinary behaviorist (a bite that broke skin, aggression toward a child, escalation, no improvement after two weeks). Two to four sentences each, calm, not alarming.`
    : 'null for this dog.'}

weeks: exactly four. Week 1 = Days 1–7, Week 2 = Days 8–14, Week 3 = Days 15–21, Week 4 = Days 22–30.
- title: 3–6 words. focus: one sentence. rule: the one rule the owner must hold to that week, one sentence.
- milestones: 3–4 things the owner can observe and tick off, with numbers ("holds a sit for 10 seconds with the TV on").
- Week 1 builds attention and foundations in low-distraction settings (potty training is the exception: it happens outdoors from Day 1).

outline: exactly 30 days, numbered 1 to 30.
- title: at most 6 words, naming the day's main skill. focus: one sentence on what today is for and what it builds on.
- exercises: 1 to 3 per day, each with a name and whole minutes. A day's minutes add up to between ${Math.max(5, Math.round(dog.dailyTime * 0.7))} and ${dog.dailyTime}. Never more than ${dog.dailyTime}.
- Keep the same exercise name whenever a skill continues on a later day, so the owner recognises it.
- Every problem the owner listed gets work in every week.
- Day 1 includes something ${dog.name} can succeed at within five minutes. Days 7, 14 and 21 are lighter review days. Day 30 reviews the month and sets up what comes next.

toolkit
- emergencies: 4–6 "what to do when…" moments this owner is most likely to face with these problems. situation is phrased as the moment ("${dog.name} lunges at another dog on a walk"). steps: 3–5 short actions to take right then, in order.
- mistakes: exactly 5 that owners of this kind of dog make with these problems. title is short; why explains the damage in 1–2 sentences.
- kit: 4–8 things to have for the program, each with why.
- houseRules: 5–7 short rules everyone in the home follows, each a single line.`
}

function weekPrompt(dog: Dog, blueprint: Blueprint, week: number): string {
  const days = daysOfWeek(week)
  const weekInfo = blueprint.weeks.find((w) => w.week === week)

  const outlineText = blueprint.outline
    .map((d) => `Day ${d.day} — ${d.title}: ${d.focus}\n${d.exercises.map((e) => `  · ${e.name} (${e.minutes} min)`).join('\n')}`)
    .join('\n')

  return `<dog>
${dog.profileText}
</dog>

<program>
Root causes:
${blueprint.profile.rootCauses.map((c) => `- ${c.problem}: ${c.explanation}`).join('\n')}

Weeks:
${blueprint.weeks.map((w) => `Week ${w.week} — ${w.title}. ${w.focus} Rule: ${w.rule}`).join('\n')}

All 30 days:
${outlineText}
</program>

Write the full exercises for Week ${week}${weekInfo ? ` ("${weekInfo.title}")` : ''}: Days ${days[0]} to ${days[days.length - 1]}, every day, in order. For each day, write each exercise from the outline with the same name, the same minutes and in the same order.

For each exercise:
- why: one sentence on why this matters for ${dog.name} today.
- needs: what to have at hand, 0–4 short items (empty list if nothing).
- steps: 3–6 steps. One action per step, in the order to do them. Each step is a complete instruction of 12–35 words: where to be, what to say or do, exactly what to mark and reward, how many repetitions or seconds.
- success: what the owner should see by the end of today, with a number.
- ifStuck: the most likely way this goes wrong for ${dog.name}, and exactly what to change. 1–3 sentences.

An exercise that also appears on an earlier day must move forward today: a harder criterion, a new place or more distraction. Say what is different. Never write "repeat yesterday" or "as before"; the owner only sees today's card.`
}

// ── Response schemas (structured outputs) ──────────────────────────────────

const str = { type: 'string' } as const
const int = { type: 'integer' } as const
const strings = { type: 'array', items: str } as const
const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})
const list = (items: unknown) => ({ type: 'array', items })

const BLUEPRINT_SCHEMA = obj({
  profile: obj({
    headline: str,
    scores: list(obj({ label: str, level: str, percent: int, why: str })),
    strengths: strings,
    watchouts: strings,
    rootCauses: list(obj({ problem: str, explanation: str })),
    safety: { anyOf: [obj({ management: str, vet: str, professional: str }), { type: 'null' }] },
  }),
  weeks: list(obj({ week: int, title: str, focus: str, rule: str, milestones: strings })),
  outline: list(obj({ day: int, title: str, focus: str, exercises: list(obj({ name: str, minutes: int })) })),
  toolkit: obj({
    emergencies: list(obj({ situation: str, steps: strings })),
    mistakes: list(obj({ title: str, why: str })),
    kit: list(obj({ item: str, why: str })),
    houseRules: strings,
  }),
})

const WEEK_SCHEMA = obj({
  days: list(obj({
    day: int,
    exercises: list(obj({ name: str, minutes: int, why: str, needs: strings, steps: strings, success: str, ifStuck: str })),
  })),
})

interface Blueprint {
  profile: PlanProfile
  weeks: PlanWeek[]
  outline: { day: number; title: string; focus: string; exercises: { name: string; minutes: number }[] }[]
  toolkit: PlanToolkit
}

interface WeekDetail {
  days: { day: number; exercises: PlanExercise[] }[]
}

// ── Model call ─────────────────────────────────────────────────────────────

async function callJson<T>(opts: {
  label: string
  system: string
  prompt: string
  schema: Record<string, unknown>
  maxTokens: number
  timeoutMs: number
  effort: 'low' | 'medium' | 'high'
}): Promise<T> {
  if (opts.timeoutMs < 10_000) throw new Error(`${opts.label}: no time left`)

  const client = new Anthropic({ maxRetries: 1 })
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: opts.maxTokens,
    system: opts.system,
    output_config: { effort: opts.effort, format: { type: 'json_schema', schema: opts.schema } },
    messages: [{ role: 'user', content: opts.prompt }],
  })

  const startedAt = Date.now()
  const timer = setTimeout(() => stream.abort(), opts.timeoutMs)
  let message: Anthropic.Message
  try {
    message = await stream.finalMessage()
  } finally {
    clearTimeout(timer)
  }

  console.log(`[plan-v2] ${opts.label}`, {
    seconds: Math.round((Date.now() - startedAt) / 1000),
    stop_reason: message.stop_reason,
    output_tokens: message.usage.output_tokens,
  })

  if (message.stop_reason === 'refusal') throw new Error(`${opts.label}: model declined`)
  if (message.stop_reason === 'max_tokens') throw new Error(`${opts.label}: cut off at max_tokens`)

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  return JSON.parse(text) as T
}

// ── Checks ─────────────────────────────────────────────────────────────────
// The schema guarantees the shape; these guarantee the plan is usable.

const clean = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')
const cleanList = (value: unknown): string[] => (Array.isArray(value) ? value.map(clean).filter(Boolean) : [])

/** Fit a day's exercises inside the owner's daily minutes, keeping their proportions. */
export function fitMinutes(minutes: number[], budget: number): number[] {
  const safe = minutes.map((m) => Math.max(2, Math.round(Number.isFinite(m) ? m : 5)))
  const total = safe.reduce((a, b) => a + b, 0)
  if (total <= budget) return safe

  const scaled = safe.map((m) => Math.max(2, Math.floor((m * budget) / total)))
  // Flooring to a minimum of 2 can still overshoot a tiny budget: trim the longest
  let over = scaled.reduce((a, b) => a + b, 0) - budget
  while (over > 0) {
    const longest = scaled.indexOf(Math.max(...scaled))
    if (scaled[longest] <= 2) break
    scaled[longest] -= 1
    over -= 1
  }
  return scaled
}

function checkBlueprint(raw: Blueprint, dog: Dog, safetyRequired: boolean): Blueprint {
  const weeks = [1, 2, 3, 4].map((n) => {
    const w = raw.weeks.find((x) => x.week === n)
    if (!w) throw new Error(`blueprint: week ${n} is missing`)
    const milestones = cleanList(w.milestones).slice(0, 5)
    if (milestones.length < 2) throw new Error(`blueprint: week ${n} has too few milestones`)
    return { week: n, title: clean(w.title), focus: clean(w.focus), rule: clean(w.rule), milestones }
  })

  const outline = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const d = raw.outline.find((x) => x.day === i + 1)
    if (!d) throw new Error(`blueprint: day ${i + 1} is missing`)
    const exercises = d.exercises.filter((e) => clean(e.name)).slice(0, 3)
    if (exercises.length === 0) throw new Error(`blueprint: day ${i + 1} has no exercise`)
    const minutes = fitMinutes(exercises.map((e) => e.minutes), dog.dailyTime)
    return {
      day: i + 1,
      title: clean(d.title),
      focus: clean(d.focus),
      exercises: exercises.map((e, j) => ({ name: clean(e.name), minutes: minutes[j] })),
    }
  })

  const p = raw.profile
  const scores = (p.scores ?? []).slice(0, 4).map((s) => ({
    label: clean(s.label),
    level: clean(s.level),
    percent: Math.min(100, Math.max(0, Math.round(Number(s.percent) || 0))),
    why: clean(s.why),
  }))
  if (scores.length < 3) throw new Error('blueprint: profile scores are missing')

  const rootCauses = (p.rootCauses ?? [])
    .map((c) => ({ problem: clean(c.problem), explanation: clean(c.explanation) }))
    .filter((c) => c.problem && c.explanation)
  if (rootCauses.length === 0) throw new Error('blueprint: root causes are missing')

  const safety = p.safety && clean(p.safety.management)
    ? { management: clean(p.safety.management), vet: clean(p.safety.vet), professional: clean(p.safety.professional) }
    : null
  if (safetyRequired && !safety) throw new Error('blueprint: the safety section is required for this dog')

  const t = raw.toolkit
  const toolkit: PlanToolkit = {
    emergencies: (t.emergencies ?? [])
      .map((e) => ({ situation: clean(e.situation), steps: cleanList(e.steps) }))
      .filter((e) => e.situation && e.steps.length >= 2),
    mistakes: (t.mistakes ?? []).map((m) => ({ title: clean(m.title), why: clean(m.why) })).filter((m) => m.title),
    kit: (t.kit ?? []).map((k) => ({ item: clean(k.item), why: clean(k.why) })).filter((k) => k.item),
    houseRules: cleanList(t.houseRules),
  }
  if (toolkit.emergencies.length < 3 || toolkit.mistakes.length < 3) {
    throw new Error('blueprint: the toolkit is too thin')
  }

  return {
    profile: {
      headline: clean(p.headline),
      scores,
      strengths: cleanList(p.strengths),
      watchouts: cleanList(p.watchouts),
      rootCauses,
      safety,
    },
    weeks,
    outline,
    toolkit,
  }
}

function checkWeek(raw: WeekDetail, blueprint: Blueprint, week: number): PlanDay[] {
  return daysOfWeek(week).map((dayNumber) => {
    const planned = blueprint.outline[dayNumber - 1]
    const written = raw.days.find((d) => d.day === dayNumber)
    if (!written) throw new Error(`week ${week}: day ${dayNumber} is missing`)
    if (written.exercises.length < planned.exercises.length) {
      throw new Error(`week ${week}: day ${dayNumber} has ${written.exercises.length} exercises, outline has ${planned.exercises.length}`)
    }

    const exercises = planned.exercises.map((outlineExercise, i) => {
      const e = written.exercises[i]
      const steps = cleanList(e.steps)
      if (steps.length < 2) throw new Error(`week ${week}: day ${dayNumber} "${outlineExercise.name}" has no usable steps`)
      return {
        // Name and minutes come from the outline: it is what the journey shows and
        // what was fitted to the owner's daily time.
        name: outlineExercise.name,
        minutes: outlineExercise.minutes,
        why: clean(e.why),
        needs: cleanList(e.needs).slice(0, 5),
        steps: steps.slice(0, 7),
        success: clean(e.success),
        ifStuck: clean(e.ifStuck),
      }
    })

    return { day: dayNumber, title: planned.title, focus: planned.focus, exercises }
  })
}

// ── Pipeline ───────────────────────────────────────────────────────────────

/** Builds the whole structured plan. Throws rather than return an incomplete one. */
export async function generatePlanV2(submission: SubmissionRow, budgetMs: number): Promise<PlanV2> {
  const deadline = Date.now() + budgetMs
  const left = () => deadline - Date.now()

  const dog = describeDog(submission)
  const system = systemPrompt(submission, dog)
  const { safetyBlockRequired } = safetyRules(submission, dog.name)
  const breedContext = await getBreedContext(submission.dog_breed, submission.problems)

  const blueprint = checkBlueprint(
    await callJson<Blueprint>({
      label: 'blueprint',
      system,
      prompt: blueprintPrompt(submission, dog, breedContext),
      schema: BLUEPRINT_SCHEMA,
      maxTokens: 20000,
      // The blueprint is where the thinking happens: the arc of the month, what
      // each day builds on, how the minutes are spent.
      effort: 'medium',
      // Leave the weeks at least two minutes
      timeoutMs: Math.min(left() - 120_000, 140_000),
    }),
    dog,
    safetyBlockRequired,
  )

  const writeWeek = async (week: number): Promise<PlanDay[]> => {
    const attempt = async () =>
      checkWeek(
        await callJson<WeekDetail>({
          label: `week ${week}`,
          system,
          prompt: weekPrompt(dog, blueprint, week),
          schema: WEEK_SCHEMA,
          maxTokens: 20000,
          // Writing out exercises that are already decided: little to deliberate,
          // and at 'medium' a single week could take two minutes.
          effort: 'low',
          timeoutMs: left(),
        }),
        blueprint,
        week,
      )

    try {
      return await attempt()
    } catch (err) {
      // One more go for this week only, if there is time for it
      if (left() < 75_000) throw err
      console.warn(`[plan-v2] week ${week} failed, retrying:`, err instanceof Error ? err.message : err)
      return attempt()
    }
  }

  const weeks = await Promise.all([1, 2, 3, 4].map(writeWeek))
  const days = weeks.flat()
  if (days.length !== TOTAL_DAYS) throw new Error(`plan has ${days.length} days, expected ${TOTAL_DAYS}`)

  return {
    version: 2,
    profile: blueprint.profile,
    weeks: blueprint.weeks,
    days,
    toolkit: blueprint.toolkit,
  }
}
