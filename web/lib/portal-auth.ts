import { cookies } from "next/headers"
import crypto from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Owner-portal auth (mirrors the admin-auth HMAC + httpOnly cookie pattern —
 * NOT Supabase Auth). Passwordless: the owner requests a magic link, we email
 * a signed URL, visiting it sets a session cookie. Sessions are keyed by
 * EMAIL, not shop id — one login shows every shop claimed with that
 * owner_email; revocation = clear the shops.owner_email column (or rotate
 * PORTAL_SECRET to log everyone out).
 *
 * Signing inputs are newline-delimited (emails contain dots) and
 * purpose-prefixed so a magic token can never be replayed as a session
 * cookie or vice versa.
 *
 * Accepted, documented risks (solo-founder scale): stateless magic tokens
 * are replayable within their 20-minute window; there is no per-session
 * revocation list.
 */

export const PORTAL_COOKIE = "cfd_portal"

const MAGIC_PURPOSE = "cfd-portal-magic.v1"
const SESSION_PURPOSE = "cfd-portal-session.v1"
const MAGIC_TTL_MS = 20 * 60 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

function secret(): string | null {
  return process.env.PORTAL_SECRET || null
}

function hmac(purpose: string, email: string, expiresMs: number, sec: string): string {
  return crypto
    .createHmac("sha256", sec)
    .update(`${purpose}\n${email.toLowerCase()}\n${expiresMs}`)
    .digest("hex")
}

function b64url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64url")
}

function fromB64url(s: string): string | null {
  try {
    return Buffer.from(s, "base64url").toString("utf8")
  } catch {
    return null
  }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

/** Absolute magic-link URL for an email, or null when PORTAL_SECRET unset. */
export function buildMagicLink(email: string, siteUrl: string): string | null {
  const sec = secret()
  if (!sec) return null
  const expiresMs = Date.now() + MAGIC_TTL_MS
  const sig = hmac(MAGIC_PURPOSE, email, expiresMs, sec)
  return `${siteUrl}/portal/auth?e=${b64url(email)}&x=${expiresMs}&s=${sig}`
}

/** Verify a magic-link token; returns the email or null. */
export function verifyMagicToken(e: string, x: string, s: string): string | null {
  const sec = secret()
  if (!sec) return null
  const email = fromB64url(e)
  const expiresMs = Number(x)
  if (!email || !email.includes("@") || !Number.isFinite(expiresMs)) return null
  if (Date.now() > expiresMs) return null
  return safeEqual(hmac(MAGIC_PURPOSE, email, expiresMs, sec), s) ? email : null
}

/** Cookie value for a fresh 30-day session. */
export function buildSessionCookie(email: string): string | null {
  const sec = secret()
  if (!sec) return null
  const expMs = Date.now() + SESSION_TTL_MS
  return `v1.${b64url(email)}.${expMs}.${hmac(SESSION_PURPOSE, email, expMs, sec)}`
}

/** Email of the signed-in owner, or null. Call at the top of every portal page AND action. */
export async function getPortalSession(): Promise<string | null> {
  const sec = secret()
  if (!sec) return null
  const raw = (await cookies()).get(PORTAL_COOKIE)?.value
  if (!raw) return null
  const parts = raw.split(".")
  if (parts.length !== 4 || parts[0] !== "v1") return null
  const email = fromB64url(parts[1])
  const expMs = Number(parts[2])
  if (!email || !Number.isFinite(expMs) || Date.now() > expMs) return null
  return safeEqual(hmac(SESSION_PURPOSE, email, expMs, sec), parts[3]) ? email : null
}

export type OwnedShop = {
  id: string
  slug: string
  name: string
  city: string
  state_code: string
  phone: string | null
  website: string | null
  street: string | null
  working_hours: Record<string, string | string[]> | null
  services_array: string[] | null
  offers_fitting: boolean | null
  brands_fitted: string[] | null
  launch_monitors: string[] | null
  ownership_type: string | null
}

/**
 * All claimed shops owned by this email. Case-insensitive match at compare
 * time — approveClaim stores the claimant email verbatim, so never assume
 * casing (and don't migrate the data).
 */
export async function getOwnedShops(email: string): Promise<OwnedShop[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("shops")
    .select(
      "id, slug, name, city, state_code, phone, website, street, working_hours, services_array, offers_fitting, brands_fitted, launch_monitors, ownership_type",
    )
    .ilike("owner_email", email)
    .not("claimed_at", "is", null)
    .eq("status", "active")
    .order("name")
  if (error) throw error
  return (data ?? []) as OwnedShop[]
}

/** True when the signed-in session owns this shop. Guard every mutating action with it. */
export async function isShopOwner(shopId: string): Promise<boolean> {
  const email = await getPortalSession()
  if (!email) return false
  const shops = await getOwnedShops(email)
  return shops.some((s) => s.id === shopId)
}
