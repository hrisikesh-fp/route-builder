"use client"

import { useEffect, useRef, useState } from "react"
import type { ExtractionOrder, ShipTo } from "@/lib/mock-data"
import { mockRoutes } from "@/lib/mock-data"
import { renderMapPinToHTML } from "@/components/map-pin"
import { base1Infrastructure, clusterInfrastructure } from "@/lib/infrastructure-data"
import { renderInfrastructureMarkerHTML, buildTerminalTooltipHTML, type TerminalLoadInfo, type TerminalTooltipInfo } from "@/components/infrastructure-marker"
import { renderMapPinTooltip } from "@/components/map-pin-tooltip"
import { renderRouteLineTooltip } from "@/components/route-line-tooltip"
import { type TankThreshold } from "@/lib/routes-data"
import type { MapEntityVisibility } from "@/components/map-controls"
import { useSettings } from "@/contexts/settings-context"

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
  selectedRouteIds?: string[]
  checkedRouteIds?: string[]
  hoveredWorkspaceRouteId?: string | null
  isWorkspaceOpen?: boolean
  addedLoadOrders?: Record<string, ExtractionOrder[]>
}

// Fallback route colors if route not found in mockRoutes
const ROUTE_COLORS = ["#C084FC", "#FB923C", "#3B82F6", "#EC4899", "#EF4444", "#4ADE80"]
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
  selectedRouteIds = [],
  checkedRouteIds = [],
  hoveredWorkspaceRouteId = null,
  isWorkspaceOpen = false,
  addedLoadOrders = {},
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

  const selectedRouteIdsRef = useRef<string[]>(selectedRouteIds)
  const onRouteClickRef = useRef(onRouteClick)

  const [currentZoom, setCurrentZoom] = useState(9)
  const [mapReady, setMapReady] = useState(false)

  const settingsCtx = useSettings()
  const routeLineDisplay = settingsCtx.routeLineDisplayValue
  const showBadgesValue = settingsCtx.showBadgesValue
  const reducedOpacity = settingsCtx.reducedOpacityValue

  // ── keep refs in sync ────────────────────────────────────────────────────
  useEffect(() => { selectedRouteIdsRef.current = selectedRouteIds }, [selectedRouteIds])
  useEffect(() => { onRouteClickRef.current = onRouteClick }, [onRouteClick])

  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).__v0MapSettings = {
        routeLineDisplay,
        reducedOpacity,
        isWorkspaceOpen,
        checkedRouteIds,
        hoveredWorkspaceRouteId,
      }
    }
  }, [routeLineDisplay, reducedOpacity, isWorkspaceOpen, checkedRouteIds, hoveredWorkspaceRouteId])

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

    ;(window as any).__zoomToRoute = (routeId: string) => {
      const bounds = routeBoundsRef.current.get(routeId)
      if (bounds && mapRef.current) {
        // Right padding accounts for 560px workspace panel so route stays centred in visible area
        mapRef.current.fitBounds(bounds, {
          padding: { top: 80, right: 640, bottom: 80, left: 80 },
          maxZoom: 13,
          duration: 800,
        })
      }
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

    // Skip load (L) and transfer (T) orders — they're co-located with infrastructure markers
    orders.filter((order) => order.orderType !== "L" && order.orderType !== "T").forEach((order) => {
      const threshold = getTankThreshold(order.currentLevel)
      const isActive = order.routeId ? selectedRouteIds.includes(order.routeId) : false
      const showBadges = isActive || showBadgesValue
      const showSeq = showBadges && entityVisibility.routeSequence

      const el = document.createElement("div")
      el.className = "custom-map-pin"
      el.setAttribute("data-order-id", order.id)
      el.innerHTML = renderMapPinToHTML(
        threshold,
        showSeq ? order.routeSequence : undefined,
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
          driverId: order.driverId,
          currentLevel: order.currentLevel,
          volume: order.volume,
          tankSize: order.tankSize,
        })
        activePopupRef.current = new mbRef.current.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "rb-pin-popup",
        })
          .setLngLat([order.longitude, order.latitude])
          .setHTML(html)
          .addTo(mapRef.current!)
      })
      el.addEventListener("mouseleave", () => {
        activePopupRef.current?.remove()
        activePopupRef.current = null
      })

      // Click → open route workspace
      el.addEventListener("click", () => {
        if (order.driverId && onRouteClickRef.current) {
          onRouteClickRef.current(order.driverId)
        }
      })

      const marker = new mbRef.current.Marker({ element: el, anchor: "bottom" })
        .setLngLat([order.longitude, order.latitude])
        .addTo(mapRef.current!)
      allOrderMarkersRef.current.push(marker)
      orderMarkerMapRef.current.set(order.id, marker)
      orderDataMapRef.current.set(order.id, { order, tankThreshold: threshold })
    })
  }, [orders, mapReady, selectedRouteIds, entityVisibility.shipTosWithOrders, entityVisibility.routeSequence, showBadgesValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── update pin icons when route selection changes (no re-cluster) ─────────
  useEffect(() => {
    if (!mapReady) return
    orderDataMapRef.current.forEach(({ order, tankThreshold }, orderId) => {
      const marker = orderMarkerMapRef.current.get(orderId)
      if (!marker) return
      const el = marker.getElement()
      const isActive = order.routeId ? selectedRouteIds.includes(order.routeId) : false
      const showBadges = isActive || showBadgesValue
      const showSeq = showBadges && entityVisibility.routeSequence
      el.innerHTML = renderMapPinToHTML(
        tankThreshold,
        showSeq ? order.routeSequence : undefined,
        showBadges && !order.routeId && order.status === "pending",
        false, false, false, isActive,
      )
    })
  }, [selectedRouteIds, showBadgesValue, entityVisibility.routeSequence, mapReady])

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

    shipTosWithoutOrders.forEach((shipTo) => {
      const el = document.createElement("div")
      el.className = "custom-map-pin shipto-only"
      el.setAttribute("data-shipto-id", shipTo.id)
      el.innerHTML = renderMapPinToHTML("green", undefined, false, true, false, false, false)

      const tooltipHTML = `
        <div style="background:#18181B;border:1px solid #27272A;border-radius:8px;padding:12px;min-width:180px;">
          <div style="font-weight:600;color:#FAFAFA;margin-bottom:4px;">${shipTo.customerName}</div>
          <div style="font-size:12px;color:#A1A1AA;">${shipTo.shipToAddress}</div>
          <div style="font-size:11px;color:#71717A;margin-top:6px;">No orders scheduled</div>
        </div>`

      el.addEventListener("mouseenter", () => {
        activePopupRef.current?.remove()
        activePopupRef.current = new mbRef.current.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "rb-pin-popup",
        })
          .setLngLat([shipTo.longitude, shipTo.latitude])
          .setHTML(tooltipHTML)
          .addTo(mapRef.current!)
      })
      el.addEventListener("mouseleave", () => {
        activePopupRef.current?.remove()
        activePopupRef.current = null
      })

      const marker = new mbRef.current.Marker({ element: el, anchor: "bottom" })
        .setLngLat([shipTo.longitude, shipTo.latitude])
        .addTo(mapRef.current!)
      shipToMarkersRef.current.push(marker)
    })
  }, [mapReady, currentZoom, shipTosWithoutOrders, entityVisibility.shipTosWithoutOrders])

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
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordParam}?overview=full&geometries=geojson`

        try {
          const res = await fetch(osrmUrl)
          const data = await res.json()
          if (data.code !== "Ok" || !data.routes?.[0]) {
            console.warn(`[RouteMap] OSRM failed for ${routeId}:`, data.message)
            colorIndex++
            continue
          }

          const coords: [number, number][] = data.routes[0].geometry.coordinates
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
            const isHighlighted = isChecked || isHovered
            applyRouteStyle(map, layerId, originalColor, {
              routeLineDisplay: settings.routeLineDisplay ?? "grayscale",
              reducedOpacity: settings.reducedOpacity ?? false,
              isWorkspaceOpen: settings.isWorkspaceOpen ?? false,
              isInWorkspace,
              isHighlighted,
            })
          })

          map.on("click", layerId, () => onRouteClickRef.current?.(routeId))

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
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordParam}?overview=full&geometries=geojson`

        try {
          const res = await fetch(osrmUrl)
          const data = await res.json()
          if (data.code !== "Ok" || !data.routes?.[0]) continue

          const coords: [number, number][] = data.routes[0].geometry.coordinates
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
      const isHighlighted = checkedRouteIds.includes(routeId) || hoveredWorkspaceRouteId === routeId

      applyRouteStyle(map, layerId, originalColor, {
        routeLineDisplay,
        reducedOpacity,
        isWorkspaceOpen,
        isInWorkspace,
        isHighlighted,
      })
    })
  }, [selectedRouteIds, checkedRouteIds, hoveredWorkspaceRouteId, routeLineDisplay, reducedOpacity, isWorkspaceOpen, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

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
}

function applyRouteStyle(
  map: any,
  layerId: string,
  originalColor: string,
  opts: RouteStyleOptions,
) {
  const { routeLineDisplay, reducedOpacity, isWorkspaceOpen, isInWorkspace, isHighlighted } = opts
  let color = DEFAULT_GREY
  let opacity = 0.8
  let weight = 3

  if (routeLineDisplay === "grayscale") {
    if (isWorkspaceOpen && isInWorkspace) {
      color = originalColor
      opacity = isHighlighted ? 1 : 0.3
      weight = isHighlighted ? 3.5 : 3
    } else {
      color = DEFAULT_GREY
      opacity = 0.8
    }
  } else {
    // colored
    color = originalColor
    if (isWorkspaceOpen && isInWorkspace) {
      opacity = isHighlighted ? 1 : 0.3
      weight = isHighlighted ? 3.5 : 3
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
