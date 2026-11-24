/**
 * Listings that were merged into another one or renamed (old slug → new slug).
 * Read by next.config.ts, so links and search results pointing at the old
 * address land on the right page instead of a 404.
 */
export const LISTING_REDIRECTS: Record<string, string> = {
  // 2026-11 cleanup: submissions approved although the shop was already listed.
  "golf-md-lenexa-ks-ad7dde": "golf-md-lenexa-ks",
  "arkansas-golf-center-conway-ar-7adab3": "arkansas-golf-center-conway-ar",
  "ultimate-fit-golf-minneapolis-mn": "ultimate-fit-golf-llc-columbia-heights-mn",
  "puetz-golf-seattle-superstore-seattle-wa-aef769": "puetz-golf-seattle-superstore-seattle-wa",
  "victory-golf-repair-seattle-wa": "allvictorygolf-kent-wa",
  // Wrong state: the shop is in Olean, New York.
  "rick-s-golf-world-olean-pa": "rick-s-golf-world-olean-ny",
}
