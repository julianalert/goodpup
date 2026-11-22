import Script from 'next/script'
import { GOOGLE_ADS_ID } from '@/lib/gtag'

// The Google tag for the Google Ads account, loaded on every page.
// Conversions are sent from lib/gtag.ts.
const GOOGLE_TAG_ID = 'GTM-KSVTH4QV'

export function GoogleTag() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  )
}
