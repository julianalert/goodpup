// Server-only data layer for the admin dashboard. Uses the service-role
// Supabase client and the Stripe secret key — never import from client code.
import type Stripe from 'stripe'
import { createServerClient } from './supabase'
import { stripe } from './stripe'
import { RECOVERY_EMAIL_SEQUENCE } from './recovery-emails'

// ── Ranges ─────────────────────────────────────────────────────────────────

export type RangeKey = '7d' | '30d' | '90d' | 'all'

export const RANGES: Record<RangeKey, { label: string; days: number | null }> = {
  '7d':  { label: 'Last 7 days',  days: 7 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
  'all': { label: 'All time',     days: null },
}

export function isRangeKey(value: unknown): value is RangeKey {
  return typeof value === 'string' && value in RANGES
}

function rangeStart(range: RangeKey): Date | null {
  const days = RANGES[range].days
  if (days === null) return null
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

// ── Rows ───────────────────────────────────────────────────────────────────

interface Row {
  session_id: string
  dog_name: string | null
  dog_breed: string | null
  dog_age: string | null
  problems: string[] | null
  experience: string | null
  living: string | null
  daily_time: number | null
  training_history: string | null
  email: string | null
  current_step: number
  status: 'partial' | 'completed' | 'paid'
  plan_status: 'pending' | 'generating' | 'ready' | 'failed' | null
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  recovery_emails_sent: number | null
  recovery_suppressed: boolean | null
  created_at: string
}

const ROW_COLUMNS =
  'session_id, dog_name, dog_breed, dog_age, problems, experience, living, daily_time, training_history, ' +
  'email, current_step, status, plan_status, stripe_session_id, stripe_payment_intent_id, ' +
  'recovery_emails_sent, recovery_suppressed, created_at'

const PAGE_SIZE = 1000
const MAX_ROWS = 20000

async function fetchRows(since: Date | null): Promise<Row[]> {
  const supabase = createServerClient()
  const rows: Row[] = []

  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    let query = supabase
      .from('submissions')
      .select(ROW_COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (since) query = query.gte('created_at', since.toISOString())

    const { data, error } = await query
    if (error) throw new Error(`Supabase: ${error.message}`)

    const page = (data ?? []) as unknown as Row[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
  }

  return rows
}

// ── Stripe revenue ─────────────────────────────────────────────────────────

export interface RevenueStats {
  ok: boolean
  error?: string
  /** All amounts in cents. Only charges matched to a paid submission count. */
  gross: number
  refunded: number
  net: number
  /** Successful charges matched to a paid submission */
  charges: number
  currency: string
  /** Paid submissions whose payment intent had no charge in the fetched window */
  unmatchedOrders: number
  /** Successful charges on the Stripe account that belong to something else */
  ignoredCharges: number
  truncated: boolean
}

export const MAX_CHARGES = 1000

interface ChargeFetch {
  charges: Stripe.Charge[]
  truncated: boolean
  error?: string
}

// The Stripe account may be shared with other products, so charges are only
// counted when their payment intent is recorded on a paid submission.
async function fetchCharges(since: Date | null): Promise<ChargeFetch> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { charges: [], truncated: false, error: 'STRIPE_SECRET_KEY is not set' }
  }

  try {
    const charges = await stripe.charges
      .list({
        limit: 100,
        ...(since ? { created: { gte: Math.floor(since.getTime() / 1000) } } : {}),
      })
      .autoPagingToArray({ limit: MAX_CHARGES })

    return { charges, truncated: charges.length >= MAX_CHARGES }
  } catch (err) {
    return { charges: [], truncated: false, error: err instanceof Error ? err.message : 'Stripe request failed' }
  }
}

function computeRevenue(fetched: ChargeFetch, paidRows: Row[]): RevenueStats {
  const wanted = new Set(
    paidRows.map((r) => r.stripe_payment_intent_id).filter((id): id is string => Boolean(id)),
  )

  const base: RevenueStats = {
    ok: false,
    gross: 0,
    refunded: 0,
    net: 0,
    charges: 0,
    currency: 'usd',
    unmatchedOrders: paidRows.length,
    ignoredCharges: 0,
    truncated: fetched.truncated,
  }

  if (fetched.error) return { ...base, error: fetched.error }

  const matched = new Set<string>()
  let gross = 0
  let refunded = 0
  let count = 0
  let ignored = 0
  let currency = 'usd'

  for (const charge of fetched.charges) {
    if (!charge.paid || charge.status !== 'succeeded') continue
    const intent =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
    if (!intent || !wanted.has(intent)) {
      ignored += 1
      continue
    }
    matched.add(intent)
    gross += charge.amount
    refunded += charge.amount_refunded
    count += 1
    currency = charge.currency
  }

  return {
    ...base,
    ok: true,
    gross,
    refunded,
    net: gross - refunded,
    charges: count,
    currency,
    unmatchedOrders: paidRows.length - matched.size,
    ignoredCharges: ignored,
  }
}

// ── Aggregations ───────────────────────────────────────────────────────────

export interface FunnelStage {
  key: string
  label: string
  hint: string
  count: number
  /** share of the first stage, 0–1 */
  ofTop: number
  /** share of the previous stage, 0–1 (1 for the first stage) */
  ofPrev: number
}

export interface BreakdownRow {
  label: string
  total: number
  paid: number
  /** The folded tail ("Other"); excluded from the bar scale */
  other?: boolean
}

export interface Breakdown {
  title: string
  rows: BreakdownRow[]
}

export interface SeriesPoint {
  /** ISO date (YYYY-MM-DD) of the bucket start, UTC */
  date: string
  starts: number
  emails: number
  paid: number
}

export interface OrderRow {
  session_id: string
  created_at: string
  dog_name: string | null
  dog_breed: string | null
  email: string | null
  plan_status: Row['plan_status']
  stripe_payment_intent_id: string | null
}

export interface AbandonedRow {
  session_id: string
  created_at: string
  dog_name: string | null
  dog_breed: string | null
  email: string | null
  current_step: number
  checkout_started: boolean
  recovery_emails_sent: number
  /** Suppressed after at least one email went out (a real opt-out, not a backfill) */
  unsubscribed: boolean
}

export interface AdminStats {
  range: RangeKey
  generatedAt: string
  totals: {
    starts: number
    emails: number
    checkouts: number
    paid: number
    conversion: number       // paid / starts
    emailConversion: number  // paid / emails
  }
  revenue: RevenueStats
  funnel: FunnelStage[]
  series: { bucket: 'day' | 'week'; points: SeriesPoint[] }
  breakdowns: Breakdown[]
  planHealth: { ready: number; generating: number; pending: number; failed: number }
  recovery: {
    withEmailSent: number
    paidAfterEmail: number
    /** Unpaid, suppressed after ≥1 email — rows suppressed with 0 emails sent are legacy backfills */
    unsubscribed: number
    perEmail: { index: number; label: string; sent: number }[]
  }
  recentOrders: OrderRow[]
  recentAbandoned: AbandonedRow[]
}

const PROBLEM_LABELS: Record<string, string> = {
  leash_pulling: 'Leash pulling',
  recall: "Won't come when called",
  jumping: 'Jumping on people',
  barking: 'Excessive barking',
  aggression: 'Reactivity / aggression',
  separation: 'Separation anxiety',
  destruction: 'Chewing / destruction',
  basic_obedience: 'Basic obedience',
  potty: 'Potty training',
  biting: 'Biting / mouthing',
  stealing: 'Stealing food',
  fearful: 'Fear / anxiety',
}

const AGE_LABELS: Record<string, string> = {
  puppy_under6: 'Puppy (<6 mo)',
  puppy_6to12: 'Young pup (6–12 mo)',
  adolescent: 'Adolescent (1–2 y)',
  adult: 'Adult (2–7 y)',
  senior: 'Senior (7+ y)',
}

const LIVING_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  house_no_garden: 'House, no garden',
  house_garden: 'House + garden',
  rural: 'Rural',
}

const EXPERIENCE_LABELS: Record<string, string> = {
  first_dog: 'First dog',
  some_experience: 'Had dogs before',
  experienced: 'Experienced',
}

const TRAINING_LABELS: Record<string, string> = {
  none: 'None',
  some_home: 'Some at home',
  classes: 'Group classes',
  trainer: 'Private trainer',
}

function reachedStep(row: Row, step: number): boolean {
  return row.current_step >= step || row.status === 'completed' || row.status === 'paid'
}

function hasEmail(row: Row): boolean {
  return Boolean(row.email) || row.status === 'completed' || row.status === 'paid'
}

function ratio(num: number, den: number): number {
  return den > 0 ? num / den : 0
}

function buildFunnel(rows: Row[]): FunnelStage[] {
  const defs: { key: string; label: string; hint: string; test: (r: Row) => boolean }[] = [
    { key: 'step1',    label: 'Step 1 · About the dog',   hint: 'Row created when step 1 is submitted', test: () => true },
    { key: 'step2',    label: 'Step 2 · Problems',        hint: 'current_step ≥ 2',                      test: (r) => reachedStep(r, 2) },
    { key: 'step3',    label: 'Step 3 · Situation',       hint: 'current_step ≥ 3',                      test: (r) => reachedStep(r, 3) },
    { key: 'step4',    label: 'Step 4 · Time & history',  hint: 'current_step ≥ 4',                      test: (r) => reachedStep(r, 4) },
    { key: 'email',    label: 'Step 5 · Email captured',  hint: 'status completed or email present',    test: hasEmail },
    { key: 'checkout', label: 'Checkout started',         hint: 'Stripe Checkout session created',       test: (r) => Boolean(r.stripe_session_id) || r.status === 'paid' },
    { key: 'paid',     label: 'Paid',                     hint: 'Stripe webhook marked the row paid',    test: (r) => r.status === 'paid' },
  ]

  const counts = defs.map((d) => rows.filter(d.test).length)
  const top = counts[0] ?? 0

  return defs.map((d, i) => ({
    key: d.key,
    label: d.label,
    hint: d.hint,
    count: counts[i],
    ofTop: ratio(counts[i], top),
    ofPrev: i === 0 ? (top > 0 ? 1 : 0) : ratio(counts[i], counts[i - 1]),
  }))
}

function breakdown(
  title: string,
  rows: Row[],
  pick: (r: Row) => string[] | string | null | undefined,
  labels: Record<string, string> | null,
  opts: { limit?: number; keepOrder?: string[] } = {},
): Breakdown {
  const map = new Map<string, BreakdownRow>()

  for (const row of rows) {
    const raw = pick(row)
    const values = Array.isArray(raw) ? raw : raw ? [raw] : []
    for (const v of values) {
      const key = String(v).trim()
      if (!key) continue
      const label = labels?.[key] ?? key
      const entry = map.get(label) ?? { label, total: 0, paid: 0 }
      entry.total += 1
      if (row.status === 'paid') entry.paid += 1
      map.set(label, entry)
    }
  }

  let list = Array.from(map.values())

  if (opts.keepOrder) {
    const order = opts.keepOrder.map((k) => labels?.[k] ?? k)
    list.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
  } else {
    list.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
  }

  if (opts.limit && list.length > opts.limit) {
    const head = list.slice(0, opts.limit)
    const tail = list.slice(opts.limit)
    head.push({
      label: `Other (${tail.length} more)`,
      total: tail.reduce((s, r) => s + r.total, 0),
      paid: tail.reduce((s, r) => s + r.paid, 0),
      other: true,
    })
    list = head
  }

  return { title, rows: list }
}

function normaliseBreed(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase())
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function weekStart(date: Date): Date {
  // Monday-based week, UTC
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  return d
}

function buildSeries(rows: Row[], since: Date | null): AdminStats['series'] {
  const now = new Date()
  const oldest = rows.length ? new Date(rows[rows.length - 1].created_at) : now
  const start = since ?? oldest
  const spanDays = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 86_400_000))
  const bucket: 'day' | 'week' = spanDays > 90 ? 'week' : 'day'

  const buckets = new Map<string, SeriesPoint>()

  // Pre-fill every bucket so gaps render as zero
  const cursor = bucket === 'week' ? weekStart(start) : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  while (cursor <= now) {
    const key = dayKey(cursor)
    buckets.set(key, { date: key, starts: 0, emails: 0, paid: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + (bucket === 'week' ? 7 : 1))
  }

  for (const row of rows) {
    const created = new Date(row.created_at)
    const key = dayKey(bucket === 'week' ? weekStart(created) : created)
    const point = buckets.get(key) ?? { date: key, starts: 0, emails: 0, paid: 0 }
    point.starts += 1
    if (hasEmail(row)) point.emails += 1
    if (row.status === 'paid') point.paid += 1
    buckets.set(key, point)
  }

  const points = Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date))
  return { bucket, points }
}

// ── Public entry point ─────────────────────────────────────────────────────

export async function getAdminStats(range: RangeKey): Promise<AdminStats> {
  const since = rangeStart(range)

  const [rows, chargeFetch] = await Promise.all([fetchRows(since), fetchCharges(since)])

  const paidRows = rows.filter((r) => r.status === 'paid')
  const revenue = computeRevenue(chargeFetch, paidRows)
  const emailRows = rows.filter(hasEmail)
  const checkoutRows = rows.filter((r) => Boolean(r.stripe_session_id) || r.status === 'paid')

  const funnel = buildFunnel(rows)

  const breakdowns: Breakdown[] = [
    breakdown('Breeds', rows, (r) => normaliseBreed(r.dog_breed), null, { limit: 8 }),
    breakdown('Problems selected', rows, (r) => r.problems, PROBLEM_LABELS),
    breakdown('Dog age', rows, (r) => r.dog_age, AGE_LABELS, { keepOrder: Object.keys(AGE_LABELS) }),
    breakdown('Living situation', rows, (r) => r.living, LIVING_LABELS, { keepOrder: Object.keys(LIVING_LABELS) }),
    breakdown('Owner experience', rows, (r) => r.experience, EXPERIENCE_LABELS, { keepOrder: Object.keys(EXPERIENCE_LABELS) }),
    breakdown('Training history', rows, (r) => r.training_history, TRAINING_LABELS, { keepOrder: Object.keys(TRAINING_LABELS) }),
  ]

  const planHealth = { ready: 0, generating: 0, pending: 0, failed: 0 }
  for (const row of paidRows) {
    const status = row.plan_status ?? 'pending'
    if (status in planHealth) planHealth[status as keyof typeof planHealth] += 1
  }

  const withEmailSent = rows.filter((r) => (r.recovery_emails_sent ?? 0) > 0)
  const recovery = {
    withEmailSent: withEmailSent.length,
    paidAfterEmail: withEmailSent.filter((r) => r.status === 'paid').length,
    unsubscribed: rows.filter(
      (r) => r.recovery_suppressed && r.status !== 'paid' && (r.recovery_emails_sent ?? 0) > 0,
    ).length,
    perEmail: RECOVERY_EMAIL_SEQUENCE.map((_, i) => ({
      index: i + 1,
      label: ['30 min', '24 h', '72 h', '120 h'][i] ?? `#${i + 1}`,
      sent: rows.filter((r) => (r.recovery_emails_sent ?? 0) >= i + 1).length,
    })),
  }

  const recentOrders: OrderRow[] = paidRows.slice(0, 15).map((r) => ({
    session_id: r.session_id,
    created_at: r.created_at,
    dog_name: r.dog_name,
    dog_breed: r.dog_breed,
    email: r.email,
    plan_status: r.plan_status,
    stripe_payment_intent_id: r.stripe_payment_intent_id,
  }))

  const recentAbandoned: AbandonedRow[] = rows
    .filter((r) => r.status !== 'paid' && hasEmail(r))
    .slice(0, 15)
    .map((r) => ({
      session_id: r.session_id,
      created_at: r.created_at,
      dog_name: r.dog_name,
      dog_breed: r.dog_breed,
      email: r.email,
      current_step: r.current_step,
      checkout_started: Boolean(r.stripe_session_id),
      recovery_emails_sent: r.recovery_emails_sent ?? 0,
      unsubscribed: Boolean(r.recovery_suppressed) && (r.recovery_emails_sent ?? 0) > 0,
    }))

  return {
    range,
    generatedAt: new Date().toISOString(),
    totals: {
      starts: rows.length,
      emails: emailRows.length,
      checkouts: checkoutRows.length,
      paid: paidRows.length,
      conversion: ratio(paidRows.length, rows.length),
      emailConversion: ratio(paidRows.length, emailRows.length),
    },
    revenue,
    funnel,
    series: buildSeries(rows, since),
    breakdowns,
    planHealth,
    recovery,
    recentOrders,
    recentAbandoned,
  }
}
