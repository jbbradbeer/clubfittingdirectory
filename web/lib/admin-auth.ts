import { cookies } from "next/headers"
import crypto from "node:crypto"

/**
 * Minimal admin auth for a solo founder. The admin password lives ONLY in a
 * server-side env var (ADMIN_PASSWORD) — never NEXT_PUBLIC_, so it never reaches
 * the browser. On login we set an httpOnly cookie whose value is a SHA-256 of
 * the password (one-way, not the password itself); protected routes recompute
 * that hash and compare. This module imports next/headers + node:crypto, which
 * are server-only by nature (importing it from a client component would error).
 */

export const ADMIN_COOKIE = "cfd_admin"

function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  return crypto.createHash("sha256").update(pw).digest("hex")
}

/** Verify a submitted password and, if correct, return the cookie token to set. */
export function tokenForPassword(password: string): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  // constant-time compare to avoid timing leaks
  const a = Buffer.from(password)
  const b = Buffer.from(pw)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  return crypto.createHash("sha256").update(pw).digest("hex")
}

/** True if the current request carries a valid admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const expected = expectedToken()
  if (!expected) return false
  const cookieStore = await cookies()
  const got = cookieStore.get(ADMIN_COOKIE)?.value
  if (!got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
