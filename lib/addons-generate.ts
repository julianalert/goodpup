import { createServerClient, type SubmissionRow } from './supabase'
import { ADDONS, addonDog, isAddonId, type AddonId } from './addons'
import { ADDON_STALE_MS, isAddonStale, kickAddonGeneration, listAddonRows, type AddonRow } from './addons-store'
import { MAX_AUTO_ATTEMPTS } from './generate-plan'
import { generateHandbook } from './handbook'
import { generateNutritionPlan } from './nutrition'
import { sendAddonReadyEmail, sendPlanFailureAlert } from './email'
import { trackServerEvent } from './mixpanel-server'

// Server-side only. Turns a paid add-on into its content. Built like the plan's
// pipeline (lib/generate-plan.ts) and kept apart from it: its own table, its own
// claim, its own function run. Nothing here can change a plan's status.

/** One generator per add-on: (the order, time budget) → the content to store. */
const GENERATORS: Record<AddonId, (submission: SubmissionRow, budgetMs: number) => Promise<unknown>> = {
  breed_handbook: generateHandbook,
  nutrition_plan: generateNutritionPlan,
}

const TABLE = 'submission_addons'
const COLUMNS = 'session_id, addon_id, status, attempts, updated_at'

// Give up cleanly before the platform kills the function (maxDuration = 300 s)
const RUN_BUDGET_MS = 270 * 1000
const MIN_ATTEMPT_MS = 150 * 1000

/** Does this row need (another) go at being generated? */
export function addonNeedsWork(row: AddonRow): boolean {
  if (row.attempts >= MAX_AUTO_ATTEMPTS) return false
  return row.status === 'pending' || row.status === 'failed' || isAddonStale(row)
}

/**
 * Is this add-on still waiting for another one it is written after (ADDONS[id].after)?
 * Only while that one is on its way: not owned, ready, or failed all let this one go
 * ahead, so a problem with one add-on never holds another one back.
 */
export function addonMustWait(row: AddonRow, rows: AddonRow[]): boolean {
  if (!isAddonId(row.addon_id)) return false
  return (ADDONS[row.addon_id].after ?? []).some((earlier) => {
    const other = rows.find((r) => r.addon_id === earlier)
    if (!other) return false
    return other.status === 'pending' || (other.status === 'generating' && !isAddonStale(other))
  })
}

/**
 * Atomically take the right to generate one add-on. One UPDATE decides the winner,
 * so the plan pipeline, the training space and the retry sweep can all ask.
 * Returns the row when claimed, null when someone else has it, it is ready, or it
 * has used up its attempts (every attempt costs money; a person looks at it then).
 */
export async function claimAddon(sessionId: string, addonId: AddonId): Promise<AddonRow | null> {
  const supabase = createServerClient()
  const staleBefore = new Date(Date.now() - ADDON_STALE_MS).toISOString()

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'generating' })
    .eq('session_id', sessionId)
    .eq('addon_id', addonId)
    .lt('attempts', MAX_AUTO_ATTEMPTS)
    .or(`status.in.(pending,failed),and(status.eq.generating,updated_at.lt."${staleBefore}")`)
    .select(COLUMNS)

  if (error) throw new Error(`claimAddon: ${error.message}`)
  const row = (data?.[0] as AddonRow | undefined) ?? null
  if (!row) return null

  // Only the claim holder writes this, so read-then-write is safe
  const attempts = (row.attempts ?? 0) + 1
  const { error: countError } = await supabase
    .from(TABLE)
    .update({ attempts })
    .eq('session_id', sessionId)
    .eq('addon_id', addonId)
  if (countError) console.warn('[addons] could not record the attempt:', countError.message)
  else row.attempts = attempts

  return row
}

/**
 * Generate, save and announce an add-on already claimed with claimAddon().
 * Never throws: a failure is recorded as 'failed', which the retry sweep picks up.
 */
export async function runAddonGeneration(row: AddonRow, submission: SubmissionRow): Promise<void> {
  const supabase = createServerClient()
  const sessionId = row.session_id
  const addonId = row.addon_id
  const startedAt = Date.now()
  const mine = () => supabase.from(TABLE)

  let content: unknown = null
  let lastError: unknown = null

  if (!isAddonId(addonId)) {
    lastError = new Error(`unknown add-on "${addonId}"`)
  } else {
    // Up to two tries in this run: a second one only if enough of the budget is left
    for (let attempt = 1; attempt <= 2 && content === null; attempt++) {
      const remaining = RUN_BUDGET_MS - (Date.now() - startedAt)
      if (attempt > 1 && remaining < MIN_ATTEMPT_MS) break
      try {
        content = await GENERATORS[addonId](submission, remaining)
      } catch (err) {
        lastError = err
        console.error(`[addons] ${addonId} attempt ${attempt} failed:`, sessionId, err)
      }
    }
  }

  if (content !== null) {
    const { error } = await mine()
      .update({ content, status: 'ready', ready_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('addon_id', addonId)
    if (error) {
      lastError = new Error(`saving add-on: ${error.message}`)
      console.error('[addons] could not save the add-on:', sessionId, addonId, error.message)
      content = null
    }
  }

  if (content === null || !isAddonId(addonId)) {
    try {
      await mine().update({ status: 'failed' }).eq('session_id', sessionId).eq('addon_id', addonId)
    } catch { /* best-effort */ }

    // Out of automatic retries: a person has to look at this one
    if (row.attempts >= MAX_AUTO_ATTEMPTS) {
      try {
        await sendPlanFailureAlert({
          what: `add-on (${addonId})`,
          sessionId,
          dogName: submission.dog_name ?? null,
          customerEmail: submission.email ?? null,
          attempts: row.attempts,
          error: lastError instanceof Error ? lastError.message : String(lastError),
          resetHint: `To try again once the cause is fixed, set <code>attempts</code> to 0 on this submission's <code>${addonId}</code> row in <code>submission_addons</code>; the retry sweep picks it up within 5 minutes.`,
        })
      } catch (err) {
        console.error('[addons] failure alert not sent:', sessionId, err)
      }
    }
    return
  }

  // Add-ons written after this one can start now, in a run of their own
  await kickAddonGeneration(sessionId, true)

  trackServerEvent(sessionId, 'addon_generated', {
    addon: addonId,
    seconds: Math.round((Date.now() - startedAt) / 1000),
    attempt: row.attempts,
  })

  // The add-on is saved: an email problem must not mark it as failed
  if (submission.email) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const dog = addonDog(submission.dog_name, submission.dog_breed)
      await sendAddonReadyEmail({
        to: submission.email,
        dogName: dog.name,
        addonTitle: ADDONS[addonId].title(dog),
        url: `${appUrl}/plan/${sessionId}#addons`,
      })
    } catch (err) {
      console.error('[addons] ready email failed:', sessionId, err)
    }
  }
}

/**
 * Claim every add-on of this order that is waiting to be generated, and start
 * them. Returns the running generations so the caller can keep its function
 * alive for them (waitUntil) or wait for them (the retry sweep).
 *
 * Add-ons only ever start once the plan is ready: the plan is the product, and
 * the handbook reads it so the two agree.
 */
export async function startDueAddons(submission: SubmissionRow): Promise<Promise<void>[]> {
  if (submission.status !== 'paid' || submission.plan_status !== 'ready') return []

  const rows = (await listAddonRows(submission.session_id)) ?? []
  // An add-on written after another waits for it; the one that finishes asks again
  const due = rows.filter((row) => isAddonId(row.addon_id) && addonNeedsWork(row) && !addonMustWait(row, rows))

  const running: Promise<void>[] = []
  for (const row of due) {
    try {
      const claimed = await claimAddon(submission.session_id, row.addon_id as AddonId)
      if (claimed) running.push(runAddonGeneration(claimed, submission))
    } catch (err) {
      console.error('[addons] claim failed:', submission.session_id, row.addon_id, err)
    }
  }
  return running
}
