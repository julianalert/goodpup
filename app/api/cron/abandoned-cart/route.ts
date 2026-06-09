import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'
import {
  RECOVERY_EMAIL_SEQUENCE,
  RECOVERY_EMAIL_DELAYS_MINUTES,
  type RecoveryEmailData,
} from '@/lib/recovery-emails'

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` — we verify it.
// In local development (CRON_SECRET unset) the check is skipped so you can
// hit the route directly with curl or fetch.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // dev / local — no secret configured
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = new Date()
  const results: Array<{ session_id: string; emailIndex: number; outcome: string }> = []

  // ── Find all submissions eligible for the next recovery email ────────────
  //
  // We fetch all unpaid, unsuppressed submissions that have an email address
  // and haven't finished the sequence yet (recovery_emails_sent < 4).
  // We check timing client-side because Supabase JS doesn't support complex
  // interval OR conditions in a single filter call.
  //
  // Max 200 rows per run to stay within Vercel function memory/time limits.

  const { data: candidates, error } = await supabase
    .from('submissions')
    .select('session_id, dog_name, dog_breed, dog_age, problems, daily_time, living, email, recovery_emails_sent, created_at')
    .eq('recovery_suppressed', false)
    .neq('status', 'paid')
    .not('email', 'is', null)
    .lt('recovery_emails_sent', RECOVERY_EMAIL_SEQUENCE.length)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('[cron/abandoned-cart] Supabase fetch error:', error.message)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  // ── Process each candidate ───────────────────────────────────────────────

  for (const row of candidates) {
    const emailIndex: number = row.recovery_emails_sent ?? 0
    const delayMinutes = RECOVERY_EMAIL_DELAYS_MINUTES[emailIndex]
    const createdAt = new Date(row.created_at)
    const dueAt = new Date(createdAt.getTime() + delayMinutes * 60 * 1000)

    if (now < dueAt) {
      results.push({ session_id: row.session_id, emailIndex, outcome: 'not_due_yet' })
      continue
    }

    const data: RecoveryEmailData = {
      sessionId:  row.session_id,
      dogName:    row.dog_name    ?? 'your dog',
      dogBreed:   row.dog_breed   ?? 'your dog\'s breed',
      dogAge:     row.dog_age     ?? null,
      problems:   row.problems    ?? [],
      dailyTime:  row.daily_time  ?? null,
      living:     row.living      ?? null,
      email:      row.email!,
    }

    const { subject, previewText, html } = RECOVERY_EMAIL_SEQUENCE[emailIndex](data)

    try {
      const sendResult = await resend.emails.send({
        from:    'Julian @ PawCraft <hello@mypawcraft.com>',
        to:      data.email,
        subject,
        html:    addPreviewText(html, previewText),
        headers: {
          'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mypawcraft.com'}/api/unsubscribe?session_id=${row.session_id}>`,
        },
      })

      if (sendResult.error) {
        console.error(`[cron/abandoned-cart] Resend error for ${row.session_id}:`, sendResult.error)
        results.push({ session_id: row.session_id, emailIndex, outcome: 'resend_error' })
        continue
      }

      // Increment the counter — even if status changed since we fetched,
      // the update will still succeed; the webhook suppression check stops
      // future emails regardless.
      await supabase
        .from('submissions')
        .update({ recovery_emails_sent: emailIndex + 1 })
        .eq('session_id', row.session_id)

      results.push({ session_id: row.session_id, emailIndex, outcome: 'sent' })
    } catch (err) {
      console.error(`[cron/abandoned-cart] Unexpected error for ${row.session_id}:`, err)
      results.push({ session_id: row.session_id, emailIndex, outcome: 'error' })
    }
  }

  const sent    = results.filter((r) => r.outcome === 'sent').length
  const skipped = results.filter((r) => r.outcome === 'not_due_yet').length
  const failed  = results.filter((r) => r.outcome !== 'sent' && r.outcome !== 'not_due_yet').length

  console.log(`[cron/abandoned-cart] Done — sent:${sent} skipped:${skipped} failed:${failed}`)

  return NextResponse.json({ sent, skipped, failed, details: results })
}

/**
 * Injects a hidden preview-text snippet right after <body> so email clients
 * show the custom preview line instead of the first body text.
 */
function addPreviewText(html: string, previewText: string): string {
  const escaped = previewText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const snippet = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escaped}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`

  return html.replace('<body', `${snippet}<body`)
}
