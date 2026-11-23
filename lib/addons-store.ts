import type Stripe from 'stripe'
import { createServerClient, type SubmissionRow } from './supabase'
import { ADDONS, ADDON_IDS, addonDog, cleanAddonIds, type AddonId, type AddonState } from './addons'
import { sendAddonIntakeEmail } from './email'

// Server-side only. Which add-ons a customer owns and what state each is in
// (table submission_addons, migration 008). Generating them lives in
// lib/addons-generate.ts; this file must not import it, or lib/generate-plan.ts,
// because the plan pipeline imports from here.

const TABLE = 'submission_addons'

// Same clock as the plan's: a row still 'generating' after this long belongs to a
// function that died (routes that generate run with maxDuration = 300 s).
export const ADDON_STALE_MS = 6 * 60 * 1000

export interface AddonRow {
  session_id: string
  addon_id: string
  status: 'awaiting_input' | 'pending' | 'generating' | 'ready' | 'failed'
  attempts: number
  updated_at: string
  /** Only when asked for */
  content?: unknown
  /** What the customer has entered inside the add-on. Only when asked for. */
  settings?: unknown
}

const COLUMNS = 'session_id, addon_id, status, attempts, updated_at'

/**
 * The add-ons this customer has paid for. Null when the table cannot be read,
 * which is what happens until migration 008 has run: callers then behave as if
 * add-ons did not exist.
 */
export async function listAddonRows(sessionId: string, withContent = false): Promise<AddonRow[] | null> {
  try {
    const read = (columns: string) => createServerClient().from(TABLE).select(columns).eq('session_id', sessionId)

    let { data, error } = await read(withContent ? `${COLUMNS}, content, settings` : COLUMNS)
    // A table created before the settings column existed: the add-ons themselves are still there
    if (error && withContent) ({ data, error } = await read(`${COLUMNS}, content`))
    if (error) {
      console.warn('[addons] could not read add-ons (run migration 008?):', error.message)
      return null
    }
    return (data ?? []) as unknown as AddonRow[]
  } catch (err) {
    console.warn('[addons] could not read add-ons:', err)
    return null
  }
}

export function isAddonStale(row: { status: string; updated_at: string }): boolean {
  return row.status === 'generating' && Date.now() - new Date(row.updated_at).getTime() > ADDON_STALE_MS
}

type DogFields = Pick<SubmissionRow, 'dog_name' | 'dog_breed'>

/** Add-ons this customer can still buy. */
export function addonOffers(submission: DogFields, rows: AddonRow[]): AddonId[] {
  const dog = addonDog(submission.dog_name, submission.dog_breed)
  return ADDON_IDS.filter((id) => ADDONS[id].available(dog) && !rows.some((r) => r.addon_id === id))
}

/**
 * Every add-on as the training space shows it: owned ones with their status,
 * and the ones still for sale as 'locked'. A generation that has run past the
 * function time limit is reported as failed, so the page asks for it again.
 */
export function addonStates(submission: DogFields, rows: AddonRow[]): AddonState[] {
  const offers = addonOffers(submission, rows)
  return ADDON_IDS.flatMap((id): AddonState[] => {
    const row = rows.find((r) => r.addon_id === id)
    if (!row) return offers.includes(id) ? [{ id, status: 'locked', content: null }] : []
    const status = isAddonStale(row) ? 'failed' : row.status
    const ready = status === 'ready'
    return [{ id, status, content: ready ? (row.content ?? null) : null, settings: ready ? (row.settings ?? null) : null }]
  })
}

/**
 * Record add-ons as paid. Safe to call any number of times for the same purchase
 * (the webhook, /success and the training space can all report it): a row that
 * already exists is left exactly as it is. Throws when the database refuses.
 */
export async function grantAddons(sessionId: string, ids: AddonId[], stripeSessionId: string | null): Promise<void> {
  if (ids.length === 0) return
  const { error } = await createServerClient()
    .from(TABLE)
    .upsert(
      ids.map((id) => ({
        session_id: sessionId,
        addon_id: id,
        // An add-on that needs the customer's answers is not written until it has them
        status: ADDONS[id].intake ? 'awaiting_input' : 'pending',
        stripe_session_id: stripeSessionId,
        amount_cents: ADDONS[id].priceCents,
      })),
      { onConflict: 'session_id,addon_id', ignoreDuplicates: true },
    )
  if (error) throw new Error(`grantAddons: ${error.message}`)
}

/**
 * The add-ons a finished Stripe checkout paid for, recorded. Returns their ids
 * (empty when the checkout had none, or is not settled). Throws on a database error.
 */
export async function grantAddonsFromCheckout(session: Stripe.Checkout.Session): Promise<AddonId[]> {
  const settled = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  const sessionId = session.metadata?.session_id
  const ids = cleanAddonIds(session.metadata?.addons)
  if (!settled || !sessionId || ids.length === 0) return []

  await grantAddons(sessionId, ids, session.id)
  return ids
}

/**
 * Take the customer's answers for an add-on that was waiting for them, and put
 * it in line to be written. One UPDATE decides: answers are accepted once, while
 * the add-on is still 'awaiting_input', so a second submission can never restart
 * (and re-bill us for) a plan that is already being written. False when there
 * was nothing waiting. Throws when the database refuses.
 */
export async function submitAddonIntake(sessionId: string, id: AddonId, answers: unknown): Promise<boolean> {
  const { data, error } = await createServerClient()
    .from(TABLE)
    .update({ settings: answers, status: 'pending' })
    .eq('session_id', sessionId)
    .eq('addon_id', id)
    .eq('status', 'awaiting_input')
    .select('addon_id')
  if (error) throw new Error(`submitAddonIntake: ${error.message}`)
  return (data?.length ?? 0) > 0
}

/**
 * Email the customer about each add-on of theirs that is waiting for answers,
 * once per add-on (intake_email_at records it, and the UPDATE that sets it is
 * what decides who sends). Only once the plan is ready: the questions live in the
 * training space, which does not open before that. Never throws.
 */
export async function notifyAddonIntake(sessionId: string): Promise<void> {
  try {
    const supabase = createServerClient()
    const rows = await listAddonRows(sessionId)
    const waiting = (rows ?? []).filter((r) => r.status === 'awaiting_input')
    if (waiting.length === 0) return

    const { data: submission } = await supabase
      .from('submissions')
      .select('email, dog_name, dog_breed, plan_status')
      .eq('session_id', sessionId)
      .maybeSingle()
    if (!submission?.email || submission.plan_status !== 'ready') return

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const dog = addonDog(submission.dog_name, submission.dog_breed)

    for (const row of waiting) {
      const intake = ADDON_IDS.includes(row.addon_id as AddonId) ? ADDONS[row.addon_id as AddonId].intake : undefined
      if (!intake) continue

      const { data: claimed, error } = await supabase
        .from(TABLE)
        .update({ intake_email_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('addon_id', row.addon_id)
        .eq('status', 'awaiting_input')
        .is('intake_email_at', null)
        .select('addon_id')
      if (error) {
        console.warn('[addons] could not record the intake email:', error.message)
        continue
      }
      if (!claimed?.length) continue // already sent

      try {
        await sendAddonIntakeEmail({
          to: submission.email,
          subject: intake.emailSubject(dog),
          body: intake.emailBody(dog),
          url: `${appUrl}/plan/${sessionId}#addon-${row.addon_id}`,
        })
      } catch (err) {
        console.error('[addons] intake email failed:', sessionId, row.addon_id, err)
        // Let a later call try again
        await supabase.from(TABLE).update({ intake_email_at: null }).eq('session_id', sessionId).eq('addon_id', row.addon_id)
      }
    }
  } catch (err) {
    console.warn('[addons] could not send intake emails:', sessionId, err)
  }
}

/**
 * Save what the customer changes inside an add-on that is ready (the nutrition
 * plan's calculator). False when it could not be saved: the page keeps its own
 * copy, so nothing is lost. Only a ready add-on: before that its answers go
 * through submitAddonIntake().
 */
export async function saveAddonSettings(sessionId: string, id: AddonId, settings: unknown): Promise<boolean> {
  try {
    const { data, error } = await createServerClient()
      .from(TABLE)
      .update({ settings })
      .eq('session_id', sessionId)
      .eq('addon_id', id)
      .eq('status', 'ready')
      .select('addon_id')
    if (error) {
      console.warn('[addons] could not save settings (re-run migration 008 for the settings column?):', error.message)
      return false
    }
    return (data?.length ?? 0) > 0
  } catch (err) {
    console.warn('[addons] could not save settings:', err)
    return false
  }
}

/**
 * Ask for this customer's paid add-ons to be generated, in a function run of
 * their own. Called once the plan is saved: the plan's run has used its time
 * budget, and an add-on must never be able to cost the customer their plan.
 * Also called when an add-on finishes, for the ones written after it; then only
 * add-ons that have never been started count (`waitingOnly`), so a failing
 * add-on cannot set off a chain of immediate retries.
 * Never throws; the training space and the retry sweep ask again if this fails.
 */
export async function kickAddonGeneration(sessionId: string, waitingOnly = false): Promise<void> {
  try {
    const rows = await listAddonRows(sessionId)
    if (!rows?.some((r) => r.status === 'pending' || (!waitingOnly && r.status === 'failed'))) return

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    // The route answers straight away and keeps working in the background
    const res = await fetch(`${appUrl}/api/addons/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) console.warn('[addons] generation request answered', res.status, 'for', sessionId)
  } catch (err) {
    console.warn('[addons] could not request add-on generation:', sessionId, err)
  }
}
