import type { HandbookSection } from '@/lib/handbook-types'
import { ChapterBody, SheetBody } from '../../space/HandbookBlocks'
import h from '../../space/handbook.module.css'

export interface PrintChapter {
  id: string
  number: number
  title: string
  intro: string
  sections: HandbookSection[]
  /** Printed between the chapter's opening and its sections (a table, for instance) */
  lead?: React.ReactNode
}

interface Props {
  /** On the cover, above the title, e.g. "Breed handbook" */
  kicker: string
  title: string
  subtitle: string
  dogName: string
  generatedAt: string
  photo: string | null
  /** Chapter 1: built from the add-on's own fields rather than written sections */
  first: { title: string; intro: string; body: React.ReactNode }
  chapters: PrintChapter[]
  /** e.g. "Cheat sheets to print" in the contents, "Cheat sheet" above each one */
  sheetsHeading: string
  sheetKicker: string
  sheets: { id: string; title: string; note: string; groups: { label: string; items: string[] }[] }[]
  disclaimer: string
}

/**
 * A written add-on laid out as a book: cover, contents, the chapters, then one
 * page per printable sheet. Each .sheet starts on a new printed page.
 * Shared by every add-on that is a book (the handbook, the nutrition plan).
 */
export function PrintBook({ kicker, title, subtitle, dogName, generatedAt, photo, first, chapters, sheetsHeading, sheetKicker, sheets, disclaimer }: Props) {
  const written = new Date(generatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      <section className={`${h.sheet} ${h.cover}`}>
        <div className={h.coverBrand}>Paw<span>Craft</span></div>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL: nothing for the image optimizer to do */}
          {photo && <img className={h.coverPhoto} src={photo} alt="" />}
          <div className={h.coverKicker}>{kicker}</div>
          <h1 className={h.coverTitle}>{title}</h1>
          {subtitle && <p className={h.coverSub}>{subtitle}</p>}
        </div>
        <div className={h.coverMeta}>Written for {dogName} · {written}</div>
      </section>

      <section className={h.sheet}>
        <div className={h.bookKicker}>Contents</div>
        <h2 className={h.bookH1}>What&apos;s inside</h2>
        <ol className={h.toc}>
          <li><span className={h.tocNum}>1</span>{first.title}</li>
          {chapters.map((chapter) => (
            <li key={chapter.id}><span className={h.tocNum}>{chapter.number}</span>{chapter.title}</li>
          ))}
        </ol>
        {sheets.length > 0 && (
          <>
            <div className={h.tocSub}>{sheetsHeading}</div>
            <ol className={h.toc}>
              {sheets.map((sheet) => <li key={sheet.id}>{sheet.title}</li>)}
            </ol>
          </>
        )}
      </section>

      <section className={h.sheet}>
        <header className={h.chapterHead}>
          <div className={h.bookKicker}>Chapter 1</div>
          <h2 className={h.bookH1}>{first.title}</h2>
          {first.intro && <p className={h.intro}>{first.intro}</p>}
        </header>
        {first.body}
      </section>

      {chapters.map((chapter) => (
        <section key={chapter.id} className={h.sheet}>
          <header className={h.chapterHead}>
            <div className={h.bookKicker}>Chapter {chapter.number}</div>
            <h2 className={h.bookH1}>{chapter.title}</h2>
            {chapter.intro && <p className={h.intro}>{chapter.intro}</p>}
          </header>
          <ChapterBody chapter={chapter} showIntro={false} lead={chapter.lead} />
        </section>
      ))}

      {sheets.map((sheet, i) => (
        <section key={sheet.id} className={h.sheet}>
          <header className={h.chapterHead}>
            <div className={h.bookKicker}>{sheetKicker}</div>
            <h2 className={h.bookH1}>{sheet.title}</h2>
          </header>
          <SheetBody sheet={sheet} />
          {i === sheets.length - 1 && <p className={h.disclaimer}>{disclaimer}</p>}
        </section>
      ))}
    </>
  )
}
