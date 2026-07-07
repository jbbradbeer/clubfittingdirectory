import { NextResponse } from "next/server"

/* ─────────────────────────────────────────────────────────
   Shared validation helpers for the public POST API routes
   (newsletter, submit-shop, claim-shop, request-fitting).
   Previously each route carried its own identical copies.
   ───────────────────────────────────────────────────────── */

/** Coerce an unknown body field to a trimmed, length-capped string ("" if not a string). */
export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : ""
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email)
}

/** Parse the JSON body; null (→ respond 400) if the payload isn't valid JSON. */
export async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export const invalidBodyResponse = () =>
  NextResponse.json({ error: "Invalid request." }, { status: 400 })

/* Honeypot: a hidden "company_website" field real users never fill. Bots that
   fill everything trip it. Routes respond with pretend-success ({ ok: true })
   so the bot doesn't learn it was caught. */
export function honeypotTripped(body: Record<string, unknown>): boolean {
  return Boolean(str(body.company_website, 200))
}
