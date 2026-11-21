import Script from 'next/script'

// The ChatGPT ads pixel (OpenAI), loaded on every page. Conversions are sent
// from lib/oaiq.ts. Debug logging is on outside production only.
const OPENAI_PIXEL_ID = 'Tfz2SAcx65Ea1MUh7qphGM'

export function OpenAIPixel() {
  const debug = process.env.NODE_ENV !== 'production'

  return (
    <Script id="openai-pixel" strategy="afterInteractive">
      {`
        !function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f);}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");
        oaiq("init",{pixelId:"${OPENAI_PIXEL_ID}",debug:${debug}});
      `}
    </Script>
  )
}
