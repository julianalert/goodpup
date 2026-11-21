'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'

// Remembers where the visitor came from (UTM tags, referrer, landing page) on
// whichever page they land on, so it is still known when they reach the quiz.
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution()
  }, [])

  return null
}
