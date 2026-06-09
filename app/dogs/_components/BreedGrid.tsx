'use client'

import { useState } from 'react'
import Link from 'next/link'

interface BreedProblem {
  problem: { slug: string; name: string } | null
}

interface Breed {
  slug: string
  name: string
  group_name: string | null
  emoji: string | null
  tags: string[] | null
  score_overall: number | null
  score_trainability: number | null
  score_energy: number | null
  score_beginner_friendly: number | null
  breed_problems: BreedProblem[]
}

const GROUPS = ['All', 'Sporting', 'Herding', 'Hound', 'Terrier', 'Working', 'Toy', 'Non-Sporting']

function trainabilityLabel(score: number | null): { label: string; cls: string } {
  if (!score) return { label: 'Unknown', cls: 'badge-med' }
  if (score >= 80) return { label: 'Easy', cls: 'badge-easy' }
  if (score >= 55) return { label: 'Medium', cls: 'badge-med' }
  return { label: 'Advanced', cls: 'badge-hard' }
}

function groupKey(group: string | null): string {
  if (!group) return ''
  return group.toLowerCase().split(' ')[0]
}

export default function BreedGrid({ breeds }: { breeds: Breed[] }) {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('All')

  const filtered = breeds.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase())
    const matchGroup =
      activeGroup === 'All' ||
      (b.group_name ?? '').toLowerCase().includes(activeGroup.toLowerCase())
    return matchSearch && matchGroup
  })

  return (
    <>
      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search breeds…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {GROUPS.map((g) => (
            <button
              key={g}
              className={`filter-pill${activeGroup === g ? ' active' : ''}`}
              onClick={() => setActiveGroup(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="breed-grid">
        {filtered.map((breed) => {
          const badge = trainabilityLabel(breed.score_trainability)
          const topProblems = breed.breed_problems
            .map((bp) => bp.problem?.name)
            .filter(Boolean)
            .slice(0, 3)

          return (
            <Link key={breed.slug} href={`/dogs/${breed.slug}`} className="breed-card">
              <div className="breed-card-top">
                <span className="breed-emoji">{breed.emoji ?? '🐶'}</span>
                <span className={`trainability-badge ${badge.cls}`}>{badge.label}</span>
              </div>
              <div>
                <div className="breed-name">{breed.name}</div>
                <div className="breed-group">{breed.group_name}</div>
              </div>
              <div className="breed-scores">
                <div className="mini-score">
                  <span className="mini-score-label">Train</span>
                  <div className="mini-score-bar">
                    <div className="mini-score-fill" style={{ width: `${breed.score_trainability ?? 0}%` }} />
                  </div>
                </div>
                <div className="mini-score">
                  <span className="mini-score-label">Energy</span>
                  <div className="mini-score-bar">
                    <div className="mini-score-fill" style={{ width: `${breed.score_energy ?? 0}%` }} />
                  </div>
                </div>
                <div className="mini-score">
                  <span className="mini-score-label">Beginner</span>
                  <div className="mini-score-bar">
                    <div className="mini-score-fill" style={{ width: `${breed.score_beginner_friendly ?? 0}%` }} />
                  </div>
                </div>
              </div>
              {topProblems.length > 0 && (
                <div className="breed-problems-tags">
                  {topProblems.map((p) => (
                    <span key={p} className="problem-tag">{p}</span>
                  ))}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </>
  )
}
