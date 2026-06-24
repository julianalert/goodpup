import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBreedBySlug, getAllBreedSlugs, getSimilarBreeds } from '@/lib/supabase-dogs'
import BreedTabs from './_components/BreedTabs'
import { JsonLd } from '@/app/_components/JsonLd'
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
  const description = sanitizeMetaText(breed.meta_description) ?? `Training guide for ${breed.name}s — temperament, behaviour problems, and what actually works for this breed.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/dogs/${slug}`,
      type: 'article',
    },
    twitter: { title, description },
    alternates: { canonical: `/dogs/${slug}` },
  }
}

function ScoreRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="score-row">
      <span className="score-lbl">{label}</span>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="score-val">{value ?? '—'}</span>
    </div>
  )
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

function frequencyLabel(f: string | null): string {
  if (!f) return 'Unknown'
  return f.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function frequencyBadge(f: string | null): string {
  if (f === 'very-common') return 'badge-high'
  return 'badge-common-amber'
}

export default async function BreedPage({
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

  const Overview = (
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
            <p><strong>Training note:</strong> {breed.training_overview}</p>
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
          <h3>Your {breed.name}&apos;s <em>plan</em></h3>
          <p>The breed profile tells you what&apos;s typical. Your plan is built around what&apos;s specific to your dog.</p>
          <Link href="/form" className="cta-btn">Build my dog&apos;s plan →</Link>
          <div className="cta-micro">30-day guarantee · Delivered in 60 sec</div>
        </div>
        {similarBreeds.length > 0 && (
          <div className="sidebar-card">
            <span className="sidebar-card-label">Similar breeds</span>
            <div className="related-breeds">
              {similarBreeds.map((b) => (
                <Link key={b.slug} href={`/dogs/${b.slug}`} className="related-breed">
                  <span>{b.emoji} {b.name}</span>
                  <span>→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const Training = (
    <div className="content-grid">
      <div>
        <span className="section-label">Training</span>
        <h2 className="panel-h2">
          Built to learn. <em>Needs direction.</em>
        </h2>
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
          <h3>Your {breed.name}&apos;s <em>plan</em></h3>
          <p>General training principles aren&apos;t enough. Your dog&apos;s plan accounts for their age, problem behaviours, and your schedule.</p>
          <Link href="/form" className="cta-btn">Build my dog&apos;s plan →</Link>
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
                    <span>{bp.problem.emoji} {bp.problem.name}</span>
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

  const Problems = (
    <div className="content-grid">
      <div>
        <span className="section-label">Behavior problems</span>
        <h2 className="panel-h2">
          What {breed.name}s <em>struggle with most</em>
        </h2>
        <p className="panel-lead">
          Most {breed.name} behavior problems trace back to the breed&apos;s original purpose
          and drive levels. Here&apos;s what to look for and why it happens with this breed specifically.
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
          <h3>Every problem is <em>connected</em></h3>
          <p>Your dog&apos;s problems often share the same root cause. A plan that addresses the source fixes all of them.</p>
          <Link href="/form" className="cta-btn">Build my dog&apos;s plan →</Link>
          <div className="cta-micro">30-day guarantee · Delivered in 60 sec</div>
        </div>
      </div>
    </div>
  )

  const DailyLife = (
    <div className="content-grid">
      <div>
        <span className="section-label">Daily life</span>
        <h2 className="panel-h2">
          What living with a {breed.name} <em>actually requires</em>
        </h2>
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
          <h3>Your {breed.name}&apos;s <em>plan</em></h3>
          <p>Your plan accounts for your living situation and builds around what&apos;s realistic for your schedule.</p>
          <Link href="/form" className="cta-btn">Build my dog&apos;s plan →</Link>
          <div className="cta-micro">30-day guarantee · Delivered in 60 sec</div>
        </div>
      </div>
    </div>
  )

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mypawcraft.com' },
      { '@type': 'ListItem', position: 2, name: 'Dog Training Guides by Breed', item: 'https://mypawcraft.com/dogs' },
      { '@type': 'ListItem', position: 3, name: `${breed.name} Training Guide`, item: `https://mypawcraft.com/dogs/${slug}` },
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
        {breed.name}
      </div>

      <div className="breed-hero">
        <div>
          <span className="breed-eyebrow">Breed training guide</span>
          <h1 className="breed-title">{breed.name}</h1>
          <div className="breed-meta">
            {[breed.group_name, breed.weight_range, breed.lifespan].filter(Boolean).join(' · ')}
          </div>
          {breed.tags && breed.tags.length > 0 && (
            <div className="breed-tags">
              {breed.tags.map((tag: string) => (
                <span key={tag} className="breed-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="scores-card">
          <div className="score-overall">
            <span className="score-big">{breed.score_overall ?? '—'}</span>
            <span className="score-big-label">Overall</span>
          </div>
          <ScoreRow label="Trainability" value={breed.score_trainability} />
          <ScoreRow label="Energy level" value={breed.score_energy} />
          <ScoreRow label="For beginners" value={breed.score_beginner_friendly} />
          <ScoreRow label="Sociability" value={breed.score_sociability} />
          <ScoreRow label="Independence" value={breed.score_independence} />
        </div>
      </div>

      <BreedTabs
        overview={Overview}
        training={Training}
        problems={Problems}
        dailylife={DailyLife}
      />
    </div>
  )
}
