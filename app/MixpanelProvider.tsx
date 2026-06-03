'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initMixpanel, trackEvent } from '@/lib/mixpanel-client'

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    initMixpanel()
  }, [])

  useEffect(() => {
    if (!pathname) return
    trackEvent('page_viewed', { page: pathname })
  }, [pathname])

  return children
}
