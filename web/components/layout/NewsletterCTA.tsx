"use client"

import { Button } from "@/components/ui/Button"

/* ─────────────────────────────────────────────────────────
   NEWSLETTER CTA
   Standalone banner promoting The Tuxedo Collective
   newsletter.  Used on the homepage hero and in sidebars.

   Variants:
   • hero    — full-width dark section, large Playfair Display
               headline, decorative brass rule lines, wide layout
   • sidebar — compact card version, same styling, stacked
   ───────────────────────────────────────────────────────── */

type CTAVariant = "hero" | "sidebar"

interface NewsletterCTAProps {
  variant?: CTAVariant
  className?: string
}

const NEWSLETTER_URL = "https://thetuxedocollective.com"

export function NewsletterCTA({
  variant = "hero",
  className = "",
}: NewsletterCTAProps) {
  if (variant === "hero") {
    return <HeroCTA className={className} />
  }
  return <SidebarCTA className={className} />
}

/* ── Hero variant ── */
function HeroCTA({ className = "" }: { className?: string }) {
  return (
    <section
      className={[
        "relative overflow-hidden",
        "bg-[var(--color-green-mid)]",
        "border-y border-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]",
        className,
      ].join(" ")}
      aria-label="Newsletter signup"
    >
      {/* Decorative background texture lines */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              var(--color-brass) 0px,
              var(--color-brass) 1px,
              transparent 1px,
              transparent 40px
            )`,
          }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">

        {/* Top brass rule */}
        <div className="flex items-center gap-4 mb-8">
          <span className="flex-1 brass-rule" aria-hidden="true" />
          <span
            className="font-[family-name:var(--font-body)] text-xs text-[var(--color-brass)] tracking-[0.3em] uppercase shrink-0"
            aria-hidden="true"
          >
            The Tuxedo Collective
          </span>
          <span className="flex-1 brass-rule" aria-hidden="true" />
        </div>

        {/* Headline */}
        <h2
          className={[
            "font-[family-name:var(--font-display)]",
            "text-4xl sm:text-5xl font-bold",
            "text-[var(--color-ivory)]",
            "leading-[1.15]",
            "mb-5",
          ].join(" ")}
        >
          Golf Writing for the
          <br />
          <em className="not-italic text-[var(--color-brass)]">
            Serious Player
          </em>
        </h2>

        {/* Subtext */}
        <p
          className={[
            "font-[family-name:var(--font-body)]",
            "text-base sm:text-lg",
            "text-[var(--color-ivory-warm)]",
            "max-w-xl mx-auto",
            "mb-10",
          ].join(" ")}
        >
          Private club culture, fitting guides, equipment deep-dives, and
          the etiquette that defines the game — delivered to your inbox.
        </p>

        {/* Email form */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6"
          aria-label="Newsletter signup form"
        >
          <label htmlFor="hero-email" className="sr-only">
            Email address
          </label>
          <input
            id="hero-email"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
            className={[
              "flex-1 min-w-0",
              "px-5 py-3 text-sm",
              "bg-[var(--color-green-deep)]",
              "border border-[color-mix(in_srgb,var(--color-brass)_40%,transparent)]",
              "rounded-sm",
              "text-[var(--color-ivory)]",
              "placeholder:text-[color-mix(in_srgb,var(--color-ivory-warm)_40%,transparent)]",
              "font-[family-name:var(--font-body)]",
              "focus:outline-2 focus:outline-[var(--color-brass)] focus:outline-offset-0",
              "transition-colors",
            ].join(" ")}
          />
          <Button variant="primary" size="md" type="submit">
            Subscribe Free
          </Button>
        </form>

        {/* Disclaimer */}
        <p className="text-[11px] text-[color-mix(in_srgb,var(--color-ivory-warm)_45%,transparent)] font-[family-name:var(--font-body)]">
          No spam. Unsubscribe at any time. Read by private club members
          &amp; mid-amateur competitors.
        </p>

        {/* Bottom brass rule */}
        <div className="flex items-center gap-4 mt-8" aria-hidden="true">
          <span className="flex-1 brass-rule" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brass)]" />
          <span className="flex-1 brass-rule" />
        </div>

      </div>
    </section>
  )
}

/* ── Sidebar variant ── */
function SidebarCTA({ className = "" }: { className?: string }) {
  return (
    <aside
      className={[
        "bg-[var(--color-green-mid)]",
        "border border-[color-mix(in_srgb,var(--color-brass)_25%,transparent)]",
        "rounded-sm",
        "p-6",
        "space-y-4",
        className,
      ].join(" ")}
      aria-label="Newsletter signup"
    >
      {/* Label */}
      <p className="font-[family-name:var(--font-body)] text-[10px] text-[var(--color-brass)] tracking-[0.3em] uppercase">
        The Tuxedo Collective
      </p>

      {/* Brass rule */}
      <span className="brass-rule block" aria-hidden="true" />

      {/* Headline */}
      <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ivory)] leading-snug">
        Golf Writing for the{" "}
        <em className="not-italic text-[var(--color-brass)]">Serious Player</em>
      </h3>

      {/* Description */}
      <p className="font-[family-name:var(--font-body)] text-sm text-[var(--color-ivory-warm)] leading-relaxed">
        Private club culture, fitting guides, and the etiquette that defines
        the game — free to your inbox.
      </p>

      {/* Email form stacked */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-2.5"
        aria-label="Newsletter signup form"
      >
        <label htmlFor="sidebar-email" className="sr-only">
          Email address
        </label>
        <input
          id="sidebar-email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          className={[
            "w-full",
            "px-4 py-2.5 text-sm",
            "bg-[var(--color-green-deep)]",
            "border border-[color-mix(in_srgb,var(--color-brass)_30%,transparent)]",
            "rounded-sm",
            "text-[var(--color-ivory)]",
            "placeholder:text-[color-mix(in_srgb,var(--color-ivory-warm)_40%,transparent)]",
            "font-[family-name:var(--font-body)]",
            "focus:outline-2 focus:outline-[var(--color-brass)] focus:outline-offset-0",
          ].join(" ")}
        />
        <Button variant="primary" size="md" type="submit" className="w-full">
          Subscribe Free
        </Button>
      </form>

      {/* Disclaimer */}
      <p className="text-[10px] text-[color-mix(in_srgb,var(--color-ivory-warm)_45%,transparent)] font-[family-name:var(--font-body)]">
        No spam. Unsubscribe at any time.
      </p>
    </aside>
  )
}
