'use client'

import { PiShieldCheck } from 'react-icons/pi'
import type { PlanProfile } from '@/lib/plan-types'
import { SpaceSetup } from './SpaceSetup'
import type { SettingsStore } from './useSettings'
import s from './space.module.css'

interface Props {
  profile: PlanProfile
  dogName: string
  subtitle: string
  settingsStore: SettingsStore
}

export function ProfileView({ profile, dogName, subtitle, settingsStore }: Props) {
  return (
    <div className={s.stack}>
      {/* Photo and settings first, so the "make it yours" link from Today lands on them */}
      <SpaceSetup dogName={dogName} subtitle={subtitle} store={settingsStore} />

      {profile.headline && (
        <section className={s.headline}>
          <div className={s.kicker}>Where these 30 days are heading</div>
          <p>{profile.headline}</p>
        </section>
      )}

      {profile.safety && (
        <section className={`${s.card} ${s.safety}`}>
          <div className={s.cardHead}>
            <h2 className={s.h2}><PiShieldCheck aria-hidden /> Safety first</h2>
          </div>
          <div className={s.rows}>
            <div className={s.item}>
              <div className={s.itemText}><strong>Manage it while you train</strong><p>{profile.safety.management}</p></div>
            </div>
            {profile.safety.vet && (
              <div className={s.item}>
                <div className={s.itemText}><strong>See your vet</strong><p>{profile.safety.vet}</p></div>
              </div>
            )}
            {profile.safety.professional && (
              <div className={s.item}>
                <div className={s.itemText}><strong>When to bring in a professional</strong><p>{profile.safety.professional}</p></div>
              </div>
            )}
          </div>
        </section>
      )}

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.h2}>Why {dogName} does it</h2>
        </div>
        <div className={s.rows}>
          {profile.rootCauses.map((cause, i) => (
            <div key={i} className={s.item}>
              <div className={s.itemText}>
                <strong>{cause.problem}</strong>
                <p>{cause.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.h2}>Temperament</h2>
        </div>
        <div className={s.rows}>
          {profile.scores.map((score, i) => (
            <div key={i} className={s.score}>
              <div className={s.scoreHead}><span>{score.label}</span><strong>{score.level}</strong></div>
              <div className={s.scoreTrack}><div className={s.scoreFill} style={{ width: `${score.percent}%` }} /></div>
              <p className={s.body2}>{score.why}</p>
            </div>
          ))}
        </div>
      </section>

      {(profile.strengths.length > 0 || profile.watchouts.length > 0) && (
        <section className={s.card}>
          {profile.strengths.length > 0 && (
            <div className={s.traits}>
              <div className={s.cardHead}><h2 className={s.h2}>What you can build on</h2></div>
              <ul className={s.chips}>{profile.strengths.map((t, i) => <li key={i} className={`${s.chip} ${s.chipGood}`}>{t}</li>)}</ul>
            </div>
          )}
          {profile.watchouts.length > 0 && (
            <div className={s.traits}>
              <div className={s.cardHead}><h2 className={s.h2}>What to plan around</h2></div>
              <ul className={s.chips}>{profile.watchouts.map((t, i) => <li key={i} className={`${s.chip} ${s.chipWatch}`}>{t}</li>)}</ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
