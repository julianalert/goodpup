// Conversion events for the ChatGPT ads pixel (installed by app/OpenAIPixel.tsx). Client-only.

declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void
  }
}

/**
 * Report a completed order. Returns false when the pixel isn't on the page yet
 * (its script is injected after hydration), so the caller can try again.
 */
export function measureOrderCreated(): boolean {
  if (typeof window === 'undefined' || typeof window.oaiq !== 'function') return false
  window.oaiq('measure', 'order_created', { type: 'contents' })
  return true
}
