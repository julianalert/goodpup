import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase'
import { ADDONS, addonDog, cleanAddonIds } from '@/lib/addons'
import { addonOffers, listAddonRows } from '@/lib/addons-store'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/addons/checkout  { session_id, addons: string[] }
 *
 * A customer who already has their plan unlocks an add-on from the training
 * space. Add-ons bought together with the plan go through /api/checkout instead.
 */
export async function POST(req: NextRequest) {
  let body: { session_id?: unknown; addons?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sessionId = body.session_id
  if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: submission } = await supabase
    .from('submissions')
    .select('status, dog_name, dog_breed, email')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  // Add-ons extend a plan: there is nothing to add one to before the plan is bought
  if (submission.status !== 'paid') return NextResponse.json({ error: 'No plan to add this to' }, { status: 409 })

  const rows = await listAddonRows(sessionId)
  if (rows === null) return NextResponse.json({ error: 'Add-ons are not available yet' }, { status: 503 })

  const offers = addonOffers(submission, rows)
  const wanted = cleanAddonIds(body.addons).filter((id) => offers.includes(id))
  if (wanted.length === 0) return NextResponse.json({ error: 'Nothing to buy' }, { status: 409 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const dog = addonDog(submission.dog_name, submission.dog_breed)

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: wanted.map((id) => ({
        price_data: {
          currency: 'usd',
          // "PawCraft" stays in the name: the Stripe account is shared with other products
          product_data: { name: `PawCraft · ${ADDONS[id].title(dog)}`, description: ADDONS[id].pitch(dog) },
          unit_amount: ADDONS[id].priceCents,
        },
        quantity: 1,
      })),
      allow_promotion_codes: true,
      custom_text: {
        submit: {
          message: wanted.some((id) => ADDONS[id].intake)
            ? `One-time payment, no subscription. A few quick questions about ${dog.name} come first, then it is written from your answers.`
            : `One-time payment, no subscription. It is written for ${dog.name} right after you pay.`,
        },
      },
      ...(submission.email ? { customer_email: submission.email } : {}),
      // kind tells the webhook this is not a plan order: the plan must not be touched
      metadata: { session_id: sessionId, kind: 'addon', addons: wanted.join(',') },
      // The training space reads addon_checkout to confirm the payment and open the Profile tab
      success_url: `${appUrl}/plan/${sessionId}?addon_checkout={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/plan/${sessionId}#addons`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('[api/addons/checkout] Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
