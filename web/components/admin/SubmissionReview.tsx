"use client"

import { useState } from "react"
import { approveSubmission, rejectSubmission } from "@/app/admin/actions"
import { ActionButton } from "@/components/admin/ActionButton"
import { US_STATES } from "@/lib/constants"
import { SHOP_TYPES } from "@/lib/shop-types"
import { checkboxClass, labelClass } from "@/lib/form-styles"

const inputClass =
  "w-full px-3 py-2 bg-white border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-forest)]"

/**
 * Review controls for one pending submission: fix what the submitter left blank
 * or got wrong, leave out hours or services, then publish or reject.
 */
export function SubmissionReview({
  id,
  city,
  stateCode,
  shopType,
  street,
  postalCode,
  offersFitting,
  hours,
  services,
  likelyDuplicate,
}: {
  id: string
  city: string
  stateCode: string
  shopType: string | null
  street: string
  postalCode: string
  offersFitting: boolean
  /** Readable summary; empty when the submitter gave none. */
  hours: string
  services: string[]
  likelyDuplicate: boolean
}) {
  const [form, setForm] = useState({ city, state_code: stateCode, shop_type: shopType ?? "", street, postal_code: postalCode })
  const [notDuplicate, setNotDuplicate] = useState(false)
  const [fitting, setFitting] = useState(offersFitting)
  const [useHours, setUseHours] = useState(true)
  const [useServices, setUseServices] = useState(true)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor={`city-${id}`} className={labelClass}>City</label>
          <input id={`city-${id}`} value={form.city} onChange={set("city")} maxLength={80} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`state-${id}`} className={labelClass}>State</label>
          <select id={`state-${id}`} value={form.state_code} onChange={set("state_code")} className={inputClass}>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`type-${id}`} className={labelClass}>Shop type</label>
          <select id={`type-${id}`} value={form.shop_type} onChange={set("shop_type")} className={inputClass}>
            <option value="">Choose a type…</option>
            {SHOP_TYPES.map((t) => (
              <option key={t.dbType} value={t.dbType}>{t.singular}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
        <div>
          <label htmlFor={`street-${id}`} className={labelClass}>Street (blank = no address or map pin)</label>
          <input id={`street-${id}`} value={form.street} onChange={set("street")} maxLength={200} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`zip-${id}`} className={labelClass}>ZIP</label>
          <input id={`zip-${id}`} value={form.postal_code} onChange={set("postal_code")} maxLength={10} inputMode="numeric" className={inputClass} />
        </div>
      </div>

      <Tick checked={fitting} onChange={setFitting}>Offers club fitting (shows the Request a Fitting button)</Tick>
      {services.length > 0 && (
        <Tick checked={useServices} onChange={setUseServices}>Services: {services.join(", ")}</Tick>
      )}
      {hours && <Tick checked={useHours} onChange={setUseHours}>Hours: {hours}</Tick>}
      {likelyDuplicate && (
        <Tick checked={notDuplicate} onChange={setNotDuplicate}>I checked: this is not a duplicate</Tick>
      )}

      <div className="mt-4 flex items-start gap-2">
        <ActionButton
          action={approveSubmission}
          fields={{
            id, ...form,
            offers_fitting: fitting ? "1" : "0",
            omit_hours: useHours ? "0" : "1",
            omit_services: useServices ? "0" : "1",
            ...(notDuplicate ? { allow_duplicate: "1" } : {}),
          }}
          className="px-4 py-1.5 text-sm font-semibold bg-[var(--color-forest)] text-white rounded-full hover:bg-[var(--color-forest-dark)] transition-colors cursor-pointer"
        >
          Approve &amp; publish
        </ActionButton>
        <ActionButton
          action={rejectSubmission}
          fields={{ id }}
          className="px-4 py-1.5 text-sm font-semibold border border-[var(--color-border)] text-[var(--color-charcoal)] rounded-full hover:bg-[var(--color-cream)] transition-colors cursor-pointer"
        >
          Reject
        </ActionButton>
      </div>
    </div>
  )
}

function Tick({
  checked, onChange, children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label className="mt-3 flex items-start gap-2 text-sm text-[var(--color-charcoal)] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`${checkboxClass} mt-0.5 shrink-0`}
      />
      <span>{children}</span>
    </label>
  )
}
