/**
 * Batch-generates breed × problem content via the Anthropic API and inserts
 * it into Supabase. Skips rows that already exist.
 *
 * Usage:
 *   npm run generate:breed-problems
 *
 * Optional filters (run a targeted subset):
 *   npm run generate:breed-problems -- --breed "Golden Retriever"
 *   npm run generate:breed-problems -- --problem "Leash Pulling"
 *   npm run generate:breed-problems -- --breed "Beagle" --problem "Recall"
 *
 * Dry-run (preview what would be generated, no API calls):
 *   npm run generate:breed-problems -- --dry-run
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-6'
const RATE_LIMIT_MS = 1200  // ~50 req/min, safely below API limits
const MAX_RETRIES = 3

// ── Clients ───────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────

interface BreedProblemPayload {
  frequency: 'very-common' | 'common' | 'occasional' | 'rare'
  difficulty: number
  timeline_weeks_min: number
  timeline_weeks_max: number
  why_this_breed: string
  makes_it_worse: string
  what_fix_requires: string[]
  common_mistakes: Array<{ title: string; description: string }>
  age_risk_note: string
  meta_title: string
  meta_description: string
}

// ── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Strip markdown code fences the model sometimes wraps JSON in. */
function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : raw.trim()
}

function parseCli() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : undefined
  }
  return {
    breedFilter: get('--breed')?.toLowerCase(),
    problemFilter: get('--problem')?.toLowerCase(),
    dryRun: args.includes('--dry-run'),
  }
}

function eta(done: number, total: number, startMs: number): string {
  if (done === 0) return '—'
  const elapsed = Date.now() - startMs
  const msPerItem = elapsed / done
  const remaining = Math.round(((total - done) * msPerItem) / 1000)
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return m > 0 ? `~${m}m ${s}s` : `~${s}s`
}

// ── Core generation ───────────────────────────────────────────────────────

async function generateBreedProblem(
  breedName: string,
  problemName: string
): Promise<BreedProblemPayload> {
  const prompt = `You are a professional dog trainer writing content for a dog training website.

Generate a JSON object for the following breed × problem combination:
Breed: ${breedName}
Problem: ${problemName}

Return ONLY valid JSON with exactly these fields:
{
  "frequency": "very-common" | "common" | "occasional" | "rare",
  "difficulty": <integer 1-10>,
  "timeline_weeks_min": <integer>,
  "timeline_weeks_max": <integer>,
  "why_this_breed": "<2-3 sentences explaining why THIS specific breed has this problem based on their breed history and drives>",
  "makes_it_worse": "<2 sentences on what owners typically do that makes this worse>",
  "what_fix_requires": ["<item 1>", "<item 2>", "<item 3>", "<item 4>"],
  "common_mistakes": [
    {"title": "<mistake name>", "description": "<1-2 sentence explanation>"},
    {"title": "<mistake name>", "description": "<1-2 sentence explanation>"},
    {"title": "<mistake name>", "description": "<1-2 sentence explanation>"}
  ],
  "age_risk_note": "<short note on when this peaks>",
  "meta_title": "Why ${breedName}s [verb] [problem]",
  "meta_description": "<155 char max SEO description>"
}

Be specific to the breed's history and drives. Do not give generic advice. Do not include training protocols or step-by-step fixes — only explain the problem and its causes.`

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })

      const raw = response.content[0].type === 'text' ? response.content[0].text : ''
      const json = extractJson(raw)
      const parsed = JSON.parse(json) as BreedProblemPayload

      // Basic validation
      if (!parsed.frequency || !parsed.why_this_breed || !Array.isArray(parsed.common_mistakes)) {
        throw new Error('Response missing required fields')
      }

      return parsed
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES) {
        console.warn(`    ↻ Attempt ${attempt} failed, retrying in 3s… (${(err as Error).message})`)
        await sleep(3000)
      }
    }
  }

  throw lastError
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const { breedFilter, problemFilter, dryRun } = parseCli()

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌  Missing ANTHROPIC_API_KEY')
    process.exit(1)
  }

  console.log(`\n🐾  PawCraft — breed × problem content generator`)
  console.log(`   Model      : ${MODEL}`)
  console.log(`   Dry run    : ${dryRun ? 'YES (no API calls, no writes)' : 'no'}`)
  if (breedFilter) console.log(`   Breed filter  : "${breedFilter}"`)
  if (problemFilter) console.log(`   Problem filter: "${problemFilter}"`)
  console.log()

  // Fetch all breeds and problems from DB
  const { data: breeds, error: bErr } = await supabase
    .from('breeds')
    .select('id, slug, name')
    .order('name')
  const { data: problems, error: pErr } = await supabase
    .from('problems')
    .select('id, slug, name')
    .order('name')

  if (bErr || pErr || !breeds || !problems) {
    console.error('❌  Failed to fetch breeds/problems from Supabase:', bErr ?? pErr)
    process.exit(1)
  }

  const filteredBreeds = breedFilter
    ? breeds.filter((b) => b.name.toLowerCase().includes(breedFilter))
    : breeds

  const filteredProblems = problemFilter
    ? problems.filter((p) => p.name.toLowerCase().includes(problemFilter))
    : problems

  const totalPairs = filteredBreeds.length * filteredProblems.length
  console.log(`📋  ${filteredBreeds.length} breeds × ${filteredProblems.length} problems = ${totalPairs} possible pairs`)

  // Fetch existing breed_problems to avoid unnecessary skips (one query up front)
  const { data: existing } = await supabase
    .from('breed_problems')
    .select('breed_id, problem_id')

  const existingSet = new Set(
    (existing ?? []).map((r: { breed_id: string; problem_id: string }) => `${r.breed_id}::${r.problem_id}`)
  )

  const toGenerate = filteredBreeds.flatMap((breed) =>
    filteredProblems
      .filter((problem) => !existingSet.has(`${breed.id}::${problem.id}`))
      .map((problem) => ({ breed, problem }))
  )

  const skipped = totalPairs - toGenerate.length
  console.log(`✅  ${skipped} already exist — skipping`)
  console.log(`⚙️   ${toGenerate.length} to generate`)

  if (toGenerate.length === 0) {
    console.log('\n🎉  Nothing to do — all pairs already exist.')
    return
  }

  if (dryRun) {
    console.log('\n--- DRY RUN — pairs that would be generated ---')
    toGenerate.forEach(({ breed, problem }) =>
      console.log(`  ${breed.name} × ${problem.name}`)
    )
    console.log('--- END DRY RUN ---')
    return
  }

  const estMinutes = Math.ceil((toGenerate.length * RATE_LIMIT_MS) / 60_000)
  console.log(`⏱   Estimated time: ~${estMinutes} min at ${RATE_LIMIT_MS}ms/req\n`)

  let done = 0
  let failed = 0
  const startMs = Date.now()

  for (const { breed, problem } of toGenerate) {
    done++
    const prefix = `[${done}/${toGenerate.length}]`
    process.stdout.write(`${prefix} ${breed.name} × ${problem.name}… `)

    try {
      const data = await generateBreedProblem(breed.name, problem.name)

      const { error: insertErr } = await supabase.from('breed_problems').insert({
        breed_id: breed.id,
        problem_id: problem.id,
        ...data,
      })

      if (insertErr) throw new Error(`Supabase insert: ${insertErr.message}`)

      const elapsed = eta(done, toGenerate.length, startMs)
      console.log(`✓  (ETA ${elapsed})`)
    } catch (err) {
      failed++
      console.log(`✗  FAILED: ${(err as Error).message}`)
    }

    // Rate limit — skip delay after last item
    if (done < toGenerate.length) {
      await sleep(RATE_LIMIT_MS)
    }
  }

  console.log(`\n🏁  Done. ${done - failed}/${toGenerate.length} succeeded, ${failed} failed.`)
  if (failed > 0) {
    console.log('   Re-run the same command to retry failed pairs — existing rows are skipped automatically.')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
