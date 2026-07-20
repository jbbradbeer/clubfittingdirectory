"use client"

import { useState } from "react"
import Link from "next/link"

/* Standard two-measurement grip chart (Golf Pride-style): hand length from
   the wrist crease to the tip of the middle finger sets the base size, and
   the middle-finger length nudges a borderline hand one size. */
const HAND_BANDS: { max: number; size: string }[] = [
  { max: 6.5, size: "Junior / Undersize" },
  { max: 7, size: "Undersize" },
  { max: 8.25, size: "Standard" },
  { max: 9.25, size: "Midsize" },
  { max: Infinity, size: "Jumbo" },
]

const SIZES = ["Junior / Undersize", "Undersize", "Standard", "Midsize", "Jumbo"]

function gripSize(hand: number, finger: number | null): { size: string; adjusted: boolean } {
  const base = HAND_BANDS.find((b) => hand < b.max)!.size
  if (finger == null) return { size: base, adjusted: false }
  const idx = SIZES.indexOf(base)
  // Long fingers relative to the hand crowd the palm on a small grip; short
  // fingers on a big hand struggle to wrap a thick one. One step either way.
  if (finger >= hand * 0.5 + 0.5 && idx < SIZES.length - 1)
    return { size: SIZES[idx + 1], adjusted: true }
  if (finger <= hand * 0.5 - 0.75 && idx > 0) return { size: SIZES[idx - 1], adjusted: true }
  return { size: base, adjusted: false }
}

export function GripSizeCalculatorClient() {
  const [hand, setHand] = useState("")
  const [finger, setFinger] = useState("")

  const handIn = parseFloat(hand)
  const fingerIn = parseFloat(finger)
  const hasHand = !Number.isNaN(handIn) && handIn >= 5 && handIn <= 12
  const hasFinger = !Number.isNaN(fingerIn) && fingerIn >= 2 && fingerIn <= 6

  const result = hasHand ? gripSize(handIn, hasFinger ? fingerIn : null) : null

  const inputClass =
    "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]"

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hand-length" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
            Hand length (inches)
          </label>
          <input
            id="hand-length"
            type="number"
            inputMode="decimal"
            min={5}
            max={12}
            step={0.25}
            placeholder="e.g. 7.5"
            value={hand}
            onChange={(e) => setHand(e.target.value)}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-[var(--color-charcoal-light)]">
            Wrist crease to the tip of your middle finger, on your glove hand.
          </p>
        </div>
        <div>
          <label htmlFor="finger-length" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
            Middle finger length (inches, optional)
          </label>
          <input
            id="finger-length"
            type="number"
            inputMode="decimal"
            min={2}
            max={6}
            step={0.25}
            placeholder="e.g. 3.5"
            value={finger}
            onChange={(e) => setFinger(e.target.value)}
            className={inputClass}
          />
          <p className="mt-2 text-xs text-[var(--color-charcoal-light)]">
            Base knuckle to fingertip — refines a borderline result.
          </p>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-xl bg-[var(--color-cream)] border border-[var(--color-border)] p-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-charcoal-light)] mb-2">
            Recommended grip size
          </p>
          <p className="font-display text-3xl font-bold text-[var(--color-forest)]">
            {result.size}
          </p>
          <p className="mt-3 text-sm text-[var(--color-charcoal-light)]">
            {result.adjusted
              ? "Your finger length shifted the base recommendation one size — a fitter would confirm with grip-on-hand sizing."
              : `A ${handIn}″ hand measurement lands in the ${result.size.toLowerCase()} range on the standard chart.`}
            {" "}Feel still rules: many players add tape wraps to fine-tune between sizes.
          </p>
          <p className="mt-4 text-sm text-[var(--color-charcoal)]">
            Regripping is cheap and quick — most shops do it while you wait.{" "}
            <Link href="/repair" className="font-semibold text-[var(--color-forest)] hover:underline">
              Find a shop that regrips near you &rarr;
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
