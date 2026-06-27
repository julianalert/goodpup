import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBreedBySlug, getAllBreedSlugs } from '@/lib/supabase-dogs'
import { sanitizeMetaText, sanitizeMetaTitle } from '@/lib/metadata'

export const revalidate = 86400

export async function generateStaticParams() {
  const slugs = await getAllBreedSlugs()
  return slugs.map((slug) => ({ breed: slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ breed: string }>
}): Promise<Metadata> {
  const { breed: slug } = await params
  const breed = await getBreedBySlug(slug)
  if (!breed) return {}
  const title = sanitizeMetaTitle(null, `${breed.name} Behavior Problems — Causes & Fixes`)
  const description =
    sanitizeMetaText(null) ??
    `The most common ${breed.name} behavior problems, why they happen with this breed specifically, and what an effective fix requires.`
  return {
    title,
    description,
    openGraph: { title, description, url: `/dogs/${slug}/problems`, type: 'article' },
    twitter: { title, description },
    alternates: { canonical: `/dogs/${slug}/problems` },
  }
}

function frequencyLabel(f: string | null): string {
  if (!f) return 'Unknown'
  return f.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function frequencyBadge(f: string | null): string {
  if (f === 'very-common') return 'badge-high'
  return 'badge-common-amber'
}

export default async function BreedProblemsPage({
  params,
}: {
  params: Promise<{ breed: string }>
}) {
  const { breed: slug } = await params
  const breed = await getBreedBySlug(slug)

  if (!breed) notFound()

  const breedProblems: Array<{
    frequency: string | null
    difficulty: number | null
    timeline_weeks_min: number | null
    timeline_weeks_max: number | null
    problem: { slug: string; name: string; emoji: string | null } | null
  }> = breed.breed_problems ?? []

  return (
    <div className="content-grid">
      <div>
        <h2 className="section-label">Behavior problems</h2>
        <p className="panel-h2">
          What {breed.name}s struggle with most.
        </p>
        <p className="panel-lead">
          Most {breed.name} behavior problems trace back to the breed&apos;s original purpose and
          drive levels. Here&apos;s what to look for and why it happens with this breed
          specifically.
        </p>

        <div className="problem-links">
          {breedProblems.map((bp) =>
            bp.problem ? (
              <Link
                key={bp.problem.slug}
                href={`/dogs/${slug}/${bp.problem.slug}`}
                className="problem-link"
              >
                <div className="problem-link-left">
                  <span className="problem-link-icon">{bp.problem.emoji ?? '🐾'}</span>
                  <div>
                    <div className="problem-link-name">{bp.problem.name}</div>
                    <div className="problem-link-desc">
                      {frequencyLabel(bp.frequency)} · Difficulty {bp.difficulty ?? '?'}/10
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`problem-link-badge ${frequencyBadge(bp.frequency)}`}>
                    {frequencyLabel(bp.frequency)}
                  </span>
                  <span className="arrow">→</span>
                </div>
              </Link>
            ) : null
          )}
        </div>
      </div>

      <div className="sidebar">
        <div className="cta-card">
          <h3>
            Every problem is <em>connected</em>
          </h3>
          <p>
            Your dog&apos;s problems often share the same root cause. A plan that addresses the
            source fixes all of them.
          </p>
          <Link href="/form" className="cta-btn">
            Build my dog&apos;s plan →
          </Link>
          <div className="cta-micro">30-day guarantee · Delivered in 60 sec</div>
        </div>
      </div>
    </div>
  )
}
