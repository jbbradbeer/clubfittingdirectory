/**
 * Generative shop covers — "The Course Almanac".
 *
 * The directory has no shop photos (the DB stores only `has_photos`/`photos_count`
 * flags), so every listing cover is drawn from data we DO have. `getCover` maps a
 * shop's slug + type to a deterministic palette + cartographic motif, so a wall of
 * cards reads varied yet unmistakably one brand — and the SAME shop always renders
 * the SAME cover (a pure function of the slug), which keeps server output stable for
 * ISR. No randomness, no Date, no side effects.
 */

export type CoverMotif = "contour" | "grid" | "arcs" | "flag" | "swing" | "rings"

export interface Cover {
  /** 1–5 → the --cover-N-* palette in globals.css */
  paletteIndex: number
  /** which cartographic motif to draw (keyed to shop type) */
  motif: CoverMotif
  /** 0–999, varies motif placement so same-type cards still differ */
  seed: number
  /** small rotation in degrees (−12…11) for organic variety */
  rotate: number
}

/** Motif carries meaning: each shop type gets its own cartographic mark. */
const MOTIF_BY_TYPE: Record<string, CoverMotif> = {
  Clubfitter: "contour", // topographic rings — fitting precision
  Retailer: "grid", // shelved / fairway grid
  Simulator: "arcs", // ball-flight arcs
  "Golf Course / Pro Shop": "flag", // flagstick on a green
  Instruction: "swing", // swing-path motion lines
  "Driving Range": "rings", // concentric range targets
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
  return {
    paletteIndex: (h % 5) + 1,
    motif: MOTIF_BY_TYPE[shopType ?? ""] ?? "contour",
    seed: h % 1000,
    rotate: ((h >> 5) % 24) - 12,
  }
}
