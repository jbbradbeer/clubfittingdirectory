import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { log } from "@/lib/logger"
import { nextExpiry } from "@/lib/verified-math"
import type { PlanKey } from "@/lib/plans"

/**
 * Shared Verified-tier activation — the single code path that turns the paid
 * badge on. Called from two places:
 *   1. The admin "Activate Verified" button (app/admin/actions.ts) — manual.
 *   2. The Stripe webhook (app/api/stripe/webhook/route.ts) — automatic on
 *      payment. The webhook can't import admin actions (they're "use server"
 *      + admin-cookie-gated), which is why this lives in lib/.
 *
 * Renewal-safe expiry: a renewal paid early extends from the CURRENT expiry,
 * not from today — the owner never loses paid-for time. First activation and
 * lapsed shops extend from now.
 */

/**
 * Activate (or extend) the Verified tier for a shop. The plan drives the
 * expiry extension: monthly = +1 month, annual = +1 year. Webhook events
 * from before the plan split carry no plan metadata and default to annual.
 * Returns the shop's slug, or throws with a clear message.
 */
export async function activateVerifiedShop(
  slug: string,
  plan: PlanKey = "annual",
): Promise<string> {
  const cleanSlug = slug.trim().toLowerCase()
  if (!cleanSlug) throw new Error("Missing shop slug.")

  const supabase = createAdminClient()

  const { data: existing, error: readErr } = await supabase
    .from("shops")
    .select("slug, verified_expires_at")
    .eq("slug", cleanSlug)
    .single()
  if (readErr || !existing) {
    throw new Error(`Could not activate: ${readErr?.message ?? "shop not found"}`)
  }

  const now = new Date()
  const expires = nextExpiry(existing.verified_expires_at, now, plan)

  const { error } = await supabase
    .from("shops")
    .update({
      listing_tier: "verified",
      verified_at: now.toISOString(),
      verified_expires_at: expires.toISOString(),
      verified_plan: plan,
      // Featured placement is part of the paid plan: featured shops sort to
      // the top of state/city/category/directory lists. Cleared on lapse.
      is_featured: true,
    })
    .eq("slug", cleanSlug)
  if (error) throw new Error(`Could not activate: ${error.message}`)

  // Same refresh set as the manual admin action: dashboard, the listing
  // itself, and the homepage (badge shows on carousel cards).
  revalidatePath("/admin")
  revalidatePath(`/listing/${cleanSlug}`)
  revalidatePath("/")

  log.info("verified", "activated", {
    slug: cleanSlug,
    plan,
    expires: expires.toISOString(),
  })
  return cleanSlug
}
