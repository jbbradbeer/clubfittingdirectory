import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { SubmissionsPanel } from "@/components/admin/SubmissionsPanel"

export const dynamic = "force-dynamic"

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cpage?: string; spage?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")
  const params = await searchParams
  return (
    <SubmissionsPanel
      q={params.q}
      status={params.status}
      cpage={params.cpage}
      spage={params.spage}
    />
  )
}
