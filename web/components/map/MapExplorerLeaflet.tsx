"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import { LocateFixed } from "lucide-react"
import type { MapShop } from "@/lib/supabase/queries/shops"
import { isFeaturedPaid, isVerified } from "@/lib/badges"

/* Two pin variants: the standard forest pin (same artwork as the directory
   map) and a gold-dome version for verified/featured shops so they stand out
   at a glance. Data-URI SVGs — no image assets to host. */
function pinIcon(fill: string, dot: string) {
  return new L.Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${fill}"/>
        <circle cx="12.5" cy="12.5" r="5" fill="${dot}"/>
      </svg>`,
    )}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -35],
  })
}

const forestPin = pinIcon("#1a3c2a", "#c9a96e")
const goldPin = pinIcon("#c2a05a", "#18402e")

/* Popup markup must be a plain HTML string: leaflet.markercluster manages the
   markers imperatively, outside React, so Next's <Link> can't render here.
   Escape shop-sourced text — names can contain & and quotes. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function popupHtml(shop: MapShop): string {
  const rating = shop.rating
    ? `<p style="font-size:12px;margin:4px 0 0"><span style="color:#a3823c">★</span> ${shop.rating.toFixed(1)}</p>`
    : ""
  // Earned badge only (owner-claimed, lib/badges.ts) — never the scraped
  // Google `verified` column.
  const badge = isVerified(shop)
    ? `<span style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#a3823c">Verified</span>`
    : ""
  return `<div style="font-size:13px;line-height:1.4">
    <a href="/listing/${shop.slug}" style="font-weight:600;color:#18402e">${escapeHtml(shop.name)}</a>
    <p style="color:#5b6159;font-size:11px;margin:2px 0 0">${escapeHtml(shop.city)}, ${shop.state_code}</p>
    ${rating}${badge}
  </div>`
}

/* Adds/rebuilds the cluster layer whenever the shop list changes. Lives inside
   MapContainer so useMap() can grab the Leaflet map instance. */
function ClusterLayer({ shops }: { shops: MapShop[] }) {
  const map = useMap()
  const groupRef = useRef<L.MarkerClusterGroup | null>(null)

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const size = count >= 100 ? 48 : count >= 25 ? 42 : 36
        return L.divIcon({
          html: `<div class="cfd-cluster" style="width:${size}px;height:${size}px">${count}</div>`,
          className: "cfd-cluster-wrap",
          iconSize: L.point(size, size),
        })
      },
    })

    for (const shop of shops) {
      const marker = L.marker([shop.latitude, shop.longitude], {
        icon: isVerified(shop) || isFeaturedPaid(shop) || shop.is_featured ? goldPin : forestPin,
      })
      marker.bindPopup(popupHtml(shop))
      group.addLayer(marker)
    }

    map.addLayer(group)
    groupRef.current = group
    return () => {
      map.removeLayer(group)
      groupRef.current = null
    }
  }, [map, shops])

  return null
}

/* "Near me" control — flies to the visitor's location. Fails silently if the
   browser blocks geolocation (no error UI needed on a browse-first page). */
function LocateButton() {
  const map = useMap()
  const [busy, setBusy] = useState(false)

  const locate = () => {
    if (!navigator.geolocation || busy) return
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 10)
        setBusy(false)
      },
      () => setBusy(false),
      { timeout: 8000 },
    )
  }

  return (
    <button
      type="button"
      onClick={locate}
      aria-label="Show shops near me"
      className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white border border-[var(--color-border)] rounded-md px-3 py-2 text-xs font-semibold text-[var(--color-forest)] shadow-sm hover:bg-[var(--color-cream)] transition-colors"
    >
      <LocateFixed size={14} strokeWidth={2} />
      {busy ? "Locating…" : "Near me"}
    </button>
  )
}

interface MapExplorerLeafletProps {
  shops: MapShop[]
}

export function MapExplorerLeaflet({ shops }: MapExplorerLeafletProps) {
  const [fittingOnly, setFittingOnly] = useState(false)

  const visible = useMemo(() => {
    // Safety net: the query already excludes null coordinates, but Leaflet
    // throws hard if one ever slips through, so re-filter client-side too.
    const mappable = shops.filter((s) => s.latitude != null && s.longitude != null)
    return fittingOnly ? mappable.filter((s) => s.offers_fitting) : mappable
  }, [shops, fittingOnly])

  return (
    <div>
      <div className="relative h-[60vh] md:h-[70vh] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          minZoom={3}
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          <ClusterLayer shops={visible} />
          <LocateButton />
        </MapContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-[var(--color-charcoal)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={fittingOnly}
            onChange={(e) => setFittingOnly(e.target.checked)}
            className="accent-[var(--color-forest)]"
          />
          Only shops that offer club fitting
        </label>
        <p className="text-xs text-[var(--color-charcoal-light)]">
          Showing {visible.length.toLocaleString()} shops · gold pins are verified or featured
        </p>
      </div>
    </div>
  )
}
