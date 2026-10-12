"use client"

import { useEffect, useRef, useState } from "react"
import type { RunRoute, UnassignedOrderRef } from "@/lib/run-types"
import { RUN } from "@/components/run/run-ui"

// A read-only map of one run: its routes as lines with numbered stops, and its unplanned
// orders as hollow grey pins. No lasso, no editing. Shares the OSRM cache with the
// Planning map (same localStorage key and coordinate format), so lines already fetched
// there draw instantly here.

const OSRM_CACHE_KEY = "rb-osrm-cache"
const OSRM_CACHE_VERSION = 1

function readCache(): Record<string, [number, number][]> {
  try {
    const raw = localStorage.getItem(OSRM_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed._v === OSRM_CACHE_VERSION ? parsed.data ?? {} : {}
  } catch {
    return {}
  }
}

async function roadLine(stops: { latitude: number; longitude: number }[]): Promise<[number, number][]> {
  const straight = stops.map((s) => [s.longitude, s.latitude] as [number, number])
  const key = straight.map(([lng, lat]) => `${lng},${lat}`).join(";")
  const cache = readCache()
  if (cache[key]) return cache[key]
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson`)
    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.[0]) return straight
    const coords: [number, number][] = data.routes[0].geometry.coordinates
    try {
      localStorage.setItem(OSRM_CACHE_KEY, JSON.stringify({ _v: OSRM_CACHE_VERSION, data: { ...cache, [key]: coords } }))
    } catch {
      /* storage full or blocked: draw anyway */
    }
    return coords
  } catch {
    return straight
  }
}

type MapboxModule = typeof import("mapbox-gl")["default"]

export function RunSnapshotMap({ routes, unassigned, highlightRouteId, highlightOrderId, label }: { routes: RunRoute[]; unassigned: UnassignedOrderRef[]; highlightRouteId?: string | null; highlightOrderId?: string | null; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<InstanceType<MapboxModule["Map"]> | null>(null)
  const mbRef = useRef<MapboxModule | null>(null)
  const markersRef = useRef<{ remove: () => void }[]>([])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  // Create the map once.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mb = (await import("mapbox-gl")).default
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css"
          document.head.appendChild(link)
        }
        const cfg = await (await fetch("/api/map-config", { cache: "no-store" })).json()
        if (cancelled || !containerRef.current) return
        mb.accessToken = cfg.token
        mbRef.current = mb
        const map = new mb.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/dark-v11", center: [-97.74, 30.4], zoom: 9, attributionControl: false })
        map.addControl(new mb.NavigationControl({ showCompass: false }), "top-right")
        map.on("load", () => !cancelled && setReady(true))
        mapRef.current = map
      } catch {
        setFailed(true)
      }
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Draw the run whenever it changes.
  useEffect(() => {
    const map = mapRef.current
    const mb = mbRef.current
    if (!ready || !map || !mb) return
    let cancelled = false

    const style = map.getStyle()
    style?.layers?.filter((l) => l.id.startsWith("run-")).forEach((l) => map.removeLayer(l.id))
    Object.keys(style?.sources ?? {}).filter((id) => id.startsWith("run-")).forEach((id) => map.removeSource(id))
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds = new mb.LngLatBounds()
    routes.forEach((r) => r.stops.forEach((s) => bounds.extend([s.longitude, s.latitude])))
    unassigned.forEach((o) => bounds.extend([o.longitude, o.latitude]))
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 56, duration: 500, maxZoom: 12 })

    ;(async () => {
      for (const r of routes) {
        const coords = await roadLine(r.stops)
        if (cancelled || !mapRef.current) return
        const id = `run-${r.id}`
        if (map.getSource(id)) continue
        map.addSource(id, { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } } })
        map.addLayer({ id, type: "line", source: id, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": r.color, "line-width": 3, "line-opacity": 0.85 } })
      }
    })()

    routes.forEach((r) => {
      r.stops.forEach((s) => {
        const el = document.createElement("div")
        const numbered = typeof s.sequence === "number"
        el.style.cssText = numbered
          ? `width:18px;height:18px;border-radius:50%;background:${r.color};color:#111;font:600 10px/18px Geist,sans-serif;text-align:center;box-shadow:0 0 0 2px #111`
          : `width:10px;height:10px;border-radius:2px;background:#E5E5E5;box-shadow:0 0 0 2px #111`
        if (numbered) el.textContent = String(s.sequence)
        el.title = `${s.name}${s.volume ? ` · ${s.volume} gal` : ""}`
        el.dataset.routeId = r.id
        markersRef.current.push(new mb.Marker({ element: el }).setLngLat([s.longitude, s.latitude]).addTo(map))
      })
    })
    unassigned.forEach((o) => {
      const el = document.createElement("div")
      el.style.cssText = "width:14px;height:14px;border-radius:50%;border:2px solid #FB923C;background:#111"
      el.title = `${o.name} · unplanned`
      el.dataset.orderId = o.id
      markersRef.current.push(new mb.Marker({ element: el }).setLngLat([o.longitude, o.latitude]).addTo(map))
    })
    return () => {
      cancelled = true
    }
  }, [ready, routes, unassigned])

  // Hover highlight from the list.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    routes.forEach((r) => {
      const id = `run-${r.id}`
      if (map.getLayer(id)) {
        map.setPaintProperty(id, "line-opacity", highlightRouteId && highlightRouteId !== r.id ? 0.18 : 0.85)
        map.setPaintProperty(id, "line-width", highlightRouteId === r.id ? 5 : 3)
      }
    })
    containerRef.current?.querySelectorAll<HTMLElement>("[data-route-id]").forEach((el) => {
      el.style.opacity = highlightRouteId && el.dataset.routeId !== highlightRouteId ? "0.25" : "1"
    })
    containerRef.current?.querySelectorAll<HTMLElement>("[data-order-id]").forEach((el) => {
      const on = el.dataset.orderId === highlightOrderId
      el.style.transform = on ? "scale(1.6)" : ""
      el.style.background = on ? "#FB923C" : "#111"
    })
  }, [ready, routes, highlightRouteId, highlightOrderId])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#0B0F14" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8, alignItems: "center", backgroundColor: "rgba(17,17,17,0.88)", border: `1px solid ${RUN.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 12, color: RUN.t3 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: RUN.t4 }} />
        {label}
      </div>
      <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 12, backgroundColor: "rgba(17,17,17,0.88)", border: `1px solid ${RUN.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 11, color: RUN.t4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#9A7BC7" }} />Stop on a route</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #FB923C" }} />Unplanned</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#E5E5E5" }} />Hub, terminal</span>
      </div>
      {failed && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: RUN.t4, fontSize: 13 }}>The map couldn&apos;t load.</div>}
    </div>
  )
}
