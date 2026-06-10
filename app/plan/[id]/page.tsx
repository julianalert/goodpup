import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { PlanContent } from './PlanContent'
import './plan.css'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Re-generate at most once per 60 s (plan content never changes after it's ready)
export const revalidate = 60

interface Props {
  params: Promise<{ id: string }>
}

// Label helpers (mirrors lib/prompt.ts — kept local to avoid server/client leakage)
const AGE_LABELS: Record<string, string> = {
  puppy_under6: 'Puppy (under 6 months)',
  puppy_6to12: 'Young pup (6–12 months)',
  adolescent: 'Adolescent (1–2 years)',
  adult: 'Adult (2–7 years)',
  senior: 'Senior (7+ years)',
}

const PROBLEM_LABELS: Record<string, string> = {
  leash_pulling: 'Leash pulling',
  recall: 'Poor recall',
  jumping: 'Jumping on people',
  barking: 'Excessive barking',
  aggression: 'Reactivity / aggression',
  separation: 'Separation anxiety',
  destruction: 'Chewing & destruction',
  basic_obedience: 'Basic obedience',
  potty: 'Potty training',
  biting: 'Biting / mouthing',
  stealing: 'Stealing food',
  fearful: 'Fear & anxiety',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function PlanPage({ params }: Props) {
  const { id } = await params

  const supabase = createServerClient()
  const { data: row, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('session_id', id)
    .single()

  if (error || !row) notFound()

  // Plan not ready yet — show a holding page
  if (row.plan_status !== 'ready' || !row.plan_html) {
    return (
      <div className="plan-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: '26px', marginBottom: '12px', color: 'var(--ink)' }}>
          Your plan is still being generated
        </h2>
        <p style={{ color: 'var(--ink-mid)', fontSize: '16px', textAlign: 'center', maxWidth: '420px', lineHeight: '1.65' }}>
          It&apos;ll be ready in a few moments. Check your email for the link, or refresh this page.
        </p>
      </div>
    )
  }

  // Strip markdown code fence that Claude sometimes adds, and any outer <body> tags
  const planHtml = (row.plan_html ?? '')
    .replace(/^```(?:html)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
    .replace(/^\s*<body[^>]*>\s*/i, '')
    .replace(/\s*<\/body>\s*$/i, '')
    .trim()

  const dogName = row.dog_name ?? 'Your dog'
  const dogBreed = row.dog_breed ?? 'mixed breed'
  const dogAge = AGE_LABELS[row.dog_age ?? ''] ?? row.dog_age ?? ''
  const problems = (row.problems as string[] | null ?? [])
    .map((p: string) => PROBLEM_LABELS[p] ?? p)
    .join(' + ')
  const dailyTime = row.daily_time ? `${row.daily_time} min/day` : '20 min/day'
  const generatedOn = formatDate(row.created_at)

  return (
    <div className="plan-body">
      {/* ── COVER ──────────────────────────────────────────────────────── */}
      <div className="cover">
        <div className="cover-label">Your personalised dog training plan</div>
        <h1>
          30 Days to a <em>Better</em><br />
          Dog &amp; a Calmer You
        </h1>
        <p className="cover-sub">
          Tailored for {dogName} · {dogBreed}{dogAge ? ` · ${dogAge}` : ''}
        </p>
        <div className="cover-meta">
          {problems && (
            <div className="meta-item">
              <span className="meta-label">Main focus</span>
              <span className="meta-value">{problems}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">Daily time needed</span>
            <span className="meta-value">{dailyTime}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Method</span>
            <span className="meta-value">Positive reinforcement</span>
          </div>
          {generatedOn && (
            <div className="meta-item">
              <span className="meta-label">Generated on</span>
              <span className="meta-value">{generatedOn}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── AI-GENERATED SECTIONS ──────────────────────────────────────── */}
      <div className="container">
        <PlanContent html={planHtml} />
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <div className="plan-footer">
        <strong>Your personalised plan for {dogName}</strong>
        {generatedOn && ` · Generated ${generatedOn}`}
        <br />
        This plan was created based on the information you provided. Results vary by consistency and environment.
        <br />
        Questions? If you&apos;re not seeing progress by Week 2, consider consulting a certified professional dog trainer.
      </div>
    </div>
  )
}
