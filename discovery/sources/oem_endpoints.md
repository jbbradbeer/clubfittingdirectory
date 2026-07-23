# OEM locator probe notes

Probed 2026-07-23. Method: curl with a real browser UA first (cheapest); if
blocked, Firecrawl `scrape(url, formats=["html"])` to get past basic anti-bot
and inspect the rendered page for the locator widget's JS bundle / API
endpoint, then curl that endpoint directly. ~30 min budget per brand.

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

## Summary

| Brand | Status | Reason |
|---|---|---|
| Ping | Working | Public JSON search API, no auth |
| Titleist | Skipped | 403 on all direct requests; no visible API in rendered HTML |
| Callaway | Skipped | 429 rate-limited; scripts stripped from rendered HTML |
| Mizuno | Skipped | Bullseye widget is ASP.NET postback-only, no public JSON endpoint |
| TaylorMade | Skipped | SFCC bot-challenge (`DDUser-Challenge`) on the store-finder controller |

1 of 5 brands working. Pilot proceeds with Ping; re-probing the skipped
brands (ideally with agent-browser network inspection to catch client-side
XHR calls Firecrawl's snapshot misses) is a good follow-up task if OEM
coverage needs to grow.
