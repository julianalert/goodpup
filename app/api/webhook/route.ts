import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { PRICE_CENTS } from '@/lib/pricing'
import { createServerClient, type SubmissionRow } from '@/lib/supabase'
import { setUserProfile, trackServerEvent } from '@/lib/mixpanel-server'
import { claimGeneration, runGeneration } from '@/lib/generate-plan'
import { grantAddonsFromCheckout, notifyAddonIntake } from '@/lib/addons-store'
import { startDueAddons } from '@/lib/addons-generate'

// Plan generation runs in the background of this request (waitUntil below),
// so the function must be allowed to outlive the response by a few minutes.
export const maxDuration = 300

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

    // Only process completed orders. 'paid' is the normal case; 'no_payment_required'
    // is a checkout whose total came to $0 because of a 100%-off promotion code,
    // which is still an order that must receive its plan.
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return NextResponse.json({ received: true })
    }

    const session_id = session.metadata?.session_id
    if (!session_id) {
      console.error('[webhook] checkout.session.completed missing metadata.session_id', session.id)
      return NextResponse.json({ error: 'Missing session_id in metadata' }, { status: 400 })
    }

    const supabase = createServerClient()

    // ── An add-on unlocked from the training space ─────────────────────────
    // Not a plan order: the plan is already paid for and delivered, so nothing
    // about it is touched. Record the add-on as paid and start writing it.
    if (session.metadata?.kind === 'addon') {
      try {
        const granted = await grantAddonsFromCheckout(session)
        trackServerEvent(session_id, 'addon_purchased', {
          stripe_session_id: session.id,
          addons: granted.join(','),
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? 'usd',
          source: 'training_space',
        })
      } catch (err) {
        console.error('[webhook] could not record add-on purchase:', err)
        // Return 500 so Stripe retries the webhook
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      try {
        const { data: submission } = await supabase
          .from('submissions')
          .select('*')
          .eq('session_id', session_id)
          .maybeSingle<SubmissionRow>()
        // The training space asks for the same thing when the buyer lands back
        // on it; the claim makes sure only one of the two generates.
        if (submission) for (const generation of await startDueAddons(submission)) waitUntil(generation)
        // One that needs answers first is not started: the buyer is emailed to give them
        waitUntil(notifyAddonIntake(session_id))
      } catch (err) {
        console.error('[webhook] could not start add-on generation:', err)
      }
      return NextResponse.json({ received: true })
    }

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

    const amountTotal = session.amount_total ?? PRICE_CENTS
    trackServerEvent(session_id, 'payment_completed', {
      stripe_session_id: session.id,
      amount: amountTotal / 100,
      currency: session.currency ?? 'usd',
      addons: session.metadata?.addons ?? '',
    })

    if (session.customer_email) {
      setUserProfile(session_id, { $email: session.customer_email })
    }

    // Start the plan here, not only from the buyer's browser: someone who closes the
    // tab right after paying still gets their plan and the email. /success asks for
    // the same thing; the claim makes sure only one of the two actually generates.
    // Stripe gets its 200 straight away, generation continues in the background.
    try {
      const claimed = await claimGeneration(session_id)
      if (claimed) waitUntil(runGeneration(claimed))
    } catch (err) {
      // The order is recorded as paid; /success (or its retry button) can still start it
      console.error('[webhook] could not start plan generation:', err)
    }

    // Add-ons bought with the plan: record them as paid. This comes after the plan
    // has been started, so nothing here can delay or fail it. They are written
    // once the plan is ready (runGeneration asks for them when it finishes).
    try {
      const granted = await grantAddonsFromCheckout(session)
      if (granted.length > 0) {
        trackServerEvent(session_id, 'addon_purchased', {
          stripe_session_id: session.id,
          addons: granted.join(','),
          source: 'order_page',
        })
      }
    } catch (err) {
      console.error('[webhook] could not record add-ons:', err)
      // The buyer paid for them: return 500 so Stripe retries the webhook. The
      // retry is harmless for the plan, which is already claimed.
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }
  }

  // Return 200 for all other event types so Stripe stops retrying them
  return NextResponse.json({ received: true })
}
