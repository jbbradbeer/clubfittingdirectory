"use client"

import { useEffect, useState } from "react"
import type { Shop } from "@/types/shop"

interface MapViewProps {
  shops: Shop[]
}

export function MapView({ shops }: MapViewProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<MapViewProps> | null>(null)

  useEffect(() => {
    import("./MapViewLeaflet").then((mod) => {
      setMapComponent(() => mod.MapViewLeaflet)
    })
  }, [])

  if (!MapComponent) {
    return (
      <div className="h-[500px] bg-[var(--color-cream)] border border-[var(--color-border)] rounded-lg flex items-center justify-center">
        <p className="text-sm text-[var(--color-charcoal-light)]">Loading map...</p>
      </div>
    )
  }

  return <MapComponent shops={shops} />
}
