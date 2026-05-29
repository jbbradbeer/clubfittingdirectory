"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { ListingMapProps } from "./ListingMap"

/* Custom forest-green marker icon (matches directory map) */
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

export function ListingMapLeaflet({ latitude, longitude, name }: ListingMapProps) {
  return (
    <div className="h-[340px] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={forestIcon}>
          <Popup>
            <span className="text-sm font-semibold text-[var(--color-forest)]">{name}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
