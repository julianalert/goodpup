'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import s from './NavToolsDropdown.module.css'

const TOOLS = [
  { label: '🥣 Dog Food Calculator', href: '/dog-food-calculator' },
  { label: '📏 Puppy Size Calculator', href: '/dog-size-calculator' },
  { label: '⚖️ Dog BMI Calculator', href: '/dog-bmi-calculator' },
]

export default function NavToolsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className={s.dropdown} ref={ref}>
      <button
        type="button"
        className={s.trigger}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Tools
        <span className={`${s.chevron} ${open ? s.chevronOpen : ''}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className={s.menu} role="menu">
          {TOOLS.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className={s.item}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {tool.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
