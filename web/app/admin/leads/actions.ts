"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { isAdmin } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

const VALID_STATUSES = new Set(["new", "contacted", "booked", "closed"])

/* ── Move a fitting request along the workflow (new → contacted → booked → closed) ── */
export async function updateLeadStatus(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login")

  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  if (!id || !VALID_STATUSES.has(status)) return

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("fitting_requests")
    .update({ status })
    .eq("id", id)
  if (error) throw new Error(`Could not update lead status: ${error.message}`)
  revalidatePath("/admin")
}
