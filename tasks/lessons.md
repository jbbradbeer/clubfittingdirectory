# Lessons

## Blank maps = CSP img-src vs tile provider mismatch (2026-06-28)
- Leaflet maps (ListingMapLeaflet, MapViewLeaflet) load tiles from CARTO
  `https://{s}.basemaps.cartocdn.com/light_all/...` (Positron light), NOT OpenStreetMap.
- The CSP in `web/vercel.json` `img-src` only allowed `*.tile.openstreetmap.org`, so the browser
  silently blocked every tile → maps rendered as a blank frame (no console error visible to user).
- Fix: add `https://*.basemaps.cartocdn.com` to `img-src`. RULE: whenever a tile/style/font/script
  source changes, update the CSP allowlist in the SAME change. When debugging "blank/missing
  external content," check the live CSP header (`curl -sI <url> | grep -i content-security-policy`)
  against the actual resource URLs before anything else.

## The unlayered-CSS gotcha hides as a contrast/visibility bug (2026-06-27)
- globals.css has UNLAYERED rules `h1..h6 { color: charcoal }` and `a { color: inherit }`.
  In Tailwind v4 utilities live in `@layer`, and unlayered CSS beats ALL layered rules
  regardless of specificity. So `<h2 class="text-white">` on a dark section silently
  renders CHARCOAL (dark-on-dark, ~1.4:1) and `<a class="text-forest-deep">` button text
  on a forest card inherits WHITE → white-on-gold fails contrast.
- An a11y/axe pass surfaced 5 invisible dark-section headings (footer brand, Email Us,
  newsletter, footer band, guides CTA) + 2 button-text fails this way.
- Rule: ANY color/weight utility on an `h1..h6` or a bare `<a>` needs the trailing `!`
  (e.g. `text-white!`, `text-[var(--color-forest-deep)]!`). When adding white headings or
  colored button-anchors on dark/gold backgrounds, add `!` immediately — don't wait for axe.
  Verify with `getComputedStyle(el).color`, not just the screenshot (grain overlays can make
  axe report "incomplete" instead of "violation", so a clean axe run ≠ correct color).

## "States covered" stat counts DC as a 51st state (2026-06-26)
- The homepage Index / any `Object.keys(stateMap).length` over `shops.state_code`
  returns **51**, because the data includes `state_code = "DC"` (Washington, DC has
  shops) on top of all 50 states. DC is browsable but is NOT a state.
- Fix in `getHomepageStats` (`web/lib/supabase/queries/shops.ts`): the headline
  `states` count excludes DC (`.filter(code => code !== "DC")`) → reads 50 and
  matches the "across all 50 states" copy; the `states` LIST still includes DC so
  it stays browsable.
- Rule: when turning a distinct-`state_code` count into a user-facing "states"
  number, exclude `DC` (and any territory codes) — region count ≠ state count.

## Design taste: this site is already good — elevate, don't slop-rescue; founder prefers minimal cards (2026-06-26)
- Front-end overhaul ("Course Almanac" direction): kept the forest+gold editorial
  DNA, added a mono "yardage-book" font (`--font-mono` Spline Sans Mono, `.data`
  helper) for all numbers, scroll reveals (`lib/useReveal.ts` + `[data-reveal]`),
  forest-tinted shadows, and an editorial asymmetric homepage hero with a "The Index"
  stat panel.
- Built a generative shop-cover system (`lib/cover.ts` + `ShopCover.tsx`) — deterministic
  palette+motif per slug — but the founder did NOT like big cover images stacked above
  every card ("a wall of dark blocks"). They chose **fully minimal text-forward cards**:
  just a thin palette accent line at the card top, no image, no monogram chip.
  `ShopCover`/`getCover` are retained (palette feeds the accent line + the listing-page
  top strip), but the big cover is not used on cards.
- Rule: when a redesign decision is visual taste, SHOW a real screenshot comparison and
  let the founder pick before rolling it site-wide. Default toward minimal/restraint here.

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

## ISR write-cost reduction (2026-06-23)

- **Next route-segment config must be a STATIC LITERAL.** `export const revalidate = SOME_IMPORTED_CONST`
  fails the build with "Invalid segment configuration export detected." Inline the literal number
  (e.g. `export const revalidate = 2592000 // 30 days`) — do NOT factor it into a shared constant.
- **Non-deterministic DB ordering = silent ISR write amplifier.** Any `.order()` chain without a
  final unique tiebreaker (`.order("id")`) lets Postgres return tied rows in a different order each
  run → the rendered HTML changes → Vercel bills an ISR write on every regeneration even when data
  is unchanged. ALWAYS end list queries with a stable tiebreaker.
- **`new Date()` in server-rendered output** (e.g. sitemap `lastModified`) re-stamps bytes on every
  regeneration → needless writes. Anchor to a data value (max `updated_at`) or a fixed constant.
- **Never `git add -A` in this repo.** It sweeps in `.claude/worktrees/` (embedded git repos) and
  stray downloads in the root. Stage explicit paths instead.
