"use client"

import { useEffect, useState } from "react"

export interface ListingMapProps {
  latitude: number
  longitude: number
  name: string
}

export function ListingMap(props: ListingMapProps) {
  const [Impl, setImpl] = useState<React.ComponentType<ListingMapProps> | null>(null)

  useEffect(() => {
    import("./ListingMapLeaflet").then((mod) => {
      setImpl(() => mod.ListingMapLeaflet)
    })
  }, [])

  if (!Impl) {
    return (
      <div className="h-[340px] bg-[var(--color-cream)] border border-[var(--color-border)] rounded-lg flex items-center justify-center">
        <p className="text-sm text-[var(--color-charcoal-light)]">Loading map...</p>
      </div>
    )
  }

  return <Impl {...props} />
}
