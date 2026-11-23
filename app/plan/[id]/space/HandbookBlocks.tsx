import type { IconType } from 'react-icons'
import { PiEye, PiLightbulb, PiStethoscope } from 'react-icons/pi'
import { ACTIVITY_LABELS, type PortionRow } from '@/lib/feeding'
import { splitFact, type Handbook, type HandbookBlock, type HandbookSection } from '@/lib/handbook-types'
import h from './handbook.module.css'

// The content of the written add-ons (the handbook, the nutrition plan), rendered.
// No state and no browser APIs, so the training space (client) and the print page
// (server) share these exactly.

const CALLOUT_ICONS: Record<'tip' | 'watch' | 'vet', IconType> = {
  tip: PiLightbulb,
  watch: PiEye,
  vet: PiStethoscope,
}

function Block({ block }: { block: HandbookBlock }) {
  switch (block.kind) {
    case 'text':
      return <p className={h.p}>{block.text}</p>

    case 'list':
    case 'steps': {
      const List = block.kind === 'steps' ? 'ol' : 'ul'
      return (
        <div>
          {block.title && <div className={h.blockTitle}>{block.title}</div>}
          <List className={block.kind === 'steps' ? h.steps : h.list}>
            {block.items.map((item, i) => <li key={i}>{item}</li>)}
          </List>
        </div>
      )
    }

    case 'facts':
      return (
        <div>
          {block.title && <div className={h.blockTitle}>{block.title}</div>}
          <dl className={h.facts}>
            {block.items.map((item, i) => {
              const [label, value] = splitFact(item)
              return (
                <div key={i} className={h.factRow}>
                  {label && <dt>{label}</dt>}
                  <dd>{value}</dd>
                </div>
              )
            })}
          </dl>
        </div>
      )

    default: {
      const Icon = CALLOUT_ICONS[block.kind]
      return (
        <aside className={`${h.callout} ${h[block.kind]}`}>
          <Icon aria-hidden />
          <div>
            <strong>{block.title}</strong>
            <p>{block.text}</p>
          </div>
        </aside>
      )
    }
  }
}

interface ChapterProps {
  chapter: { intro: string; sections: HandbookSection[] }
  showIntro?: boolean
  /** Shown before the sections (a table, for instance) */
  lead?: React.ReactNode
}

/** A written chapter: its intro (unless shown elsewhere) and its sections. */
export function ChapterBody({ chapter, showIntro = true, lead }: ChapterProps) {
  return (
    <div className={h.sections}>
      {showIntro && chapter.intro && <p className={h.intro}>{chapter.intro}</p>}
      {lead}
      {chapter.sections.map((section, i) => (
        <section key={i}>
          <h3 className={h.sectionHeading}>{section.heading}</h3>
          <div className={h.blocks}>
            {section.blocks.map((block, j) => <Block key={j} block={block} />)}
          </div>
        </section>
      ))}
    </div>
  )
}

export function FactSheet({ facts }: { facts: Handbook['facts'] }) {
  return (
    <dl className={h.facts}>
      {facts.map((fact, i) => (
        <div key={i} className={h.factRow}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function TraitBars({ traits, className }: { traits: Handbook['traits']; className?: string }) {
  return (
    <div className={className ?? h.traits}>
      {traits.map((trait, i) => (
        <div key={i} className={h.traitItem}>
          <div className={h.traitHead}><span>{trait.label}</span><span>{trait.percent}</span></div>
          <div className={h.traitTrack}><div className={h.traitFill} style={{ width: `${trait.percent}%` }} /></div>
          {trait.note && <p className={h.traitNote}>{trait.note}</p>}
        </div>
      ))}
    </div>
  )
}

/**
 * Calories a day by weight and activity. `nearLb` marks the row closest to the
 * dog's own weight once the customer has entered it.
 */
export function PortionTable({ rows, nearLb, growing = false }: { rows: PortionRow[]; nearLb?: number | null; growing?: boolean }) {
  const nearest = nearLb
    ? rows.reduce((best, row) => (Math.abs(row.lb - nearLb) < Math.abs(best.lb - nearLb) ? row : best), rows[0])
    : null

  return (
    <table className={h.table}>
      <thead>
        <tr>
          <th scope="col">Weight</th>
          {/* A growing dog is fed for growth: one figure per weight, whatever the activity */}
          {growing ? <th scope="col">Calories a day</th> : (
            <>
              <th scope="col">{ACTIVITY_LABELS.low}</th>
              <th scope="col">{ACTIVITY_LABELS.moderate}</th>
              <th scope="col">{ACTIVITY_LABELS.high}</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.lb} className={row === nearest ? h.tableNear : undefined}>
            <th scope="row">{row.lb} lb <span>{row.kg} kg</span></th>
            {growing ? <td>{row.moderate.toLocaleString('en-US')}</td> : (
              <>
                <td>{row.low.toLocaleString('en-US')}</td>
                <td>{row.moderate.toLocaleString('en-US')}</td>
                <td>{row.high.toLocaleString('en-US')}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A printable one-pager: groups of lines, each with a box to tick. */
export function SheetBody({ sheet }: { sheet: { note: string; groups: { label: string; items: string[] }[] } }) {
  return (
    <div className={h.sheetGroups}>
      {sheet.note && <p className={h.sheetNote}>{sheet.note}</p>}
      {sheet.groups.map((group, i) => (
        <div key={i}>
          <div className={h.sheetLabel}>{group.label}</div>
          <ul className={h.sheetItems}>
            {group.items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

export const NUTRITION_DISCLAIMER =
  'This plan is general guidance written from the answers you gave us. The calories are estimates to start from, not a prescription. It is not veterinary advice: a dog that is growing, pregnant, unwell or on a special diet should be fed on your vet\'s advice.'

export const HANDBOOK_DISCLAIMER =
  'This handbook is general guidance written from the answers you gave us. It is not veterinary advice and does not replace an examination by your vet, who knows your dog.'
