'use client'

import dynamic from 'next/dynamic'
import type { PlanSpaceProps } from './PlanSpace'
import s from './space/space.module.css'

// The space is rendered in the browser only: what it shows depends on the visitor's
// own clock and timezone (is it a new day? how long is the streak?), which the
// server cannot know.
const PlanSpace = dynamic(() => import('./PlanSpace'), {
  ssr: false,
  loading: () => (
    <div className={s.app}>
      <div className={s.skeleton} aria-busy="true" aria-label="Loading your training space" />
    </div>
  ),
})

export function PlanSpaceLoader(props: PlanSpaceProps) {
  return <PlanSpace {...props} />
}
