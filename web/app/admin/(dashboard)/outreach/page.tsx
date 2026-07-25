import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { OutreachPanel } from "@/components/admin/OutreachPanel"

export const dynamic = "force-dynamic"

export default async function AdminOutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")
  const params = await searchParams
  return <OutreachPanel page={params.page} />
}
