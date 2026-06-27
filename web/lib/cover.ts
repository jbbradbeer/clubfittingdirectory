/**
 * Generative shop palette — deterministic accent color per shop.
 *
 * The directory has no shop photos, so each listing gets a brand palette derived
 * from its slug: `getCover` maps a shop to one of the 5 `--cover-N-*` palettes in
 * globals.css, used for the thin accent line on ListingCard and the strip atop the
 * listing-profile hero. Pure function of the slug — the SAME shop always resolves
 * to the SAME palette, which keeps server output stable for ISR. No randomness,
 * no Date, no side effects.
 */

export interface Cover {
  /** 1–5 → the --cover-N-* palette in globals.css */
  paletteIndex: number
}

/** FNV-1a — tiny, stable, well-distributed string hash. */
function hash(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function getCover(slug: string | null | undefined, shopType?: string | null): Cover {
  const h = hash(slug || shopType || "shop")
  return { paletteIndex: (h % 5) + 1 }
}
