import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { properName } from '@/lib/plan-types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /plan/<id>/manifest.webmanifest
 *
 * The web-app manifest for one customer's training space, so "Add to Home Screen"
 * creates an icon named after their dog that opens straight into their plan.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_REGEX.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data } = await createServerClient()
    .from('submissions')
    .select('dog_name, status')
    .eq('session_id', id)
    .maybeSingle()

  if (!data || data.status !== 'paid') return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dogName = properName(data.dog_name, 'Training')

  return NextResponse.json(
    {
      name: `${dogName}'s training space`,
      short_name: dogName.slice(0, 12),
      description: `${dogName}'s 30-day PawCraft training plan`,
      start_url: `/plan/${id}`,
      scope: `/plan/${id}`,
      display: 'standalone',
      background_color: '#F9F7F3',
      theme_color: '#1A6B4A',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'private, max-age=3600' } },
  )
}
