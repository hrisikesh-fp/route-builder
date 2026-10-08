"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowUpRight, Info, Search, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EntityToggle } from "@/components/map-controls"
import type { ExtractionOrder } from "@/lib/mock-data"
import { CheckboxInput } from "@/components/lasso-workspace-sheet"
import { ListOrderCard } from "@/components/list-order-card"
import { ListRouteCard, type ListRoute } from "@/components/list-route-card"

// Floating List panel over the map — Figma RB - Routing v2, node 9103:41099 (panel + Order Card).
// Toolbar (search, Select all, Open as table) and footer (N selected · Add N to workspace) come from
// the A1/C1/D1 views HTML spec (V2 Orders tab, V3 Routes tab) since they are not in Figma yet.
// Layer 1 of the screen model: the whole day, read / filter / select. Nothing is edited here.

export type ListTab = "routes" | "orders"

export interface ListFocus {
  kind: "order" | "route"
  id: string
  nonce: number
}

interface MapListPanelProps {
  top: number
  left: number
  orders: ExtractionOrder[]
  routes: ListRoute[]
  onHoverOrderChange: (orderId: string | null) => void
  onHoverRouteChange: (routeId: string | null) => void
  onAddToWorkspace: (selection: { orderIds: string[]; routeIds: string[] }) => void
  /** Set by page.tsx when a pin or route line is clicked on the map while the list is open. */
  focus: ListFocus | null
}

const FOCUS_HIGHLIGHT_MS = 3000
// Wait before flying so skimming down the list doesn't throw the map around
const MOVE_ON_HOVER_DELAY_MS = 250

export function MapListPanel({
  top,
  left,
  orders,
  routes,
  onHoverOrderChange,
  onHoverRouteChange,
  onAddToWorkspace,
  focus,
}: MapListPanelProps) {
  const [activeTab, setActiveTab] = useState<ListTab>("orders")
  const [search, setSearch] = useState("")
  const [checkedOrderIds, setCheckedOrderIds] = useState<string[]>([])
  const [checkedRouteIds, setCheckedRouteIds] = useState<string[]>([])
  const [expandedRouteIds, setExpandedRouteIds] = useState<string[]>([])
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [moveOnHover, setMoveOnHover] = useState(false)
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (moveTimerRef.current) clearTimeout(moveTimerRef.current) }, [])

  // Hover → pin lift always; with "Move" on, the map also flies to it (same zoom as picking a ship-to in Create Order)
  const scheduleMove = (fly: () => void) => {
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
    if (moveOnHover) moveTimerRef.current = setTimeout(fly, MOVE_ON_HOVER_DELAY_MS)
  }

  const handleOrderHover = (orderId: string | null) => {
    onHoverOrderChange(orderId)
    if (!orderId) {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
      return
    }
    const order = orders.find((o) => o.id === orderId)
    if (!order?.latitude || !order?.longitude) return
    scheduleMove(() => (window as any).__fitToShipTos?.([{ lat: order.latitude, lng: order.longitude }]))
  }

  const handleRouteHover = (routeId: string | null) => {
    onHoverRouteChange(routeId)
    if (!routeId) {
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current)
      return
    }
    scheduleMove(() => (window as any).__zoomToRoute?.(routeId))
  }

  const stopsByRoute = useMemo(() => {
    const map = new Map<string, ExtractionOrder[]>()
    for (const order of orders) {
      if (!order.routeId) continue
      map.set(order.routeId, [...(map.get(order.routeId) ?? []), order])
    }
    for (const stops of map.values()) stops.sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))
    return map
  }, [orders])

  const query = search.trim().toLowerCase()
  const orderMatches = (o: ExtractionOrder) =>
    !query ||
    [o.customerName, o.shipToName, o.shipToAddress, o.city].some((v) => v?.toLowerCase().includes(query))

  const visibleOrders = useMemo(() => orders.filter(orderMatches), [orders, query])
  const notOnRoute = visibleOrders.filter((o) => !o.routeId)
  const onRoute = visibleOrders.filter((o) => o.routeId)

  const visibleRoutes = useMemo(
    () =>
      routes.filter(
        (r) =>
          !query ||
          [r.driverName, r.truckId ?? ""].some((v) => v.toLowerCase().includes(query)) ||
          (stopsByRoute.get(r.id) ?? []).some(orderMatches)
      ),
    [routes, query, stopsByRoute]
  )

  // Select all applies to what the active tab is showing (after search)
  const tabIds = activeTab === "orders" ? visibleOrders.map((o) => o.id) : visibleRoutes.map((r) => r.id)
  const tabChecked = activeTab === "orders" ? checkedOrderIds : checkedRouteIds
  const allChecked = tabIds.length > 0 && tabIds.every((id) => tabChecked.includes(id))
  const someChecked = !allChecked && tabIds.some((id) => tabChecked.includes(id))

  const toggleSelectAll = () => {
    const setter = activeTab === "orders" ? setCheckedOrderIds : setCheckedRouteIds
    setter((prev) => (allChecked ? prev.filter((id) => !tabIds.includes(id)) : Array.from(new Set([...prev, ...tabIds]))))
  }

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const selectedCount = checkedOrderIds.length + checkedRouteIds.length

  const handleAdd = (selection: { orderIds: string[]; routeIds: string[] }) => {
    onAddToWorkspace(selection)
    setCheckedOrderIds([])
    setCheckedRouteIds([])
  }

  // Map → list: a pin click focuses its order card, a route line click expands its route card
  useEffect(() => {
    if (!focus) return
    setSearch("")
    setActiveTab(focus.kind === "order" ? "orders" : "routes")
    if (focus.kind === "route") setExpandedRouteIds((prev) => (prev.includes(focus.id) ? prev : [...prev, focus.id]))
    setFocusedId(focus.id)
    const attr = focus.kind === "order" ? "data-list-order-id" : "data-list-route-id"
    const scrollTimer = setTimeout(() => {
      scrollRef.current
        ?.querySelector(`[${attr}="${focus.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 50)
    const clearTimer = setTimeout(() => setFocusedId(null), FOCUS_HIGHLIGHT_MS)
    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(clearTimer)
    }
  }, [focus?.nonce])

  const tabButton = (tab: ListTab, label: string) => {
    const isActive = activeTab === tab
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => setActiveTab(tab)}
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 16px",
          border: "none",
          borderBottom: isActive ? "1px solid #6366F1" : "1px solid transparent",
          borderRadius: "4px 4px 0 0",
          backgroundColor: isActive ? "#282828" : "transparent",
          fontSize: 14,
          lineHeight: "20px",
          fontWeight: isActive ? 500 : 400,
          color: isActive ? "#E5E5E5" : "#A3A3A3",
          fontFamily: "inherit",
          cursor: "pointer",
          marginBottom: -1,
        }}
      >
        {label}
      </button>
    )
  }

  const groupLabel = (text: string) => (
    <div style={{ padding: "8px 4px 0", fontSize: 12, fontWeight: 500, lineHeight: "16px", letterSpacing: "0.04em", textTransform: "uppercase", color: "#737373" }}>
      {text}
    </div>
  )

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        bottom: 24,
        zIndex: 1001,
        width: 419,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        backgroundColor: "#111",
        borderRadius: 4,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "Geist, sans-serif",
      }}
    >
      {/* Tabs — Figma order: Routes, Orders */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid #333", flexShrink: 0 }}>
        <div role="tablist" style={{ display: "flex", alignItems: "stretch" }}>
          {tabButton("routes", `Routes (${routes.length})`)}
          {tabButton("orders", `Orders (${orders.length})`)}
        </div>
        {/* Move map on hover */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, paddingRight: 4 }}>
          <span style={{ fontSize: 14, lineHeight: "20px", color: "#A3A3A3" }}>Move</span>
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <span style={{ display: "flex", cursor: "help" }} aria-label="Move map on hover">
                  <Info size={14} color="#737373" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="z-[1002]">
                <p>Move map on hover</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <EntityToggle checked={moveOnHover} onChange={() => setMoveOnHover((v) => !v)} />
        </div>
      </div>

      {/* Toolbar — search + select all (Hub / Source / Product / Problems only come later) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "8px 12px", border: "1px solid #333", borderRadius: 4, boxSizing: "border-box" }}>
          <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "orders" ? "Search orders" : "Search routes, trucks, drivers"}
            style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "inherit" }}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch("")} style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <X size={14} color="#737373" />
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckboxInput checked={allChecked} indeterminate={someChecked} onChange={toggleSelectAll} />
            <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#E5E5E5" }}>
              Select all {tabIds.length}
            </span>
          </div>
          {/* Orders table (V7) — shown, not wired yet */}
          {activeTab === "orders" && (
            <span title="Orders table not wired in the prototype" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, color: "#737373", cursor: "default" }}>
              Open as table
              <ArrowUpRight size={14} />
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {activeTab === "orders" ? (
          <>
            {notOnRoute.length > 0 && groupLabel(`Not on a route · ${notOnRoute.length}`)}
            {notOnRoute.map((order) => (
              <ListOrderCard
                key={order.id}
                order={order}
                checked={checkedOrderIds.includes(order.id)}
                onToggleCheck={() => toggle(setCheckedOrderIds, order.id)}
                onHoverChange={handleOrderHover}
                isFocused={focusedId === order.id}
              />
            ))}
            {onRoute.length > 0 && groupLabel(`On a route · ${onRoute.length}`)}
            {onRoute.map((order) => (
              <ListOrderCard
                key={order.id}
                order={order}
                checked={checkedOrderIds.includes(order.id)}
                onToggleCheck={() => toggle(setCheckedOrderIds, order.id)}
                onHoverChange={handleOrderHover}
                isFocused={focusedId === order.id}
              />
            ))}
            {visibleOrders.length === 0 && (
              <div style={{ padding: "24px 4px", fontSize: 14, color: "#737373", textAlign: "center" }}>No orders match "{search}"</div>
            )}
          </>
        ) : (
          <>
            {visibleRoutes.map((route) => (
              <ListRouteCard
                key={route.id}
                route={route}
                stops={stopsByRoute.get(route.id) ?? []}
                checked={checkedRouteIds.includes(route.id)}
                onToggleCheck={() => toggle(setCheckedRouteIds, route.id)}
                isExpanded={expandedRouteIds.includes(route.id)}
                onToggleExpand={() => toggle(setExpandedRouteIds, route.id)}
                onHoverRouteChange={handleRouteHover}
                onHoverStopChange={handleOrderHover}
                onEditInWorkspace={() => handleAdd({ orderIds: [], routeIds: [route.id] })}
                isFocused={focusedId === route.id}
              />
            ))}
            {visibleRoutes.length === 0 && (
              <div style={{ padding: "24px 4px", fontSize: 14, color: "#737373", textAlign: "center" }}>No routes match "{search}"</div>
            )}
          </>
        )}
      </div>

      {/* Footer — N selected · Add N to workspace */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 12, borderTop: "1px solid #282828", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#A3A3A3", whiteSpace: "nowrap" }}>
          {selectedCount} selected
        </span>
        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => handleAdd({ orderIds: checkedOrderIds, routeIds: checkedRouteIds })}
          onMouseEnter={(e) => { if (selectedCount > 0) e.currentTarget.style.backgroundColor = "#3D45E8" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4D55F8" }}
          style={{
            height: 36,
            padding: "0 16px",
            border: "none",
            borderRadius: 4,
            backgroundColor: "#4D55F8",
            color: "#FAFAFA",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: "20px",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            opacity: selectedCount === 0 ? 0.5 : 1,
            cursor: selectedCount === 0 ? "not-allowed" : "pointer",
          }}
        >
          {selectedCount > 0 ? `Add ${selectedCount} to workspace` : "Add to workspace"}
        </button>
      </div>
    </div>
  )
}
