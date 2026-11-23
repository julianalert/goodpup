'use client'

import { useEffect } from 'react'
import { PiArrowLeft, PiDownloadSimple } from 'react-icons/pi'
import { trackEvent } from '@/lib/mixpanel-client'
import h from '../../space/handbook.module.css'

/** The bar above the book on screen (never printed): back to the space, and the browser's print dialog. */
export function PrintBar({ sessionId, addon, dogName }: { sessionId: string; addon: string; dogName: string }) {
  useEffect(() => {
    trackEvent('addon_print_viewed', { session_id: sessionId, addon })
  }, [sessionId, addon])

  const print = () => {
    trackEvent('addon_print_clicked', { session_id: sessionId, addon })
    window.print()
  }

  return (
    <div className={h.bar}>
      <a className={h.barBack} href={`/plan/${sessionId}#addons`}>
        <PiArrowLeft aria-hidden /> {dogName}&apos;s space
      </a>
      <div className={h.barRight}>
        <span className={h.barHint}>In the print window, choose &ldquo;Save as PDF&rdquo; to keep a copy.</span>
        <button type="button" className={h.barBtn} onClick={print}>
          <PiDownloadSimple aria-hidden /> Save as PDF or print
        </button>
      </div>
    </div>
  )
}
