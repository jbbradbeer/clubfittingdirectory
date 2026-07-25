"use client"

import { useState } from "react"
import { BadgeCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { PLANS, ANNUAL_SAVINGS, FREE_PERKS, FEATURED_PERKS, type PlanKey } from "@/lib/plans"

/**
 * The free-vs-Featured plan comparison for /for-shops: a monthly/annual
 * billing toggle that live-updates the Featured card's price, next to the
 * always-free plan. Perk copy comes from the shared lib/plans.ts source so
 * the pitch matches the claim page, pay page, and emails.
 */
export function PlanComparison() {
  const [plan, setPlan] = useState<PlanKey>("annual")

  return (
    <div className="mt-12">
      {/* ── Billing toggle ── */}
      <div className="flex items-center justify-center gap-3">
        <div
          role="radiogroup"
          aria-label="Billing period"
          className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white p-1 shadow-card"
        >
          {(["monthly", "annual"] as const).map((key) => {
            const selected = plan === key
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPlan(key)}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors cursor-pointer ${
                  selected
                    ? "bg-[var(--color-forest)] text-white"
                    : "text-[var(--color-charcoal-light)] hover:text-[var(--color-charcoal)]"
                }`}
              >
                {key === "monthly" ? "Monthly" : "Annual"}
              </button>
            )
          })}
        </div>
        <span
          className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-[var(--color-gold)] text-[var(--color-forest-deep)] transition-opacity duration-300 ${
            plan === "annual" ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={plan !== "annual"}
        >
          Save {ANNUAL_SAVINGS.display} — {ANNUAL_SAVINGS.note}
        </span>
      </div>

      {/* ── The two plans ── */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Free plan */}
        <div className="flex flex-col bg-white border border-[var(--color-border)] rounded-2xl shadow-card p-7 md:p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-charcoal-light)] font-semibold">
            Free — always
          </p>
          <p className="mt-3 font-display text-4xl text-[var(--color-charcoal)]">
            $0
            <span className="text-lg text-[var(--color-charcoal-light)]"> forever</span>
          </p>
          <p className="mt-2 text-sm text-[var(--color-charcoal-light)] leading-relaxed">
            Claim your listing, get hand-verified, and the badge is yours — no
            card, no catch.
          </p>
          <ul className="mt-6 space-y-3 flex-1">
            {FREE_PERKS.map((perk, i) => (
              <li key={perk.title} className="flex gap-2.5 text-sm leading-relaxed">
                {i === 0 ? (
                  <BadgeCheck size={18} className="text-[var(--color-forest)] shrink-0 mt-0.5" />
                ) : (
                  <Check size={18} className="text-[var(--color-forest)] shrink-0 mt-0.5" />
                )}
                <span>
                  <span className="font-semibold text-[var(--color-charcoal)]">
                    {perk.title}
                    {i === 0 && (
                      <span className="ml-2 align-middle inline-block px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] rounded-[3px] bg-[var(--color-forest)] text-white">
                        Verified
                      </span>
                    )}
                    .
                  </span>{" "}
                  <span className="text-[var(--color-charcoal-light)]">{perk.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <Button href="#find-your-shop" variant="outline" className="w-full justify-center">
              Begin verification
            </Button>
          </div>
        </div>

        {/* Featured plan */}
        <div className="relative flex flex-col overflow-hidden bg-[var(--color-forest)] text-white rounded-2xl shadow-card">
          <span aria-hidden="true" className="block h-1 w-full bg-[var(--color-gold)]" />
          <div className="flex flex-col flex-1 p-7 md:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-gold)] font-semibold">
              Featured — the growth layer
            </p>
            <p className="mt-3 font-display text-4xl">
              {PLANS[plan].priceDisplay}
              <span className="text-lg text-white/70">{PLANS[plan].per}</span>
            </p>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Everything in Free, plus the four things that put your shop in
              front of more golfers:
            </p>
            <ul className="mt-6 space-y-3 flex-1">
              {FEATURED_PERKS.map((perk) => (
                <li key={perk.title} className="flex gap-2.5 text-sm leading-relaxed">
                  <Check size={18} className="text-[var(--color-gold)] shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">{perk.title}.</span>{" "}
                    <span className="text-white/80">{perk.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Button href="#find-your-shop" variant="secondary" className="w-full justify-center">
                Start with your free claim
              </Button>
              <p className="mt-3 text-xs text-white/60 text-center">
                Secured by Stripe · cancel anytime · the Verified badge stays — it&apos;s free
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
