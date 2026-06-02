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

    const { error } = await supabase
      .from('submissions')
      .upsert(payload as SubmissionRow, { onConflict: 'session_id' })

    if (error) {
      console.error('[api/submission] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/submission] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
