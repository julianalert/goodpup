import { ACTIVITY_LABELS } from '@/lib/feeding'
import {
  PROFILE_TITLE,
  cleanNutritionProfile,
  formatAmount,
  portionResult,
  profileWeightLb,
  type NutritionPlan,
} from '@/lib/nutrition-types'
import { FactSheet, NUTRITION_DISCLAIMER, PortionTable } from '../../space/HandbookBlocks'
import { PrintBook } from './PrintBook'
import h from '../../space/handbook.module.css'

const BLANK = '______'

/**
 * The nutrition plan, laid out for paper. Chapter 2 opens with the dog's own
 * numbers as they stand today: from the owner's answers, or from the calculator
 * if they have updated the weight or the food since.
 */
export function NutritionBook({ plan, settings, photo }: { plan: NutritionPlan; settings: unknown; photo: string | null }) {
  const inputs = cleanNutritionProfile(settings)
  const result = portionResult(inputs, plan)
  const weightLb = profileWeightLb(inputs)
  const kcal = (n: number) => `${n.toLocaleString('en-US')} kcal`

  const numbers = [
    { label: `${plan.dogName}'s weight`, value: inputs.weight ? `${inputs.weight} ${inputs.weightUnit}` : BLANK },
    // A growing dog's amount does not depend on activity
    ...(plan.growing ? [] : [{ label: 'Activity', value: result ? ACTIVITY_LABELS[inputs.activity] : BLANK }]),
    { label: 'Calories a day', value: result ? kcal(result.dailyKcal) : BLANK },
    { label: 'From meals', value: result ? kcal(result.mealKcal) : BLANK },
    { label: 'Treats and rewards, at most', value: result ? kcal(result.treatKcal) : BLANK },
    { label: 'Food a day', value: result?.perDay ? formatAmount(result.perDay, result.amountUnit) : BLANK },
    { label: `Per meal, ${plan.mealsPerDay} meals a day`, value: result?.perMeal ? formatAmount(result.perMeal, result.amountUnit) : BLANK },
  ]

  const lead = (
    <>
      <section>
        <h3 className={h.sectionHeading}>{plan.dogName}&apos;s numbers</h3>
        <FactSheet facts={numbers} />
        <p className={h.tableNote}>
          {result
            ? `From your answers. When ${plan.dogName}'s weight or food changes, update the calculator in the training space and print this page again.`
            : `Fill these in from the calculator in ${plan.dogName}'s training space, or from the table below.`}
        </p>
      </section>
      <section>
        <h3 className={h.sectionHeading}>Calories a day, by weight</h3>
        <PortionTable rows={plan.portions} nearLb={weightLb} growing={plan.growing} />
        <p className={h.tableNote}>For a {plan.stageLabel}, treats included. {plan.portionsNote}</p>
      </section>
    </>
  )

  return (
    <PrintBook
      kicker="Nutrition plan"
      title={plan.title}
      subtitle={plan.subtitle}
      dogName={plan.dogName}
      generatedAt={plan.generatedAt}
      photo={photo}
      first={{
        title: PROFILE_TITLE(plan.dogName),
        intro: plan.profileIntro,
        body: (
          <>
            {plan.keyPoints.length > 0 && (
              <div>
                <h3 className={h.sectionHeading}>Three rules for feeding {plan.dogName}</h3>
                <ol className={h.keyPoints}>{plan.keyPoints.map((point, i) => <li key={i}>{point}</li>)}</ol>
              </div>
            )}
            <div className={h.bookBlock}>
              <h3 className={h.sectionHeading}>At a glance</h3>
              <FactSheet facts={plan.facts} />
            </div>
          </>
        ),
      }}
      chapters={plan.chapters.map((chapter) => (chapter.id === 'how_much' ? { ...chapter, lead } : chapter))}
      sheetsHeading="Pages to print"
      sheetKicker="Printable page"
      sheets={plan.sheets}
      disclaimer={NUTRITION_DISCLAIMER}
    />
  )
}
