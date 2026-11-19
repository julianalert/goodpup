import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServerClient, type SubmissionRow } from '@/lib/supabase'
import { claimGeneration, confirmPaid, runGeneration } from '@/lib/generate-plan'

// 300 s = Vercel Pro ceiling. The HTTP response returns immediately;
// waitUntil keeps the model call alive in the background.
export const maxDuration = 300

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/generate  { session_id, stripe_session_id? }
 *
 * Called by /success (and its retry button). The Stripe webhook starts generation
 * too; whichever asks first wins the claim and the other is a no-op.
 * Only ever generates for a paid submission.
 */
export async function POST(req: NextRequest) {
  let body: { session_id?: unknown; stripe_session_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sessionId = body.session_id
  if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }
  const stripeSessionId = typeof body.stripe_session_id === 'string' ? body.stripe_session_id : null

  const supabase = createServerClient()

  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle<SubmissionRow>()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (!(await confirmPaid(submission, stripeSessionId))) {
    return NextResponse.json({ error: 'Payment required' }, { status: 402 })
  }

  if (submission.plan_status === 'ready') {
    return NextResponse.json({ ok: true, plan_status: 'ready' })
  }

  let claimed: SubmissionRow | null
  try {
    claimed = await claimGeneration(sessionId)
  } catch (err) {
    console.error('[generate] claim failed:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Not claimed = another request is generating it right now (or just finished)
  if (claimed) waitUntil(runGeneration(claimed))

  return NextResponse.json({ ok: true, plan_status: 'generating' })
}
