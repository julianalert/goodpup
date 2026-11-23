'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { IconType } from 'react-icons'
import {
  PiBookOpenText, PiCaretRight, PiChartLineUp, PiChartLineUpFill, PiDog, PiDogFill, PiFireFill, PiFirstAidKit,
  PiFirstAidKitFill, PiPath, PiPathFill, PiSun, PiSunFill, PiWifiSlash,
} from 'react-icons/pi'
import { ADDONS, addonDog, addonSeenKey, type AddonState } from '@/lib/addons'
import { TOTAL_DAYS, type PlanV2, type ProgressMap } from '@/lib/plan-types'
import { computeJourney } from '@/lib/plan-progress'
import { trackEvent } from '@/lib/mixpanel-client'
import { useProgress } from './space/useProgress'
import { useSettings, type SpaceSettings } from './space/useSettings'
import { useAddons } from './space/useAddons'
import { TodayView } from './space/TodayView'
import { JourneyView } from './space/JourneyView'
import { ProgressView } from './space/ProgressView'
import { ToolkitView } from './space/ToolkitView'
import { ProfileView } from './space/ProfileView'
import s from './space/space.module.css'

export interface PlanSpaceProps {
  sessionId: string
  dogName: string
  /** e.g. "German Shepherd · Adult (2–7 years)" */
  subtitle: string
  /** As the owner wrote it; empty when they gave none */
  dogBreed: string
  /** Paid extras: the ones owned, with their state, and the ones still for sale */
  initialAddons: AddonState[]
  problems: { id: string; label: string }[]
  plan: PlanV2
  initialProgress: ProgressMap
  initialSettings: SpaceSettings
  /** Opened from the admin report: the viewer's timezone must not be saved as the customer's */
  adminView?: boolean
}

const TABS: { id: string; label: string; Icon: IconType; IconOn: IconType }[] = [
  { id: 'today', label: 'Today', Icon: PiSun, IconOn: PiSunFill },
  { id: 'journey', label: 'Journey', Icon: PiPath, IconOn: PiPathFill },
  { id: 'progress', label: 'Progress', Icon: PiChartLineUp, IconOn: PiChartLineUpFill },
  { id: 'toolkit', label: 'Toolkit', Icon: PiFirstAidKit, IconOn: PiFirstAidKitFill },
  { id: 'profile', label: 'Profile', Icon: PiDog, IconOn: PiDogFill },
]

type Tab = 'today' | 'journey' | 'progress' | 'toolkit' | 'profile'

/**
 * Arriving for the add-ons: from an email (#addons, or #addon-<id> for one of
 * them) or back from paying for one. Returns the id of the element to land on.
 */
function arrivingForAddons(): string | null {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'addons' || hash.startsWith('addon-')) return hash
  return new URLSearchParams(window.location.search).has('addon_checkout') ? 'addons' : null
}

function tabFromHash(): Tab {
  if (arrivingForAddons()) return 'profile'
  const hash = window.location.hash.replace('#', '')
  return TABS.some((t) => t.id === hash) ? (hash as Tab) : 'today'
}

export default function PlanSpace({ sessionId, dogName, subtitle, dogBreed, initialAddons, problems, plan, initialProgress, initialSettings, adminView = false }: PlanSpaceProps) {
  const store = useProgress(sessionId, initialProgress)
  const settingsStore = useSettings(sessionId, initialSettings, adminView)
  const addonsStore = useAddons(sessionId, initialAddons, adminView)
  const [tab, setTab] = useState<Tab>(tabFromHash)
  // The add-ons sit at the end of the Profile tab: the element to scroll to once it shows
  const [focusAddons, setFocusAddons] = useState<string | null>(arrivingForAddons)
  const onAddonsFocused = useCallback(() => setFocusAddons(null), [])
  const [openDay, setOpenDay] = useState<number | null>(null)
  // "Now" decides whether the next day has opened and how long the streak is.
  // Refreshed whenever the page comes back to the front (it may sit open overnight).
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    trackEvent('plan_opened', { session_id: sessionId })
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(new Date())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [sessionId])

  const journey = useMemo(() => computeJourney(plan, store.progress, now), [plan, store.progress, now])

  const show = (next: Tab) => {
    setTab(next)
    window.history.replaceState(null, '', `#${next}`)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const openDayInToday = (day: number) => {
    setOpenDay(day === journey.currentDay ? null : day)
    show('today')
  }

  const selectTab = (id: Tab) => {
    if (id === 'today') setOpenDay(null)
    show(id)
  }

  const showAddon = (id: string) => {
    show('profile')
    setFocusAddons(`addon-${id}`)
  }

  // On Today: a paid add-on that needs answers, is being written, or is ready and not opened yet
  const dog = addonDog(dogName, dogBreed)
  const addonNotices = addonsStore.addons.flatMap((addon) => {
    const title = ADDONS[addon.id].title(dog)
    if (addon.status === 'awaiting_input') {
      return [{ id: addon.id, title: `${title}: a few questions first`, sub: `About two minutes, then it is written for ${dog.name}` }]
    }
    if (addon.status === 'pending' || addon.status === 'generating') {
      return [{ id: addon.id, title: `${title} is being written`, sub: 'It will be in your Profile tab in a few minutes' }]
    }
    if (addon.status === 'ready') {
      let seen = false
      try { seen = localStorage.getItem(addonSeenKey(sessionId, addon.id)) === '1' } catch { /* private mode */ }
      return seen ? [] : [{ id: addon.id, title: `${title} is ready`, sub: 'Read it in your Profile tab, or download the PDF' }]
    }
    return []
  })

  const daysDone = journey.doneDays.length
  const status = journey.currentDay === null
    ? 'All 30 days done'
    : daysDone === 0
      ? `Day 1 of ${TOTAL_DAYS}`
      : `${daysDone} of ${TOTAL_DAYS} days done`

  const tabButtons = (className: string, onClassName: string, withIcons: boolean) => TABS.map(({ id, label, Icon, IconOn }) => {
    const on = tab === id
    const Glyph = on ? IconOn : Icon
    return (
      <button
        key={id}
        type="button"
        className={`${className} ${on ? onClassName : ''}`}
        aria-current={on ? 'page' : undefined}
        onClick={() => selectTab(id as Tab)}
      >
        {withIcons && <Glyph aria-hidden />}
        <span>{label}</span>
      </button>
    )
  })

  return (
    <div className={s.app}>
      <header className={s.top}>
        <div className={s.topInner}>
          <button type="button" className={s.avatar} onClick={() => show('profile')} aria-label={`${dogName}'s profile`}>
            {settingsStore.settings.photo
              // eslint-disable-next-line @next/next/no-img-element -- a data URL: nothing for the image optimizer to do
              ? <img src={settingsStore.settings.photo} alt="" />
              : dogName.charAt(0).toUpperCase()}
          </button>
          <div className={s.topText}>
            <div className={s.topName}>{dogName}</div>
            <div className={s.topSub}>{status}</div>
          </div>
          <nav className={s.tabs} aria-label="Sections">{tabButtons(s.tab, s.tabOn, false)}</nav>
          {journey.streak > 0 && (
            <div className={s.streak} title={`${journey.streak} ${journey.streak === 1 ? 'day' : 'days'} in a row`}>
              <PiFireFill aria-hidden /> {journey.streak}
            </div>
          )}
        </div>
        <div className={s.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_DAYS} aria-valuenow={daysDone} aria-label="Days done">
          <div className={s.progressFill} style={{ width: `${(daysDone / TOTAL_DAYS) * 100}%` }} />
        </div>
      </header>

      {store.unsaved > 0 && (
        <div className={s.unsaved} role="status">
          <PiWifiSlash aria-hidden />
          <span>{store.unsaved === 1 ? 'Your last change is' : `${store.unsaved} changes are`} not saved yet.</span>
          <button type="button" onClick={store.retry}>Try again</button>
        </div>
      )}

      <main className={s.main}>
        {tab === 'today' && addonNotices.length > 0 && (
          <div className={s.notices}>
            {addonNotices.map((notice) => (
              <button key={notice.id} type="button" className={s.rowLink} onClick={() => showAddon(notice.id)}>
                <span className={s.rowIcon}><PiBookOpenText aria-hidden /></span>
                <span className={s.rowText}>
                  <strong>{notice.title}</strong>
                  <span>{notice.sub}</span>
                </span>
                <PiCaretRight className={s.chevron} aria-hidden />
              </button>
            ))}
          </div>
        )}
        {tab === 'today' && (
          <TodayView
            sessionId={sessionId}
            dogName={dogName}
            problems={problems}
            plan={plan}
            journey={journey}
            store={store}
            hasPhoto={Boolean(settingsStore.settings.photo)}
            reminderHour={settingsStore.settings.remindersEnabled ? settingsStore.settings.reminderHour : null}
            openDay={openDay}
            onCloseDay={() => setOpenDay(null)}
            onShowTab={show}
          />
        )}
        {tab === 'journey' && <JourneyView plan={plan} journey={journey} store={store} onOpenDay={openDayInToday} />}
        {tab === 'progress' && <ProgressView dogName={dogName} problems={problems} journey={journey} store={store} onOpenDay={openDayInToday} />}
        {tab === 'toolkit' && <ToolkitView toolkit={plan.toolkit} dogName={dogName} />}
        {tab === 'profile' && (
          <ProfileView
            profile={plan.profile}
            dogName={dogName}
            subtitle={subtitle}
            settingsStore={settingsStore}
            sessionId={sessionId}
            addonDog={dog}
            addonsStore={addonsStore}
            focusAddons={focusAddons}
            onAddonsFocused={onAddonsFocused}
            adminView={adminView}
          />
        )}
      </main>

      <nav className={s.nav} aria-label="Sections">
        <div className={s.navInner}>{tabButtons(s.navBtn, s.navBtnOn, true)}</div>
      </nav>
    </div>
  )
}
