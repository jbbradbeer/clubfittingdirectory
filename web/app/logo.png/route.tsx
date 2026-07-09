import { ImageResponse } from "next/og"

/* /logo.png — the Organization logo referenced by JSON-LD structured data.
   The favicon at app/icon.tsx is only 64px; Google requires a logo of at
   least 112x112px, so this serves the same "CF" monogram at 512px on a
   stable, extension-suffixed URL. Generated so there's no committed binary. */

export const dynamic = "force-static"

const SIZE = 512

export async function GET(): Promise<ImageResponse> {
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
          fontSize: "272px",
          fontWeight: 800,
          fontFamily: "sans-serif",
          borderRadius: "96px",
        }}
      >
        CF
      </div>
    ),
    { width: SIZE, height: SIZE },
  )
}
