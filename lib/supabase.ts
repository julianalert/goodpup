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
}
