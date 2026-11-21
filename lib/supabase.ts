import { createClient } from '@supabase/supabase-js'

// ── Server-side client (service role) ─────────────────────────────────────
// Only import this in API routes (app/api/**). Never in client components.
// The service_role key bypasses RLS — keep it strictly server-side.

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.'
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SubmissionStatus = 'partial' | 'completed' | 'paid'
export type PlanStatus = 'pending' | 'generating' | 'ready' | 'failed'

export interface SubmissionRow {
  session_id: string
  dog_name?: string | null
  dog_breed?: string | null
  dog_age?: string | null
  problems?: string[] | null
  problem_context?: string | null
  experience?: string | null
  living?: string | null
  daily_time?: number | null
  training_history?: string | null
  email?: string | null
  current_step: number
  status: SubmissionStatus
  // Plan generation
  plan_html?: string | null
  plan_json?: unknown              // structured plan (migration 005); absent until that migration has run
  plan_status?: PlanStatus | null
  plan_attempts?: number | null   // generation attempts so far (migration 004)
  // Training space (migration 006); absent until that migration has run
  plan_ready_at?: string | null
  reminders_enabled?: boolean | null
  reminder_hour?: number | null
  timezone?: string | null
  last_reminder_at?: string | null
  reminders_unanswered?: number | null
  dog_photo?: string | null
  // Stripe
  stripe_session_id?: string | null
  stripe_payment_intent_id?: string | null
  // Recovery email sequence
  recovery_emails_sent?: number | null   // 0–4 — how many abandoned-cart emails sent
  recovery_suppressed?: boolean | null   // true = stop sending (paid or unsubscribed)

  // Traffic source (migration 007); set once when the row is created
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  referrer?: string | null       // hostname of the referring site
  landing_page?: string | null   // first page the visitor landed on

  // Timestamps
  created_at?: string | null
  updated_at?: string | null   // bumped by the database on every write
}
