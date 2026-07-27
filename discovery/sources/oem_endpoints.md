# OEM locator probe notes

Probed 2026-07-23. Method: curl with a real browser UA first (cheapest); if
blocked, Firecrawl `scrape(url, formats=["html"])` to get past basic anti-bot
and inspect the rendered page for the locator widget's JS bundle / API
endpoint, then curl that endpoint directly. ~30 min budget per brand.

**Fix round 1 (2026-07-23)**: re-probed Titleist, Callaway, and TaylorMade
with `agent-browser` (real Chromium + live network-request inspection),
since the brief prescribed this for exactly the case where a static
curl/Firecrawl snapshot can't see client-side XHR/fetch calls. Findings
below are appended to each brand's original section; TITLEIST and
TAYLORMADE remain hard-blocked even under full browser automation (evidence
below), CALLAWAY's endpoint was found but is unusable without a full
browser (evidence below). MIZUNO was not re-probed — the brief's
instructions kept it skipped as a "genuine ASP.NET postback blocker,
already documented."

## PING — WORKING

- Locator page: `https://ping.com/en-us/fitting/find-a-fitter`
- The page embeds a third-party React widget
  (`map.locations.fittingmanagement.pingtechnology.digital`, an
  `<fittinglocationmap>` custom element). That widget's JS bundle
  (`static/js/main.*.js`) calls a public REST API — no auth/API key required
  in practice (the widget itself renders with `apikey=""`).
- **Endpoint**: `POST https://api.pingtechnology.digital/fittings/locations/v2/locations/search`
- **Headers**: `Content-Type: application/json`, `X-Region: global` (the
  widget defaults to `region="global"` when no `region` attribute is set on
  the custom element — confirmed this works standalone via curl).
- **Body**: `{"latitude": <float>, "longitude": <float>, "radius": <miles>, "unitType": "MI", "sortBy": "distance"}`
  — it's a radius search around a lat/lng, not a state search, so
  `oem_locators.py` seeds a per-state centroid and radius=500mi, then
  `parse_ping()` filters the response down to `state == state_code`.
- **Response shape**: `{"statusCode": 200, "statusMessage": "OK", "data": [ {...location...}, ... ]}`.
  Each location: `name`, `street`, `city`, `state`, `postalCode`, `phone`
  (often `null`), `latitude`/`longitude`, plus fitter badge flags. No
  `website` field — raw records get `website: ""`.
- Verified live: `POST` with TX centroid (31.9686, -99.9018), radius 500mi
  returned 241 raw hits across TX/OK/LA/NM/KS/AR; 156 filtered to `state ==
  "TX"`.
- Sample fixture: `discovery/tests/fixtures/ping_sample.json` (5 TX records +
  1 OK record, trimmed from the live TX response, used to test the
  state-filter behavior).

### Fix round 1: multi-point coverage + cap check (2026-07-23)

Single-centroid + 500mi radius is a coarse net — it can miss real shop
clusters near a large state's edges even though it "reaches" that far as
the crow flies, because a state's true extent from its geographic centroid
is uneven (e.g. TX's Rio Grande Valley and CA's far-north are both near the
edge of a single 500mi circle from center, while other directions have
huge slack). Replaced the single centroid with 2-3 query points per pilot
state (population centers chosen to spread coverage), each queried at
`PING_RADIUS_MI`, merged and deduped by `(name, address)`:

- **TX**: Dallas (32.7767, -96.7970), Houston (29.7604, -95.3698), El Paso
  (31.7619, -106.4850 — covers far-west TX)
- **CA**: Los Angeles (34.0522, -118.2437), San Francisco (37.7749,
  -122.4194), Redding (40.5865, -122.3917 — covers far-north CA)
- **FL**: Miami (25.7617, -80.1918), Jacksonville (30.3322, -81.6557)
- **AZ**: Phoenix (33.4484, -112.0740), Tucson (32.2226, -110.9747)
- **GA**: Atlanta (33.7490, -84.3880), Savannah (32.0809, -81.0912)

**Cap check.** At the brief's suggested starting radius of 300mi, the
Houston query point returned exactly 150 raw hits — a suspiciously round
number that the code now flags with a `WARNING:` print. Investigated by
varying radius at that same point (100mi → 47 hits, 300mi → 150, 500mi →
240, 800mi → 504): hit counts scale roughly linearly with radius rather
than saturating, so **150 was a coincidence, not a real API cap** — the
Ping API does not appear to hard-cap results at any of the radii tested.

However, that same 300mi-per-point pass, compared record-for-record
against the *old* single-centroid/500mi TX baseline, was missing 4 real
TX records: `GOLF HEADQUARTERS` (x2 locations), `AMARILLO COUNTRY CLUB
INC`, and `DICK'S SPORTING GOODS-MCALLEN`. Geodesic-distance check
explained why: Amarillo is ~334mi from the Dallas point and ~359mi from El
Paso (both outside a 300mi radius), and McAllen is ~301mi from Houston —
just past the 300mi cutoff. **`PING_RADIUS_MI` was bumped to 350mi** to
close both gaps with margin. Re-verified: at 350mi, the 3-point TX result
set is now byte-for-byte equal (154 unique `(name, address)` keys) to both
the old single-centroid/500mi baseline *and* a sanity-check single-point
800mi query — i.e. no records lost, full parity confirmed. For CA/FL,
whose actual query points are further apart than TX's (LA-to-Redding is a
much longer axis than Dallas-to-El Paso), the extra coverage margin from
2-3 targeted points is expected to matter more than it did for TX, where
the old center-of-state 500mi circle already happened to cover the whole
state.

**Live before/after TX record counts** (see task-5-report.md "Fix round 1"
for the full transcript):
- Before (single centroid, 500mi): 156 raw TX-filtered hits (154 unique
  after de-duping identical `(name, address)` pairs — the original run
  didn't dedupe within a single query, since there was only one query).
- After (3-point Dallas/Houston/El Paso, 350mi, deduped across points):
  **154 unique records** — full parity with the old baseline (0 missed, 0
  gained), confirmed against both the old baseline and an 800mi
  sanity-check query.

## TITLEIST — SKIPPED (heavy anti-bot)

- Locator page: `https://www.titleist.com/locator`
- Root domain (`www.titleist.com`) returns **403** to plain curl with a
  browser UA on every path tried (`/`, `/locator`, `/dealer-locator`,
  `/store-locator`) — Akamai-style bot management blocking non-browser
  clients outright.
- Firecrawl's rendered scrape of `/locator` succeeded (got HTML), but the
  cleaned HTML has no `<script>` tags and no visible locator widget markup
  (no iframe, no custom element, no embedded JSON) — the actual map/search
  component and its API calls happen client-side after page load in a way
  Firecrawl's snapshot doesn't capture. No JS bundle URL was recoverable
  from the static/rendered HTML within budget.
- Not pursued further (agent-browser network inspection would likely find
  it, but that's out of scope for this pass).

### Fix round 1: agent-browser network inspection (2026-07-23)

Re-probed with `agent-browser` (real Chromium, not curl/Firecrawl) per the
brief's explicit prescription for client-rendered locators. Result:
**still fully blocked, now with stronger evidence.**

- `agent-browser open https://www.titleist.com/locator` → **"Access
  Denied"** interstitial (Akamai edge block, `errors.edgesuite.net`
  reference ID), before any page JS runs.
- Tried the root domain too (`https://www.titleist.com/`) in case the
  locator path specifically was targeted — **also "Access Denied"**, same
  Akamai edge block. This confirms the block is at the Akamai edge layer
  against the automation fingerprint itself (headless-Chromium
  characteristics), not something a "load the real page first" workaround
  can route around.
- No network requests beyond the two blocked document loads were captured
  (verified via `agent-browser network requests`) — there was never a
  chance for the locator widget's JS to load, let alone fire its API call.
- **Conclusion: genuinely blocked**, not a static-snapshot limitation.
  Confirmed with a full real-browser session, not just curl/Firecrawl.

## CALLAWAY — SKIPPED (heavy anti-bot)

- Locator page: `https://www.callawaygolf.com/retail-locator`
- Direct curl to the root domain returns **429** (rate-limited) even on a
  single cold request with a browser UA.
- A secondary subdomain (`locator.callawaygolf.com/global/en-us/search/...`)
  redirects back into the main site and also hits 429.
- Firecrawl's rendered HTML for `/retail-locator` came back clean (Next.js
  app, `data-sentry-component="StoreLocator"`) but with all `<script>` tags
  stripped, so the client-side API call the widget makes is not visible in
  the snapshot. No `/api/*` path or JSON endpoint was found within budget.

### Fix round 1: agent-browser network inspection (2026-07-23)

Re-probed with `agent-browser`. This time the page loaded fully (no
Akamai/edge block for a real browser) and the locator was already
pre-populated with results for a default location, so a fresh search was
triggered from the UI (filled the "Enter Zip or City" box with `75201`,
clicked Search) and the network log was inspected.

**Endpoint found**: the widget is a Next.js App Router page that submits
searches via a **Next.js Server Action**, not a conventional REST/JSON
endpoint:
- `POST https://www.callawaygolf.com/retail-locator`
- Headers: `Accept: text/x-component`, `Content-Type:
  text/plain;charset=UTF-8`, and critically
  `Next-Action: 9003d33d7c3c866fe24df5583f64bff9f5fea08d` — a hash that
  identifies the specific server-action function for this build/deployment
  (tied to `x-deployment-id` in the response headers) and is expected to
  change on Callaway's next redeploy.
- Body: `[{"address":"75201","services":"0","country":"US","distanceKm":"40.2335"}]`
- Response: `text/x-component` — Next.js's RSC (React Server Component)
  streaming wire format, not plain JSON. It does embed real store JSON
  inline (`storesLocatorInfo` array, e.g. `{"AccountId":201682,"Name":
  "golftec - las colinas","Street1":"901 mcarthur park dr ste 130",
  "City":"irving","RegionCode":"TX","PostalCode":"75063","Phone":
  "972-294-7787", ...}`), but it's wrapped in the RSC line-delimited
  protocol (`0:[...]\n1:{...}`) rather than being directly `json.loads()`-able.
- **Confirmed working from inside the browser session**: replayed the
  exact same request via `agent-browser eval` (a same-origin `fetch()`
  call from the already-loaded page) and got a 200 with real TX store data
  back.
- **Confirmed NOT usable via plain HTTP (stdlib-only) from outside a
  browser**: replaying the identical request (same headers, same body)
  via plain `curl` with a browser `User-Agent` got **HTTP 429 — "Vercel
  Security Checkpoint"** (an interstitial challenge page, not the API
  response). This is Vercel's bot-management layer gating the endpoint
  behind a JS-executable browser-fingerprint check that a stdlib
  `urllib.request` call cannot pass, independent of any cookie — inspected
  the browser session's cookie jar (`agent-browser cookies get`) and found
  no bot-check-bypass cookie being carried; the pass/fail is decided by a
  live JS challenge, not a static token that could be lifted and replayed.
- **Conclusion: genuinely blocked for a stdlib-only harness.** A working
  JSON-ish endpoint now IS documented (unlike the original probe), but
  consuming it would require either (a) running a persistent headless
  browser per state/brand — a large increase in the project's runtime
  dependency footprint, explicitly out of scope for "stdlib only in
  committed code" — or (b) reverse-engineering Vercel's bot-check
  challenge, which is exactly the "don't fight it" anti-bot case the brief
  says to skip. Left SKIPPED, with this stronger evidence trail for a
  future task that's willing to add a browser-automation dependency.

## MIZUNO — SKIPPED (no reachable JSON API)

- Locator page: `https://usa.mizuno.com/store-locator/?region=Golf`
- Reachable directly via curl (200, no anti-bot), and it embeds a Bullseye
  Locations widget: `<iframe src="https://mizuno.bullseyelocations.com/pages/general-new">`.
- The Bullseye widget itself is classic ASP.NET WebForms (postback form to
  `/pages/general-new`, `WebResource.axd`/`ScriptResource.axd` assets, no
  visible REST/JSON endpoint). Bullseye Locations does have a documented
  REST API product, but it requires a client-specific API key that isn't
  exposed in this embed; reverse-engineering the ASP.NET postback
  (`__VIEWSTATE`/`__EVENTVALIDATION`) to scrape results was judged not worth
  the time for pilot scope.

## TAYLORMADE — SKIPPED (bot challenge)

- Locator page: `https://www.taylormadegolf.com/retailers/`
- Site runs on Salesforce Commerce Cloud (Demandware). The locator widget is
  Vue-based (`data-v-*` attributes) and its assets reference the standard
  SFCC store-locator bundle path
  (`.../TaylorMade/storelocator_images/...`), suggesting the usual
  `Stores-FindStores` controller.
- Confirmed: `GET /on/demandware.store/Sites-TMaG-Site/en_US/Stores-FindStores?...`
  redirects (302) to `/on/demandware.store/Sites-TMaG-Site/en_US/DDUser-Challenge?redirect=...`
  — a bot-management interstitial (Akamai/PerimeterX-style) gating the
  controller entirely. Not pursued further per "don't fight it" guidance.

### Fix round 1: agent-browser network inspection (2026-07-23)

Re-probed with `agent-browser`, loading `https://www.taylormadegolf.com/retailers/`
directly in a real Chromium session. **Still fully blocked, evidence
strengthened**: the page redirected straight to
`/on/demandware.store/Sites-TMaG-Site/en_US/DDUser-Challenge?redirect=...`
even for full browser automation (not just curl). Page body confirms it's
a **DataDome** CAPTCHA gate, not just a generic redirect: the challenge
payload references `host":"geo.captcha-delivery.com"` explicitly (visible
in the page's `dd={...}` config object). Waited 5s and re-checked the URL
and body in case of an auto-pass for a "clean" browser fingerprint — no
change, still on the DDUser-Challenge page. This is a real interactive
CAPTCHA product gating the store-finder controller entirely, upstream of
any locator API call being reachable at all.
- **Conclusion: genuinely blocked**, confirmed with a full real-browser
  session. Not pursued further per "don't fight it" guidance — this is
  exactly the hard-anti-bot case that guidance describes.

## Summary

| Brand | Status | Reason |
|---|---|---|
| Ping | Working | Public JSON search API, no auth; multi-point coverage as of Fix round 1 |
| Titleist | Skipped | Akamai "Access Denied" edge block on all direct requests **and** full agent-browser sessions (confirmed Fix round 1) |
| Callaway | Skipped | Next.js Server Action endpoint found (Fix round 1) but gated behind a Vercel Security Checkpoint JS challenge that stdlib HTTP can't pass |
| Mizuno | Skipped | Bullseye widget is ASP.NET postback-only, no public JSON endpoint (not re-probed — kept skipped per task scope) |
| TaylorMade | Skipped | SFCC DataDome CAPTCHA (`DDUser-Challenge`, `geo.captcha-delivery.com`) blocks the store-finder controller even under full browser automation (confirmed Fix round 1) |

1 of 5 brands working. Fix round 1 (2026-07-23) re-probed Titleist,
Callaway, and TaylorMade with agent-browser (real Chromium + live network
inspection) as prescribed by the brief for client-rendered locators.
Titleist and TaylorMade remain hard-blocked with stronger evidence now on
record (both block full browser automation, not just curl). Callaway's
endpoint was found and documented in detail but is unusable without
carrying a persistent browser dependency to solve a live bot-check
challenge — out of scope for a stdlib-only harness. Mizuno was left as-is
per the task's instruction to keep it skipped. Pilot proceeds with Ping,
now with multi-point-per-state query coverage instead of a single
centroid.
