"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, Maximize2, Minimize2, Sparkles, TriangleAlert, X } from "lucide-react"
import type { OptimizationResult, OptimizedRoute, Stop, UnassignedOrder, UnassignedReason } from "@/lib/optimization-types"
import { formatEstTime } from "@/lib/mock-optimization-result"
import { OptimizationRouteCard } from "@/components/optimization-route-card"

type TabId = "routes" | "unassigned"
type ViewId = "list" | "detail"

interface OptimizationRoutesDrawerProps {
  isOpen: boolean
  result: OptimizationResult | null
  onClose: () => void
  onProceed?: () => void
  onUnassignedCta?: (action: string, order: UnassignedOrder) => void
}

const REASON_GROUPS: { reason: UnassignedReason; label: string }[] = [
  { reason: "missing_product_qty", label: "Missing product or quantity" },
  { reason: "missing_data", label: "Missing data" },
  { reason: "no_capacity", label: "No capacity" },
  { reason: "time_window", label: "Time window" },
  { reason: "product_truck_fit", label: "Product or truck fit" },
  { reason: "no_terminal_product", label: "No terminal product" },
  { reason: "retain", label: "Retain constraint" },
  { reason: "compartment_not_empty", label: "Compartment not empty" },
]

function Dot() {
  return (
    <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#a3a3a3", flexShrink: 0, display: "inline-block" }} />
  )
}

function SummaryTabCard({
  label, count, subtext, countColor = "#FFFFFF", isActive, onClick,
}: {
  label: string; count: number; subtext: React.ReactNode; countColor?: string; isActive: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: "12px",
        backgroundColor: isActive ? "#282828" : "#1F1F1F",
        borderRadius: 4, border: "none",
        borderBottom: isActive ? "2px solid #D4D4D8" : "2px solid transparent",
        cursor: "pointer", textAlign: "left", fontFamily: "Geist, sans-serif",
        boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 8,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3", lineHeight: "20px", display: "block" }}>{label}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: countColor, lineHeight: "28px", display: "block" }}>{count}</span>
        <div style={{ fontSize: 12, fontWeight: 400, color: "#a3a3a3", lineHeight: "16px", display: "flex", alignItems: "center", gap: 8 }}>
          {subtext}
        </div>
      </div>
    </button>
  )
}

function DetailStopRow({ stop, isLast }: { stop: Stop; isLast: boolean }) {
  const isLoad = stop.kind === "load"
  return (
    <div style={{ display: "flex", borderBottom: isLast ? "none" : "1px solid #282828" }}>
      {/* Stops column */}
      <div style={{ flex: 1, minWidth: 0, padding: "12px 12px 12px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", width: 12, flexShrink: 0, textAlign: "center", lineHeight: "20px" }}>
          {typeof stop.seq === "number" ? stop.seq : ""}
        </span>
        <div style={{
          width: 20, height: 20, borderRadius: 4, flexShrink: 0,
          backgroundColor: isLoad ? "#189FFC" : "#25B8A7",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#171717", lineHeight: 1 }}>{isLoad ? "L" : "D"}</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 400, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, lineHeight: "24px" }}>
          {stop.name}
        </span>
        {stop.loadType === "manual" && (
          <span style={{ fontSize: 14, fontWeight: 500, color: "#eab308", backgroundColor: "rgba(234,179,8,0.1)", borderRadius: 4, padding: "2px 8px", flexShrink: 0, whiteSpace: "nowrap" }}>
            Manual Load
          </span>
        )}
        {stop.mustGo && (
          <span style={{ fontSize: 14, fontWeight: 500, color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)", borderRadius: 4, padding: "2px 8px", flexShrink: 0, whiteSpace: "nowrap" }}>
            1 Must-go
          </span>
        )}
      </div>
      {/* Planned Qty column */}
      <div style={{ width: 120, flexShrink: 0, padding: "12px", display: "flex", alignItems: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 400, color: "#e5e5e5", lineHeight: "24px" }}>
          {stop.qtyGal != null ? `${stop.qtyGal.toLocaleString()} gal` : "—"}
        </span>
      </div>
    </div>
  )
}

function DetailMetric({ value, label, valueColor = "white" }: { value: string; label: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
      <span style={{ fontSize: 16, fontWeight: 500, color: valueColor, lineHeight: "24px", whiteSpace: "nowrap" }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 400, color: "#a3a3a3", lineHeight: "16px", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  )
}

function RouteDetailView({
  route, onBack, onPrev, onNext,
}: {
  route: OptimizedRoute
  onBack: () => void
  onPrev?: () => void
  onNext?: () => void
}) {
  const overShift = route.flags.overShift

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "20px 24px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Nav: All Routes button + Prev/Next arrows */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button
            type="button" onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 12px", border: "1px solid #333", borderRadius: 4, background: "none", cursor: "pointer", fontFamily: "Geist, sans-serif", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)", flexShrink: 0 }}
          >
            <ArrowLeft size={16} color="#fafafa" />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa", lineHeight: "20px" }}>All Routes</span>
          </button>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              type="button" onClick={onNext} disabled={!onNext}
              title="Next route"
              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #333", borderRadius: 4, background: "none", cursor: onNext ? "pointer" : "not-allowed", opacity: onNext ? 1 : 0.4, boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
            >
              <ArrowDown size={16} color="#fafafa" />
            </button>
            <button
              type="button" onClick={onPrev} disabled={!onPrev}
              title="Previous route"
              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #333", borderRadius: 4, background: "none", cursor: onPrev ? "pointer" : "not-allowed", opacity: onPrev ? 1 : 0.4, boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
            >
              <ArrowUp size={16} color="#fafafa" />
            </button>
          </div>
        </div>

        {/* Route header: truck name + specs on left, badges on right */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexShrink: 0 }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 500, color: "#e5e5e5", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {route.truckName}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px", whiteSpace: "nowrap" }}>{route.specs.capacityGal}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#a3a3a3", flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px", whiteSpace: "nowrap" }}>{route.specs.compartments}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#a3a3a3", flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px", whiteSpace: "nowrap" }}>{route.specs.productCount} Products</span>
            </div>
          </div>
          {/* Right: badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!!route.flags.mustGoCount && (
              <span style={{ fontSize: 14, fontWeight: 500, color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)", borderRadius: 4, padding: "2px 8px", whiteSpace: "nowrap" }}>
                {route.flags.mustGoCount} Must-go
              </span>
            )}
            {route.flags.hasManualLoad && (
              <span style={{ fontSize: 14, fontWeight: 500, color: "#eab308", backgroundColor: "rgba(234,179,8,0.1)", borderRadius: 4, padding: "2px 8px", whiteSpace: "nowrap" }}>
                Manual Load
              </span>
            )}
            <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa", backgroundColor: "#111", border: "1px solid transparent", borderRadius: 4, padding: "2px 8px", whiteSpace: "nowrap" }}>
              {route.orderCount} Orders
            </span>
          </div>
        </div>

        {/* Route Summary metrics card */}
        <div style={{ backgroundColor: "#282828", borderRadius: 4, padding: "12px 12px 12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 32 }}>
            <DetailMetric value={String(route.stopCount ?? route.orderCount)} label="Stops" />
            <DetailMetric value={String(route.metrics.gpm)} label="GPM" />
            <DetailMetric
              value={formatEstTime(route.metrics.estTimeMins)}
              label="Estimated Time"
              valueColor={overShift ? "#eab308" : "white"}
            />
            <DetailMetric value={`${route.metrics.estDistanceMi} mi`} label="Estimated Distance" />
          </div>
          <button
            type="button"
            style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px", border: "none", borderRadius: 4, background: "transparent", cursor: "pointer", fontFamily: "Geist, sans-serif", flexShrink: 0 }}
          >
            <Sparkles size={16} color="#fafafa" />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa", lineHeight: "20px", whiteSpace: "nowrap" }}>Re-Optimize this Route</span>
          </button>
        </div>

        {/* Why This Route? — indigo card */}
        {route.why && route.why.length > 0 && (
          <div style={{ backgroundColor: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.5)", borderRadius: 4, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ flexShrink: 0, paddingTop: 2, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24 }}>
              <Sparkles size={20} color="#6366f1" style={{ transform: "rotate(-90deg)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: "white", lineHeight: "24px", margin: "0 0 4px 0" }}>Why This Route?</p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "white" }}>
                {route.why.map((line, i) => (
                  <li key={i} style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px" }}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Orders table */}
        {route.sequence && route.sequence.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 300, color: "#a3a3a3", lineHeight: "24px", margin: "0 0 12px 0" }}>Orders</p>
            <div style={{ border: "1px solid #282828", borderRadius: 4, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "flex", backgroundColor: "#282828", borderBottom: "1px solid #282828" }}>
                <div style={{ flex: 1, height: 40, padding: "0 12px", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#a3a3a3", lineHeight: "20px" }}>Stops</span>
                </div>
                <div style={{ width: 120, flexShrink: 0, height: 40, padding: "0 12px", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#a3a3a3", lineHeight: "20px" }}>Planned Qty</span>
                </div>
              </div>
              {/* Rows */}
              {route.sequence.map((stop, i) => (
                <DetailStopRow key={i} stop={stop} isLast={i === route.sequence!.length - 1} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function UnassignedOrderRow({ order, onCta }: { order: UnassignedOrder; onCta: (action: string, order: UnassignedOrder) => void }) {
  return (
    <div
      style={{
        backgroundColor: "#1F1F1F",
        borderRadius: 4,
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      {/* Left: name + must-go pill + reason text */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", lineHeight: "20px" }}>
            {order.name}
          </span>
          {order.mustGo && (
            <span
              style={{
                fontSize: 12, fontWeight: 500, color: "#f87171",
                backgroundColor: "rgba(248,113,113,0.1)", borderRadius: 4,
                padding: "2px 6px", flexShrink: 0, lineHeight: "16px",
              }}
            >
              Must-go
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 400, color: "#737373", lineHeight: "18px" }}>
          {order.reasonDetail}
        </span>
      </div>

      {/* Right: CTA link button */}
      {order.suggestedFix && (
        <button
          type="button"
          onClick={() => onCta(order.suggestedFix!, order)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 400, color: "#818CF8",
            padding: 0, flexShrink: 0, textAlign: "right",
            lineHeight: "20px", fontFamily: "Geist, sans-serif",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75" }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
        >
          {order.suggestedFix}
        </button>
      )}
    </div>
  )
}

function UnassignedGroup({ label, orders, onCta }: {
  label: string
  orders: UnassignedOrder[]
  onCta: (action: string, order: UnassignedOrder) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 400, color: "#525252", lineHeight: "16px" }}>{orders.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {orders.map((o) => <UnassignedOrderRow key={o.id} order={o} onCta={onCta} />)}
      </div>
    </div>
  )
}

function UnassignedTab({ result, onCta }: {
  result: OptimizationResult
  onCta: (action: string, order: UnassignedOrder) => void
}) {
  const { summary } = result
  const groups = REASON_GROUPS
    .map((g) => ({ ...g, orders: result.unassigned.filter((o) => o.reason === g.reason) }))
    .filter((g) => g.orders.length > 0)

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 24px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Banner */}
      <div style={{ backgroundColor: "#1F1F1F", border: "1px solid #333", borderRadius: 4, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ paddingTop: 2, flexShrink: 0 }}>
          <TriangleAlert size={20} color="#eab308" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#eab308", lineHeight: "20px" }}>
            {summary.unassignedCount} of {summary.ordersTotal} orders couldn't be placed in this run.
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: "#eab308", lineHeight: "20px" }}>
            Review each reason below and take action before proceeding.
          </p>
        </div>
      </div>

      {/* Reason groups — all expanded */}
      {groups.map((g) => (
        <UnassignedGroup key={g.reason} label={g.label} orders={g.orders} onCta={onCta} />
      ))}
    </div>
  )
}

/** Shared body — route list or unassigned list, used in both drawer and expanded modal */
function DrawerBody({
  result, activeTab, setActiveTab, view, setView, selectedRouteId, setSelectedRouteId, onUnassignedCta,
}: {
  result: OptimizationResult
  activeTab: TabId; setActiveTab: (t: TabId) => void
  view: ViewId; setView: (v: ViewId) => void
  selectedRouteId: string | null; setSelectedRouteId: (id: string | null) => void
  onUnassignedCta: (action: string, order: UnassignedOrder) => void
}) {
  const { summary } = result
  const selectedRoute = result.routes.find((r) => r.id === selectedRouteId) ?? null

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {view === "list" && (
        <>
          <div style={{ flexShrink: 0, display: "flex", gap: 12, padding: "20px 24px 0 24px" }}>
            <SummaryTabCard
              label="Routes" count={summary.routeCount} isActive={activeTab === "routes"}
              onClick={() => setActiveTab("routes")}
              subtext={<><span>{summary.routeCount} Trucks</span><Dot /><span>{summary.ordersPlaced}/{summary.ordersTotal} Orders</span></>}
            />
            <SummaryTabCard
              label="Unassigned orders" count={summary.unassignedCount} countColor="#eab308"
              isActive={activeTab === "unassigned"} onClick={() => setActiveTab("unassigned")}
              subtext={<span>{summary.conflictCount} conflicts</span>}
            />
          </div>
          {activeTab === "routes" ? (
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 24px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {result.routes.map((route) => (
                <OptimizationRouteCard
                  key={route.id} route={route}
                  onClick={() => { setSelectedRouteId(route.id); setView("detail") }}
                />
              ))}
            </div>
          ) : (
            <UnassignedTab result={result} onCta={onUnassignedCta} />
          )}
        </>
      )}
      {view === "detail" && selectedRoute && (() => {
        const idx = result.routes.findIndex((r) => r.id === selectedRouteId)
        return (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <RouteDetailView
              route={selectedRoute}
              onBack={() => { setView("list"); setSelectedRouteId(null) }}
              onPrev={idx > 0 ? () => setSelectedRouteId(result.routes[idx - 1].id) : undefined}
              onNext={idx < result.routes.length - 1 ? () => setSelectedRouteId(result.routes[idx + 1].id) : undefined}
            />
          </div>
        )
      })()}
    </div>
  )
}

export function OptimizationRoutesDrawer({ isOpen, result, onClose, onProceed, onUnassignedCta }: OptimizationRoutesDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>("routes")
  const [view, setView] = useState<ViewId>("list")
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [animIn, setAnimIn] = useState(false)

  useEffect(() => {
    if (!isOpen) { setAnimIn(false); return }
    const id = requestAnimationFrame(() => setAnimIn(true))
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) { setExpanded(false); setView("list"); setSelectedRouteId(null); setActiveTab("routes") }
  }, [isOpen])

  if (!isOpen || !result) return null

  const { summary } = result

  const handleClose = () => {
    onClose()
  }

  const handleProceed = () => {
    console.log("[OptimizationRoutesDrawer] onProceed — route IDs:", result.routes.map((r) => r.id))
    onProceed?.()
    handleClose()
  }

  // Stub — future flows will route to data edit panel, truck assignment, manual dispatch, etc.
  const handleUnassignedCta = (action: string, order: UnassignedOrder) => {
    console.log("[OptimizationRoutesDrawer] onUnassignedCta:", action, order)
    onUnassignedCta?.(action, order)
  }

  const header = (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, padding: "24px 24px 0 24px" }}>
      {/* Row 1: title + expand + close */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
          Optimized Routes
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: 0, borderRadius: 4, flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
          title={expanded ? "Collapse to drawer" : "Expand to full view"}
        >
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button
          type="button"
          onClick={handleClose}
          style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: 0, borderRadius: 4, flexShrink: 0 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
      {/* Row 2: subtitle */}
      <span style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px" }}>
        Generated from {summary.ordersTotal} orders across {summary.routeCount} trucks
      </span>
    </div>
  )

  const footer = (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 24px 24px", gap: 12 }}>
      <button
        type="button" onClick={handleClose}
        style={{ height: 36, padding: "0 16px", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#fafafa", backgroundColor: "transparent", border: "1px solid #333", cursor: "pointer", fontFamily: "Geist, sans-serif", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}
      >
        Cancel
      </button>
      <button
        type="button" onClick={handleProceed}
        style={{ height: 36, padding: "0 16px", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#171717", backgroundColor: "#e5e5e5", border: "none", cursor: "pointer", fontFamily: "Geist, sans-serif", whiteSpace: "nowrap", overflow: "hidden" }}
      >
        Proceed &amp; Add to Workspace
      </button>
    </div>
  )

  // ── Expanded: centered modal over backdrop (same z-level as other modals)
  if (expanded) {
    return (
      <div
        style={{
          position: "fixed", top: 68, left: 0, right: 0, bottom: 0,
          zIndex: 1250,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
          fontFamily: "Geist, sans-serif",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false) }}
      >
        <div
          style={{
            display: "flex", flexDirection: "column",
            width: 1000, maxWidth: "100%",
            maxHeight: "calc(100vh - 68px - 48px)",
            backgroundColor: "#1B1B1B",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
          }}
        >
          {header}
          <DrawerBody
            result={result} activeTab={activeTab} setActiveTab={setActiveTab}
            view={view} setView={setView}
            selectedRouteId={selectedRouteId} setSelectedRouteId={setSelectedRouteId}
            onUnassignedCta={handleUnassignedCta}
          />
          {footer}
        </div>
      </div>
    )
  }

  // ── Collapsed (default): floating panel — same container pattern as Create Order modal3
  return (
    <div
      style={{
        position: "fixed", top: 68, left: 0, right: 0, bottom: 0,
        zIndex: 1250,
        backgroundColor: "transparent",
        pointerEvents: "none",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 8, right: 52, bottom: 8,
          width: 720,
          pointerEvents: "auto",
          backgroundColor: "#111111",
          borderRadius: 12,
          border: "1px solid #282828",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: animIn ? "translateX(0)" : "translateX(calc(100% + 60px))",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {header}
        <DrawerBody
          result={result} activeTab={activeTab} setActiveTab={setActiveTab}
          view={view} setView={setView}
          selectedRouteId={selectedRouteId} setSelectedRouteId={setSelectedRouteId}
          onUnassignedCta={handleUnassignedCta}
        />
        {footer}
      </div>
    </div>
  )
}
