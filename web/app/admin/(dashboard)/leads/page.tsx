import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { LeadsPanel } from "@/components/admin/LeadsPanel"

export const dynamic = "force-dynamic"

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")
  const params = await searchParams
  return <LeadsPanel q={params.q} status={params.status} page={params.page} />
}
