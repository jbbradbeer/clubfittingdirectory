/* ─────────────────────────────────────────────────────────
   Pure slug helpers — no database or framework imports, so
   they can be used (and unit-tested) anywhere.
   ───────────────────────────────────────────────────────── */

/** Converts a city name + state code into a URL-safe slug.
 *  e.g. "San Francisco", "CA" → "san-francisco-ca"
 *       "St. Louis", "MO"    → "st-louis-mo"
 */
export function toCitySlug(city: string, stateCode: string): string {
  const cityPart = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${cityPart}-${stateCode.toLowerCase()}`
}
