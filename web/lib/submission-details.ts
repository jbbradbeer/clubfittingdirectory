/* ─────────────────────────────────────────────────────────
   What a shop submission may say about hours and services.
   Pure: shared by the public form, its API route, and the
   approve step, so all three agree on what is allowed.
   ───────────────────────────────────────────────────────── */

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
export type Day = (typeof DAYS)[number]

/** Added from the "offers club fitting" tick box, so it can't disagree with it. */
export const FITTING_SERVICE = "Club Fitting"

/** The directory's existing service names (they drive filters and /repair). */
export const SUBMISSION_SERVICES = [
  "Club Repair",
  "Custom Club Building",
  "Shaft & Grip Sales",
  "Launch Monitor",
  "Golf Simulator",
  "Golf Lessons",
  "Retail / Pro Shop",
  "Used Clubs / Trade-In",
  "Club Rentals",
] as const

/** 24-hour "HH:MM" values offered by the form, on the half hour. */
export const TIME_OPTIONS: readonly string[] = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
)
const TIMES = new Set(TIME_OPTIONS)

/** "13:30" → "1:30PM", "09:00" → "9AM" — the shape listings already use. */
export function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number)
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "AM" : "PM"}`
}

export type DayInput = { status: "open" | "closed"; open?: string; close?: string }
export type WorkingHours = Partial<Record<Day, string[]>>

/**
 * Form hours → the listing's working_hours shape. A day left blank, or without
 * a usable time range, is dropped: missing means "unknown", never "Closed".
 */
export function parseHours(raw: unknown): WorkingHours {
  const out: WorkingHours = {}
  if (!raw || typeof raw !== "object") return out
  for (const day of DAYS) {
    const d = (raw as Record<string, unknown>)[day] as Partial<DayInput> | undefined
    if (!d || typeof d !== "object") continue
    if (d.status === "closed") out[day] = ["Closed"]
    else if (
      d.status === "open" &&
      typeof d.open === "string" && typeof d.close === "string" &&
      TIMES.has(d.open) && TIMES.has(d.close) && d.open < d.close
    ) out[day] = [`${formatTime(d.open)}-${formatTime(d.close)}`]
  }
  return out
}

const STORED_HOURS = /^\d{1,2}(:30)?(AM|PM)-\d{1,2}(:30)?(AM|PM)$/

/** Re-checks stored hours at approval: the row came from the public. */
export function cleanStoredHours(raw: unknown): WorkingHours {
  const out: WorkingHours = {}
  if (!raw || typeof raw !== "object") return out
  for (const day of DAYS) {
    const v = (raw as Record<string, unknown>)[day]
    if (Array.isArray(v) && v.length === 1 && typeof v[0] === "string" && (v[0] === "Closed" || STORED_HOURS.test(v[0]))) {
      out[day] = [v[0]]
    }
  }
  return out
}

/** Known services only, in list order, no repeats. */
export function parseServices(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const picked = new Set(raw)
  return SUBMISSION_SERVICES.filter((s) => picked.has(s))
}

/** "Walnut, MS" and "90210" aren't city names. */
export function isPlausibleCity(city: string): boolean {
  return city.length >= 2 && !/[,\d]/.test(city)
}

/** Five-digit ZIP ("04101-1234" → "04101"); null when it isn't one. */
export function parseZip(raw: string): string | null {
  return /^(\d{5})(-\d{4})?$/.exec(raw.trim())?.[1] ?? null
}

export function describeHours(hours: WorkingHours): string {
  return DAYS.filter((d) => hours[d]).map((d) => `${d.slice(0, 3)} ${hours[d]!.join(", ")}`).join(" · ")
}
