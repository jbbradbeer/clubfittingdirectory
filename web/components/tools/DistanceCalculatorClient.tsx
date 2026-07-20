"use client"

import { useState } from "react"
import Link from "next/link"

/* Carry ≈ swing speed × club factor. Factors derived from published launch-
   monitor averages (TrackMan/PGA data): driver carry runs ~2.3 yd per mph of
   driver speed for a solid strike, and each club down the bag scales off the
   same driver-speed input. Estimates assume centered contact and neutral
   conditions — the copy says so. */
const CLUBS: { name: string; factor: number }[] = [
  { name: "Driver", factor: 2.3 },
  { name: "3-wood", factor: 2.15 },
  { name: "5-wood", factor: 2.05 },
  { name: "Hybrid", factor: 1.95 },
  { name: "4-iron", factor: 1.85 },
  { name: "5-iron", factor: 1.77 },
  { name: "6-iron", factor: 1.69 },
  { name: "7-iron", factor: 1.6 },
  { name: "8-iron", factor: 1.5 },
  { name: "9-iron", factor: 1.4 },
  { name: "Pitching wedge", factor: 1.28 },
  { name: "Gap wedge", factor: 1.15 },
  { name: "Sand wedge", factor: 1.0 },
  { name: "Lob wedge", factor: 0.85 },
]

const BENCHMARKS = [
  { label: "PGA Tour average", speed: 115 },
  { label: "Male amateur average", speed: 93 },
  { label: "LPGA Tour average", speed: 94 },
  { label: "Female amateur average", speed: 78 },
]

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

export function DistanceCalculatorClient() {
  const [speed, setSpeed] = useState(93)

  const benchmark = BENCHMARKS.reduce((best, b) =>
    Math.abs(b.speed - speed) < Math.abs(best.speed - speed) ? b : best,
  )

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-6 sm:p-8">
      <label htmlFor="swing-speed" className="block text-sm font-semibold text-[var(--color-charcoal)] mb-2">
        Driver swing speed: <span className="data text-[var(--color-forest)]">{speed} mph</span>
      </label>
      <input
        id="swing-speed"
        type="range"
        min={60}
        max={130}
        step={1}
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="w-full accent-[var(--color-forest)]"
      />
      <div className="flex justify-between text-xs text-[var(--color-charcoal-light)] mt-1">
        <span>60 mph</span>
        <span>130 mph</span>
      </div>
      <p className="mt-2 text-xs text-[var(--color-charcoal-light)]">
        Closest benchmark: {benchmark.label} (~{benchmark.speed} mph). Don&apos;t know
        your speed? Most male amateurs sit between 85 and 100 mph.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left">
              <th className="py-2 pr-4 font-semibold text-[var(--color-charcoal)]">Club</th>
              <th className="py-2 text-right font-semibold text-[var(--color-charcoal)]">
                Estimated carry
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {CLUBS.map((club) => (
              <tr key={club.name}>
                <td className="py-2 pr-4 text-[var(--color-charcoal)]">{club.name}</td>
                <td className="py-2 text-right data text-[var(--color-forest)] font-semibold">
                  {roundTo5(speed * club.factor)} yds
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 text-sm text-[var(--color-charcoal)]">
        Estimates assume solid, centered contact — most golfers carry less because of
        strike quality, not speed. A launch-monitor fitting measures your real
        numbers and the gapping between clubs.{" "}
        <Link href="/directory" className="font-semibold text-[var(--color-forest)] hover:underline">
          Find a fitter with a launch monitor &rarr;
        </Link>
      </p>
    </div>
  )
}
