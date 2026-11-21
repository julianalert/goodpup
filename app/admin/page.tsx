import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminStats, isRangeKey, MAX_CHARGES, RANGES, type AdminStats, type RangeKey, type TrafficRow } from '@/lib/admin-data'
import { PRICE_CENTS } from '@/lib/pricing'
import { logout } from './actions'
import { BreakdownCard, FunnelChart, TrendChart, fmtDateTime, fmtInt, fmtMoney, fmtPct } from './_components/Charts'
import s from './admin.module.css'

const DEFAULT_RANGE: RangeKey = '30d'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()

  const params = await searchParams
  const rangeParam = Array.isArray(params.range) ? params.range[0] : params.range
  const range: RangeKey = isRangeKey(rangeParam) ? rangeParam : DEFAULT_RANGE

  let stats: AdminStats | null = null
  let loadError: string | null = null
  try {
    stats = await getAdminStats(range)
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Failed to load data'
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <Link href="/admin" className={s.brand}>
            PawCraft <span>admin</span>
          </Link>
          <nav className={s.ranges} aria-label="Date range">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
              <Link
                key={key}
                href={key === DEFAULT_RANGE ? '/admin' : `/admin?range=${key}`}
                className={`${s.rangeLink} ${key === range ? s.rangeActive : ''}`}
                aria-current={key === range ? 'page' : undefined}
              >
                {RANGES[key].label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={s.headerRight}>
          {stats && <span className={s.updated}>Updated {fmtDateTime(stats.generatedAt)} UTC</span>}
          <form action={logout}>
            <button type="submit" className={s.logout}>Log out</button>
          </form>
        </div>
      </header>

      <main className={s.main}>
        {loadError && (
          <div className={s.errorBox} role="alert">
            <strong>Couldn&apos;t load data.</strong> {loadError}
          </div>
        )}

        {stats && <Dashboard stats={stats} />}
      </main>
    </div>
  )
}

function Dashboard({ stats }: { stats: AdminStats }) {
  const { totals, revenue, funnel, series, traffic, breakdowns, planHealth, recovery, recentOrders, recentAbandoned } = stats
  const rangeLabel = RANGES[stats.range].label.toLowerCase()

  const estimatedRevenue = totals.paid * PRICE_CENTS
  const avgOrder = revenue.ok && revenue.charges > 0 ? revenue.net / revenue.charges : PRICE_CENTS

  return (
    <>
      {/* ── Headline ─────────────────────────────────────────────── */}
      <section className={s.kpis} aria-label="Headline numbers">
        <div className={`${s.tile} ${s.tileHero}`}>
          <p className={s.tileLabel}>Net revenue · {rangeLabel}</p>
          {revenue.ok ? (
            <>
              <p className={s.hero}>{fmtMoney(revenue.net, revenue.currency)}</p>
              <p className={s.tileSub}>
                {fmtInt(revenue.charges)} Stripe charge{revenue.charges === 1 ? '' : 's'} matched to paid orders
                {revenue.refunded > 0 && ` · ${fmtMoney(revenue.refunded, revenue.currency)} refunded`}
                {revenue.unmatchedOrders > 0 &&
                  ` · ${fmtInt(revenue.unmatchedOrders)} paid order${revenue.unmatchedOrders === 1 ? '' : 's'} with no charge found`}
                {revenue.ignoredCharges > 0 &&
                  ` · ${fmtInt(revenue.ignoredCharges)} unrelated charge${revenue.ignoredCharges === 1 ? '' : 's'} on this Stripe account ignored`}
                {revenue.truncated && ` · only the latest ${fmtInt(MAX_CHARGES)} charges were scanned`}
              </p>
            </>
          ) : (
            <>
              <p className={s.hero}>{fmtMoney(estimatedRevenue)}</p>
              <p className={s.tileSub}>
                Estimate ({fmtInt(totals.paid)} paid × {fmtMoney(PRICE_CENTS)}). Stripe unavailable: {revenue.error}
              </p>
            </>
          )}
        </div>

        <Tile label="Paid orders" value={fmtInt(totals.paid)} sub={`${fmtMoney(avgOrder)} avg order`} />
        <Tile label="Quiz opens" value={fmtInt(totals.opens)} sub="Loaded /start" />
        <Tile label="Form starts" value={fmtInt(totals.starts)} sub={`Step 1 submitted · ${fmtPct(totals.opens ? totals.starts / totals.opens : 0, 0)} of opens`} />
        <Tile label="Emails captured" value={fmtInt(totals.emails)} sub={`${fmtPct(totals.starts ? totals.emails / totals.starts : 0, 0)} of starts`} />
        <Tile label="Checkouts started" value={fmtInt(totals.checkouts)} sub={`${fmtPct(totals.emails ? totals.checkouts / totals.emails : 0, 0)} of emails`} />
        <Tile label="Start → paid" value={fmtPct(totals.conversion)} sub="Overall conversion" />
        <Tile label="Email → paid" value={fmtPct(totals.emailConversion)} sub="Lead conversion" />
      </section>

      {/* ── Funnel ───────────────────────────────────────────────── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>Sales funnel</h2>
          <p className={s.cardHint}>
            The funnel starts when the quiz page (/start) loads; a returning visitor resumes their existing row rather
            than creating a new one. Opens are recorded from 18 Nov 2026 — before that a row was only created when
            step 1 was submitted, so older periods show every open as a start.
          </p>
        </div>
        <FunnelChart stages={funnel} />
      </section>

      {/* ── Trend ────────────────────────────────────────────────── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>Starts and orders per {series.bucket}</h2>
          <p className={s.cardHint}>Bucketed by UTC {series.bucket}. Hover a column for the numbers.</p>
        </div>
        <TrendChart points={series.points} bucket={series.bucket} />
      </section>

      {/* ── Traffic sources ──────────────────────────────────────── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>Traffic sources</h2>
          <p className={s.cardHint}>
            Where each quiz visitor came from: the UTM tags on the link that brought them to the site (any page, not
            only /start), otherwise the site that referred them. Recorded once, when the quiz first opens. Tracked
            from 21 Nov 2026 — earlier visitors show as &ldquo;Not recorded&rdquo;.
          </p>
        </div>
        {!traffic.available ? (
          <p className={s.empty}>
            Not recording yet — run <code>supabase/migrations/007_traffic_source.sql</code> in the Supabase SQL Editor
            to start.
          </p>
        ) : (
          <TrafficTable heading="Source / medium" rows={traffic.sources} empty="No quiz opens in this range." />
        )}
      </section>

      {traffic.available && (
        <section className={s.grid2}>
          <div className={s.card}>
            <div className={s.cardHead}>
              <h2 className={s.cardTitle}>Campaigns</h2>
              <p className={s.cardHint}>Grouped by utm_campaign.</p>
            </div>
            <TrafficTable heading="Campaign" rows={traffic.campaigns} empty="No visitor has arrived on a link with utm_campaign yet." />
          </div>
          <div className={s.card}>
            <div className={s.cardHead}>
              <h2 className={s.cardTitle}>Landing pages</h2>
              <p className={s.cardHint}>The first page those visitors saw.</p>
            </div>
            <TrafficTable heading="Page" rows={traffic.landingPages} empty="No landing pages recorded yet." />
          </div>
        </section>
      )}

      {/* ── Operations ───────────────────────────────────────────── */}
      <section className={s.grid2}>
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>Plan generation</h2>
            <p className={s.cardHint}>Status of the plan for every paid order in range.</p>
          </div>
          <dl className={s.statList}>
            <Stat label="Ready" value={planHealth.ready} />
            <Stat label="Generating" value={planHealth.generating} />
            <Stat label="Pending" value={planHealth.pending} />
            <Stat label="Failed" value={planHealth.failed} alert={planHealth.failed > 0} />
          </dl>
        </div>

        <div className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>Abandoned-cart emails</h2>
            <p className={s.cardHint}>Sequence sent by the 15-minute cron to unpaid leads with an email.</p>
          </div>
          <dl className={s.statList}>
            {recovery.perEmail.map((e) => (
              <Stat key={e.index} label={`Email ${e.index} (${e.label})`} value={e.sent} />
            ))}
            <Stat label="Paid after ≥1 email" value={recovery.paidAfterEmail} sub={recovery.withEmailSent ? fmtPct(recovery.paidAfterEmail / recovery.withEmailSent, 0) : undefined} />
            <Stat label="Unsubscribed after an email" value={recovery.unsubscribed} />
          </dl>
        </div>
      </section>

      {/* ── Breakdowns ───────────────────────────────────────────── */}
      <h2 className={s.sectionTitle}>Who&apos;s filling the form</h2>
      <section className={s.grid3}>
        {breakdowns.map((b) => (
          <BreakdownCard key={b.title} data={b} />
        ))}
      </section>

      {/* ── Recent orders ────────────────────────────────────────── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>Recent orders</h2>
          <p className={s.cardHint}>Latest {recentOrders.length} paid submissions in range.</p>
        </div>
        {recentOrders.length === 0 ? (
          <p className={s.empty}>No paid orders in this range.</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.dataTable}>
              <thead>
                <tr>
                  <th scope="col">When (UTC)</th>
                  <th scope="col">Dog</th>
                  <th scope="col">Email</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Links</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.session_id}>
                    <td className={s.nowrap}>{fmtDateTime(o.created_at)}</td>
                    <td className={s.nowrap}>
                      <strong>{o.dog_name ?? '—'}</strong>
                      {o.dog_breed && <span className={s.muted}> · {o.dog_breed}</span>}
                    </td>
                    <td className={s.mono}>{o.email ?? '—'}</td>
                    <td>
                      <PlanBadge status={o.plan_status} />
                    </td>
                    <td className={s.nowrap}>
                      <a href={`/plan/${o.session_id}`} target="_blank" rel="noreferrer" className={s.link}>Plan</a>
                      {o.stripe_payment_intent_id && (
                        <>
                          {' · '}
                          <a
                            href={`https://dashboard.stripe.com/payments/${o.stripe_payment_intent_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={s.link}
                          >
                            Stripe
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Recent leads not paid ────────────────────────────────── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>Leads who didn&apos;t pay</h2>
          <p className={s.cardHint}>Latest {recentAbandoned.length} submissions with an email but no payment.</p>
        </div>
        {recentAbandoned.length === 0 ? (
          <p className={s.empty}>Nothing here — every lead in range paid.</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.dataTable}>
              <thead>
                <tr>
                  <th scope="col">When (UTC)</th>
                  <th scope="col">Dog</th>
                  <th scope="col">Email</th>
                  <th scope="col">Got to</th>
                  <th scope="col" className={s.num}>Emails sent</th>
                  <th scope="col">Resume link</th>
                </tr>
              </thead>
              <tbody>
                {recentAbandoned.map((a) => (
                  <tr key={a.session_id}>
                    <td className={s.nowrap}>{fmtDateTime(a.created_at)}</td>
                    <td className={s.nowrap}>
                      <strong>{a.dog_name ?? '—'}</strong>
                      {a.dog_breed && <span className={s.muted}> · {a.dog_breed}</span>}
                    </td>
                    <td className={s.mono}>{a.email ?? '—'}</td>
                    <td className={s.nowrap}>{a.checkout_started ? 'Checkout' : 'Order page'}</td>
                    <td className={s.num}>
                      {a.recovery_emails_sent}
                      {a.unsubscribed && <span className={s.muted}> · unsubscribed</span>}
                    </td>
                    <td>
                      <a href={`/order?session_id=${a.session_id}`} target="_blank" rel="noreferrer" className={s.link}>
                        /order
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function TrafficTable({ heading, rows, empty }: { heading: string; rows: TrafficRow[]; empty: string }) {
  if (rows.length === 0) return <p className={s.empty}>{empty}</p>

  return (
    <div className={s.tableWrap}>
      <table className={s.dataTable}>
        <thead>
          <tr>
            <th scope="col">{heading}</th>
            <th scope="col" className={s.num}>Opens</th>
            <th scope="col" className={s.num}>Starts</th>
            <th scope="col" className={s.num}>Emails</th>
            <th scope="col" className={s.num}>Paid</th>
            <th scope="col" className={s.num}>Open → paid</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className={r.muted ? s.muted : undefined}>{r.muted ? r.label : <strong>{r.label}</strong>}</td>
              <td className={s.num}>{fmtInt(r.opens)}</td>
              <td className={s.num}>{fmtInt(r.starts)}</td>
              <td className={s.num}>{fmtInt(r.emails)}</td>
              <td className={`${s.num} ${r.paid > 0 ? '' : s.muted}`}>{fmtInt(r.paid)}</td>
              <td className={s.num}>{r.opens > 0 ? fmtPct(r.paid / r.opens) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={s.tile}>
      <p className={s.tileLabel}>{label}</p>
      <p className={s.tileValue}>{value}</p>
      {sub && <p className={s.tileSub}>{sub}</p>}
    </div>
  )
}

function Stat({ label, value, sub, alert }: { label: string; value: number; sub?: string; alert?: boolean }) {
  return (
    <div className={`${s.stat} ${alert ? s.statAlert : ''}`}>
      <dt>{label}</dt>
      <dd>
        {fmtInt(value)}
        {sub && <span className={s.muted}> · {sub}</span>}
      </dd>
    </div>
  )
}

function PlanBadge({ status }: { status: 'pending' | 'generating' | 'ready' | 'failed' | null }) {
  const value = status ?? 'pending'
  const cls =
    value === 'ready' ? s.badgeGood : value === 'failed' ? s.badgeBad : s.badgeNeutral
  return <span className={`${s.badge} ${cls}`}>{value}</span>
}
