import Link from "next/link"
import { BookOpen, Clock } from "lucide-react"
import type { Guide } from "@/lib/guides/types"

/* Card for the /guides hub index. Mirrors ListingCard's shape/shadow language
   so the editorial hub feels native to the directory. */
export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex flex-col bg-[var(--color-paper)] border border-[var(--color-border)] rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-forest-tint)] text-[var(--color-forest)]">
          <BookOpen size={18} />
        </span>
        {guide.pillar && (
          <span className="px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] rounded-full bg-[var(--color-gold)] text-[var(--color-forest-deep)]">
            Complete Guide
          </span>
        )}
      </div>

      <h3
        className="text-xl font-bold text-[var(--color-charcoal)] leading-snug group-hover:text-[var(--color-forest)] transition-colors"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {guide.h1}
      </h3>

      <p className="mt-2.5 text-[var(--color-charcoal-light)] leading-relaxed line-clamp-3">
        {guide.excerpt}
      </p>

      <div className="mt-auto pt-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-charcoal-light)]">
          <Clock size={13} className="text-[var(--color-gold)]" />
          {guide.readMinutes} min read
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-forest)] group-hover:gap-2 transition-all">
          Read guide
          <span aria-hidden="true">&rarr;</span>
        </span>
      </div>
    </Link>
  )
}
