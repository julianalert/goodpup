import { createServerClient } from './supabase'

// Server-side only. Turns what the owner typed as a breed, plus the problems they
// picked, into the matching rows of our own breed database (the one behind /dogs),
// so the plan is grounded in the same data the site publishes instead of numbers
// the model makes up per plan.

// Quiz problem → problem slug(s) in the `problems` table. Problems with no entry
// have no counterpart there.
const PROBLEM_SLUGS: Record<string, string[]> = {
  leash_pulling: ['leash-pulling'],
  recall: ['recall'],
  jumping: ['jumping'],
  barking: ['barking'],
  aggression: ['reactivity', 'aggression-dogs'],
  separation: ['separation-anxiety'],
  destruction: ['chewing'],
  potty: ['potty-training'],
  biting: ['nipping-mouthing'],
}

// What owners type → the name we store
const ALIASES: Record<string, string> = {
  gsd: 'german shepherd',
  'german shepard': 'german shepherd',
  alsatian: 'german shepherd',
  lab: 'labrador retriever',
  labrador: 'labrador retriever',
  golden: 'golden retriever',
  frenchie: 'french bulldog',
  yorkie: 'yorkshire terrier',
  aussie: 'australian shepherd',
  corgi: 'pembroke welsh corgi',
  husky: 'siberian husky',
  doberman: 'doberman pinscher',
  malinois: 'belgian malinois',
  'jack russell': 'jack russell terrier',
  staffy: 'american staffordshire terrier',
  amstaff: 'american staffordshire terrier',
}

const normalise = (value: string) =>
  value.toLowerCase().normalize('NFKD').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()

export interface BreedMatch {
  slug: string
  name: string
  /** false when the owner's dog is a mix of, or only close to, this breed */
  exact: boolean
}

/** Pure: pick the breed row for what the owner typed, or null when unsure. */
export function matchBreed(input: string | null | undefined, breeds: { slug: string; name: string }[]): BreedMatch | null {
  const typed = normalise(input ?? '')
  if (typed.length < 3) return null

  const wanted = ALIASES[typed] ?? typed
  const byName = breeds.map((b) => ({ ...b, key: normalise(b.name) }))

  const same = byName.find((b) => b.key === wanted)
  if (same) return { slug: same.slug, name: same.name, exact: true }

  // "german shepherd mix", "black labrador retriever": the longest breed name inside what they typed
  const inside = byName
    .filter((b) => ` ${wanted} `.includes(` ${b.key} `))
    .sort((a, b) => b.key.length - a.key.length)[0]
  if (inside) return { slug: inside.slug, name: inside.name, exact: false }

  // "poodle", "bulldog": only when exactly one breed carries that word, otherwise we'd be guessing
  if (wanted.length >= 5) {
    const containing = byName.filter((b) => ` ${b.key} `.includes(` ${wanted} `))
    if (containing.length === 1) return { slug: containing[0].slug, name: containing[0].name, exact: false }
  }

  return null
}

const line = (label: string, value: unknown) =>
  value === null || value === undefined || value === '' ? '' : `${label}: ${value}\n`

/**
 * Reference text for the plan prompts, or null when we have nothing reliable for
 * this dog. Never throws: a plan without breed data beats no plan.
 */
export async function getBreedContext(
  breedInput: string | null | undefined,
  problems: string[] | null | undefined,
): Promise<string | null> {
  try {
    const supabase = createServerClient()

    const { data: breeds } = await supabase.from('breeds').select('slug, name')
    const match = matchBreed(breedInput, breeds ?? [])
    if (!match) return null

    const { data: breed } = await supabase.from('breeds').select('*').eq('slug', match.slug).maybeSingle()
    if (!breed) return null

    const slugs = [...new Set((problems ?? []).flatMap((p) => PROBLEM_SLUGS[p] ?? []))]
    const { data: problemRows } = slugs.length
      ? await supabase
          .from('breed_problem_paths')
          .select('problem_slug, frequency, difficulty, timeline_weeks_min, timeline_weeks_max, why_this_breed, makes_it_worse, what_fix_requires, common_mistakes, age_risk_note')
          .eq('breed_slug', match.slug)
          .in('problem_slug', slugs)
      : { data: [] }

    let text = match.exact
      ? `Breed in our database: ${breed.name}\n`
      : `Closest breed in our database: ${breed.name} (the owner wrote "${(breedInput ?? '').trim()}", so use what fits this dog and ignore what does not)\n`

    text += line('Group', breed.group_name)
    text += line('Bred for', breed.purpose)
    text += 'Scores, 0–100: ' + [
      ['trainability', breed.score_trainability], ['energy', breed.score_energy],
      ['beginner-friendly', breed.score_beginner_friendly], ['sociability', breed.score_sociability],
      ['independence', breed.score_independence], ['prey drive', breed.trait_prey_drive],
      ['guarding instinct', breed.trait_guarding_instinct], ['food drive', breed.drive_food],
      ['praise drive', breed.drive_praise], ['play drive', breed.drive_play],
      ['focus outdoors', breed.drive_focus_outdoors], ['distraction threshold', breed.drive_distraction_threshold],
    ].filter(([, v]) => typeof v === 'number').map(([k, v]) => `${k} ${v}`).join(', ') + '\n'
    text += line('Daily exercise need (minutes)', breed.daily_exercise_minutes)
    text += line('Longest comfortable time alone (hours)', breed.max_alone_hours)
    text += line('Training overview', breed.training_overview)
    text += line('Adolescence', breed.adolescence_warning)

    for (const row of problemRows ?? []) {
      text += `\nProblem: ${row.problem_slug} in this breed\n`
      text += line('How common', row.frequency)
      text += line('Difficulty (0–10)', row.difficulty)
      if (row.timeline_weeks_min && row.timeline_weeks_max) {
        text += `Typical time to resolve: ${row.timeline_weeks_min}–${row.timeline_weeks_max} weeks\n`
      }
      text += line('Why this breed does it', row.why_this_breed)
      text += line('What makes it worse', row.makes_it_worse)
      if (Array.isArray(row.what_fix_requires) && row.what_fix_requires.length) {
        text += `What the fix requires: ${row.what_fix_requires.join(' | ')}\n`
      }
      if (Array.isArray(row.common_mistakes) && row.common_mistakes.length) {
        text += 'Common owner mistakes: ' + (row.common_mistakes as { title?: string; description?: string }[])
          .map((m) => `${m.title ?? ''}: ${m.description ?? ''}`).join(' | ') + '\n'
      }
      text += line('Age note', row.age_risk_note)
    }

    return text.trim()
  } catch (err) {
    console.error('[breed-context] lookup failed, continuing without breed data:', err)
    return null
  }
}
