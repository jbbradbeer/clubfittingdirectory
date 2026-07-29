"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPortalSession, getOwnedShops } from "@/lib/portal-auth"
import { EDITABLE_FIELDS, EDITABLE_ATTRIBUTES } from "@/lib/portal-editable"
import { notifyOwnerEditSubmitted } from "@/lib/email"
import { rateLimitOk } from "@/lib/rate-limit"
import { log } from "@/lib/logger"

/**
 * Submit a structured edit batch for review. CORRECTNESS RULE: this writes
 * ONLY to owner_edit_batches — never to listing_facts or shops. Owner facts
 * are created exclusively inside the admin approve action; pending data must
 * never be able to surface through a recompute.
 */
export async function submitEdits(formData: FormData): Promise<void> {
  const email = await getPortalSession()
  if (!email) redirect("/portal")

  const shopId = String(formData.get("shop_id") ?? "")
  const shops = await getOwnedShops(email)
  const shop = shops.find((s) => s.id === shopId)
  if (!shop) redirect("/portal") // cross-shop id-guessing lands here

  if (!rateLimitOk(`portal-edit:${shopId}`, 5, 60 * 60 * 1000)) {
    redirect(`/portal/edit?shop=${shop.slug}&error=rate`)
  }

  // Build proposed/previous from the whitelist ONLY — any smuggled extra
  // field (e.g. rating) never leaves this loop.
  const proposed: Record<string, unknown> = {}
  const previous: Record<string, unknown> = {}
  const changedLabels: string[] = []

  for (const field of EDITABLE_FIELDS) {
    if (!EDITABLE_ATTRIBUTES.has(field.attribute)) continue
    if (field.kind === "jsonb") continue // working_hours read-only v1

    const raw = formData.get(field.attribute)
    if (raw === null) continue
    const currentValue = (shop as unknown as Record<string, unknown>)[field.attribute] ?? null

    let value: unknown
    if (field.kind === "boolean") {
      value = String(raw) === "on" || String(raw) === "true"
    } else if (field.kind === "text_array") {
      value = String(raw)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 40)
    } else if (field.kind === "select") {
      const allowed = new Set((field.options ?? []).map((o) => o.value))
      const v = String(raw).trim()
      if (!allowed.has(v)) continue
      value = v
    } else {
      value = String(raw).trim().slice(0, 500)
      if (value === "") value = null
    }

    // Drop no-ops so the admin diff shows only real changes.
    if (JSON.stringify(value) === JSON.stringify(currentValue)) continue
    proposed[field.attribute] = value
    previous[field.attribute] = currentValue
    changedLabels.push(field.label)
  }

  const message = String(formData.get("message") ?? "").trim().slice(0, 1000) || null

  if (changedLabels.length === 0 && !message) {
    redirect(`/portal/edit?shop=${shop.slug}&error=empty`)
  }

  try {
    const supabase = createAdminClient()
    // One 'new' batch per shop — replace in place, no stacking.
    const { error: delErr } = await supabase
      .from("owner_edit_batches")
      .delete()
      .eq("shop_id", shopId)
      .eq("review_status", "new")
    if (delErr) throw delErr

    const { error } = await supabase.from("owner_edit_batches").insert({
      shop_id: shopId,
      owner_email: email,
      kind: "edit",
      proposed,
      previous,
      message,
    })
    if (error) throw error
  } catch (e) {
    log.error("portal", "submitEdits failed", { error: e, shopId })
    redirect(`/portal/edit?shop=${shop.slug}&error=save`)
  }

  await notifyOwnerEditSubmitted({
    shopName: shop.name,
    shopSlug: shop.slug,
    ownerEmail: email,
    fieldLabels: changedLabels,
  }).catch(() => {})

  revalidatePath("/portal/edit")
  redirect(`/portal/edit?shop=${shop.slug}&sent=1`)
}
