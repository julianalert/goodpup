import { cache } from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { isPlanV2, progressId, properName, type ProgressKind, type ProgressMap } from '@/lib/plan-types'
import { PlanContent } from './PlanContent'
import { DEFAULT_REMINDER_HOUR } from '@/lib/plan-reminders'
import { PlanSpaceLoader } from './PlanSpaceLoader'
import './plan.css'

// One query per request, shared by the metadata and the page itself
const getSubmission = cache(async (id: string) => {
  const { data, error } = await createServerClient()
    .from('submissions')
    .select('*')
    .eq('session_id', id)
    .maybeSingle()
  return error ? null : data
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const row = await getSubmission(id)
  const private_ = { robots: { index: false, follow: false } }

  if (!row || row.status !== 'paid') return { title: 'Your 30-day training plan · PawCraft', ...private_ }

  const dogName = properName(row.dog_name, 'Your dog')
  if (!isPlanV2(row.plan_json)) return { title: `${dogName}'s 30-day training plan · PawCraft`, ...private_ }

  // The training space can be added to the phone's home screen and opens like an app
  return {
    title: `${dogName}'s training space · PawCraft`,
    manifest: `/plan/${id}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: dogName, statusBarStyle: 'default' },
    icons: { icon: '/favicon.ico', apple: '/icon-180.png' },
    ...private_,
  }
}

export const viewport: Viewport = {
  themeColor: '#F6F6F3',
}

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

export default async function PlanPage({ params, searchParams }: Props) {
  const { id } = await params
  // The admin report links here with ?view=admin
  const adminView = (await searchParams).view === 'admin'

  // Always rendered for the request at hand: the page shows the customer's own,
  // changing progress, so a cached copy would be out of date.
  await connection()

  const supabase = createServerClient()
  const row = await getSubmission(id)

  // The plan is the paid product: an unpaid submission has no plan page at all
  if (!row || row.status !== 'paid') notFound()

  // Plan not ready yet — show a holding page
  const structuredPlan = isPlanV2(row.plan_json) ? row.plan_json : null

  if (row.plan_status !== 'ready' || (!row.plan_html && !structuredPlan)) {
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

  // ── The interactive training space (plans generated as structured data) ──
  if (structuredPlan) {
    const { data: progressRows, error: progressError } = await supabase
      .from('plan_progress')
      .select('kind, key, value')
      .eq('session_id', id)
    if (progressError) console.error('[plan] could not load progress:', progressError.message)

    const initialProgress: ProgressMap = {}
    for (const entry of progressRows ?? []) {
      initialProgress[progressId(entry.kind as ProgressKind, entry.key)] = entry.value
    }

    const breed = properName(row.dog_breed, '')
    const age = AGE_LABELS[row.dog_age ?? ''] ?? ''

    return (
      <PlanSpaceLoader
        sessionId={id}
        dogName={properName(row.dog_name, 'Your dog')}
        subtitle={[breed, age].filter(Boolean).join(' · ')}
        problems={((row.problems as string[] | null) ?? []).map((p) => ({ id: p, label: PROBLEM_LABELS[p] ?? p }))}
        plan={structuredPlan}
        initialProgress={initialProgress}
        initialSettings={{
          remindersEnabled: row.reminders_enabled !== false,
          reminderHour: row.reminder_hour ?? DEFAULT_REMINDER_HOUR,
          timezone: row.timezone ?? null,
          photo: row.dog_photo ?? null,
        }}
        adminView={adminView}
      />
    )
  }

  // ── Plans delivered as HTML (every order before the training space) ──────
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
