"use client"

import { useState } from "react"
import { sendToShop } from "@/app/admin/leads/actions"
import { ActionButton } from "@/components/admin/ActionButton"
import { labelClass } from "@/lib/form-styles"
import type { ShopMessage } from "@/lib/leads/message"

/**
 * One-tap relay of a golfer's request to an unclaimed shop. The preview is the
 * same message object the email renders, so what's shown is what's sent.
 */
export function LeadRelay({
  id,
  knownEmail,
  verified,
  message,
}: {
  id: string
  knownEmail: string
  verified: boolean
  message: ShopMessage
}) {
  const [email, setEmail] = useState(knownEmail)
  const unverified = email.trim() !== "" && !(verified && email.trim() === knownEmail)

  return (
    <div className="rounded-xl bg-[var(--color-cream)] px-4 py-4 space-y-3">
      <div>
        <label htmlFor={`shop-email-${id}`} className={labelClass}>Shop email</label>
        <input
          id={`shop-email-${id}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          placeholder="None on file. Paste one from the shop's website"
          className="w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-forest)]"
        />
        {unverified && (
          <p className="mt-1 text-xs text-amber-700">Not verified. Check it belongs to this shop before sending.</p>
        )}
      </div>

      <details>
        <summary className="text-sm font-semibold text-[var(--color-charcoal)] cursor-pointer">
          Preview what the shop receives
        </summary>
        <div className="mt-2 rounded-lg bg-white border border-[var(--color-border)] p-4 text-sm space-y-2">
          <p className="font-semibold text-[var(--color-charcoal)]">{message.subject}</p>
          <p>{message.intro}</p>
          <dl>
            {message.details.map((d) => (
              <div key={d.label} className="flex gap-2">
                <dt className="font-medium text-[var(--color-charcoal)]">{d.label}:</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
          <p>{message.reply}</p>
          <p>{message.claim}</p>
          <p className="text-xs break-all">{message.claimUrl}</p>
          <p className="text-xs">{message.footer}</p>
        </div>
      </details>

      <ActionButton
        action={sendToShop}
        fields={{ id, email }}
        className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
      >
        Send to shop
      </ActionButton>
    </div>
  )
}
