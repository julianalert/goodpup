import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { login } from '../actions'
import s from '../admin.module.css'

export const metadata: Metadata = {
  title: 'Admin login — PawCraft',
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Wrong password. Try again.',
  unconfigured: 'ADMIN_PASSWORD is not set on the server, so nobody can log in.',
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (await isAdminAuthenticated()) redirect('/admin')

  const params = await searchParams
  const errorKey = Array.isArray(params.error) ? params.error[0] : params.error
  const error = errorKey ? ERROR_MESSAGES[errorKey] ?? 'Something went wrong.' : null

  return (
    <main className={s.loginPage}>
      <form action={login} className={s.loginCard}>
        <p className={s.loginBrand}>
          PawCraft <span>admin</span>
        </p>
        <h1 className={s.loginTitle}>Sign in</h1>
        <label htmlFor="password" className={s.loginLabel}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className={s.loginInput}
        />
        {error && (
          <p className={s.loginError} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={s.loginButton}>
          Sign in
        </button>
      </form>
    </main>
  )
}
