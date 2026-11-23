import { GLANCE_TITLE, type Handbook } from '@/lib/handbook-types'
import { FactSheet, HANDBOOK_DISCLAIMER, TraitBars } from '../../space/HandbookBlocks'
import { PrintBook } from './PrintBook'
import h from '../../space/handbook.module.css'

/** The breed handbook, laid out for paper. */
export function HandbookBook({ book, photo }: { book: Handbook; photo: string | null }) {
  return (
    <PrintBook
      kicker="Breed handbook"
      title={book.title}
      subtitle={book.subtitle}
      dogName={book.dogName}
      generatedAt={book.generatedAt}
      photo={photo}
      first={{
        title: GLANCE_TITLE(book.dogName),
        intro: book.glanceIntro,
        body: (
          <>
            {book.keyPoints.length > 0 && (
              <div>
                <h3 className={h.sectionHeading}>Three things to know</h3>
                <ol className={h.keyPoints}>{book.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ol>
              </div>
            )}
            <div className={h.bookBlock}>
              <h3 className={h.sectionHeading}>Fact sheet</h3>
              <FactSheet facts={book.facts} />
            </div>
            <div className={h.bookBlock}>
              <h3 className={h.sectionHeading}>{book.breed} traits</h3>
              <TraitBars traits={book.traits} className={h.traitGrid} />
            </div>
          </>
        ),
      }}
      chapters={book.chapters}
      sheetsHeading="Cheat sheets to print"
      sheetKicker="Cheat sheet"
      sheets={book.sheets}
      disclaimer={HANDBOOK_DISCLAIMER}
    />
  )
}
