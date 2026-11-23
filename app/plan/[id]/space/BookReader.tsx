'use client'

import { useEffect, useState } from 'react'
import type { IconType } from 'react-icons'
import { PiCaretDown, PiDownloadSimple } from 'react-icons/pi'
import { addonSeenKey, type AddonId } from '@/lib/addons'
import type { HandbookSection } from '@/lib/handbook-types'
import { trackEvent } from '@/lib/mixpanel-client'
import { ChapterBody, SheetBody } from './HandbookBlocks'
import s from './space.module.css'

export interface ReaderChapter {
  id: string
  number: number
  title: string
  intro: string
  sections: HandbookSection[]
  /** Shown between the chapter's intro and its sections (a table, for instance) */
  lead?: React.ReactNode
}

export interface ReaderSheet {
  id: string
  title: string
  note: string
  groups: { label: string; items: string[] }[]
}

interface Props {
  sessionId: string
  addon: AddonId
  /** Above the title, e.g. "Breed handbook" */
  kicker: string
  Icon: IconType
  title: string
  subtitle: string
  /** Chapter 1: built from the add-on's own fields rather than written sections */
  first: { title: string; body: React.ReactNode }
  chapters: ReaderChapter[]
  sheetsTitle: string
  sheets: ReaderSheet[]
  disclaimer: string
  /** Between the header and the chapters (the nutrition plan's calculator) */
  children?: React.ReactNode
}

/**
 * A written add-on inside the Profile tab: one row per chapter, opened one at a
 * time, so thousands of words never land on the page at once. The same content
 * laid out as a book, for saving as a PDF or printing, is one tap away.
 * Shared by every add-on that is a book (the handbook, the nutrition plan).
 */
export function BookReader({ sessionId, addon, kicker, Icon, title, subtitle, first, chapters, sheetsTitle, sheets, disclaimer, children }: Props) {
  // 'first' = chapter 1, otherwise a chapter id or a sheet id
  const [open, setOpen] = useState<string | null>('first')

  // Opened once: Today stops announcing that it is ready
  useEffect(() => {
    try { localStorage.setItem(addonSeenKey(sessionId, addon), '1') } catch { /* private mode */ }
  }, [sessionId, addon])

  const anchor = (id: string) => `${addon}-${id}`

  const toggle = (id: string) => {
    const next = open === id ? null : id
    setOpen(next)
    if (!next) return
    trackEvent('addon_chapter_opened', { session_id: sessionId, addon, chapter: next })
    // The chapter that was open above has just closed, which pulls this one up
    // and out of view: bring its title back to the top once the page has settled.
    requestAnimationFrame(() => {
      const head = document.getElementById(anchor(next))
      if (head && head.getBoundingClientRect().top < 0) head.scrollIntoView({ block: 'start', behavior: 'instant' })
    })
  }

  const row = (id: string, label: string, rowTitle: string, body: () => React.ReactNode) => (
    <div key={id} id={anchor(id)} className={`${s.accordion} ${s.chapterRow}`}>
      <button type="button" className={s.accordionHead} onClick={() => toggle(id)} aria-expanded={open === id}>
        <span className={s.chapterNum}>{label}</span>
        <span>{rowTitle}</span>
        <PiCaretDown className={`${s.caret} ${open === id ? s.caretOpen : ''}`} aria-hidden />
      </button>
      {open === id && <div className={s.chapterBody}>{body()}</div>}
    </div>
  )

  return (
    <>
      <section className={`${s.card} ${s.bookCard}`}>
        <div className={s.cardHead}>
          <div className={s.kicker}><Icon aria-hidden /> {kicker}</div>
          <h2 className={s.h2}>{title}</h2>
          {subtitle && <p className={s.body2}>{subtitle}</p>}
        </div>
        <a
          className={s.btnSecondary}
          href={`/plan/${sessionId}/print/${addon}`}
          target="_blank"
          rel="noopener"
          onClick={() => trackEvent('addon_pdf_opened', { session_id: sessionId, addon })}
        >
          <PiDownloadSimple aria-hidden /> Download or print as PDF
        </a>
      </section>

      {children}

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.h2}>Chapters</h2>
        </div>
        <div className={s.rows}>
          {row('first', '1', first.title, () => first.body)}
          {chapters.map((chapter) =>
            row(chapter.id, String(chapter.number), chapter.title, () => <ChapterBody chapter={chapter} lead={chapter.lead} />),
          )}
        </div>
      </section>

      {sheets.length > 0 && (
        <section className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.h2}>{sheetsTitle}</h2>
            <p className={s.body2}>One page each. They print on their own pages in the PDF.</p>
          </div>
          <div className={s.rows}>
            {sheets.map((sheet) => row(sheet.id, '', sheet.title, () => <SheetBody sheet={sheet} />))}
          </div>
        </section>
      )}

      <p className={`${s.caption} ${s.center}`}>{disclaimer}</p>
    </>
  )
}
