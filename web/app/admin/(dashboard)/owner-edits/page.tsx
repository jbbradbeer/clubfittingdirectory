import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { OwnerEditsPanel } from "@/components/admin/OwnerEditsPanel"

export const dynamic = "force-dynamic"

export default async function AdminOwnerEditsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")
  const params = await searchParams
  return <OwnerEditsPanel q={params.q} status={params.status} page={params.page} />
}
