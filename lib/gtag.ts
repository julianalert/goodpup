// Conversion events for Google Ads (tag installed by app/GoogleTag.tsx). Client-only.

import { PRICE_CENTS } from './pricing'

export const GOOGLE_ADS_ID = 'AW-18588135695'
const PURCHASE_SEND_TO = `${GOOGLE_ADS_ID}/CRT9CLaL5LwdEI_iwZ9F`

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Report a purchase. The transaction ID lets Google count an order once even if
 * it is reported again. Returns false when the tag isn't on the page yet (its
 * script is injected after hydration), so the caller can try again.
 */
export function trackPurchaseConversion(transactionId: string): boolean {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false
  window.gtag('event', 'conversion', {
    send_to: PURCHASE_SEND_TO,
    value: PRICE_CENTS / 100,
    currency: 'USD',
    transaction_id: transactionId,
  })
  return true
}
