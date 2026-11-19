'use client'

import { PiFireFill } from 'react-icons/pi'
import { TOTAL_DAYS } from '@/lib/plan-types'
import {
  CHECKPOINT_LABELS, dueCheckpoint, getDay, getRating, ratingChange, type Journey,
} from '@/lib/plan-progress'
import { RatingCard } from './RatingCard'
import type { ProgressStore } from './useProgress'
import s from './space.module.css'

interface Props {
  dogName: string
  problems: { id: string; label: string }[]
  journey: Journey
  store: ProgressStore
  onOpenDay: (day: number) => void
}

export function ProgressView({ dogName, problems, journey, store, onOpenDay }: Props) {
  const checkpoint = dueCheckpoint(store.progress, problems.map((p) => p.id), journey.doneDays.length)
  const notes = journey.doneDays
    .map((day) => ({ day, note: getDay(store.progress, day)?.note }))
    .filter((entry): entry is { day: number; note: string } => Boolean(entry.note))
    .reverse()

  return (
    <div className={s.stack}>
      <header className={s.viewHead}>
        <h1 className={s.viewTitle}>{dogName}&apos;s progress</h1>
      </header>

      <div className={s.tiles}>
        <div className={s.tile}><strong>{journey.doneDays.length}<small>/{TOTAL_DAYS}</small></strong><span>days done</span></div>
        <div className={s.tile}><strong><PiFireFill aria-hidden className={s.fire} />{journey.streak}</strong><span>day streak</span></div>
        <div className={s.tile}><strong>{journey.minutesTrained}</strong><span>minutes trained</span></div>
        <div className={s.tile}><strong>{journey.exercisesDone}</strong><span>exercises done</span></div>
      </div>

      <section className={s.card}>
        <h2 className={s.cardTitle}>The 30 days</h2>
        <div className={s.dots}>
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((day) => {
            const done = journey.doneDays.includes(day)
            const feel = journey.feels[day]
            const cls = [
              s.dot,
              done ? s.dotDone : '',
              done && feel === 'tough' ? s.dotTough : '',
              done && feel === 'nailed' ? s.dotNailed : '',
              journey.currentDay === day ? s.dotCurrent : '',
            ].join(' ')
            return (
              <button key={day} type="button" className={cls} onClick={() => onOpenDay(day)} aria-label={`Day ${day}${done ? ', done' : ''}`}>
                {day}
              </button>
            )
          })}
        </div>
        <div className={s.legend}>
          <span><i className={`${s.swatch} ${s.dotNailed}`} /> Nailed it</span>
          <span><i className={`${s.swatch} ${s.dotDone}`} /> Done</span>
          <span><i className={`${s.swatch} ${s.dotTough}`} /> Tough day</span>
        </div>
      </section>

      {checkpoint !== null && (
        <RatingCard checkpoint={checkpoint} problems={problems} dogName={dogName} store={store} />
      )}

      {problems.length > 0 && (
        <section className={s.card}>
          <h2 className={s.cardTitle}>Is it getting better?</h2>
          <p className={s.cardText}>Your own ratings, from 1 (barely a problem) to 10 (as bad as it gets). Lower is better.</p>
          {problems.map((problem) => {
            const scores = CHECKPOINT_LABELS.map((_, c) => getRating(store.progress, problem.id, c))
            const change = ratingChange(store.progress, problem.id)
            const delta = change ? change.latest - change.first : 0
            return (
              <div key={problem.id} className={s.trend}>
                <div className={s.trendHead}>
                  <span>{problem.label}</span>
                  {change && (
                    <strong className={delta < 0 ? s.better : delta > 0 ? s.worse : ''}>
                      {change.first} → {change.latest}
                    </strong>
                  )}
                </div>
                <div className={s.bars}>
                  {scores.map((score, c) => (
                    <div key={c} className={s.barCol}>
                      <div className={s.barTrack}>
                        {score !== null && <div className={s.bar} style={{ height: `${score * 10}%` }}><span>{score}</span></div>}
                      </div>
                      <span className={s.barLabel}>{CHECKPOINT_LABELS[c]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {notes.length > 0 && (
        <section className={s.card}>
          <h2 className={s.cardTitle}>Your notes</h2>
          {notes.map(({ day, note }) => (
            <div key={day} className={s.journalRow}>
              <span className={s.eyebrow}>Day {day}</span>
              <p>{note}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
