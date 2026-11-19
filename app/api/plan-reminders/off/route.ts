import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { SITE_EMAIL } from '@/lib/site'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const page = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${title} — PawCraft</title>
<style>
  body { margin: 0; background: #F9F7F3; font-family: 'DM Sans', Arial, sans-serif; color: #1C1C1A; }
  main { max-width: 440px; margin: 0 auto; padding: 72px 24px; text-align: center; }
  h1 { font-family: Georgia, serif; font-size: 26px; margin: 0 0 12px; }
  p { font-size: 16px; line-height: 1.6; color: #4A4A44; margin: 0 0 20px; }
  a.btn { display: inline-block; background: #1A6B4A; color: white; text-decoration: none; padding: 14px 30px; border-radius: 99px; font-weight: 600; }
  a { color: #1A6B4A; }
</style>
</head>
<body><main><h1>${title}</h1>${body}</main></body>
</html>`

const html = (status: number, title: string, body: string) =>
  new NextResponse(page(title, body), { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

/**
 * GET or POST /api/plan-reminders/off?session_id=<uuid>
 *
 * One-click "turn reminders off", linked from every reminder email (and used by
 * mail clients through the List-Unsubscribe header). The plan itself stays available.
 */
async function turnOff(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return html(400, 'That link is not valid', `<p>Reply to any of our emails or write to ${SITE_EMAIL} and we will sort it out.</p>`)
  }

  const { error } = await createServerClient()
    .from('submissions')
    .update({ reminders_enabled: false })
    .eq('session_id', sessionId)

  if (error) {
    console.error('[api/plan-reminders/off] update failed:', error.message)
    return html(500, 'Something went wrong', `<p>Please try again, or write to ${SITE_EMAIL} and we will turn them off for you.</p>`)
  }

  return html(200, 'Reminders are off', `
    <p>You will not get any more daily emails. Your plan is still there whenever you want it, and you can turn reminders back on from the Profile tab.</p>
    <a class="btn" href="/plan/${sessionId}">Open your training space</a>`)
}

export const GET = turnOff
export const POST = turnOff
