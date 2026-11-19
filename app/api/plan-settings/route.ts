import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isValidTimezone } from '@/lib/plan-reminders'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// The browser shrinks the photo to a small square before sending; this is a ceiling, not a target
const PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
const MAX_PHOTO_CHARS = 200_000

/**
 * POST /api/plan-settings  { session_id, reminders_enabled?, reminder_hour?, timezone?, dog_photo? }
 *
 * Saves the customer's choices for their training space. Send only the fields that
 * change. The plan link is the credential, as everywhere else in the space.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sessionId = body.session_id
  if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}

  if ('reminders_enabled' in body) {
    if (typeof body.reminders_enabled !== 'boolean') return NextResponse.json({ error: 'Invalid reminders_enabled' }, { status: 400 })
    update.reminders_enabled = body.reminders_enabled
    // Turning them back on is a fresh start
    if (body.reminders_enabled) update.reminders_unanswered = 0
  }
  if ('reminder_hour' in body) {
    const hour = body.reminder_hour
    if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ error: 'Invalid reminder_hour' }, { status: 400 })
    }
    update.reminder_hour = hour
  }
  if ('timezone' in body) {
    if (!isValidTimezone(body.timezone as string)) return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
    update.timezone = body.timezone
  }
  if ('dog_photo' in body) {
    const photo = body.dog_photo
    if (photo !== null && (typeof photo !== 'string' || photo.length > MAX_PHOTO_CHARS || !PHOTO_PATTERN.test(photo))) {
      return NextResponse.json({ error: 'Invalid dog_photo' }, { status: 400 })
    }
    update.dog_photo = photo
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })
  }

  const { data, error } = await createServerClient()
    .from('submissions')
    .update(update)
    .eq('session_id', sessionId)
    .eq('status', 'paid')
    .select('session_id')

  if (error) {
    console.error('[api/plan-settings] save failed:', error.message)
    return NextResponse.json({ error: 'Could not save' }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
