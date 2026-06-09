import { createServerClient } from '@/lib/supabase'

export async function getAllBreeds() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('breeds')
    .select(`
      slug, name, group_name, emoji, tags,
      score_overall, score_trainability, score_energy, score_beginner_friendly,
      breed_problems(
        problem:problems(slug, name)
      )
    `)
    .order('name')
  return data ?? []
}

export async function getBreedBySlug(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('breeds')
    .select(`
      *,
      breed_problems(
        frequency, difficulty, timeline_weeks_min, timeline_weeks_max,
        problem:problems(slug, name, emoji)
      )
    `)
    .eq('slug', slug)
    .single()
  return data
}

export async function getBreedProblem(breedSlug: string, problemSlug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('breed_problem_paths')
    .select('*')
    .eq('breed_slug', breedSlug)
    .eq('problem_slug', problemSlug)
    .single()

  const [breed, problem] = await Promise.all([
    getBreedBySlug(breedSlug),
    getProblemBySlug(problemSlug),
  ])

  return { breedProblem: data, breed, problem }
}

export async function getProblemWithAllBreeds(slug: string) {
  const supabase = createServerClient()
  const { data: problem } = await supabase
    .from('problems')
    .select('*')
    .eq('slug', slug)
    .single()

  const { data: breedRows } = await supabase
    .from('breed_problems')
    .select('*, breed:breeds(slug, name, group_name, emoji)')
    .eq('problem_id', problem?.id)
    .order('difficulty', { ascending: true })

  return { problem, breeds: breedRows ?? [] }
}

export async function getProblemBySlug(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('problems')
    .select('*')
    .eq('slug', slug)
    .single()
  return data
}

export async function getAllProblems() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('problems')
    .select('slug, name, emoji')
    .order('name')
  return data ?? []
}

export async function getAllBreedSlugs() {
  const supabase = createServerClient()
  const { data } = await supabase.from('breeds').select('slug')
  return data?.map((b) => b.slug) ?? []
}

export async function getAllProblemSlugs() {
  const supabase = createServerClient()
  const { data } = await supabase.from('problems').select('slug')
  return data?.map((p) => p.slug) ?? []
}

export async function getAllBreedProblemPaths() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('breed_problem_paths')
    .select('breed_slug, problem_slug')
  return data ?? []
}

export async function getSimilarBreeds(currentSlug: string, groupName: string | null) {
  const supabase = createServerClient()
  let query = supabase
    .from('breeds')
    .select('slug, name, emoji')
    .neq('slug', currentSlug)
    .limit(5)

  if (groupName) {
    query = query.eq('group_name', groupName)
  }

  const { data } = await query
  return data ?? []
}
