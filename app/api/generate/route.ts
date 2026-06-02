import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient, type SubmissionRow } from '@/lib/supabase'
import { buildPrompt } from '@/lib/prompt'
import { sendPlanEmail } from '@/lib/email'

// 300 s = Vercel Pro ceiling. The HTTP response returns immediately;
// waitUntil keeps the Claude call alive in the background.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sessionId = body.session_id as string | undefined

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('*')
    .eq('session_id', sessionId)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Idempotency guard
  if (submission.plan_status === 'generating' || submission.plan_status === 'ready') {
    return NextResponse.json({ ok: true, plan_status: submission.plan_status })
  }

  // Mark as generating synchronously so polling shows progress immediately
  await supabase
    .from('submissions')
    .update({ plan_status: 'generating' })
    .eq('session_id', sessionId)

  // Run Claude + save + email in background — HTTP response returns right away
  waitUntil(runGeneration(sessionId, submission))

  return NextResponse.json({ ok: true, plan_status: 'generating' })
}

async function runGeneration(
  sessionId: string,
  submission: SubmissionRow
) {
  const supabase = createServerClient()

  try {
    const prompt = buildPrompt(submission)

    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip markdown fence / outer <body> tags that Claude sometimes adds
    const planHtml = raw
      .replace(/^```(?:html)?\s*\n?/i, '')
      .replace(/\n?```\s*$/, '')
      .replace(/^\s*<body[^>]*>\s*/i, '')
      .replace(/\s*<\/body>\s*$/i, '')
      .trim()

    await supabase
      .from('submissions')
      .update({ plan_html: planHtml, plan_status: 'ready' })
      .eq('session_id', sessionId)

    if (submission.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      sendPlanEmail({
        to: submission.email,
        dogName: submission.dog_name ?? 'your dog',
        planUrl: `${appUrl}/plan/${sessionId}`,
      }).catch(err => console.error('[generate] sendPlanEmail failed:', err))
    }
  } catch (err) {
    console.error('[generate] background generation failed:', err)
    try {
      await supabase
        .from('submissions')
        .update({ plan_status: 'failed' })
        .eq('session_id', sessionId)
    } catch { /* best-effort */ }
  }
}
