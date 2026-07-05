"use client"

import Link from "next/link"
import { track } from "@vercel/analytics"
import type { VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/Button"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────
   TRACKED BUTTON — a Button-styled internal link that records
   a Vercel Analytics event on click. Exists because Button is
   a server component whose Link path can't take onClick; this
   is the one client-side variant for conversion CTAs.
   ───────────────────────────────────────────────────────── */

interface TrackedButtonProps extends VariantProps<typeof buttonVariants> {
  href: string
  /** Vercel Analytics event name, e.g. "guide_cta" */
  event: string
  eventProps?: Record<string, string>
  className?: string
  children: React.ReactNode
}

export function TrackedButton({
  href,
  event,
  eventProps,
  variant,
  size,
  className,
  children,
}: TrackedButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={() => track(event, eventProps)}
    >
      {children}
    </Link>
  )
}
