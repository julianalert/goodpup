import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const BASE_URL = SITE_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/dogs/', '/start/'],
        disallow: ['/api/', '/order', '/plan/', '/success', '/admin'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
