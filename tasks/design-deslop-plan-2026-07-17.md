# Design De-Slop Plan — 2026-07-17

Based on two audits (code audit of `/web` + visual audit of live clubfittingdirectory.com, desktop 1440px and mobile 390px screenshots).

## Verdict

The site is already well above the "AI slop" line. The token layer (Sentient serif + Hanken body + mono "data" numerals, forest/ivory/gold palette, grain + contour hero atmosphere, generative covers) and the homepage are genuinely distinctive. The remaining slop is **compositional and concentrated on inner pages**: one repeated section-header formula, one card recipe reused everywhere, About/Contact stuck in the generic era, and some filler copy. Plus one real rendering bug.

## Do-not-touch list (already distinctive)

- Homepage hero: search-command-panel + "The Index" almanac card + EST. 2025 stamp + hand-drawn underline
- Sentient/Hanken/mono three-voice type system; `.data` yardage-book numerals
- Hero atmosphere (contour lines + grain), forest-tinted shadows
- Generative photoless card covers (`lib/cover.ts`)
- Ranked "Top N … for 2026" tables on state/city pages
- Guide article layout (callout boxes, at-a-glance tables) — best editorial page on site
- Squared cartographic tier tags, empty-state contour SVG, green sidebar contact card on listings

---

## Phase 1 — Bug + quick wins ✅ DONE 2026-07-17

- [x] **"More Fitters" blank section = FALSE ALARM.** Verified live with Playwright: cards are in the HTML and reveal correctly on real scroll (opacity 1). The audit's full-page screenshot never scrolls, so the IntersectionObserver scroll-reveal never fired — screenshot artifact, not a user-facing bug. Hardening added: `@media print` rule in `globals.css` forces reveal-hidden content visible in print/capture contexts.
- [x] **Pluralization fixed.** New `shopTypeCountPhrase()` in `lib/shop-types.ts` uses the taxonomy's singular/plural labels; state + city subtitles now say "1 pro shop / 3 club fitters" instead of naive `+ "s"` artifacts.
- [x] **Accent bars unified.** All five forest→gold `bg-gradient-to-r` strips (booking modal + both forms) replaced with a solid forest bar. Cover-palette gradients remain card/profile-only.
- [x] **Directory hero — deliberate skip.** On inspection it already uses the shared primitives (`hero-surface grain`, `hero-contours`, `section-label`, `.display`) as a compact search-toolbar variant; forcing `PageHeader` would add the tall py-16 header to a utility page. Left as-is.

Verified: `tsc --noEmit` clean, full `npm run build` green (all state/city pages prerendered).

## Phase 2 + 3 — ✅ DONE 2026-07-19

Built: `components/ui/IndexHead.tsx` (number-led section head — mono gold figure replaces the eyebrow) and `components/directory/LedgerList.tsx` (the yardage-book row list: mono rank, serif name, tier tag, city, type, rating). State/city/category/repair listing sections now use the ledger when >9 shops, cards otherwise (`showCity={false}` on city pages). Section heads read "53 fitters in Texas, all on record." Eyebrows removed from SectionHeader uses on collection pages, FaqSection ("FAQ"), TopFittersTable ("Updated …"), RelatedGuides ("Before you book" — folded into the title), listing nearby ("Also in this area"), guide related ("Keep reading"). Category/repair PageHeader eyebrows upgraded from "Category"/"Service" to the standard "Club Fitting Directory · Updated {date}". About/Contact eyebrows left for Phase 4. Verified with Playwright screenshots (desktop + 390px): TX page 8.3k→7.4k px desktop, 18k→10.7k mobile; 0-rating rows show "—". tsc + full build green.

## Phase 2 (original notes) — Kill the eyebrow formula on inner pages

`SectionHeader` (eyebrow → h2 → subtitle) appears 25×; gold-caps eyebrow is the site's biggest repeated AI tell. Homepage already abandoned it (number-led section heads) — inner pages feel a generation behind.

- [ ] Redesign section heads on state/city/category/repair using the homepage vocabulary: data-led heads (count in mono as the eyebrow's replacement), inline rule + label, or plain strong h2s. Keep at most ONE gold eyebrow per page (the PageHeader), not per section.
- [ ] Worst offender: `/state/[state_code]` stacks three SectionHeaders (lines 153, 175, 188). Give each section a distinct head treatment.
- [ ] Retire generic eyebrow strings: "Category", "Service", "Explore More", "Get Started", "How We Can Help".

## Phase 3 — Break card-grid monotony on collection pages

Directory, state, city, homepage all resolve to the identical 3-col ListingCard river. Texas page = 8,300px of near-identical cards (≈18,000px mobile).

- [ ] **Add a second listing display mode: the "ledger" row.** A compact table-like row (mono rank/number, serif name, city, tier tag, rating in `.data`) matching the almanac/yardage-book identity. Use it for the long "All Fitters" tail on state/city pages; keep cards for the top featured handful. Cuts page length massively and gives the site a signature list style no template has.
- [ ] Homepage keeps cards (short section, fine).
- [ ] Directory keeps cards (search-results grid is appropriately conventional) — no change.
- [ ] Optional: one editorial interlude (cream grain "moment") mid-scroll on very long state pages.

## Phase 4 — ✅ DONE 2026-07-19 (PR #39, deployed)

About rebuilt: hero "A directory kept by hand"; asymmetric editorial — manifesto prose (specific: no national list existed, 500+ stale entries culled, prices recorded not guessed) + the live "Index" almanac panel with real DB counts (getHomepageStats, 30-day ISR). Founder note kept for Person schema. Quiet closing CTA row. Contact rebuilt: plain divided reason rows, forest email card ("One inbox, read daily.") as the single bold element. IconCircle now used only by /newsletter. Gotcha hit: local `.next` fetch-cache served pre-cut stats (1,245); cleared cache → 727. Deployed manually via `vercel --prod` (git integration still not auto-deploying — owner should check Vercel Git settings). Noticed: footer column headings near-invisible on dark green — fix in Phase 5.

## Phase 4 (original notes) — About + Contact redesign

Most generic pages on the site: centered hero + 3 IconCircle feature cards ("Nationwide Coverage / Curated & Verified / Built for Golfers") is the textbook slop layout (`about:44-70`, `contact:70-106`).

- [ ] Rebuild About as an editorial page in the guide-article voice: asymmetric layout, real numbers from the DB (727 active listings, 50 states, verified counts) set in the almanac style, short manifesto copy. Drop IconCircle trio.
- [ ] Contact: single-column editorial form page; drop the vertical feature trio.
- [ ] `IconCircle` likely deletable after this.

## Phase 5 — ✅ DONE 2026-07-19 (PR #40, deployed)

Hero → "Golf's best fitters, on record." (OG image + header tagline "Every Fitter, On Record" match). Footer heading bug fixed (unlayered global h1–h6 charcoal rule beat the gold utility — trailing `!`; computed color verified). Newsletter band copy now context-matched (listing / guides / default). Guides hub subtitle + closing band, category/repair CTA framing, footer blurb + tagline de-cliched. Kept: "6,500 members read it. Free.", repair prices, methodology notes.

## Phase 6 — ✅ effectively complete: the ledger + "on record" language + Index panel on About form the signature motif across home/collection/about pages.

## Phase 5 (original notes) — Copy pass

- [ ] Replace filler: hero "Find your perfect fit." (archetypal directory cliché — beautifully set, still a cliché), footer "Curated with care." / "Independent fitters. Honest listings.", About "The right fit changes the game.", guides hub subtitle, "Ready to get fitted?" CTA.
- [ ] Vary the newsletter band. Same dark-green band + same copy closes nearly every page — reads as boilerplate. Write 2–3 context-specific variants (listing page vs guides vs state pages) or drop it on some page types.
- [ ] Keep the good specific copy: "6,500 members read it. Free.", repair price ranges, methodology footnotes.

## Phase 6 — Signature motif (open item from prior de-slop)

- [ ] The one still-open item from the July de-slop: a signature motif carried across pages. Strongest candidate already exists — the yardage-book/almanac language (mono data, ledger rows, contour lines). Formalize it: the ledger list (Phase 3) + "The Index" framing extended to state pages ("The Texas Index — 89 fitters logged") would complete it.

---

## Order + effort

1. Phase 1 — small fixes, one bug hunt. Ship first.
2. Phase 2 + 3 together — same files (state/city/category pages). Biggest visual payoff.
3. Phase 4 — self-contained.
4. Phase 5 — text-only, low risk.
5. Phase 6 — falls out of 2+3 mostly free.

Verify each phase with screenshots (desktop + 390px mobile) before moving on. Watch known gotchas: unlayered globals.css overrides Tailwind text utilities (trailing `!`), Sentient max weight 700, ivory ≠ white, kill zombie dev servers before curl checks.
