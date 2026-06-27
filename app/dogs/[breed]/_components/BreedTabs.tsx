'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'training', label: 'Training' },
  { id: 'problems', label: 'Behavior Problems' },
  { id: 'dailylife', label: 'Daily Life' },
]

function tabHref(breedSlug: string, id: string): string {
  if (id === 'overview') return `/dogs/${breedSlug}`
  if (id === 'dailylife') return `/dogs/${breedSlug}/daily-life`
  return `/dogs/${breedSlug}/${id}`
}

function getActiveId(pathname: string): string {
  if (pathname.endsWith('/training')) return 'training'
  if (pathname.endsWith('/problems')) return 'problems'
  if (pathname.endsWith('/daily-life')) return 'dailylife'
  return 'overview'
}

export default function BreedTabs({ breedSlug }: { breedSlug: string }) {
  const pathname = usePathname()
  const active = getActiveId(pathname)

  return (
    <div className="tabs-wrap">
      <div className="tabs-nav">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tabHref(breedSlug, tab.id)}
            className={`tab-btn${active === tab.id ? ' active' : ''}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
