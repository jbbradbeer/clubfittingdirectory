# Homepage Refresh — shadcn UI rebuild (Phase: Homepage)

**Goal:** Refresh the homepage. Keep the forest/gold editorial brand + Bricolage/Hanken
fonts, but meaningfully elevate the visuals and add a richer interaction. Build on the
shadcn foundation already in place (cn(), cva, tokens).

## Plan

- [ ] 1. Add `searchShops(q, limit)` query — lightweight, returns name/city/state/slug/type/rating
- [ ] 2. Add `/api/search` route handler — JSON suggestions for type-ahead
- [ ] 3. Build `HeroSearch` client component — accessible search-as-you-type (debounced),
      keyboard nav, brand-styled popover; Enter → /directory?q=, select → /listing/[slug]
- [ ] 4. Add hero atmosphere CSS utilities to globals.css (soft aura gradient, contour lines, grain)
- [ ] 5. Rewrite homepage HERO section — atmospheric bg, refined display type, HeroSearch, stat band
- [ ] 6. Refine section rhythm/polish across the rest of the homepage (labels, dividers, hover)
- [ ] 7. Verify: dev server compiles, homepage renders 200, manual visual check, lint

## Phase: Carry design language to all pages

- [ ] A. Build shared `PageHeader` component (atmospheric inner-page hero: gold-rule eyebrow,
      display title, subtitle, breadcrumb, optional actions slot) — the consistency anchor
- [ ] B. about → PageHeader + refine pillar/CTA cards to rounded-2xl shadow-card
- [ ] C. contact → PageHeader + refine cards
- [ ] D. states → PageHeader (centered) + refine state cards
- [ ] E. state/[state_code] → PageHeader + refine chips
- [ ] F. category/[type] → PageHeader + refine
- [ ] G. city/[citySlug] → PageHeader + refine
- [ ] H. listing/[slug] → atmospheric hero + gold eyebrow + align cards to brand
- [ ] I. directory → atmospheric header strip + align control styling
- [ ] J. Footer → subtle texture for cohesion (light touch)
- [ ] K. Verify all routes 200, lint clean

## Review

**Homepage (done):** atmospheric hero (forest/gold aura + course contours + grain),
display headline with hand-drawn gold underline, staggered fade-in, live type-ahead
search (`HeroSearch` → `/api/search` → `searchShops`), "Popular" quick links.

**Site-wide rollout (done):** built shared `components/layout/PageHeader.tsx` — the
atmospheric hero used by about, contact, states (centered), state, category, city.
Listing + directory got matching custom atmospheric headers (gold-rule eyebrow,
display title). Cards aligned to brand (rounded-2xl + shadow-card). SearchBar +
directory controls → pill shape. Footer got subtle grain.

**New CSS utilities** (globals.css): `.hero-surface`, `.hero-contours`, `.grain`,
`.gold-rule`. Note: `.hero-surface` intentionally has NO overflow:hidden so the
hero search dropdown isn't clipped; contours self-contain via `.hero-contours`
(inset:0 + overflow:hidden) and the fade mask.

**Verified:** `tsc --noEmit` clean; all route types return 200 (home, directory,
directory?q=, states, state/tx, category, city, about, contact, listing). Live
search returns real Supabase data.

**Not done / next candidates:** migrate remaining ui primitives (Badge, Card,
Breadcrumb, RatingStars, SectionHeader) to cva/shadcn pattern; not-found/error/loading
pages; optionally add type-ahead to the header search too.
