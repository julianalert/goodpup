'use client'

import { useState } from 'react'
import s from '../page.module.css'

export function CalcFaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={s.faqItem} onClick={() => setOpen(v => !v)}>
      <div className={s.faqQuestion}>
        {question}
        <span className={`${s.faqIcon} ${open ? s.faqIconOpen : ''}`}>+</span>
      </div>
      <div className={`${s.faqAnswer} ${open ? s.faqAnswerOpen : ''}`}>{answer}</div>
    </div>
  )
}
