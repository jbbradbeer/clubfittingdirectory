import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  /** Small uppercase label above the title, wrapped in gold hairlines */
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
  /** Centered layout (e.g. index pages) vs. left-aligned (detail pages) */
  align?: "left" | "center"
  /** Right-aligned content (e.g. action buttons) — only with align="left" */
  actions?: React.ReactNode
  /** Extra content rendered beneath the subtitle */
  children?: React.ReactNode
  className?: string
}

/**
 * Shared atmospheric page header used across all inner pages.
 * Mirrors the homepage hero language: soft forest/gold aura, faint course
 * contour lines, grain, and a gold-hairline eyebrow.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  breadcrumb,
  align = "left",
  actions,
  children,
  className,
}: PageHeaderProps) {
  const centered = align === "center"

  const titleBlock = (
    <div className={cn(centered ? "max-w-3xl mx-auto" : "max-w-3xl")}>
      {eyebrow && (
        <p className="section-label mb-3">{eyebrow}</p>
      )}
      <h1 className="display text-[clamp(2.1rem,5.2vw,3.6rem)] text-[var(--color-charcoal)]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-lg text-[var(--color-charcoal-light)] leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  )

  return (
    <section
      className={cn(
        "hero-surface grain border-b border-[var(--color-border)]",
        className,
      )}
    >
      <div className="hero-contours" aria-hidden="true" />
      <div
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16",
          centered && "text-center",
        )}
      >
        {breadcrumb && breadcrumb.length > 0 && (
          <div className={cn("mb-6", centered && "flex justify-center")}>
            <Breadcrumb items={breadcrumb} />
          </div>
        )}

        {actions && !centered ? (
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {titleBlock}
            <div className="shrink-0">{actions}</div>
          </div>
        ) : (
          titleBlock
        )}
      </div>
    </section>
  )
}
