"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * Client tab nav for the admin dashboard. Each tab is its own route under
 * /admin, so switching is a prefetched client-side navigation (instant)
 * instead of the old ?tab= full page load.
 */
export const ADMIN_TABS = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/leads", label: "Fitting Requests" },
  { href: "/admin/submissions", label: "Submissions & Claims" },
  { href: "/admin/updates", label: "Update Requests" },
  { href: "/admin/outreach", label: "Outreach" },
] as const

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 mb-8">
      {ADMIN_TABS.map((t) => {
        const active = pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
              active
                ? "bg-[var(--color-forest)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-charcoal-light)] hover:bg-[var(--color-cream)]"
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
