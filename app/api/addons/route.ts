import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { addonOffers, addonStates, listAddonRows } from '@/lib/addons-store'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/addons?session_id=<uuid>[&content=1]
 *
 * - offers: the add-ons this customer can buy now. The order page shows only
 *   these, so nothing is sold before the database can record it (migration 008)
 *   or for a dog it cannot be made for.
 * - addons: for a paid order, every add-on with its state, as the training space
 *   shows it. With content=1, the ready ones come with their content.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }
  const withContent = req.nextUrl.searchParams.get('content') === '1'

  const { data: submission, error } = await createServerClient()
    .from('submissions')
    .select('session_id, status, dog_name, dog_breed')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 })
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const paid = submission.status === 'paid'
  const rows = await listAddonRows(sessionId, withContent && paid)
  // The table is not there yet: add-ons do not exist as far as anyone can tell
  if (rows === null) return NextResponse.json({ offers: [], addons: [] })

  return NextResponse.json({
    offers: addonOffers(submission, rows),
    addons: paid ? addonStates(submission, rows) : [],
  })
}
