'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { PiPlusBold } from 'react-icons/pi'
import s from '../page.module.css'

export function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const answerId = useId()
  return (
    <div className={`${s.faqItem} ${open ? s.faqItemOpen : ''}`}>
      <button
        type="button"
        className={s.faqQuestion}
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen(!open)}
      >
        {question}
        <span className={`${s.faqIcon} ${open ? s.faqIconOpen : ''}`} aria-hidden="true">
          <PiPlusBold />
        </span>
      </button>
      <div id={answerId} className={`${s.faqAnswer} ${open ? s.faqAnswerOpen : ''}`}>
        <div className={s.faqAnswerInner}>{answer}</div>
      </div>
    </div>
  )
}

export function AnimateOnScroll({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  /** Stagger delay in ms */
  delay?: number
}) {
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
        transitionDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </div>
  )
}
