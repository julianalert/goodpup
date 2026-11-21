import Script from 'next/script'

// The Google tag for the Google Ads account, loaded on every page.
const GOOGLE_TAG_ID = 'GTM-KSVTH4QV'

export function GoogleTag() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
        `}
      </Script>
    </>
  )
}
