"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { AppHeader, APP_HEADER_HEIGHT, type AppMode } from "@/components/app-header"
import { MetricsBar, METRICS_BAR_HEIGHT } from "@/components/metrics-bar"
import { MapControls, type MapEntityVisibility } from "@/components/map-controls"
const RouteMap = dynamic(
  () => import("@/components/route-map").then((m) => ({ default: m.RouteMap })),
  { ssr: false },
)
import { CreateRoutePanel } from "@/components/create-route-panel"
import { FilterSideSheet } from "@/components/filter-side-sheet"
import { LassoWorkspaceSheet } from "@/components/lasso-workspace-sheet"
import { LassoCanvas } from "@/components/lasso-canvas"
import { RoutingConfigOverlay } from "@/components/routing-config-panel"
import { useSettings } from "@/contexts/settings-context"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockExtractionOrders, mockRoutes, shipTosWithoutOrders, buildShipToCoordLookup, buildCustomerCoordLookup } from "@/lib/mock-data"
import { CheckCircle2 } from "lucide-react"
import { ConflictAssignmentBanner } from "@/components/conflict-assignment-banner"
import { ConflictResolutionModal } from "@/components/conflict-resolution-modal"
import { SideNavRail, SIDE_NAV_WIDTH, type LeftPanel } from "@/components/side-nav-rail"
import { ViewPanel, type ViewDock } from "@/components/view-panel"
import { RoutesPanel } from "@/components/routes-panel"
import { SettingsModal } from "@/components/settings-modal"
import {
  getLayoutTier, TIER_LABELS, LEFT_MIN, LEFT_MAX, RIGHT_MIN, RIGHT_MAX,
  MAP_MIN_WIDTH, MAP_MIN_HEIGHT, STACK_MIN_HEIGHT, MAX_LEFT_COLUMNS,
  MAP_COMPACT_WIDTH, CREATE_SHEET_WIDTH, CREATE_SHEET_MIN_WIDTH,
} from "@/lib/layout-tiers"
import { ReconciliationView } from "@/components/reconciliation-view"
import { ListFilter } from "lucide-react"
import type { ListRoute } from "@/components/list-route-card"
import { getRouteColor } from "@/lib/route-display"

export default function Home() {
const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  // Filters float over the map, opened from the Filters button at the map's top left
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)
  // 3D shell: Planning / Reconciliation, left input panel (rail), right output panel (Routes or Workspace)
  const [mode, setMode] = useState<AppMode>("planning")
  // Views (Orders, Trucks, Drivers) — several can be open. All open in the left column (stacked) so the
  // map keeps its height; above / below the map is a choice from each view's dock menu.
  const [openViews, setOpenViews] = useState<LeftPanel[]>(["orders"])
  const [viewDocks, setViewDocks] = useState<Record<LeftPanel, ViewDock>>({ orders: "left", trucks: "left", drivers: "left" })
  // Views collapsed to the rail because the right panel needed their room; they come back when it closes
  const [stashedViews, setStashedViews] = useState<LeftPanel[]>([])
  const [leftWidth, setLeftWidth] = useState(LEFT_MIN)
  const [bottomHeight, setBottomHeight] = useState(320)
  const [topHeight, setTopHeight] = useState(280)
  const [viewportHeight, setViewportHeight] = useState(900)
  const [viewportWidth, setViewportWidth] = useState(1440)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // Expand: one view, or the map, fills the whole planning area. Esc or the collapse icon puts it back.
  const [expanded, setExpanded] = useState<LeftPanel | "map" | null>(null)
  // Drag a view by its header to reorder it or move it to another dock (Claude Code style)
  type DropTarget = { dock: ViewDock; index: number; indicator: { left: number; top: number; width: number; height: number; zone: boolean } }
  const [drag, setDrag] = useState<{ view: LeftPanel; x: number; y: number; target: DropTarget | null } | null>(null)
  useEffect(() => {
    const update = () => { setViewportHeight(window.innerHeight); setViewportWidth(window.innerWidth) }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  const [isRoutesOpen, setIsRoutesOpen] = useState(false)
  const [isRoutingConfigOpen, setIsRoutingConfigOpen] = useState(false)
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

  // Optimization drawer open state — surfaced so map controls can shift left.
  const [isOptimizationDrawerOpen, setIsOptimizationDrawerOpen] = useState(false)
  const [modal3UnassignedOrders, setModal3UnassignedOrders] = useState<ExtractionOrder[]>([])

  // Driver conflict banner — Mark Ruffalo (routes 1+2) and Kyle Reese (routes 3+4) each have 2 active routes.
  // Gated behind the `showDriverConflict` prototype flag (Settings → Driver Multi-Route Conflict).
  const { showDriverConflict, unassignedOnly, createOrderModalView } = useSettings()
  const [isConflictBannerResolved, setIsConflictBannerResolved] = useState(false)
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false)
  // Flipping the flag on always re-arms a fresh banner so the scenario can be re-demoed.
  useEffect(() => {
    if (showDriverConflict) setIsConflictBannerResolved(false)
  }, [showDriverConflict])
  const isConflictBannerVisible = showDriverConflict && !isConflictBannerResolved
  // Orders needing reassignment in the conflict scenario (count was dropped when the banner moved to a resolved flag)
  const conflictOrdersRemaining = 5
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
  // Prototype data: "Unassigned orders only" (Settings, on by default) starts the day before any routes
  // exist, so every order of every type comes in unassigned.
  const baseOrders = useMemo<ExtractionOrder[]>(
    () => unassignedOnly
      ? mockExtractionOrders.map((o) => ({ ...o, routeId: undefined, routeSequence: undefined, driverId: undefined, status: "pending" as const }))
      : mockExtractionOrders,
    [unassignedOnly],
  )
  const filteredOrders = useMemo(() => {
    const routedAdds = Object.values(addedDeliveryOrders).flat()
    return [...baseOrders, ...routedAdds, ...modal3UnassignedOrders]
  }, [baseOrders, addedDeliveryOrders, modal3UnassignedOrders])
  // Switching the data set empties the workspace so it never holds routes that no longer exist
  const isFirstDataRender = useRef(true)
  useEffect(() => {
    if (isFirstDataRender.current) { isFirstDataRender.current = false; return }
    setSelectedOrders([])
    setSelectedRouteIds([])
    setCheckedRouteIds([])
  }, [unassignedOnly])

  const selectedUnassignedIds = useMemo(
    () => selectedOrders.filter(o => !o.routeId).map(o => o.id),
    [selectedOrders]
  )

  // True when every order on the map is already in the workspace: scheduled orders count via
  // their route, unassigned orders individually. Drives the Select All control's disabled state.
  const allOnMapInWorkspace = useMemo(() => {
    const routeSet = new Set(selectedRouteIds)
    const orderSet = new Set([...selectedOrders, ...modal3UnassignedOrders].map((o) => o.id))
    return (
      filteredOrders.length > 0 &&
      filteredOrders.every((o) => (o.routeId ? routeSet.has(o.routeId) : orderSet.has(o.id)))
    )
  }, [filteredOrders, selectedOrders, selectedRouteIds, modal3UnassignedOrders])

  // Routes shown in the List panel's Routes tab — every route with at least one order on the map
  const listRoutes = useMemo<ListRoute[]>(() => {
    const routeIdsOnMap = new Set(filteredOrders.map((o) => o.routeId).filter(Boolean))
    return mockRoutes
      .filter((r: any) => routeIdsOnMap.has(r.id))
      .map((r: any, i: number) => ({
        id: r.id,
        color: getRouteColor(r.id, i),
        driverName: r.driverName,
        truckId: r.truckId ?? null,
        isPublished: r.id !== "route-6", // same rule the workspace uses
      }))
  }, [filteredOrders])

  // Routes and Workspace share the right edge: one at a time, both always reachable from the metrics bar
  useEffect(() => {
    if (isWorkspaceOpen) setIsRoutesOpen(false)
  }, [isWorkspaceOpen])

  // ── 3D shell layout (Figma 9175:88966; rules in lib/layout-tiers.ts) ──
  const INSET = 4
  const GAP = 4
  // Expanded (a view or the map) hides everything else in Planning: metrics bar, rail, other panels.
  // Only the app header stays, like the app chrome around an expanded pane in Claude Code.
  const bodyTop = APP_HEADER_HEIGHT + topOffset + (mode === "planning" && !expanded ? METRICS_BAR_HEIGHT : 0)
  const isRightPanelOpen = isWorkspaceOpen || isRoutesOpen
  // While something is expanded the right panel is covered (map) or sits underneath (view); state is kept
  const isRightPanelShown = isRightPanelOpen && !expanded
  const tier = getLayoutTier(viewportWidth)
  const LEFT_START = INSET + SIDE_NAV_WIDTH + INSET // where the left column begins, right of the rail

  // Left views push the map while it keeps MAP_MIN_WIDTH; otherwise they float over it.
  // Room = how wide column 1 can be with the right panel at its minimum and the map at its minimum.
  const leftLayout = (views: LeftPanel[]) => {
    const left = views.filter((v) => viewDocks[v] === "left")
    const room = (cols: number) =>
      viewportWidth - LEFT_START - GAP - (isRightPanelOpen ? RIGHT_MIN : 0) - INSET - MAP_MIN_WIDTH - (cols === 2 ? LEFT_MIN + GAP : 0)
    const cols = MAX_LEFT_COLUMNS[tier] >= 2 && left.length >= 2 && room(2) >= LEFT_MIN ? 2 : 1
    const floats = left.length > 0 && (tier === "compact" || room(cols) < LEFT_MIN)
    return { left, cols, floats, room: room(cols) }
  }
  const { left: leftViews, cols: leftCols, floats: leftFloats, room: leftRoom } = leftLayout(openViews)
  const leftDocked = leftViews.length > 0 && !leftFloats && expanded !== "map"
  // Column 1 opens at LEFT_MIN; the user drags it wider (up to LEFT_MAX) while there is room.
  // When room shrinks (right panel opens, window narrows) it gives width back before it floats.
  const col1Max = leftFloats ? LEFT_MAX : Math.max(LEFT_MIN, Math.min(LEFT_MAX, leftRoom))
  const col1W = Math.min(Math.max(leftWidth, LEFT_MIN), col1Max)
  const col1Views = leftDocked && leftCols === 2 ? leftViews.slice(0, 1) : leftViews
  const col2Views = leftDocked && leftCols === 2 ? leftViews.slice(1) : []
  const leftTotal = leftDocked ? col1W + (col2Views.length ? GAP + LEFT_MIN : 0) : 0
  const colLeft = leftDocked ? LEFT_START + leftTotal + GAP : expanded ? INSET : INSET + SIDE_NAV_WIDTH
  // Right panel: RIGHT_MIN at least, grows to the tier's max while the map keeps its minimum
  const rightW = isRightPanelShown
    ? Math.max(RIGHT_MIN, Math.min(RIGHT_MAX[tier], viewportWidth - colLeft - INSET - MAP_MIN_WIDTH))
    : 0
  const mapRight = rightW + INSET
  const mapWidth = Math.max(0, viewportWidth - colLeft - mapRight)

  const topViews = expanded === "map" ? [] : openViews.filter((v) => viewDocks[v] === "top")
  const bottomViews = expanded === "map" ? [] : openViews.filter((v) => viewDocks[v] === "bottom")
  // Centre column = map plus anything docked above / below it; the map keeps MAP_MIN_HEIGHT
  const colTop = bodyTop + INSET
  const colHeight = Math.max(0, viewportHeight - colTop - INSET)
  const DOCK_MIN_HEIGHT = 140
  const topH = topViews.length ? Math.max(0, Math.min(topHeight, colHeight - MAP_MIN_HEIGHT - (bottomViews.length ? DOCK_MIN_HEIGHT + GAP : 0))) : 0
  const bottomH = bottomViews.length ? Math.max(0, Math.min(bottomHeight, colHeight - MAP_MIN_HEIGHT - (topH ? topH + GAP : 0))) : 0
  const mapLeft = colLeft
  const mapTop = colTop + (topH ? topH + GAP : 0)
  const mapBottomInset = INSET + (bottomH ? bottomH + GAP : 0)
  // Floating views sit inside the map, under the Filters button (same spot the Filters panel uses)
  const floatLeft = mapLeft + 8
  const floatW = Math.min(col1W, Math.max(LEFT_MIN, mapWidth - 16))
  // Create Order side sheet: inside the map region on the right; the map controls move to its left
  const isCreateSheetOpen = isCreateOrderModalOpen && createOrderModalView === "modal3"
  const MAP_CONTROLS_W = 32 + 16
  const createSheetW = Math.max(CREATE_SHEET_MIN_WIDTH, Math.min(CREATE_SHEET_WIDTH, mapWidth - 16 - MAP_CONTROLS_W))
  const createSheetBounds = { top: mapTop, left: mapLeft, right: mapRight, bottom: mapBottomInset, width: createSheetW }
  // Free map = what is left of the map beside the Create Order sheet; when it is narrow, Filters goes icon-only
  const freeMapWidth = mapWidth - (isCreateSheetOpen ? createSheetW + 8 : 0)
  const isFilterCompact = freeMapWidth < MAP_COMPACT_WIDTH
  const unassignedCount = filteredOrders.filter((o) => !o.routeId).length
  const totalGallons = filteredOrders.filter((o) => o.orderType !== "L").reduce((sum, o) => sum + (o.volume ?? 0), 0)

  // Rail toggles a view; it reopens where it was last docked. A floating view and the Filters
  // panel share the same spot on the map, so opening one closes the other.
  const handleRailSelect = (view: LeftPanel) => {
    setExpanded(null)
    setStashedViews((cur) => cur.filter((v) => v !== view))
    if (openViews.includes(view)) {
      setOpenViews((cur) => cur.filter((v) => v !== view))
      return
    }
    const next = [...openViews, view]
    if (leftLayout(next).floats) setIsFilterOpen(false)
    setOpenViews(next)
  }
  const closeView = (view: LeftPanel) => {
    setExpanded((cur) => (cur === view ? null : cur))
    setStashedViews((cur) => cur.filter((v) => v !== view))
    setOpenViews((cur) => cur.filter((v) => v !== view))
  }
  const dockView = (view: LeftPanel, dock: ViewDock) => setViewDocks((cur) => ({ ...cur, [view]: dock }))
  const handleFilterToggle = () => {
    if (!isFilterOpen && leftFloats) setOpenViews((cur) => cur.filter((v) => !leftViews.includes(v)))
    setIsFilterOpen((open) => !open)
  }

  // Opening Routes / Workspace: if the left views would no longer fit beside it, they collapse to the
  // rail (reopen there, floating). Closing the right panel brings them back docked.
  const prevRightOpen = useRef(isRightPanelOpen)
  useEffect(() => {
    const wasOpen = prevRightOpen.current
    prevRightOpen.current = isRightPanelOpen
    if (isRightPanelOpen && !wasOpen && leftFloats) {
      setStashedViews(leftViews)
      setOpenViews((cur) => cur.filter((v) => !leftViews.includes(v)))
    }
    if (!isRightPanelOpen && wasOpen && stashedViews.length) {
      setOpenViews((cur) => [...cur, ...stashedViews.filter((v) => !cur.includes(v))])
      setStashedViews([])
    }
  }, [isRightPanelOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drag column 1's right edge to widen the left views (LEFT_MIN to whatever room allows)
  const startWidthResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = col1W
    const maxW = leftFloats ? Math.min(LEFT_MAX, Math.max(LEFT_MIN, mapWidth - 16)) : col1Max
    const onMove = (ev: MouseEvent) => setLeftWidth(Math.min(maxW, Math.max(LEFT_MIN, startW + ev.clientX - startX)))
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
    }
    document.body.style.cursor = "col-resize"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  // Drag the seam between the map and a docked region to resize it
  const startResize = (edge: "top" | "bottom", e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = edge === "bottom" ? bottomH : topH
    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startY
      const next = Math.max(DOCK_MIN_HEIGHT, edge === "bottom" ? startH - dy : startH + dy)
      edge === "bottom" ? setBottomHeight(next) : setTopHeight(next)
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
    }
    document.body.style.cursor = "row-resize"
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  // Where would the dragged view land? Over another view: before / after it in that view's dock.
  // Over the map: its left edge docks left, its top third docks above, its bottom third docks below.
  const findDropTarget = (dragged: LeftPanel, x: number, y: number): DropTarget | null => {
    const others = Array.from(document.querySelectorAll<HTMLElement>("[data-view][data-dock]")).filter((el) => el.dataset.view !== dragged)
    for (const el of others) {
      const r = el.getBoundingClientRect()
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue
      const dock = el.dataset.dock as ViewDock
      const same = openViews.filter((v) => v !== dragged && viewDocks[v] === dock)
      const vertical = dock === "left"
      const after = vertical ? y > r.top + r.height / 2 : x > r.left + r.width / 2
      const index = same.indexOf(el.dataset.view as LeftPanel) + (after ? 1 : 0)
      const indicator = vertical
        ? { left: r.left, width: r.width, top: (after ? r.bottom : r.top) - 2, height: 4, zone: false }
        : { left: (after ? r.right : r.left) - 2, width: 4, top: r.top, height: r.height, zone: false }
      return { dock, index, indicator }
    }
    const mapR = { left: mapLeft, top: mapTop, right: viewportWidth - mapRight, bottom: viewportHeight - mapBottomInset }
    if (x < mapR.left || x > mapR.right || y < mapR.top || y > mapR.bottom) return null
    const w = mapR.right - mapR.left
    const h = mapR.bottom - mapR.top
    const end = (dock: ViewDock) => openViews.filter((v) => v !== dragged && viewDocks[v] === dock).length
    if (x < mapR.left + w * 0.2) return { dock: "left", index: end("left"), indicator: { left: mapR.left, top: mapR.top, width: Math.min(LEFT_MIN, w / 2), height: h, zone: true } }
    if (y < mapR.top + h / 3) return { dock: "top", index: end("top"), indicator: { left: mapR.left, top: mapR.top, width: w, height: Math.min(topHeight, h / 2), zone: true } }
    if (y > mapR.bottom - h / 3) return { dock: "bottom", index: end("bottom"), indicator: { left: mapR.left, top: mapR.bottom - Math.min(bottomHeight, h / 2), width: w, height: Math.min(bottomHeight, h / 2), zone: true } }
    return null
  }

  const moveView = (view: LeftPanel, dock: ViewDock, index: number) => {
    setViewDocks((cur) => ({ ...cur, [view]: dock }))
    setOpenViews((cur) => {
      const rest = cur.filter((v) => v !== view)
      const same = rest.filter((v) => viewDocks[v] === dock)
      const anchor = same[index]
      if (anchor) rest.splice(rest.indexOf(anchor), 0, view)
      else if (same.length) rest.splice(rest.indexOf(same[same.length - 1]) + 1, 0, view)
      else rest.push(view)
      return rest
    })
  }

  const startViewDrag = (view: LeftPanel, e: React.MouseEvent) => {
    const startX = e.clientX
    const startY = e.clientY
    let started = false
    let target: DropTarget | null = null
    const onMove = (ev: MouseEvent) => {
      if (!started && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return
      started = true
      document.body.style.cursor = "grabbing"
      document.body.style.userSelect = "none"
      target = findDropTarget(view, ev.clientX, ev.clientY)
      setDrag({ view, x: ev.clientX, y: ev.clientY, target })
    }
    const onUp = () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      if (started && target) moveView(view, target.dock, target.index)
      setDrag(null)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const renderView = (view: LeftPanel) => (
    <ViewPanel
      key={view}
      id={view}
      minHeight={viewDocks[view] === "left" ? STACK_MIN_HEIGHT : 0}
      floating={viewDocks[view] === "left" && leftFloats && expanded !== view}
      isExpanded={expanded === view}
      isDragging={drag?.view === view}
      onHeaderMouseDown={expanded === view ? undefined : (e) => startViewDrag(view, e)}
      onToggleExpand={() => setExpanded((cur) => (cur === view ? null : view))}
      dock={viewDocks[view]}
      onDockChange={(d) => dockView(view, d)}
      onClose={() => closeView(view)}
      orders={filteredOrders}
      onHoverOrder={setHoveredWorkspaceOrderId}
      onAddToWorkspace={(orderIds) => handleAddFromList({ orderIds, routeIds: [] })}
    />
  )

  const widthSeam = (x: number, top: number, bottom: number): React.ReactNode => (
    <div
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize"
      onMouseDown={startWidthResize}
      onMouseEnter={(e) => { e.currentTarget.firstElementChild && ((e.currentTarget.firstElementChild as HTMLElement).style.backgroundColor = "#6366F1") }}
      onMouseLeave={(e) => { e.currentTarget.firstElementChild && ((e.currentTarget.firstElementChild as HTMLElement).style.backgroundColor = "transparent") }}
      style={{ position: "absolute", left: x - 4, width: 8, top, bottom, zIndex: 1020, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {/* Handle only shows when the pointer is near the edge */}
      <span style={{ width: 3, height: 40, borderRadius: 2, backgroundColor: "transparent", transition: "background-color 120ms" }} />
    </div>
  )

  const seam = (edge: "top" | "bottom", top: number): React.ReactNode => (
    <div
      role="separator"
      aria-orientation="horizontal"
      title="Drag to resize"
      onMouseDown={(e) => startResize(edge, e)}
      onMouseEnter={(e) => { e.currentTarget.firstElementChild && ((e.currentTarget.firstElementChild as HTMLElement).style.backgroundColor = "#6366F1") }}
      onMouseLeave={(e) => { e.currentTarget.firstElementChild && ((e.currentTarget.firstElementChild as HTMLElement).style.backgroundColor = "transparent") }}
      style={{ position: "absolute", left: colLeft, right: mapRight, top: top - 4, height: 8, zIndex: 20, cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <span style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: "transparent", transition: "background-color 120ms" }} />
    </div>
  )
  const handleRightPanelChange = (panel: "routes" | "workspace" | null) => {
    setIsRoutesOpen(panel === "routes")
    setIsWorkspaceOpen(panel === "workspace")
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 5000)
  }


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

  // Esc collapses whatever is expanded (unless the lasso is drawing; Esc cancels that first)
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !isLassoDrawing) setExpanded(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, isLassoDrawing])

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

  // Select All — same outcome as lassoing every pin on the map:
  // scheduled orders pull in their whole route, unassigned orders come in individually.
  // Merges with what is already in the workspace and only reports what was missing.
  const handleSelectAll = () => {
    if (allOnMapInWorkspace) return
    const routeSet = new Set(selectedRouteIds)
    const orderSet = new Set([...selectedOrders, ...modal3UnassignedOrders].map((o) => o.id))
    const missingRouteIds = Array.from(
      new Set(filteredOrders.filter((o) => o.routeId && !routeSet.has(o.routeId)).map((o) => o.routeId as string))
    )
    const missingUnassigned = filteredOrders.filter((o) => !o.routeId && !orderSet.has(o.id))
    const missingRoutedOrders = filteredOrders.filter((o) => o.routeId && missingRouteIds.includes(o.routeId))
    const isFirstSelection = selectedOrders.length === 0 && selectedRouteIds.length === 0

    setIsLassoDrawing(false)
    setSelectedOrders((prev) => {
      const prevIds = new Set(prev.map((o) => o.id))
      return [...prev, ...filteredOrders.filter((o) => !prevIds.has(o.id))]
    })
    setSelectedRouteIds((prev) => Array.from(new Set([...prev, ...missingRouteIds])))
    setIsWorkspaceOpen(true)
    setIsFilterOpen(false)

    const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
    const addedOrderCount = missingRoutedOrders.length + missingUnassigned.length
    if (isFirstSelection) {
      showToast(`Added ${plural(addedOrderCount, "order")} across ${plural(missingRouteIds.length, "route")} to the workspace`)
    } else {
      const parts = [
        missingRouteIds.length > 0 ? plural(missingRouteIds.length, "missing route") : null,
        missingUnassigned.length > 0 ? plural(missingUnassigned.length, "missing unassigned order") : null,
      ].filter(Boolean)
      showToast(`Added ${parts.join(" and ")} to the workspace`)
    }

    const coords = filteredOrders
      .filter((o) => o.latitude && o.longitude)
      .map((o) => ({ lat: o.latitude, lng: o.longitude }))
    if (coords.length > 0 && (window as any).__fitToShipTos) {
      setTimeout(() => (window as any).__fitToShipTos(coords), 100)
    }
  }

  // List panel → workspace. Same rules as lasso: a scheduled order pulls in its whole route,
  // an unassigned order comes in on its own, a route comes in whole.
  const handleAddFromList = ({ orderIds, routeIds }: { orderIds: string[]; routeIds: string[] }) => {
    const picked = filteredOrders.filter((o) => orderIds.includes(o.id))
    const routeIdsToAdd = Array.from(new Set([...routeIds, ...picked.filter((o) => o.routeId).map((o) => o.routeId as string)]))
    const ordersToAdd = [
      ...filteredOrders.filter((o) => o.routeId && routeIdsToAdd.includes(o.routeId)),
      ...picked.filter((o) => !o.routeId),
    ]
    const prevIds = new Set(selectedOrders.map((o) => o.id))
    const newOrders = ordersToAdd.filter((o) => !prevIds.has(o.id))

    setSelectedOrders((prev) => [...prev, ...newOrders])
    setSelectedRouteIds((prev) => Array.from(new Set([...prev, ...routeIdsToAdd])))
    setIsWorkspaceOpen(true)
    setIsFilterOpen(false)

    if (newOrders.length === 0) {
      showToast("Already in the workspace")
    } else {
      const routesNote = routeIdsToAdd.length > 0 ? ` across ${routeIdsToAdd.length} route${routeIdsToAdd.length === 1 ? "" : "s"}` : ""
      showToast(`Added ${newOrders.length} order${newOrders.length === 1 ? "" : "s"}${routesNote} to the workspace`)
    }
  }

  const handleRemoveRoutes = (routeIds: string[]) => {
    setSelectedOrders((prev) => prev.filter((o) => !o.routeId || !routeIds.includes(o.routeId)))
    setSelectedRouteIds((prev) => prev.filter((id) => !routeIds.includes(id)))
  }

  const handleRemoveOrders = (orderIds: string[]) => {
    setSelectedOrders((prev) => prev.filter((o) => !orderIds.includes(o.id)))
  }

  // Closing the Workspace only hides it; what is in it stays and comes back from the bar
  const handleWorkspaceClose = () => {
    setIsLassoDrawing(false)
    setIsWorkspaceOpen(false)
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

  const mapButton: React.CSSProperties = {
    height: 32, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", border: "none", borderRadius: 4,
    backgroundColor: "#111", color: "#FAFAFA", fontSize: 14, fontWeight: 500, lineHeight: "20px", fontFamily: "Geist, sans-serif", cursor: "pointer",
  }

  return (
    <main className="relative w-full h-screen overflow-hidden" data-layout-tier={tier} style={{ backgroundColor: "#111" }}>
      <AppHeader
        mode={mode}
        onModeChange={(m) => { setMode(m); setIsFilterOpen(false) }}
        onSettingsClick={() => setIsRoutingConfigOpen(true)}
        onPrototypeSettingsClick={() => setIsSettingsOpen(true)}
      />

      {isConflictBannerVisible && (
        <ConflictAssignmentBanner
          orderCount={conflictOrdersRemaining}
          onReviewAndAssign={() => setIsConflictModalOpen(true)}
        />
      )}

      {mode === "planning" && !expanded && (
        <MetricsBar
          totalGallons={totalGallons}
          routeCount={listRoutes.length}
          unassignedCount={unassignedCount}
          rightPanel={isWorkspaceOpen ? "workspace" : isRoutesOpen ? "routes" : null}
          onRightPanelChange={(p) => { setExpanded(null); handleRightPanelChange(p) }}
          onCreateOrder={() => setOpenCreateOrderTrigger((n) => n + 1)}
          isCreateOrderDisabled={isCreateOrderModalOpen}
          topOffset={topOffset}
        />
      )}

      {/* Rail toggles views; open views dock around the map */}
      {!expanded && <SideNavRail active={mode === "planning" ? openViews : []} onSelect={handleRailSelect} style={{ top: bodyTop + INSET, left: INSET, bottom: INSET }} />}
      {mode === "planning" && leftDocked && (
        <>
          <div style={{ position: "absolute", top: colTop, left: LEFT_START, width: col1W, bottom: INSET, display: "flex", flexDirection: "column", gap: GAP, overflowY: "auto", zIndex: 5 }}>
            {col1Views.filter((v) => v !== expanded).map(renderView)}
          </div>
          {col2Views.length > 0 && (
            <div style={{ position: "absolute", top: colTop, left: LEFT_START + col1W + GAP, width: LEFT_MIN, bottom: INSET, display: "flex", flexDirection: "column", gap: GAP, overflowY: "auto", zIndex: 5 }}>
              {col2Views.filter((v) => v !== expanded).map(renderView)}
            </div>
          )}
          {widthSeam(LEFT_START + col1W + GAP / 2, colTop, INSET)}
        </>
      )}
      {/* Not enough room to dock beside the map: the left views float over it, like the Filters panel */}
      {mode === "planning" && leftFloats && expanded !== "map" && (
        <>
          <div style={{ position: "absolute", top: mapTop + 48, left: floatLeft, width: floatW, bottom: mapBottomInset + 8, display: "flex", flexDirection: "column", gap: GAP, overflowY: "auto", zIndex: 1010 }}>
            {leftViews.filter((v) => v !== expanded).map(renderView)}
          </div>
          {widthSeam(floatLeft + floatW + 2, mapTop + 48, mapBottomInset + 8)}
        </>
      )}
      {/* Expanded view: fills the planning area, over the map and the right panel */}
      {mode === "planning" && expanded && expanded !== "map" && openViews.includes(expanded) && (
        <div style={{ position: "absolute", top: colTop, left: INSET, right: INSET, bottom: INSET, display: "flex", zIndex: 1120 }}>
          {renderView(expanded)}
        </div>
      )}
      {topViews.length > 0 && (
        <>
          <div style={{ position: "absolute", top: colTop, left: colLeft, right: mapRight, height: topH, display: "flex", gap: GAP, zIndex: 5 }}>
            {topViews.filter((v) => v !== expanded).map(renderView)}
          </div>
          {seam("top", colTop + topH + GAP / 2)}
        </>
      )}
      {bottomViews.length > 0 && (
        <>
          <div style={{ position: "absolute", left: colLeft, right: mapRight, bottom: INSET, height: bottomH, display: "flex", gap: GAP, zIndex: 5 }}>
            {bottomViews.filter((v) => v !== expanded).map(renderView)}
          </div>
          {seam("bottom", viewportHeight - INSET - bottomH - GAP / 2)}
        </>
      )}

      {/* Map region — bounded box; the map resizes as panels open and close */}
      <div
        style={{
          position: "absolute",
          top: mapTop,
          left: mapLeft,
          right: mapRight,
          bottom: mapBottomInset,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#161616",
        }}
      >
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
          workspaceWidth={rightW}
          isCreateOrderSideSheetOpen={isCreateSheetOpen}
          addedLoadOrders={addedLoadOrders}
          selectedUnassignedOrderIds={selectedUnassignedIds}
          reorderedRoutes={reorderedRoutes}
        />

        {/* Actions on map — Figma 9175:89258 */}
        <button
          type="button"
          onClick={handleFilterToggle}
          aria-pressed={isFilterOpen}
          aria-label="Filters"
          title={isFilterCompact ? "Filters" : undefined}
          style={{ ...mapButton, ...(isFilterCompact ? { width: 32, padding: 0, justifyContent: "center" } : null), position: "absolute", top: 8, left: 8, zIndex: 1000, boxShadow: isFilterOpen ? "0 0 0 1px #737373, 0 0 0 4px rgba(115,115,115,0.5)" : "none" }}
        >
          <ListFilter size={16} />
          {!isFilterCompact && <>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</>}
          {isFilterCompact && activeFilterCount > 0 && (
            <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, backgroundColor: "#6366F1", color: "#FFF", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>{activeFilterCount}</span>
          )}
        </button>

        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetNorth={handleResetNorth}
          onLocate={handleLocate}
          isCreatePanelOpen={isCreatePanelOpen}
          isRouteListOpen={false}
          isLassoActive={isLassoDrawing}
          onLassoToggle={handleLassoToggle}
          onSelectAll={handleSelectAll}
          isSelectAllDisabled={allOnMapInWorkspace}
          isWorkspaceOpen={isWorkspaceOpen}
          isCreateOrderSideSheetOpen={isCreateSheetOpen}
          isOptimizationDrawerOpen={isOptimizationDrawerOpen}
          entityVisibility={entityVisibility}
          onEntityVisibilityChange={setEntityVisibility}
          topOffset={topOffset}
          pinned={{ top: 8, right: isCreateSheetOpen ? 8 + createSheetW + 8 : 8 }}
          isMapExpanded={expanded === "map"}
          onZoomToFit={() => {
            const coords = filteredOrders.filter((o) => o.latitude && o.longitude).map((o) => ({ lat: o.latitude, lng: o.longitude }))
            if (coords.length) (window as any).__fitToShipTos?.(coords)
          }}
          onToggleMapExpand={() => setExpanded((cur) => (cur === "map" ? null : "map"))}
        />

        {/* Prototype readout: which layout tier this window is in (tag name for analytics) */}
        <div style={{ position: "absolute", left: 8, bottom: 8, zIndex: 1000, padding: "2px 8px", borderRadius: 4, backgroundColor: "rgba(17,17,17,0.8)", color: "#737373", fontSize: 12, fontFamily: "Geist, sans-serif", pointerEvents: "none" }}>
          {TIER_LABELS[tier]} · {viewportWidth}px · map {Math.round(mapWidth)}px
        </div>
      </div>

      {/* Right: Routes (view only) — Workspace is the LassoWorkspaceSheet below */}
      {mode === "planning" && isRoutesOpen && isRightPanelShown && (
        <RoutesPanel
          routes={listRoutes}
          orders={filteredOrders}
          onClose={() => setIsRoutesOpen(false)}
          onHoverRoute={setHoveredWorkspaceRouteId}
          onHoverStop={setHoveredWorkspaceOrderId}
          onEditInWorkspace={(routeId) => handleAddFromList({ orderIds: [], routeIds: [routeId] })}
          style={{ top: bodyTop, right: 0, bottom: 0, width: rightW }}
        />
      )}

      <LassoCanvas
        isActive={isLassoDrawing}
        onSelectionComplete={handleLassoSelection}
        onEscapePressed={handleLassoEscape}
      />
      <LassoWorkspaceSheet
        isOpen={isWorkspaceOpen && mode === "planning" && isRightPanelShown}
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

        onOptimizationDrawerOpen={() => { setIsWorkspaceOpen(false); setIsOptimizationDrawerOpen(true) }}
        onOptimizationDrawerClose={() => { setIsWorkspaceOpen(true); setIsOptimizationDrawerOpen(false) }}
        externalUnassignedOrders={modal3UnassignedOrders}
        openCreateOrderTrigger={openCreateOrderTrigger}
        onCreateOrderModalOpenChange={setIsCreateOrderModalOpen}
        topOffset={topOffset + METRICS_BAR_HEIGHT}
        width={rightW || RIGHT_MAX[tier]}
        createOrderSheetBounds={createSheetBounds}
        onRemoveRoutes={handleRemoveRoutes}
        onRemoveOrders={handleRemoveOrders}
        onShowToast={(driverName) => {
          setToastMessage(`Load Order added to ${driverName}'s Route successfully`)
          setTimeout(() => setToastMessage(null), 5000)
        }}
        onShowMessage={(message) => {
          setToastMessage(message)
          setTimeout(() => setToastMessage(null), 5000)
        }}
      />

      {/* Success toast — under the metrics bar */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: bodyTop + 52,
            left: `calc((${mapLeft}px + 100% - ${mapRight}px) / 2)`, // centred over the map region
            transform: "translateX(-50%)",
            zIndex: 1250,
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

      <FilterSideSheet
        variant="floating"
        floatingLeft={mapLeft + 8}
        floatingTop={mapTop + 48}
        floatingBottom={mapBottomInset + 8}
        onActiveFilterCountChange={setActiveFilterCount}
        isOpen={isFilterOpen && mode === "planning"}
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

      {mode === "reconciliation" && <ReconciliationView top={APP_HEADER_HEIGHT + topOffset} />}

      <CreateRoutePanel isOpen={isCreatePanelOpen} onClose={() => setIsCreatePanelOpen(false)} />

      <RoutingConfigOverlay isOpen={isRoutingConfigOpen} onClose={() => setIsRoutingConfigOpen(false)} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Dragging a view: where it will land, plus a label that follows the pointer */}
      {drag?.target && (
        <div
          style={{
            position: "fixed",
            ...drag.target.indicator,
            zIndex: 2500,
            pointerEvents: "none",
            borderRadius: drag.target.indicator.zone ? 4 : 2,
            backgroundColor: drag.target.indicator.zone ? "rgba(99,102,241,0.15)" : "#6366F1",
            border: drag.target.indicator.zone ? "1px dashed #6366F1" : "none",
            boxSizing: "border-box",
          }}
        />
      )}
      {drag && (
        <div style={{ position: "fixed", left: drag.x + 12, top: drag.y + 12, zIndex: 2600, pointerEvents: "none", padding: "6px 10px", borderRadius: 4, backgroundColor: "#282828", border: "1px solid #333", color: "#FAFAFA", fontSize: 13, fontWeight: 500, fontFamily: "Geist, sans-serif", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {drag.view === "orders" ? "Orders" : drag.view === "trucks" ? "Trucks" : "Drivers"}
          <span style={{ color: "#A3A3A3", fontWeight: 400 }}>{drag.target ? ` → ${drag.target.dock === "left" ? "left" : drag.target.dock === "top" ? "above map" : "below map"}` : ""}</span>
        </div>
      )}

      <ConflictResolutionModal
        isOpen={isConflictModalOpen && showDriverConflict}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={(unassignedCount) => {
          setIsConflictModalOpen(false)
          setIsConflictBannerResolved(true)
        }}
      />
    </main>
  )
}
