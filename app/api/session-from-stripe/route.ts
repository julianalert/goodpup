import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * GET /api/session-from-stripe?stripe_session_id=<cs_...>
 *
 * Resolves a Stripe Checkout Session ID back to the internal session_id
 * (and dog name). Used by the success page when the user arrives from an
 * email link and sessionStorage is empty — Stripe redirects back with
 * ?stripe_session_id=... which we can look up in our submissions table.
 */
export async function GET(req: NextRequest) {
  const stripeSessionId = req.nextUrl.searchParams.get('stripe_session_id')

  if (!stripeSessionId || !stripeSessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid stripe_session_id' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('submissions')
      .select('session_id, dog_name')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle()

    if (error) {
      console.error('[api/session-from-stripe] Supabase error:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      session_id: data.session_id,
      dog_name: data.dog_name ?? null,
    })
  } catch (err) {
    console.error('[api/session-from-stripe] Unexpected error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
