import type { Guide } from "@/lib/guides/types"
import { golfClubFittingGuide } from "@/lib/guides/golf-club-fitting"
import { golfClubFittingCostGuide } from "@/lib/guides/golf-club-fitting-cost"
import { isGolfClubFittingWorthItGuide } from "@/lib/guides/is-golf-club-fitting-worth-it"
import { golfClubFittingChartGuide } from "@/lib/guides/golf-club-fitting-chart"
import { whereToGetFittedGuide } from "@/lib/guides/where-to-get-fitted-for-golf-clubs"
import { stateOfClubFitting2026 } from "@/lib/guides/state-of-club-fitting-2026"
import { howToChooseAClubFitterGuide } from "@/lib/guides/how-to-choose-a-club-fitter"
import { clubChampionVsIndependentGuide } from "@/lib/guides/club-champion-vs-independent-fitter"
import { golfClubRepairCostGuide } from "@/lib/guides/golf-club-repair-cost"
import { whatToExpectAtAGolfClubFittingGuide } from "@/lib/guides/what-to-expect-at-a-golf-club-fitting"
import { onlineGolfClubFittingGuide } from "@/lib/guides/online-golf-club-fitting"
import { customGolfClubFittingGuide } from "@/lib/guides/custom-golf-club-fitting"
import { driverFittingGuide } from "@/lib/guides/driver-fitting"
import { ironFittingGuide } from "@/lib/guides/iron-fitting"
import { lessonsOrFittingFirstGuide } from "@/lib/guides/lessons-or-fitting-first"
import { clubFittingForBeginnersGuide } from "@/lib/guides/club-fitting-for-beginners"
import { shaftFittingGuide } from "@/lib/guides/shaft-fitting"
import { kickPointGuide } from "@/lib/guides/kick-point"
import { lieAngleGuide } from "@/lib/guides/lie-angle"
import { golfClubLoftGuide } from "@/lib/guides/golf-club-loft"
import { swingWeightGuide } from "@/lib/guides/swing-weight"
import { golfClubMoiGuide } from "@/lib/guides/golf-club-moi"
import { launchMonitorsGuide } from "@/lib/guides/launch-monitors"
import { golfGripSizeGuide } from "@/lib/guides/golf-grip-size"
import { golfShaftFlexGuide } from "@/lib/guides/golf-shaft-flex"

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
  howToChooseAClubFitterGuide,
  clubChampionVsIndependentGuide,
  golfClubRepairCostGuide,
  whatToExpectAtAGolfClubFittingGuide,
  onlineGolfClubFittingGuide,
  customGolfClubFittingGuide,
  driverFittingGuide,
  ironFittingGuide,
  // Question-form spokes (2026-07-30 — keyword-map backlog #11, #14). The
  // exact question shapes that trigger AI answers; honest non-salesy answers.
  lessonsOrFittingFirstGuide,
  clubFittingForBeginnersGuide,
  // Fitting Glossary cluster (competitor-derived, 2026-07-29 —
  // tasks/keyword-strategy-2026-07.md). shaft-fitting is the volume leader.
  shaftFittingGuide,
  lieAngleGuide,
  golfClubLoftGuide,
  swingWeightGuide,
  kickPointGuide,
  golfClubMoiGuide,
  launchMonitorsGuide,
  golfGripSizeGuide,
  // Shaft flex chart + what-flex-do-I-need guide (2026-08-03 — keyword-map #12)
  golfShaftFlexGuide,
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
