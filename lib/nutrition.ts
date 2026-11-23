import type { SubmissionRow } from './supabase'
import { getBreedProfile } from './breed-context'
import { callJson, clean, cleanList, describeDog, safetyRules, type Dog } from './plan-v2'
import { properName } from './plan-types'
import { listAddonRows } from './addons-store'
import { breedReference, checkBlock, programSummary } from './handbook'
import { HANDBOOK_BLOCK_KINDS, isHandbook, type Handbook, type HandbookBlock, type HandbookSection } from './handbook-types'
import { ACTIVITY_LABELS, energyAdjustment, feedingStage, parseWeightRange, portionRow, portionWeights, type FeedingStage } from './feeding'
import {
  CONCERN_CHOICES,
  CONDITION_CHOICES,
  FOOD_CHOICES,
  MEALS_CHOICES,
  NUTRITION_CHAPTERS,
  NUTRITION_SHEETS,
  TREAT_CHOICES,
  cleanNutritionProfile,
  formatAmount,
  missingAnswers,
  portionResult,
  profileWeightKg,
  profileWeightLb,
  type NutritionChapter,
  type NutritionChapterId,
  type NutritionPlan,
  type NutritionProfile,
  type NutritionSheet,
  type NutritionSheetId,
  type PortionResult,
} from './nutrition-types'

// Server-side only. Writes the nutrition plan add-on, in the two stages the plan
// and the handbook use:
//   1. Outline — one call: the feeding profile (chapter 1), the choices every
//      chapter must agree on, and the sections of the eight written chapters.
//   2. Writing — three calls side by side: two groups of four chapters, and the
//      printable pages.
//
// It is written from the owner's answers about the dog (weight, body shape, what
// it eats today), given in the training space after payment: without them the
// add-on is not generated at all (ADDONS.nutrition_plan.intake).
//
// The model never works out a calorie or a portion. lib/feeding.ts does, from
// the answers, and the prompts hand the model those figures to quote. Anything
// it writes with a calorie figure that is not one of them is rejected.

const FACT_LABELS = ['Life stage', 'Meals a day', 'Goal', 'Food to look for', 'Treat budget', 'Watch out for']

const CHAPTER_GROUPS: NutritionChapterId[][] = [
  ['how_much', 'what', 'schedule', 'treats'],
  ['foods', 'switching', 'tracking', 'special'],
]

/** What each chapter is for. The outline call turns these into sections for this dog. */
const CHAPTER_BRIEFS: Record<NutritionChapterId, (dog: Dog, numbers: Numbers) => string> = {
  how_much: (dog, n) =>
    `${dog.name}'s own figures and where they come from (weight, age, activity, body condition); ${n.result.perMeal !== null ? 'the amount per meal of the owner\'s food' : 'how the calories on the owner\'s food label become an amount per meal, with the calculator in the training space'}; the hands-on body condition check (ribs, waist from above, tuck from the side), as steps; the rule for adjusting (change by about a tenth, hold for two weeks, check again); when to update the weight in the calculator; why the bag's own feeding guide is only a starting point.`,
  what: (dog) =>
    `Starting from what ${dog.name} eats today: whether there is a reason to change it, and what to check on its label (the "complete and balanced" statement and the life stage it is for); dry, wet, fresh and raw compared fairly, including the handling risks of raw; what matters for this breed and ${dog.name}'s age; which words on a bag are marketing.`,
  schedule: (dog, n) =>
    `${n.meals} meals a day and when, around walks and the ${dog.dailyTime}-minute training session, starting from how ${dog.name} is fed now; how long to leave food down; puzzle feeders and scatter feeding as mental work for this dog in this home; water; anything about meal timing this breed needs.`,
  treats: (dog) =>
    `${dog.name}'s treat allowance and what it means in practice, given how many treats ${dog.name} gets today; taking training rewards out of the day's ration rather than adding them on top; which reward for which part of ${dog.name}'s program (ordinary food where it is easy, higher value where it is hard); low-calorie options; the ways the budget gets blown without anyone noticing.`,
  foods: (dog) =>
    `The foods that are toxic to dogs, each with why in a line; safe extras, with amounts described against ${dog.name}'s size ("a few slices"), never in grams; chews: what is safe and what breaks teeth; what to do if ${dog.name} eats something toxic.`,
  switching: () =>
    `A day-by-day schedule for changing food; what stools tell you; which upsets pass in a day and which need the vet; when a change of diet is a question for the vet (suspected allergy, a problem that keeps coming back).`,
  tracking: (dog) =>
    `${dog.name}'s goal (hold, lose slowly or gain, from the body condition the owner reported) and what progress looks like; how to weigh ${dog.name} (at home, at the vet's, at a pet store); the check every two weeks and the log; what to do when the weight moves the wrong way; the next change of life stage for this breed and when to change food for it.`,
  special: (dog) =>
    `Only what applies to ${dog.name}, two to four sections. First, every concern the owner ticked (sensitive stomach, itchy skin or suspected allergy, picky eating, eating too fast, begging or stealing) and anything in their own notes. Then, if there is room: a growing puppy's or a senior's needs; a behavior problem from the training program that food can help with or make worse (food toys when left alone, why a stressed dog refuses food, meal timing and house training). Leave out anything that does not apply.`,
}

const SHEET_BRIEFS: Record<NutritionSheetId, (dog: Dog, numbers: Numbers) => string> = {
  feeding_chart: (dog, n) =>
    `${dog.name}'s day of food on one page. One group per meal (${n.meals} a day, named for the time of day), then "Treats and training rewards" and "Water and bowls". ${n.result.perMeal !== null ? `The amount at each meal is "${formatAmount(n.result.perMeal, n.result.amountUnit)}".` : 'The amount at each meal is a blank to fill in from the calculator, like "Amount: ______".'} The treat line states the allowance.`,
  weight_log: () =>
    `Eight weeks of checks, one every two weeks. Groups: "Today", "Week 2", "Week 4", "Week 6", "Week 8". The same lines in each, with blanks: the weight, ribs easy to feel (yes / no), waist visible from above (yes / no), any change made. "Today" has the weight already filled in.`,
  shopping: () =>
    `What to have at home. Groups: "Food", "For mealtimes", "For training rewards", "Chews and extras". Kinds of thing, never brands.`,
  switch_schedule: () =>
    `Changing from one food to another. Groups: "Days 1 to 3", "Days 4 to 6", "Days 7 to 9", "Day 10 on", "Stop and call the vet if". The old-to-new proportions for each stage.`,
  unsafe_foods: (dog) =>
    `For the fridge door. Groups: "Toxic: never", "Risky: avoid", "If ${dog.name} eats one of these".`,
}

// ── The dog's own numbers ──────────────────────────────────────────────────

interface Numbers {
  profile: NutritionProfile
  stage: FeedingStage
  meals: number
  result: PortionResult
  /** Every calorie figure the text may state */
  allowedKcal: Set<number>
}

const label = <T extends string>(choices: { id: T; label: string; hint?: string }[], id: T | null) =>
  choices.find((c) => c.id === id)?.label ?? 'not given'
const kcal = (n: number) => `${n.toLocaleString('en-US')} kcal`

/** Meals a day: what suits the age, bent toward what the owner already does. */
function mealsFor(dogAge: string | null | undefined, now: NutritionProfile['mealsNow']): number {
  if (dogAge === 'puppy_under6') return 3
  return now === '3' ? 3 : 2
}

/** What the owner told us, as the prompts read it. */
function answersText(dog: Dog, n: Numbers): string {
  const p = n.profile
  const lb = profileWeightLb(p)!
  const kg = profileWeightKg(p)!
  const condition = CONDITION_CHOICES.find((c) => c.id === p.condition)
  return [
    `Weight today: ${p.weight} ${p.weightUnit} (${p.weightUnit === 'lb' ? `${kg.toFixed(1)} kg` : `${Math.round(lb)} lb`})`,
    `Sex: ${p.sex ?? 'not given'}. Neutered or spayed: ${p.neutered === 'unsure' ? 'the owner is not sure' : (p.neutered ?? 'not given')}`,
    `Body condition, as the owner judges it: ${condition ? `${condition.label.toLowerCase()} (${condition.hint!.toLowerCase()})` : 'not given'}`,
    `Activity: ${ACTIVITY_LABELS[p.activity].toLowerCase()}`,
    `Fed today: ${label(FOOD_CHOICES, p.foodType).toLowerCase()}, ${p.mealsNow === 'free' ? 'with the bowl always full' : `${label(MEALS_CHOICES, p.mealsNow).toLowerCase()} meal(s) a day`}`,
    `Calories in that food: ${p.foodKcal ? `${p.foodKcal} kcal per ${p.foodUnit}` : 'the owner did not know'}`,
    `Treats today: ${label(TREAT_CHOICES, p.treats).toLowerCase()}`,
    `Concerns the owner ticked: ${p.concerns.length ? p.concerns.map((c) => label(CONCERN_CHOICES, c).toLowerCase()).join('; ') : 'none'}`,
    `Diagnosed medical condition or prescription diet: ${p.medical ? 'YES' : 'no'}`,
    `In the owner's words: ${p.notes || '(nothing added)'}`,
  ].join('\n')
}

/** The figures the text may quote, as the prompts read them. */
function numbersText(dog: Dog, n: Numbers): string {
  const r = n.result
  const adjust = energyAdjustment(n.stage, n.profile.condition, n.profile.neutered)
  const basis = [
    `fed as a ${n.stage.label}`,
    n.stage.growing ? 'for growth, so activity does not change the amount' : `${ACTIVITY_LABELS[n.profile.activity].toLowerCase()}`,
    !n.stage.growing && n.profile.neutered === 'no' && adjust !== 1 ? 'not neutered, which raises the need a little' : '',
    !n.stage.growing && n.profile.condition === 'thin' ? 'set about a tenth above maintenance, because the owner finds the dog too thin' : '',
    !n.stage.growing && n.profile.condition === 'heavy' ? 'set about a tenth below maintenance, because the owner finds the dog a bit heavy' : '',
    !n.stage.growing && n.profile.condition === 'obese' ? 'set about 15 percent below maintenance, because the owner finds the dog very overweight' : '',
  ].filter(Boolean).join('; ')

  return [
    `Calories a day: ${kcal(r.dailyKcal)} (${basis})`,
    `From meals: ${kcal(r.mealKcal)}`,
    `Treats and training rewards, at most: ${kcal(r.treatKcal)}`,
    `Meals a day: ${n.meals}`,
    `Per meal: ${kcal(Math.round(r.mealKcal / n.meals / 10) * 10)}`,
    r.perDay !== null && r.perMeal !== null
      ? `Of the owner's food: ${formatAmount(r.perDay, r.amountUnit)} a day, ${formatAmount(r.perMeal, r.amountUnit)} per meal`
      : `Of the owner's food: not known yet, because they did not give its calories. The calculator in ${dog.name}'s training space turns the calories on the label into an amount per meal.`,
  ].join('\n')
}

/** A calorie figure in the text that is not one of ours is a made-up number: reject the text. */
function checkFigures(text: string, n: Numbers, where: string): void {
  for (const match of text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(?:kcal|kilocalories|calories)\b/gi)) {
    const value = Number(match[1].replace(/,/g, ''))
    if (!n.allowedKcal.has(value)) throw new Error(`${where} states "${match[0]}", which is not one of the plan's figures`)
  }
}

// ── Prompts ────────────────────────────────────────────────────────────────

function systemPrompt(row: SubmissionRow, dog: Dog, n: Numbers): string {
  const { rules } = safetyRules(row, dog.name)
  const { profile: p, stage } = n
  const offTarget = !stage.growing && p.condition && p.condition !== 'ideal'

  return `You are the canine nutrition author at PawCraft. You write a personalised feeding plan for one dog owner: what, how much, when, and how to fit training treats in. The owner already has a 30-day training program from us for the behavior problems they listed, and that program rewards the dog with food every day. Your plan makes that work without overfeeding.

What you know
- From the owner's first questionnaire: the dog's name, breed, age bracket, the problems they listed and what they wrote about them, their home, their experience with dogs, and the minutes a day they train.
- From the questions they have just answered for this plan: the dog's weight, sex, whether it is neutered, the shape it is in, how active it is, what it eats today and how often, how many treats it gets, the concerns they ticked, and whether there is a diagnosed condition. Use all of it: this is what makes the plan theirs. Start from what they do today and say what to keep and what to change.
- You do not know the food's brand, any allergy that has not been mentioned, or anything else that is not written below. Never assume.

Numbers
- The figures in <numbers> were worked out for this dog and are the only figures you may state for calories and for amounts of food. Quote them exactly as written. Never recompute, round, convert or split them, and never give a calorie figure for a treat, a chew or any single food: say to check its packaging.
- You may state the dog's weight as the owner gave it.
- Treats are counted inside the day's calories: up to one tenth from treats and training rewards, the rest from meals.
- These figures are a starting point. The owner checks the dog's body after two weeks and adjusts by about a tenth. Say so wherever you give an amount.${stage.growing ? `
- ${dog.name} is still growing: the amount is for growth and rises with the weight. The owner re-weighs every two weeks and updates the weight in the calculator in the training space. Never suggest feeding more to grow faster, cutting food to slim a puppy, or adding calcium or other supplements to a complete puppy food. If the owner finds the puppy too thin or too heavy, that is a question for the vet.` : ''}${offTarget ? `
- The owner judges ${dog.name} to be ${CONDITION_CHOICES.find((c) => c.id === p.condition)!.label.toLowerCase()}. The daily figure already takes that into account. Be kind and matter-of-fact about it, never blaming. ${p.condition === 'obese' ? `A very overweight dog needs a weight-loss plan from the vet: say so plainly in the profile and in the tracking chapter, and present this plan as the careful start to make before that visit.` : p.condition === 'thin' ? `A dog that is too thin needs a vet check to rule out a medical cause: say so plainly in the profile and in the tracking chapter.` : `Aim for slow loss, and a vet visit if nothing has changed after six weeks.`}` : ''}${p.medical ? `
- The owner says ${dog.name} has a diagnosed medical condition or is on a prescription diet. The vet's feeding instructions come before this plan wherever the two differ: say so in the profile and wherever food choice or amounts come up. Do not advise changing the food.` : ''}

Accuracy and safety
- Only well-established canine nutrition. When reference data from our breed database is given, it wins over your own recollection. If you are not sure of a fact, leave it out.
- No brand names, no prices, no invented statistics or study results.
- No prescription or therapeutic diets, no supplement presented as a treatment, no diagnosis. A suspected allergy, itchy skin, a chronic stomach problem or a sudden change in weight is a question for the vet: say so plainly, and give only the everyday good practice that is safe meanwhile.
- No recipes for a complete home-made diet: they are easy to get nutritionally wrong. If the owner already feeds fresh, home-cooked or raw, do not tell them to stop: tell them what makes such a diet complete and safe, and that a vet or a veterinary nutritionist should check the recipe. Ideas for toppers and treats are welcome, as extras inside the treat allowance.
- Be fair to dry, wet, fresh and raw feeding. State the handling and balance risks of raw without preaching.
- Toxic foods are stated plainly, and what to do about them is "call your vet or a pet poison line now", never a home remedy.${p.sex === 'female' && p.neutered !== 'yes' ? `\n- ${dog.name} is a female who may not be spayed: mention once, in the tracking chapter, that pregnancy and nursing change what a dog needs and are for the vet to guide.` : ''}
- If you do not recognise the breed the owner wrote, do not invent one: write the plan around the dog's age and what the owner told you.

How you write
- To the owner as "you", about the dog by name${p.sex ? ` and as "${p.sex === 'female' ? 'she' : 'he'}"` : ''}. Warm, direct and practical, like a friend who feeds dogs for a living. No filler, no hype, nothing that would read the same in a plan for any other dog.
- Concrete: what to do, when, what it looks like when it is right.
- Match the owner's experience. For a first-time owner, explain a term the first time it appears.
- Plain text only: no HTML, no markdown, no emoji. American English. Never use an em dash or en dash as punctuation: use a comma, a period or parentheses.
${rules.length ? `\nSafety rules for this dog. These override every other instruction\n${rules.map((r) => `- ${r}`).join('\n')}\n` : ''}`
}

/** What the owner's handbook already says about feeding, so the two agree. Null when they don't have it. */
function handbookFeeding(book: Handbook | null): string | null {
  const chapter = book?.chapters.find((c) => c.id === 'feeding')
  if (!book || !chapter) return null
  return [
    chapter.intro,
    ...chapter.sections.map((s) =>
      `${s.heading}: ${s.blocks.map((b) => [b.title, b.text, ...b.items].filter(Boolean).join(' ')).join(' ')}`),
  ].join('\n')
}

interface Context {
  dog: Dog
  numbers: Numbers
  system: string
  /** The blocks every prompt opens with */
  shared: string
}

function outlinePrompt(ctx: Context): string {
  const { dog } = ctx
  const chapterList = NUTRITION_CHAPTERS
    .map((c) => `- ${c.id} (Chapter ${c.number}, "${c.title(dog.name)}"): ${CHAPTER_BRIEFS[c.id](dog, ctx.numbers)}`)
    .join('\n')

  return `${ctx.shared}

Design ${dog.name}'s nutrition plan. This call plans it. The chapters are written afterwards from your outline, by writers who see only what you put in it, so every field has to be specific to this dog.

subtitle: one sentence for the cover, under the title. What this plan does for this owner.

Chapter 1 is a single "feeding profile" page, built from these fields:
- profileIntro: two or three sentences on what feeding ${dog.name} well comes down to, given the breed, the age and what the owner has just told you. Name the one or two things to change from how ${dog.name} is fed today, or say plainly that today's routine is sound.
- facts: exactly these six labels, in this order: ${FACT_LABELS.join(', ')}. Values are short (at most 9 words). "Meals a day" is a number and nothing else. "Goal" is what the plan aims for with ${dog.name}'s weight (hold it, lose slowly, gain). "Treat budget" is the tenth-of-the-day rule in a few words.
- keyPoints: exactly three. The three rules that matter most for feeding this dog, one sentence each.

keyNumbers: 6 to 10 lines, each written "Topic: value". The choices every chapter must agree on: roughly when the ${ctx.numbers.meals} meals are, how long food stays down, how long a food switch takes, how often to weigh, which reward goes with which part of the training program, what changes from today's routine, and anything else two chapters could otherwise contradict each other on. The figures in <numbers> are already shared: do not repeat them here.

chapters: one entry per chapter, with these ids, in this order:
${chapterList}
For each chapter, 3 to 5 sections ("special" has 2 to 4):
- heading: 2 to 6 words, plain and descriptive.
- brief: one or two sentences saying exactly what the section covers for ${dog.name}. Specific enough that no two sections in the plan cover the same thing.`
}

function planOutlineText(ctx: Context, outline: Outline): string {
  return [
    'Choices every chapter agrees with:',
    ...outline.keyNumbers.map((n) => `- ${n}`),
    '',
    'The whole plan:',
    `Chapter 1, "${ctx.dog.name}'s feeding profile": the profile, the key facts and the three rules.`,
    ...NUTRITION_CHAPTERS.map((c) =>
      `Chapter ${c.number}, "${c.title(ctx.dog.name)}" [${c.id}]\n${outline.chapters[c.id].map((s) => `  · ${s.heading}: ${s.brief}`).join('\n')}`),
    'Then five printable pages: feeding chart, weight log, shopping checklist, food switch schedule, unsafe foods.',
  ].join('\n')
}

function chaptersPrompt(ctx: Context, outline: Outline, ids: NutritionChapterId[]): string {
  const wanted = NUTRITION_CHAPTERS.filter((c) => ids.includes(c.id))

  return `${ctx.shared}

<plan>
${planOutlineText(ctx, outline)}
</plan>

Write these chapters in full, in this order: ${wanted.map((c) => `${c.id} (Chapter ${c.number})`).join(', ')}.

For each chapter:
- id: as given.
- intro: two sentences that open the chapter for ${ctx.dog.name}.
- sections: the outline's sections for that chapter, with the same headings, in the same order. Each section is 2 to 4 blocks and 140 to 200 words in all. A chapter is 550 to 750 words. This is a plan to act on: say what to do, why, and what it looks like when it is going right, with nothing that is only there to fill space.

A block has a kind, a title, a text and items. Fill only the fields its kind uses; leave the others empty ("" or []).
- text: one paragraph of 40 to 100 words, in text.
- list: 3 to 7 bullet points in items, each a complete, useful line of 10 to 30 words. title is an optional short label.
- steps: 3 to 6 steps in items, in the order to do them, one action each. title is an optional short label.
- facts: 3 to 6 lines in items, each written "Label: value". For things best read as a small table.
- tip: a practical tip worth setting apart. title of 2 to 6 words, text of one to three sentences.
- watch: something to keep an eye on. title of 2 to 6 words, text of one to three sentences.
- vet: when to involve the vet. title of 2 to 6 words, text of one to three sentences.

Most sections open with a text block. Use a list, steps or facts block wherever the content is a set of things rather than an explanation. Each chapter has one or two callouts (tip, watch, vet), never more than one in a section.

Stay inside each section's brief: other sections and other chapters cover the rest. When another chapter has the detail, point to it by its title instead of repeating it.`
}

function sheetsPrompt(ctx: Context, outline: Outline): string {
  const sheets = NUTRITION_SHEETS
    .map((s) => `- ${s.id} ("${s.title(ctx.dog.name)}"): ${SHEET_BRIEFS[s.id](ctx.dog, ctx.numbers)}`)
    .join('\n')

  return `${ctx.shared}

<plan>
${planOutlineText(ctx, outline)}
</plan>

Write the five printable pages that close the plan. Each one is a single printed page for the fridge or the kitchen drawer, so every line is short (at most 16 words) and can be acted on without the rest of the plan. Where a figure from <numbers> belongs, write it in; where the owner has to write something in, leave a blank like "______".

${sheets}

For each page:
- id: as given.
- note: one line under the title saying how to use the page.
- groups: the groups named above, in that order. Each has its label and 3 to 6 items.`
}

// ── Response schemas (structured outputs) ──────────────────────────────────

const str = { type: 'string' } as const
const strings = { type: 'array', items: str } as const
const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})
const list = (items: unknown) => ({ type: 'array', items })
const chapterId = { type: 'string', enum: NUTRITION_CHAPTERS.map((c) => c.id) }

const OUTLINE_SCHEMA = obj({
  subtitle: str,
  profileIntro: str,
  facts: list(obj({ label: str, value: str })),
  keyPoints: strings,
  keyNumbers: strings,
  chapters: list(obj({ id: chapterId, sections: list(obj({ heading: str, brief: str })) })),
})

const CHAPTERS_SCHEMA = obj({
  chapters: list(obj({
    id: chapterId,
    intro: str,
    sections: list(obj({
      heading: str,
      blocks: list(obj({ kind: { type: 'string', enum: HANDBOOK_BLOCK_KINDS }, title: str, text: str, items: strings })),
    })),
  })),
})

const SHEETS_SCHEMA = obj({
  sheets: list(obj({
    id: { type: 'string', enum: NUTRITION_SHEETS.map((s) => s.id) },
    note: str,
    groups: list(obj({ label: str, items: strings })),
  })),
})

interface RawOutline {
  subtitle: string
  profileIntro: string
  facts: { label: string; value: string }[]
  keyPoints: string[]
  keyNumbers: string[]
  chapters: { id: string; sections: { heading: string; brief: string }[] }[]
}

interface Outline {
  subtitle: string
  profileIntro: string
  facts: { label: string; value: string }[]
  keyPoints: string[]
  keyNumbers: string[]
  chapters: Record<NutritionChapterId, { heading: string; brief: string }[]>
}

interface RawChapters {
  chapters: { id: string; intro: string; sections: { heading: string; blocks: HandbookBlock[] }[] }[]
}

interface RawSheets {
  sheets: { id: string; note: string; groups: { label: string; items: string[] }[] }[]
}

// ── Checks ─────────────────────────────────────────────────────────────────

const words = (text: string) => text.split(/\s+/).filter(Boolean).length
const sameLabel = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function checkOutline(raw: RawOutline, n: Numbers): Outline {
  const facts = FACT_LABELS
    .map((label) => ({
      label,
      // The page must show the number the amounts were divided by
      value: label === 'Meals a day' ? String(n.meals) : clean(raw.facts.find((f) => sameLabel(f.label, label))?.value),
    }))
    .filter((f) => f.value)
  if (facts.length < 4) throw new Error('outline: the feeding profile is too thin')

  const keyPoints = cleanList(raw.keyPoints).slice(0, 3)
  if (keyPoints.length < 2) throw new Error('outline: key points are missing')

  const keyNumbers = cleanList(raw.keyNumbers).slice(0, 12)
  if (keyNumbers.length < 3) throw new Error('outline: the shared choices are missing')

  const chapters = {} as Outline['chapters']
  for (const { id } of NUTRITION_CHAPTERS) {
    const sections = (raw.chapters.find((c) => c.id === id)?.sections ?? [])
      .map((s) => ({ heading: clean(s.heading), brief: clean(s.brief) }))
      .filter((s) => s.heading && s.brief)
      .slice(0, 5)
    if (sections.length < 2) throw new Error(`outline: chapter "${id}" has ${sections.length} sections`)
    chapters[id] = sections
  }

  const outline = { subtitle: clean(raw.subtitle), profileIntro: clean(raw.profileIntro), facts, keyPoints, keyNumbers, chapters }
  checkFigures([outline.subtitle, outline.profileIntro, ...keyPoints, ...keyNumbers, ...facts.map((f) => f.value)].join(' '), n, 'outline')
  return outline
}

function checkChapters(raw: RawChapters, ctx: Context, outline: Outline, ids: NutritionChapterId[]): NutritionChapter[] {
  return ids.map((id) => {
    const spec = NUTRITION_CHAPTERS.find((c) => c.id === id)!
    const written = raw.chapters.find((c) => c.id === id)
    if (!written) throw new Error(`chapter "${id}" is missing`)

    const sections: HandbookSection[] = written.sections
      .map((section, i) => ({
        heading: outline.chapters[id][i]?.heading ?? clean(section.heading),
        blocks: (section.blocks ?? []).map(checkBlock).filter((b): b is HandbookBlock => b !== null),
      }))
      .filter((section) => section.heading && section.blocks.length > 0)

    if (sections.length < 2) throw new Error(`chapter "${id}" has ${sections.length} usable sections`)

    const length = sections
      .flatMap((s) => s.blocks)
      .reduce((total, b) => total + words(b.text) + b.items.reduce((n, item) => n + words(item), 0), 0)
    if (length < 250) throw new Error(`chapter "${id}" is only ${length} words`)

    const intro = clean(written.intro)
    checkFigures(
      [intro, ...sections.flatMap((s) => s.blocks.flatMap((b) => [b.title, b.text, ...b.items]))].join(' '),
      ctx.numbers,
      `chapter "${id}"`,
    )

    return { id, number: spec.number, title: spec.title(ctx.dog.name), intro, sections }
  })
}

function checkSheets(raw: RawSheets, ctx: Context): NutritionSheet[] {
  const sheets = NUTRITION_SHEETS.flatMap((spec): NutritionSheet[] => {
    const written = raw.sheets.find((s) => s.id === spec.id)
    if (!written) return []
    const groups = (written.groups ?? [])
      .map((g) => ({ label: clean(g.label), items: cleanList(g.items).slice(0, 8) }))
      .filter((g) => g.label && g.items.length > 0)
    if (groups.length < 2) return []
    return [{ id: spec.id, title: spec.title(ctx.dog.name), note: clean(written.note), groups }]
  })
  if (sheets.length < 3) throw new Error(`only ${sheets.length} usable printable pages`)
  checkFigures(sheets.flatMap((s) => [s.note, ...s.groups.flatMap((g) => g.items)]).join(' '), ctx.numbers, 'printable pages')
  return sheets
}

// ── Pipeline ───────────────────────────────────────────────────────────────

/**
 * Writes the nutrition plan for a paid add-on: loads the owner's answers (saved
 * with the add-on when they submitted them) and their handbook, if they have it.
 */
export async function generateNutritionPlan(submission: SubmissionRow, budgetMs: number): Promise<NutritionPlan> {
  const owned = await listAddonRows(submission.session_id, true)
  const handbookRow = owned?.find((r) => r.addon_id === 'breed_handbook' && r.status === 'ready')
  return writeNutritionPlan(
    submission,
    owned?.find((r) => r.addon_id === 'nutrition_plan')?.settings,
    handbookRow && isHandbook(handbookRow.content) ? handbookRow.content : null,
    budgetMs,
  )
}

/**
 * Writes the whole plan from the order, the owner's answers and (when they own
 * it) the handbook this plan must agree with. Throws rather than return an
 * incomplete one.
 */
export async function writeNutritionPlan(
  submission: SubmissionRow,
  answers: unknown,
  handbook: Handbook | null,
  budgetMs: number,
): Promise<NutritionPlan> {
  const deadline = Date.now() + budgetMs
  const left = () => deadline - Date.now()

  const profile = cleanNutritionProfile(answers)
  const missing = missingAnswers(profile)
  // Never reached through the app: the add-on only leaves 'awaiting_input' with complete answers
  if (missing.length > 0) throw new Error(`nutrition plan: the owner's answers are missing (${missing.join(', ')})`)

  const dog = describeDog(submission)
  const stage = feedingStage(submission.dog_age)
  const meals = mealsFor(submission.dog_age, profile.mealsNow)
  const result = portionResult(profile, { stageFactor: stage.factor, growing: stage.growing, mealsPerDay: meals })
  if (!result) throw new Error('nutrition plan: no figures could be worked out from the weight given')

  const numbers: Numbers = {
    profile,
    stage,
    meals,
    result,
    allowedKcal: new Set([result.dailyKcal, result.mealKcal, result.treatKcal, Math.round(result.mealKcal / meals / 10) * 10]),
  }

  const breedProfile = await getBreedProfile(submission.dog_breed)
  const breed = breedProfile?.match.exact ? String(breedProfile.breed.name) : properName(submission.dog_breed, '')

  const feedingChapter = handbookFeeding(handbook)

  const reference = breedReference(breedProfile, dog.breed)
  const program = programSummary(submission)
  const ctx: Context = {
    dog,
    numbers,
    system: systemPrompt(submission, dog, numbers),
    shared: [
      `<dog>\n${dog.profileText}\n</dog>`,
      `<feeding_answers>\n${answersText(dog, numbers)}\n</feeding_answers>`,
      `<numbers>\n${numbersText(dog, numbers)}\n</numbers>`,
      reference ? `<breed_reference>\n${reference}\n</breed_reference>` : '',
      program ? `<program>\n${program}\n</program>` : '',
      feedingChapter
        ? `<handbook_feeding_chapter>\nThe owner also has our breed handbook. Its Feeding chapter says this. It was written before we knew the dog's weight and food: agree with it wherever it still holds, and go into the practice it leaves out instead of repeating it.\n\n${feedingChapter}\n</handbook_feeding_chapter>`
        : '',
    ].filter(Boolean).join('\n\n'),
  }

  const outline = checkOutline(
    await callJson<RawOutline>({
      label: 'nutrition outline',
      system: ctx.system,
      prompt: outlinePrompt(ctx),
      schema: OUTLINE_SCHEMA,
      maxTokens: 12000,
      effort: 'medium',
      // Leave the writing at least a minute and a half
      timeoutMs: Math.min(left() - 90_000, 100_000),
    }),
    numbers,
  )

  /** One writing call, tried once more on its own if there is time. */
  const write = async <T>(label: string, attempt: () => Promise<T>): Promise<T> => {
    try {
      return await attempt()
    } catch (err) {
      if (left() < 70_000) throw err
      console.warn(`[nutrition] ${label} failed, retrying:`, err instanceof Error ? err.message : err)
      return attempt()
    }
  }

  const [chapterGroups, sheets] = await Promise.all([
    Promise.all(CHAPTER_GROUPS.map((ids) =>
      write(`chapters ${ids.join(', ')}`, async () =>
        checkChapters(
          await callJson<RawChapters>({
            label: `nutrition ${ids.join('+')}`,
            system: ctx.system,
            prompt: chaptersPrompt(ctx, outline, ids),
            schema: CHAPTERS_SCHEMA,
            maxTokens: 16000,
            effort: 'low',
            timeoutMs: left(),
          }),
          ctx,
          outline,
          ids,
        ),
      ),
    )),
    write('printable pages', async () =>
      checkSheets(
        await callJson<RawSheets>({
          label: 'nutrition sheets',
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
  if (chapters.length !== NUTRITION_CHAPTERS.length) {
    throw new Error(`nutrition plan has ${chapters.length} chapters, expected ${NUTRITION_CHAPTERS.length}`)
  }

  // The table around the dog's own figure: what the day looks like a few pounds
  // lighter or heavier. Our breed data gives the weights, our formula the calories.
  const adultRange = parseWeightRange(breedProfile ? String(breedProfile.breed.weight_range ?? '') : null)
  const adjust = energyAdjustment(stage, profile.condition, profile.neutered)
  const portions = portionWeights(adultRange, stage.growing).map((lb) => portionRow(lb, stage, adjust))
  const portionsNote = !adultRange
    ? `It shows the same sums for dogs from small to giant, so you can see how the figure moves as ${dog.name}'s weight changes.`
    : stage.growing
      ? `It runs from a young puppy up to the ${breedProfile!.breed.name}'s usual adult weight of ${adultRange[0]} to ${adultRange[1]} lb, so you can see where ${dog.name}'s amount is heading.`
      : `It covers the ${breedProfile!.breed.name}'s usual adult weight of ${adultRange[0]} to ${adultRange[1]} lb, and a little either side, so you can see how the figure moves if ${dog.name}'s weight changes.`

  return {
    version: 1,
    addon: 'nutrition_plan',
    title: `${dog.name === 'the dog' ? 'Your dog' : dog.name}'s Nutrition Plan`,
    dogName: dog.name,
    breed,
    subtitle: outline.subtitle,
    profileIntro: outline.profileIntro,
    facts: outline.facts,
    keyPoints: outline.keyPoints,
    mealsPerDay: meals,
    stageFactor: stage.factor,
    stageLabel: stage.label,
    growing: stage.growing,
    portions,
    portionsNote,
    chapters,
    sheets,
    generatedAt: new Date().toISOString(),
  }
}
