"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { applyOwnerFact } from "@/lib/facts"
import { EDITABLE_ATTRIBUTES, WIDE_REVALIDATE_ATTRIBUTES } from "@/lib/portal-editable"
import { notifyOwnerEditsLive } from "@/lib/email"
import { toCitySlug } from "@/lib/supabase/queries/shops"
import { log } from "@/lib/logger"

/**
 * Approve/reject owner edit batches. THIS is the only place owner facts enter
 * listing_facts (via applyOwnerFact → recompute_current_fact). Pending batches
 * never touch the ledger; rejection changes nothing but the batch row.
 */

type Batch = {
  id: string
  shop_id: string
  owner_email: string
  kind: string
  proposed: Record<string, unknown>
  review_status: string
  shops: { slug: string; name: string; city: string | null; state_code: string | null } | null
}

async function loadBatch(id: string): Promise<Batch | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("owner_edit_batches")
    .select("id, shop_id, owner_email, kind, proposed, review_status, shops(slug, name, city, state_code)")
    .eq("id", id)
    .single()
  if (error) return null
  return data as unknown as Batch
}

export async function approveOwnerEdits(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  const batch = await loadBatch(id)
  if (!batch || batch.review_status !== "new" || !batch.shops) return

  const supabase = createAdminClient()

  if (batch.kind === "edit") {
    let wide = false
    for (const [attribute, value] of Object.entries(batch.proposed)) {
      // Whitelist re-checked at approve time — belt and braces.
      if (!EDITABLE_ATTRIBUTES.has(attribute)) continue
      try {
        await applyOwnerFact(batch.shop_id, attribute, value)
      } catch (e) {
        log.error("admin/owner-edits", "applyOwnerFact failed", { error: e, attribute, batchId: id })
        return // leave the batch 'new' so it can be retried after the fix
      }
      if (WIDE_REVALIDATE_ATTRIBUTES.has(attribute)) wide = true
    }

    const shop = batch.shops
    revalidatePath("/admin", "layout")
    revalidatePath(`/listing/${shop.slug}`)
    if (wide) {
      if (shop.state_code) revalidatePath(`/state/${shop.state_code.toLowerCase()}`)
      if (shop.city && shop.state_code) revalidatePath(`/city/${toCitySlug(shop.city, shop.state_code)}`)
      revalidatePath("/directory")
    }

    await notifyOwnerEditsLive({
      ownerEmail: batch.owner_email,
      shopName: shop.name,
      shopSlug: shop.slug,
    }).catch(() => {})
  }
  // kind === 'identity_request': nothing automatic — the button just marks it
  // handled after the founder made whatever manual change was warranted.

  await supabase
    .from("owner_edit_batches")
    .update({ review_status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id)
  revalidatePath("/admin", "layout")
}

export async function rejectOwnerEdits(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login")
  const id = String(formData.get("id") ?? "")
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null
  const supabase = createAdminClient()
  await supabase
    .from("owner_edit_batches")
    .update({ review_status: "rejected", reviewed_at: new Date().toISOString(), review_note: note })
    .eq("id", id)
  revalidatePath("/admin", "layout")
}
