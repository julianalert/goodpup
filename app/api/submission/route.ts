import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, SubmissionRow } from '@/lib/supabase'

// Allowed field names — whitelist to prevent clients injecting arbitrary columns
const ALLOWED_FIELDS: (keyof SubmissionRow)[] = [
  'session_id',
  'dog_name',
  'dog_breed',
  'dog_age',
  'problems',
  'problem_context',
  'experience',
  'living',
  'daily_time',
  'training_history',
  'email',
  'current_step',
  'status',
]

// Traffic source sent by the browser (lib/attribution.ts). Only ever written when
// the row is created, so a later visit can't rewrite where a lead came from.
const ATTRIBUTION_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'referrer',
  'landing_page',
] as const

type AttributionColumns = Partial<Record<(typeof ATTRIBUTION_FIELDS)[number], string>>

function readAttribution(value: unknown): AttributionColumns {
  const out: AttributionColumns = {}
  if (!value || typeof value !== 'object') return out

  for (const key of ATTRIBUTION_FIELDS) {
    const raw = (value as Record<string, unknown>)[key]
    if (typeof raw !== 'string') continue
    let text = raw.trim().slice(0, 200)
    // "Facebook" and "facebook" are the same source in the report
    if (key === 'utm_source' || key === 'utm_medium') text = text.toLowerCase()
    if (text) out[key] = text
  }
  return out
}

// Create the row unless one already exists for this session_id (then nothing
// changes). Returns whether a row was created.
async function insertIfMissing(
  supabase: ReturnType<typeof createServerClient>,
  row: Partial<SubmissionRow>,
  attribution: AttributionColumns,
): Promise<{ created: boolean; error: string | null }> {
  const attempt = (values: Partial<SubmissionRow>) =>
    supabase
      .from('submissions')
      .upsert(values as SubmissionRow, { onConflict: 'session_id', ignoreDuplicates: true })
      .select('session_id')

  let { data, error } = await attempt({ ...row, ...attribution })

  // Before migration 007 the traffic-source columns don't exist. Losing the source
  // is fine; losing the row is not — so save it without them.
  if (error && Object.keys(attribution).length > 0) {
    console.warn('[api/submission] saving without traffic source (run migration 007?):', error.message)
    ;({ data, error } = await attempt(row))
  }

  return { created: Boolean(data && data.length > 0), error: error?.message ?? null }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // session_id is required — it's the upsert key
  if (!body.session_id || typeof body.session_id !== 'string') {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  // Validate session_id is a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(body.session_id)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  const sessionId = body.session_id
  const attribution = readAttribution(body.attribution)

  // ── Quiz opened ──────────────────────────────────────────────────────────
  // Sent once when /start loads. Creates the row at current_step 0 so the admin
  // funnel can count opens, stamped with the traffic source. A returning visitor reuses their session_id, so the
  // insert is skipped (never a second row, never a reset of their progress) and
  // we report the existing row's status instead.
  if (body.event === 'open') {
    try {
      const supabase = createServerClient()

      const { created, error } = await insertIfMissing(
        supabase,
        { session_id: sessionId, current_step: 0 },
        attribution,
      )

      if (error) {
        console.error('[api/submission] Supabase error (open):', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      if (created) {
        return NextResponse.json({ ok: true, created: true, status: 'partial' })
      }

      const { data: existing } = await supabase
        .from('submissions')
        .select('status')
        .eq('session_id', sessionId)
        .maybeSingle()

      return NextResponse.json({ ok: true, created: false, status: existing?.status ?? 'partial' })
    } catch (err) {
      console.error('[api/submission] Unexpected error (open):', err)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
  }

  // ── Step save ────────────────────────────────────────────────────────────
  // Strip any keys that are not in the whitelist
  const payload: Partial<SubmissionRow> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      // @ts-expect-error dynamic key assignment
      payload[key] = body[key]
    }
  }

  // status can only be 'partial' or 'completed' from the client
  if (payload.status && !['partial', 'completed'].includes(payload.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    // Update the visitor's existing row. Paid rows are never touched: a browser
    // that still remembers an old session must not downgrade a paid order.
    const { data: updated, error } = await supabase
      .from('submissions')
      .update(payload)
      .eq('session_id', sessionId)
      .neq('status', 'paid')
      .select('session_id')

    if (error) {
      console.error('[api/submission] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Nothing updated: either the row doesn't exist yet (the open ping was lost)
    // or it is paid. Insert-if-missing covers the first and leaves the second alone.
    if (!updated || updated.length === 0) {
      const { error: insertError } = await insertIfMissing(supabase, payload, attribution)

      if (insertError) {
        console.error('[api/submission] Supabase error:', insertError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/submission] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
