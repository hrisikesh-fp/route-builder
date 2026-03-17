"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { MapHeader } from "@/components/map-header"
import { MapControls, type MapEntityVisibility } from "@/components/map-controls"
const RouteMap = dynamic(
  () => import("@/components/route-map").then((m) => ({ default: m.RouteMap })),
  { ssr: false },
)
import { RouteSheetCollapsed } from "@/components/route-sheet-collapsed"
import { CreateRoutePanel } from "@/components/create-route-panel"
import { FilterSideSheet } from "@/components/filter-side-sheet"
import { FilterSheetCollapsed } from "@/components/filter-sheet-collapsed"
import { LassoWorkspaceSheet } from "@/components/lasso-workspace-sheet"
import { LassoCanvas } from "@/components/lasso-canvas"
import { SettingsModal } from "@/components/settings-modal"
import { SettingsProvider } from "@/contexts/settings-context"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockExtractionOrders, mockRoutes, shipTosWithoutOrders } from "@/lib/mock-data"
import { CheckCircle2 } from "lucide-react"

export default function Home() {
const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showAllRoutes, setShowAllRoutes] = useState(true)
  const [isLassoDrawing, setIsLassoDrawing] = useState(false)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<ExtractionOrder[]>(() =>
    mockExtractionOrders.filter((o) => o.routeId === "route-6")
  )
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(["route-6"])
  const [checkedRouteIds, setCheckedRouteIds] = useState<string[]>([])
  const [hoveredWorkspaceRouteId, setHoveredWorkspaceRouteId] = useState<string | null>(null)
  const [addedLoadOrders, setAddedLoadOrders] = useState<Record<string, ExtractionOrder[]>>({})
  const [entityVisibility, setEntityVisibility] = useState<MapEntityVisibility>({
    shipTosWithOrders: true,
    routeSequence: true,
    shipTosWithoutOrders: true,
    hub: true,
    bulkPlant: true,
    warehouse: true,
    terminals: true,
  })

  const filteredOrders = useMemo(() => {
    return mockExtractionOrders
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault()
        if (!isLassoDrawing) {
          setIsLassoDrawing(true)
          setIsWorkspaceOpen(true)
        } else {
          setIsLassoDrawing(false)
        }
      }
      if (e.key === "Escape" && isLassoDrawing) {
        setIsLassoDrawing(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLassoDrawing])

  const handleAddRoute = () => {
    console.log("[v0] Add route clicked")
    setIsCreatePanelOpen(true)
  }

  const handleZoomIn = () => {
    if ((window as any).__mapControls) {
      ;(window as any).__mapControls.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if ((window as any).__mapControls) {
      ;(window as any).__mapControls.zoomOut()
    }
  }

  const handleResetNorth = () => {
    if ((window as any).__mapControls) {
      ;(window as any).__mapControls.resetNorth()
    }
  }

  const handleLocate = () => {
    if ((window as any).__mapControls) {
      ;(window as any).__mapControls.locate()
    }
  }

  const handleCitySelectionChange = (cityName: string | null) => {
    console.log("[v0] handleCitySelectionChange called with:", cityName)
    console.log("[v0] __zoomToCity function exists:", !!(window as any).__zoomToCity)
    if (cityName && (window as any).__zoomToCity) {
      console.log("[v0] City selected, triggering zoom:", cityName)
      ;(window as any).__zoomToCity(cityName)
    } else if (!cityName) {
      console.log("[v0] City selection cleared")
    } else {
      console.log("[v0] __zoomToCity function not available yet")
    }
  }

  const handleLassoToggle = () => {
    console.log("[v0] Lasso toggle clicked, current state:", isLassoDrawing)
    if (!isLassoDrawing) {
      // Turning lasso on
      setIsLassoDrawing(true)
      setIsWorkspaceOpen(true)
      setIsFilterOpen(false)
      
    } else {
      setIsLassoDrawing(false)
      if (selectedOrders.length === 0) {
        setIsWorkspaceOpen(false)
      }
    }
  }

  const handleLassoSelection = (polygon: [number, number][]) => {
    console.log("[v0] Lasso selection completed with polygon points:", polygon.length)

    const markerElements = document.querySelectorAll("[data-order-id]")
    console.log("[v0] Total markers found:", markerElements.length)

    const selectedOrderIds = new Set<string>()
    const selectedRoutes = new Set<string>()

    markerElements.forEach((marker) => {
      const rect = marker.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      if (isPointInPolygon([centerX, centerY], polygon)) {
        const orderId = marker.getAttribute("data-order-id")
        if (orderId) {
          selectedOrderIds.add(orderId)
          const order = filteredOrders.find((o) => o.id === orderId)
          if (order?.routeId) {
            selectedRoutes.add(order.routeId)
          }
          console.log("[v0] Selected order:", orderId, "routeId:", order?.routeId)
        }
      }
    })

    console.log("[v0] Total orders selected:", selectedOrderIds.size)
    console.log("[v0] Routes involved:", Array.from(selectedRoutes))

    const ordersToAdd: ExtractionOrder[] = []
    selectedRoutes.forEach((routeId) => {
      const routeOrders = filteredOrders.filter((o) => o.routeId === routeId)
      routeOrders.forEach((order) => {
        if (!selectedOrders.some((o) => o.id === order.id)) {
          ordersToAdd.push(order)
        }
      })
    })

    selectedOrderIds.forEach((orderId) => {
      const order = filteredOrders.find((o) => o.id === orderId)
      if (order && !order.routeId && !selectedOrders.some((o) => o.id === order.id)) {
        ordersToAdd.push(order)
      }
    })

    console.log("[v0] Total new orders to add:", ordersToAdd.length)

    setSelectedOrders([...selectedOrders, ...ordersToAdd])
    setSelectedRouteIds(Array.from(new Set([...selectedRouteIds, ...Array.from(selectedRoutes)])))
  }

  const handleWorkspaceClose = () => {
    setIsLassoDrawing(false)
    setIsWorkspaceOpen(false)
    setSelectedOrders([])
    setSelectedRouteIds([])
    setCheckedRouteIds([])
    setHoveredWorkspaceRouteId(null)
  }

  const handleRouteClick = (routeId: string) => {
    // Check if this route is already selected
    if (selectedRouteIds.includes(routeId)) {
      return
    }

    // Get all orders for this route
    const routeOrders = filteredOrders.filter((o) => o.routeId === routeId)
    const newOrders = routeOrders.filter((o) => !selectedOrders.some((so) => so.id === o.id))

    setSelectedOrders((prev) => [...prev, ...newOrders])
    setSelectedRouteIds((prev) => [...new Set([...prev, routeId])])
    setIsWorkspaceOpen(true)
    setIsFilterOpen(false)
    

    // Zoom to the clicked route's bounds
    setTimeout(() => {
      if ((window as any).__zoomToRoute) {
        ;(window as any).__zoomToRoute(routeId)
      }
    }, 100)
  }

  const handleTerminalClick = (terminalId: string) => {
    // Find all routes that have at least one load order (they load from a terminal)
    const loadRouteIds = [...new Set(
      filteredOrders
        .filter((o) => o.orderType === "L" && o.routeId != null)
        .map((o) => o.routeId!)
    )]
    // Gather all orders belonging to those routes
    const routeOrders = filteredOrders.filter(
      (o) => o.routeId && loadRouteIds.includes(o.routeId)
    )
    // Also include unassigned load orders
    const unassignedLoadOrders = filteredOrders.filter(
      (o) => o.orderType === "L" && o.routeId === null
    )
    setSelectedOrders([...routeOrders, ...unassignedLoadOrders])
    setSelectedRouteIds(loadRouteIds)
    setIsWorkspaceOpen(true)
    setIsFilterOpen(false)
    
    // Zoom to terminal — offset left so it centres in the visible map (right 560px = workspace)
    setTimeout(() => {
      if ((window as any).__zoomToTerminal) {
        ;(window as any).__zoomToTerminal(terminalId)
      }
    }, 100)
  }

  const handleLassoEscape = () => {
    console.log("[v0] Lasso escape handler called")
    setIsLassoDrawing(false)
  }

  const isPointInPolygon = (point: [number, number], polygon: [number, number][]) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1]
      const xj = polygon[j][0],
        yj = polygon[j][1]

      const intersect = yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
      if (intersect) inside = !inside
    }
    return inside
  }

  return (
    <SettingsProvider>
    <main className="relative w-full h-screen overflow-hidden">
      <MapHeader 
        onFilterClick={() => setIsFilterOpen(!isFilterOpen)} 
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

<RouteMap
  orders={filteredOrders}
  shipTosWithoutOrders={shipTosWithoutOrders}
  entityVisibility={entityVisibility}
  onZoomIn={handleZoomIn}
  onZoomOut={handleZoomOut}
  onResetNorth={handleResetNorth}
  onLocate={handleLocate}
  isRouteListOpen={false}
  isCreatePanelOpen={isCreatePanelOpen}
  isLassoActive={isLassoDrawing}
  onRouteClick={handleRouteClick}
          onTerminalClick={handleTerminalClick}
  selectedRouteIds={selectedRouteIds}
  checkedRouteIds={checkedRouteIds}
  hoveredWorkspaceRouteId={hoveredWorkspaceRouteId}
  isWorkspaceOpen={isWorkspaceOpen}
  addedLoadOrders={addedLoadOrders}
  />

<MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetNorth={handleResetNorth}
          onLocate={handleLocate}
          isCreatePanelOpen={isCreatePanelOpen}
          isRouteListOpen={false}
          isLassoActive={isLassoDrawing}
          onLassoToggle={handleLassoToggle}
          isWorkspaceOpen={isWorkspaceOpen}
          entityVisibility={entityVisibility}
          onEntityVisibilityChange={setEntityVisibility}
        />

      <LassoCanvas
        isActive={isLassoDrawing}
        onSelectionComplete={handleLassoSelection}
        onEscapePressed={handleLassoEscape}
      />
      <LassoWorkspaceSheet
        isOpen={isWorkspaceOpen}
        onClose={handleWorkspaceClose}
        selectedOrders={selectedOrders}
        selectedRouteIds={selectedRouteIds}
        checkedRouteIds={checkedRouteIds}
        onCheckedRoutesChange={setCheckedRouteIds}
        hoveredRouteId={hoveredWorkspaceRouteId}
        onHoveredRouteChange={setHoveredWorkspaceRouteId}
        onAddedLoadOrdersChange={setAddedLoadOrders}
        onShowToast={(driverName) => {
          setToastMessage(`Load Order added to ${driverName}'s Route successfully`)
          setTimeout(() => setToastMessage(null), 5000)
        }}
      />

      {/* Success toast — fixed over map */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: 74,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            backgroundColor: "#10b981",
            border: "1px solid #333",
            borderRadius: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap",
            animation: "toast-slide-in 0.2s ease",
          }}
        >
          <CheckCircle2 size={20} color="#111" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111", fontFamily: "Geist, sans-serif" }}>
            {toastMessage}
          </span>
        </div>
      )}

      {!isFilterOpen && <FilterSheetCollapsed onExpand={() => setIsFilterOpen(true)} appliedFiltersCount={2} />}
      <FilterSideSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        totalRoutes={mockRoutes.length}
        totalOrders={filteredOrders.length}
        showAllRoutes={showAllRoutes}
        onShowAllRoutesChange={setShowAllRoutes}
        onCitySelectionChange={handleCitySelectionChange}
      />


      {/* Collapsed tab — clicking opens workspace with empty state */}
      {!isWorkspaceOpen && (
        <RouteSheetCollapsed onExpand={() => setIsWorkspaceOpen(true)} />
      )}

      <CreateRoutePanel isOpen={isCreatePanelOpen} onClose={() => setIsCreatePanelOpen(false)} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </main>
    </SettingsProvider>
  )
}
