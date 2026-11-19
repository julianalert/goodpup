'use client'

import { useEffect, useRef, useState } from 'react'
import { PiBellBold, PiCameraBold, PiDeviceMobileBold } from 'react-icons/pi'
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

/** Photo, reminder time and home-screen shortcut: what makes the space theirs. */
export function SpaceSetup({ dogName, store }: { dogName: string; store: SettingsStore }) {
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

  return (
    <section className={s.card}>
      <h2 className={s.cardTitle}>Your space</h2>

      <div className={s.setupRow}>
        <button type="button" className={s.photoBtn} onClick={() => fileInput.current?.click()} aria-label={`Choose a photo of ${dogName}`}>
          {settings.photo
            // eslint-disable-next-line @next/next/no-img-element -- a data URL: nothing for the image optimizer to do
            ? <img src={settings.photo} alt={dogName} />
            : <PiCameraBold aria-hidden />}
        </button>
        <div className={s.setupText}>
          <strong>{settings.photo ? `${dogName}'s photo` : `Add a photo of ${dogName}`}</strong>
          <span>It shows at the top of the space.</span>
          <div className={s.setupActions}>
            <button type="button" className={s.textBtn} onClick={() => fileInput.current?.click()}>
              {settings.photo ? 'Change photo' : 'Choose photo'}
            </button>
            {settings.photo && <button type="button" className={s.textBtn} onClick={() => save({ photo: null })}>Remove</button>}
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
      </div>

      <div className={s.setupRow}>
        <span className={s.setupIcon}><PiBellBold aria-hidden /></span>
        <div className={s.setupText}>
          <strong>Daily reminder</strong>
          <span>
            {settings.remindersEnabled
              ? 'One email a day with that day’s session. None on days you have already trained.'
              : 'Off. You will not get the daily email.'}
          </span>
          <div className={s.setupActions}>
            <label className={s.switch}>
              <input
                type="checkbox"
                checked={settings.remindersEnabled}
                onChange={(e) => save({ remindersEnabled: e.target.checked })}
              />
              <span>{settings.remindersEnabled ? 'On' : 'Off'}</span>
            </label>
            {settings.remindersEnabled && (
              <select
                className={s.select}
                value={settings.reminderHour}
                onChange={(e) => save({ reminderHour: Number(e.target.value) })}
                aria-label="Reminder time"
              >
                {(HOURS.includes(settings.reminderHour) ? HOURS : [...HOURS, settings.reminderHour].sort((a, b) => a - b))
                  .map((hour) => <option key={hour} value={hour}>{hourLabel(hour)}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      {!install.installed && (
        <div className={s.setupRow}>
          <span className={s.setupIcon}><PiDeviceMobileBold aria-hidden /></span>
          <div className={s.setupText}>
            <strong>Put it on your home screen</strong>
            <span>
              {installPrompt
                ? `Open ${dogName}'s space like an app, one tap from your home screen.`
                : install.platform === 'ios'
                  ? 'In Safari, tap the Share button, then “Add to Home Screen”.'
                  : 'Open your browser menu and choose “Add to Home screen” or “Install”.'}
            </span>
            {installPrompt && (
              <div className={s.setupActions}>
                <button type="button" className={s.textBtn} onClick={() => { void installPrompt.prompt(); setInstallPrompt(null) }}>
                  Add to home screen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {saveError && <p className={s.fieldError}>That did not save. Check your connection and try again.</p>}
    </section>
  )
}
