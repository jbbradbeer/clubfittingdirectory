"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import Link from "next/link"
import type { Shop } from "@/types/shop"

/* Custom forest-green marker icon */
const forestIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#1a3c2a"/>
      <circle cx="12.5" cy="12.5" r="5" fill="#c9a96e"/>
    </svg>`,
  )}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -35],
})

interface MapViewLeafletProps {
  shops: Shop[]
}

export function MapViewLeaflet({ shops }: MapViewLeafletProps) {
  const validShops = shops.filter((s) => s.latitude && s.longitude)

  const center: [number, number] = validShops.length > 0
    ? [validShops[0].latitude!, validShops[0].longitude!]
    : [39.8, -98.5] // center of US

  return (
    <div className="h-[500px] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={validShops.length === 1 ? 12 : 4}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validShops.map((shop) => (
          <Marker
            key={shop.slug}
            position={[shop.latitude!, shop.longitude!]}
            icon={forestIcon}
          >
            <Popup>
              <div className="text-sm">
                <Link
                  href={`/listing/${shop.slug}`}
                  className="font-semibold text-[var(--color-forest)] hover:underline"
                >
                  {shop.name}
                </Link>
                <p className="text-[var(--color-charcoal-light)] text-xs mt-0.5">
                  {shop.city}, {shop.state_code}
                </p>
                {shop.rating && (
                  <p className="text-xs mt-1">
                    <span className="text-[var(--color-gold)]">★</span> {shop.rating.toFixed(1)}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
