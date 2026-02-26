"use client"

/**
 * MapView — Leaflet map showing shop pins for the directory.
 *
 * IMPORTANT: This component MUST be loaded with dynamic import + { ssr: false }
 * because Leaflet requires the browser's `window` object.
 *
 * Usage in DirectoryClient:
 *   const MapView = dynamic(() => import('./MapView'), { ssr: false })
 */

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import Link from "next/link"
import type { Shop } from "@/types/shop"
import type { NearMeShop } from "@/lib/supabase/queries/listings"
import "leaflet/dist/leaflet.css"

/* ─── Custom pin icon using divIcon (avoids Next.js asset URL issues) ─── */
function makeShopIcon(isFeatured = false, isHighlighted = false) {
  const bg    = isHighlighted ? "#C9A84C" : isFeatured ? "#163828" : "#1B4332"
  const size  = isHighlighted ? 18 : 14
  const border = isHighlighted ? 3 : 2

  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${bg};
      border:${border}px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
      cursor:pointer;
    "></div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  })
}

/* ─── Recentre the map when userLocation changes ─── */
function MapController({
  userLocation,
  shops,
}: {
  userLocation: [number, number] | null
  shops: Shop[]
}) {
  const map = useMap()

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 11, { animate: true })
      return
    }
    // Fit to all visible pins
    const points = shops
      .filter((s) => s.latitude && s.longitude)
      .map((s) => [s.latitude!, s.longitude!] as [number, number])

    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, shops.length])

  return null
}

/* ─── User location dot ─── */
function UserDot({ position }: { position: [number, number] }) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;
      background:#2563EB;
      border:2.5px solid white;
      border-radius:50%;
      box-shadow:0 0 0 4px rgba(37,99,235,0.25);
    "></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  })
  return <Marker position={position} icon={icon} />
}

/* ─────────────────────────────────────────────────────────
   MAIN MAP COMPONENT
   ───────────────────────────────────────────────────────── */

interface MapViewProps {
  shops: Shop[]
  nearMeShops?: NearMeShop[]
  userLocation?: [number, number] | null
  isNearMe?: boolean
}

export default function MapView({
  shops,
  nearMeShops,
  userLocation = null,
  isNearMe = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Shops to display — near me results take priority
  const displayShops: (Shop | NearMeShop)[] = isNearMe && nearMeShops?.length
    ? nearMeShops
    : shops

  const mappableShops = displayShops.filter(
    (s) => s.latitude != null && s.longitude != null,
  )

  // Default center: continental US
  const defaultCenter: [number, number] = [39.5, -98.35]
  const defaultZoom = 4

  return (
    <div
      ref={containerRef}
      className="w-full rounded-md overflow-hidden border border-[var(--color-gray-light)]"
      style={{ height: "calc(100vh - 200px)", minHeight: 400 }}
    >
      <MapContainer
        center={userLocation ?? defaultCenter}
        zoom={userLocation ? 11 : defaultZoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom
        zoomControl
      >
        {/* OpenStreetMap tiles — free, no API key needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit / recentre controller */}
        <MapController userLocation={userLocation} shops={mappableShops} />

        {/* User location dot */}
        {userLocation && <UserDot position={userLocation} />}

        {/* Shop pins */}
        {mappableShops.map((shop) => {
          const distanceKm = "distance_km" in shop ? shop.distance_km : undefined
          const isFeatured  = shop.listing_tier === "featured"

          return (
            <Marker
              key={shop.id}
              position={[shop.latitude!, shop.longitude!]}
              icon={makeShopIcon(isFeatured)}
            >
              <Popup
                maxWidth={240}
                className="map-popup"
              >
                <div className="p-1 space-y-1.5" style={{ fontFamily: "system-ui, sans-serif" }}>
                  {/* Shop type label */}
                  {shop.shop_type && (
                    <p style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#1B4332",
                      fontWeight: 600,
                      margin: 0,
                    }}>
                      {shop.shop_type}
                    </p>
                  )}

                  {/* Name */}
                  <p style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0A0A0A",
                    margin: 0,
                    lineHeight: 1.3,
                  }}>
                    {shop.name}
                  </p>

                  {/* Location */}
                  <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
                    {shop.city}, {shop.state_code}
                  </p>

                  {/* Rating + distance row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {shop.rating && shop.rating > 0 && (
                      <span style={{ fontSize: 12, color: "#1B4332", fontWeight: 600 }}>
                        ★ {shop.rating.toFixed(1)}
                      </span>
                    )}
                    {distanceKm !== undefined && (
                      <span style={{
                        fontSize: 11,
                        background: "#1B43320A",
                        color: "#1B4332",
                        border: "1px solid #1B433220",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontWeight: 500,
                      }}>
                        {distanceKm < 1
                          ? `${(distanceKm * 1000).toFixed(0)} m`
                          : `${distanceKm.toFixed(1)} km`}
                      </span>
                    )}
                  </div>

                  {/* View listing link */}
                  <div style={{ paddingTop: 4 }}>
                    <Link
                      href={`/listing/${shop.slug}`}
                      style={{
                        display: "inline-block",
                        fontSize: 12,
                        color: "white",
                        background: "#1B4332",
                        borderRadius: 4,
                        padding: "4px 10px",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      View listing →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Pin count overlay */}
      {mappableShops.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            zIndex: 1000,
            background: "white",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            color: "#6B7280",
            border: "1px solid #E0E0E0",
            pointerEvents: "none",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {mappableShops.length.toLocaleString()} shop{mappableShops.length !== 1 ? "s" : ""} on map
        </div>
      )}
    </div>
  )
}
