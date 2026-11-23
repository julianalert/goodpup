import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type SubmissionRow } from '@/lib/supabase'
import { isAddonId } from '@/lib/addons'
import { ADDON_STALE_MS, type AddonRow } from '@/lib/addons-store'
import { addonMustWait, claimAddon, runAddonGeneration } from '@/lib/addons-generate'
import { isRetryDue, MAX_AUTO_ATTEMPTS } from '@/lib/generate-plan'

// Generation runs inside this request (two add-ons at most, side by side)
export const maxDuration = 300

const MAX_PER_RUN = 2

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` — we verify it.
// In local development (CRON_SECRET unset) the check is skipped.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * GET /api/cron/retry-addons — every 5 minutes (vercel.json)
 *
 * The safety net behind "a paid add-on always gets delivered". Finds paid add-ons
 * that are not ready (failed, died mid-run, or never started) on orders whose plan
 * is ready, and generates them, with the same growing pause between tries and the
 * same hard stop as the plan's sweep (/api/cron/retry-plans).
 *
 * A separate route from the plan's on purpose: add-ons never share a function
 * run, or its time budget, with a plan.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const staleBefore = new Date(Date.now() - ADDON_STALE_MS).toISOString()

  const { data, error } = await supabase
    .from('submission_addons')
    .select('session_id, addon_id, status, attempts, updated_at')
    .lt('attempts', MAX_AUTO_ATTEMPTS)
    .or(`status.in.(pending,failed),and(status.eq.generating,updated_at.lt."${staleBefore}")`)
    .order('updated_at', { ascending: true })
    .limit(50)

  if (error) {
    // Until migration 008 has run there is no table, and nothing to retry
    console.warn('[cron/retry-addons] query failed (run supabase/migrations/008_addons.sql?):', error.message)
    return NextResponse.json({ retried: 0, waiting: 0, note: 'submission_addons is not readable' })
  }

  const candidates = ((data ?? []) as AddonRow[]).filter(
    (row) => isAddonId(row.addon_id) && isRetryDue({ plan_status: row.status, plan_attempts: row.attempts, updated_at: row.updated_at }),
  )

  // Add-ons wait for their plan: only orders whose plan is ready qualify
  const sessionIds = [...new Set(candidates.map((row) => row.session_id))]
  const { data: submissions } = sessionIds.length
    ? await supabase.from('submissions').select('*').in('session_id', sessionIds).eq('status', 'paid').eq('plan_status', 'ready')
    : { data: [] }
  const bySession = new Map(((submissions ?? []) as SubmissionRow[]).map((s) => [s.session_id, s]))

  // An add-on written after another one waits while that one is on its way
  const { data: siblings } = bySession.size
    ? await supabase
        .from('submission_addons')
        .select('session_id, addon_id, status, attempts, updated_at')
        .in('session_id', [...bySession.keys()])
    : { data: [] }
  const allRows = (siblings ?? []) as AddonRow[]

  const due = candidates
    .filter((row) => bySession.has(row.session_id))
    .filter((row) => !addonMustWait(row, allRows.filter((r) => r.session_id === row.session_id)))
    .slice(0, MAX_PER_RUN)

  const results = await Promise.all(
    due.map(async (row) => {
      try {
        // Atomic: if the training space or the plan pipeline took it a moment ago, we skip
        const claimed = isAddonId(row.addon_id) ? await claimAddon(row.session_id, row.addon_id) : null
        if (!claimed) return { session_id: row.session_id, addon: row.addon_id, outcome: 'taken_by_another_run' }

        await runAddonGeneration(claimed, bySession.get(row.session_id)!)

        const { data: after } = await supabase
          .from('submission_addons')
          .select('status')
          .eq('session_id', row.session_id)
          .eq('addon_id', row.addon_id)
          .maybeSingle()
        return { session_id: row.session_id, addon: row.addon_id, attempt: claimed.attempts, outcome: after?.status ?? 'unknown' }
      } catch (err) {
        console.error('[cron/retry-addons] retry crashed:', row.session_id, row.addon_id, err)
        return { session_id: row.session_id, addon: row.addon_id, outcome: 'error' }
      }
    }),
  )

  const waiting = candidates.length - due.length
  console.log(`[cron/retry-addons] retried:${results.length} waiting:${waiting}`)

  return NextResponse.json({ retried: results.length, waiting, results })
}
