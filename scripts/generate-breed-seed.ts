// scripts/generate-breed-seed.ts
//
// Generates a complete breeds table row for any breed via Claude API
// and inserts it directly into Supabase.
//
// After insertion, run the two content scripts to complete the breed:
//   1. generate-breed-content.ts   → fills hub tab content
//   2. generate-breed-problems.ts  → fills all 15 breed×problem pages
//
// Usage:
//   BREED_NAME="Great Pyrenees" npx ts-node scripts/generate-breed-seed.ts
//
// Multiple breeds at once:
//   BREED_NAME="Great Pyrenees,Leonberger,Bouvier des Flandres" npx ts-node scripts/generate-breed-seed.ts
//
// Dry run (generates JSON but does not insert):
//   DRY_RUN=true BREED_NAME="Great Pyrenees" npx ts-node scripts/generate-breed-seed.ts

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const DELAY_MS = 1200
const DRY_RUN = process.env.DRY_RUN === 'true'
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Types ────────────────────────────────────────────────────────────────────

interface BreedSeedRow {
  slug: string
  name: string
  group_name: string
  weight_range: string
  height_range: string
  lifespan: string
  origin: string
  purpose: string
  emoji: string
  description: string
  tags: string[]

  score_overall: number
  score_trainability: number
  score_energy: number
  score_beginner_friendly: number
  score_sociability: number
  score_independence: number

  trait_affectionate: number
  trait_playfulness: number
  trait_patience: number
  trait_prey_drive: number
  trait_guarding_instinct: number

  drive_food: number
  drive_praise: number
  drive_play: number
  drive_focus_outdoors: number
  drive_distraction_threshold: number

  daily_exercise_minutes: number
  max_alone_hours: number
  apartment_suitable: boolean
  apartment_note: string

  good_with_kids: string
  good_with_dogs: string
  good_with_cats: string

  training_overview: string
  adolescence_warning: string

  meta_title: string
  meta_description: string
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(breedName: string): string {
  return `You are a professional dog trainer and canine behaviorist with deep knowledge of breed history, drives, and temperament.

Generate a complete data record for the following dog breed to be stored in a dog training website database:

Breed: ${breedName}

Return ONLY valid JSON with exactly these fields. No preamble, no markdown fences, no extra fields:

{
  "slug": "<kebab-case breed name, e.g. great-pyrenees>",
  "name": "<official breed name>",
  "group_name": "<AKC or FCI group, e.g. Working Group, Herding Group, Toy Group, Sporting Group, Hound Group, Terrier Group, Non-Sporting Group, Mixed / Designer>",
  "weight_range": "<e.g. 100–120 lbs>",
  "height_range": "<e.g. 25–32 in>",
  "lifespan": "<e.g. 10–12 yrs>",
  "origin": "<Country, approximate era, e.g. France, 1800s>",
  "purpose": "<original working purpose in 3–6 words>",
  "emoji": "<single most fitting emoji for this breed>",
  "description": "<2 sentences: what makes this breed unique and what most owners underestimate about them>",
  "tags": ["<3–5 short descriptive tags that capture the breed's key characteristics for a dog owner>"],

  "score_overall": <integer 0–100, weighted average of all scores>,
  "score_trainability": <integer 0–100, how easily this breed learns and responds to training>,
  "score_energy": <integer 0–100, daily energy and exercise demands>,
  "score_beginner_friendly": <integer 0–100, how suitable for first-time dog owners>,
  "score_sociability": <integer 0–100, friendliness toward strangers and other animals>,
  "score_independence": <integer 0–100, how independently minded — higher = more independent>,

  "trait_affectionate": <integer 0–100>,
  "trait_playfulness": <integer 0–100>,
  "trait_patience": <integer 0–100>,
  "trait_prey_drive": <integer 0–100>,
  "trait_guarding_instinct": <integer 0–100>,

  "drive_food": <integer 0–100, food motivation in training>,
  "drive_praise": <integer 0–100, praise and affection motivation>,
  "drive_play": <integer 0–100, toy and play motivation>,
  "drive_focus_outdoors": <integer 0–100, ability to focus on handler in outdoor environments>,
  "drive_distraction_threshold": <integer 0–100, ability to ignore environmental distractions — higher = more distractible>,

  "daily_exercise_minutes": <integer, realistic minimum daily exercise in minutes>,
  "max_alone_hours": <integer, maximum hours this breed can reasonably be left alone>,
  "apartment_suitable": <boolean, true only if genuinely manageable in an apartment>,
  "apartment_note": "<one sentence qualifier — what makes it work or not work>",

  "good_with_kids": "<one of: Excellent | Good | Good with supervision | Good with older children | Caution required | Not recommended>",
  "good_with_dogs": "<one of: Excellent | Very good | Good | Good with socialisation | Variable | Low — aggression risk | Not recommended>",
  "good_with_cats": "<one of: Excellent | Good | Good with intro | Moderate | Requires careful management | High risk | Not recommended>",

  "training_overview": "<2–3 sentences: what drives this breed in training, what approach works best, and what the core challenge is — specific to their breed history and drives>",
  "adolescence_warning": "<1–2 sentences: what specifically happens during adolescence in this breed, at what age range, and what it requires from the owner>",

  "meta_title": "<SEO title: [Breed Name] Training Guide — PawPlan>",
  "meta_description": "<SEO meta description, max 155 characters, covering what the page contains>"
}

SCORING GUIDELINES — be accurate, not generous:
- score_trainability: Border Collie = 98, Golden Retriever = 92, Labrador = 90, Beagle = 55, Basenji = 38, Tibetan Mastiff = 35
- score_energy: Belgian Malinois = 99, Border Collie = 99, Husky = 98, French Bulldog = 45, Basset Hound = 30
- score_beginner_friendly: Golden Retriever = 88, Labrador = 85, GSD = 35, Rottweiler = 30, Malinois = 5
- score_independence: Golden = 35, Border Collie = 60, Husky = 85, Basenji = 88, Tibetan Mastiff = 85
- score_sociability: Labrador = 92, Golden = 95, Chow Chow = 40, Akita = 38

Be honest about difficulty. Do not inflate beginner-friendliness scores. A breed that regularly ends up in rescue due to owner inexperience should have a beginner score below 40.`
}

// ─── Generator ────────────────────────────────────────────────────────────────

async function generateBreedSeed(breedName: string): Promise<BreedSeedRow> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: buildPrompt(breedName),
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const parsed: BreedSeedRow = JSON.parse(clean)

  // Validate required fields
  const required: (keyof BreedSeedRow)[] = [
    'slug', 'name', 'group_name', 'score_trainability', 'score_energy',
    'score_beginner_friendly', 'training_overview', 'adolescence_warning',
    'meta_title', 'meta_description',
  ]

  for (const field of required) {
    if (parsed[field] === undefined || parsed[field] === null || parsed[field] === '') {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate score ranges
  const scoreFields: (keyof BreedSeedRow)[] = [
    'score_overall', 'score_trainability', 'score_energy',
    'score_beginner_friendly', 'score_sociability', 'score_independence',
    'trait_affectionate', 'trait_playfulness', 'trait_patience',
    'trait_prey_drive', 'trait_guarding_instinct',
    'drive_food', 'drive_praise', 'drive_play',
    'drive_focus_outdoors', 'drive_distraction_threshold',
  ]

  for (const field of scoreFields) {
    const val = parsed[field] as number
    if (typeof val !== 'number' || val < 0 || val > 100) {
      throw new Error(`Score out of range (0–100) for field: ${field} = ${val}`)
    }
  }

  return parsed
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const input = process.env.BREED_NAME

  if (!input) {
    console.error('Error: BREED_NAME environment variable is required.')
    console.error('Usage: BREED_NAME="Great Pyrenees" npx ts-node scripts/generate-breed-seed.ts')
    console.error('Multiple: BREED_NAME="Great Pyrenees,Leonberger" npx ts-node scripts/generate-breed-seed.ts')
    process.exit(1)
  }

  const breedNames = input
    .split(',')
    .map(b => b.trim())
    .filter(Boolean)

  console.log('─'.repeat(60))
  console.log('PawPlan — Breed Seed Generator')
  if (DRY_RUN) console.log('MODE: DRY RUN — no database writes')
  console.log('─'.repeat(60))
  console.log(`Breeds to generate: ${breedNames.join(', ')}\n`)

  const results: { breed: string; slug: string; status: 'success' | 'skipped' | 'error'; error?: string }[] = []

  for (let i = 0; i < breedNames.length; i++) {
    const breedName = breedNames[i]
    const progress = `[${i + 1}/${breedNames.length}]`

    // Check if slug already exists (approximate — will be confirmed after generation)
    const approximateSlug = breedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    if (!DRY_RUN) {
      const { data: existing } = await supabase
        .from('breeds')
        .select('id, slug')
        .eq('slug', approximateSlug)
        .maybeSingle()

      if (existing) {
        console.log(`${progress} ⏭  Skipping "${breedName}" — slug "${approximateSlug}" already exists`)
        results.push({ breed: breedName, slug: approximateSlug, status: 'skipped' })
        continue
      }
    }

    process.stdout.write(`${progress} Generating "${breedName}"...`)

    try {
      const seedRow = await generateBreedSeed(breedName)

      if (DRY_RUN) {
        console.log(` ✓ (dry run)`)
        console.log('\nGenerated data:')
        console.log(JSON.stringify(seedRow, null, 2))
        results.push({ breed: breedName, slug: seedRow.slug, status: 'success' })
      } else {
        // Check again with the actual generated slug (may differ from approximate)
        const { data: existingSlug } = await supabase
          .from('breeds')
          .select('id')
          .eq('slug', seedRow.slug)
          .maybeSingle()

        if (existingSlug) {
          console.log(` ⏭  Skipping — slug "${seedRow.slug}" already exists`)
          results.push({ breed: breedName, slug: seedRow.slug, status: 'skipped' })
        } else {
          const { error: insertError } = await supabase
            .from('breeds')
            .insert(seedRow)

          if (insertError) throw new Error(insertError.message)

          console.log(` ✓  (slug: ${seedRow.slug})`)
          results.push({ breed: breedName, slug: seedRow.slug, status: 'success' })
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.log(` ✗  ${message}`)
      results.push({ breed: breedName, slug: approximateSlug, status: 'error', error: message })
    }

    if (i < breedNames.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  const succeeded = results.filter(r => r.status === 'success')
  const skipped = results.filter(r => r.status === 'skipped')
  const failed = results.filter(r => r.status === 'error')

  console.log('\n' + '─'.repeat(60))
  console.log(`Done.  ✓ ${succeeded.length} generated   ⏭  ${skipped.length} skipped   ✗ ${failed.length} failed`)

  if (succeeded.length > 0 && !DRY_RUN) {
    console.log('\nNext steps for each new breed:')
    console.log('  1. Generate hub content (Overview / Training / Daily Life tabs):')
    succeeded.forEach(r => {
      console.log(`       BREED_SLUG=${r.slug} npx ts-node scripts/generate-breed-content.ts`)
    })
    console.log('\n  2. Generate all breed×problem pages:')
    console.log('       npx ts-node scripts/generate-breed-problems.ts')
    console.log('     (script skips existing records — safe to run for all breeds)')
    console.log('\n  3. Trigger a Vercel redeploy to pick up new static routes.')
  }

  if (failed.length > 0) {
    console.log('\nFailed breeds:')
    failed.forEach(r => console.log(`  - ${r.breed}: ${r.error}`))
    console.log('\nRe-run with the same BREED_NAME to retry.')
  }

  console.log('─'.repeat(60))
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
