import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { GoogleAds } from './GoogleAds'
import { MixpanelProvider } from './MixpanelProvider'
import { SimpleAnalytics } from './SimpleAnalytics'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const BASE_URL = SITE_URL

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "PawCraft — Your Dog's Personalized 30-Day Training Plan",
  description: 'AI-powered personalised dog training plans. Breed-specific, problem-focused, and ready to work.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "PawCraft — Your Dog's Personalized 30-Day Training Plan",
    description: 'AI-powered personalised dog training plans. Breed-specific, problem-focused, and ready to work.',
    url: BASE_URL,
    siteName: 'PawCraft',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'PawCraft — Personalized Dog Training Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image.png'],
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PawCraft',
  url: BASE_URL,
  logo: `${BASE_URL}/icon.png`,
  sameAs: [
    'https://www.instagram.com/trypawcraft/',
    'https://www.tiktok.com/@seraphova',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@mypawcraft.com',
    contactType: 'customer support',
  },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PawCraft',
  url: BASE_URL,
  description: 'AI-powered personalised dog training plans. Breed-specific, problem-focused, and ready to work.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <GoogleAds />
        <SimpleAnalytics />
        <MixpanelProvider>{children}</MixpanelProvider>
      </body>
    </html>
  )
}
