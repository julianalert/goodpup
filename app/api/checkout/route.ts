import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICE_CENTS } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import { ADDONS, addonDog, cleanAddonIds, type AddonId } from '@/lib/addons'
import { addonOffers, listAddonRows } from '@/lib/addons-store'

export async function POST(req: NextRequest) {
  let session_id: string
  let requestedAddons: AddonId[] = []

  try {
    const body = await req.json()
    session_id = body.session_id
    // Add-ons ticked on the order page, e.g. ['breed_handbook']
    requestedAddons = cleanAddonIds(body.addons)
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

  const dogName  = submission?.dog_name?.trim()  ?? ''
  const dogBreed = submission?.dog_breed?.trim() ?? ''
  const email    = submission?.email     ?? undefined

  // What the buyer reads on Stripe's page, left of the card form.
  // "PawCraft" stays in the name: the Stripe account is shared with other products,
  // so it is what identifies this purchase on the page, the receipt and the dashboard.
  const productName = dogName
    ? `PawCraft · ${dogName}'s 30-Day Training Plan`
    : 'PawCraft · Personalized 30-Day Training Plan'

  const contents = 'temperament profile, 30 daily sessions with step-by-step exercises, progress tracking and a toolkit for the hard moments'
  const description = dogName
    ? `Built for ${dogName}${dogBreed ? `, your ${dogBreed}` : ''}: ${contents}.`
    : `${contents.charAt(0).toUpperCase()}${contents.slice(1)}.`

  // Add-ons bought with the plan. Only what can really be delivered is charged:
  // the add-on must exist for this dog, and the database must be able to record it
  // (listAddonRows is null until migration 008 has run). A lookup problem here
  // drops the add-on, never the order.
  let addons: AddonId[] = []
  if (requestedAddons.length > 0 && submission) {
    const owned = await listAddonRows(session_id)
    if (owned) {
      const offers = addonOffers(submission, owned)
      addons = requestedAddons.filter((id) => offers.includes(id))
    }
  }
  const dog = addonDog(dogName, dogBreed)

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description,
            },
            unit_amount: PRICE_CENTS,
          },
          quantity: 1,
        },
        ...addons.map((id) => ({
          price_data: {
            currency: 'usd',
            product_data: { name: `PawCraft · ${ADDONS[id].title(dog)}`, description: ADDONS[id].pitch(dog) },
            unit_amount: ADDONS[id].priceCents,
          },
          quantity: 1,
        })),
      ],
      // Shows Stripe's "Add promotion code" field. It accepts the customer-facing
      // promotion codes attached to a coupon in the Stripe dashboard.
      allow_promotion_codes: true,
      // Reassurance shown right above the Pay button
      custom_text: {
        submit: {
          message: 'One-time payment, no subscription. Your plan arrives by email in a few minutes.',
        },
      },
      // Pre-fill customer email if we have it
      ...(email ? { customer_email: email } : {}),
      // Link back to our submission row via metadata. `addons` is what the webhook
      // records as paid once the checkout completes.
      metadata: { session_id, ...(addons.length > 0 ? { addons: addons.join(',') } : {}) },
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
