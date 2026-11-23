'use client'

import { useState } from 'react'
import { PiBowlFood } from 'react-icons/pi'
import { PROFILE_TITLE, type NutritionPlan } from '@/lib/nutrition-types'
import { BookReader } from './BookReader'
import { FactSheet, NUTRITION_DISCLAIMER, PortionTable } from './HandbookBlocks'
import { PortionCalculator } from './PortionCalculator'
import s from './space.module.css'
import h from './handbook.module.css'

interface Props {
  sessionId: string
  plan: NutritionPlan
  /** The owner's answers, as last saved */
  settings: unknown
  readOnly: boolean
}

/** The nutrition plan inside the Profile tab: the dog's portions (kept current), then the chapters. */
export function NutritionView({ sessionId, plan, settings, readOnly }: Props) {
  // The dog's weight, once entered: marks its row in chapter 2's table
  const [weightLb, setWeightLb] = useState<number | null>(null)

  const portionTable = (
    <section>
      <h3 className={h.sectionHeading}>Calories a day, by weight</h3>
      <PortionTable rows={plan.portions} nearLb={weightLb} growing={plan.growing} />
      <p className={h.tableNote}>
        For a {plan.stageLabel}, treats included. {plan.portionsNote} The row nearest {plan.dogName}&apos;s weight is marked.
      </p>
    </section>
  )

  return (
    <BookReader
      sessionId={sessionId}
      addon="nutrition_plan"
      kicker="Nutrition plan"
      Icon={PiBowlFood}
      title={plan.title}
      subtitle={plan.subtitle}
      first={{
        title: PROFILE_TITLE(plan.dogName),
        body: (
          <div className={h.sections}>
            {plan.profileIntro && <p className={h.intro}>{plan.profileIntro}</p>}
            {plan.keyPoints.length > 0 && (
              <section>
                <h3 className={h.sectionHeading}>Three rules for feeding {plan.dogName}</h3>
                <ol className={s.numbered}>{plan.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ol>
              </section>
            )}
            <section>
              <h3 className={h.sectionHeading}>At a glance</h3>
              <FactSheet facts={plan.facts} />
            </section>
          </div>
        ),
      }}
      chapters={plan.chapters.map((chapter) => (chapter.id === 'how_much' ? { ...chapter, lead: portionTable } : chapter))}
      sheetsTitle="Pages to print"
      sheets={plan.sheets}
      disclaimer={NUTRITION_DISCLAIMER}
    >
      <PortionCalculator sessionId={sessionId} plan={plan} saved={settings} onWeight={setWeightLb} readOnly={readOnly} />
    </BookReader>
  )
}
