'use client'

import { useEffect, useRef, useState } from 'react'
import { PiBell, PiCamera, PiClock, PiDeviceMobile } from 'react-icons/pi'
import type { SettingsStore } from './useSettings'
import s from './space.module.css'

const PHOTO_SIZE = 320

/** Centre-crop to a square and shrink, so the photo is a few kilobytes whatever the camera produced. */
async function toSquarePhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = PHOTO_SIZE
  canvas.height = PHOTO_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

const hourLabel = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:00 ${hour < 12 ? 'am' : 'pm'}`
}

const HOURS = [6, 7, 8, 9, 10, 12, 14, 16, 17, 18, 19, 20, 21]

// Chrome's "this page can be installed" event; not in the standard DOM typings
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

type Platform = 'ios' | 'other'

function detectInstall(): { installed: boolean; platform: Platform } {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return { installed: standalone, platform: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'other' }
}

/**
 * The top of the profile: the dog's photo and name, then the settings that make
 * the space theirs (daily reminder, home-screen shortcut).
 */
export function SpaceSetup({ dogName, subtitle, store }: { dogName: string; subtitle: string; store: SettingsStore }) {
  const { settings, update } = store
  const fileInput = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [install] = useState(detectInstall)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const save = async (changes: Parameters<SettingsStore['update']>[0]) => {
    setSaveError(false)
    if (!(await update(changes))) setSaveError(true)
  }

  const onPhoto = async (file: File | undefined) => {
    setPhotoError('')
    if (!file) return
    try {
      await save({ photo: await toSquarePhoto(file) })
    } catch {
      setPhotoError('That file could not be read as a photo. Try another one.')
    }
  }

  const choosePhoto = () => fileInput.current?.click()

  return (
    <>
      <header className={s.profileHero}>
        <button type="button" className={s.profilePhoto} onClick={choosePhoto} aria-label={settings.photo ? `Change ${dogName}'s photo` : `Add a photo of ${dogName}`}>
          <span className={s.profilePhotoInner}>
            {settings.photo
              // eslint-disable-next-line @next/next/no-img-element -- a data URL: nothing for the image optimizer to do
              ? <img src={settings.photo} alt="" />
              : dogName.charAt(0).toUpperCase()}
          </span>
          <span className={s.photoBadge}><PiCamera aria-hidden /></span>
        </button>
        <div className={s.profileText}>
          <h1 className={s.title}>{dogName}</h1>
          {subtitle && <p className={s.body2}>{subtitle}</p>}
          <div className={s.inlineActions}>
            <button type="button" className={s.textBtn} onClick={choosePhoto}>
              {settings.photo ? 'Change photo' : 'Add a photo'}
            </button>
            {settings.photo && (
              <button type="button" className={`${s.textBtn} ${s.kickerMuted}`} onClick={() => save({ photo: null })}>Remove</button>
            )}
          </div>
          {photoError && <span className={s.fieldError}>{photoError}</span>}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = '' }}
        />
      </header>

      <section className={`${s.card} ${s.settings} ${s.rows}`} aria-label="Settings">
        <div className={s.setting}>
          <span className={s.rowIcon}><PiBell aria-hidden /></span>
          <label htmlFor="reminders" className={s.rowText}>
            <strong>Daily reminder</strong>
            <span>
              {settings.remindersEnabled
                ? 'One email with the day’s session. Skipped on days you have trained.'
                : 'Off. You will not get the daily email.'}
            </span>
          </label>
          <input
            id="reminders"
            type="checkbox"
            role="switch"
            className={s.switch}
            checked={settings.remindersEnabled}
            onChange={(e) => save({ remindersEnabled: e.target.checked })}
          />
        </div>

        {settings.remindersEnabled && (
          <div className={s.setting}>
            <span className={s.rowIcon}><PiClock aria-hidden /></span>
            <label htmlFor="reminder-hour" className={s.rowText}>
              <strong>Reminder time</strong>
            </label>
            <select
              id="reminder-hour"
              className={s.select}
              value={settings.reminderHour}
              onChange={(e) => save({ reminderHour: Number(e.target.value) })}
            >
              {(HOURS.includes(settings.reminderHour) ? HOURS : [...HOURS, settings.reminderHour].sort((a, b) => a - b))
                .map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
            </select>
          </div>
        )}

        {!install.installed && (
          <div className={s.setting}>
            <span className={s.rowIcon}><PiDeviceMobile aria-hidden /></span>
            <div className={s.rowText}>
              <strong>Add to home screen</strong>
              <span>
                {installPrompt
                  ? `Open ${dogName}'s space like an app, in one tap.`
                  : install.platform === 'ios'
                    ? 'In Safari, tap Share, then “Add to Home Screen”.'
                    : 'In your browser menu, choose “Add to Home screen” or “Install”.'}
              </span>
            </div>
            {installPrompt && (
              <button type="button" className={s.textBtn} onClick={() => { void installPrompt.prompt(); setInstallPrompt(null) }}>
                Add
              </button>
            )}
          </div>
        )}
      </section>

      {saveError && <p className={s.fieldError}>That did not save. Check your connection and try again.</p>}
    </>
  )
}
