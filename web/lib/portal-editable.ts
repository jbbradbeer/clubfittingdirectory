/**
 * The owner-editable field whitelist — single source of truth shared by the
 * portal edit form, the submit action, and the admin review panel. Every
 * attribute here is fact-tracked (fact_attributes, migration 005) so approved
 * values flow through applyOwnerFact() in lib/facts.ts.
 *
 * `rating` is fact-tracked but deliberately NOT editable — owners don't grade
 * themselves. Server actions must drop any non-whitelisted key.
 */

export type EditableKind = "text" | "boolean" | "text_array" | "jsonb" | "select"

export interface EditableField {
  attribute: string
  label: string
  kind: EditableKind
  /** Short helper text under the input. */
  hint?: string
  placeholder?: string
  /** Allowed values for kind "select". */
  options?: readonly { value: string; label: string }[]
}

export const EDITABLE_FIELDS: EditableField[] = [
  { attribute: "phone", label: "Phone", kind: "text", placeholder: "(555) 123-4567" },
  { attribute: "website", label: "Website", kind: "text", placeholder: "https://yourshop.com" },
  { attribute: "street", label: "Street address", kind: "text", placeholder: "123 Fairway Dr" },
  {
    attribute: "services_array",
    label: "Services",
    kind: "text_array",
    hint: "One per line — e.g. Club fitting, Regripping, Loft & lie adjustment",
  },
  { attribute: "offers_fitting", label: "Offers club fitting", kind: "boolean" },
  {
    attribute: "brands_fitted",
    label: "Brands fitted",
    kind: "text_array",
    hint: "One per line — e.g. Titleist, PING, Callaway",
  },
  {
    attribute: "launch_monitors",
    label: "Launch monitors",
    kind: "text_array",
    hint: "One per line — e.g. TrackMan 4, GCQuad",
  },
  {
    attribute: "ownership_type",
    label: "Ownership",
    kind: "select",
    options: [
      { value: "independent", label: "Independent" },
      { value: "big_box", label: "Big-box retailer" },
      { value: "national_chain", label: "National chain" },
      { value: "oem", label: "Brand (OEM) studio" },
    ],
  },
  {
    attribute: "working_hours",
    label: "Hours",
    kind: "jsonb",
    hint: "Shown read-only for now — describe hour changes in the message box below and we'll apply them.",
  },
] as const

export const EDITABLE_ATTRIBUTES = new Set(EDITABLE_FIELDS.map((f) => f.attribute))

/** Fields whose change should also refresh city/state/category pages. */
export const WIDE_REVALIDATE_ATTRIBUTES = new Set(["services_array", "offers_fitting"])

export type ParsedEdit = { changed: false } | { changed: true; value: unknown }

/**
 * Turn one submitted form value into a proposed edit, or report "no change".
 * Pure (no I/O) so the edge cases are unit-tested in portal-editable.test.ts:
 *  - An UNticked checkbox is absent from FormData, so a missing boolean means
 *    `false` (not "skip") — otherwise owners could never untick a box.
 *  - "Empty" is one value: null, false-for-booleans and [] all mean "nothing
 *    set", so leaving a blank field blank is never reported as a change (and
 *    never stored as an owner-verified empty value on approval).
 */
export function parseEditValue(
  field: EditableField,
  raw: FormDataEntryValue | null,
  currentValue: unknown,
): ParsedEdit {
  let value: unknown
  if (field.kind === "boolean") {
    value = raw !== null && (String(raw) === "on" || String(raw) === "true")
    if (value === Boolean(currentValue)) return { changed: false }
    return { changed: true, value }
  }

  if (raw === null) return { changed: false }

  if (field.kind === "jsonb") return { changed: false } // working_hours read-only v1
  if (field.kind === "text_array") {
    const list = String(raw)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 40)
    value = list.length > 0 ? list : null
  } else if (field.kind === "select") {
    const allowed = new Set((field.options ?? []).map((o) => o.value))
    const v = String(raw).trim()
    if (!allowed.has(v)) return { changed: false }
    value = v
  } else {
    const v = String(raw).trim().slice(0, 500)
    value = v === "" ? null : v
  }

  const current =
    Array.isArray(currentValue) && currentValue.length === 0 ? null : currentValue ?? null
  if (JSON.stringify(value) === JSON.stringify(current)) return { changed: false }
  return { changed: true, value }
}
