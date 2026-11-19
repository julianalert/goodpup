'use client'

import { useState } from 'react'
import { PiCaretDown, PiXBold } from 'react-icons/pi'
import type { PlanToolkit } from '@/lib/plan-types'
import s from './space.module.css'

export function ToolkitView({ toolkit, dogName }: { toolkit: PlanToolkit; dogName: string }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className={s.stack}>
      <header className={s.viewHead}>
        <h1 className={s.title}>Toolkit</h1>
        <p className={s.lead}>For the moments between sessions, when {dogName} does the thing and you need to know what to do right now.</p>
      </header>

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.h2}>What to do when…</h2>
        </div>
        <div className={s.rows}>
          {toolkit.emergencies.map((item, i) => (
            <div key={i} className={s.accordion}>
              <button type="button" className={s.accordionHead} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span>{item.situation}</span>
                <PiCaretDown className={`${s.caret} ${open === i ? s.caretOpen : ''}`} aria-hidden />
              </button>
              {open === i && (
                <ol className={s.numbered}>
                  {item.steps.map((step, j) => <li key={j}>{step}</li>)}
                </ol>
              )}
            </div>
          ))}
        </div>
      </section>

      {toolkit.houseRules.length > 0 && (
        <section className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.h2}>House rules</h2>
            <p className={s.body2}>Training only sticks if everyone at home does the same thing. Share these.</p>
          </div>
          <ol className={s.numbered}>
            {toolkit.houseRules.map((rule, i) => <li key={i}>{rule}</li>)}
          </ol>
        </section>
      )}

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.h2}>Mistakes to avoid</h2>
        </div>
        <div className={s.rows}>
          {toolkit.mistakes.map((mistake, i) => (
            <div key={i} className={s.item}>
              <span className={`${s.itemIcon} ${s.itemIconBad}`}><PiXBold aria-hidden /></span>
              <div className={s.itemText}>
                <strong>{mistake.title}</strong>
                <p>{mistake.why}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {toolkit.kit.length > 0 && (
        <section className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.h2}>What you need</h2>
          </div>
          <div className={s.rows}>
            {toolkit.kit.map((entry, i) => (
              <div key={i} className={s.item}>
                <div className={s.itemText}>
                  <strong>{entry.item}</strong>
                  <p>{entry.why}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
