// Server-only helpers for the admin area. Do not import from proxy.ts or client components.
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_COOKIE, verifySessionToken } from './admin-session'

/** True when the current request carries a valid admin session cookie. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  return verifySessionToken(token, process.env.ADMIN_PASSWORD)
}

/**
 * Call at the top of every admin page / server action. Redirects to the login
 * page when the session is missing or invalid. proxy.ts also guards /admin, but
 * the page-level check is the one that actually protects the data.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login')
  }
}
