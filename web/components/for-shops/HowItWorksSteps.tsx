"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export interface HowItWorksStep {
  title: string
  summary: string
  body: string
}

/**
 * Expandable "How it works" steps for /for-shops. The summary is always
 * visible; clicking a step reveals the longer explanation (one open at a
 * time, first open by default). Height animates via the CSS grid-rows trick
 * so no JS measuring is needed.
 */
export function HowItWorksSteps({ steps }: { steps: HowItWorksStep[] }) {
  const [open, setOpen] = useState(0)

  return (
    <ol className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
      {steps.map((step, i) => {
        const isOpen = open === i
        return (
          <li
            key={step.title}
            className={`bg-[var(--color-ivory)] border rounded-2xl transition-colors ${
              isOpen ? "border-[var(--color-forest)]" : "border-[var(--color-border)]"
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="w-full text-left p-6 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-display text-3xl text-[var(--color-gold-ink)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-lg text-[var(--color-charcoal)]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-charcoal-light)]">
                    {step.summary}
                  </p>
                </div>
                <ChevronDown
                  size={20}
                  aria-hidden="true"
                  className={`shrink-0 mt-1 text-[var(--color-charcoal-light)] transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="pt-3 text-sm text-[var(--color-charcoal)] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
