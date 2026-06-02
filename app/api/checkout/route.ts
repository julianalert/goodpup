import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_CENTS } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let session_id: string

  try {
    const body = await req.json()
    session_id = body.session_id
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(session_id)) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const supabase = createServerClient()

  // Fetch submission to personalise the product description and pre-fill email
  const { data: submission } = await supabase
    .from('submissions')
    .select('dog_name, dog_breed, dog_age, email')
    .eq('session_id', session_id)
    .maybeSingle()

  const dogName  = submission?.dog_name  ?? 'your dog'
  const dogBreed = submission?.dog_breed ?? ''
  const email    = submission?.email     ?? undefined

  // Build a human-readable product description
  const description = [dogBreed, dogName].filter(Boolean).join(' · ')

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PawPlan — Personalized 30-Day Training Plan',
              description: description || undefined,
            },
            unit_amount: PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      // Pre-fill customer email if we have it
      ...(email ? { customer_email: email } : {}),
      // Link back to our submission row via metadata
      metadata: { session_id },
      // Stripe replaces {CHECKOUT_SESSION_ID} with the real ID at redirect time
      success_url: `${appUrl}/success?stripe_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/order`,
    })

    // Persist the Stripe Checkout Session ID so the webhook can find the row
    await supabase
      .from('submissions')
      .update({ stripe_session_id: checkoutSession.id })
      .eq('session_id', session_id)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[api/checkout] Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
