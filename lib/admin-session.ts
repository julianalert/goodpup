/**
 * Admin session tokens — pure Web Crypto so this module can be imported from
 * both the Node runtime (server components, server actions) and proxy.ts.
 *
 * A token is `<expiresAtMs>.<hmacHex>` where the HMAC key is derived from
 * ADMIN_PASSWORD. Changing the password therefore invalidates every session.
 */

export const ADMIN_COOKIE = 'pawcraft_admin'
export const ADMIN_COOKIE_PATH = '/admin'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

const KEY_SUFFIX = '|pawcraft-admin-session-v1'
const PAYLOAD_PREFIX = 'pawcraft-admin:'

const encoder = new TextEncoder()

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

async function importKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret + KEY_SUFFIX),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  )
}

/** Create a signed session token that expires SESSION_TTL_SECONDS from now. */
export async function createSessionToken(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000
  const key = await importKey(secret, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(PAYLOAD_PREFIX + expiresAt))
  return `${expiresAt}.${toHex(sig)}`
}

/** Verify a token's signature and expiry. Never throws. */
export async function verifySessionToken(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token || !secret) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false

  const expiresAt = Number(token.slice(0, dot))
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false

  const sig = fromHex(token.slice(dot + 1))
  if (!sig) return false

  try {
    const key = await importKey(secret, ['verify'])
    // crypto.subtle.verify is constant-time
    return await crypto.subtle.verify('HMAC', key, sig, encoder.encode(PAYLOAD_PREFIX + expiresAt))
  } catch {
    return false
  }
}

/** Constant-time string comparison (compares SHA-256 digests so length leaks nothing). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  const ua = new Uint8Array(da)
  const ub = new Uint8Array(db)
  let diff = 0
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i]
  return diff === 0
}
