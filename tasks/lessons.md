# Lessons

## Data shape: `shops.working_hours` values are NOT always strings
- A day's value is usually `"9 AM–5 PM"` but can be an **array** for split hours,
  e.g. `{"Wednesday": ["11AM-7PM"]}`. ~5+ active shops use the array form.
- This crashed individual shop pages with `range.toLowerCase is not a function`
  (server-side) in `web/lib/structured-data.ts` → `parseOpeningHours`.
- Fix: type is now `Record<string, string | string[]> | null`; both
  `parseOpeningHours` (structured-data) and the listing hours display coerce
  arrays and guard `typeof === "string"` before string methods.
- Rule: when reading scraped/Outscraper JSON columns, never assume a value's
  type from the column name — guard before calling string/array methods.
