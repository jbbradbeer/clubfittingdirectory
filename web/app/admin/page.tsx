import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { logout } from "./actions"
import { OverviewPanel } from "@/components/admin/OverviewPanel"
import { LeadsPanel } from "@/components/admin/LeadsPanel"
import { SubmissionsPanel } from "@/components/admin/SubmissionsPanel"
import { OutreachPanel } from "@/components/admin/OutreachPanel"
import { UpdatesPanel } from "@/components/admin/UpdatesPanel"

export const metadata: Metadata = {
  title: "Admin — Dashboard",
  robots: { index: false, follow: false },
}

// Always render fresh (never cache the review queues)
export const dynamic = "force-dynamic"

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "leads", label: "Fitting Requests" },
  { key: "submissions", label: "Submissions & Claims" },
  { key: "updates", label: "Update Requests" },
  { key: "outreach", label: "Outreach" },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  if (!(await isAdmin())) redirect("/admin/login")

  const { tab } = await searchParams
  const active: TabKey = TABS.some((t) => t.key === tab) ? (tab as TabKey) : "overview"

  return (
    <section className="bg-[var(--color-ivory)] min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-[var(--color-charcoal)]">Dashboard</h1>
          <form action={logout}>
            <button className="text-sm text-[var(--color-charcoal-light)] hover:text-[var(--color-forest)] cursor-pointer">
              Log out
            </button>
          </form>
        </div>

        {/* Tab nav — server-rendered links; only the active tab's data is fetched */}
        <nav className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin?tab=${t.key}`}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                active === t.key
                  ? "bg-[var(--color-forest)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {active === "overview" && <OverviewPanel />}
        {active === "leads" && <LeadsPanel />}
        {active === "submissions" && <SubmissionsPanel />}
        {active === "updates" && <UpdatesPanel />}
        {active === "outreach" && <OutreachPanel />}
      </div>
    </section>
  )
}
