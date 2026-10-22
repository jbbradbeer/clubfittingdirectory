import { cookies } from "next/headers"
import crypto from "node:crypto"

/**
 * Minimal admin auth for a solo founder. The admin password lives ONLY in a
 * server-side env var (ADMIN_PASSWORD) — never NEXT_PUBLIC_, so it never reaches
 * the browser. On login we set an httpOnly cookie holding a signed expiry
 * (see below); protected routes re-verify the signature and expiry. This module imports next/headers + node:crypto, which
 * are server-only by nature (importing it from a client component would error).
 */

export const ADMIN_COOKIE = "cfd_admin"

/** Session lifetime; keep in sync with the cookie maxAge in app/admin/actions.ts. */
export const ADMIN_SESSION_MS = 7 * 24 * 60 * 60 * 1000

/* Token = "<expiresAtMs>.<HMAC(password, expiresAtMs)>". The expiry is signed,
   so a copied cookie stops working after 7 days, and changing ADMIN_PASSWORD
   invalidates every session. */
function sign(pw: string, expiresAt: string): string {
  return crypto.createHmac("sha256", pw).update(`cfd-admin:${expiresAt}`).digest("hex")
}

/** Verify a submitted password and, if correct, return the cookie token to set. */
export function tokenForPassword(password: string): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  // constant-time compare to avoid timing leaks
  const a = Buffer.from(password)
  const b = Buffer.from(pw)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  const expiresAt = String(Date.now() + ADMIN_SESSION_MS)
  return `${expiresAt}.${sign(pw, expiresAt)}`
}

/** True if the current request carries a valid, unexpired admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return false
  const cookieStore = await cookies()
  const got = cookieStore.get(ADMIN_COOKIE)?.value
  if (!got) return false
  const [expiresAt, sig] = got.split(".")
  if (!expiresAt || !sig || !(Number(expiresAt) > Date.now())) return false
  const a = Buffer.from(sig)
  const b = Buffer.from(sign(pw, expiresAt))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
