import Link from "next/link"
import { Button } from "@/components/ui/Button"

/* ─────────────────────────────────────────────────────────
   404 — NOT FOUND
   Shown whenever a URL doesn't match any page.
   On-brand: dark green background, Playfair headline,
   brass accents. Feels like a well-designed dead end
   rather than a broken website.
   ───────────────────────────────────────────────────────── */

export const metadata = {
  title: "Out of Bounds — Page Not Found",
  description: "This listing doesn't exist — or it may have moved.",
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[var(--color-green-deep)] flex flex-col items-center justify-center px-4 sm:px-6 text-center">

      {/* Decorative rule above */}
      <div className="flex items-center gap-4 mb-10 w-full max-w-xs" aria-hidden="true">
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brass)] opacity-60" />
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
      </div>

      {/* Eyebrow */}
      <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.35em] uppercase text-[var(--color-brass)] mb-4">
        404
      </p>

      {/* Headline */}
      <h1
        className="font-[family-name:var(--font-display)] font-black text-[var(--color-ivory)] leading-[1.05] mb-5"
        style={{ fontSize: "clamp(2.5rem,8vw,4.5rem)" }}
      >
        Out of Bounds.
      </h1>

      {/* Subtext */}
      <p className="font-[family-name:var(--font-body)] text-lg text-[var(--color-ivory-warm)] max-w-md leading-relaxed mb-10">
        This listing doesn&rsquo;t exist — or it may have moved.
        Try heading back to the directory.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="primary" size="lg" asChild>
          <Link href="/directory">Back to Directory</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/states">Browse by State</Link>
        </Button>
      </div>

      {/* Decorative rule below */}
      <div className="flex items-center gap-4 mt-10 w-full max-w-xs" aria-hidden="true">
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brass)] opacity-60" />
        <span className="flex-1 h-px bg-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]" />
      </div>

    </div>
  )
}
