import type { Metadata } from 'next'

// Private area: never indexed. robots.ts also disallows /admin and
// next.config.ts sends an X-Robots-Tag header for the whole subtree.
export const metadata: Metadata = {
  title: 'Admin — PawCraft',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
