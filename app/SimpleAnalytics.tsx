import Script from 'next/script'

export function SimpleAnalytics() {
  return (
    <Script
      src="https://scripts.simpleanalyticscdn.com/latest.js"
      strategy="afterInteractive"
    />
  )
}
