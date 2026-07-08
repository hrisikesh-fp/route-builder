"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Maximize2, Sparkles, Truck, X } from "lucide-react"
import type { OptimizationResult, OptimizedRoute, Stop, UnassignedOrder, UnassignedReason } from "@/lib/optimization-types"
import { OptimizationRouteCard } from "@/components/optimization-route-card"

type TabId = "routes" | "unassigned"
type ViewId = "list" | "detail"

interface OptimizationRoutesDrawerProps {
  isOpen: boolean
  result: OptimizationResult | null
  onClose: () => void
  onProceed?: () => void
}

const REASON_LABELS: Record<UnassignedReason, string> = {
  missing_data: "Missing Data",
  time_window: "Time Window",
  no_terminal_product: "No Terminal Product",
  no_capacity: "No Capacity",
  retain: "Retain Constraint",
  compartment_not_empty: "Compartment Not Empty",
}

function Dot() {
  return (
    <span
      style={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        backgroundColor: "#737373",
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  )
}

function SummaryTabCard({
  label,
  count,
  subtext,
  countColor = "#E5E5E5",
  isActive,
  onClick,
}: {
  label: string
  count: number
  subtext: React.ReactNode
  countColor?: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "14px 16px",
        backgroundColor: isActive ? "#282828" : "#1a1a1a",
        borderRadius: 4,
        border: "none",
        borderBottom: isActive ? "2px solid #D4D4D8" : "2px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "Geist, sans-serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px", display: "block" }}>
        {label}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 22, fontWeight: 500, color: countColor, lineHeight: "28px", display: "block" }}>
          {count}
        </span>
        <div style={{ fontSize: 11, fontWeight: 400, color: "#737373", lineHeight: "14px", display: "flex", alignItems: "center", gap: 6 }}>
          {subtext}
        </div>
      </div>
    </button>
  )
}

function StopRow({ stop }: { stop: Stop }) {
  const isLoad = stop.kind === "load"
  const badgeBg = isLoad ? (stop.loadType === "manual" ? "#737373" : "#189FFC") : "#25B8A7"
  const badgeLabel = isLoad ? "L" : "D"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #282828" }}>
      <span style={{ width: 22, fontSize: 12, color: "#737373", textAlign: "center", flexShrink: 0 }}>{stop.seq}</span>
      <div style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: badgeBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#171717" }}>{badgeLabel}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#E5E5E5", lineHeight: "18px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {stop.name}
          {stop.mustGo && <span style={{ marginLeft: 6, fontSize: 11, color: "#eab308" }}>Must-go</span>}
        </div>
        <div style={{ fontSize: 12, color: "#737373", lineHeight: "16px" }}>
          {stop.product}{stop.qtyGal != null ? ` · ${stop.qtyGal.toLocaleString()} gal` : ""}
        </div>
      </div>
    </div>
  )
}

function RouteDetailView({ route, onBack }: { route: OptimizedRoute; onBack: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "0 0 16px 0", flexShrink: 0, fontFamily: "Geist, sans-serif" }}
      >
        <ArrowLeft size={16} color="#A3A3A3" />
        <span style={{ fontSize: 13, color: "#A3A3A3", lineHeight: "18px" }}>Back to routes</span>
      </button>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 36, backgroundColor: route.color, flexShrink: 0, borderRadius: 2 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Truck size={14} color="#E5E5E5" />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", lineHeight: "20px" }}>{route.truckName}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 4, border: "1px solid #333", background: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#FAFAFA", fontFamily: "Geist, sans-serif" }}
          >
            <Sparkles size={12} color="#A3A3A3" />
            Re-optimize
          </button>
        </div>
        {route.why && route.why.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#E5E5E5", lineHeight: "18px", display: "block", marginBottom: 8 }}>Why this route</span>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
              {route.why.map((line, i) => (
                <li key={i} style={{ fontSize: 13, color: "#A3A3A3", lineHeight: "18px" }}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {route.sequence && route.sequence.length > 0 && (
          <div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#E5E5E5", lineHeight: "18px", display: "block", marginBottom: 6 }}>Stops</span>
            {route.sequence.map((stop, i) => <StopRow key={i} stop={stop} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function UnassignedSection({ orders, reason }: { orders: UnassignedOrder[]; reason: UnassignedReason }) {
  if (orders.length === 0) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>
          {REASON_LABELS[reason]}
        </span>
        <span style={{ fontSize: 11, color: "#737373", lineHeight: "14px" }}>{orders.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {orders.map((o) => (
          <div
            key={o.id}
            style={{ backgroundColor: "#1F1F1F", borderRadius: 4, padding: "10px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#E5E5E5", lineHeight: "18px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {o.name}
                </span>
                {o.mustGo && (
                  <span style={{ fontSize: 10, fontWeight: 500, color: "#f87171", backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>Must-go</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "#737373", lineHeight: "14px" }}>{o.reasonDetail}</span>
            </div>
            {o.suggestedFix && (
              <span style={{ fontSize: 11, color: "#6366f1", lineHeight: "14px", flexShrink: 0, textAlign: "right" }}>{o.suggestedFix}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function OptimizationRoutesDrawer({ isOpen, result, onClose, onProceed }: OptimizationRoutesDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("routes")
  const [view, setView] = useState<ViewId>("list")
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  // slide-in animation
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setAnimIn(false)
      return
    }
    const id = requestAnimationFrame(() => setAnimIn(true))
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  if (!isOpen || !result) return null

  const { summary } = result
  const selectedRoute = result.routes.find((r) => r.id === selectedRouteId) ?? null

  const handleClose = () => {
    setActiveTab("routes")
    setView("list")
    setSelectedRouteId(null)
    onClose()
  }

  const handleProceed = () => {
    console.log("[OptimizationRoutesDrawer] onProceed — route IDs:", result.routes.map((r) => r.id))
    onProceed?.()
    handleClose()
  }

  const unassignedByReason = (reason: UnassignedReason) =>
    result.unassigned.filter((o) => o.reason === reason)

  return (
    <>
      {/* Backdrop — dims map + workspace behind drawer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1299,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
        onClick={handleClose}
      />

      {/* Drawer — slides in from right */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 560,
          height: "100vh",
          zIndex: 1300,
          backgroundColor: "#111",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Geist, sans-serif",
          transform: animIn ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: "20px 20px 16px 20px",
            borderBottom: "1px solid #282828",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "#E5E5E5", lineHeight: "24px" }}>
                Optimized Routes
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 400, color: "#737373", lineHeight: "18px" }}>
                Generated from {summary.ordersTotal} orders across {summary.routeCount} trucks
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* Expand — stub */}
              <button
                type="button"
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#737373", padding: 0, borderRadius: 4 }}
                title="Expand (coming soon)"
              >
                <Maximize2 size={16} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#A3A3A3", padding: 0, borderRadius: 4 }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {view === "list" && (
            <>
              {/* Summary tab cards */}
              <div style={{ flexShrink: 0, display: "flex", gap: 8, padding: "12px 16px 0 16px" }}>
                <SummaryTabCard
                  label="Routes"
                  count={summary.routeCount}
                  isActive={activeTab === "routes"}
                  onClick={() => setActiveTab("routes")}
                  subtext={
                    <>
                      <span>{summary.routeCount} Trucks</span>
                      <Dot />
                      <span>{summary.ordersPlaced}/{summary.ordersTotal} Orders</span>
                    </>
                  }
                />
                <SummaryTabCard
                  label="Unassigned orders"
                  count={summary.unassignedCount}
                  countColor="#eab308"
                  isActive={activeTab === "unassigned"}
                  onClick={() => setActiveTab("unassigned")}
                  subtext={<span>{summary.conflictCount} conflicts</span>}
                />
              </div>

              {/* Content area */}
              {activeTab === "routes" ? (
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.routes.map((route) => (
                    <OptimizationRouteCard
                      key={route.id}
                      route={route}
                      onClick={() => { setSelectedRouteId(route.id); setView("detail") }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px" }}>
                  <UnassignedSection orders={unassignedByReason("missing_data")} reason="missing_data" />
                  <UnassignedSection orders={unassignedByReason("no_capacity")} reason="no_capacity" />
                  <UnassignedSection orders={unassignedByReason("time_window")} reason="time_window" />
                  <UnassignedSection orders={unassignedByReason("retain")} reason="retain" />
                  <UnassignedSection orders={unassignedByReason("no_terminal_product")} reason="no_terminal_product" />
                  <UnassignedSection orders={unassignedByReason("compartment_not_empty")} reason="compartment_not_empty" />
                </div>
              )}
            </>
          )}

          {view === "detail" && selectedRoute && (
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px" }}>
              <RouteDetailView
                route={selectedRoute}
                onBack={() => { setView("list"); setSelectedRouteId(null) }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderTop: "1px solid #282828",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 500,
              color: "#E5E5E5",
              backgroundColor: "transparent",
              border: "1px solid #333",
              cursor: "pointer",
              fontFamily: "Geist, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            style={{
              height: 36,
              padding: "0 20px",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 500,
              color: "#111",
              backgroundColor: "#FAFAFA",
              border: "none",
              cursor: "pointer",
              fontFamily: "Geist, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            Proceed &amp; Add to Workspace
          </button>
        </div>
      </div>
    </>
  )
}
