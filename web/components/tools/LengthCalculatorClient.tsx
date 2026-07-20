"use client"

import { useState } from "react"
import Link from "next/link"

/* Standard static-fitting matrix used across the industry (PING-style):
   wrist-to-floor distance sets the base length adjustment, height acts as a
   sanity band. Static measurements are a starting point only — the tool says
   so and routes the user to a dynamic fitting. */
const WTF_CHART: { max: number; adjustment: number }[] = [
  { max: 25, adjustment: -2 },
  { max: 27, adjustment: -1.5 },
  { max: 29, adjustment: -1 },
  { max: 32, adjustment: -0.5 },
  { max: 34, adjustment: 0 },
  { max: 37, adjustment: 0.25 },
  { max: 40, adjustment: 0.5 },
  { max: 42, adjustment: 1 },
  { max: Infinity, adjustment: 1.5 },
]

function baseAdjustment(wristToFloor: number): number {
  return WTF_CHART.find((row) => wristToFloor < row.max)!.adjustment
}

function formatAdjustment(inches: number): string {
  if (inches === 0) return "Standard length"
  const frac =
    Math.abs(inches) % 1 === 0.5
      ? `${Math.trunc(Math.abs(inches)) || ""}½`
      : Math.abs(inches) % 1 === 0.25
        ? "¼"
        : `${Math.abs(inches)}`
  return `${inches > 0 ? "+" : "−"}${frac}″ ${inches > 0 ? "over" : "under"} standard`
}

const FEET_OPTIONS = [4, 5, 6, 7]
const INCH_OPTIONS = Array.from({ length: 12 }, (_, i) => i)

export function LengthCalculatorClient() {
  const [feet, setFeet] = useState(5)
  const [inches, setInches] = useState(10)
  const [wristToFloor, setWristToFloor] = useState("")

  const wtf = parseFloat(wristToFloor)
  const heightInches = feet * 12 + inches
  const hasResult = !Number.isNaN(wtf) && wtf >= 20 && wtf <= 48

  const adjustment = hasResult ? baseAdjustment(wtf) : 0
  // A wrist-to-floor reading far out of line with height usually means a
  // mis-measurement (shoes on, arms bent) — flag it rather than mis-recommend.
  const suspicious = hasResult && (wtf > heightInches * 0.58 || wtf < heightInches * 0.42)

  const selectClass =
    "w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]"

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="height-feet" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
            Height (feet)
          </label>
          <select
            id="height-feet"
            value={feet}
            onChange={(e) => setFeet(Number(e.target.value))}
            className={selectClass}
          >
            {FEET_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f} ft
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="height-inches" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
            Height (inches)
          </label>
          <select
            id="height-inches"
            value={inches}
            onChange={(e) => setInches(Number(e.target.value))}
            className={selectClass}
          >
            {INCH_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i} in
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="wrist-to-floor" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
            Wrist-to-floor (inches)
          </label>
          <input
            id="wrist-to-floor"
            type="number"
            inputMode="decimal"
            min={20}
            max={48}
            step={0.25}
            placeholder="e.g. 34.5"
            value={wristToFloor}
            onChange={(e) => setWristToFloor(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--color-charcoal-light)]">
        Measure wrist-to-floor standing upright in flat shoes, arms relaxed at your
        sides — from the crease of your wrist straight down to the floor.
      </p>

      {hasResult && (
        <div className="mt-6 rounded-xl bg-[var(--color-cream)] border border-[var(--color-border)] p-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-charcoal-light)] mb-2">
            Recommended iron length
          </p>
          <p className="font-display text-3xl font-bold text-[var(--color-forest)]">
            {formatAdjustment(adjustment)}
          </p>
          <p className="mt-3 text-sm text-[var(--color-charcoal-light)]">
            {suspicious
              ? "That wrist-to-floor number is unusual for your height — double-check the measurement (flat shoes, arms fully relaxed) before trusting the result."
              : adjustment === 0
                ? `At ${feet}′${inches}″ with a ${wtf}″ wrist-to-floor, off-the-rack length should fit your setup posture.`
                : `At ${feet}′${inches}″ with a ${wtf}″ wrist-to-floor, a static fit points to irons ${formatAdjustment(adjustment).toLowerCase()}.`}
          </p>
          <p className="mt-4 text-sm text-[var(--color-charcoal)]">
            Static charts get you close — a dynamic fitting with impact tape and lie
            boards gets it right.{" "}
            <Link href="/directory" className="font-semibold text-[var(--color-forest)] hover:underline">
              Find a club fitter near you &rarr;
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
