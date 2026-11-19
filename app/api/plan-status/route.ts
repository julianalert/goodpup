import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isGenerationStale } from '@/lib/generate-plan'

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('submissions')
    .select('session_id, plan_status, updated_at')
    .eq('session_id', sessionId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // A generation that has run past the function time limit is dead. Report it as
  // failed so /success offers "Retry", which can then claim the row again.
  const planStatus = isGenerationStale(data) ? 'failed' : (data.plan_status ?? 'pending')

  return NextResponse.json({
    session_id: data.session_id,
    plan_status: planStatus,
  })
}
