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
import { useSettings } from "@/contexts/settings-context"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockExtractionOrders, mockRoutes, shipTosWithoutOrders, buildShipToCoordLookup, buildCustomerCoordLookup } from "@/lib/mock-data"
import { CheckCircle2 } from "lucide-react"
import { ConflictAssignmentBanner } from "@/components/conflict-assignment-banner"
import { ConflictResolutionModal } from "@/components/conflict-resolution-modal"

export default function Home() {
const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showAllRoutes, setShowAllRoutes] = useState(true)
  const [isLassoDrawing, setIsLassoDrawing] = useState(false)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<ExtractionOrder[]>([])
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([])
  const [checkedRouteIds, setCheckedRouteIds] = useState<string[]>([])
  const [hoveredWorkspaceRouteId, setHoveredWorkspaceRouteId] = useState<string | null>(null)
  const [expandedRouteIds, setExpandedRouteIds] = useState<string[]>([])
  const [hoveredWorkspaceOrderId, setHoveredWorkspaceOrderId] = useState<string | null>(null)
  const [addedLoadOrders, setAddedLoadOrders] = useState<Record<string, ExtractionOrder[]>>({})
  const [addedDeliveryOrders, setAddedDeliveryOrders] = useState<Record<string, ExtractionOrder[]>>({})
  const [reorderedRoutes, setReorderedRoutes] = useState<Record<string, string[]>>({})
  // When a shipto-no-order pin's "Create Order" button is clicked, the route-map fires a
  // window global. We translate that into a state value here, and pass it down to the workspace
  // sheet so the modal can open prefilled with this shipto. Cleared when the modal closes.
  const [createOrderPrefillShipToId, setCreateOrderPrefillShipToId] = useState<string | null>(null)

  // Modal 3 (side sheet) state — workspace is collapsed, Create Order floats to the right.
  const [isCreateOrderSideSheetOpen, setIsCreateOrderSideSheetOpen] = useState(false)
  const [modal3UnassignedOrders, setModal3UnassignedOrders] = useState<ExtractionOrder[]>([])

  // Driver conflict banner — Mark Ruffalo (routes 1+2) and Kyle Reese (routes 3+4) each have 2 active routes.
  // Gated behind the `showDriverConflict` prototype flag (Settings → Driver Multi-Route Conflict).
  const { showDriverConflict } = useSettings()
  const [conflictOrdersRemaining, setConflictOrdersRemaining] = useState(5)
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false)
  // Flipping the flag on re-arms the full scenario so it can be re-demoed.
  useEffect(() => {
    if (showDriverConflict) setConflictOrdersRemaining(5)
  }, [showDriverConflict])
  const isConflictBannerVisible = showDriverConflict && conflictOrdersRemaining > 0
  const BANNER_HEIGHT = 95
  const topOffset = isConflictBannerVisible ? BANNER_HEIGHT : 0

  // Top-nav Create Order trigger — incrementing this counter opens the Create Order modal.
  const [openCreateOrderTrigger, setOpenCreateOrderTrigger] = useState(0)
  // Mirrors the workspace's isCreateOrderModalOpen — used to disable the top-nav button while open.
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false)

  // Filter-driven map zoom — Customer and ShipTo selections
  const [appliedFilterCustomers, setAppliedFilterCustomers] = useState<Set<string>>(new Set())
  const [appliedFilterShipTos, setAppliedFilterShipTos] = useState<Set<string>>(new Set())

  // Filter state for Truck, Driver, Product
  const [appliedFilterTrucks, setAppliedFilterTrucks] = useState<Set<string>>(new Set())
  const [appliedFilterDrivers, setAppliedFilterDrivers] = useState<Set<string>>(new Set())
  const [appliedFilterProducts, setAppliedFilterProducts] = useState<Set<string>>(new Set())

  const shipToCoordLookup = useMemo(() => buildShipToCoordLookup(), [])
  const customerCoordLookup = useMemo(() => buildCustomerCoordLookup(), [])

  useEffect(() => {
    const fitFn = (window as any).__fitToShipTos
    if (typeof fitFn !== "function") return

    // ShipTo selection takes priority — zoom to exactly those shiptos.
    if (appliedFilterShipTos.size > 0) {
      const coords = Array.from(appliedFilterShipTos)
        .map((id) => shipToCoordLookup.get(id))
        .filter((c): c is { lat: number; lng: number } => !!c)
      if (coords.length > 0) fitFn(coords)
      return
    }

    // Customer selection — collect all shiptos for the selected customers.
    if (appliedFilterCustomers.size > 0) {
      const coords: { lat: number; lng: number }[] = []
      for (const cId of appliedFilterCustomers) {
        const pts = customerCoordLookup.get(cId) ?? []
        coords.push(...pts)
      }
      if (coords.length > 0) fitFn(coords)
    }
  }, [appliedFilterCustomers, appliedFilterShipTos, shipToCoordLookup, customerCoordLookup])

  useEffect(() => {
    if (typeof window === "undefined") return
    ;(window as any).__openCreateOrderForShipTo = (shipToId: string) => {
      setCreateOrderPrefillShipToId(shipToId)
      setIsWorkspaceOpen(true)
    }
    return () => {
      delete (window as any).__openCreateOrderForShipTo
    }
  }, [])
  const [entityVisibility, setEntityVisibility] = useState<MapEntityVisibility>({
    shipTosWithOrders: true,
    routeSequence: true,
    shipTosWithoutOrders: true,
    hub: true,
    bulkPlant: true,
    warehouse: true,
    terminals: true,
  })

  // Merge static mock orders with workspace-created orders so the map sees freshly added
  // pins + routes can redraw with the new stop. Routed adds carry routeId + routeSequence;
  // unassigned adds don't, so they show as Unassigned pins on the map.
  const filteredOrders = useMemo(() => {
    const routedAdds = Object.values(addedDeliveryOrders).flat()
    return [...mockExtractionOrders, ...routedAdds, ...modal3UnassignedOrders]
  }, [addedDeliveryOrders, modal3UnassignedOrders])

  const selectedUnassignedIds = useMemo(
    () => selectedOrders.filter(o => !o.routeId).map(o => o.id),
    [selectedOrders]
  )


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

    // Refit the map so the selected orders are visible alongside the 560px workspace sheet
    const allSelectedOrders = [...selectedOrders, ...ordersToAdd]
    const coords = allSelectedOrders
      .filter((o) => o.latitude && o.longitude)
      .map((o) => ({ lat: o.latitude, lng: o.longitude }))
    if (coords.length > 0 && (window as any).__fitToShipTos) {
      setTimeout(() => (window as any).__fitToShipTos(coords), 100)
    }
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

  const handleOrderPinClick = (order: ExtractionOrder) => {
    if (order.routeId) {
      // Scheduled order → add the whole route
      handleRouteClick(order.routeId)
    } else {
      // Unassigned order → add just this order
      if (selectedOrders.some((o) => o.id === order.id)) return
      setSelectedOrders((prev) => [...prev, order])
      setIsWorkspaceOpen(true)
      setIsFilterOpen(false)
    }
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
    <main className="relative w-full h-screen overflow-hidden">
      <MapHeader
        onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onCreateOrderClick={() => {
          setIsWorkspaceOpen(true)
          setOpenCreateOrderTrigger((n) => n + 1)
        }}
        isCreateOrderOpen={isCreateOrderModalOpen}
      />

      {isConflictBannerVisible && (
        <ConflictAssignmentBanner
          orderCount={conflictOrdersRemaining}
          onReviewAndAssign={() => setIsConflictModalOpen(true)}
        />
      )}

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
          onOrderPinClick={handleOrderPinClick}
  selectedRouteIds={selectedRouteIds}
  checkedRouteIds={checkedRouteIds}
  hoveredWorkspaceRouteId={hoveredWorkspaceRouteId}
  expandedRouteIds={expandedRouteIds}
  hoveredWorkspaceOrderId={hoveredWorkspaceOrderId}
  isWorkspaceOpen={isWorkspaceOpen}
  workspaceWidth={560}
  isCreateOrderSideSheetOpen={isCreateOrderSideSheetOpen}
  addedLoadOrders={addedLoadOrders}
  selectedUnassignedOrderIds={selectedUnassignedIds}
  reorderedRoutes={reorderedRoutes}
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
          isCreateOrderSideSheetOpen={isCreateOrderSideSheetOpen}
          entityVisibility={entityVisibility}
          onEntityVisibilityChange={setEntityVisibility}
          topOffset={topOffset}
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
        onHoveredOrderChange={setHoveredWorkspaceOrderId}
        onAddedLoadOrdersChange={setAddedLoadOrders}
        onAddedDeliveryOrdersChange={setAddedDeliveryOrders}
        onReorderedRoutesChange={setReorderedRoutes}
        onAddedUnassignedOrdersChange={setModal3UnassignedOrders}
        onAddSelectedRouteId={(id) => setSelectedRouteIds((prev) => [...new Set([...prev, id])])}
        createOrderPrefillShipToId={createOrderPrefillShipToId}
        onClearCreateOrderPrefillShipToId={() => setCreateOrderPrefillShipToId(null)}
        initialExpandedRouteIds={[]}
        onExpandedRouteIdsChange={setExpandedRouteIds}
        onCreateOrderSideSheetOpen={() => { setIsWorkspaceOpen(false); setIsCreateOrderSideSheetOpen(true) }}
        onCreateOrderSideSheetClose={() => { setIsCreateOrderSideSheetOpen(false); setIsWorkspaceOpen(true) }}
        externalUnassignedOrders={modal3UnassignedOrders}
        openCreateOrderTrigger={openCreateOrderTrigger}
        onCreateOrderModalOpenChange={setIsCreateOrderModalOpen}
        topOffset={topOffset}
        onShowToast={(driverName) => {
          setToastMessage(`Load Order added to ${driverName}'s Route successfully`)
          setTimeout(() => setToastMessage(null), 5000)
        }}
        onShowMessage={(message) => {
          setToastMessage(message)
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

      {!isFilterOpen && <FilterSheetCollapsed onExpand={() => setIsFilterOpen(true)} appliedFiltersCount={2} topOffset={topOffset} />}
      <FilterSideSheet
        isOpen={isFilterOpen}
        topOffset={topOffset}
        onClose={() => setIsFilterOpen(false)}
        totalRoutes={mockRoutes.length}
        totalOrders={filteredOrders.length}
        showAllRoutes={showAllRoutes}
        onShowAllRoutesChange={setShowAllRoutes}
        onCitySelectionChange={handleCitySelectionChange}
        onCustomerSelectionChange={setAppliedFilterCustomers}
        onShipToSelectionChange={setAppliedFilterShipTos}
        onTruckSelectionChange={(ids) => {
          setAppliedFilterTrucks(ids)
          if (ids.size === 0) return
          const matched = mockRoutes
            .filter((r: any) => r.truckId && ids.has(r.truckId))
            .map((r: any) => r.id)
          if (matched.length > 0) {
            setTimeout(() => (window as any).__flickerAndZoomToFilteredRoute?.(matched[0]), 50)
          }
        }}
        onDriverSelectionChange={setAppliedFilterDrivers}
        onProductSelectionChange={setAppliedFilterProducts}
      />


      {/* Collapsed tab — clicking opens workspace with empty state */}
      {!isWorkspaceOpen && (
        <RouteSheetCollapsed onExpand={() => setIsWorkspaceOpen(true)} hideExpandButton={isCreateOrderSideSheetOpen} topOffset={topOffset} />
      )}

      <CreateRoutePanel isOpen={isCreatePanelOpen} onClose={() => setIsCreatePanelOpen(false)} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <ConflictResolutionModal
        isOpen={isConflictModalOpen && showDriverConflict}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={(unassignedCount) => {
          setIsConflictModalOpen(false)
          setConflictOrdersRemaining(unassignedCount)
        }}
      />
    </main>
  )
}
