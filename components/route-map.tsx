"use client"

import { useEffect, useRef, useState } from "react"
import type { ExtractionOrder, ShipTo } from "@/lib/mock-data"
import { mockRoutes } from "@/lib/mock-data"

// Mirror of MOCK_STOP_TIMES in lasso-workspace-sheet — used to derive display times from routeSequence
const STOP_TIMES = [
  "5:45 AM", "06:30 AM", "7:15 AM", "8:00 AM", "8:45 AM",
  "9:30 AM", "10:15 AM", "11:00 AM", "11:45 AM", "12:30 PM",
]

function getStopDisplayTime(order: ExtractionOrder): string | undefined {
  // New orders carry an explicit "HH:MM AM/PM" string on scheduledDate
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(order.scheduledDate ?? "")) return order.scheduledDate
  const seq = Math.floor(order.routeSequence ?? 0)
  if (seq > 0 && seq <= STOP_TIMES.length) return STOP_TIMES[seq - 1]
  return undefined
}
import { renderMapPinToHTML } from "@/components/map-pin"
import { base1Infrastructure, clusterInfrastructure } from "@/lib/infrastructure-data"
import { renderInfrastructureMarkerHTML, buildTerminalTooltipHTML, type TerminalLoadInfo, type TerminalTooltipInfo } from "@/components/infrastructure-marker"
import { renderMapPinTooltip, renderShipToNoOrderTooltip } from "@/components/map-pin-tooltip"
import { renderRouteLineTooltip } from "@/components/route-line-tooltip"
import { type TankThreshold } from "@/lib/routes-data"
import type { MapEntityVisibility } from "@/components/map-controls"
import { useSettings } from "@/contexts/settings-context"

// ─── OSRM route cache (localStorage) ────────────────────────────────────────

const OSRM_CACHE_KEY = "rb-osrm-cache"
const OSRM_CACHE_VERSION = 1

function getOsrmCache(): Record<string, [number, number][]> {
  try {
    const raw = localStorage.getItem(OSRM_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed._v !== OSRM_CACHE_VERSION) return {}
    return parsed.data ?? {}
  } catch { return {} }
}

function setOsrmCache(cache: Record<string, [number, number][]>) {
  try {
    localStorage.setItem(OSRM_CACHE_KEY, JSON.stringify({ _v: OSRM_CACHE_VERSION, data: cache }))
  } catch { /* storage full — ignore */ }
}

async function fetchOsrmRoute(coordParam: string): Promise<[number, number][] | null> {
  // Check cache first
  const cache = getOsrmCache()
  if (cache[coordParam]) return cache[coordParam]

  // Fetch from OSRM
  const url = `https://router.project-osrm.org/route/v1/driving/${coordParam}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.[0]) return null
    const coords: [number, number][] = data.routes[0].geometry.coordinates
    // Save to cache
    cache[coordParam] = coords
    setOsrmCache(cache)
    return coords
  } catch {
    return null
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function lightenColor(hex: string, percent = 40): string {
  hex = hex.replace(/^#/, "")
  let r = parseInt(hex.substring(0, 2), 16)
  let g = parseInt(hex.substring(2, 4), 16)
  let b = parseInt(hex.substring(4, 6), 16)
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)))
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)))
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)))
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

function getTankThreshold(level: number): TankThreshold {
  if (level >= 75) return "red"
  if (level >= 40) return "yellow"
  if (level > 0) return "green"
  return "blue"
}

function findHubByCity(cityName: string): { lat: number; lng: number } | null {
  const lower = cityName.toLowerCase()
  const match =
    base1Infrastructure.find(
      (i) => i.type === "Hub" && i.name.toLowerCase().includes(lower),
    ) ?? base1Infrastructure.find((i) => i.name.toLowerCase().includes(lower))
  return match ? { lat: match.latitude, lng: match.longitude } : null
}

/* ── Clustering disabled — will be rebuilt from scratch ──────────────────────
interface Cluster {
  lat: number
  lng: number
  count: number
  orders: ExtractionOrder[]
}

function createClusters(orders: ExtractionOrder[], zoom: number): Cluster[] {
  if (zoom >= 10) {
    return orders.map((o) => ({ lat: o.latitude, lng: o.longitude, count: 1, orders: [o] }))
  }
  const clusterRadius = zoom < 4 ? 10 : zoom < 6 ? 3 : zoom < 8 ? 1.5 : 0.5
  const clusters: Cluster[] = []
  const processed = new Set<string>()

  orders.forEach((order) => {
    if (processed.has(order.id)) return
    const cluster: Cluster = { lat: order.latitude, lng: order.longitude, count: 1, orders: [order] }
    orders.forEach((other) => {
      if (processed.has(other.id) || order.id === other.id) return
      const d = Math.sqrt(
        Math.pow(order.latitude - other.latitude, 2) + Math.pow(order.longitude - other.longitude, 2),
      )
      if (d < clusterRadius) {
        cluster.orders.push(other)
        cluster.count++
        processed.add(other.id)
        cluster.lat = cluster.orders.reduce((s, o) => s + o.latitude, 0) / cluster.count
        cluster.lng = cluster.orders.reduce((s, o) => s + o.longitude, 0) / cluster.count
      }
    })
    processed.add(order.id)
    clusters.push(cluster)
  })
  return clusters
}
── end clustering ──────────────────────────────────────────────────────────── */

// ─── types ───────────────────────────────────────────────────────────────────

export interface RouteMapProps {
  orders: ExtractionOrder[]
  shipTosWithoutOrders?: ShipTo[]
  entityVisibility?: MapEntityVisibility
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetNorth?: () => void
  onLocate?: () => void
  isRouteListOpen?: boolean
  isCreatePanelOpen?: boolean
  isLassoActive?: boolean
  onRouteClick?: (routeId: string) => void
  onTerminalClick?: (terminalId: string) => void
  onOrderPinClick?: (order: ExtractionOrder) => void
  selectedRouteIds?: string[]
  checkedRouteIds?: string[]
  hoveredWorkspaceRouteId?: string | null
  hoveredWorkspaceOrderId?: string | null
  expandedRouteIds?: string[]
  isWorkspaceOpen?: boolean
  filterHighlightedRouteIds?: string[]
  workspaceWidth?: number
  addedLoadOrders?: Record<string, ExtractionOrder[]>
  selectedUnassignedOrderIds?: string[]
  isCreateOrderSideSheetOpen?: boolean
  reorderedRoutes?: Record<string, string[]>
}

// Fallback route colors if route not found in mockRoutes
const ROUTE_COLORS = ["#9A7BC7", "#C4956A", "#6B9DCF", "#B87DA3", "#C07A7A", "#7AB88A"]
const DEFAULT_GREY = "#52525B"

function getRouteColor(routeId: string, fallbackIndex: number): string {
  const route = mockRoutes.find((r) => r.id === routeId)
  return route?.color ?? ROUTE_COLORS[fallbackIndex % ROUTE_COLORS.length]
}

// ─── component ───────────────────────────────────────────────────────────────

export function RouteMap({
  orders,
  shipTosWithoutOrders = [],
  entityVisibility = {
    shipTosWithOrders: true,
    routeSequence: true,
    shipTosWithoutOrders: true,
    hub: true,
    bulkPlant: true,
    warehouse: true,
    terminals: true,
  },
  isRouteListOpen = false,
  isCreatePanelOpen = false,
  isLassoActive = false,
  onRouteClick,
  onTerminalClick,
  onOrderPinClick,
  selectedRouteIds = [],
  checkedRouteIds = [],
  hoveredWorkspaceRouteId = null,
  hoveredWorkspaceOrderId = null,
  expandedRouteIds = [],
  isWorkspaceOpen = false,
  workspaceWidth = 560,
  addedLoadOrders = {},
  selectedUnassignedOrderIds = [],
  isCreateOrderSideSheetOpen = false,
  reorderedRoutes = {},
  filterHighlightedRouteIds = [],
}: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null) // mapboxgl.Map
  const mbRef = useRef<any>(null) // mapboxgl module (loaded dynamically to avoid CJS interop issues)

  // All order/cluster markers (for bulk clear on zoom change)
  const allOrderMarkersRef = useRef<any[]>([])
  // order id → marker (for targeted icon updates)
  const orderMarkerMapRef = useRef<Map<string, any>>(new Map())
  // order id → order data (stable, avoids recreating on selectedRouteIds change)
  const orderDataMapRef = useRef<Map<string, { order: ExtractionOrder; tankThreshold: TankThreshold }>>(new Map())
  // order id → 1-based sequential position within its route's delivery stop list
  const routePositionMapRef = useRef<Map<string, number>>(new Map())

  const shipToMarkersRef = useRef<any[]>([])
  const hubMarkersRef = useRef<any[]>([])

  // Route layers (Mapbox source + layer ids)
  const routeLayerIdsRef = useRef<Set<string>>(new Set())
  const routeBoundsRef = useRef<Map<string, any>>(new Map()) // mapboxgl.LngLatBounds
  const routeCoordinatesRef = useRef<Map<string, [number, number][]>>(new Map())
  const routeOrdersRef = useRef<Map<string, ExtractionOrder[]>>(new Map())
  const routeColorsRef = useRef<Map<string, string>>(new Map())

  const arrowMarkersRef = useRef<Map<string, any[]>>(new Map())
  const activePopupRef = useRef<any>(null) // mapboxgl.Popup
  // Tracks the previous order count per route so we can detect "a stop was added" and run a
  // line-draw animation instead of the polyline silently snapping into place.
  const prevRouteOrderCountRef = useRef<Map<string, number>>(new Map())

  const selectedRouteIdsRef = useRef<string[]>(selectedRouteIds)
  const onRouteClickRef = useRef(onRouteClick)
  const onOrderPinClickRef = useRef(onOrderPinClick)

  const [currentZoom, setCurrentZoom] = useState(9)
  const [mapReady, setMapReady] = useState(false)

  const settingsCtx = useSettings()
  const routeLineDisplay = settingsCtx.routeLineDisplayValue
  const showBadgesValue = settingsCtx.showBadgesValue
  const reducedOpacity = settingsCtx.reducedOpacityValue

  // ── keep refs in sync ────────────────────────────────────────────────────
  useEffect(() => { selectedRouteIdsRef.current = selectedRouteIds }, [selectedRouteIds])
  useEffect(() => { onRouteClickRef.current = onRouteClick }, [onRouteClick])
  useEffect(() => { onOrderPinClickRef.current = onOrderPinClick }, [onOrderPinClick])

  // ── shift map when workspace panel opens / closes ─────────────────────────
  const prevWorkspaceOpenRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    if (prevWorkspaceOpenRef.current === null) {
      prevWorkspaceOpenRef.current = isWorkspaceOpen
      return
    }
    if (prevWorkspaceOpenRef.current === isWorkspaceOpen) return
    prevWorkspaceOpenRef.current = isWorkspaceOpen
    // Skip pan when modal3 side sheet is involved — the drawer replaces the workspace
    // panel visually so the map should stay still during that transition
    if (isCreateOrderSideSheetOpen) return
    const panAmount = workspaceWidth / 2
    mapRef.current.panBy(isWorkspaceOpen ? [panAmount, 0] : [-panAmount, 0], { duration: 400 })
  }, [isWorkspaceOpen, workspaceWidth, mapReady, isCreateOrderSideSheetOpen])

  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).__v0MapSettings = {
        routeLineDisplay,
        reducedOpacity,
        isWorkspaceOpen,
        checkedRouteIds,
        hoveredWorkspaceRouteId,
        expandedRouteIds,
      }
    }
  }, [routeLineDisplay, reducedOpacity, isWorkspaceOpen, checkedRouteIds, hoveredWorkspaceRouteId, expandedRouteIds])

  // ── initialize map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    ;(async () => {
      // Load mapboxgl dynamically — avoids CJS/ESM interop issues with webpack
      const mb = (await import("mapbox-gl")).default
      mbRef.current = mb

      // Load Mapbox CSS
      if (!document.querySelector("#mapbox-css")) {
        const link = document.createElement("link")
        link.id = "mapbox-css"
        link.rel = "stylesheet"
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.15.0/mapbox-gl.css"
        document.head.appendChild(link)
      }

      // Get token from API
      try {
        const res = await fetch("/api/map-config", { cache: "no-store" })
        const cfg = await res.json()
        if (cfg.token) mb.accessToken = cfg.token
      } catch {
        console.warn("[RouteMap] Failed to fetch map config")
      }

      // Re-check after awaits — component may have unmounted
      if (!mapContainer.current || mapRef.current) return

      const map = new mb.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-97.65, 30.35],
        zoom: 9,
        minZoom: 3,
        maxZoom: 18,
      })

      map.on("zoom", () => setCurrentZoom(map.getZoom()))
      map.on("load", () => {
        setMapReady(true)
        setCurrentZoom(map.getZoom())
      })

      mapRef.current = map

      // Window globals — exposed so MapControls / FilterSheet can drive the map
      ;(window as any).__mapControls = {
        zoomIn: () => map.zoomIn(),
        zoomOut: () => map.zoomOut(),
        resetNorth: () => map.resetNorth({ duration: 500 }),
        locate: () => map.flyTo({ center: [-98.5, 39.8], zoom: 5 }),
      }
    })()

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── resize when panels open/close ────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.resize(), 310)
    return () => clearTimeout(t)
  }, [isRouteListOpen, isCreatePanelOpen, isWorkspaceOpen])

  // ── window globals that depend on mapReady ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    ;(window as any).__zoomToCity = (cityName: string) => {
      const coords = findHubByCity(cityName)
      if (coords && mapRef.current) mapRef.current.flyTo({ center: [coords.lng, coords.lat], zoom: 12 })
    }

    ;(window as any).__zoomToRoute = (routeId: string, opts?: { maxZoom?: number }) => {
      const bounds = routeBoundsRef.current.get(routeId)
      if (bounds && mapRef.current) {
        // Right padding accounts for 560px workspace panel so route stays centred in visible area
        mapRef.current.fitBounds(bounds, {
          padding: { top: 80, right: 640, bottom: 80, left: 80 },
          maxZoom: opts?.maxZoom ?? 13,
          duration: 800,
        })
      }
    }

    ;(window as any).__zoomToShipTo = (latitude: number, longitude: number, zoom = 13) => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom,
          duration: 800,
        })
      }
    }

    ;(window as any).__fitToShipTos = (
      coords: { lat: number; lng: number }[],
      opts?: { maxZoom?: number; padding?: { top: number; right: number; bottom: number; left: number }; duration?: number }
    ) => {
      if (!mapRef.current || coords.length === 0) return
      const duration = opts?.duration ?? 800
      if (coords.length === 1) {
        mapRef.current.flyTo({ center: [coords[0].lng, coords[0].lat], zoom: opts?.maxZoom ?? 14, duration })
        return
      }
      const lngs = coords.map((c) => c.lng)
      const lats = coords.map((c) => c.lat)
      const bounds: [number, number, number, number] = [
        Math.min(...lngs),
        Math.min(...lats),
        Math.max(...lngs),
        Math.max(...lats),
      ]
      mapRef.current.fitBounds(bounds, {
        padding: opts?.padding ?? { top: 80, right: 640, bottom: 80, left: 80 },
        maxZoom: opts?.maxZoom ?? 14,
        duration,
        // Smooth ease-out so the camera lands gracefully instead of snapping
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      })
    }

    ;(window as any).__zoomToTerminal = (terminalId: string) => {
      const terminal = base1Infrastructure.find((i) => i.id === terminalId)
      if (terminal && mapRef.current) {
        mapRef.current.flyTo({
          center: [terminal.longitude, terminal.latitude],
          zoom: 12,
          duration: 800,
          // Shift focal point left so terminal centres in the visible portion (workspace is 560px right)
          padding: { top: 0, right: 560, bottom: 0, left: 0 },
        })
      }
    }

    // Save / restore map view — called by the MapPinned button in MapControls.
    // Saved state: { center: [lng, lat], zoom, bearing, pitch } in localStorage.
    ;(window as any).__saveMapView = () => {
      const map = mapRef.current
      if (!map) return
      const view = {
        center: map.getCenter().toArray(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      }
      localStorage.setItem("rb-saved-map-view", JSON.stringify(view))
    }

    ;(window as any).__goToSavedView = () => {
      const map = mapRef.current
      if (!map) return
      const raw = localStorage.getItem("rb-saved-map-view")
      if (!raw) return
      try {
        const view = JSON.parse(raw)
        map.flyTo({
          center: view.center,
          zoom: view.zoom,
          bearing: view.bearing,
          pitch: view.pitch,
          duration: 800,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
        })
      } catch {
        // Corrupted stored value — ignore
      }
    }
  }, [mapReady])

  // ── lasso: disable/enable map interaction ────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (isLassoActive) {
      map.dragPan.disable()
      map.scrollZoom.disable()
      map.doubleClickZoom.disable()
      map.touchZoomRotate.disable()
    } else {
      map.dragPan.enable()
      map.scrollZoom.enable()
      map.doubleClickZoom.enable()
      map.touchZoomRotate.enable()
    }
  }, [isLassoActive])

  // ── order markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady || orders.length === 0) return

    const mapboxgl: any = (mapRef.current as any).constructor // grab class reference for Popup/Marker

    // Clear existing markers
    allOrderMarkersRef.current.forEach((m) => m.remove())
    allOrderMarkersRef.current = []
    orderMarkerMapRef.current.clear()
    orderDataMapRef.current.clear()

    if (!entityVisibility.shipTosWithOrders) return

    // Build sequential list-position lookup per route (matches workspace card numbering)
    routePositionMapRef.current.clear()
    const byRoute = new Map<string, ExtractionOrder[]>()
    for (const o of orders) {
      if (o.routeId && o.orderType !== "L" && o.orderType !== "T") {
        const arr = byRoute.get(o.routeId) ?? []
        arr.push(o)
        byRoute.set(o.routeId, arr)
      }
    }
    for (const [routeId, routeOrders] of byRoute.entries()) {
      const reorderIds = reorderedRoutes[routeId]
      if (reorderIds) {
        // Use drag-reordered sequence: reorderIds first, then any new orders not yet in the list
        const idToOrder = new Map(routeOrders.map((o) => [o.id, o]))
        const ordered: ExtractionOrder[] = [
          ...reorderIds.map((id) => idToOrder.get(id)).filter(Boolean) as ExtractionOrder[],
          ...routeOrders.filter((o) => !reorderIds.includes(o.id)),
        ]
        ordered.forEach((o, idx) => routePositionMapRef.current.set(o.id, idx + 1))
      } else {
        routeOrders.sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))
        routeOrders.forEach((o, idx) => routePositionMapRef.current.set(o.id, idx + 1))
      }
    }

    // Skip load (L) and transfer (T) orders — they're co-located with infrastructure markers
    orders.filter((order) => order.orderType !== "L" && order.orderType !== "T").forEach((order) => {
      const threshold = getTankThreshold(order.currentLevel)
      const isActive = order.routeId ? selectedRouteIds.includes(order.routeId) : selectedUnassignedOrderIds.includes(order.id)
      const showBadges = isActive || showBadgesValue
      const showSeq = showBadges && entityVisibility.routeSequence

      const el = document.createElement("div")
      el.className = "custom-map-pin"
      el.setAttribute("data-order-id", order.id)
      el.innerHTML = renderMapPinToHTML(
        threshold,
        showSeq ? (routePositionMapRef.current.get(order.id) ?? order.routeSequence) : undefined,
        showBadges && !order.routeId && order.status === "pending",
        false, false, false, isActive,
      )

      // Tooltip on hover
      el.addEventListener("mouseenter", () => {
        activePopupRef.current?.remove()
        const html = renderMapPinTooltip({
          customerName: order.customerName,
          address: order.shipToAddress,
          city: order.city,
          state: order.state,
          zip: order.zip,
          scheduledDate: order.scheduledDate,
          plannedTime: getStopDisplayTime(order),
          driverId: order.driverId,
          currentLevel: order.currentLevel,
          volume: order.volume,
          tankSize: order.tankSize,
        })

        // Smart anchor: pick direction with most space, accounting for 68px nav bar
        const point = mapRef.current!.project([order.longitude, order.latitude])
        const mapW = mapContainer.current!.offsetWidth
        const mapH = mapContainer.current!.offsetHeight
        const NAV_H = 68
        const TIP_H = 240 // approximate tooltip height
        const TIP_W = 420
        const spaceAbove = point.y - NAV_H
        const spaceBelow = mapH - point.y
        const spaceLeft = point.x
        const spaceRight = mapW - point.x
        const vertAnchor = spaceAbove >= TIP_H ? "bottom" : spaceBelow >= TIP_H ? "top" : spaceAbove >= spaceBelow ? "bottom" : "top"
        let anchor = vertAnchor
        if (spaceRight < TIP_W / 2 && spaceLeft >= TIP_W / 2) anchor = `${vertAnchor}-right` as any
        else if (spaceLeft < TIP_W / 2 && spaceRight >= TIP_W / 2) anchor = `${vertAnchor}-left` as any

        // Per-anchor offsets: "bottom" (popup above pin) needs 40px to clear the 32px pin body
        const popupOffset: Record<string, [number, number]> = {
          "bottom":       [0, -40],
          "bottom-left":  [0, -40],
          "bottom-right": [0, -40],
          "top":          [0,  10],
          "top-left":     [0,  10],
          "top-right":    [0,  10],
          "left":         [-10, 0],
          "right":        [10,  0],
        }
        activePopupRef.current = new mbRef.current.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: popupOffset,
          className: "rb-pin-popup",
          anchor,
        })
          .setLngLat([order.longitude, order.latitude])
          .setHTML(html)
          .addTo(mapRef.current!)
      })
      el.addEventListener("mouseleave", () => {
        activePopupRef.current?.remove()
        activePopupRef.current = null
      })

      // Click → open workspace with route or unassigned order
      el.addEventListener("click", () => {
        onOrderPinClickRef.current?.(order)
      })

      const marker = new mbRef.current.Marker({ element: el, anchor: "bottom" })
        .setLngLat([order.longitude, order.latitude])
        .addTo(mapRef.current!)
      allOrderMarkersRef.current.push(marker)
      orderMarkerMapRef.current.set(order.id, marker)
      orderDataMapRef.current.set(order.id, { order, tankThreshold: threshold })
    })
  }, [orders, mapReady, selectedRouteIds, selectedUnassignedOrderIds, entityVisibility.shipTosWithOrders, entityVisibility.routeSequence, showBadgesValue, reorderedRoutes]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── update pin icons when route selection changes (no re-cluster) ─────────
  useEffect(() => {
    if (!mapReady) return
    orderDataMapRef.current.forEach(({ order, tankThreshold }, orderId) => {
      const marker = orderMarkerMapRef.current.get(orderId)
      if (!marker) return
      const el = marker.getElement()
      const isActive = order.routeId ? selectedRouteIds.includes(order.routeId) : selectedUnassignedOrderIds.includes(order.id)
      const showBadges = isActive || showBadgesValue
      const showSeq = showBadges && entityVisibility.routeSequence
      el.innerHTML = renderMapPinToHTML(
        tankThreshold,
        showSeq ? (routePositionMapRef.current.get(order.id) ?? order.routeSequence) : undefined,
        showBadges && !order.routeId && order.status === "pending",
        false, false, false, isActive,
      )
    })
  }, [selectedRouteIds, selectedUnassignedOrderIds, showBadgesValue, entityVisibility.routeSequence, mapReady])

  // ── infrastructure markers ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    hubMarkersRef.current.forEach((m) => m.remove())
    hubMarkersRef.current = []
    // Remove any lingering terminal tooltips from previous render
    mapContainer.current?.querySelectorAll(".terminal-detached-tooltip").forEach((el) => el.remove())

    if (currentZoom < 7) return

    const filtered = base1Infrastructure.filter((item) => {
      if (item.type === "Hub" && !entityVisibility.hub) return false
      if ((item.type === "Bulk Plant (Fuel)" || item.type === "Bulk Plant (Lube)") && !entityVisibility.bulkPlant) return false
      if (item.type === "Warehouse" && !entityVisibility.warehouse) return false
      if (item.type === "Terminal" && !entityVisibility.terminals) return false
      return true
    })

    const clusters = clusterInfrastructure(filtered)

    clusters.forEach((cluster) => {
      const el = document.createElement("div")
      el.className = "custom-infrastructure-icon"

      // inf-1 = Flint Hills - Johnny Morris — load terminal with badge + tooltip
      let loadInfo: TerminalLoadInfo | undefined
      let tooltipInfo: TerminalTooltipInfo | undefined
      const isLoadTerminal = cluster.items.some((i) => i.id === "inf-1")
      if (isLoadTerminal) {
        loadInfo = { orderCount: 1 }
        tooltipInfo = {
          address: "7501 Johnny Morris Road, Austin, TX",
          supplierCount: 5,
          suppliers: "Tesoro / 332023, Marathon Unbranded / 311275, Marathon - NGL Crude Logistics, Marathon - Boyett Petroleum",
        }
      }

      el.innerHTML = renderInfrastructureMarkerHTML(cluster, loadInfo, tooltipInfo)

      // Hover: show detached tooltip (appended to map container) + darken icon to pink-600
      if (tooltipInfo) {
        const tooltipEl = document.createElement("div")
        tooltipEl.style.cssText = `
          display: none;
          position: absolute;
          width: 320px;
          background: #111111;
          border: 1px solid #282828;
          border-radius: 4px;
          padding: 12px 16px;
          box-shadow: 0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1);
          z-index: 100000;
          pointer-events: none;
        `
        tooltipEl.className = "terminal-detached-tooltip"
        tooltipEl.innerHTML = buildTerminalTooltipHTML(tooltipInfo, cluster.primaryItem.name)
        mapContainer.current!.appendChild(tooltipEl)

        // Attach hover only to the icon square (28×28), not the pill label
        const iconSquareEl = el.querySelector(".infra-icon-square") as HTMLElement | null
        if (iconSquareEl) {
          iconSquareEl.addEventListener("mouseenter", () => {
            iconSquareEl.style.backgroundColor = "#DB2777"
            // Position tooltip 4px below the icon square, centered on it
            const rect = iconSquareEl.getBoundingClientRect()
            const mapRect = mapContainer.current!.getBoundingClientRect()
            const left = rect.left - mapRect.left + rect.width / 2 - 160 // center 320px tooltip
            const top = rect.bottom - mapRect.top + 4
            tooltipEl.style.left = `${left}px`
            tooltipEl.style.top = `${top}px`
            tooltipEl.style.display = "block"
          })
          iconSquareEl.addEventListener("mouseleave", () => {
            iconSquareEl.style.backgroundColor = "#EC4899"
            tooltipEl.style.display = "none"
          })
        }
      }

      // Click: open workspace with routes/orders for this terminal
      if (isLoadTerminal) {
        el.addEventListener("click", () => {
          onTerminalClick?.("inf-1")
        })
        // Remove old popup-on-click behavior below by returning early after workspace open
      }

      // Popup on click (non-load terminals only — load terminals open workspace instead)
      if (!isLoadTerminal) el.addEventListener("click", () => {
        const content = cluster.items
          .map(
            (item) => `
            <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #282828;">
              <h4 style="margin:0 0 4px;font-weight:600;color:#FAFAFA;">${item.name}</h4>
              <p style="margin:0;font-size:12px;color:#A3A3A3;"><strong>Type:</strong> ${item.type}</p>
              <p style="margin:0;font-size:12px;color:#A3A3A3;"><strong>Address:</strong> ${item.address}</p>
              <p style="margin:0;font-size:12px;color:#A3A3A3;"><strong>LoS:</strong> ${item.lineOfService}</p>
            </div>`,
          )
          .join("")

        activePopupRef.current?.remove()
        activePopupRef.current = new mbRef.current.Popup({
          closeButton: true,
          className: "rb-infra-popup",
        })
          .setLngLat([cluster.longitude, cluster.latitude])
          .setHTML(`<div style="max-width:280px;background:#1B1B1B;padding:12px;border-radius:8px;">${content}</div>`)
          .addTo(mapRef.current!)
      })

      const marker = new mbRef.current.Marker({ element: el, anchor: "center" })
        .setLngLat([cluster.longitude, cluster.latitude])
        .addTo(mapRef.current!)
      hubMarkersRef.current.push(marker)
    })
  }, [mapReady, currentZoom, entityVisibility.hub, entityVisibility.bulkPlant, entityVisibility.warehouse, entityVisibility.terminals])

  // ── update terminal badge count when load orders are added ───────────────
  useEffect(() => {
    const addedCount = Object.values(addedLoadOrders).flat().filter((o) => o.orderType === "L").length
    const badge = mapContainer.current?.querySelector(".terminal-order-badge")
    if (badge) {
      const total = 1 + addedCount
      badge.textContent = `${total} Order${total !== 1 ? "s" : ""}`
    }
  }, [addedLoadOrders])

  // ── shipTo markers (no orders) ───────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    shipToMarkersRef.current.forEach((m) => m.remove())
    shipToMarkersRef.current = []

    if (!entityVisibility.shipTosWithoutOrders || currentZoom < 8 || shipTosWithoutOrders.length === 0) return

    // Hover-only tooltip with "bridge" handlers on the popup itself so it survives the cursor
    // travelling from the pin onto the tooltip (e.g., to click Create Order).
    // (Click-to-zoom-and-stick was tried; pulled back on user feedback — see DESIGN_JOURNAL.)
    let closeTimer: number | null = null
    const cancelClose = () => {
      if (closeTimer !== null) {
        clearTimeout(closeTimer)
        closeTimer = null
      }
    }
    const scheduleClose = () => {
      cancelClose()
      closeTimer = window.setTimeout(() => {
        activePopupRef.current?.remove()
        activePopupRef.current = null
        closeTimer = null
      }, 180)
    }

    const buildTooltipHTML = (shipTo: ShipTo) => {
      // Mock thresholds for the demo (no real per-shipto threshold data yet — see DESIGN_JOURNAL).
      const thresholds = { red: 3, yellow: 8, green: 4, blue: 2 }
      // Mock "Next Order" = last delivery + 14 days
      let nextOrderISO: string | undefined
      if (shipTo.lastDelivery) {
        const d = new Date(shipTo.lastDelivery)
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 14)
          nextOrderISO = d.toISOString()
        }
      }
      return renderShipToNoOrderTooltip({
        shipToId: shipTo.id,
        shipToName: shipTo.shipToName ?? shipTo.customerName,
        address: shipTo.shipToAddress,
        thresholds,
        lastOrderedISO: shipTo.lastDelivery,
        nextOrderISO,
      })
    }

    const showTooltip = (shipTo: ShipTo) => {
      cancelClose()
      activePopupRef.current?.remove()
      const popup = new mbRef.current.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        className: "rb-pin-popup",
        maxWidth: "320px",
      })
        .setLngLat([shipTo.longitude, shipTo.latitude])
        .setHTML(buildTooltipHTML(shipTo))
        .addTo(mapRef.current!)
      activePopupRef.current = popup

      // Wire bridge handlers + the "Create Order" button after the popup DOM is attached.
      requestAnimationFrame(() => {
        const node = popup.getElement?.()
        if (!node) return
        node.addEventListener("mouseenter", cancelClose)
        node.addEventListener("mouseleave", scheduleClose)
        const btn = node.querySelector('button[data-action="create-order"]') as HTMLButtonElement | null
        if (btn) {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation()
            cancelClose()
            const openFn = (window as any).__openCreateOrderForShipTo as
              | ((id: string) => void)
              | undefined
            openFn?.(shipTo.id)
            activePopupRef.current?.remove()
            activePopupRef.current = null
          })
        }
      })
    }

    shipTosWithoutOrders.forEach((shipTo) => {
      const el = document.createElement("div")
      el.className = "custom-map-pin shipto-only"
      el.setAttribute("data-shipto-id", shipTo.id)
      el.innerHTML = renderMapPinToHTML("green", undefined, false, true, false, false, false)

      el.addEventListener("mouseenter", () => showTooltip(shipTo))
      el.addEventListener("mouseleave", () => scheduleClose())

      const marker = new mbRef.current.Marker({ element: el, anchor: "bottom" })
        .setLngLat([shipTo.longitude, shipTo.latitude])
        .addTo(mapRef.current!)
      shipToMarkersRef.current.push(marker)
    })
  }, [mapReady, currentZoom, shipTosWithoutOrders, entityVisibility.shipTosWithoutOrders])

  // ── global: show shipTo tooltip for 2s then fade (called from CreateOrderModal) ──
  useEffect(() => {
    if (!mapReady) return
    ;(window as any).__showShipToTooltipFor2Sec = (shipToId: string) => {
      if (!mapRef.current || !mbRef.current) return

      let lat: number | undefined
      let lng: number | undefined
      let html: string | undefined

      const sto = shipTosWithoutOrders.find((s) => s.id === shipToId)
      if (sto) {
        lat = sto.latitude; lng = sto.longitude
        const thresholds = { red: 3, yellow: 8, green: 4, blue: 2 }
        let nextOrderISO: string | undefined
        if (sto.lastDelivery) {
          const d = new Date(sto.lastDelivery)
          if (!isNaN(d.getTime())) { d.setDate(d.getDate() + 14); nextOrderISO = d.toISOString() }
        }
        html = renderShipToNoOrderTooltip({
          shipToId: sto.id,
          shipToName: sto.shipToName ?? sto.customerName,
          address: sto.shipToAddress,
          thresholds,
          lastOrderedISO: sto.lastDelivery,
          nextOrderISO,
          showCreateOrderCta: false, // create order is already in progress; no duplicate CTA
        })
      } else {
        const order = orders.find((o) => `${o.customerId}__${o.shipToAddress}` === shipToId)
        if (order) {
          lat = order.latitude; lng = order.longitude
          html = renderMapPinTooltip({
            customerName: order.customerName,
            address: order.shipToAddress,
            city: order.city,
            state: order.state,
            zip: order.zip,
            scheduledDate: order.scheduledDate,
            plannedTime: getStopDisplayTime(order),
            driverId: order.driverId,
            currentLevel: order.currentLevel,
            volume: order.volume,
            tankSize: order.tankSize,
          })
        }
      }

      if (lat === undefined || lng === undefined || !html) return

      activePopupRef.current?.remove()
      const popup = new mbRef.current.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 10,
        className: "rb-pin-popup",
        maxWidth: "320px",
      })
        .setLngLat([lng, lat])
        .setHTML(html)
        .addTo(mapRef.current!)
      activePopupRef.current = popup

      const fadeTimer = window.setTimeout(() => {
        const el = popup.getElement?.()
        if (el) {
          el.style.transition = "opacity 600ms ease"
          el.style.opacity = "0"
          window.setTimeout(() => {
            popup.remove()
            if (activePopupRef.current === popup) activePopupRef.current = null
          }, 600)
        } else {
          popup.remove()
          if (activePopupRef.current === popup) activePopupRef.current = null
        }
      }, 2000)
      ;(popup as any).__autoFadeTimer = fadeTimer
    }
    return () => { delete (window as any).__showShipToTooltipFor2Sec }
  }, [mapReady, orders, shipTosWithoutOrders])

  // ── route polylines ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady || orders.length === 0) return
    const map = mapRef.current

    // Remove existing route layers + sources
    routeLayerIdsRef.current.forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id)
      if (map.getSource(id)) map.removeSource(id)
    })
    routeLayerIdsRef.current.clear()
    routeBoundsRef.current.clear()
    routeCoordinatesRef.current.clear()
    routeOrdersRef.current.clear()
    routeColorsRef.current.clear()

    // Clear arrow markers
    arrowMarkersRef.current.forEach((markers) => markers.forEach((m) => m.remove()))
    arrowMarkersRef.current.clear()

    // Group orders by routeId
    const routeGroups = new Map<string, ExtractionOrder[]>()
    orders.forEach((order) => {
      if (order.routeId && order.routeSequence !== undefined) {
        if (!routeGroups.has(order.routeId)) routeGroups.set(order.routeId, [])
        routeGroups.get(order.routeId)!.push(order)
      }
    })

    const mapSettings = (window as any).__v0MapSettings ?? { routeLineDisplay: "grayscale", reducedOpacity: false }
    let colorIndex = 0

    ;(async () => {
      for (const [routeId, routeOrders] of routeGroups) {
        const sorted = routeOrders.sort((a, b) => (a.routeSequence || 0) - (b.routeSequence || 0))
        const hub = base1Infrastructure.find((i) => i.type === "Hub")
        if (!hub) continue

        const waypoints = [
          { lng: hub.longitude, lat: hub.latitude },
          ...sorted.map((o) => ({ lng: o.longitude, lat: o.latitude })),
          { lng: hub.longitude, lat: hub.latitude },
        ]

        const coordParam = waypoints.map((w) => `${w.lng},${w.lat}`).join(";")

        try {
          const coords = await fetchOsrmRoute(coordParam)
          if (!coords) {
            console.warn(`[RouteMap] OSRM failed for ${routeId}`)
            colorIndex++
            continue
          }
          const originalColor = getRouteColor(routeId, colorIndex)

          let initialColor = DEFAULT_GREY
          let initialOpacity = 0.8
          if (mapSettings.routeLineDisplay === "colored") {
            initialColor = originalColor
            initialOpacity = mapSettings.reducedOpacity ? 0.3 : 1
          }

          // Compute bounds
          const bounds = coords.reduce(
            (b: any, c) => b.extend(c),
            new mbRef.current.LngLatBounds(coords[0], coords[0]),
          )

          // Sanitize layer ID
          const layerId = `route-${routeId.replace(/[^a-zA-Z0-9_-]/g, "_")}`

          // Add GeoJSON source
          map.addSource(layerId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            },
          })

          // Add line layer
          map.addLayer({
            id: layerId,
            type: "line",
            source: layerId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": initialColor,
              "line-width": 3,
              "line-opacity": initialOpacity,
            },
          })

          // Hover interactions
          map.on("mouseenter", layerId, (e: any) => {
            map.getCanvas().style.cursor = "pointer"
            const settings = (window as any).__v0MapSettings ?? {}
            const isGray = settings.routeLineDisplay !== "colored"
            const hoverColor = isGray ? lightenColor(originalColor, 35) : originalColor
            map.setPaintProperty(layerId, "line-color", hoverColor)
            map.setPaintProperty(layerId, "line-width", 4)
            map.setPaintProperty(layerId, "line-opacity", isGray ? 0.7 : 1)

            // Tooltip
            activePopupRef.current?.remove()
            const tooltipHTML = renderRouteLineTooltip({ routeId, orders: sorted })
            activePopupRef.current = new mbRef.current.Popup({
              closeButton: false,
              className: "rb-route-popup",
              offset: 8,
            })
              .setLngLat(e.lngLat)
              .setHTML(tooltipHTML)
              .addTo(map)

            // Hover arrows
            const hoverArrows = createArrowMarkers(mbRef.current, coords, hoverColor, map)
            hoverArrows.forEach((m: any) => m.addTo(map))
            ;(map as any).__hoverArrows = hoverArrows
          })

          map.on("mousemove", layerId, (e: any) => {
            activePopupRef.current?.setLngLat(e.lngLat)
          })

          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = ""
            activePopupRef.current?.remove()
            activePopupRef.current = null
            ;(map as any).__hoverArrows?.forEach((m: any) => m.remove())
            ;(map as any).__hoverArrows = null

            // Restore style via the sync effect logic inline
            const settings = (window as any).__v0MapSettings ?? {}
            const isInWorkspace = selectedRouteIdsRef.current.includes(routeId)
            const isChecked = settings.checkedRouteIds?.includes(routeId) ?? false
            const isHovered = settings.hoveredWorkspaceRouteId === routeId
            const isExpanded = settings.expandedRouteIds?.includes(routeId) ?? false
            const isHighlighted = isChecked || isHovered || isExpanded
            applyRouteStyle(map, layerId, originalColor, {
              routeLineDisplay: settings.routeLineDisplay ?? "grayscale",
              reducedOpacity: settings.reducedOpacity ?? false,
              isWorkspaceOpen: settings.isWorkspaceOpen ?? false,
              isInWorkspace,
              isHighlighted,
            })
          })

          map.on("click", layerId, () => onRouteClickRef.current?.(routeId))

          // Apply the correct highlight style immediately — the style-update useEffect may
          // have already run while the OSRM fetch was in flight (layer didn't exist yet, so
          // it silently skipped). Read __v0MapSettings fresh here instead of using the stale
          // `mapSettings` closure captured at effect-start time.
          {
            const freshSettings = (window as any).__v0MapSettings ?? {}
            const isInWs = selectedRouteIdsRef.current.includes(routeId)
            const isFreshHighlighted =
              (freshSettings.checkedRouteIds?.includes(routeId) ?? false) ||
              freshSettings.hoveredWorkspaceRouteId === routeId ||
              (freshSettings.expandedRouteIds?.includes(routeId) ?? false)
            applyRouteStyle(map, layerId, originalColor, {
              routeLineDisplay: freshSettings.routeLineDisplay ?? "grayscale",
              reducedOpacity: freshSettings.reducedOpacity ?? false,
              isWorkspaceOpen: freshSettings.isWorkspaceOpen ?? false,
              isInWorkspace: isInWs,
              isHighlighted: isFreshHighlighted,
            })

            // Draw-in animation: if this route just got a new stop, animate the line drawing
            // using line-dasharray. Skip on initial render and when the order count is unchanged.
            const prevCount = prevRouteOrderCountRef.current.get(routeId) ?? 0
            const currCount = sorted.length
            prevRouteOrderCountRef.current.set(routeId, currCount)
            if (currCount > prevCount && prevCount > 0) {
              // The dasharray "trick": [0, large] hides everything; [large, 0] shows everything.
              // We progressively shift to grow the visible line from start to end.
              const DRAW_MS = 1400
              const start = performance.now()
              // Use a smooth ease-out cubic so the head lands gently at the hub
              const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
              const step = (now: number) => {
                if (!map.getLayer(layerId)) return
                const t = Math.max(0, Math.min((now - start) / DRAW_MS, 1))
                const eased = easeOutCubic(t)
                // dash = visible portion (in line-width units); gap = hidden portion
                // Use total = 200 line-widths to ensure clean draw across long routes
                const total = 200
                const dash = Math.max(0, eased * total)
                const gap = Math.max(0, total - dash)
                try {
                  map.setPaintProperty(layerId, "line-dasharray", [dash, gap])
                } catch { /* layer may have been removed */ }
                if (t < 1) requestAnimationFrame(step)
                else {
                  // Clear the dasharray so the line returns to solid
                  try { map.setPaintProperty(layerId, "line-dasharray", [1, 0]) } catch {}
                }
              }
              // Set initial fully-hidden state, then start
              try { map.setPaintProperty(layerId, "line-dasharray", [0, 200]) } catch {}
              requestAnimationFrame(step)
            }

            // Always-on direction arrows for routes in the workspace. Recreated on every
            // polyline build so they stay in sync after order changes (the arrow useEffect
            // alone wouldn't refire because selectedRouteIds didn't change).
            if (isInWs) {
              const old = arrowMarkersRef.current.get(routeId)
              if (old) old.forEach((m: any) => m.remove())
              const arrows = createArrowMarkers(mbRef.current, coords, originalColor, map)
              arrows.forEach((m: any) => m.addTo(map))
              arrowMarkersRef.current.set(routeId, arrows)
            }
          }

          routeLayerIdsRef.current.add(layerId)
          routeBoundsRef.current.set(routeId, bounds)
          routeCoordinatesRef.current.set(routeId, coords)
          routeOrdersRef.current.set(routeId, sorted)
          routeColorsRef.current.set(routeId, originalColor)
        } catch (err) {
          console.error(`[RouteMap] OSRM error for ${routeId}:`, err)
        }

        colorIndex++
      }
    })()
  }, [orders, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── update route polylines when load orders are added ──────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (Object.keys(addedLoadOrders).length === 0) return

    ;(async () => {
      for (const [routeId, extraOrders] of Object.entries(addedLoadOrders)) {
        if (extraOrders.length === 0) continue

        const layerId = `route-${routeId.replace(/[^a-zA-Z0-9_-]/g, "_")}`
        if (!map.getSource(layerId)) continue

        // Merge base orders with added load orders, sorted by routeSequence
        const baseOrders = routeOrdersRef.current.get(routeId) ?? []
        const allOrders = [...baseOrders, ...extraOrders].sort(
          (a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0)
        )

        const hub = base1Infrastructure.find((i) => i.type === "Hub")
        if (!hub) continue

        const waypoints = [
          { lng: hub.longitude, lat: hub.latitude },
          ...allOrders.map((o) => ({ lng: o.longitude, lat: o.latitude })),
          { lng: hub.longitude, lat: hub.latitude },
        ]

        const coordParam = waypoints.map((w) => `${w.lng},${w.lat}`).join(";")

        try {
          const coords = await fetchOsrmRoute(coordParam)
          if (!coords) continue
          const source = map.getSource(layerId) as any
          source.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          })

          // Update stored coords and orders
          routeCoordinatesRef.current.set(routeId, coords)
          routeOrdersRef.current.set(routeId, allOrders)
        } catch (err) {
          console.error(`[RouteMap] OSRM update error for ${routeId}:`, err)
        }
      }
    })()
  }, [addedLoadOrders, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── update route line styles ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    routeLayerIdsRef.current.forEach((layerId) => {
      if (!map.getLayer(layerId)) return
      // routeId is everything after "route-"
      const routeId = layerId.replace(/^route-/, "")
      const originalColor = findOriginalColor(routeId)
      if (!originalColor) return

      const isInWorkspace = selectedRouteIds.includes(routeId)
      const isHighlighted =
        checkedRouteIds.includes(routeId) ||
        hoveredWorkspaceRouteId === routeId ||
        expandedRouteIds.includes(routeId)
      const isFilterMatch = filterHighlightedRouteIds.length > 0
        ? filterHighlightedRouteIds.includes(routeId)
        : null // null = filter not active

      applyRouteStyle(map, layerId, originalColor, {
        routeLineDisplay,
        reducedOpacity,
        isWorkspaceOpen,
        isInWorkspace,
        isHighlighted,
        isFilterMatch,
      })
    })
  }, [selectedRouteIds, checkedRouteIds, hoveredWorkspaceRouteId, expandedRouteIds, routeLineDisplay, reducedOpacity, isWorkspaceOpen, mapReady, filterHighlightedRouteIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── order pin hover from workspace ────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const container = mapContainer.current
    if (!container) return

    // Remove previous hover highlight — target the inner div (first child of .custom-map-pin)
    container.querySelectorAll<HTMLElement>(".workspace-pin-hovered").forEach((el) => {
      el.classList.remove("workspace-pin-hovered")
      const inner = el.querySelector<HTMLElement>(":scope > div")
      if (inner) {
        inner.style.transform = ""
        inner.style.filter = ""
      }
      const svgPath = el.querySelector<SVGPathElement>(".pin-wrapper svg path:first-child")
      if (svgPath) svgPath.style.fill = ""
    })

    if (!hoveredWorkspaceOrderId) return

    // Find the pin element by data-order-id
    const pinEl = container.querySelector<HTMLElement>(`[data-order-id="${hoveredWorkspaceOrderId}"]`)
    if (!pinEl) return

    pinEl.classList.add("workspace-pin-hovered")
    const inner = pinEl.querySelector<HTMLElement>(":scope > div")
    if (inner) {
      inner.style.transform = "translateY(-3px) scale(1.1)"
      inner.style.filter = "drop-shadow(0 2px 8px rgba(0,0,0,0.4))"
    }
    // Change pin color — same as CSS :hover fill
    const svgPath = pinEl.querySelector<SVGPathElement>(".pin-wrapper svg path:first-child")
    if (svgPath) svgPath.style.fill = "#A1A1AA"
  }, [hoveredWorkspaceOrderId, mapReady])

  // ── direction arrows when routes selected ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    // Remove all existing arrows
    arrowMarkersRef.current.forEach((markers) => markers.forEach((m) => m.remove()))
    arrowMarkersRef.current.clear()

    selectedRouteIds.forEach((routeId) => {
      const coords = routeCoordinatesRef.current.get(routeId)
      const color = findOriginalColor(routeId) ?? "#FFFFFF"
      if (!coords) return

      const markers = createArrowMarkers(mbRef.current, coords, color, mapRef.current)
      markers.forEach((m: any) => m.addTo(mapRef.current!))
      arrowMarkersRef.current.set(routeId, markers)
    })
  }, [selectedRouteIds, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── helpers inside component scope ──────────────────────────────────────

  function findOriginalColor(routeId: string): string | undefined {
    // Try direct match first, then sanitized id
    return (
      routeColorsRef.current.get(routeId) ??
      routeColorsRef.current.get(routeId.replace(/[^a-zA-Z0-9_-]/g, "_"))
    )
  }

  // ─── layout ──────────────────────────────────────────────────────────────

  const rightOffset = isWorkspaceOpen ? "560px" : isRouteListOpen || isCreatePanelOpen ? "450px" : "44px"

  return (
    <>
      <div
        ref={mapContainer}
        className="absolute inset-0 h-full transition-all duration-300 ease-in-out"
        style={{ right: rightOffset }}
      />
      <style jsx global>{`
        /* ── cluster bubbles — disabled, will be rebuilt ──
        .cluster-marker { ... }
        ── end cluster styles ── */

        /* ── order pin hover animation ── */
        .custom-map-pin {
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .custom-map-pin > div {
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .custom-map-pin:hover > div {
          transform: translateY(-3px) scale(1.1);
        }
        .custom-map-pin:hover .pin-wrapper svg {
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
        }
        .custom-infrastructure-icon {
          background: transparent;
          border: none;
          cursor: pointer;
        }

        /* ── route arrow markers ── */
        .route-arrow-marker {
          pointer-events: none;
        }
        .route-arrow-marker svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }

        /* ── Mapbox popup overrides (transparent wrapper, custom HTML inside) ── */
        .rb-pin-popup .mapboxgl-popup-content,
        .rb-route-popup .mapboxgl-popup-content,
        .rb-infra-popup .mapboxgl-popup-content {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .rb-pin-popup .mapboxgl-popup-tip,
        .rb-route-popup .mapboxgl-popup-tip {
          display: none !important;
        }
        .rb-infra-popup .mapboxgl-popup-content {
          padding: 0 !important;
        }
        .rb-infra-popup .mapboxgl-popup-close-button {
          color: #A3A3A3;
          font-size: 18px;
          top: 4px;
          right: 8px;
        }
        .mapboxgl-popup { max-width: none !important; }

        /* ── hide default Mapbox attribution (we use custom) ── */
        .mapboxgl-ctrl-logo { display: none !important; }

        /* ── map pin hover state (from original globals.css) ── */
        .custom-map-pin .pin-wrapper:hover svg path:first-child {
          fill: #A1A1AA;
        }
      `}</style>
    </>
  )
}

// ─── pure helpers (outside component) ───────────────────────────────────────

interface RouteStyleOptions {
  routeLineDisplay: string
  reducedOpacity: boolean
  isWorkspaceOpen: boolean
  isInWorkspace: boolean
  isHighlighted: boolean
  isFilterMatch?: boolean | null // null = filter not active
}

function applyRouteStyle(
  map: any,
  layerId: string,
  originalColor: string,
  opts: RouteStyleOptions,
) {
  const { routeLineDisplay, reducedOpacity, isWorkspaceOpen, isInWorkspace, isHighlighted, isFilterMatch } = opts

  // Filter-highlight mode: matching routes pop, non-matching routes fade to near-invisible.
  if (isFilterMatch !== null && isFilterMatch !== undefined) {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, "line-color", originalColor)
      map.setPaintProperty(layerId, "line-width", isFilterMatch ? 5 : 2)
      map.setPaintProperty(layerId, "line-opacity", isFilterMatch ? 1 : 0.08)
    }
    return
  }
  let color = DEFAULT_GREY
  let opacity = 0.8
  let weight = 3

  if (routeLineDisplay === "grayscale") {
    if (isWorkspaceOpen && isInWorkspace) {
      color = originalColor
      // Highlighted (hover / expanded / checked) → full color + thicker line
      // Idle → dim so hover is clearly visible
      opacity = isHighlighted ? 1 : 0.25
      weight = isHighlighted ? 5 : 3
    } else if (isWorkspaceOpen) {
      // In workspace but not this route → very dim grey
      color = DEFAULT_GREY
      opacity = 0.15
    } else {
      color = DEFAULT_GREY
      opacity = 0.8
    }
  } else {
    // colored mode
    color = originalColor
    if (isWorkspaceOpen && isInWorkspace) {
      // Highlighted → full opacity + thicker line; idle → dim
      opacity = isHighlighted ? 1 : 0.25
      weight = isHighlighted ? 5 : 3
    } else if (isWorkspaceOpen) {
      opacity = reducedOpacity ? 0.1 : 0.15
    } else {
      opacity = reducedOpacity ? 0.3 : 1
    }
  }

  if (map.getLayer(layerId)) {
    map.setPaintProperty(layerId, "line-color", color)
    map.setPaintProperty(layerId, "line-width", weight)
    map.setPaintProperty(layerId, "line-opacity", opacity)
  }
}

function createArrowMarkers(
  mapboxgl: any,
  coords: [number, number][],
  color: string,
  map: any,
): any[] {
  if (!coords || coords.length < 2) return []

  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI

  // Place arrows at fixed percentages of the route (25%, 50%, 75%)
  // This guarantees they fall between stop pins, never on top of them
  const total = coords.length
  const percentages = total < 20 ? [0.5] : [0.25, 0.5, 0.75]

  const markers: any[] = []
  for (const pct of percentages) {
    const i = Math.round(pct * (total - 1))
    const prev = coords[Math.max(0, i - 6)]
    const next = coords[Math.min(total - 1, i + 6)]
    const point = coords[i]

    const lat1 = toRad(prev[1])
    const lat2 = toRad(next[1])
    const dLon = toRad(next[0] - prev[0])
    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360

    const el = document.createElement("div")
    el.className = "route-arrow-marker"
    el.style.width = "20px"
    el.style.height = "20px"
    el.style.pointerEvents = "none"
    el.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" style="transform:rotate(${bearing}deg)">
      <path d="M10 2 L17 14 L10 10 L3 14 Z" fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
    </svg>`

    const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
      .setLngLat(point)
    markers.push(marker)
  }

  return markers
}
