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
  const title = sanitizeMetaTitle(null, `${breed.name} Daily Life — Exercise, Space & Family Fit`)
  const description =
    sanitizeMetaText(null) ??
    `What living with a ${breed.name} actually requires — daily exercise, alone time tolerance, apartment suitability, and compatibility with kids and other pets.`
  return {
    title,
    description,
    openGraph: { title, description, url: `/dogs/${slug}/daily-life`, type: 'article' },
    twitter: { title, description },
    alternates: { canonical: `/dogs/${slug}/daily-life` },
  }
}

export default async function BreedDailyLifePage({
  params,
}: {
  params: Promise<{ breed: string }>
}) {
  const { breed: slug } = await params
  const breed = await getBreedBySlug(slug)

  if (!breed) notFound()

  return (
    <div className="content-grid">
      <div>
        <h2 className="section-label">Daily life</h2>
        <p className="panel-h2">
          What living with a {breed.name} actually requires.
        </p>
        <div className="info-grid">
          <div className="info-card">
            <span className="info-card-label">Daily exercise</span>
            <div className="info-card-value">
              {breed.daily_exercise_minutes ? `${breed.daily_exercise_minutes} min` : '—'}
            </div>
          </div>
          <div className="info-card">
            <span className="info-card-label">Max time alone</span>
            <div className="info-card-value">
              {breed.max_alone_hours ? `~${breed.max_alone_hours} hours` : '—'}
            </div>
          </div>
          <div className="info-card">
            <span className="info-card-label">Apartment</span>
            <div className="info-card-value">
              {breed.apartment_suitable === null
                ? '—'
                : breed.apartment_suitable
                ? 'Possible'
                : 'Not ideal'}
            </div>
          </div>
          <div className="info-card">
            <span className="info-card-label">With kids</span>
            <div className="info-card-value">{breed.good_with_kids ?? '—'}</div>
          </div>
          <div className="info-card">
            <span className="info-card-label">With other dogs</span>
            <div className="info-card-value">{breed.good_with_dogs ?? '—'}</div>
          </div>
          <div className="info-card">
            <span className="info-card-label">With cats</span>
            <div className="info-card-value">{breed.good_with_cats ?? '—'}</div>
          </div>
        </div>

        {breed.apartment_note && (
          <div className="callout">
            <p>
              <strong>Apartment owners:</strong> {breed.apartment_note}
            </p>
          </div>
        )}

        {breed.daily_life_content ? (
          <div
            className="breed-rich-content"
            dangerouslySetInnerHTML={{ __html: breed.daily_life_content }}
          />
        ) : (
          <p className="panel-lead">{breed.description}</p>
        )}

        <span className="section-label">Mental stimulation needs</span>
        <div className="mental-stim-card">
          <div className="mental-stim-title">A tired mind beats a tired body</div>
          <div className="mental-stim-body">
            Sniff walks, puzzle feeders, and training sessions do more to reduce destructive
            behaviour than a long run. {breed.name}s were bred with a specific purpose — give them
            problems to solve.
          </div>
        </div>
      </div>

      <div className="sidebar">
        <div className="cta-card">
          <h3>
            Your {breed.name}&apos;s <em>plan</em>
          </h3>
          <p>
            Your plan accounts for your living situation and builds around what&apos;s realistic for
            your schedule.
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
