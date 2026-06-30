"use client"

import { useEffect } from "react"
import { log } from "@/lib/logger"

/**
 * Last-resort error boundary. Next.js renders this ONLY when the root layout
 * itself throws — the one failure `app/error.tsx` cannot catch. Because it
 * replaces the entire document (the layout, and therefore globals.css + fonts,
 * are not loaded), styles are inlined here on purpose. Keep it dependency-light.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    log.error("global-error", "root layout crashed", { error, digest: error.digest })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F4F1EA",
          color: "#1A1A1A",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 12, color: "#1B4332", margin: 0 }}>
            Error
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 600, margin: "0.75rem 0 0" }}>Something went wrong</h1>
          <p style={{ color: "#555", marginTop: "1rem", lineHeight: 1.5 }}>
            The page failed to load. This is likely temporary — please try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              backgroundColor: "#1B4332",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.7rem 1.4rem",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
