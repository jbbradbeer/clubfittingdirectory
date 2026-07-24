"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

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
