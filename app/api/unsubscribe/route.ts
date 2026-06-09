import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/unsubscribe?session_id=<uuid>
 *
 * One-click unsubscribe for the abandoned-cart recovery email sequence.
 * Sets recovery_suppressed = true and returns a simple HTML confirmation.
 * Required by CAN-SPAM / GDPR — linked from every recovery email footer.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return new NextResponse(errorPage('Invalid unsubscribe link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('submissions')
      .update({ recovery_suppressed: true })
      .eq('session_id', sessionId)

    if (error) {
      console.error('[api/unsubscribe] Supabase error:', error.message)
      return new NextResponse(errorPage('Something went wrong. Please try again or reply to any of our emails.'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return new NextResponse(successPage(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    console.error('[api/unsubscribe] Unexpected error:', err)
    return new NextResponse(errorPage('Something went wrong.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

function successPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Unsubscribed — PawCraft</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; background: #F9F7F3; color: #1C1C1A; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { background: white; border: 1px solid rgba(28,28,26,0.1); border-radius: 16px; padding: 40px 36px; max-width: 440px; text-align: center; }
  .icon { font-size: 36px; margin-bottom: 16px; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 10px; }
  p { font-size: 14px; color: #4A4A44; line-height: 1.65; margin-bottom: 12px; }
  a { color: #1A6B4A; text-decoration: none; font-weight: 500; }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>You've been unsubscribed</h1>
    <p>We won't send any more follow-up emails about your dog's plan.</p>
    <p>If you change your mind, you can always <a href="https://mypawcraft.com">start a new plan</a> — it only takes a couple of minutes.</p>
    <p style="margin-bottom:0;font-size:12px;color:#8A8A82;">— Julian @ PawCraft</p>
  </div>
</body>
</html>`
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>PawCraft</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #F9F7F3; color: #1C1C1A; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .card { background: white; border: 1px solid rgba(28,28,26,0.1); border-radius: 16px; padding: 40px 36px; max-width: 440px; text-align: center; }
  p { font-size: 14px; color: #4A4A44; line-height: 1.65; }
  a { color: #1A6B4A; }
</style>
</head>
<body>
  <div class="card">
    <p>${message} You can also reply to any email to unsubscribe — <a href="mailto:hello@mypawcraft.com">hello@mypawcraft.com</a>.</p>
  </div>
</body>
</html>`
}
