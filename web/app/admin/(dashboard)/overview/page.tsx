import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { OverviewPanel } from "@/components/admin/OverviewPanel"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  if (!(await isAdmin())) redirect("/admin/login")
  return <OverviewPanel />
}
