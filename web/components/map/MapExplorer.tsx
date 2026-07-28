"use client"

import { useEffect, useState } from "react"
import type { MapShop } from "@/lib/supabase/queries/shops"

interface MapExplorerProps {
  shops: MapShop[]
}

/* Leaflet touches `window` at import time, so the real map can only be loaded
   in the browser — same pattern as directory/MapView.tsx. */
export function MapExplorer({ shops }: MapExplorerProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<MapExplorerProps> | null>(null)

  useEffect(() => {
    import("./MapExplorerLeaflet").then((mod) => {
      setMapComponent(() => mod.MapExplorerLeaflet)
    })
  }, [])

  if (!MapComponent) {
    return (
      <div className="h-[60vh] md:h-[70vh] bg-[var(--color-cream)] border border-[var(--color-border)] rounded-lg flex items-center justify-center">
        <p className="text-sm text-[var(--color-charcoal-light)]">Loading the map…</p>
      </div>
    )
  }

  return <MapComponent shops={shops} />
}
