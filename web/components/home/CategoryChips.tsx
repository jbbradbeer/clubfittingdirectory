import Link from "next/link"
import {
  Locate,
  Wrench,
  ShoppingBag,
  Target,
  Store,
  GraduationCap,
  Flag,
} from "lucide-react"
import { SHOP_TYPES } from "@/lib/shop-types"

/**
 * Category chip row for the homepage search panel — one chip per shop type
 * with a live count, plus a leading "Near me" shortcut. Wraps on desktop,
 * scrolls horizontally on mobile.
 */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "club-fitters":    <Wrench size={16} />,
  "golf-retailers":  <ShoppingBag size={16} />,
  "golf-simulators": <Target size={16} />,
  "pro-shops":       <Store size={16} />,
  "instruction":     <GraduationCap size={16} />,
  "driving-ranges":  <Flag size={16} />,
}

const chipClass =
  "inline-flex items-center gap-1.5 shrink-0 snap-start px-3.5 py-2 rounded-full border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-forest-tint)] hover:border-[var(--color-forest)] hover:text-[var(--color-forest)] transition-colors"

export function CategoryChips({ typeCounts }: { typeCounts: Record<string, number> }) {
  const categories = SHOP_TYPES
    .map((t) => ({
      slug: t.slug,
      label: t.label,
      icon: CATEGORY_ICONS[t.slug],
      count: typeCounts[t.dbType] ?? 0,
    }))
    .filter((c) => c.count > 0)

  return (
    <div className="flex gap-2 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:overflow-visible">
      <Link href="/directory?near=1" className={chipClass}>
        <span className="text-[var(--color-forest)]">
          <Locate size={16} />
        </span>
        Near me
      </Link>
      {categories.map((cat) => (
        <Link key={cat.slug} href={`/category/${cat.slug}`} className={chipClass}>
          <span className="text-[var(--color-forest)]">{cat.icon}</span>
          {cat.label}
          <span className="text-xs font-semibold text-[var(--color-gold-ink)]">
            {cat.count}
          </span>
        </Link>
      ))}
    </div>
  )
}
