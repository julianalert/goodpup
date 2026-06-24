/** Trailing brand suffix Google already adds as the site name — keep it out of page titles. */
const BRAND_TITLE_SUFFIX = /\s*[—–-]\s*Paw(?:Plan|Craft)\s*$/i

/** Strip legacy PawPlan branding from SEO fields stored in the database. */
export function sanitizeMetaText(text: string | null | undefined): string | undefined {
  if (!text) return undefined
  return text.replace(/\bPawPlan\b/gi, 'PawCraft').trim()
}

/** Page titles should be topic-only; Google appends the site name separately. */
export function sanitizeMetaTitle(title: string | null | undefined, fallback: string): string {
  const cleaned = sanitizeMetaText(title)?.replace(BRAND_TITLE_SUFFIX, '').trim()
  if (cleaned) return cleaned
  return fallback.replace(BRAND_TITLE_SUFFIX, '').trim()
}
