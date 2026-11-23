import type { SubmissionRow } from './supabase'
import { getBreedProfile, type BreedProfile } from './breed-context'
import { callJson, clean, cleanList, describeDog, safetyRules, type Dog } from './plan-v2'
import { isPlanV2, properName } from './plan-types'
import { SITE_URL } from './site'
import {
  HANDBOOK_BLOCK_KINDS,
  HANDBOOK_CHAPTERS,
  HANDBOOK_SHEETS,
  HANDBOOK_TRAITS,
  type Handbook,
  type HandbookBlock,
  type HandbookBlockKind,
  type HandbookChapter,
  type HandbookChapterId,
  type HandbookSection,
  type HandbookSheet,
  type HandbookTrait,
} from './handbook-types'

// Server-side only. Writes the breed handbook add-on in two stages, the same way
// the plan is written (lib/plan-v2.ts):
//   1. Outline — one call: the "at a glance" page (fact sheet, 12 traits, key
//      points), the figures every chapter must agree on, and the sections of each
//      of the nine written chapters.
//   2. Writing — four calls side by side: three groups of three chapters, and the
//      printable cheat sheets, all written against the shared outline.
// Every call is short enough for one function run, and a group that fails is
// retried on its own.

// The trait bars of chapter 1 → the column of our breeds table each one comes from
const TRAIT_COLUMNS: Record<(typeof HANDBOOK_TRAITS)[number], string> = {
  'Trainability': 'score_trainability',
  'Energy': 'score_energy',
  'Independence': 'score_independence',
  'Sociability': 'score_sociability',
  'Affection': 'trait_affectionate',
  'Patience': 'trait_patience',
  'Prey drive': 'trait_prey_drive',
  'Guarding instinct': 'trait_guarding_instinct',
  'Food motivation': 'drive_food',
  'Play motivation': 'drive_play',
  'Focus outdoors': 'drive_focus_outdoors',
  'Beginner-friendliness': 'score_beginner_friendly',
}

const FACT_LABELS = ['Group', 'Origin', 'Bred for', 'Weight', 'Height', 'Lifespan', 'Daily exercise', 'Time alone']

// Chapters written together in one call
const CHAPTER_GROUPS: HandbookChapterId[][] = [
  ['origin', 'mind', 'life_stage'],
  ['exercise', 'home', 'feeding'],
  ['health', 'grooming', 'training'],
]

/** What each chapter is for. The outline call turns these into sections for this dog. */
const CHAPTER_BRIEFS: Record<HandbookChapterId, (name: string, breed: string, age: string) => string> = {
  origin: (name) =>
    `Where the breed comes from and the job it was bred to do; each instinct that job needed and how it shows up in a home today; how those instincts explain the problems ${name}'s owner listed (the why only: the training program handles the how).`,
  mind: (name) =>
    `What motivates this breed, with food, praise and play ranked for ${name}; sensitivity to tone and handling; independence versus focus on the handler; how the breed bonds; how it typically is with strangers, other dogs, children and cats; the body language worth learning to read.`,
  life_stage: (name, _breed, age) =>
    `Where ${name} is now (${age}): what is normal at this stage for this breed, what is a phase and what is not, and what the next 12 months are likely to bring. Then a shorter look at the stages still ahead.`,
  exercise: (name) =>
    `How much exercise ${name} needs at this age and how to split it; the kinds of exercise that suit this breed's body and brain; mental work; around ten games or jobs that fit the breed, each explained in a line or two; the signs of too little and of too much. Fitted to the owner's home and available time.`,
  home: () =>
    `Setting up the owner's kind of home for this breed; time alone and how to build it up; a realistic day built around the owner's training minutes; visitors and the doorbell; the car and travel; heat and cold tolerance.`,
  feeding: (name) =>
    `What this breed needs from its food at ${name}'s life stage; how to find the right amount without a scale of numbers (body condition); the breed's tendency to gain or lose weight; meals per day; using treats for training without overfeeding; foods that are toxic to dogs; any feeding-related risk this breed is known for.`,
  health: (name) =>
    `The conditions this breed is predisposed to: for each, what it is in one sentence, the early signs an owner can notice, the usual age it appears, and what to ask the vet. The rhythm of preventive care at ${name}'s age. The signs that mean a vet visit today.`,
  grooming: (name) =>
    `The breed's coat and how much it sheds; the care routine by how often (daily, weekly, monthly, seasonal); nails, ears, teeth and bathing; teaching ${name} to accept being handled, step by step.`,
  training: (name, breed) =>
    `How a ${breed} learns: session length, how much repetition it tolerates, which rewards work; what kills its motivation; the behavior problems the breed is prone to beyond the ones already in ${name}'s program (why they appear, the early signs, how to prevent them); how to keep going after the 30 days; when to bring in a professional.`,
}

const SHEET_BRIEFS: Record<HandbookSheet['id'], (name: string, breed: string, dailyTime: number) => string> = {
  daily_routine: (name, _breed, dailyTime) =>
    `A realistic weekday for ${name}. Groups: "Morning", "Midday", "Evening", "Before bed". Parts of the day, never clock times. Include the ${dailyTime}-minute training session from the program, and the exercise and alone time from the key numbers.`,
  care_checklist: (name) =>
    `What to do for ${name} and how often. Groups: "Every day", "Every week", "Every month", "Every season".`,
  year: () =>
    `What each season asks of this breed. Groups: "Winter", "Spring", "Summer", "Fall", "Once a year".`,
  vet_questions: (name, breed) =>
    `What to bring up with the vet. Groups: "At the next check-up", "About ${breed}s in particular", "Go the same day if you see".`,
  sitter: (name) =>
    `A page to hand to whoever looks after ${name}. Groups: "About ${name}", "Routine", "House rules", "On walks", "If something goes wrong". Where the answer is something only the owner knows (the vet's phone number, how much food, where things are kept), write the line with a blank to fill in by hand, like "Vet's phone: ______".`,
}

// ── Prompts ────────────────────────────────────────────────────────────────

function systemPrompt(row: SubmissionRow, dog: Dog): string {
  const { rules } = safetyRules(row, dog.name)

  return `You are the lead author at PawCraft. You write a personalised breed handbook for one dog owner: a short book about their dog's breed and about living with this particular dog. The owner already has a 30-day training program from us for the behavior problems they listed. The handbook is the reference book that goes with it: what this breed is, why this dog is the way it is, and how to give it a good life. It never repeats the program's daily exercises.

What you know, and what you don't
- You know the dog's name, breed, age bracket, the problems the owner listed and what they wrote about them, their home, their experience with dogs, the dog's training so far, and the minutes a day the owner has.
- You do not know the dog's sex, weight, whether it is neutered, its health history, or whether there are children or other animals at home. Never assume any of these. Where one changes the advice, cover the cases in a sentence ("If there are children at home, ...").

Accuracy
- Only well-established knowledge about the breed. When reference data from our breed database is given, it wins over your own recollection. If you are not sure of a fact, leave it out rather than guess.
- No invented statistics, percentages, study results, prices or brand names.
- Health: say what the breed is predisposed to, the early signs an owner can notice, and what to ask a vet. Never diagnose, never name a medication or a dose, never present a supplement as a treatment. State emergencies plainly: this needs a vet now.
- Feeding: no amounts in grams, cups or calories, because the dog's weight is unknown. Explain how to find the right amount (the food's own guide as a starting point, then the dog's body condition). You may point to our free food calculator at ${SITE_URL}/dog-food-calculator.
- Training and handling: reward-based, force-free methods only. No punishment, intimidation, "dominance" ideas, or prong, choke or shock collars.
- If you do not recognise the breed the owner wrote, do not invent one: say so once, and write the book around what is known (age, home, behavior, the owner's words).

How you write
- To the owner as "you", about the dog by name. Warm, direct and confident, like a friend who knows the breed inside out. No filler, no hype, no sentence that would read the same in a book about any other dog.
- Specific to this dog: its breed, its age, its home, the owner's time and experience, the owner's own words. Use the dog's name naturally, not in every sentence.
- Concrete: minutes, how often, what it looks like when it is going right or wrong.
- Match the owner's experience. For a first-time owner, explain a term the first time it appears.
- Plain text only: no HTML, no markdown, no emoji. American English. Never use an em dash or en dash as punctuation: use a comma, a period or parentheses.
${rules.length ? `\nSafety rules for this dog. These override every other instruction\n${rules.map((r) => `- ${r}`).join('\n')}\n` : ''}`
}

const line = (label: string, value: unknown) =>
  value === null || value === undefined || value === '' ? '' : `${label}: ${value}\n`

/** Everything our database holds on the breed, as reference text. Null when we have no match. */
export function breedReference(profile: BreedProfile | null, typed: string | null): string | null {
  if (!profile) return null
  const b = profile.breed

  let text = profile.match.exact
    ? `Breed in our database: ${b.name}\n`
    : `Closest breed in our database: ${b.name} (the owner wrote "${typed ?? ''}", so use what fits this dog and say plainly where a mix can differ)\n`

  text += line('Group', b.group_name)
  text += line('Origin', b.origin)
  text += line('Bred for', b.purpose)
  text += line('Weight', b.weight_range)
  text += line('Height', b.height_range)
  text += line('Lifespan', b.lifespan)
  text += line('Summary', b.description)
  if (Array.isArray(b.tags) && b.tags.length) text += `Known for: ${b.tags.join(', ')}\n`

  const scores = HANDBOOK_TRAITS
    .map((label) => [label, b[TRAIT_COLUMNS[label]]] as const)
    .filter(([, v]) => typeof v === 'number')
  if (scores.length) text += `Trait scores, 0–100: ${scores.map(([k, v]) => `${k} ${v}`).join(', ')}\n`
  text += line('Praise motivation (0–100)', b.drive_praise)
  text += line('Distraction threshold (0–100)', b.drive_distraction_threshold)

  text += line('Daily exercise need for an adult (minutes)', b.daily_exercise_minutes)
  text += line('Longest comfortable time alone for an adult (hours)', b.max_alone_hours)
  if (typeof b.apartment_suitable === 'boolean') {
    text += `Apartment living: ${b.apartment_suitable ? 'can work' : 'difficult'}${b.apartment_note ? `. ${b.apartment_note}` : ''}\n`
  }
  text += line('With children', b.good_with_kids)
  text += line('With other dogs', b.good_with_dogs)
  text += line('With cats', b.good_with_cats)
  text += line('Training overview', b.training_overview)
  text += line('Adolescence', b.adolescence_warning)

  if (profile.problems.length) {
    text += '\nBehavior problems we track for this breed:\n'
    for (const p of profile.problems) {
      const facts = [p.frequency, typeof p.difficulty === 'number' ? `difficulty ${p.difficulty}/10` : null].filter(Boolean).join(', ')
      text += `- ${p.problem_slug}${facts ? ` (${facts})` : ''}${p.why_this_breed ? `: ${p.why_this_breed}` : ''}${p.age_risk_note ? ` Age note: ${p.age_risk_note}` : ''}\n`
    }
  }

  return text.trim()
}

/** What the owner's 30-day program already says, so the book agrees with it and doesn't repeat it. */
export function programSummary(row: SubmissionRow): string | null {
  if (!isPlanV2(row.plan_json)) return null
  const plan = row.plan_json
  return [
    'Why the dog does it, as the program explains it:',
    ...plan.profile.rootCauses.map((c) => `- ${c.problem}: ${c.explanation}`),
    '',
    'The four weeks:',
    ...plan.weeks.map((w) => `- Week ${w.week}, ${w.title}: ${w.focus}`),
  ].join('\n')
}

interface Context {
  dog: Dog
  breed: string
  system: string
  /** The <dog>, <breed_reference> and <program> blocks every prompt opens with */
  shared: string
}

function outlinePrompt(ctx: Context, hasReference: boolean): string {
  const { dog, breed } = ctx
  const chapterList = HANDBOOK_CHAPTERS
    .map((c) => `- ${c.id} (Chapter ${c.number}, "${c.title(dog.name, breed)}"): ${CHAPTER_BRIEFS[c.id](dog.name, breed, dog.age)}`)
    .join('\n')

  return `${ctx.shared}

Design ${dog.name}'s handbook. This call plans the book. The chapters are written afterwards from your outline, by writers who see only what you put in it, so every field has to be specific to this dog.

subtitle: one sentence for the cover, under the title. What this book is for this owner.

Chapter 1 is a single "at a glance" page, built from these fields:
- glanceIntro: two or three sentences on who ${dog.name} is, given the breed and the age.
- facts: exactly these eight labels, in this order: ${FACT_LABELS.join(', ')}. Values are short (at most 8 words)${hasReference ? ' and come from the reference data' : ''}. "Daily exercise" and "Time alone" are for ${dog.name} at this age, not for the breed in general. Where you cannot state a value reliably, write "Varies".
- traits: exactly these twelve labels, in this order: ${HANDBOOK_TRAITS.join(', ')}. percent is 0–100 for the breed${hasReference ? ' (use the reference scores exactly)' : ''}. note is one sentence on what that score means for daily life with ${dog.name}.
- keyPoints: exactly three. The three things that matter most about living with this dog, one sentence each.

keyNumbers: 8 to 12 lines, each written "Topic: value". The figures and choices every chapter must agree on: daily exercise minutes for ${dog.name} at this age and how they split, hours alone, meals per day, how often to brush, the rewards to lead with, the names of the health conditions the health chapter covers, and anything else two chapters could otherwise contradict each other on.

chapters: one entry per chapter, with these ids, in this order:
${chapterList}
For each chapter, 5 or 6 sections:
- heading: 2 to 6 words, plain and descriptive.
- brief: one or two sentences saying exactly what the section covers for ${dog.name}. Specific enough that no two sections in the book cover the same thing.`
}

function bookOutlineText(ctx: Context, outline: Outline): string {
  return [
    'Key numbers (every chapter agrees with these):',
    ...outline.keyNumbers.map((n) => `- ${n}`),
    '',
    'The whole book:',
    `Chapter 1, "${ctx.dog.name} at a glance": fact sheet, trait scores and the three key points.`,
    ...HANDBOOK_CHAPTERS.map((c) => {
      const sections = outline.chapters[c.id]
      return `Chapter ${c.number}, "${c.title(ctx.dog.name, ctx.breed)}" [${c.id}]\n${sections.map((s) => `  · ${s.heading}: ${s.brief}`).join('\n')}`
    }),
    'Then five printable cheat sheets: daily routine, care checklist, the year, questions for the vet, a page for the dog-sitter.',
  ].join('\n')
}

function chaptersPrompt(ctx: Context, outline: Outline, ids: HandbookChapterId[]): string {
  const wanted = HANDBOOK_CHAPTERS.filter((c) => ids.includes(c.id))

  return `${ctx.shared}

<book>
${bookOutlineText(ctx, outline)}
</book>

Write these chapters in full, in this order: ${wanted.map((c) => `${c.id} (Chapter ${c.number})`).join(', ')}.

For each chapter:
- id: as given.
- intro: two or three sentences that open the chapter for ${ctx.dog.name}.
- sections: the outline's sections for that chapter, with the same headings, in the same order. Each section is 3 to 5 blocks and 170 to 260 words in all. A chapter is 900 to 1,200 words: this is a book the owner paid for, so give each section the depth a knowledgeable friend would, with the reasons and the practical detail, never padding.

A block has a kind, a title, a text and items. Fill only the fields its kind uses; leave the others empty ("" or []).
- text: one paragraph of 50 to 120 words, in text.
- list: 3 to 7 bullet points in items, each a complete, useful line of 12 to 35 words that says what to do or notice and why. title is an optional short label.
- steps: 3 to 6 steps in items, in the order to do them, one action each. title is an optional short label.
- facts: 3 to 6 lines in items, each written "Label: value". For things best read as a small table.
- tip: a practical tip worth setting apart. title of 2 to 6 words, text of one to three sentences.
- watch: something to keep an eye on. title of 2 to 6 words, text of one to three sentences.
- vet: when to involve the vet. title of 2 to 6 words, text of one to three sentences.

Most sections open with a text block and have a second one. Use a list, steps or facts block wherever the content is a set of things rather than an explanation. Each chapter has one to three callouts (tip, watch, vet), never more than one in a section.

Stay inside each section's brief: other sections and other chapters cover the rest. When another chapter has the detail, point to it by its title instead of repeating it.`
}

function sheetsPrompt(ctx: Context, outline: Outline): string {
  const sheets = HANDBOOK_SHEETS
    .map((s) => `- ${s.id} ("${s.title(ctx.dog.name)}"): ${SHEET_BRIEFS[s.id](ctx.dog.name, ctx.breed, ctx.dog.dailyTime)}`)
    .join('\n')

  return `${ctx.shared}

<book>
${bookOutlineText(ctx, outline)}
</book>

Write the five printable cheat sheets that close the book. Each one is a single printed page the owner sticks on the fridge or hands to someone, so every line is short (at most 18 words) and can be acted on without the rest of the book. They agree with the key numbers.

${sheets}

For each sheet:
- id: as given.
- note: one line under the title saying how to use the page.
- groups: the groups named above, in that order. Each has its label and 3 to 6 items.`
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

const sectionPlan = list(obj({ heading: str, brief: str }))

const OUTLINE_SCHEMA = obj({
  subtitle: str,
  glanceIntro: str,
  facts: list(obj({ label: str, value: str })),
  traits: list(obj({ label: str, percent: int, note: str })),
  keyPoints: strings,
  keyNumbers: strings,
  chapters: list(obj({ id: { type: 'string', enum: HANDBOOK_CHAPTERS.map((c) => c.id) }, sections: sectionPlan })),
})

const CHAPTERS_SCHEMA = obj({
  chapters: list(obj({
    id: { type: 'string', enum: HANDBOOK_CHAPTERS.map((c) => c.id) },
    intro: str,
    sections: list(obj({
      heading: str,
      blocks: list(obj({ kind: { type: 'string', enum: HANDBOOK_BLOCK_KINDS }, title: str, text: str, items: strings })),
    })),
  })),
})

const SHEETS_SCHEMA = obj({
  sheets: list(obj({
    id: { type: 'string', enum: HANDBOOK_SHEETS.map((s) => s.id) },
    note: str,
    groups: list(obj({ label: str, items: strings })),
  })),
})

interface RawOutline {
  subtitle: string
  glanceIntro: string
  facts: { label: string; value: string }[]
  traits: { label: string; percent: number; note: string }[]
  keyPoints: string[]
  keyNumbers: string[]
  chapters: { id: string; sections: { heading: string; brief: string }[] }[]
}

interface Outline {
  subtitle: string
  glanceIntro: string
  facts: { label: string; value: string }[]
  traits: HandbookTrait[]
  keyPoints: string[]
  keyNumbers: string[]
  chapters: Record<HandbookChapterId, { heading: string; brief: string }[]>
}

interface RawChapters {
  chapters: { id: string; intro: string; sections: { heading: string; blocks: HandbookBlock[] }[] }[]
}

interface RawSheets {
  sheets: { id: string; note: string; groups: { label: string; items: string[] }[] }[]
}

// ── Checks ─────────────────────────────────────────────────────────────────
// The schema guarantees the shape; these guarantee the book is worth reading.

const words = (text: string) => text.split(/\s+/).filter(Boolean).length
const sameLabel = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
const percent = (value: unknown) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)))

function checkOutline(raw: RawOutline, profile: BreedProfile | null): Outline {
  const facts = FACT_LABELS
    .map((label) => ({ label, value: clean(raw.facts.find((f) => sameLabel(f.label, label))?.value) }))
    .filter((f) => f.value)
  if (facts.length < 5) throw new Error('outline: the fact sheet is too thin')

  const traits = HANDBOOK_TRAITS.flatMap((label): HandbookTrait[] => {
    const written = raw.traits.find((t) => sameLabel(t.label, label))
    if (!written) return []
    // Our own breed data, when we have it, is what the site publishes: it wins
    const ours = profile?.breed[TRAIT_COLUMNS[label]]
    return [{ label, percent: percent(typeof ours === 'number' ? ours : written.percent), note: clean(written.note) }]
  })
  if (traits.length < 10) throw new Error(`outline: only ${traits.length} of ${HANDBOOK_TRAITS.length} traits`)

  const keyPoints = cleanList(raw.keyPoints).slice(0, 3)
  if (keyPoints.length < 2) throw new Error('outline: key points are missing')

  const keyNumbers = cleanList(raw.keyNumbers).slice(0, 14)
  if (keyNumbers.length < 4) throw new Error('outline: key numbers are missing')

  const chapters = {} as Outline['chapters']
  for (const { id } of HANDBOOK_CHAPTERS) {
    const sections = (raw.chapters.find((c) => c.id === id)?.sections ?? [])
      .map((s) => ({ heading: clean(s.heading), brief: clean(s.brief) }))
      .filter((s) => s.heading && s.brief)
      .slice(0, 6)
    if (sections.length < 3) throw new Error(`outline: chapter "${id}" has ${sections.length} sections`)
    chapters[id] = sections
  }

  return { subtitle: clean(raw.subtitle), glanceIntro: clean(raw.glanceIntro), facts, traits, keyPoints, keyNumbers, chapters }
}

/** A block the reader can use, or null when the model left it empty. */
export function checkBlock(raw: HandbookBlock): HandbookBlock | null {
  const kind: HandbookBlockKind = HANDBOOK_BLOCK_KINDS.includes(raw.kind) ? raw.kind : 'text'
  const title = clean(raw.title)
  const text = clean(raw.text)
  const items = cleanList(raw.items).slice(0, 12)

  if (kind === 'list' || kind === 'steps' || kind === 'facts') {
    if (items.length >= 2) return { kind, title, text: '', items }
    // A "list" of one line reads better as a sentence
    const only = text || items[0]
    return only ? { kind: 'text', title: '', text: only, items: [] } : null
  }
  if (!text) return null
  if (kind === 'text') return { kind, title: '', text, items: [] }
  // Callouts always carry a title; the model sometimes leaves it out
  return { kind, title: title || { tip: 'Tip', watch: 'Keep an eye on', vet: 'When to call the vet' }[kind], text, items: [] }
}

function checkChapters(raw: RawChapters, ctx: Context, outline: Outline, ids: HandbookChapterId[]): HandbookChapter[] {
  return ids.map((id) => {
    const spec = HANDBOOK_CHAPTERS.find((c) => c.id === id)!
    const written = raw.chapters.find((c) => c.id === id)
    if (!written) throw new Error(`chapter "${id}" is missing`)

    const sections: HandbookSection[] = written.sections
      .map((section, i) => ({
        // The outline's heading is the one the contents page was built from
        heading: outline.chapters[id][i]?.heading ?? clean(section.heading),
        blocks: (section.blocks ?? []).map(checkBlock).filter((b): b is HandbookBlock => b !== null),
      }))
      .filter((section) => section.heading && section.blocks.length > 0)

    if (sections.length < 3) throw new Error(`chapter "${id}" has ${sections.length} usable sections`)

    const length = sections
      .flatMap((s) => s.blocks)
      .reduce((total, b) => total + words(b.text) + b.items.reduce((n, item) => n + words(item), 0), 0)
    if (length < 450) throw new Error(`chapter "${id}" is only ${length} words`)

    return { id, number: spec.number, title: spec.title(ctx.dog.name, ctx.breed), intro: clean(written.intro), sections }
  })
}

function checkSheets(raw: RawSheets, ctx: Context): HandbookSheet[] {
  const sheets = HANDBOOK_SHEETS.flatMap((spec): HandbookSheet[] => {
    const written = raw.sheets.find((s) => s.id === spec.id)
    if (!written) return []
    const groups = (written.groups ?? [])
      .map((g) => ({ label: clean(g.label), items: cleanList(g.items).slice(0, 8) }))
      .filter((g) => g.label && g.items.length > 0)
    if (groups.length < 2) return []
    return [{ id: spec.id, title: spec.title(ctx.dog.name), note: clean(written.note), groups }]
  })
  if (sheets.length < 3) throw new Error(`only ${sheets.length} usable cheat sheets`)
  return sheets
}

// ── Pipeline ───────────────────────────────────────────────────────────────

/** Writes the whole handbook. Throws rather than return an incomplete one. */
export async function generateHandbook(submission: SubmissionRow, budgetMs: number): Promise<Handbook> {
  const deadline = Date.now() + budgetMs
  const left = () => deadline - Date.now()

  const dog = describeDog(submission)
  const profile = await getBreedProfile(submission.dog_breed)
  // The name we publish when the owner's breed is one of ours ("gsd" → "German Shepherd")
  const breed = profile?.match.exact ? String(profile.breed.name) : properName(submission.dog_breed, 'Dog')

  const reference = breedReference(profile, dog.breed)
  const program = programSummary(submission)
  const ctx: Context = {
    dog,
    breed,
    system: systemPrompt(submission, dog),
    shared: [
      `<dog>\n${dog.profileText}\n</dog>`,
      reference ? `<breed_reference>\n${reference}\n</breed_reference>` : '',
      program ? `<program>\n${program}\n</program>` : '',
    ].filter(Boolean).join('\n\n'),
  }

  const outline = checkOutline(
    await callJson<RawOutline>({
      label: 'handbook outline',
      system: ctx.system,
      prompt: outlinePrompt(ctx, reference !== null),
      schema: OUTLINE_SCHEMA,
      maxTokens: 16000,
      // Where the book is decided: what each chapter says about this dog, and the
      // figures they all share.
      effort: 'medium',
      // Leave the writing at least two minutes
      timeoutMs: Math.min(left() - 120_000, 120_000),
    }),
    profile,
  )

  /** One writing call, tried once more on its own if there is time. */
  const write = async <T>(label: string, attempt: () => Promise<T>): Promise<T> => {
    try {
      return await attempt()
    } catch (err) {
      if (left() < 80_000) throw err
      console.warn(`[handbook] ${label} failed, retrying:`, err instanceof Error ? err.message : err)
      return attempt()
    }
  }

  const [chapterGroups, sheets] = await Promise.all([
    Promise.all(CHAPTER_GROUPS.map((ids) =>
      write(`chapters ${ids.join(', ')}`, async () =>
        checkChapters(
          await callJson<RawChapters>({
            label: `handbook ${ids.join('+')}`,
            system: ctx.system,
            prompt: chaptersPrompt(ctx, outline, ids),
            schema: CHAPTERS_SCHEMA,
            maxTokens: 20000,
            // Writing out sections that are already decided
            effort: 'low',
            timeoutMs: left(),
          }),
          ctx,
          outline,
          ids,
        ),
      ),
    )),
    write('cheat sheets', async () =>
      checkSheets(
        await callJson<RawSheets>({
          label: 'handbook sheets',
          system: ctx.system,
          prompt: sheetsPrompt(ctx, outline),
          schema: SHEETS_SCHEMA,
          maxTokens: 8000,
          effort: 'low',
          timeoutMs: left(),
        }),
        ctx,
      ),
    ),
  ])

  const chapters = chapterGroups.flat().sort((a, b) => a.number - b.number)
  if (chapters.length !== HANDBOOK_CHAPTERS.length) {
    throw new Error(`handbook has ${chapters.length} chapters, expected ${HANDBOOK_CHAPTERS.length}`)
  }

  return {
    version: 1,
    title: `${dog.name === 'the dog' ? 'Your' : `${dog.name}'s`} ${breed} Handbook`,
    dogName: dog.name,
    breed,
    subtitle: outline.subtitle,
    glanceIntro: outline.glanceIntro,
    facts: outline.facts,
    traits: outline.traits,
    keyPoints: outline.keyPoints,
    chapters,
    sheets,
    generatedAt: new Date().toISOString(),
  }
}
