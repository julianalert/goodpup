import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { stripe } from '@/lib/stripe'
import { createServerClient, type SubmissionRow } from '@/lib/supabase'
import { addonStates, grantAddonsFromCheckout, listAddonRows, notifyAddonIntake } from '@/lib/addons-store'
import { startDueAddons } from '@/lib/addons-generate'

// The HTTP response returns immediately; waitUntil keeps the model calls alive
// in the background, for up to the 300 s the platform allows.
export const maxDuration = 300

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/addons/generate  { session_id, stripe_session_id? }
 *
 * Starts every paid add-on of this order that is waiting to be generated. An
 * add-on that needs the customer's answers first is not started here: it gets
 * its email instead, and starts when they answer (/api/addons/intake).
 * Asked for by the plan pipeline once the plan is saved, by the training space
 * when it sees an add-on waiting, and after an unlock payment. Whoever asks
 * first wins the claim; the others are no-ops. Only ever generates what is paid
 * for, and only once the plan itself is ready.
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

  const { data: submission, error } = await createServerClient()
    .from('submissions')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle<SubmissionRow>()

  if (error || !submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  if (submission.status !== 'paid') return NextResponse.json({ error: 'Payment required' }, { status: 402 })

  // Back from an unlock payment: the webhook normally records it before the buyer
  // lands here, but not always. Ask Stripe directly so they never wait on it.
  const stripeSessionId = typeof body.stripe_session_id === 'string' ? body.stripe_session_id : null
  if (stripeSessionId?.startsWith('cs_')) {
    try {
      const checkout = await stripe.checkout.sessions.retrieve(stripeSessionId)
      // The checkout must be finished and created for this exact order
      if (checkout.status === 'complete' && checkout.metadata?.session_id === sessionId) {
        await grantAddonsFromCheckout(checkout)
      }
    } catch (err) {
      console.error('[addons/generate] payment check failed for', stripeSessionId, err)
    }
  }

  const running = await startDueAddons(submission)
  for (const generation of running) waitUntil(generation)

  // An add-on that needs the customer's answers first: email them about it (once)
  if (submission.plan_status === 'ready') waitUntil(notifyAddonIntake(sessionId))

  const rows = await listAddonRows(sessionId)
  return NextResponse.json({ ok: true, started: running.length, addons: rows ? addonStates(submission, rows) : [] })
}
