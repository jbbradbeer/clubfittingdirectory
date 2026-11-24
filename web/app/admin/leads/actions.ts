"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { forwardLeadToOwner, markShopOptOut, sendLeadToShop, type RelayResult } from "@/lib/leads/relay"
import { log } from "@/lib/logger"

const VALID_STATUSES = new Set(["new", "contacted", "booked", "closed"])

/* ── Move a fitting request along the workflow (new → contacted → booked → closed).
   Returns { error } instead of throwing — see ActionResult in ../actions.ts. ── */
export async function updateLeadStatus(
  formData: FormData,
): Promise<{ error?: string } | void> {
  if (!(await isAdmin())) redirect("/admin/login")

  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!id || !VALID_STATUSES.has(status)) return

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("fitting_requests")
    .update({ status })
    .eq("id", id)
  if (error) return { error: `Could not update lead status: ${error.message}` }
  revalidatePath("/admin", "layout")
}

/* Runs a relay step for a signed-in admin and reports problems inline. */
async function relay(step: () => Promise<RelayResult>): Promise<{ error?: string } | void> {
  if (!(await isAdmin())) redirect("/admin/login")
  try {
    const { error } = await step()
    if (error) return { error }
  } catch (e) {
    log.error("admin/leads", "relay step failed", { error: e })
    return { error: "Something went wrong. Nothing more was sent; please refresh and check." }
  }
  revalidatePath("/admin", "layout")
}

export async function sendToShop(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const email = String(formData.get("email") ?? "")
  return relay(() => sendLeadToShop(id, email))
}

export async function sendToOwner(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  return relay(() => forwardLeadToOwner(id))
}

export async function shopOptedOut(formData: FormData) {
  const shopId = String(formData.get("shop_id") ?? "")
  return relay(() => markShopOptOut(shopId))
}

/* ── What happened with a request. Ends its reminders. ── */
const OUTCOME_STATUS: Record<string, string> = {
  shop_replied: "contacted",
  connected: "contacted",
  booked: "booked",
  no_response: "closed",
  closed: "closed",
}

export async function setLeadOutcome(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const outcome = String(formData.get("outcome") ?? "")
  return relay(async () => {
    const status = OUTCOME_STATUS[outcome]
    if (!id || !status) return { error: "Unknown outcome." }
    const { data, error } = await createAdminClient()
      .from("fitting_requests")
      .update({ outcome, outcome_at: new Date().toISOString(), status })
      .eq("id", id)
      .select("id")
    if (error || !data?.length) return { error: "Could not save that. Please try again." }
    return {}
  })
}
