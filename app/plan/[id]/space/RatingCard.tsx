'use client'

import { ratingKey } from '@/lib/plan-types'
import { CHECKPOINT_LABELS, getRating } from '@/lib/plan-progress'
import type { ProgressStore } from './useProgress'
import s from './space.module.css'

interface Props {
  checkpoint: number
  problems: { id: string; label: string }[]
  dogName: string
  store: ProgressStore
  onSkip?: () => void
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/** "How big a problem is it right now?" — one tap per problem, saved as it is tapped. */
export function RatingCard({ checkpoint, problems, dogName, store, onSkip }: Props) {
  const isStart = checkpoint === 0

  return (
    <section className={`${s.card} ${s.rating}`}>
      <div className={s.eyebrow}>{isStart ? 'Before you start · 20 seconds' : `${CHECKPOINT_LABELS[checkpoint]} check-in`}</div>
      <h2 className={s.cardTitle}>
        {isStart ? `Where is ${dogName} today?` : `How is ${dogName} doing now?`}
      </h2>
      <p className={s.cardText}>
        {isStart
          ? 'Rate each problem as it is right now. You will rate them again every week, and this is how you will see the change.'
          : 'Rate each problem again as it is this week. Be honest: the point is to see the real trend.'}
      </p>

      {problems.map((problem) => {
        const current = getRating(store.progress, problem.id, checkpoint)
        return (
          <div key={problem.id} className={s.ratingRow}>
            <div className={s.ratingLabel}>{problem.label}</div>
            <div className={s.ratingScale} role="group" aria-label={`${problem.label}, 1 to 10`}>
              {SCORES.map((score) => (
                <button
                  key={score}
                  type="button"
                  className={`${s.ratingBtn} ${current === score ? s.ratingBtnOn : ''}`}
                  aria-pressed={current === score}
                  onClick={() => store.save('rating', ratingKey(problem.id, checkpoint), { score, at: new Date().toISOString() })}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <div className={s.ratingLegend}>
        <span>1 · barely a problem</span>
        <span>10 · as bad as it gets</span>
      </div>

      {onSkip && (
        <button type="button" className={s.linkBtn} onClick={onSkip}>Skip for now</button>
      )}
    </section>
  )
}
