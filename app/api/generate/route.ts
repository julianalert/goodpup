import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { buildPrompt } from '@/lib/prompt'
import { sendPlanEmail } from '@/lib/email'

// Give Vercel Pro / serverless functions up to 120 s to run
export const maxDuration = 120

export async function POST(req: NextRequest) {
  let sessionId: string | undefined

  try {
    const body = await req.json()
    sessionId = body.session_id as string | undefined

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Idempotency guard — if already generating or ready, return immediately
    if (submission.plan_status === 'generating' || submission.plan_status === 'ready') {
      return NextResponse.json({ ok: true, plan_status: submission.plan_status })
    }

    // Mark as generating so the polling UI can show progress
    await supabase
      .from('submissions')
      .update({ plan_status: 'generating' })
      .eq('session_id', sessionId)

    // Build the prompt
    const prompt = buildPrompt(submission)

    // Call Claude
    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const planHtml =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Save the generated HTML and mark as ready
    await supabase
      .from('submissions')
      .update({ plan_html: planHtml, plan_status: 'ready' })
      .eq('session_id', sessionId)

    // Send the email (fire-and-forget — don't let email failure block the response)
    if (submission.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const planUrl = `${appUrl}/plan/${sessionId}`
      sendPlanEmail({
        to: submission.email,
        dogName: submission.dog_name ?? 'your dog',
        planUrl,
      }).catch(err => console.error('[generate] sendPlanEmail failed:', err))
    }

    return NextResponse.json({ ok: true, plan_status: 'ready' })
  } catch (err) {
    console.error('[generate] error:', err)

    // Mark as failed so the UI can surface a retry button
    if (sessionId) {
      try {
        const supabase = createServerClient()
        await supabase
          .from('submissions')
          .update({ plan_status: 'failed' })
          .eq('session_id', sessionId)
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({ error: 'Plan generation failed' }, { status: 500 })
  }
}
