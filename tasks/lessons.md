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

## Env vars must be set in Vercel separately from local `.env.local`
- Symptom (2026-05-31): live site showed "No results found" on search and 500s on
  individual pages, while everything worked locally. Root cause: `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were in local `web/.env.local` but **never added to
  Vercel → Settings → Environment Variables**. `.env.local` is gitignored and never deployed.
- `NEXT_PUBLIC_*` vars are inlined at BUILD time → after adding them in Vercel you MUST
  redeploy (Deployments → ⋯ → Redeploy); just saving the var does nothing.
- Two failure-hiding patterns made this invisible and must be avoided:
  1. `process.env.X!` (non-null assertion) → passes `undefined` to the client silently.
     FIX: validate in one module (`web/lib/supabase/env.ts`) that throws → build fails LOUD.
  2. Bare `.catch(() => [])` / `catch {}` on data fetches → a DB/connection failure looks
     identical to "no data". FIX: route through `logQueryError()` (logs to Vercel) and show a
     real error state in the UI (distinct from empty results), never a silent swallow.
- Rule: a misconfigured deploy should FAIL THE BUILD, not ship a broken site; and every
  data-fetch failure must be logged + visibly surfaced, never silently turned into "empty".
