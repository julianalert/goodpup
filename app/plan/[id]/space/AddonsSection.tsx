'use client'

import { useEffect, useRef, useState } from 'react'
import { PiArrowClockwise, PiLockSimple, PiLockSimpleFill, PiWarningCircle } from 'react-icons/pi'
import { ADDONS, formatPrice, type AddonDog, type AddonId, type AddonState } from '@/lib/addons'
import { isHandbook } from '@/lib/handbook-types'
import { isNutritionPlan } from '@/lib/nutrition-types'
import { HandbookView } from './HandbookView'
import { NutritionIntake } from './NutritionIntake'
import { NutritionView } from './NutritionView'
import type { AddonsStore } from './useAddons'
import s from './space.module.css'

interface Props {
  sessionId: string
  dog: AddonDog
  store: AddonsStore
  /**
   * Scroll here once shown (arriving from a notice, an email or a payment):
   * 'addons' for the section, 'addon-<id>' for one add-on. Null = stay put.
   */
  focus: string | null
  onFocused: () => void
  /** The admin's look at a customer's space: nothing can be bought or started */
  readOnly: boolean
}

/**
 * The customer's add-ons, at the end of the Profile tab. Each one is in one of
 * four states: locked (with what's inside and a button to buy it), being
 * written, taking too long, or ready (its own view).
 */
export function AddonsSection({ sessionId, dog, store, focus, onFocused, readOnly }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focus) return
    const target = document.getElementById(focus) ?? ref.current
    target?.scrollIntoView({ block: 'start' })
    onFocused()
  }, [focus, onFocused])

  if (store.addons.length === 0) return null

  return (
    <div ref={ref} id="addons" className={`${s.stack} ${s.addons}`}>
      {store.addons.map((addon) => (
        <div key={addon.id} id={`addon-${addon.id}`} className={`${s.stack} ${s.addons}`}>
          <Addon sessionId={sessionId} dog={dog} addon={addon} store={store} readOnly={readOnly} />
        </div>
      ))}
    </div>
  )
}

/** One view per add-on, once it is ready. Null = its content has not reached this page yet. */
function readyView(id: AddonId, sessionId: string, addon: AddonState, readOnly: boolean): React.ReactNode | null {
  const { content } = addon
  switch (id) {
    case 'breed_handbook':
      return isHandbook(content) ? <HandbookView sessionId={sessionId} book={content} /> : null
    case 'nutrition_plan':
      return isNutritionPlan(content)
        ? <NutritionView sessionId={sessionId} plan={content} settings={addon.settings ?? null} readOnly={readOnly} />
        : null
  }
}

/** The questions an add-on asks before it is written. Null = it asks none. */
function intakeView(id: AddonId, sessionId: string, dog: AddonDog, title: string, store: AddonsStore, readOnly: boolean): React.ReactNode | null {
  switch (id) {
    case 'nutrition_plan':
      return (
        <NutritionIntake
          sessionId={sessionId}
          dog={dog}
          title={title}
          onSubmit={async (answers) => {
            const sent = await store.submitIntake(id, answers)
            // The long form gives way to a short "being written" card: keep it in view
            if (sent) requestAnimationFrame(() => document.getElementById(`addon-${id}`)?.scrollIntoView({ block: 'start' }))
            return sent
          }}
          readOnly={readOnly}
        />
      )
    default:
      return null
  }
}

// How much of a locked add-on's contents shows before "Show all"
const LOCKED_PREVIEW = 4

/** What's inside a locked add-on: the first few lines, the rest one tap away. */
function LockedContents({ lines }: { lines: string[] }) {
  const [all, setAll] = useState(false)
  const shown = all ? lines : lines.slice(0, LOCKED_PREVIEW)
  return (
    <>
      <ul className={s.lockedList}>
        {shown.map((line, i) => (
          <li key={i}><PiLockSimple aria-hidden /><span>{line}</span></li>
        ))}
      </ul>
      {lines.length > LOCKED_PREVIEW && (
        <button type="button" className={`${s.textBtn} ${s.lockedMore}`} onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? 'Show less' : `Show all ${lines.length}`}
        </button>
      )}
    </>
  )
}

function Addon({ sessionId, dog, addon, store, readOnly }: { sessionId: string; dog: AddonDog; addon: AddonState; store: AddonsStore; readOnly: boolean }) {
  const def = ADDONS[addon.id]
  const title = def.title(dog)

  if (addon.status === 'ready') {
    const view = readyView(addon.id, sessionId, addon, readOnly)
    if (view) return <>{view}</>
    // Ready, but its content has not reached this page yet
    return (
      <section className={`${s.card} ${s.addonWait}`}>
        <span className={s.spinner} aria-hidden />
        <p className={s.body2}>Opening {title}…</p>
      </section>
    )
  }

  // Paid, and waiting for the customer's answers before it is written
  if (addon.status === 'awaiting_input') {
    const form = intakeView(addon.id, sessionId, dog, title, store, readOnly)
    if (form) return <>{form}</>
  }

  if (addon.status === 'locked') {
    const busy = store.unlocking === addon.id
    return (
      <section className={s.card}>
        <div className={s.cardHead}>
          <div className={`${s.kicker} ${s.kickerMuted}`}><PiLockSimpleFill aria-hidden /> Add-on</div>
          <h2 className={s.h2}>{title}</h2>
          <p className={s.body2}>{def.pitch(dog)}</p>
        </div>

        <LockedContents lines={def.contents(dog)} />

        {store.confirming ? (
          <div className={s.addonWait}>
            <span className={s.spinner} aria-hidden />
            <p className={s.body2}>Confirming your payment…</p>
          </div>
        ) : !readOnly && (
          <>
            <button type="button" className={s.btnPrimary} onClick={() => store.unlock(addon.id)} disabled={busy}>
              {busy ? 'Opening secure payment…' : `Unlock for ${formatPrice(def.priceCents)}`}
            </button>
            {store.unlockFailed && <p className={`${s.fieldError} ${s.center}`}>Something went wrong. Please try again.</p>}
            <p className={`${s.caption} ${s.center} ${s.addonFoot}`}>
              One-time payment, no subscription. {def.intake ? def.intake.note(dog) : `Written for ${dog.name} right after you pay.`} {def.facts.join(' · ')}.
            </p>
          </>
        )}
      </section>
    )
  }

  // Paid: waiting for its turn, being written, or the last attempt failed
  const delayed = addon.status === 'failed' && store.stuck
  // Written after another add-on that is still on its way (see ADDONS[id].after)
  const waitingFor = addon.status === 'pending'
    ? (def.after ?? []).find((id) => store.addons.some((a) => a.id === id && (a.status === 'pending' || a.status === 'generating')))
    : undefined
  return (
    <section className={s.card} aria-live="polite">
      <div className={s.cardHead}>
        <div className={s.kicker}>Add-on</div>
        <h2 className={s.h2}>{title}</h2>
      </div>
      {delayed ? (
        <>
          <div className={s.addonNote}>
            <PiWarningCircle aria-hidden />
            <p>This is taking longer than it should. Your payment is safe: we keep trying and will email you as soon as it is ready.</p>
          </div>
          {!readOnly && (
            <button type="button" className={s.btnSecondary} onClick={store.retry}>
              <PiArrowClockwise aria-hidden /> Try again now
            </button>
          )}
        </>
      ) : (
        <div className={s.addonWait}>
          <span className={s.spinner} aria-hidden />
          <div>
            <p className={s.addonWaitTitle}>
              {waitingFor ? `Next: written right after ${ADDONS[waitingFor].title(dog)}` : `Being written for ${dog.name} now`}
            </p>
            <p className={s.body2}>
              {waitingFor ? 'The two are written to agree with each other, a few minutes apart.' : def.waitNote}{' '}
              It appears here by itself, and we email you too, so you can carry on with today&apos;s session.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
