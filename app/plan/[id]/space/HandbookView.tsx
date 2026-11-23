'use client'

import { PiBookOpenText } from 'react-icons/pi'
import { GLANCE_TITLE, type Handbook } from '@/lib/handbook-types'
import { BookReader } from './BookReader'
import { FactSheet, HANDBOOK_DISCLAIMER, TraitBars } from './HandbookBlocks'
import s from './space.module.css'
import h from './handbook.module.css'

/** The breed handbook inside the Profile tab. */
export function HandbookView({ sessionId, book }: { sessionId: string; book: Handbook }) {
  return (
    <BookReader
      sessionId={sessionId}
      addon="breed_handbook"
      kicker="Breed handbook"
      Icon={PiBookOpenText}
      title={book.title}
      subtitle={book.subtitle}
      first={{
        title: GLANCE_TITLE(book.dogName),
        body: (
          <div className={h.sections}>
            {book.glanceIntro && <p className={h.intro}>{book.glanceIntro}</p>}
            {book.keyPoints.length > 0 && (
              <section>
                <h3 className={h.sectionHeading}>Three things to know</h3>
                <ol className={s.numbered}>{book.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ol>
              </section>
            )}
            <section>
              <h3 className={h.sectionHeading}>Fact sheet</h3>
              <FactSheet facts={book.facts} />
            </section>
            <section>
              <h3 className={h.sectionHeading}>{book.breed} traits</h3>
              <TraitBars traits={book.traits} />
            </section>
          </div>
        ),
      }}
      chapters={book.chapters}
      sheetsTitle="Cheat sheets"
      sheets={book.sheets}
      disclaimer={HANDBOOK_DISCLAIMER}
    />
  )
}
