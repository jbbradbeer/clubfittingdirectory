import type { Guide } from "@/lib/guides/types"
import { golfClubFittingGuide } from "@/lib/guides/golf-club-fitting"
import { golfClubFittingCostGuide } from "@/lib/guides/golf-club-fitting-cost"
import { isGolfClubFittingWorthItGuide } from "@/lib/guides/is-golf-club-fitting-worth-it"
import { golfClubFittingChartGuide } from "@/lib/guides/golf-club-fitting-chart"
import { whereToGetFittedGuide } from "@/lib/guides/where-to-get-fitted-for-golf-clubs"
import { stateOfClubFitting2026 } from "@/lib/guides/state-of-club-fitting-2026"

/* ─────────────────────────────────────────────────────────
   GUIDE REGISTRY — the single source of truth for the Content
   Hub. The hub index, the [slug] route, and the sitemap all
   read from here, so adding an article is a one-line change:
   write the content file, then add it to this array.

   Order matters: the pillar should come first, then spokes in
   priority order (it controls the order shown on /guides).
   ───────────────────────────────────────────────────────── */
export const GUIDES: Guide[] = [
  golfClubFittingGuide,
  golfClubFittingCostGuide,
  isGolfClubFittingWorthItGuide,
  golfClubFittingChartGuide,
  whereToGetFittedGuide,
  stateOfClubFitting2026,
]

export function getAllGuides(): Guide[] {
  return GUIDES
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

export function getAllGuideSlugs(): { slug: string }[] {
  return GUIDES.map((g) => ({ slug: g.slug }))
}
