"use client"

import { useState } from "react"
import { BadgeCheck } from "lucide-react"
import { PLANS, type PlanKey } from "@/lib/plans"
import { PayButton } from "@/components/submit/PayButton"

/**
 * Monthly-vs-annual toggle for /onboard/pay/[slug]. Annual is preselected and
 * highlighted (two months free vs 12× monthly); the chosen plan feeds the
 * PayButton, which passes it to /api/checkout.
 */
export function PlanSelector({ shopSlug, renewal }: { shopSlug: string; renewal?: boolean }) {
  const [plan, setPlan] = useState<PlanKey>("annual")

  const options: { key: PlanKey; note: string }[] = [
    { key: "annual", note: "Two months free" },
    { key: "monthly", note: "Cancel anytime" },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Billing plan">
        {options.map(({ key, note }) => {
          const selected = plan === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPlan(key)}
              className={`relative text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                selected
                  ? "border-[var(--color-forest)] bg-[var(--color-forest-tint)]"
                  : "border-[var(--color-border)] bg-white hover:border-[var(--color-forest)]"
              }`}
            >
              {key === "annual" && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[var(--color-gold)] text-[var(--color-charcoal)] rounded-full">
                  Best value
                </span>
              )}
              <p className="text-xs uppercase tracking-wider text-[var(--color-charcoal-light)]">
                {key === "annual" ? "Annual" : "Monthly"}
              </p>
              <p className="mt-1">
                <span className="font-display text-2xl text-[var(--color-charcoal)]">
                  {PLANS[key].priceDisplay}
                </span>
                <span className="text-sm text-[var(--color-charcoal-light)]">{PLANS[key].per}</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-charcoal-light)]">
                {selected && <BadgeCheck size={13} className="text-[var(--color-forest)]" />}
                {note}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <PayButton shopSlug={shopSlug} plan={plan} renewal={renewal} />
      </div>
    </div>
  )
}
