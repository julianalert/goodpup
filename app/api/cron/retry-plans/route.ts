import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  claimGeneration,
  runGeneration,
  isRetryDue,
  GENERATION_STALE_MS,
  MAX_AUTO_ATTEMPTS,
} from '@/lib/generate-plan'

// Generation runs inside this request (two plans at most, side by side)
export const maxDuration = 300

// Plans generated per sweep. Each takes 1.5–4.5 minutes of the 5 the function has.
const MAX_PER_RUN = 2

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` — we verify it.
// In local development (CRON_SECRET unset) the check is skipped.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * GET /api/cron/retry-plans — every 5 minutes (vercel.json)
 *
 * The safety net behind "a paid order always gets its plan". Finds paid orders
 * whose plan is not ready (failed, died mid-run, or never started) and generates
 * them again, with a growing pause between tries and a hard stop after
 * MAX_AUTO_ATTEMPTS, at which point runGeneration emails us.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const staleBefore = new Date(Date.now() - GENERATION_STALE_MS).toISOString()

  const { data: candidates, error } = await supabase
    .from('submissions')
    .select('session_id, plan_status, plan_attempts, updated_at')
    .eq('status', 'paid')
    .lt('plan_attempts', MAX_AUTO_ATTEMPTS)
    .or(`plan_status.in.(pending,failed),and(plan_status.eq.generating,updated_at.lt."${staleBefore}")`)
    .order('updated_at', { ascending: true })
    .limit(50)

  if (error) {
    // Most likely cause: migration 004 (plan_attempts column) has not been run yet
    console.error('[cron/retry-plans] query failed — has supabase/migrations/004_plan_attempts.sql been run?', error.message)
    return NextResponse.json(
      { error: 'Query failed. Run supabase/migrations/004_plan_attempts.sql if you have not yet.', detail: error.message },
      { status: 500 },
    )
  }

  const due = (candidates ?? []).filter((row) => isRetryDue(row)).slice(0, MAX_PER_RUN)

  const results = await Promise.all(
    due.map(async (row) => {
      try {
        // Atomic: if the buyer's browser or the webhook took it a moment ago, we skip
        const claimed = await claimGeneration(row.session_id)
        if (!claimed) return { session_id: row.session_id, outcome: 'taken_by_another_run' }

        await runGeneration(claimed)

        const { data: after } = await supabase
          .from('submissions')
          .select('plan_status')
          .eq('session_id', row.session_id)
          .maybeSingle()
        return { session_id: row.session_id, attempt: claimed.plan_attempts ?? null, outcome: after?.plan_status ?? 'unknown' }
      } catch (err) {
        console.error('[cron/retry-plans] retry crashed:', row.session_id, err)
        return { session_id: row.session_id, outcome: 'error' }
      }
    }),
  )

  const waiting = (candidates?.length ?? 0) - due.length
  console.log(`[cron/retry-plans] retried:${results.length} waiting:${waiting}`)

  return NextResponse.json({ retried: results.length, waiting, results })
}
