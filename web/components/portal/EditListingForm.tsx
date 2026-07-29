import { ChevronDown } from "lucide-react"
import { EDITABLE_FIELDS } from "@/lib/portal-editable"
import type { OwnedShop } from "@/lib/portal-auth"
import { submitEdits } from "@/app/portal/edit/actions"
import { Button } from "@/components/ui/Button"
import { fieldClass, selectClass, labelClass } from "@/lib/form-styles"

/**
 * Server-rendered edit form for one owned shop. Defaults come from the live
 * shops row; submit creates a pending owner_edit_batches row (reviewed by the
 * founder before anything goes live). Name/city/state are locked — identity
 * changes go through the message box.
 */
export function EditListingForm({ shop }: { shop: OwnedShop }) {
  const record = shop as unknown as Record<string, unknown>

  return (
    <form action={submitEdits} className="space-y-5">
      <input type="hidden" name="shop_id" value={shop.id} />

      <div className="bg-[var(--color-ivory)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-charcoal-light)]">
        <span className="font-semibold text-[var(--color-charcoal)]">{shop.name}</span>
        {" · "}
        {shop.city}, {shop.state_code}
        <span className="block mt-1 text-xs">
          Shop name and location are locked — ask for changes in the message box
          and we&apos;ll handle them by hand.
        </span>
      </div>

      {EDITABLE_FIELDS.map((field) => {
        const current = record[field.attribute]

        if (field.kind === "boolean") {
          return (
            <label key={field.attribute} className="flex items-center gap-2.5 text-sm text-[var(--color-charcoal)] cursor-pointer select-none">
              <input
                type="checkbox"
                name={field.attribute}
                defaultChecked={Boolean(current)}
                className="accent-[var(--color-forest)]"
              />
              {field.label}
            </label>
          )
        }

        if (field.kind === "select") {
          return (
            <div key={field.attribute}>
              <label htmlFor={field.attribute} className={labelClass}>{field.label}</label>
              <div className="relative">
                <select
                  id={field.attribute}
                  name={field.attribute}
                  defaultValue={typeof current === "string" ? current : ""}
                  className={selectClass}
                >
                  <option value="">Not sure</option>
                  {(field.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-charcoal-light)] pointer-events-none" />
              </div>
            </div>
          )
        }

        if (field.kind === "text_array") {
          const lines = Array.isArray(current) ? (current as string[]).join("\n") : ""
          return (
            <div key={field.attribute}>
              <label htmlFor={field.attribute} className={labelClass}>{field.label}</label>
              <textarea
                id={field.attribute}
                name={field.attribute}
                defaultValue={lines}
                rows={4}
                maxLength={2000}
                className={fieldClass}
              />
              {field.hint && <p className="mt-1 text-xs text-[var(--color-charcoal-light)]">{field.hint}</p>}
            </div>
          )
        }

        if (field.kind === "jsonb") {
          // working_hours — read-only v1; changes go through the message box.
          const hours = current as Record<string, string | string[]> | null
          return (
            <div key={field.attribute}>
              <span className={labelClass}>{field.label}</span>
              <div className="border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-charcoal-light)] space-y-0.5">
                {hours && Object.keys(hours).length > 0 ? (
                  Object.entries(hours).map(([day, v]) => (
                    <p key={day}>
                      <span className="font-medium text-[var(--color-charcoal)] capitalize">{day}:</span>{" "}
                      {Array.isArray(v) ? v.join(", ") : v}
                    </p>
                  ))
                ) : (
                  <p>No hours on file.</p>
                )}
              </div>
              {field.hint && <p className="mt-1 text-xs text-[var(--color-charcoal-light)]">{field.hint}</p>}
            </div>
          )
        }

        return (
          <div key={field.attribute}>
            <label htmlFor={field.attribute} className={labelClass}>{field.label}</label>
            <input
              id={field.attribute}
              name={field.attribute}
              defaultValue={typeof current === "string" ? current : ""}
              maxLength={500}
              placeholder={field.placeholder}
              className={fieldClass}
            />
            {field.hint && <p className="mt-1 text-xs text-[var(--color-charcoal-light)]">{field.hint}</p>}
          </div>
        )
      })}

      <div>
        <label htmlFor="message" className={labelClass}>Anything else? (hours changes, name fixes, notes for us)</label>
        <textarea id="message" name="message" rows={3} maxLength={1000} className={fieldClass} />
      </div>

      <Button type="submit" variant="primary" className="w-full">
        Submit for review
      </Button>
      <p className="text-xs text-[var(--color-charcoal-light)] text-center">
        We review every change by hand — usually within a day or two. You&apos;ll
        get an email when it&apos;s live.
      </p>
    </form>
  )
}
