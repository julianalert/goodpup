import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBreedBySlug, getAllBreedSlugs, getSimilarBreeds } from '@/lib/supabase-dogs'
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
  const title = sanitizeMetaTitle(breed.meta_title, `${breed.name} Training Guide`)
  const description =
    sanitizeMetaText(breed.meta_description) ??
    `Training guide for ${breed.name}s — temperament, behaviour problems, and what actually works for this breed.`
  return {
    title,
    description,
    openGraph: { title, description, url: `/dogs/${slug}`, type: 'article' },
    twitter: { title, description },
    alternates: { canonical: `/dogs/${slug}` },
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

export default async function BreedOverviewPage({
  params,
}: {
  params: Promise<{ breed: string }>
}) {
  const { breed: slug } = await params
  const [breed, similarBreeds] = await Promise.all([
    getBreedBySlug(slug),
    getSimilarBreeds(slug, null),
  ])

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
        <span className="section-label">Overview</span>
        <h2 className="panel-h2">
          {breed.name} — <em>breed profile</em>
        </h2>
        <div className="info-grid">
          <div className="info-card">
            <span className="info-card-label">Lifespan</span>
            <div className="info-card-value">{breed.lifespan ?? '—'}</div>
          </div>
          <div className="info-card">
            <span className="info-card-label">Weight</span>
            <div className="info-card-value">{breed.weight_range ?? '—'}</div>
          </div>
          <div className="info-card">
            <span className="info-card-label">Origin</span>
            <div className="info-card-value">{breed.origin ?? '—'}</div>
          </div>
          <div className="info-card">
            <span className="info-card-label">Purpose</span>
            <div className="info-card-value">{breed.purpose ?? '—'}</div>
          </div>
        </div>

        <span className="section-label">Temperament</span>
        <div className="trait-list">
          <TraitRow label="Affectionate" value={breed.trait_affectionate} />
          <TraitRow label="Playfulness" value={breed.trait_playfulness} />
          <TraitRow label="Patience" value={breed.trait_patience} />
          <TraitRow label="Prey drive" value={breed.trait_prey_drive} />
          <TraitRow label="Guarding instinct" value={breed.trait_guarding_instinct} />
        </div>

        {breed.training_overview && (
          <div className="callout">
            <p>
              <strong>Training note:</strong> {breed.training_overview}
            </p>
          </div>
        )}

        {breed.overview_content ? (
          <div
            className="breed-rich-content"
            dangerouslySetInnerHTML={{ __html: breed.overview_content }}
          />
        ) : (
          <p className="panel-lead">{breed.description}</p>
        )}
      </div>

      <div className="sidebar">
        <div className="cta-card">
          <h3>
            Your {breed.name}&apos;s <em>plan</em>
          </h3>
          <p>
            The breed profile tells you what&apos;s typical. Your plan is built around what&apos;s
            specific to your dog.
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
        {similarBreeds.length > 0 && (
          <div className="sidebar-card">
            <span className="sidebar-card-label">Similar breeds</span>
            <div className="related-breeds">
              {similarBreeds.map((b) => (
                <Link key={b.slug} href={`/dogs/${b.slug}`} className="related-breed">
                  <span>
                    {b.emoji} {b.name}
                  </span>
                  <span>→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
