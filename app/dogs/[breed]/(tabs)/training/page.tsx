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
  const title = sanitizeMetaTitle(null, `${breed.name} Training — What Works for This Breed`)
  const description =
    sanitizeMetaText(null) ??
    `How to train a ${breed.name} — motivation levers, focus challenges, and what an effective training approach looks like for this breed.`
  return {
    title,
    description,
    openGraph: { title, description, url: `/dogs/${slug}/training`, type: 'article' },
    twitter: { title, description },
    alternates: { canonical: `/dogs/${slug}/training` },
  }
}

function TraitRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="trait-row">
      <span className="trait-name">{label}</span>
      <div className="trait-track">
        <div className="trait-fill" style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="trait-val">{value ?? '—'}</span>
    </div>
  )
}

export default async function BreedTrainingPage({
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
    problem: { slug: string; name: string; emoji: string | null } | null
  }> = breed.breed_problems ?? []

  return (
    <div className="content-grid">
      <div>
        <h2 className="section-label">Training</h2>
        <p className="panel-h2">
          Built to learn. <em>Needs direction.</em>
        </p>
        <span className="section-label">What drives them</span>
        <div className="trait-list">
          <TraitRow label="Food motivation" value={breed.drive_food} />
          <TraitRow label="Praise motivation" value={breed.drive_praise} />
          <TraitRow label="Play motivation" value={breed.drive_play} />
          <TraitRow label="Focus outdoors" value={breed.drive_focus_outdoors} />
          <TraitRow label="Distraction threshold" value={breed.drive_distraction_threshold} />
        </div>

        {breed.training_full_content ? (
          <div
            className="breed-rich-content"
            dangerouslySetInnerHTML={{ __html: breed.training_full_content }}
          />
        ) : (
          <p className="panel-lead">{breed.training_overview}</p>
        )}

        {breed.adolescence_warning && (
          <div className="callout">
            <p>
              <strong>Adolescence warning:</strong> {breed.adolescence_warning}
            </p>
          </div>
        )}
      </div>

      <div className="sidebar">
        <div className="cta-card">
          <h3>
            Your {breed.name}&apos;s <em>plan</em>
          </h3>
          <p>
            General training principles aren&apos;t enough. Your dog&apos;s plan accounts for their
            age, problem behaviours, and your schedule.
          </p>
          <Link href="/form" className="cta-btn">
            Build my dog&apos;s plan →
          </Link>
          <div className="cta-micro">30-day guarantee · Delivered in 60 sec</div>
        </div>
        {breedProblems.length > 0 && (
          <div className="sidebar-card">
            <span className="sidebar-card-label">Common problems</span>
            <div className="related-breeds">
              {breedProblems.slice(0, 5).map((bp) =>
                bp.problem ? (
                  <Link
                    key={bp.problem.slug}
                    href={`/dogs/${slug}/${bp.problem.slug}`}
                    className="related-breed"
                  >
                    <span>
                      {bp.problem.emoji} {bp.problem.name}
                    </span>
                    <span>→</span>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
