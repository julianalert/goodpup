'use client'

import { useState, useEffect, useRef } from 'react'
import s from '../page.module.css'

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={s.faqItem} onClick={() => setOpen(!open)}>
      <div className={s.faqQuestion}>
        {question}
        <span className={`${s.faqIcon} ${open ? s.faqIconOpen : ''}`}>+</span>
      </div>
      <div className={`${s.faqAnswer} ${open ? s.faqAnswerOpen : ''}`}>{answer}</div>
    </div>
  )
}

export function AnimateOnScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {children}
    </div>
  )
}
