import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-[var(--color-charcoal-light)]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-[var(--color-border)]" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-[var(--color-forest)] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-charcoal)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
