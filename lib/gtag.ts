export const GOOGLE_ADS_ID = 'AW-17912302186'
export const PURCHASE_CONVERSION_SEND_TO = 'AW-17912302186/xJ1TCN7O_qEcEOqUoN1C'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackPurchaseConversion(transactionId: string) {
  window.gtag?.('event', 'conversion', {
    send_to: PURCHASE_CONVERSION_SEND_TO,
    transaction_id: transactionId,
  })
}
