'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface BreedRow {
  frequency: string | null
  difficulty: number | null
  timeline_weeks_min: number | null
  timeline_weeks_max: number | null
  breed: {
    slug: string
    name: string
    group_name: string | null
    emoji: string | null
  } | null
}

const FREQUENCY_ORDER: Record<string, number> = {
  'very-common': 3,
  common: 2,
  occasional: 1,
  rare: 0,
}

function frequencyLabel(f: string | null): string {
  if (!f) return 'Unknown'
  return f.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function frequencyBadge(f: string | null): string {
  if (f === 'very-common') return 'severity-badge badge-very-common'
  if (f === 'common') return 'severity-badge badge-common'
  return 'severity-badge badge-occasional'
}

function DiffPips({ difficulty }: { difficulty: number | null }) {
  const d = difficulty ?? 0
  return (
    <div className="diff-pips">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={`pip ${i < d ? 'on' : 'off'}`} />
      ))}
    </div>
  )
}

export default function BreedProblemTable({
  breeds,
  problemSlug,
}: {
  breeds: BreedRow[]
  problemSlug: string
}) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('alpha')

  const filtered = useMemo(() => {
    let rows = breeds.filter((b) =>
      (b.breed?.name ?? '').toLowerCase().includes(search.toLowerCase())
    )
    rows = [...rows].sort((a, b) => {
      if (sort === 'alpha') return (a.breed?.name ?? '').localeCompare(b.breed?.name ?? '')
      if (sort === 'difficulty-asc') return (a.difficulty ?? 0) - (b.difficulty ?? 0)
      if (sort === 'difficulty-desc') return (b.difficulty ?? 0) - (a.difficulty ?? 0)
      if (sort === 'severity')
        return (FREQUENCY_ORDER[b.frequency ?? ''] ?? 0) - (FREQUENCY_ORDER[a.frequency ?? ''] ?? 0)
      return 0
    })
    return rows
  }, [breeds, search, sort])

  return (
    <>
      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Filter breeds…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="alpha">A → Z</option>
          <option value="difficulty-asc">Easiest first</option>
          <option value="difficulty-desc">Hardest first</option>
          <option value="severity">Most common first</option>
        </select>
      </div>

      <div className="breed-table-wrap">
        <div className="table-card">
          <table className="breed-table">
            <thead>
              <tr>
                <th>Breed</th>
                <th>Frequency</th>
                <th>Difficulty</th>
                <th>Typical timeline</th>
                <th style={{ textAlign: 'right' }}>Guide</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                if (!row.breed) return null
                const { slug, name, group_name, emoji } = row.breed
                return (
                  <tr
                    key={slug}
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      (window.location.href = `/dogs/${slug}/${problemSlug}`)
                    }
                  >
                    <td>
                      <div className="breed-cell">
                        <div className="breed-avatar">{emoji ?? '🐶'}</div>
                        <div>
                          <div className="breed-cell-name">{name}</div>
                          <div className="breed-cell-group">{group_name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={frequencyBadge(row.frequency)}>
                        {frequencyLabel(row.frequency)}
                      </span>
                    </td>
                    <td>
                      <DiffPips difficulty={row.difficulty} />
                    </td>
                    <td>
                      <span className="timeline-val">
                        {row.timeline_weeks_min}–{row.timeline_weeks_max} weeks
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/dogs/${slug}/${problemSlug}`}
                        className="table-cta-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View guide →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
