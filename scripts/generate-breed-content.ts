// scripts/generate-breed-content.ts
//
// Generates full content for the breed hub tabs:
//   - training_full_content  → Training tab
//   - daily_life_content     → Daily Life tab
//   - overview_content       → Overview tab
//
// Run AFTER seed-breeds-problems.sql has been executed.
// Safe to re-run — skips breeds that already have content.
//
// Usage:
//   npx ts-node scripts/generate-breed-content.ts
//
// Optional: run a single breed for testing:
//   BREED_SLUG=golden-retriever npx ts-node scripts/generate-breed-content.ts

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service key, not anon key
)

// ─── Rate limiting ────────────────────────────────────────────────────────────
const DELAY_MS = 1200 // ~50 requests/min, well within Anthropic limits
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Types ────────────────────────────────────────────────────────────────────
interface Breed {
  id: string
  slug: string
  name: string
  group_name: string
  weight_range: string
  height_range: string
  lifespan: string
  origin: string
  purpose: string
  description: string
  tags: string[]
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
  // content fields — null means not yet generated
  training_full_content: string | null
  daily_life_content: string | null
  overview_content: string | null
}

interface GeneratedBreedContent {
  training_full_content: string
  daily_life_content: string
  overview_content: string
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
function buildPrompt(breed: Breed): string {
  return `You are a professional dog trainer and behaviorist writing content for PawPlan, a dog training website.

Generate content for the following breed's hub page. The content goes into three tabs: Overview, Training, and Daily Life.

BREED DATA:
Name: ${breed.name}
Group: ${breed.group_name}
Origin: ${breed.origin}
Purpose: ${breed.purpose}
Weight: ${breed.weight_range}
Lifespan: ${breed.lifespan}
Description: ${breed.description}

SCORES (0–100):
- Trainability: ${breed.score_trainability}
- Energy: ${breed.score_energy}
- Beginner-friendly: ${breed.score_beginner_friendly}
- Sociability: ${breed.score_sociability}
- Independence: ${breed.score_independence}

TEMPERAMENT TRAITS (0–100):
- Affectionate: ${breed.trait_affectionate}
- Playfulness: ${breed.trait_playfulness}
- Patience: ${breed.trait_patience}
- Prey drive: ${breed.trait_prey_drive}
- Guarding instinct: ${breed.trait_guarding_instinct}

TRAINING DRIVES (0–100):
- Food motivation: ${breed.drive_food}
- Praise motivation: ${breed.drive_praise}
- Play motivation: ${breed.drive_play}
- Focus outdoors: ${breed.drive_focus_outdoors}
- Distraction threshold: ${breed.drive_distraction_threshold}

DAILY LIFE:
- Daily exercise: ${breed.daily_exercise_minutes} minutes
- Max alone hours: ${breed.max_alone_hours}
- Apartment suitable: ${breed.apartment_suitable} (${breed.apartment_note})
- Good with kids: ${breed.good_with_kids}
- Good with dogs: ${breed.good_with_dogs}
- Good with cats: ${breed.good_with_cats}

EXISTING TRAINING NOTE: ${breed.training_overview}
ADOLESCENCE WARNING: ${breed.adolescence_warning}

INSTRUCTIONS:
- Write specifically about THIS breed based on their history, drives, and scores
- Do NOT give training protocols or step-by-step fixes — that is the paid product
- Diagnose, explain, and frame the breed's characteristics — but don't prescribe solutions
- Tone: knowledgeable, direct, no fluff. Not chatty. Not a listicle.
- Each section should feel like it was written by a trainer who knows this breed deeply
- Each field should be HTML-ready prose (use <p>, <h3>, <strong> tags only — no divs, no classes)

Return ONLY valid JSON with exactly these three fields. No preamble, no markdown fences:

{
  "overview_content": "<p>...</p><p>...</p>",
  "training_full_content": "<p>...</p><h3>...</h3><p>...</p>",
  "daily_life_content": "<p>...</p><h3>...</h3><p>...</p>"
}

FIELD SPECS:

overview_content (300–400 words):
- 2–3 paragraphs covering: breed character and what makes them unique, what most new owners get wrong about this breed, and what the scores above actually mean in practice
- No subheadings needed — flowing prose

training_full_content (400–550 words):
- Open with what drives this breed in training (food/praise/play) and what works
- H3: "What works for [breed name]" — 2–3 specific training principles grounded in their breed history and drives
- H3: "What doesn't work" — what approaches backfire and why, specific to this breed
- H3: "[Breed] adolescence" — expand on the adolescence warning above with breed-specific detail
- Close with a bridging sentence toward getting a personalized plan (don't mention PawPlan by name)

daily_life_content (350–450 words):
- Open with what a realistic day looks like with this breed (exercise, stimulation, downtime)
- H3: "Exercise needs" — specific to this breed's energy score and purpose
- H3: "Mental stimulation" — what kind of mental work suits this breed specifically
- H3: "Living situation" — apartment notes, space requirements, best home environment
- Close with what happens when their needs aren't met — behaviorally specific to the breed`
}

// ─── Generator ────────────────────────────────────────────────────────────────
async function generateBreedContent(breed: Breed): Promise<GeneratedBreedContent> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildPrompt(breed),
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip markdown fences if model adds them despite instructions
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const parsed: GeneratedBreedContent = JSON.parse(clean)

  // Basic validation
  if (!parsed.overview_content || !parsed.training_full_content || !parsed.daily_life_content) {
    throw new Error(`Missing fields in response for ${breed.name}`)
  }

  return parsed
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const targetSlug = process.env.BREED_SLUG ?? null

  console.log('─'.repeat(60))
  console.log('PawPlan — Breed Content Generator')
  console.log('─'.repeat(60))

  // Fetch breeds — either one specific breed or all that are missing content
  let query = supabase
    .from('breeds')
    .select('*')
    .order('name')

  if (targetSlug) {
    query = query.eq('slug', targetSlug)
    console.log(`Mode: single breed → ${targetSlug}\n`)
  } else {
    // Only fetch breeds missing at least one content field
    query = query.or(
      'training_full_content.is.null,daily_life_content.is.null,overview_content.is.null'
    )
    console.log('Mode: all breeds missing content\n')
  }

  const { data: breeds, error } = await query

  if (error) {
    console.error('Supabase fetch error:', error)
    process.exit(1)
  }

  if (!breeds || breeds.length === 0) {
    console.log('✓ All breeds already have content. Nothing to generate.')
    process.exit(0)
  }

  console.log(`Breeds to process: ${breeds.length}`)
  console.log(`Estimated time: ~${Math.ceil((breeds.length * DELAY_MS) / 60000)} minutes\n`)

  let successCount = 0
  let errorCount = 0
  const errors: { breed: string; error: string }[] = []

  for (let i = 0; i < breeds.length; i++) {
    const breed = breeds[i] as Breed
    const progress = `[${i + 1}/${breeds.length}]`

    // Skip if all three fields already exist (re-run safety)
    if (breed.training_full_content && breed.daily_life_content && breed.overview_content) {
      console.log(`${progress} ⏭  Skipping ${breed.name} (already complete)`)
      continue
    }

    process.stdout.write(`${progress} Generating ${breed.name}...`)

    try {
      const content = await generateBreedContent(breed)

      const { error: updateError } = await supabase
        .from('breeds')
        .update({
          overview_content: content.overview_content,
          training_full_content: content.training_full_content,
          daily_life_content: content.daily_life_content,
        })
        .eq('id', breed.id)

      if (updateError) throw new Error(updateError.message)

      successCount++
      console.log(` ✓`)
    } catch (err) {
      errorCount++
      const message = err instanceof Error ? err.message : String(err)
      console.log(` ✗ ${message}`)
      errors.push({ breed: breed.name, error: message })
    }

    // Rate limit between requests
    if (i < breeds.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(60))
  console.log(`Done. ✓ ${successCount} generated   ✗ ${errorCount} failed`)

  if (errors.length > 0) {
    console.log('\nFailed breeds:')
    errors.forEach(e => console.log(`  - ${e.breed}: ${e.error}`))
    console.log('\nRe-run the script to retry failed breeds.')
  }

  console.log('─'.repeat(60))
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
