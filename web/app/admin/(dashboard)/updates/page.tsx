import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { UpdatesPanel } from "@/components/admin/UpdatesPanel"

export const dynamic = "force-dynamic"

export default async function AdminUpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")
  const params = await searchParams
  return <UpdatesPanel q={params.q} status={params.status} page={params.page} />
}
