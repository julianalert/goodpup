'use client'

import { useState } from 'react'
import { PiCaretDownBold, PiCheckBold } from 'react-icons/pi'
import { daysOfWeek, milestoneKey, progressId, type MilestoneProgress, type PlanV2 } from '@/lib/plan-types'
import type { Journey } from '@/lib/plan-progress'
import type { ProgressStore } from './useProgress'
import s from './space.module.css'

interface Props {
  plan: PlanV2
  journey: Journey
  store: ProgressStore
  onOpenDay: (day: number) => void
}

export function JourneyView({ plan, journey, store, onOpenDay }: Props) {
  const currentWeek = journey.currentDay ? Math.min(4, Math.ceil(journey.currentDay / 7)) : 4
  const [open, setOpen] = useState<number>(currentWeek)

  return (
    <div className={s.stack}>
      <header className={s.viewHead}>
        <h1 className={s.viewTitle}>The 30-day journey</h1>
        <p className={s.cardText}>Four weeks, each building on the last. Tap any day to see it.</p>
      </header>

      {plan.weeks.map((week) => {
        const days = daysOfWeek(week.week)
        const done = days.filter((d) => journey.doneDays.includes(d)).length
        const isOpen = open === week.week
        const complete = done === days.length

        return (
          <section key={week.week} className={`${s.card} ${s.week} ${week.week === currentWeek ? s.weekCurrent : ''}`}>
            <button type="button" className={s.weekHead} onClick={() => setOpen(isOpen ? 0 : week.week)} aria-expanded={isOpen}>
              <span className={`${s.weekBadge} ${complete ? s.weekBadgeDone : ''}`}>
                {complete ? <PiCheckBold aria-hidden /> : week.week}
              </span>
              <span className={s.weekTitleWrap}>
                <span className={s.eyebrow}>Week {week.week} · Days {days[0]}–{days[days.length - 1]} · {done}/{days.length} done</span>
                <span className={s.weekTitle}>{week.title}</span>
              </span>
              <PiCaretDownBold className={`${s.caret} ${isOpen ? s.caretOpen : ''}`} aria-hidden />
            </button>

            {isOpen && (
              <div className={s.weekBody}>
                <p className={s.cardText}>{week.focus}</p>
                {week.rule && (
                  <div className={s.rule}>
                    <span className={s.blockLabel}>The rule this week</span>
                    {week.rule}
                  </div>
                )}

                <ol className={s.dayList}>
                  {days.map((n) => {
                    const day = plan.days[n - 1]
                    const isDone = journey.doneDays.includes(n)
                    const isCurrent = journey.currentDay === n
                    return (
                      <li key={n}>
                        <button
                          type="button"
                          className={`${s.dayRow} ${isDone ? s.dayRowDone : ''} ${isCurrent ? s.dayRowCurrent : ''}`}
                          onClick={() => onOpenDay(n)}
                        >
                          <span className={s.dayDot}>{isDone ? <PiCheckBold aria-hidden /> : n}</span>
                          <span className={s.dayRowText}>
                            <span className={s.dayRowTitle}>{day.title}</span>
                            <span className={s.dayRowMeta}>
                              {isCurrent ? 'Up next · ' : ''}
                              {day.exercises.reduce((t, e) => t + e.minutes, 0)} min · {day.exercises.map((e) => e.name).join(', ')}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>

                <div className={s.milestones}>
                  <span className={s.blockLabel}>Milestones: tick what you have seen</span>
                  {week.milestones.map((text, i) => {
                    const key = milestoneKey(week.week, i)
                    const checked = (store.progress[progressId('milestone', key)] as MilestoneProgress | undefined)?.done === true
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`${s.step} ${checked ? s.stepDone : ''}`}
                        aria-pressed={checked}
                        onClick={() => store.save('milestone', key, { done: !checked })}
                      >
                        <span className={s.stepBox}>{checked ? <PiCheckBold aria-hidden /> : null}</span>
                        <span className={s.stepText}>{text}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
