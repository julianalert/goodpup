import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/submission-data?session_id=<uuid>
 *
 * Returns the survey fields needed to hydrate the order page when a user
 * arrives from an abandoned-cart email link (/order?session_id=<uuid>).
 * Only exposes display/checkout fields — never plan HTML or payment details.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('submissions')
      .select('dog_name, dog_breed, dog_age, problems, problem_context, experience, living, daily_time, training_history, email, status')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) {
      console.error('[api/submission-data] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Don't serve already-paid submissions (they already have a plan)
    if (data.status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 409 })
    }

    return NextResponse.json({
      dogName: data.dog_name ?? '',
      dogBreed: data.dog_breed ?? '',
      dogAge: data.dog_age ?? '',
      problems: data.problems ?? [],
      problemContext: data.problem_context ?? '',
      experience: data.experience ?? '',
      living: data.living ?? '',
      dailyTime: data.daily_time ?? 20,
      trainingHistory: data.training_history ?? '',
      email: data.email ?? '',
    })
  } catch (err) {
    console.error('[api/submission-data] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
