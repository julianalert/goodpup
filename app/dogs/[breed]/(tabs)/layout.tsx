import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBreedBySlug } from '@/lib/supabase-dogs'
import BreedTabs from '../_components/BreedTabs'
import { JsonLd } from '@/app/_components/JsonLd'
import { SITE_URL } from '@/lib/site'

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

export default async function BreedTabsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ breed: string }>
}) {
  const { breed: slug } = await params
  const breed = await getBreedBySlug(slug)
  if (!breed) notFound()

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Dog Training Guides by Breed', item: `${SITE_URL}/dogs` },
      { '@type': 'ListItem', position: 3, name: `${breed.name} Training Guide`, item: `${SITE_URL}/dogs/${slug}` },
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

      <BreedTabs breedSlug={slug} />

      <div className="tab-content">
        {children}
      </div>
    </div>
  )
}
