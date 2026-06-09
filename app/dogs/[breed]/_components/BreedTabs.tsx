'use client'

import { useState } from 'react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'training', label: 'Training' },
  { id: 'problems', label: 'Behavior Problems' },
  { id: 'dailylife', label: 'Daily Life' },
]

interface BreedTabsProps {
  overview: React.ReactNode
  training: React.ReactNode
  problems: React.ReactNode
  dailylife: React.ReactNode
}

export default function BreedTabs({ overview, training, problems, dailylife }: BreedTabsProps) {
  const [active, setActive] = useState('overview')

  const panels: Record<string, React.ReactNode> = { overview, training, problems, dailylife }

  return (
    <>
      <div className="tabs-wrap">
        <div className="tabs-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn${active === tab.id ? ' active' : ''}`}
              onClick={() => {
                setActive(tab.id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-panel${active === tab.id ? ' active' : ''}`}
          >
            {panels[tab.id]}
          </div>
        ))}
      </div>
    </>
  )
}
