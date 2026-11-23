import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { ADDONS, isAddonId, type AddonId } from '@/lib/addons'
import { listAddonRows, type AddonRow } from '@/lib/addons-store'
import { isHandbook } from '@/lib/handbook-types'
import { isNutritionPlan } from '@/lib/nutrition-types'
import { properName } from '@/lib/plan-types'
import { HandbookBook } from './HandbookBook'
import { NutritionBook } from './NutritionBook'
import { PrintBar } from './PrintBar'
import h from '../../space/handbook.module.css'

// An add-on laid out for paper: the customer saves it as a PDF or prints it from
// the browser's own print dialog, so the file always matches what they read.

interface Props {
  params: Promise<{ id: string; addon: string }>
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { addon } = await params
  return {
    // Browsers suggest the page title as the PDF's file name
    title: `${isAddonId(addon) ? ADDONS[addon].label : 'Add-on'} · PawCraft`,
    robots: { index: false, follow: false },
  }
}

/** One print layout per add-on. Null = nothing printable (its content is not what we expect). */
function layout(addon: AddonId, row: AddonRow, photo: string | null): React.ReactNode | null {
  const { content } = row
  switch (addon) {
    case 'breed_handbook':
      return isHandbook(content) ? <HandbookBook book={content} photo={photo} /> : null
    case 'nutrition_plan':
      return isNutritionPlan(content) ? <NutritionBook plan={content} settings={row.settings ?? null} photo={photo} /> : null
  }
}

export default async function AddonPrintPage({ params }: Props) {
  const { id, addon } = await params
  if (!UUID_REGEX.test(id) || !isAddonId(addon)) notFound()

  // The customer's own paid content: always rendered for the request at hand
  await connection()

  const { data: row } = await createServerClient()
    .from('submissions')
    .select('status, dog_name, dog_photo')
    .eq('session_id', id)
    .maybeSingle()
  if (!row || row.status !== 'paid') notFound()

  // Only what has been paid for and written: a locked add-on has no row at all
  const owned = (await listAddonRows(id, true))?.find((r) => r.addon_id === addon && r.status === 'ready')
  const book = owned ? layout(addon, owned, row.dog_photo ?? null) : null
  if (!book) notFound()

  return (
    <div className={h.book}>
      <PrintBar sessionId={id} addon={addon} dogName={properName(row.dog_name, 'Your dog')} />
      {book}
    </div>
  )
}
