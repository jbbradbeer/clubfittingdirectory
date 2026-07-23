/**
 * Pure date math for the Verified tier — kept free of Supabase/env imports so
 * it can be unit-tested (and used in components) without any environment.
 */

/** One year after the later of `now` and the current expiry — a renewal paid
    early extends from the CURRENT expiry, so the owner never loses paid time. */
export function nextExpiry(currentExpiresAt: string | null, now: Date = new Date()): Date {
  const current = currentExpiresAt ? new Date(currentExpiresAt) : null
  const base = current && current.getTime() > now.getTime() ? current : now
  const next = new Date(base)
  next.setFullYear(next.getFullYear() + 1)
  return next
}

/** Whole-ish days from now until `iso` (negative when past). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
}
