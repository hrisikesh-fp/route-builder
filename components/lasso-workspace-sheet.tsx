"use client"

import { X, ChevronRight, ChevronDown, MoreVertical, Home, Truck, GripVertical } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes, mockHubs } from "@/lib/mock-data"
import { useState } from "react"

interface LassoWorkspaceSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedOrders: ExtractionOrder[]
  selectedRouteIds: string[]
  checkedRouteIds: string[]
  onCheckedRoutesChange: (routeIds: string[]) => void
  hoveredRouteId: string | null
  onHoveredRouteChange: (routeId: string | null) => void
}

const TRUCK_CAPACITY = 4500

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function CheckboxInput({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}) {
  const showCheck = checked
  const showDash = indeterminate && !checked

  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => e.key === " " && onChange()}
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        border: showCheck || showDash ? "1px solid #E5E5E5" : "1px solid #333333",
        backgroundColor: showCheck || showDash ? "#E5E5E5" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        outline: "none",
      }}
    >
      {showDash && (
        <div style={{ width: 8, height: 2, backgroundColor: "#111111", borderRadius: 1 }} />
      )}
      {showCheck && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#111111"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

// ─── Collapsed Route Card ──────────────────────────────────────────────────────

function RouteCardCollapsed({
  color,
  driverName,
  orderCount,
  plannedQty,
  truckName,
  isHovered,
}: {
  color: string
  driverName: string
  orderCount: number
  plannedQty: number
  truckName: string
  isHovered: boolean
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: isHovered ? "#333333" : "#1F1F1F",
        borderRadius: "4px 4px 0px 4px",
        boxShadow:
          "0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)",
        padding: "16px 16px 12px 20px",
        transition: "background-color 150ms ease",
      }}
    >
      {/* Color bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          backgroundColor: color,
          borderRadius: "4px 0 0 0",
        }}
      />

      {/* Top row: avatar + name | badge + 3-dot */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        {/* Left: avatar + driver name */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "1px solid rgba(115,115,115,0.2)",
              backgroundColor: "#1B1B1B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 600,
              color: color,
              flexShrink: 0,
            }}
          >
            {getInitials(driverName)}
          </div>
          <span style={{ fontSize: 16, fontWeight: 500, color: "#FFFFFF" }}>
            {driverName}
          </span>
        </div>

        {/* Right: badge + 3-dot */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
          <span
            style={{
              backgroundColor: "#111111",
              color: "#FAFAFA",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {orderCount} Orders
          </span>
          <button
            style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#737373",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: 4,
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Info row: Planned Qty + Truck */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3" }}>Planned Qty</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
            {plannedQty.toLocaleString()} gal
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", whiteSpace: "nowrap" }}>Truck</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#E5E5E5",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {truckName}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Truck + Hub Selection ─────────────────────────────────────────────────────

interface TruckHubSelectionProps {
  truckName: string
  hubName: string
  truckHint?: string
}

function TruckHubSelection({ truckName, hubName, truckHint }: TruckHubSelectionProps) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#1F1F1F",
        borderRadius: 4,
        boxShadow:
          "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.06)",
      }}
    >
      {/* Group 1: Truck field + hint */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "4px 4px 8px",
          borderBottom: "1px solid #282828",
        }}
      >
        {/* Truck select field */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 4,
            backgroundColor: "transparent",
            boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Truck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 16,
              fontWeight: 400,
              color: "#E5E5E5",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {truckName}
          </span>
          <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
        </div>

        {/* Hint text — padded 36px left (icon 16 + gap 8 + field padding 12) */}
        {truckHint && (
          <span
            style={{
              paddingLeft: 36,
              fontSize: 14,
              fontWeight: 400,
              color: "#EAB308",
              lineHeight: "1.5em",
            }}
          >
            {truckHint}
          </span>
        )}
      </div>

      {/* Group 2: Hub field */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 4,
          gap: 4,
        }}
      >
        {/* Hub select field */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 4,
            backgroundColor: "transparent",
            boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Home size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: 400,
              color: "#E5E5E5",
            }}
          >
            {hubName}
          </span>
          <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Expanded Route Card ───────────────────────────────────────────────────────

const MOCK_STOP_TIMES = [
  "5:45 AM", "06:30 AM", "7:15 AM", "8:00 AM", "8:45 AM",
  "9:30 AM", "10:15 AM", "11:00 AM", "11:45 AM", "12:30 PM",
]

// seq-col width matches prototype exactly
const SEQ_COL_W = 52
const ROW_GAP = 8

function ExpandedRouteCard({
  orders,
  hubName,
}: {
  orders: ExtractionOrder[]
  color?: string
  hubName: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
      {/* ── Truck + Hub Selection ── */}
      <TruckHubSelection
        truckName="H-118 - 2019 Kenworth Tank Wagon"
        hubName={hubName}
        truckHint="This truck can accommodate more orders."
      />

      {/* ── Order list with continuous connector line ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: ROW_GAP, position: "relative" }}>
        {/* Single continuous vertical connector line through all badge centers */}
        <div
          style={{
            position: "absolute",
            left: SEQ_COL_W / 2, // center of seq-col = 26px
            top: 22,             // center of first badge (8px padding-top + 14px half of 28px badge)
            bottom: 22,          // mirrors from last badge center
            width: 1,
            backgroundColor: "#282828",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {orders.map((order, idx) => (
          <OrderStopRow
            key={order.id}
            order={order}
            idx={idx}
            stopTime={MOCK_STOP_TIMES[idx] || "—"}
          />
        ))}
      </div>
    </div>
  )
}

function OrderStopRow({
  order,
  idx,
  stopTime,
}: {
  order: ExtractionOrder
  idx: number
  stopTime: string
}) {
  const seq = order.routeSequence ?? idx + 1
  const type = order.orderType ?? "D"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: ROW_GAP,
      }}
    >
      {/* Seq column — 52px, above the connector line (zIndex 1) */}
      <div
        style={{
          width: SEQ_COL_W,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          paddingTop: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Sequence badge: 28×28 */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "#252525",
            border: "1px solid #404040",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "#A3A3A3",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {seq}
        </div>
        {/* Time label */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: "#737373",
            textAlign: "center",
            whiteSpace: "nowrap",
            lineHeight: "1.3em",
          }}
        >
          {stopTime}
        </span>
      </div>

      {/* Order card */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#1F1F1F",
          borderRadius: 4,
          padding: 16,
          gap: 12,
          display: "flex",
          flexDirection: "row",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget.querySelector<HTMLButtonElement>(".order-menu-btn")
          if (btn) btn.style.opacity = "1"
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget.querySelector<HTMLButtonElement>(".order-menu-btn")
          if (btn) btn.style.opacity = "0"
        }}
      >
        {/* Left: checkbox + grip */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 4,
            gap: 12,
            flexShrink: 0,
          }}
        >
          <CheckboxInput checked={false} onChange={() => {}} />
          {/* Grip icon (hidden) */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0 }}>
            <circle cx="7" cy="6" r="1" fill="#A3A3A3" />
            <circle cx="7" cy="10" r="1" fill="#A3A3A3" />
            <circle cx="7" cy="14" r="1" fill="#A3A3A3" />
            <circle cx="13" cy="6" r="1" fill="#A3A3A3" />
            <circle cx="13" cy="10" r="1" fill="#A3A3A3" />
            <circle cx="13" cy="14" r="1" fill="#A3A3A3" />
          </svg>
        </div>

        {/* Right: type badge + name + qty */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {/* Type badge: 20×20, neutral #E5E5E5 bg */}
            <div
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                backgroundColor: "#E5E5E5",
                border: "1px solid #737373",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 500,
                color: "#171717",
                lineHeight: 1,
              }}
            >
              {type}
            </div>
            {/* Stop name */}
            <span
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: 500,
                color: "#FFFFFF",
                lineHeight: "1.5em",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {order.customerName}
            </span>
            {/* 3-dot menu — hidden until card hover */}
            <button
              className="order-menu-btn"
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
                opacity: 0,
                transition: "opacity 0.15s",
                color: "#A3A3A3",
                padding: 0,
              }}
            >
              <MoreVertical size={14} />
            </button>
          </div>

          {/* Planned qty */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#FAFAFA",
              opacity: 0.6,
              lineHeight: "1.429em",
            }}
          >
            Planned Qty: {order.volume > 0 ? `${order.volume.toLocaleString()} gal` : "—"}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LassoWorkspaceSheet({
  isOpen,
  onClose,
  selectedOrders,
  selectedRouteIds,
  checkedRouteIds,
  onCheckedRoutesChange,
  hoveredRouteId,
  onHoveredRouteChange,
}: LassoWorkspaceSheetProps) {
  const [activeTab, setActiveTab] = useState<"routes" | "unassigned">("routes")
  const [expandedRouteIds, setExpandedRouteIds] = useState<string[]>([])

  const toggleExpanded = (routeId: string) => {
    setExpandedRouteIds((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
    )
  }

  const toggleRouteChecked = (routeId: string) => {
    if (checkedRouteIds.includes(routeId)) {
      onCheckedRoutesChange(checkedRouteIds.filter((id) => id !== routeId))
    } else {
      onCheckedRoutesChange([...checkedRouteIds, routeId])
    }
  }

  const routeGroups = selectedRouteIds.reduce(
    (acc, routeId) => {
      const routeOrders = selectedOrders.filter((o) => o.routeId === routeId)
      if (routeOrders.length > 0) acc[routeId] = routeOrders
      return acc
    },
    {} as Record<string, ExtractionOrder[]>
  )

  const allRouteIds = Object.keys(routeGroups)
  const allChecked = allRouteIds.length > 0 && allRouteIds.every((id) => checkedRouteIds.includes(id))
  const someChecked = checkedRouteIds.length > 0 && !allChecked

  const toggleAllRoutes = () => {
    if (allChecked) {
      onCheckedRoutesChange([])
    } else {
      onCheckedRoutesChange(allRouteIds)
    }
  }

  const unassignedOrders = selectedOrders.filter((o) => !o.routeId)

  const getTankLevelColor = (level: number) => {
    if (level > 75) return "#E15252"
    if (level >= 40) return "#FDE68A"
    return "#69BF88"
  }

  if (!isOpen) return null

  const hasSelection = selectedOrders.length > 0

  return (
    <div
      className="fixed right-0 top-[68px] bottom-0 z-[10000] flex flex-col"
      style={{
        width: 560,
        backgroundColor: "#111111",
        borderLeft: "1px solid #282828",
      }}
    >
      {!hasSelection ? (
        /* ── Empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm" style={{ color: "#737373" }}>
            Draw around orders on the map to select them.
          </p>
          <p className="text-xs mt-2" style={{ color: "#737373" }}>
            Press Esc to exit Lasso
          </p>
        </div>
      ) : (
        <>
          {/* ── HEADER ── */}
          <div
            style={{
              padding: "20px 24px 12px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 500, color: "#FFFFFF" }}>
              {selectedOrders.length} Orders selected
            </span>
            <button
              onClick={onClose}
              style={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#737373",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── TABS ── */}
          <div
            style={{
              padding: "0 24px",
              flexShrink: 0,
              borderBottom: "1px solid #333333",
              display: "flex",
              gap: 4,
            }}
          >
            {(["routes", "unassigned"] as const).map((tab) => {
              const isActive = activeTab === tab
              const label =
                tab === "routes"
                  ? `Driver Routes (${allRouteIds.length})`
                  : `Unassigned Orders (${unassignedOrders.length})`
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    height: 56,
                    padding: "0 12px",
                    fontSize: 16,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "#FFFFFF" : "#A3A3A3",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    borderRadius: isActive ? 0 : 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: "#FFFFFF",
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── SCROLLABLE CONTENT ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: "0 24px" }}
          >
            {/* ── ROUTES TAB ── */}
            {activeTab === "routes" && (
              <div>
                {/* Select All Row */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: "20px 0 20px",
                  }}
                >
                  <CheckboxInput
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={toggleAllRoutes}
                  />
                  <span style={{ fontSize: 16, fontWeight: 300, color: "#E5E5E5" }}>
                    Select All Routes
                  </span>
                </div>

                {/* Route card list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    paddingBottom: 16,
                  }}
                >
                  {allRouteIds.map((routeId) => {
                    const orders = routeGroups[routeId]
                    const route = mockRoutes.find((r) => r.id === routeId)
                    const driverName = route?.driverName ?? `Route ${routeId.replace("route-", "")}`
                    const color = route?.color ?? "#A3A3A3"
                    const isExpanded = expandedRouteIds.includes(routeId)
                    const isChecked = checkedRouteIds.includes(routeId)

                    // Data layer: count unique sequences (all stop types)
                    const uniqueSeqs = new Set(
                      orders.map((o) => o.routeSequence).filter((s) => s != null)
                    )
                    const orderCount = uniqueSeqs.size || orders.length
                    // Planned qty = delivery orders (type "D") only; treat undefined as "D" for other routes
                    const plannedQty = orders.reduce(
                      (sum, o) => (!o.orderType || o.orderType === "D" ? sum + (o.volume ?? 0) : sum),
                      0
                    )
                    const diff = plannedQty - TRUCK_CAPACITY

                    // Hub name
                    const hubId = orders[0]?.hubId
                    const hub = mockHubs.find((h) => h.id === hubId)
                    const hubName = hub?.name ?? "Austin HUB"

                    // Sorted orders for expanded view
                    const sortedOrders = [...orders].sort(
                      (a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0)
                    )

                    return (
                      <div key={routeId}>
                        {/* Outer row: [checkbox+chevron] [card] */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 8,
                          }}
                          onMouseEnter={() => onHoveredRouteChange(routeId)}
                          onMouseLeave={() => onHoveredRouteChange(null)}
                        >
                          {/* Left column: checkbox + chevron — padded to vertically center with collapsed card (~72px tall) */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                              alignSelf: "flex-start",
                              paddingTop: 24,
                            }}
                          >
                            <CheckboxInput
                              checked={isChecked}
                              onChange={() => toggleRouteChecked(routeId)}
                            />
                            <button
                              onClick={() => toggleExpanded(routeId)}
                              style={{
                                width: 24,
                                height: 24,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#737373",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: 4,
                                padding: 0,
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </div>

                          {/* Right: card + alert bar + expanded section */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <RouteCardCollapsed
                              color={color}
                              driverName={driverName}
                              orderCount={orderCount}
                              plannedQty={plannedQty}
                              truckName="H-118 · 2019 Kenworth Tank Wagon"
                              isHovered={hoveredRouteId === routeId}
                            />

                            {/* Alert bar */}
                            {Math.abs(diff) > 0 && !isExpanded && (
                              <div
                                style={{
                                  backgroundColor: "rgba(234, 179, 8, 0.09)",
                                  borderRadius: "0px 0px 4px 4px",
                                  padding: "6px 16px 6px 20px",
                                  display: "flex",
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span style={{ fontSize: 14, fontWeight: 400, color: "#EAB308" }}>
                                  {diff > 0
                                    ? `+${diff.toLocaleString()} gal`
                                    : `${diff.toLocaleString()} gal`}
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 400, color: "#EAB308" }}>
                                  {diff > 0 ? "Route over-utilized" : "Route under-utilized"}
                                </span>
                              </div>
                            )}

                            {/* Expanded accordion */}
                            {isExpanded && (
                              <ExpandedRouteCard
                                orders={sortedOrders}
                                color={color}
                                hubName={hubName}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── UNASSIGNED TAB ── */}
            {activeTab === "unassigned" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "12px 0 16px",
                }}
              >
                {unassignedOrders.length === 0 ? (
                  <p
                    style={{
                      fontSize: 14,
                      color: "#737373",
                      textAlign: "center",
                      padding: "32px 0",
                    }}
                  >
                    No unassigned orders selected.
                  </p>
                ) : (
                  unassignedOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: "#1F1F1F",
                        border: "1px solid #282828",
                        borderRadius: 4,
                        padding: 12,
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <CheckboxInput checked={false} onChange={() => {}} />
                        <div>
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              color: "#FAFAFA",
                              margin: 0,
                            }}
                          >
                            {order.customerName}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: "#737373",
                              margin: 0,
                            }}
                          >
                            {order.shipToAddress}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: getTankLevelColor(order.currentLevel),
                            }}
                          />
                          <span style={{ fontSize: 12, color: "#A3A3A3" }}>
                            {order.currentLevel}%
                          </span>
                        </div>
                        <button
                          style={{
                            width: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#737373",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: 4,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid rgba(115, 115, 115, 0.2)",
              flexShrink: 0,
            }}
          >
            <button
              style={{
                width: "100%",
                height: 40,
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                color: "#FAFAFA",
                backgroundColor: "#4D55F8",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3D45E8")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4D55F8")}
            >
              Publish Routes
            </button>
          </div>
        </>
      )}
    </div>
  )
}
