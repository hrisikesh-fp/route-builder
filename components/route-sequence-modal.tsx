"use client"

import { useState, useEffect } from "react"
import { X, Truck, ChevronDown } from "lucide-react"
import { TimePicker } from "@/components/time-picker"

type StopType = "L" | "D" | "T"

const BADGE_COLOR: Record<StopType, string> = {
  L: "#189FFC",
  D: "#25B8A7",
  T: "#737373",
}

interface SequenceStop {
  seq: number | string
  type: StopType
  name: string
  qty: number
}

interface SequenceRoute {
  id: string
  truckName: string
  orderCount: number
  color: string
  specs?: { gal?: string; compartments?: string; products?: number }
  stops?: SequenceStop[]
}

interface RouteSequenceModalProps {
  isOpen: boolean
  driverName: string
  date: string
  routes: SequenceRoute[]
  startTimes: Record<string, string>
  onTimeChange: (routeId: string, time: string) => void
  onConfirm: () => void
  onCancel: () => void
  prefilledTruckName?: string
}

// ─── 4px dot separator ───────────────────────────────────────────────────────
function Dot() {
  return <span style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: "#737373", flexShrink: 0 }} />
}

// ─── Stop type badge (L / D / T) ─────────────────────────────────────────────
function TypeBadge({ type }: { type: StopType }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
      backgroundColor: BADGE_COLOR[type],
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: "#171717", lineHeight: "20px" }}>{type}</span>
    </div>
  )
}

// ─── Orders table (Stops | Planned Qty) ──────────────────────────────────────
function OrdersTable({ stops }: { stops: SequenceStop[] }) {
  const headStyle: React.CSSProperties = {
    height: 40, display: "flex", alignItems: "center", padding: "0 12px",
    backgroundColor: "#282828", borderBottom: "1px solid #282828",
    fontSize: 14, fontWeight: 500, color: "#a3a3a3", lineHeight: "20px",
  }
  const cellBase: React.CSSProperties = {
    display: "flex", alignItems: "center", borderBottom: "1px solid #282828", boxSizing: "border-box",
  }
  return (
    <div style={{ border: "1px solid #282828", borderRadius: 4, overflow: "hidden", display: "flex", width: "100%" }}>
      {/* Stops column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={headStyle}>Stops</div>
        {stops.map((s, i) => (
          <div key={i} style={{ ...cellBase, gap: 8, padding: "12px 12px 12px 8px", ...(i === stops.length - 1 ? { borderBottom: "none" } : {}) }}>
            <span style={{ width: 12, textAlign: "center", fontSize: 14, color: "#a3a3a3", lineHeight: "20px", flexShrink: 0 }}>{s.seq}</span>
            <TypeBadge type={s.type} />
            <span style={{
              flex: 1, minWidth: 0, fontSize: 16, color: "#e5e5e5", lineHeight: "24px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{s.name}</span>
          </div>
        ))}
      </div>
      {/* Planned Qty column */}
      <div style={{ width: 120, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={headStyle}>Planned Qty</div>
        {stops.map((s, i) => (
          <div key={i} style={{ ...cellBase, padding: 12, fontSize: 16, color: "#e5e5e5", lineHeight: "24px", ...(i === stops.length - 1 ? { borderBottom: "none" } : {}) }}>
            {s.qty.toLocaleString()} gal
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── One route card ──────────────────────────────────────────────────────────
function RouteCard({
  route,
  time,
  onTimeChange,
  disabledTimes,
}: {
  route: SequenceRoute
  time: string
  onTimeChange: (t: string) => void
  disabledTimes: string[]
}) {
  const [expanded, setExpanded] = useState(true)
  const [showTable, setShowTable] = useState(false)
  const [headerHovered, setHeaderHovered] = useState(false)
  const hasStops = !!route.stops && route.stops.length > 0
  const hasTruck = !!route.truckName

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 4 }}>
      {/* Accent rail */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 6, backgroundColor: route.color, zIndex: 3, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }} />

      {/* Header row — entire row is the click target */}
      <div
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 12px 12px 20px", position: "relative", zIndex: 2,
          cursor: "pointer",
          backgroundColor: headerHovered ? "#333" : "#282828",
          borderRadius: expanded ? "4px 4px 0 0" : 4,
          transition: "background-color 150ms",
        }}
      >
        {hasTruck ? (
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Truck size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: 16, fontWeight: 500, color: "#FFFFFF", lineHeight: "24px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{route.truckName}</span>
            </div>
            {route.specs && (route.specs.gal || route.specs.compartments || route.specs.products != null) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#a3a3a3", lineHeight: "20px" }}>
                {route.specs.gal && <span>{route.specs.gal}</span>}
                {route.specs.gal && route.specs.compartments && <Dot />}
                {route.specs.compartments && <span>{route.specs.compartments}</span>}
                {route.specs.products != null && (route.specs.gal || route.specs.compartments) && <Dot />}
                {route.specs.products != null && <span>{route.specs.products} Products</span>}
              </div>
            )}
          </div>
        ) : (
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#737373", lineHeight: "20px" }}>No Truck Selected</span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{
            backgroundColor: "#111", borderRadius: 4, padding: "2px 8px",
            fontSize: 14, fontWeight: 500, color: "#fafafa", lineHeight: "20px", whiteSpace: "nowrap",
          }}>
            {route.orderCount} Orders
          </div>
          <ChevronDown
            size={20}
            color="#a3a3a3"
            style={{ transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
          />
        </div>
      </div>

      {/* Body — animated card collapse */}
      <div style={{
        overflow: "hidden",
        maxHeight: expanded ? 600 : 0,
        transition: "max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        borderRadius: "0 0 4px 4px",
      }}>
        <div style={{
          backgroundColor: "#1f1f1f", padding: "16px 16px 16px 20px",
          display: "flex", flexDirection: "column",
          borderRadius: "0 0 4px 4px",
        }}>
            <div style={{ marginBottom: hasStops ? 12 : 0 }}>
              <TimePicker value={time} onChange={onTimeChange} disabledTimes={disabledTimes} />
            </div>

            {hasStops && (
              <>
                {/* Orders table — animated reveal */}
                <div style={{
                  overflow: "hidden",
                  maxHeight: showTable ? 400 : 0,
                  transition: "max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}>
                  <div style={{ paddingBottom: 12 }}>
                    <OrdersTable stops={route.stops!} />
                  </div>
                </div>

                <button
                  onClick={() => setShowTable((v) => !v)}
                  style={{
                    alignSelf: "flex-start", height: 32, padding: "0 12px", background: "none", border: "none",
                    borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#fafafa", cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {showTable ? "See less" : "See All Orders"}
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function RouteSequenceModal({
  isOpen,
  driverName,
  date,
  routes,
  startTimes,
  onTimeChange,
  onConfirm,
  onCancel,
  prefilledTruckName,
}: RouteSequenceModalProps) {
  const [hintDismissed, setHintDismissed] = useState(false)

  useEffect(() => {
    if (isOpen) setHintDismissed(false)
  }, [isOpen])

  if (!isOpen) return null

  const allTimesSet = routes.every((r) => !!startTimes[r.id])

  // For a given route, the other routes' chosen times are disabled (can't share a start time)
  function disabledForRoute(routeId: string): string[] {
    return routes.filter((r) => r.id !== routeId && startTimes[r.id]).map((r) => startTimes[r.id])
  }

  return (
    <div
      onClick={onCancel}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", inset: 0, zIndex: 10100,
        backgroundColor: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540, maxWidth: "calc(100vw - 48px)", maxHeight: "min(720px, calc(100vh - 80px))",
          backgroundColor: "#1B1B1B", border: "1px solid #333", borderRadius: 8,
          padding: 24, display: "flex", flexDirection: "column", gap: 20,
          boxSizing: "border-box", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>Set Start Time</span>
            <button
              onClick={onCancel}
              style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#A3A3A3", flexShrink: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
            >
              <X size={20} />
            </button>
          </div>
          <p style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px", margin: 0 }}>
            <span style={{ fontWeight: 500, color: "#e5e5e5" }}>{driverName}</span>
            {" is already planned on another route for "}
            <span style={{ fontWeight: 500, color: "#e5e5e5" }}>{date}</span>
            {". Set start times so that the routes sequence correctly."}
          </p>
        </div>

        {/* Truck pre-fill info strip (AC2) */}
        {prefilledTruckName && !hintDismissed && (
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
            padding: "8px 12px", borderRadius: 4, flexShrink: 0,
            backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
          }}>
            <span style={{ fontSize: 13, color: "#a5b4fc", lineHeight: "20px" }}>
              Same driver — truck pre-filled from sibling route ({prefilledTruckName}). You can change it after.
            </span>
            <button
              onClick={() => setHintDismissed(true)}
              style={{
                width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", cursor: "pointer", color: "#818cf8", flexShrink: 0, padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#818cf8")}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Body — route cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", minHeight: 0, flexShrink: 1 }}>
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              time={startTimes[route.id] ?? ""}
              onTimeChange={(t) => onTimeChange(route.id, t)}
              disabledTimes={disabledForRoute(route.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button
            onClick={onCancel}
            style={{ height: 36, padding: "0 16px", backgroundColor: "transparent", border: "1px solid #333", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#FAFAFA", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Cancel
          </button>
          <button
            onClick={allTimesSet ? onConfirm : undefined}
            disabled={!allTimesSet}
            style={{
              height: 36, padding: "0 16px", backgroundColor: "#E5E5E5", border: "none", borderRadius: 4,
              fontSize: 14, fontWeight: 500, color: "#171717", fontFamily: "inherit",
              display: "flex", alignItems: "center",
              cursor: allTimesSet ? "pointer" : "default", opacity: allTimesSet ? 1 : 0.5,
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => { if (allTimesSet) e.currentTarget.style.backgroundColor = "#D4D4D4" }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E5E5E5")}
          >
            Confirm &amp; Proceed
          </button>
        </div>
      </div>
    </div>
  )
}
