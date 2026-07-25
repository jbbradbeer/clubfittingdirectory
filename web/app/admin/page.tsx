import { redirect } from "next/navigation"

/**
 * Legacy entry point — the dashboard now lives at one route per tab
 * (/admin/overview, /admin/leads, …). Old bookmarks and ?tab= links land here
 * and get forwarded to the matching route.
 */
const TAB_ROUTES: Record<string, string> = {
  overview: "/admin/overview",
  leads: "/admin/leads",
  submissions: "/admin/submissions",
  updates: "/admin/updates",
  outreach: "/admin/outreach",
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  redirect(TAB_ROUTES[tab ?? ""] ?? "/admin/overview")
}
