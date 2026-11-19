import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'
import { isPlanV2, properName } from '@/lib/plan-types'
import { decideReminder, DEFAULT_REMINDER_HOUR } from '@/lib/plan-reminders'
import { buildReminderEmail, withPreviewText } from '@/lib/plan-emails'
import { SITE_URL, SITE_EMAIL } from '@/lib/site'

export const maxDuration = 120

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` — we verify it.
// In local development (CRON_SECRET unset) the check is skipped.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * GET /api/cron/plan-reminders — every hour (vercel.json)
 *
 * Sends each customer at most one email a day, at the hour they chose on their own
 * clock: today's session, or a gentler "pick it back up" note after a few days away.
 * Only for plans in the training space (structured plans); the rules live in
 * lib/plan-reminders.ts. Add ?dry=1 to see what would be sent without sending.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.has('dry')
  const supabase = createServerClient()
  const now = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL

  const { data: candidates, error } = await supabase
    .from('submissions')
    .select('session_id, email, dog_name, reminders_enabled, reminder_hour, timezone, plan_ready_at, last_reminder_at, reminders_unanswered, plan_version:plan_json->version')
    .eq('status', 'paid')
    .eq('plan_status', 'ready')
    .eq('reminders_enabled', true)
    .not('email', 'is', null)
    .not('plan_json', 'is', null)
    .limit(1000)

  if (error) {
    console.error('[cron/plan-reminders] query failed — has supabase/migrations/006_plan_reminders.sql been run?', error.message)
    return NextResponse.json(
      { error: 'Query failed. Run supabase/migrations/006_plan_reminders.sql if you have not yet.', detail: error.message },
      { status: 500 },
    )
  }

  const resend = dryRun ? null : new Resend(process.env.RESEND_API_KEY)
  const results: { session_id: string; outcome: string; kind?: string; day?: number; subject?: string }[] = []

  for (const row of candidates ?? []) {
    if (row.plan_version !== 2) continue

    const base = {
      now,
      remindersEnabled: row.reminders_enabled !== false,
      reminderHour: row.reminder_hour ?? DEFAULT_REMINDER_HOUR,
      timezone: row.timezone,
      planReadyAt: row.plan_ready_at,
      lastReminderAt: row.last_reminder_at,
      remindersUnanswered: row.reminders_unanswered ?? 0,
    }

    // Cheap first pass with no progress loaded: wrong hour or already reminded today
    // rules most plans out without another query.
    const quick = decideReminder({ ...base, doneDays: [] })
    if (!quick.send && ['not their reminder hour', 'already reminded today'].includes(quick.reason)) continue

    try {
      const { data: dayRows } = await supabase
        .from('plan_progress')
        .select('key, value')
        .eq('session_id', row.session_id)
        .eq('kind', 'day')

      const doneDays = (dayRows ?? [])
        .filter((r) => (r.value as { done?: boolean })?.done === true)
        .map((r) => ({ day: Number(r.key.slice(1)), at: String((r.value as { at?: string }).at ?? '') }))

      const decision = decideReminder({ ...base, doneDays })
      if (!decision.send) {
        results.push({ session_id: row.session_id, outcome: `skip: ${decision.reason}` })
        continue
      }

      const { data: planRow } = await supabase
        .from('submissions')
        .select('plan_json')
        .eq('session_id', row.session_id)
        .maybeSingle()
      const plan = isPlanV2(planRow?.plan_json) ? planRow.plan_json : null
      const day = plan?.days[decision.day - 1]
      if (!day) {
        results.push({ session_id: row.session_id, outcome: 'skip: plan has no such day' })
        continue
      }

      const planUrl = `${appUrl}/plan/${row.session_id}`
      const offUrl = `${appUrl}/api/plan-reminders/off?session_id=${row.session_id}`
      const email = buildReminderEmail({
        kind: decision.kind,
        dogName: properName(row.dog_name, 'your dog'),
        day,
        planUrl,
        offUrl,
        weekJustCompleted: decision.weekJustCompleted,
      })

      if (resend) {
        const sent = await resend.emails.send({
          from: `Julian @ PawCraft <${SITE_EMAIL}>`,
          to: row.email!,
          subject: email.subject,
          html: withPreviewText(email.html, email.previewText),
          headers: { 'List-Unsubscribe': `<${offUrl}>` },
        })
        if (sent.error) {
          console.error(`[cron/plan-reminders] Resend error for ${row.session_id}:`, sent.error)
          results.push({ session_id: row.session_id, outcome: 'resend_error' })
          continue
        }

        await supabase
          .from('submissions')
          .update({ last_reminder_at: now.toISOString(), reminders_unanswered: decision.unanswered })
          .eq('session_id', row.session_id)
      }

      results.push({
        session_id: row.session_id,
        outcome: dryRun ? 'would_send' : 'sent',
        kind: decision.kind,
        day: decision.day,
        subject: email.subject,
      })
    } catch (err) {
      console.error('[cron/plan-reminders] failed for', row.session_id, err)
      results.push({ session_id: row.session_id, outcome: 'error' })
    }
  }

  const sent = results.filter((r) => r.outcome === 'sent' || r.outcome === 'would_send').length
  console.log(`[cron/plan-reminders] ${dryRun ? 'dry run, ' : ''}checked:${candidates?.length ?? 0} sent:${sent}`)

  return NextResponse.json({ dry_run: dryRun, checked: candidates?.length ?? 0, sent, results })
}
