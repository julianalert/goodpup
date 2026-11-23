import Anthropic from '@anthropic-ai/sdk'
import { createServerClient, type SubmissionRow } from './supabase'
import { buildPrompt } from './prompt'
import { sendPlanEmail, sendPlanFailureAlert } from './email'
import { stripe } from './stripe'
import { generatePlanV2 } from './plan-v2'
import { grantAddonsFromCheckout, kickAddonGeneration, notifyAddonIntake } from './addons-store'

// Server-side only. Everything that turns a paid submission into a plan lives here,
// so the Stripe webhook and /api/generate start generation the exact same way.

export const PLAN_MODEL = 'claude-sonnet-5-5'

// Routes that generate run with maxDuration = 300 s. A row still 'generating' after
// this long belongs to a function that died, so it can be claimed again.
// `updated_at` is the clock: the database bumps it on every write to the row.
export const GENERATION_STALE_MS = 6 * 60 * 1000

// Give up cleanly (plan_status 'failed', retry button) before the platform kills
// the function, which would leave the row stuck in 'generating'.
const MODEL_TIMEOUT_MS = 270 * 1000

// ── Retry policy ───────────────────────────────────────────────────────────
// A failed plan is retried without anyone asking: once more inside the same run
// when there is time, then by the retry sweep (/api/cron/retry-plans, every 5 min).
// Each attempt costs real money, so the sweep stops after MAX_AUTO_ATTEMPTS and
// emails the owner instead of looping forever on a plan that can never succeed.
export const MAX_AUTO_ATTEMPTS = 10

// Whole budget of one run, and the least time worth starting a second attempt with
const RUN_BUDGET_MS = MODEL_TIMEOUT_MS
const MIN_ATTEMPT_MS = 150 * 1000

/** Minutes the sweep waits after a failure before the next attempt. */
export function retryDelayMinutes(attempts: number): number {
  if (attempts <= 2) return 0   // straight away, on the next sweep
  if (attempts === 3) return 15
  if (attempts === 4) return 30
  return 60
}

/** Should the sweep pick this paid, not-ready row up now? */
export function isRetryDue(
  row: { plan_status?: string | null; plan_attempts?: number | null; updated_at?: string | null },
  now: number = Date.now(),
): boolean {
  if ((row.plan_attempts ?? 0) >= MAX_AUTO_ATTEMPTS || !row.updated_at) return false
  const idleMs = now - new Date(row.updated_at).getTime()

  // Died mid-run
  if (row.plan_status === 'generating') return idleMs > GENERATION_STALE_MS
  // Paid but never started: the webhook's own start normally takes this within seconds
  if (row.plan_status === 'pending') return idleMs > 2 * 60 * 1000
  if (row.plan_status === 'failed') return idleMs >= retryDelayMinutes(row.plan_attempts ?? 0) * 60 * 1000
  return false
}

export function isGenerationStale(row: { plan_status?: string | null; updated_at?: string | null }): boolean {
  if (row.plan_status !== 'generating' || !row.updated_at) return false
  return Date.now() - new Date(row.updated_at).getTime() > GENERATION_STALE_MS
}

// ── Payment ────────────────────────────────────────────────────────────────

/**
 * True when the submission is paid. The webhook normally marks the row before the
 * buyer lands on /success, but not always: if it hasn't arrived yet we ask Stripe
 * directly and mark the row ourselves, so a real buyer never waits on the webhook.
 */
export async function confirmPaid(
  submission: SubmissionRow,
  stripeSessionIdFromClient?: string | null,
): Promise<boolean> {
  if (submission.status === 'paid') return true

  const candidates = [...new Set([stripeSessionIdFromClient, submission.stripe_session_id])]
    .filter((id): id is string => typeof id === 'string' && id.startsWith('cs_'))

  for (const id of candidates) {
    try {
      const session = await stripe.checkout.sessions.retrieve(id)
      const settled = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
      // The checkout must be finished, settled, and created for this exact submission
      if (session.status !== 'complete' || !settled || session.metadata?.session_id !== submission.session_id) continue

      const { error } = await createServerClient()
        .from('submissions')
        .update({
          status: 'paid',
          stripe_payment_intent_id: (session.payment_intent as string) ?? null,
          recovery_suppressed: true,
        })
        .eq('session_id', submission.session_id)
      if (error) throw new Error(error.message)

      // Add-ons bought in the same checkout: the webhook records them too, this
      // covers the buyer who gets here first. Never a reason to refuse the plan.
      try {
        await grantAddonsFromCheckout(session)
      } catch (err) {
        console.error('[generate-plan] could not record add-ons for', id, err)
      }
      return true
    } catch (err) {
      console.error('[generate-plan] payment check failed for', id, err)
    }
  }
  return false
}

// ── Claiming ───────────────────────────────────────────────────────────────

/**
 * Atomically take the right to generate this plan. One UPDATE decides the winner,
 * so the webhook and the /success page can both ask and only one of them runs.
 * Returns the row when claimed, null when it is unpaid, already ready, or being
 * generated by someone else right now.
 */
export async function claimGeneration(sessionId: string): Promise<SubmissionRow | null> {
  const staleBefore = new Date(Date.now() - GENERATION_STALE_MS).toISOString()

  const { data, error } = await createServerClient()
    .from('submissions')
    .update({ plan_status: 'generating' })
    .eq('session_id', sessionId)
    .eq('status', 'paid')
    .or(`plan_status.in.(pending,failed),and(plan_status.eq.generating,updated_at.lt."${staleBefore}")`)
    .select('*')

  if (error) throw new Error(`claimGeneration: ${error.message}`)
  const row = (data?.[0] as SubmissionRow | undefined) ?? null
  if (!row) return null

  // Count the attempt. Only the claim holder writes this, so read-then-write is safe.
  // Best-effort: before migration 004 the column doesn't exist, and generating the
  // plan matters more than counting it.
  const attempts = (row.plan_attempts ?? 0) + 1
  const { error: countError } = await createServerClient()
    .from('submissions')
    .update({ plan_attempts: attempts })
    .eq('session_id', sessionId)
  if (countError) {
    console.warn('[generate-plan] could not record the attempt (run migration 004?):', countError.message)
  } else {
    row.plan_attempts = attempts
  }
  return row
}

// ── Generation ─────────────────────────────────────────────────────────────

/** Calls the model and returns the plan's HTML sections. Throws rather than return a broken plan. */
export async function generatePlanHtml(submission: SubmissionRow, timeoutMs: number = MODEL_TIMEOUT_MS): Promise<string> {
  const client = new Anthropic({ maxRetries: 1 })

  // Streamed so a long plan can't hit an HTTP timeout. Thinking is on by default on
  // this model and counts toward max_tokens, hence the headroom over the ~13k a plan needs.
  const stream = client.messages.stream({
    model: PLAN_MODEL,
    max_tokens: 40000,
    // 'medium' takes about 90 s, well inside the 300 s function limit. 'high' writes
    // ~15% more per day but takes about 3 minutes, too close to the limit for a paid order.
    output_config: { effort: 'medium' },
    messages: [{ role: 'user', content: buildPrompt(submission) }],
  })

  const startedAt = Date.now()
  const timer = setTimeout(() => stream.abort(), timeoutMs)
  let message: Anthropic.Message
  try {
    message = await stream.finalMessage()
  } finally {
    clearTimeout(timer)
  }

  console.log('[generate-plan] model finished', {
    session_id: submission.session_id,
    seconds: Math.round((Date.now() - startedAt) / 1000),
    stop_reason: message.stop_reason,
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  })

  if (message.stop_reason === 'refusal') throw new Error('model declined to write this plan')
  if (message.stop_reason === 'max_tokens') throw new Error('plan was cut off at max_tokens')

  const raw = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  // Strip a markdown fence / outer <body> tags the model sometimes adds
  const html = raw
    .replace(/^\s*```(?:html)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
    .replace(/^\s*<body[^>]*>\s*/i, '')
    .replace(/\s*<\/body>\s*$/i, '')
    .trim()

  if (!/id="program"/.test(html) || !/id="checklist"/.test(html)) {
    throw new Error('plan is missing its program or checklist section')
  }

  const days = countDayRows(html)
  if (days !== 30) {
    console.warn(`[generate-plan] ${submission.session_id}: expected 30 day rows, got ${days}`)
  }

  return html
}

/** Number of day rows across the weekly tables. */
export function countDayRows(html: string): number {
  return (html.match(/<tbody[\s\S]*?<\/tbody>/gi) ?? [])
    .reduce((total, tbody) => total + (tbody.match(/<tr[\s>]/gi) ?? []).length, 0)
}

/**
 * Generate, save and email the plan for a row already claimed with claimGeneration().
 * Never throws: a failure is recorded as plan_status 'failed', which the retry sweep
 * picks up on its own.
 */
export async function runGeneration(submission: SubmissionRow): Promise<void> {
  const supabase = createServerClient()
  const sessionId = submission.session_id
  const startedAt = Date.now()

  // New orders get the structured plan (the interactive training space). Until
  // migration 005 has added the plan_json column, they get the HTML plan instead.
  const structured = 'plan_json' in submission

  let plan: { plan_json: unknown } | { plan_html: string } | null = null
  let lastError: unknown = null

  // Up to two tries in this run: a second one only if enough of the budget is left
  // (a quick API error leaves plenty; a timeout leaves none).
  for (let attempt = 1; attempt <= 2 && plan === null; attempt++) {
    const remaining = RUN_BUDGET_MS - (Date.now() - startedAt)
    if (attempt > 1 && remaining < MIN_ATTEMPT_MS) break
    try {
      plan = structured
        ? { plan_json: await generatePlanV2(submission, remaining) }
        : { plan_html: await generatePlanHtml(submission, remaining) }
    } catch (err) {
      lastError = err
      console.error(`[generate-plan] attempt ${attempt} failed:`, sessionId, err)
    }
  }

  if (plan !== null) {
    const { error } = await supabase
      .from('submissions')
      .update({
        ...plan,
        plan_status: 'ready',
        // Only once migration 006 has added the column: an unknown column would fail the save
        ...('plan_ready_at' in submission ? { plan_ready_at: new Date().toISOString() } : {}),
      })
      .eq('session_id', sessionId)
    if (error) {
      lastError = new Error(`saving plan: ${error.message}`)
      console.error('[generate-plan] could not save the plan:', sessionId, error.message)
      plan = null
    }
  }

  if (plan === null) {
    try {
      await supabase.from('submissions').update({ plan_status: 'failed' }).eq('session_id', sessionId)
    } catch { /* best-effort */ }

    // Out of automatic retries: a person has to look at this one
    if ((submission.plan_attempts ?? 0) >= MAX_AUTO_ATTEMPTS) {
      try {
        await sendPlanFailureAlert({
          sessionId,
          dogName: submission.dog_name ?? null,
          customerEmail: submission.email ?? null,
          attempts: submission.plan_attempts ?? 0,
          error: lastError instanceof Error ? lastError.message : String(lastError),
        })
      } catch (err) {
        console.error('[generate-plan] failure alert not sent:', sessionId, err)
      }
    }
    return
  }

  // The plan is saved: an email problem must not mark it as failed.
  if (submission.email) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      await sendPlanEmail({
        to: submission.email,
        dogName: submission.dog_name ?? 'your dog',
        planUrl: `${appUrl}/plan/${sessionId}`,
      })
    } catch (err) {
      console.error('[generate-plan] plan email failed:', sessionId, err)
    }
  }

  // The plan is saved and announced. Paid add-ons are written now, in a function
  // run of their own: this one has spent its time budget on the plan. One that
  // needs the buyer's answers first gets its email instead, now that the training
  // space it sends them to is open. Neither call ever throws.
  await kickAddonGeneration(sessionId)
  await notifyAddonIntake(sessionId)
}
