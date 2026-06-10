import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found — PawCraft',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        background: 'var(--cream)',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
      <h1
        style={{
          fontFamily: 'var(--font-playfair), Playfair Display, serif',
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 600,
          color: 'var(--ink)',
          margin: '0 0 12px',
          lineHeight: 1.2,
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontSize: 16,
          color: 'var(--ink-mid)',
          maxWidth: 400,
          lineHeight: 1.65,
          margin: '0 0 32px',
        }}
      >
        This page doesn&apos;t exist — or the breed or problem you were looking for hasn&apos;t been added yet.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            background: 'var(--green)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 99,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Go home
        </Link>
        <Link
          href="/dogs"
          style={{
            background: 'transparent',
            color: 'var(--green)',
            textDecoration: 'none',
            borderRadius: 99,
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 500,
            border: '1.5px solid var(--green)',
          }}
        >
          Browse breed guides
        </Link>
      </div>
    </div>
  )
}
