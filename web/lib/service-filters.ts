/* ─────────────────────────────────────────────────────────
   SERVICE FILTERS — curated services exposed as directory
   filter checkboxes. `value` must be a substring of the
   pipe-delimited `shops.services` text (matched with ilike),
   and must never contain commas or parentheses — the value is
   embedded in a PostgREST .or() clause where those characters
   are structural. Before adding an entry, verify real data
   coverage with a count query against shops.services.
   ───────────────────────────────────────────────────────── */

export interface ServiceFilterDef {
  /** Substring matched against shops.services via ilike */
  value: string
  /** Checkbox label shown in the UI */
  label: string
}

export const SERVICE_FILTERS: ServiceFilterDef[] = [
  { value: "Club Repair", label: "Club Repair" },
]
