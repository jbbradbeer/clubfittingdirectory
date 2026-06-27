import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/lib/constants"

/* Shared Open Graph image dimensions (the standard 1.91:1 social card). */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

/* Brand palette (mirrors globals.css). next/og can't read CSS vars, so the
   hex values live here directly. */
const FOREST = "#18402e"
const FOREST_DEEP = "#0c2017"
const GOLD = "#c2a05a"
const CREAM = "#f6f5f1"
const SITE_DOMAIN = "clubfittingdirectory.com"

/**
 * Renders a branded social-share card. Used by every opengraph-image route so
 * shared links (homepage, listings, states, categories, cities) all get a
 * consistent, on-brand preview instead of a blank/broken image.
 *
 * `eyebrow` is the small gold label (e.g. "Club Fitter • Austin, TX"); `title`
 * is the large headline (e.g. the shop or place name).
 */
export function renderOgImage(title: string, eyebrow?: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: `linear-gradient(135deg, ${FOREST} 0%, ${FOREST_DEEP} 100%)`,
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Course-contour motif — the brand signature, echoing the cards.
            Concentric rings springing off the top-right corner. */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {[70, 150, 230, 310, 390, 470, 550].map((r) => (
            <circle
              key={r}
              cx="1180"
              cy="70"
              r={r}
              fill="none"
              stroke={GOLD}
              strokeWidth="2"
              opacity="0.12"
            />
          ))}
        </svg>

        {/* Top: site name with a gold rule */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "56px", height: "4px", background: GOLD }} />
          <div
            style={{
              fontSize: "30px",
              fontWeight: 700,
              color: GOLD,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        {/* Middle: eyebrow + headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {eyebrow ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                fontSize: "26px",
                fontWeight: 600,
                color: GOLD,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: `2px solid rgba(194,160,90,0.5)`,
                borderRadius: "6px",
                padding: "8px 18px",
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontSize: "84px",
              fontWeight: 800,
              color: CREAM,
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: hairline + tagline + domain */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ width: "100%", height: "1px", background: "rgba(246,245,241,0.15)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "26px", color: "rgba(246,245,241,0.7)" }}>
              Independent golf club fitters across the US
            </div>
            <div style={{ fontSize: "24px", color: GOLD, letterSpacing: "0.04em" }}>
              {SITE_DOMAIN}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
