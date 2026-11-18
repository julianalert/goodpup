import type { Breakdown, FunnelStage, SeriesPoint } from '@/lib/admin-data'
import s from '../admin.module.css'

// ── Formatting ─────────────────────────────────────────────────────────────

const intFormat = new Intl.NumberFormat('en-US')

export function fmtInt(n: number): string {
  return intFormat.format(n)
}

export function fmtPct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

export function fmtMoney(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtBucket(isoDate: string, bucket: 'day' | 'week'): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  const label = d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' })
  return bucket === 'week' ? `Week of ${label}` : label
}

// ── Funnel ─────────────────────────────────────────────────────────────────

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  return (
    <table className={s.funnel}>
      <thead>
        <tr>
          <th scope="col">Stage</th>
          <th scope="col" aria-label="Share of first stage" />
          <th scope="col" className={s.num}>Count</th>
          <th scope="col" className={s.num}>Of previous</th>
          <th scope="col" className={s.num}>Of top</th>
        </tr>
      </thead>
      <tbody>
        {stages.map((stage, i) => {
          const width = stage.count > 0 ? Math.max(stage.ofTop * 100, 1.5) : 0
          return (
            <tr key={stage.key} title={stage.hint}>
              <td className={s.funnelLabel}>{stage.label}</td>
              <td className={s.funnelBarCell}>
                <div className={s.track}>
                  <div
                    className={`${s.bar} ${stage.key === 'paid' ? s.barPaid : ''}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </td>
              <td className={s.num}>{fmtInt(stage.count)}</td>
              <td className={s.num} data-label="of previous">{i === 0 ? '—' : fmtPct(stage.ofPrev, 0)}</td>
              <td className={`${s.num} ${s.muted}`} data-label="of top">{fmtPct(stage.ofTop, 0)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ── Trend (column chart, server-rendered SVG) ──────────────────────────────

function niceCeil(value: number): number {
  if (value <= 5) return 5
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalised = value / magnitude
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10
  return step * magnitude
}

/** Rect with 4px rounded top corners and a square baseline. */
function columnPath(x: number, yTop: number, width: number, height: number): string {
  if (height <= 0) return ''
  const r = Math.min(4, height, width / 2)
  const yBase = yTop + height
  return [
    `M${x},${yBase}`,
    `V${yTop + r}`,
    `Q${x},${yTop} ${x + r},${yTop}`,
    `H${x + width - r}`,
    `Q${x + width},${yTop} ${x + width},${yTop + r}`,
    `V${yBase}`,
    'Z',
  ].join(' ')
}

export function TrendChart({ points, bucket }: { points: SeriesPoint[]; bucket: 'day' | 'week' }) {
  const W = 760
  const H = 240
  const ML = 40
  const MR = 12
  const MT = 12
  const MB = 30
  const plotW = W - ML - MR
  const plotH = H - MT - MB

  const n = points.length
  const yMax = niceCeil(Math.max(1, ...points.map((p) => p.starts)))
  const tickCount = 4
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (yMax / tickCount) * i)

  const slot = plotW / Math.max(n, 1)
  const gap = 2
  const barW = Math.max(2, Math.min(24, (slot - 8 - gap) / 2))
  const groupW = barW * 2 + gap
  const y = (v: number) => MT + plotH - (v / yMax) * plotH
  const labelEvery = Math.max(1, Math.ceil(n / 8))

  return (
    <div className={s.trend}>
      <div className={s.legend} aria-hidden="true">
        <span><i className={s.swatchStarts} /> Form starts</span>
        <span><i className={s.swatchPaid} /> Paid</span>
      </div>

      {n === 0 ? (
        <p className={s.empty}>No submissions in this range.</p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={s.trendSvg}
          role="img"
          aria-label={`Form starts and paid orders per ${bucket}`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} className={s.grid} />
              <text x={ML - 8} y={y(t) + 3.5} textAnchor="end" className={s.tick}>
                {fmtInt(t)}
              </text>
            </g>
          ))}

          {points.map((p, i) => {
            const x0 = ML + i * slot + (slot - groupW) / 2
            const showLabel = i % labelEvery === 0
            return (
              <g key={p.date} className={s.col}>
                <title>
                  {`${fmtBucket(p.date, bucket)} — ${p.starts} starts · ${p.emails} emails · ${p.paid} paid`}
                </title>
                <rect x={ML + i * slot} y={MT} width={slot} height={plotH} className={s.hit} />
                <path d={columnPath(x0, y(p.starts), barW, y(0) - y(p.starts))} className={s.colStarts} />
                <path d={columnPath(x0 + barW + gap, y(p.paid), barW, y(0) - y(p.paid))} className={s.colPaid} />
                {showLabel && (
                  <text x={x0 + groupW / 2} y={H - 10} textAnchor="middle" className={s.tick}>
                    {fmtBucket(p.date, 'day')}
                  </text>
                )}
              </g>
            )
          })}

          <line x1={ML} x2={W - MR} y1={y(0)} y2={y(0)} className={s.axis} />
        </svg>
      )}

      {n > 0 && (
        <details className={s.tableView}>
          <summary>Table view</summary>
          <table className={s.dataTable}>
            <thead>
              <tr>
                <th scope="col">{bucket === 'week' ? 'Week of' : 'Day'}</th>
                <th scope="col" className={s.num}>Starts</th>
                <th scope="col" className={s.num}>Emails</th>
                <th scope="col" className={s.num}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
                  <td className={s.num}>{p.starts}</td>
                  <td className={s.num}>{p.emails}</td>
                  <td className={s.num}>{p.paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}

// ── Breakdown card ─────────────────────────────────────────────────────────

export function BreakdownCard({ data }: { data: Breakdown }) {
  // Scale bars to the largest named row so a big "Other" bucket doesn't flatten them
  const max = Math.max(1, ...data.rows.filter((r) => !r.other).map((r) => r.total))
  return (
    <section className={s.card}>
      <h3 className={s.cardTitle}>{data.title}</h3>
      {data.rows.length === 0 ? (
        <p className={s.empty}>No data yet.</p>
      ) : (
        <table className={s.breakdown}>
          <thead>
            <tr>
              <th scope="col" />
              <th scope="col" aria-label="Share" />
              <th scope="col" className={s.num}>All</th>
              <th scope="col" className={s.num}>Paid</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.label}>
                <td className={s.breakdownLabel}>{row.label}</td>
                <td className={s.breakdownBarCell}>
                  <div className={s.trackThin}>
                    <div className={s.barThin} style={{ width: `${Math.min(100, (row.total / max) * 100)}%` }} />
                  </div>
                </td>
                <td className={s.num}>{fmtInt(row.total)}</td>
                <td className={`${s.num} ${row.paid > 0 ? '' : s.muted}`}>{fmtInt(row.paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
