import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllBreeds, getAllProblems } from '@/lib/supabase-dogs'
import BreedGrid from './_components/BreedGrid'
import { JsonLd } from '@/app/_components/JsonLd'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Dog Training by Breed',
  description:
    "Every breed has different instincts, drives, and problem patterns. Find yours and understand exactly what you're working with. 50 breeds, 15 problem types, 750 breed-specific guides.",
  openGraph: {
    title: 'Dog Training by Breed',
    description:
      "Every breed has different instincts, drives, and problem patterns. Find yours and understand exactly what you're working with. 50 breeds, 15 problem types, 750 breed-specific guides.",
    url: '/dogs',
    type: 'website',
  },
  twitter: {
    title: 'Dog Training by Breed',
    description:
      "Every breed has different instincts, drives, and problem patterns. Find yours and understand exactly what you're working with. 50 breeds, 15 problem types, 750 breed-specific guides.",
  },
  alternates: {
    canonical: '/dogs',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mypawcraft.com' },
    { '@type': 'ListItem', position: 2, name: 'Dog Training Guides by Breed', item: 'https://mypawcraft.com/dogs' },
  ],
}

export default async function DogsPage() {
  const [breeds, problems] = await Promise.all([getAllBreeds(), getAllProblems()])

  return (
    <div className="dogs-container">
      <JsonLd data={breadcrumbSchema} />
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>›</span>
        Dog Training Guides by Breed
      </div>

      <div className="page-header">
        <span className="section-label">Dogs library</span>
        <h1>
          Dog training guides, <em>built by breed.</em>
        </h1>
        <p>
          Every breed has different instincts, drives, and problem patterns. Find yours and
          understand exactly what you&apos;re working with.
        </p>
        <div className="header-stats">
          <div className="header-stat">
            <span className="stat-num-lg">{breeds.length || 50}</span>
            <span className="stat-label-sm">breeds covered</span>
          </div>
          <div className="header-stat">
            <span className="stat-num-lg">{problems.length || 15}</span>
            <span className="stat-label-sm">problem types</span>
          </div>
          <div className="header-stat">
            <span className="stat-num-lg">{(breeds.length || 50) * (problems.length || 15)}</span>
            <span className="stat-label-sm">breed × problem guides</span>
          </div>
        </div>
      </div>

      {/* @ts-expect-error – Supabase returns untyped data; shape matches component props */}
      <BreedGrid breeds={breeds} />

      <div className="clusters-section">
        <span className="section-label">Browse by problem</span>
        <h2>
          What&apos;s your dog <em>struggling with?</em>
        </h2>
        <p className="lead">Every problem guide is written for your specific breed — not generic advice.</p>
        <div className="problem-cluster-grid">
          {problems.map((p) => (
            <Link key={p.slug} href={`/dogs/problems/${p.slug}`} className="cluster-card">
              <span className="cluster-icon">{p.emoji ?? '🐾'}</span>
              <div className="cluster-name">{p.name}</div>
              <div className="cluster-count">{breeds.length || 50} breed guides</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
