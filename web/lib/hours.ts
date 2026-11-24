/* Scraped hours often cover a single day (638 of 965 listings in Nov 2026, all
   from one Wednesday scrape). Publishing that — on the page or in structured
   data — reads as "open one day a week", so hours only show when the week is
   substantially known. An explicit "Closed" counts as a known day. */
const DAYS = new Set(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
const MIN_KNOWN_DAYS = 5

export function hasReliableHours(hours: Record<string, unknown> | null | undefined): boolean {
  if (!hours) return false
  const known = new Set(
    Object.entries(hours)
      .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== ""))
      .map(([day]) => day.trim().toLowerCase())
      .filter((day) => DAYS.has(day)),
  )
  return known.size >= MIN_KNOWN_DAYS
}
