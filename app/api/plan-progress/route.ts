import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { PROGRESS_KEY_PATTERNS, type ProgressKind } from '@/lib/plan-types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FEELS = ['tough', 'ok', 'nailed']
const MAX_NOTE = 600

/**
 * Keeps only the fields each kind of progress is allowed to carry, so what lands
 * in the database is exactly what the page reads back. Returns null if unusable.
 */
function sanitize(kind: ProgressKind, raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>

  switch (kind) {
    case 'exercise': {
      const steps = Array.isArray(v.steps)
        ? [...new Set(v.steps.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < 10))]
        : []
      return { done: v.done === true, steps }
    }
    case 'day': {
      const feel = typeof v.feel === 'string' && FEELS.includes(v.feel) ? v.feel : undefined
      const note = typeof v.note === 'string' ? v.note.trim().slice(0, MAX_NOTE) : undefined
      return { done: v.done === true, ...(feel ? { feel } : {}), ...(note ? { note } : {}), at: new Date().toISOString() }
    }
    case 'milestone':
      return { done: v.done === true }
    case 'rating': {
      const score = Number(v.score)
      if (!Number.isInteger(score) || score < 1 || score > 10) return null
      return { score, at: new Date().toISOString() }
    }
  }
}

/**
 * POST /api/plan-progress  { session_id, kind, key, value }
 *
 * Saves one piece of progress from the training space (an exercise ticked, a day's
 * check-in, a milestone, a behaviour rating). Writing the same key again replaces it.
 * The plan link is the credential, as it is for reading the plan; only paid plans
 * can record progress.
 */
export async function POST(req: NextRequest) {
  let body: { session_id?: unknown; kind?: unknown; key?: unknown; value?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id: sessionId, kind, key } = body
  if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }
  if (typeof kind !== 'string' || !(kind in PROGRESS_KEY_PATTERNS)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }
  const progressKind = kind as ProgressKind
  if (typeof key !== 'string' || !PROGRESS_KEY_PATTERNS[progressKind].test(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }
  const value = sanitize(progressKind, body.value)
  if (!value) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: submission } = await supabase
    .from('submissions')
    // Only the version number of the plan, not the whole document
    .select('status, plan_status, plan_version:plan_json->version')
    .eq('session_id', sessionId)
    .maybeSingle()

  // Progress belongs to the training space: plans delivered as a plain document have none
  if (!submission || submission.status !== 'paid' || submission.plan_status !== 'ready' || submission.plan_version !== 2) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('plan_progress')
    .upsert({ session_id: sessionId, kind: progressKind, key, value }, { onConflict: 'session_id,kind,key' })

  if (error) {
    console.error('[api/plan-progress] save failed:', error.message)
    return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, value })
}
