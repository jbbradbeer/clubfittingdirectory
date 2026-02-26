import Link from "next/link"
import { Button } from "@/components/ui/Button"

/* ─────────────────────────────────────────────────────────
   404 — NOT FOUND
   Off-white background, green accents, clean layout.
   ───────────────────────────────────────────────────────── */

export const metadata = {
  title: "Out of Bounds — Page Not Found",
  description: "This listing doesn't exist — or it may have moved.",
}

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[var(--color-off-white)] flex flex-col items-center justify-center px-4 sm:px-6 text-center">

      {/* Eyebrow */}
      <p className="font-[family-name:var(--font-body)] text-xs tracking-[0.35em] uppercase text-[var(--color-green-deep)] mb-4">
        404
      </p>

      {/* Headline */}
      <h1
        className="font-[family-name:var(--font-display)] font-normal text-[var(--color-black)] leading-[1.05] mb-5"
        style={{ fontSize: "clamp(2.5rem,8vw,4.5rem)" }}
      >
        Out of Bounds.
      </h1>

      {/* Subtext */}
      <p className="font-[family-name:var(--font-body)] text-lg text-[var(--color-gray)] max-w-md leading-relaxed mb-10">
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
    </div>
  )
}
