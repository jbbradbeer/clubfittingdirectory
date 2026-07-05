"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { rateLimitOk } from "@/lib/rate-limit"
import { log } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { ADMIN_COOKIE, tokenForPassword, isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { US_STATES } from "@/lib/constants"
import { SHOP_TYPES } from "@/lib/shop-types"
import { toCitySlug } from "@/lib/slugs"

/* ── Login ── */
export async function login(formData: FormData) {
  // Throttle brute-force attempts: the constant-time comparison doesn't help
  // if a bot can try thousands of passwords per minute.
  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!rateLimitOk(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    log.warn("admin/login", "rate limited", { ip })
    redirect("/admin/login?error=1")
  }

  const password = String(formData.get("password") ?? "")
  const token = tokenForPassword(password)
  if (!token) {
    redirect("/admin/login?error=1")
  }
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    // secure in production (HTTPS); allow http://localhost in dev so the cookie
    // isn't dropped during local testing.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  redirect("/admin")
}

/* ── Logout ── */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  redirect("/admin/login")
}

/* Build a URL slug the same way the rest of the site does:
   {city-name}-{state} but for shops it's {name}-{city}-{state_code}. */
function buildShopSlug(name: string, city: string, stateCode: string): string {
  const part = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return [part(name), part(city), stateCode.toLowerCase()].filter(Boolean).join("-")
}

/* ── Approve: promote a submission into the live shops table ── */
export async function approveSubmission(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = createAdminClient()

  // Load the submission
  const { data: sub, error: subErr } = await supabase
    .from("shop_submissions")
    .select("*")
    .eq("id", id)
    .single()
  if (subErr || !sub) throw new Error("Submission not found.")

  const stateName = US_STATES.find((s) => s.code === sub.state_code)?.name ?? sub.state_code
  let slug = buildShopSlug(sub.name, sub.city, sub.state_code)

  // Avoid a unique-slug collision: append a short suffix if taken.
  const { data: existing } = await supabase
    .from("shops")
    .select("slug")
    .eq("slug", slug)
    .limit(1)
  if (existing && existing.length > 0) {
    slug = `${slug}-${id.slice(0, 6)}`
  }

  // Validate shop_type and state_code before inserting
  const validShopType = SHOP_TYPES.find((t) => t.dbType === sub.shop_type)
  if (!validShopType) {
    throw new Error(`Invalid shop_type "${sub.shop_type}". Must be one of: ${SHOP_TYPES.map((t) => t.dbType).join(", ")}.`)
  }
  const validState = US_STATES.find((s) => s.code === sub.state_code)
  if (!validState) {
    throw new Error(`Invalid state_code "${sub.state_code}". Must be a valid two-letter US state code.`)
  }

  // Insert into live shops as active
  const { error: insErr } = await supabase.from("shops").insert({
    slug,
    status: "active",
    name: sub.name,
    shop_type: sub.shop_type,
    city: sub.city,
    state: stateName,
    state_code: sub.state_code,
    website: sub.website,
    phone: sub.phone,
    offers_fitting: sub.offers_fitting ?? false,
  })
  if (insErr) throw new Error(`Could not create listing: ${insErr.message}`)

  // Mark submission approved
  await supabase.from("shop_submissions").update({ review_status: "approved" }).eq("id", id)

  // A newly-approved shop changes the exact pages it appears on AND the site-wide
  // counts. Revalidate precisely those — the new listing, its city/state/category
  // index pages, plus the count-driven aggregates (homepage stats, directory,
  // states index). We deliberately do NOT touch every listing page.
  revalidatePath("/admin")                                       // submissions queue
  revalidatePath(`/listing/${slug}`)                             // the new shop's own page
  revalidatePath(`/state/${sub.state_code.toLowerCase()}`)       // its state page
  revalidatePath(`/city/${toCitySlug(sub.city, sub.state_code)}`) // its city page
  revalidatePath(`/category/${validShopType.slug}`)              // its category page
  revalidatePath("/")                                            // homepage total count
  revalidatePath("/directory")                                   // directory shell
  revalidatePath("/states")                                      // states index counts
}

/* ── Reject: mark a submission rejected (does not touch shops) ── */
export async function rejectSubmission(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const supabase = createAdminClient()
  await supabase.from("shop_submissions").update({ review_status: "rejected" }).eq("id", id)
  revalidatePath("/admin")
}

/* ── Approve a claim: stamp the shop owner-claimed + capture owner_email.
     Claimed ≠ Verified — the paid tier is set separately when they buy. ── */
export async function approveClaim(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return

  const supabase = createAdminClient()
  const { data: claim, error: claimErr } = await supabase
    .from("shop_claims")
    .select("id, shop_id, claimant_email")
    .eq("id", id)
    .single()
  if (claimErr || !claim) throw new Error("Claim not found.")

  const { data: shop, error: shopErr } = await supabase
    .from("shops")
    .update({ claimed_at: new Date().toISOString(), owner_email: claim.claimant_email })
    .eq("id", claim.shop_id)
    .select("slug")
    .single()
  if (shopErr) throw new Error(`Could not mark shop claimed: ${shopErr.message}`)

  const { error: updErr } = await supabase
    .from("shop_claims")
    .update({ review_status: "approved" })
    .eq("id", id)
  if (updErr) throw new Error(`Could not update claim: ${updErr.message}`)

  revalidatePath("/admin")
  if (shop?.slug) revalidatePath(`/listing/${shop.slug}`) // swaps the claim link → "Owner-managed"
}

/* ── Activate the paid Verified tier (replaces the manual-SQL step).
   Run when a Stripe payment email arrives — see tasks/paid-activation-runbook.md.
   Sets the badge live and stamps a 1-year expiry so a lapsed subscription
   can't stay "Verified" forever. ── */
export async function activateVerified(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  if (!slug) return

  const now = new Date()
  const expires = new Date(now)
  expires.setFullYear(expires.getFullYear() + 1)

  const supabase = createAdminClient()
  const { data: shop, error } = await supabase
    .from("shops")
    .update({
      listing_tier: "verified",
      verified_at: now.toISOString(),
      verified_expires_at: expires.toISOString(),
    })
    .eq("slug", slug)
    .select("slug")
    .single()
  if (error || !shop) throw new Error(`Could not activate: ${error?.message ?? "shop not found"}`)

  revalidatePath("/admin")
  revalidatePath(`/listing/${slug}`)
  revalidatePath("/") // badge shows on homepage carousel cards
}

/* ── Lapse a Verified listing (subscription not renewed). Keeps verified_at /
   verified_expires_at as history; only the tier goes back to free. ── */
export async function lapseVerified(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase()
  if (!slug) return

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("shops")
    .update({ listing_tier: "free" })
    .eq("slug", slug)
  if (error) throw new Error(`Could not lapse: ${error.message}`)

  revalidatePath("/admin")
  revalidatePath(`/listing/${slug}`)
  revalidatePath("/")
}

/* ── Reject a claim (does not touch shops) ── */
export async function rejectClaim(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("shop_claims")
    .update({ review_status: "rejected" })
    .eq("id", id)
  if (error) throw new Error(`Could not reject claim: ${error.message}`)
  revalidatePath("/admin")
}
