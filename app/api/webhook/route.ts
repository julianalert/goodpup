import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import { setUserProfile, trackServerEvent } from '@/lib/mixpanel-server'

// Next.js App Router streams the body — we read it as raw text so Stripe can
// verify the signature. No bodyParser config needed (unlike Pages Router).
export async function POST(req: NextRequest) {
  const rawBody  = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Handle events ────────────────────────────────────────────────────────

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Only process paid sessions (mode=payment is always 'paid' on completion,
    // but guard against subscription free trials etc.)
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const session_id = session.metadata?.session_id
    if (!session_id) {
      console.error('[webhook] checkout.session.completed missing metadata.session_id', session.id)
      return NextResponse.json({ error: 'Missing session_id in metadata' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent as string ?? null,
        recovery_suppressed: true, // stop abandoned-cart email sequence immediately
      })
      .eq('session_id', session_id)

    if (error) {
      console.error('[webhook] DB update failed:', error.message)
      // Return 500 so Stripe retries the webhook
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    console.log(`[webhook] Submission ${session_id} marked as paid`)

    const amountTotal = session.amount_total ?? 1700
    trackServerEvent(session_id, 'payment_completed', {
      stripe_session_id: session.id,
      amount: amountTotal / 100,
      currency: session.currency ?? 'usd',
    })

    if (session.customer_email) {
      setUserProfile(session_id, { $email: session.customer_email })
    }
  }

  // Return 200 for all other event types so Stripe stops retrying them
  return NextResponse.json({ received: true })
}
