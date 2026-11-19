'use client'

import { useState } from 'react'
import { PiCaretDownBold, PiXBold } from 'react-icons/pi'
import type { PlanToolkit } from '@/lib/plan-types'
import s from './space.module.css'

export function ToolkitView({ toolkit, dogName }: { toolkit: PlanToolkit; dogName: string }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className={s.stack}>
      <header className={s.viewHead}>
        <h1 className={s.viewTitle}>Toolkit</h1>
        <p className={s.cardText}>For the moments between sessions, when {dogName} does the thing and you need to know what to do right now.</p>
      </header>

      <section className={s.card}>
        <h2 className={s.cardTitle}>What to do when…</h2>
        {toolkit.emergencies.map((item, i) => (
          <div key={i} className={s.accordion}>
            <button type="button" className={s.accordionHead} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span>{item.situation}</span>
              <PiCaretDownBold className={`${s.caret} ${open === i ? s.caretOpen : ''}`} aria-hidden />
            </button>
            {open === i && (
              <ol className={s.numbered}>
                {item.steps.map((step, j) => <li key={j}>{step}</li>)}
              </ol>
            )}
          </div>
        ))}
      </section>

      {toolkit.houseRules.length > 0 && (
        <section className={`${s.card} ${s.houseRules}`}>
          <h2 className={s.cardTitle}>House rules</h2>
          <p className={s.cardText}>Training only sticks if everyone at home does the same thing. Share these.</p>
          <ol className={s.numbered}>
            {toolkit.houseRules.map((rule, i) => <li key={i}>{rule}</li>)}
          </ol>
        </section>
      )}

      <section className={s.card}>
        <h2 className={s.cardTitle}>Mistakes to avoid</h2>
        {toolkit.mistakes.map((mistake, i) => (
          <div key={i} className={s.mistake}>
            <span className={s.mistakeX}><PiXBold aria-hidden /></span>
            <div>
              <strong>{mistake.title}</strong>
              <p>{mistake.why}</p>
            </div>
          </div>
        ))}
      </section>

      {toolkit.kit.length > 0 && (
        <section className={s.card}>
          <h2 className={s.cardTitle}>What you need</h2>
          {toolkit.kit.map((entry, i) => (
            <div key={i} className={s.kitRow}>
              <strong>{entry.item}</strong>
              <p>{entry.why}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
