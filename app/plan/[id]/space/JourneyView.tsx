'use client'

import { useState } from 'react'
import { PiCaretDown, PiCaretRight, PiCheckBold, PiPushPinFill } from 'react-icons/pi'
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
        <h1 className={s.title}>Your 30-day journey</h1>
        <p className={s.lead}>Four weeks, each building on the last. Tap any day to open it.</p>
      </header>

      {plan.weeks.map((week) => {
        const days = daysOfWeek(week.week)
        const done = days.filter((d) => journey.doneDays.includes(d)).length
        const isOpen = open === week.week
        const complete = done === days.length
        const isNow = week.week === currentWeek && !complete

        return (
          <section key={week.week} className={`${s.card} ${s.week}`}>
            <button type="button" className={s.weekHead} onClick={() => setOpen(isOpen ? 0 : week.week)} aria-expanded={isOpen}>
              <span className={`${s.weekBadge} ${complete ? s.weekBadgeDone : isNow ? s.weekBadgeNow : ''}`}>
                {complete ? <PiCheckBold aria-label="Complete" /> : week.week}
              </span>
              <span className={s.weekHeadText}>
                <span className={s.caption}>
                  Week {week.week} · Days {days[0]}–{days[days.length - 1]} · {done}/{days.length}
                  {isNow && <span className={s.nowTag}>Now</span>}
                </span>
                <span className={s.weekTitle}>{week.title}</span>
              </span>
              <PiCaretDown className={`${s.caret} ${isOpen ? s.caretOpen : ''}`} aria-hidden />
            </button>

            {isOpen && (
              <div className={s.weekBody}>
                <p className={s.body2}>{week.focus}</p>
                {week.rule && (
                  <div className={s.rule}>
                    <PiPushPinFill aria-hidden />
                    <div>
                      <strong>The rule this week</strong>
                      <p>{week.rule}</p>
                    </div>
                  </div>
                )}

                <ol className={s.rows}>
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
                          aria-label={`Day ${n}: ${day.title}${isDone ? ', done' : ''}`}
                        >
                          <span className={s.dayDot}>{isDone ? <PiCheckBold aria-hidden /> : n}</span>
                          <span className={s.dayRowText}>
                            <span className={s.dayRowTitle}>{day.title}</span>
                            <span className={s.dayRowMeta}>
                              {isCurrent && <strong className={s.upNext}>Up next · </strong>}
                              {day.exercises.reduce((t, e) => t + e.minutes, 0)} min · {day.exercises.map((e) => e.name).join(', ')}
                            </span>
                          </span>
                          <PiCaretRight className={s.chevron} aria-hidden />
                        </button>
                      </li>
                    )
                  })}
                </ol>

                <div className={s.milestones}>
                  <div className={s.cardHead}>
                    <h3 className={s.h3}>Milestones</h3>
                    <p className={s.caption}>Tick what you have seen {week.week === currentWeek ? 'so far' : 'this week'}.</p>
                  </div>
                  <ul className={s.checklist}>
                    {week.milestones.map((text, i) => {
                      const key = milestoneKey(week.week, i)
                      const checked = (store.progress[progressId('milestone', key)] as MilestoneProgress | undefined)?.done === true
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            className={`${s.check} ${checked ? s.checkOn : ''}`}
                            aria-pressed={checked}
                            onClick={() => store.save('milestone', key, { done: !checked })}
                          >
                            <span className={s.checkBox}>{checked ? <PiCheckBold aria-hidden /> : null}</span>
                            <span className={s.checkText}>{text}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
