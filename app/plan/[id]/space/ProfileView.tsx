'use client'

import { PiShieldCheckBold } from 'react-icons/pi'
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
      <header className={s.viewHead}>
        <h1 className={s.viewTitle}>About {dogName}</h1>
        <p className={s.cardText}>{subtitle}</p>
      </header>

      {/* First, so the "make it yours" link from Today lands on it */}
      <SpaceSetup dogName={dogName} store={settingsStore} />

      {profile.headline && (
        <section className={`${s.card} ${s.goal}`}>
          <span className={s.blockLabel}>Where these 30 days are heading</span>
          <p>{profile.headline}</p>
        </section>
      )}

      {profile.safety && (
        <section className={`${s.card} ${s.safety}`}>
          <h2 className={s.cardTitle}><PiShieldCheckBold aria-hidden /> Safety first</h2>
          <div className={s.safetyBlock}><span className={s.blockLabel}>Manage it while you train</span>{profile.safety.management}</div>
          {profile.safety.vet && <div className={s.safetyBlock}><span className={s.blockLabel}>See your vet</span>{profile.safety.vet}</div>}
          {profile.safety.professional && <div className={s.safetyBlock}><span className={s.blockLabel}>When to bring in a professional</span>{profile.safety.professional}</div>}
        </section>
      )}

      <section className={s.card}>
        <h2 className={s.cardTitle}>Why {dogName} does it</h2>
        {profile.rootCauses.map((cause, i) => (
          <div key={i} className={s.cause}>
            <strong>{cause.problem}</strong>
            <p>{cause.explanation}</p>
          </div>
        ))}
      </section>

      <section className={s.card}>
        <h2 className={s.cardTitle}>Temperament</h2>
        {profile.scores.map((score, i) => (
          <div key={i} className={s.score}>
            <div className={s.scoreHead}><span>{score.label}</span><strong>{score.level}</strong></div>
            <div className={s.scoreTrack}><div className={s.scoreFill} style={{ width: `${score.percent}%` }} /></div>
            <p>{score.why}</p>
          </div>
        ))}
      </section>

      {(profile.strengths.length > 0 || profile.watchouts.length > 0) && (
        <section className={s.card}>
          {profile.strengths.length > 0 && (
            <>
              <h2 className={s.cardTitle}>What you can build on</h2>
              <div className={s.chips}>{profile.strengths.map((t, i) => <span key={i} className={`${s.chip} ${s.chipGood}`}>{t}</span>)}</div>
            </>
          )}
          {profile.watchouts.length > 0 && (
            <>
              <h2 className={`${s.cardTitle} ${s.spaced}`}>What to plan around</h2>
              <div className={s.chips}>{profile.watchouts.map((t, i) => <span key={i} className={`${s.chip} ${s.chipWatch}`}>{t}</span>)}</div>
            </>
          )}
        </section>
      )}

    </div>
  )
}
