import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerClient, type SubmissionRow } from '@/lib/supabase'
import { ADDONS, isAddonId, type AddonId } from '@/lib/addons'
import { addonStates, listAddonRows, submitAddonIntake } from '@/lib/addons-store'
import { startDueAddons } from '@/lib/addons-generate'
import { cleanNutritionProfile, missingAnswers } from '@/lib/nutrition-types'

// The response returns as soon as the answers are saved; waitUntil keeps the
// writing alive in the background, for up to the 300 s the platform allows.
export const maxDuration = 300

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * What each add-on asks: the customer's answers, reduced to values that are safe
 * to store and to put in a prompt, and the questions still unanswered.
 */
const INTAKES: Partial<Record<AddonId, (value: unknown) => { answers: unknown; missing: string[] }>> = {
  nutrition_plan: (value) => {
    const answers = cleanNutritionProfile(value)
    return { answers, missing: missingAnswers(answers) }
  },
}

/**
 * POST /api/addons/intake  { session_id, addon_id, answers }
 *
 * The customer has answered the questions of an add-on that was waiting for
 * them (the nutrition plan). Saves the answers and starts the writing. Accepted
 * once: an add-on that is already being written, or ready, is left alone.
 */
export async function POST(req: NextRequest) {
  let body: { session_id?: unknown; addon_id?: unknown; answers?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id: sessionId, addon_id: addonId } = body
  if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }
  const intake = isAddonId(addonId) && ADDONS[addonId].intake ? INTAKES[addonId] : undefined
  if (!isAddonId(addonId) || !intake) {
    return NextResponse.json({ error: 'This add-on asks no questions' }, { status: 400 })
  }

  const { answers, missing } = intake(body.answers)
  if (missing.length > 0) {
    return NextResponse.json({ error: 'Some answers are missing', missing }, { status: 422 })
  }

  const { data: submission, error } = await createServerClient()
    .from('submissions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle<SubmissionRow>()
  if (error || !submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (submission.status !== 'paid') return NextResponse.json({ error: 'Payment required' }, { status: 402 })

  let accepted: boolean
  try {
    accepted = await submitAddonIntake(sessionId, addonId, answers)
  } catch (err) {
    console.error('[addons/intake] could not save answers:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Not accepted = not bought, or already answered. Either way nothing restarts;
  // the page gets the current state and shows what is really going on.
  if (accepted) for (const generation of await startDueAddons(submission)) waitUntil(generation)

  const rows = await listAddonRows(sessionId)
  return NextResponse.json(
    { ok: accepted, addons: rows ? addonStates(submission, rows) : [] },
    { status: accepted ? 200 : 409 },
  )
}
