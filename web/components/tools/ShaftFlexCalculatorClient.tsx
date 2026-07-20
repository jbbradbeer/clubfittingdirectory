"use client"

import { useState } from "react"
import Link from "next/link"

/* Standard swing-speed flex bands used across shaft manufacturers' charts.
   Boundaries are soft in reality — tempo shifts a borderline player one flex —
   so the result calls out borderline speeds instead of pretending precision. */
const FLEX_BANDS: { max: number; flex: string; code: string }[] = [
  { max: 70, flex: "Ladies", code: "L" },
  { max: 80, flex: "Senior", code: "A" },
  { max: 92, flex: "Regular", code: "R" },
  { max: 105, flex: "Stiff", code: "S" },
  { max: Infinity, flex: "Extra Stiff", code: "X" },
]

const BORDER_MARGIN = 3 // mph from a band edge that counts as borderline

function flexFor(speed: number) {
  return FLEX_BANDS.find((b) => speed < b.max)!
}

export function ShaftFlexCalculatorClient() {
  const [speed, setSpeed] = useState(93)
  const [mode, setMode] = useState<"speed" | "carry">("speed")
  const [carry, setCarry] = useState("")

  // Driver carry ≈ 2.3 yd per mph — same factor as the distance calculator.
  const carryYds = parseFloat(carry)
  const effectiveSpeed =
    mode === "carry"
      ? !Number.isNaN(carryYds) && carryYds >= 100 && carryYds <= 350
        ? Math.round(carryYds / 2.3)
        : null
      : speed

  const band = effectiveSpeed != null ? flexFor(effectiveSpeed) : null
  const nearEdge =
    effectiveSpeed != null &&
    FLEX_BANDS.some(
      (b) => b.max !== Infinity && Math.abs(effectiveSpeed - b.max) <= BORDER_MARGIN,
    )

  const inputClass =
    "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]"

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 sm:p-8">
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("speed")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            mode === "speed"
              ? "bg-[var(--color-forest)] text-white"
              : "bg-[var(--color-cream)] text-[var(--color-charcoal)] hover:bg-[var(--color-border)]"
          }`}
        >
          I know my swing speed
        </button>
        <button
          type="button"
          onClick={() => setMode("carry")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            mode === "carry"
              ? "bg-[var(--color-forest)] text-white"
              : "bg-[var(--color-cream)] text-[var(--color-charcoal)] hover:bg-[var(--color-border)]"
          }`}
        >
          I know my driver carry
        </button>
      </div>

      {mode === "speed" ? (
        <>
          <label htmlFor="flex-speed" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
            Driver swing speed: <span className="data text-[var(--color-forest)]">{speed} mph</span>
          </label>
          <input
            id="flex-speed"
            type="range"
            min={55}
            max={130}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-[var(--color-forest)]"
          />
          <div className="flex justify-between text-xs text-[var(--color-charcoal-light)] mt-1">
            <span>55 mph</span>
            <span>130 mph</span>
          </div>
        </>
      ) : (
        <div className="max-w-xs">
          <label htmlFor="flex-carry" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
            Typical driver carry (yards)
          </label>
          <input
            id="flex-carry"
            type="number"
            inputMode="numeric"
            min={100}
            max={350}
            placeholder="e.g. 215"
            value={carry}
            onChange={(e) => setCarry(e.target.value)}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-[var(--color-charcoal-light)]">
            Carry, not total — where the ball lands, before roll.
          </p>
        </div>
      )}

      {band && effectiveSpeed != null && (
        <div className="mt-6 rounded-xl bg-[var(--color-cream)] border border-[var(--color-border)] p-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-charcoal-light)] mb-2">
            Recommended driver shaft flex
          </p>
          <p className="font-display text-3xl font-bold text-[var(--color-forest)]">
            {band.flex} ({band.code})
          </p>
          <p className="mt-3 text-sm text-[var(--color-charcoal-light)]">
            {mode === "carry"
              ? `A ${carryYds}-yard carry implies roughly ${effectiveSpeed} mph of driver speed — that lands in the ${band.flex.toLowerCase()} range.`
              : `${effectiveSpeed} mph of driver speed lands in the ${band.flex.toLowerCase()} range.`}
            {nearEdge &&
              " You're near a flex boundary — tempo decides it: smooth swings favor the softer flex, aggressive transitions the stiffer one."}
          </p>
          <p className="mt-4 text-sm text-[var(--color-charcoal)]">
            Flex labels aren&apos;t standardized between brands — one maker&apos;s stiff is
            another&apos;s regular. A shaft fitting on a launch monitor is the only way
            to compare like for like.{" "}
            <Link href="/directory" className="font-semibold text-[var(--color-forest)] hover:underline">
              Find a shaft fitter near you &rarr;
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
