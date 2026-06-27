import { getCover, type CoverMotif } from "@/lib/cover"
import { cn } from "@/lib/utils"

/**
 * ShopCover — the generative, photo-less cover for a shop. Drop it into a
 * `relative` aspect box (it positions itself `absolute inset-0`). Renders a
 * palette gradient + a cartographic motif (keyed to shop type) + a refined
 * display monogram. Deterministic per slug — see lib/cover.ts.
 *
 * Reused by ListingCard (16:10 tile) and the listing-profile banner (wide band).
 */
export function ShopCover({
  slug,
  shopType,
  name,
  className,
  monogramClassName,
}: {
  slug: string
  shopType?: string | null
  name?: string | null
  className?: string
  monogramClassName?: string
}) {
  const { paletteIndex: p, motif, seed, rotate } = getCover(slug, shopType)
  const monogram = name?.trim()?.charAt(0)?.toUpperCase() || "•"

  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={{
        backgroundImage: `linear-gradient(150deg, var(--cover-${p}-a) 0%, var(--cover-${p}-b) 100%)`,
        color: `var(--cover-${p}-ink)`,
      }}
    >
      {/* Cartographic motif — full-bleed texture, low-opacity ink lines */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 320 200"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        style={{ transform: `rotate(${rotate}deg) scale(1.18)` }}
      >
        <Motif kind={motif} seed={seed} />
      </svg>

      {/* Refined display monogram — the cover's focal mark */}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-display font-extrabold leading-none",
          monogramClassName ?? "text-6xl",
        )}
        style={{ color: "currentColor", opacity: 0.96 }}
      >
        {monogram}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   MOTIFS — each shop type gets a distinct cartographic mark.
   All stroke in `currentColor` (the palette ink) at low opacity so the
   monogram stays the focal point. `seed` shifts placement so two cards of
   the same type + palette still differ.
   ───────────────────────────────────────────────────────── */
function Motif({ kind, seed }: { kind: CoverMotif; seed: number }) {
  const ink = "currentColor"
  switch (kind) {
    /* Topographic rings — Club Fitters (fitting precision) */
    case "contour": {
      const cx = 70 + (seed % 180)
      const cy = 40 + ((seed >> 2) % 120)
      return (
        <g stroke={ink} strokeWidth="1.5" opacity="0.22">
          {[18, 40, 64, 90, 118, 148].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )
    }
    /* Fairway / shelf grid in perspective — Retailers */
    case "grid": {
      const shift = (seed % 24) - 12
      return (
        <g stroke={ink} strokeWidth="1.25" opacity="0.18">
          {[-20, 20, 60, 100, 140, 180, 220, 260, 300, 340].map((x) => (
            <line key={`v${x}`} x1={x + shift} y1="-10" x2={x * 0.85 + 120} y2="210" />
          ))}
          {[30, 70, 110, 150, 190].map((y) => (
            <line key={`h${y}`} x1="-10" y1={y} x2="330" y2={y} />
          ))}
        </g>
      )
    }
    /* Ball-flight parabolas — Simulators */
    case "arcs": {
      const base = (seed % 40) - 20
      return (
        <g stroke={ink} strokeWidth="1.75" opacity="0.22" strokeLinecap="round">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M ${-20 + i * 8} ${210 + base} Q ${120 + i * 20} ${-60 + i * 24} ${360} ${120 - i * 18}`}
            />
          ))}
        </g>
      )
    }
    /* Flagstick on a green — Pro Shops */
    case "flag": {
      const fx = 90 + (seed % 150)
      return (
        <g stroke={ink} opacity="0.26" strokeLinecap="round">
          <path d="M -10 168 Q 160 120 330 168" strokeWidth="1.5" fill="none" opacity="0.6" />
          <line x1={fx} y1="44" x2={fx} y2="168" strokeWidth="2" />
          <path d={`M ${fx} 46 L ${fx + 46} 60 L ${fx} 78 Z`} fill={ink} stroke="none" opacity="0.5" />
          <circle cx={fx} cy="168" r="3.5" fill={ink} stroke="none" />
        </g>
      )
    }
    /* Swing-path motion lines — Instruction */
    case "swing": {
      const ox = 60 + (seed % 160)
      return (
        <g stroke={ink} strokeWidth="1.75" opacity="0.2" strokeLinecap="round" fill="none">
          <path d={`M ${ox - 120} 180 A 150 150 0 0 1 ${ox + 120} 70`} />
          <path d={`M ${ox - 90} 188 A 120 120 0 0 1 ${ox + 96} 96`} opacity="0.7" />
          {[-1, 0, 1].map((i) => (
            <line key={i} x1={ox + i * 26} y1="172" x2={ox + i * 26} y2="184" strokeWidth="2" />
          ))}
        </g>
      )
    }
    /* Concentric range targets from a corner — Driving Ranges */
    case "rings": {
      const cx = seed % 2 === 0 ? 300 : 20
      const cy = 190
      return (
        <g stroke={ink} strokeWidth="1.5" opacity="0.2">
          {[30, 64, 100, 138, 178, 220].map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )
    }
  }
}
