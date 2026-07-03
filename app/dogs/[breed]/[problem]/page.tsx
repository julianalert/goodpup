import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBreedProblem, getAllBreedProblemPaths } from '@/lib/supabase-dogs'
import { JsonLd } from '@/app/_components/JsonLd'
import { sanitizeMetaText, sanitizeMetaTitle } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

export const revalidate = 86400

export async function generateStaticParams() {
  const paths = await getAllBreedProblemPaths()
  return paths.map((p) => ({ breed: p.breed_slug, problem: p.problem_slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ breed: string; problem: string }>
}): Promise<Metadata> {
  const { breed: breedSlug, problem: problemSlug } = await params
  const { breedProblem, breed, problem } = await getBreedProblem(breedSlug, problemSlug)
  if (!breedProblem) return {}
  const rawTitle = sanitizeMetaText(breedProblem.meta_title)
  const title = rawTitle
    ? rawTitle.replace(/^Why\s+/i, '')
    : `${breed?.name ?? breedSlug}s ${problem?.name ?? problemSlug} — Training Guide`
  const description =
    sanitizeMetaText(breedProblem.meta_description) ??
    `Why ${breed?.name ?? breedSlug}s ${(problem?.name ?? problemSlug).toLowerCase()} and how to fix it. Breed-specific causes, common mistakes, and what an effective protocol looks like.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/dogs/${breedSlug}/${problemSlug}`,
      type: 'article',
    },
    twitter: { title, description },
    alternates: { canonical: `/dogs/${breedSlug}/${problemSlug}` },
  }
}

function DifficultyPips({ difficulty }: { difficulty: number | null }) {
  const d = difficulty ?? 0
  return (
    <span className="meta-chip-value" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={`difficulty-pip ${i < d ? 'pip-filled' : 'pip-empty'}`} />
      ))}
      &nbsp;{d}/10
    </span>
  )
}

function frequencyLabel(f: string | null): string {
  if (!f) return 'Unknown'
  return f.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function BreedProblemPage({
  params,
}: {
  params: Promise<{ breed: string; problem: string }>
}) {
  const { breed: breedSlug, problem: problemSlug } = await params
  const { breedProblem, breed, problem } = await getBreedProblem(breedSlug, problemSlug)

  if (!breedProblem || !breed || !problem) notFound()

  const mistakes: Array<{ title: string; description: string }> =
    Array.isArray(breedProblem.common_mistakes) ? breedProblem.common_mistakes : []

  const whatFix: string[] = Array.isArray(breedProblem.what_fix_requires)
    ? breedProblem.what_fix_requires
    : []

  const otherProblems: Array<{
    frequency: string | null
    difficulty: number | null
    problem: { slug: string; name: string; emoji: string | null } | null
  }> = (breed.breed_problems ?? []).filter(
    (bp: { problem: { slug: string } | null }) => bp.problem?.slug !== problemSlug
  )

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Dog Training Guides by Breed', item: `${SITE_URL}/dogs` },
      { '@type': 'ListItem', position: 3, name: `${breed.name} Training Guide`, item: `${SITE_URL}/dogs/${breedSlug}` },
      { '@type': 'ListItem', position: 4, name: problem.name, item: `${SITE_URL}/dogs/${breedSlug}/${problemSlug}` },
    ],
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${breed.name}s ${problem.name}`,
    description: `Why ${breed.name}s ${problem.name.toLowerCase()} and how to fix it. Breed-specific causes, common mistakes, and what an effective protocol looks like.`,
    url: `${SITE_URL}/dogs/${breedSlug}/${problemSlug}`,
    image: `${SITE_URL}/opengraph-image.png`,
    datePublished: '2024-10-01',
    dateModified: new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: 'PawCraft',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PawCraft',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.png`,
      },
    },
  }

  return (
    <div className="dogs-container">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={articleSchema} />
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>›</span>
        <Link href="/dogs">Dogs</Link>
        <span>›</span>
        <Link href={`/dogs/${breedSlug}`}>{breed.name}</Link>
        <span>›</span>
        {problem.name}
      </div>

      <div className="problem-hero">
        <div className="hero-top">
          <div className="hero-top-left">
            <span className="section-label">
              {breed.name} · Behavior problem
            </span>
            <h1 className="problem-title">
              {breed.name}s <em>{problem.name.toLowerCase()}</em>
            </h1>
            <p className="problem-subtitle">
              {breedProblem.why_this_breed
                ? breedProblem.why_this_breed.split('.')[0] + '.'
                : `${problem.name} is a documented challenge for this breed.`}
            </p>
          </div>
        </div>
        <div className="problem-meta-row">
          <div className="meta-chip">
            <span className="meta-chip-label">Frequency</span>
            <span className="meta-chip-value">{frequencyLabel(breedProblem.frequency)}</span>
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">Difficulty</span>
            <DifficultyPips difficulty={breedProblem.difficulty} />
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">Typical timeline</span>
            <span className="meta-chip-value">
              {breedProblem.timeline_weeks_min}–{breedProblem.timeline_weeks_max} weeks
            </span>
          </div>
        </div>
      </div>

      <div className="page-layout">
        <article className="article">
          <h2>
            The biology behind why {breed.name}s {problem.name.toLowerCase()}
          </h2>
          {breedProblem.why_this_breed
            ?.split('\n')
            .filter(Boolean)
            .map((para: string, i: number) => <p key={i}>{para}</p>)}

          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-num">#{problem.avg_difficulty ?? '?'}</div>
              <div className="stat-label">Avg. difficulty rank</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{breedProblem.difficulty ?? '?'}/10</div>
              <div className="stat-label">Difficulty for this breed</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">
                {breedProblem.timeline_weeks_min}–{breedProblem.timeline_weeks_max}w
              </div>
              <div className="stat-label">Typical improvement window</div>
            </div>
          </div>

          <h2>Why it gets worse before it gets better</h2>
          {breedProblem.makes_it_worse
            ?.split('\n')
            .filter(Boolean)
            .map((para: string, i: number) => <p key={i}>{para}</p>)}

          <div className="callout">
            <p>
              <strong>Consistency is the mechanism of change:</strong> Even one instance where the
              behaviour is reinforced sets progress back significantly. The dog only persists because
              it has worked before.
            </p>
          </div>

          {mistakes.length > 0 && (
            <>
              <h2>The most common owner mistakes</h2>
              <p>
                These are the patterns that keep {breed.name} owners stuck in a cycle for months or
                years:
              </p>
              <div className="mistake-list">
                {mistakes.map((m, i) => (
                  <div key={i} className="mistake-item">
                    <span className="mistake-x">✕</span>
                    <div className="mistake-content">
                      <h3>{m.title}</h3>
                      <p>{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {whatFix.length > 0 && (
            <>
              <h2>What a proper fix requires</h2>
              <p>
                Solving {problem.name.toLowerCase()} in a {breed.name} is not a single technique —
                it&apos;s a protocol built across multiple phases. What genuinely works involves:
              </p>
              <div className="needs-box">
                <h3>What an effective protocol looks like for this breed</h3>
                {whatFix.map((item, i) => (
                  <div key={i} className="needs-item">
                    <span className="needs-check">✓</span>
                    <span className="needs-text">{item}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p>
            The exact sequence, timing, and progression for your specific dog depends on their age,
            how long the behaviour has been reinforced, and your environment. That&apos;s what a
            personalised plan accounts for.
          </p>

          <div className="other-breeds-strip">
            <h2>{problem.name} in other breeds</h2>
            <div className="breed-strip">
              <Link href={`/dogs/problems/${problemSlug}`} className="breed-strip-link">
                View all {problem.name} guides →
              </Link>
            </div>
          </div>
        </article>

        <aside className="sticky-sidebar">
          <div className="cta-card">
            <h3>Get the <em>exact protocol</em> for your {breed.name}</h3>
            <p>
              A breed-specific, age-adjusted 30-day plan built around your dog&apos;s history and
              your environment.
            </p>
            <Link href="/form" className="cta-btn">Build my dog&apos;s plan →</Link>
            <div className="cta-micro">30-day guarantee · Delivered in 60 sec</div>
          </div>

          <div className="sidebar-card">
            <span className="sidebar-card-label">Quick stats</span>
            <div className="quick-stat">
              <span className="quick-stat-label">Frequency</span>
              <span className="quick-stat-value">{frequencyLabel(breedProblem.frequency)}</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Difficulty</span>
              <span className="quick-stat-value">{breedProblem.difficulty ?? '?'} / 10</span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Timeline</span>
              <span className="quick-stat-value">
                {breedProblem.timeline_weeks_min}–{breedProblem.timeline_weeks_max} weeks
              </span>
            </div>
            {problem.root_cause && (
              <div className="quick-stat">
                <span className="quick-stat-label">Root cause</span>
                <span className="quick-stat-value">{problem.root_cause}</span>
              </div>
            )}
            {breedProblem.age_risk_note && (
              <div className="quick-stat">
                <span className="quick-stat-label">Age risk</span>
                <span className="quick-stat-value">{breedProblem.age_risk_note}</span>
              </div>
            )}
          </div>

          {otherProblems.length > 0 && (
            <div className="sidebar-card">
              <span className="sidebar-card-label">Other {breed.name} problems</span>
              <div className="related-problems">
                {otherProblems.slice(0, 5).map((bp) =>
                  bp.problem ? (
                    <Link
                      key={bp.problem.slug}
                      href={`/dogs/${breedSlug}/${bp.problem.slug}`}
                      className="related-problem"
                    >
                      <span>{bp.problem.emoji} {bp.problem.name}</span>
                      <span>→</span>
                    </Link>
                  ) : null
                )}
              </div>
            </div>
          )}

          <div className="sidebar-card">
            <span className="sidebar-card-label">{breed.name} hub</span>
            <p style={{ fontSize: 13, color: 'var(--ink-mid)', marginBottom: 12, lineHeight: 1.6 }}>
              Full breed guide — temperament, training profile, daily life requirements.
            </p>
            <Link
              href={`/dogs/${breedSlug}`}
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)', textDecoration: 'none' }}
            >
              View breed guide →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
