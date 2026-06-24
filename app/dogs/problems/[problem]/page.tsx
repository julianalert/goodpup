import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProblemWithAllBreeds, getAllProblemSlugs, getAllProblems } from '@/lib/supabase-dogs'
import BreedProblemTable from './_components/BreedProblemTable'
import { JsonLd } from '@/app/_components/JsonLd'
import { sanitizeMetaText, sanitizeMetaTitle } from '@/lib/metadata'

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await getAllProblemSlugs()
  return slugs.map((slug) => ({ problem: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ problem: string }>
}): Promise<Metadata> {
  const { problem: slug } = await params
  const { problem } = await getProblemWithAllBreeds(slug)
  if (!problem) return {}
  const title = sanitizeMetaTitle(problem.meta_title, `${problem.name} by Breed`)
  const description =
    sanitizeMetaText(problem.meta_description) ??
    `${problem.name} in dogs — causes, difficulty, and breed-specific guides across 50+ breeds.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/dogs/problems/${slug}`,
      type: 'website',
    },
    twitter: { title, description },
    alternates: { canonical: `/dogs/problems/${slug}` },
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

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ problem: string }>
}) {
  const { problem: slug } = await params
  const [{ problem, breeds }, allProblems] = await Promise.all([
    getProblemWithAllBreeds(slug),
    getAllProblems(),
  ])

  if (!problem) notFound()

  const otherProblems = allProblems.filter((p) => p.slug !== slug)
  const breedCount = breeds.length

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mypawcraft.com' },
      { '@type': 'ListItem', position: 2, name: 'Dog Training Guides by Breed', item: 'https://mypawcraft.com/dogs' },
      { '@type': 'ListItem', position: 3, name: `${problem.name} by Breed`, item: `https://mypawcraft.com/dogs/problems/${slug}` },
    ],
  }

  return (
    <div className="dogs-container">
      <JsonLd data={breadcrumbSchema} />
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>›</span>
        <Link href="/dogs">Dogs</Link>
        <span>›</span>
        Problems
        <span>›</span>
        {problem.name}
      </div>

      <div className="problem-hub-header">
        <div className="header-inner">
          <div>
            <span className="section-label">Problem guide · All breeds</span>
            <h1 className="page-title">
              {problem.name} —<br />
              <em>by breed</em>
            </h1>
            <p className="page-lead">{problem.description}</p>
            <div className="header-meta">
              <div className="meta-chip">
                <span className="meta-chip-label">Breeds covered</span>
                <span className="meta-chip-value">{breedCount || 50}</span>
              </div>
              {problem.avg_difficulty != null && (
                <div className="meta-chip">
                  <span className="meta-chip-label">Avg. difficulty</span>
                  <DifficultyPips difficulty={problem.avg_difficulty} />
                </div>
              )}
              {problem.avg_timeline_weeks_min != null && (
                <div className="meta-chip">
                  <span className="meta-chip-label">Avg. timeline</span>
                  <span className="meta-chip-value">
                    {problem.avg_timeline_weeks_min}–{problem.avg_timeline_weeks_max} weeks
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="problem-summary">
            <span className="summary-label">Problem overview</span>
            <div className="summary-row">
              <span className="summary-key">Root cause</span>
              <span className="summary-val">{problem.root_cause ?? '—'}</span>
            </div>
            {problem.hardest_breeds?.length > 0 && (
              <div className="summary-row">
                <span className="summary-key">Hardest breeds</span>
                <span className="summary-val">{problem.hardest_breeds.slice(0, 2).join(', ')}</span>
              </div>
            )}
            {problem.easiest_breeds?.length > 0 && (
              <div className="summary-row">
                <span className="summary-key">Easiest breeds</span>
                <span className="summary-val">{problem.easiest_breeds.slice(0, 2).join(', ')}</span>
              </div>
            )}
            {problem.peak_age && (
              <div className="summary-row">
                <span className="summary-key">Most common in</span>
                <span className="summary-val">{problem.peak_age}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Problem Switcher Nav */}
      <div className="problems-nav">
        <Link
          href={`/dogs/problems/${slug}`}
          className="problem-nav-link active"
        >
          {problem.emoji} {problem.name}
        </Link>
        {otherProblems.map((p) => (
          <Link
            key={p.slug}
            href={`/dogs/problems/${p.slug}`}
            className="problem-nav-link"
          >
            {p.emoji} {p.name}
          </Link>
        ))}
      </div>

      <div className="callout" style={{ marginBottom: 32 }}>
        <p>
          <strong>Why breed matters for {problem.name.toLowerCase()}:</strong>{' '}
          The same problem can have completely different root causes depending on the breed&apos;s
          history and drives. Generic training advice ignores this entirely — find your breed below
          for a guide that actually accounts for what you&apos;re working with.
        </p>
      </div>

      <BreedProblemTable breeds={breeds as Parameters<typeof BreedProblemTable>[0]['breeds']} problemSlug={slug} />

      {otherProblems.length > 0 && (
        <div className="other-problems">
          <span className="section-label">Browse all problems</span>
          <h2>
            Other things your dog<br />
            <em>might be struggling with</em>
          </h2>
          <p className="lead">Every guide is specific to the breed — not generic advice.</p>
          <div className="problems-grid">
            {otherProblems.map((p) => (
              <Link key={p.slug} href={`/dogs/problems/${p.slug}`} className="problem-card">
                <span className="problem-card-icon">{p.emoji ?? '🐾'}</span>
                <div className="problem-card-name">{p.name}</div>
                <div className="problem-card-count">{breedCount || 50} breed guides</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
