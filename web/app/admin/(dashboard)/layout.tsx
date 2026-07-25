import type { Metadata } from "next"
import { logout } from "@/app/admin/actions"
import { AdminTabs } from "@/components/admin/AdminTabs"

export const metadata: Metadata = {
  title: "Admin — Dashboard",
  robots: { index: false, follow: false },
}

/**
 * Shared frame for every admin tab route: header, logout, client tab nav.
 * Auth lives in each page (isAdmin() + redirect), NOT here — a layout can be
 * bypassed by client-side navigation quirks and must never be the only gate.
 */
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
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
        <AdminTabs />
        {children}
      </div>
    </section>
  )
}
