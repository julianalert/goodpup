// Where a visitor came from, remembered in the browser so the quiz can record it
// on their database row (see app/api/submission). Client-only.
//
// The rule is "last campaign wins": a visit that arrives on a tagged link (UTM
// parameters, or an ad click ID) replaces whatever was remembered; an untagged
// visit only fills the slot when it is empty. So someone who finds us on Google,
// then comes back a week later through an ad, counts for the ad.

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  /** Hostname of the site that sent them (never our own), e.g. "google.com" */
  referrer?: string
  /** Path of the first page they landed on, e.g. "/dogs/labrador" */
  landing_page?: string
}

const STORAGE_KEY = 'pawcraft_attribution'
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const MAX_LENGTH = 200

// Ad platforms tag their clicks with an ID even when the link has no UTM
// parameters (Google Ads auto-tagging, for one). Used only when utm_source is absent.
const CLICK_IDS: { param: string; source: string; medium: string }[] = [
  { param: 'gclid',   source: 'google',   medium: 'cpc' },
  { param: 'gbraid',  source: 'google',   medium: 'cpc' },
  { param: 'wbraid',  source: 'google',   medium: 'cpc' },
  { param: 'msclkid', source: 'bing',     medium: 'cpc' },
  { param: 'ttclid',  source: 'tiktok',   medium: 'paid' },
  { param: 'fbclid',  source: 'facebook', medium: 'social' },
]

function readCampaign(params: URLSearchParams): Attribution | null {
  const found: Attribution = {}
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().slice(0, MAX_LENGTH)
    if (value) found[key] = value
  }

  if (!found.utm_source) {
    const click = CLICK_IDS.find((c) => params.has(c.param))
    if (click) {
      found.utm_source = click.source
      found.utm_medium = found.utm_medium ?? click.medium
    }
  }

  return Object.keys(found).length > 0 ? found : null
}

function externalReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined
    const host = new URL(document.referrer).hostname.replace(/^www\./, '')
    const own = window.location.hostname.replace(/^www\./, '')
    return host && host !== own ? host.slice(0, MAX_LENGTH) : undefined
  } catch {
    return undefined
  }
}

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? (parsed as Attribution) : null
  } catch {
    return null
  }
}

/**
 * The campaign this visitor counts for (this page's own tags, else the remembered
 * ones), without recording anything.
 */
export function peekAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  return readCampaign(new URLSearchParams(window.location.search)) ?? readStored()
}

/**
 * Record this visit's source if it has one worth keeping, and return what is
 * remembered for this visitor. Safe to call any number of times per page.
 */
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null

  const stored = readStored()
  const campaign = readCampaign(new URLSearchParams(window.location.search))
  if (!campaign && stored) return stored

  const next: Attribution = {
    ...campaign,
    referrer: externalReferrer(),
    landing_page: window.location.pathname.slice(0, MAX_LENGTH),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked (private mode): this page load still reports its own source
  }
  return next
}
