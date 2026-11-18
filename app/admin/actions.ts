'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_PATH,
  SESSION_TTL_SECONDS,
  createSessionToken,
  safeEqual,
} from '@/lib/admin-session'

// Slow down password guessing a little. Serverless makes a real rate limiter
// awkward without extra infrastructure; a long random password is the real defence.
const FAIL_DELAY_MS = 750

export async function login(formData: FormData) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) redirect('/admin/login?error=unconfigured')

  const password = formData.get('password')
  const ok =
    typeof password === 'string' &&
    password.length > 0 &&
    (await safeEqual(password, expected))

  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, FAIL_DELAY_MS))
    redirect('/admin/login?error=invalid')
  }

  const cookieStore = await cookies()
  cookieStore.set({
    name: ADMIN_COOKIE,
    value: await createSessionToken(expected),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: ADMIN_COOKIE_PATH,
    maxAge: SESSION_TTL_SECONDS,
  })

  redirect('/admin')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.set({ name: ADMIN_COOKIE, value: '', path: ADMIN_COOKIE_PATH, maxAge: 0 })
  redirect('/admin/login')
}
