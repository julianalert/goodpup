'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import NavToolsDropdown, { TOOLS } from './NavToolsDropdown'
import s from './SiteNav.module.css'

// Keep in sync with the max-width breakpoint in SiteNav.module.css
const DESKTOP_QUERY = '(min-width: 721px)'

type Props = {
  ctaHref: string
  ctaLabel: string
}

export default function SiteNav({ ctaHref, ctaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const onResize = () => {
      if (desktop.matches) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onResize)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onResize)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <nav className={s.nav}>
      <Link href="/" className={s.logo} onClick={close}>
        <Image src="/icon.png" alt="" width={28} height={28} className="appIcon" />
        Paw<span>Craft</span>
      </Link>

      {/* Desktop */}
      <div className={s.links}>
        <Link href="/dogs" className={s.link}>Dogs</Link>
        <NavToolsDropdown />
      </div>
      <Link href={ctaHref} className={s.cta}>{ctaLabel}</Link>

      {/* Mobile */}
      <button
        type="button"
        className={`${s.burger} ${open ? s.burgerOpen : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="site-nav-mobile"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <span className={s.burgerBar} />
        <span className={s.burgerBar} />
        <span className={s.burgerBar} />
      </button>

      {open && <div className={s.backdrop} onClick={close} aria-hidden="true" />}
      <div id="site-nav-mobile" className={s.mobileMenu} hidden={!open}>
        <Link href="/dogs" className={s.mobileLink} onClick={close}>Dogs</Link>
        <p className={s.mobileHeading}>Tools</p>
        {TOOLS.map(tool => (
          <Link key={tool.href} href={tool.href} className={s.mobileLink} onClick={close}>
            {tool.label}
          </Link>
        ))}
        <Link href={ctaHref} className={s.mobileCta} onClick={close}>{ctaLabel}</Link>
      </div>
    </nav>
  )
}
