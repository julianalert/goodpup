import { NextRequest, NextResponse } from 'next/server'
import { isAddonId, type AddonId } from '@/lib/addons'
import { saveAddonSettings } from '@/lib/addons-store'
import { cleanNutritionProfile } from '@/lib/nutrition-types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** What each add-on lets its owner save, reduced to values that are safe to store. */
const CLEANERS: Partial<Record<AddonId, (value: unknown) => unknown>> = {
  nutrition_plan: cleanNutritionProfile,
}

/**
 * POST /api/addons/settings  { session_id, addon_id, settings }
 *
 * Saves what a customer changes inside an add-on that is ready (the nutrition
 * plan's calculator: the dog's weight, activity and food as they change). The
 * answers an add-on needs before it is written go through /api/addons/intake.
 */
export async function POST(req: NextRequest) {
  let body: { session_id?: unknown; addon_id?: unknown; settings?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id: sessionId, addon_id: addonId } = body
  if (typeof sessionId !== 'string' || !UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }
  const clean = isAddonId(addonId) ? CLEANERS[addonId] : undefined
  if (!isAddonId(addonId) || !clean) {
    return NextResponse.json({ error: 'This add-on has nothing to save' }, { status: 400 })
  }

  const saved = await saveAddonSettings(sessionId, addonId, clean(body.settings))
  // Not saved = the add-on is not owned or not ready yet (or the table predates the settings column)
  return saved ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not saved' }, { status: 409 })
}
