import { ImageResponse } from "next/og"

/* Favicon / browser-tab icon — a gold "CF" monogram on forest green.
   Generated so there's no need for a committed binary asset. Also used as the
   Organization logo reference. */
export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18402e",
          color: "#c2a05a",
          fontSize: "34px",
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: "12px",
        }}
      >
        CF
      </div>
    ),
    { ...size },
  )
}
