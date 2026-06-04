"use client"

import { X } from "lucide-react"
import { TimePicker } from "@/components/time-picker"

interface SequenceRoute {
  id: string
  truckName: string
  orderCount: number
  color: string
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
}

function deriveOrder(routes: SequenceRoute[], startTimes: Record<string, string>): string[] {
  const withTime = routes.filter((r) => startTimes[r.id]).sort((a, b) =>
    startTimes[a.id] < startTimes[b.id] ? -1 : 1
  )
  const withoutTime = routes.filter((r) => !startTimes[r.id])
  return [...withTime, ...withoutTime].map((r) => r.id)
}

export function RouteSequenceModal({
  isOpen,
  driverName,
  date,
  routes,
  startTimes,
  onTimeChange,
  onConfirm,
  onCancel,
}: RouteSequenceModalProps) {
  if (!isOpen) return null

  const orderedIds = deriveOrder(routes, startTimes)
  const allTimesSet = routes.every((r) => !!startTimes[r.id])

  // For each route, compute which times are "taken" by the other routes (collision prevention)
  function disabledForRoute(routeId: string): string[] {
    return routes.filter((r) => r.id !== routeId && startTimes[r.id]).map((r) => startTimes[r.id])
  }

  return (
    <div
      onClick={onCancel}
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
          width: 480,
          backgroundColor: "#1B1B1B",
          border: "1px solid #333",
          borderRadius: 4,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
              Set Route Sequence
            </span>
            <button
              onClick={onCancel}
              style={{
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                background: "none", border: "none", cursor: "pointer", color: "#A3A3A3", borderRadius: 2,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px", margin: 0 }}>
            <span style={{ fontWeight: 500, color: "#E5E5E5" }}>{driverName}</span>
            {" is already planned on another route for "}
            <span style={{ fontWeight: 500, color: "#E5E5E5" }}>{date}</span>
            {". Set start times so that the routes sequence correctly."}
          </p>
        </div>

        {/* Body: sequence badges + route blocks */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Left: sequence badge column */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, paddingBottom: 8, gap: 4 }}>
            {/* 24px stub above first badge */}
            <div style={{ width: 1, height: 24, backgroundColor: "#404040" }} />

            {orderedIds.map((id, idx) => {
              const hasTime = !!startTimes[id]
              return (
                <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  {/* Badge */}
                  <div style={{
                    width: 16, height: 16,
                    borderRadius: "50%",
                    backgroundColor: hasTime ? "#A3A3A3" : "#404040",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 500, color: "#171717", lineHeight: 1 }}>
                      {idx + 1}
                    </span>
                  </div>

                  {/* Connector line between badges (not after the last one) */}
                  {idx < orderedIds.length - 1 && (
                    <div style={{ width: 1, flex: 1, minHeight: 56, backgroundColor: "#404040" }} />
                  )}
                </div>
              )
            })}

            {/* 24px stub below last badge */}
            <div style={{ width: 1, height: 24, backgroundColor: "#404040" }} />
          </div>

          {/* Right: route blocks */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            {orderedIds.map((id) => {
              const route = routes.find((r) => r.id === id)!
              return (
                <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Route row */}
                  <div style={{
                    position: "relative",
                    backgroundColor: "#282828",
                    borderRadius: 4,
                    paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8,
                    overflow: "hidden",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {/* Left rail */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, bottom: 0, width: 6,
                      backgroundColor: route.color,
                    }} />
                    {/* Truck icon + name */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                        <path d="M1.333 11.333h.667a2 2 0 004 0h4a2 2 0 004 0h.667V7.333l-2.334-3H10V3.333a.667.667 0 00-.667-.666H2A.667.667 0 001.333 3.333v8zM5.333 12a.667.667 0 110-1.334.667.667 0 010 1.334zM11.333 12a.667.667 0 110-1.334.667.667 0 010 1.334z" stroke="#A3A3A3" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{
                        fontSize: 16, fontWeight: 500, color: "#FFFFFF", lineHeight: "24px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {route.truckName}
                      </span>
                    </div>
                    {/* Orders badge */}
                    <div style={{
                      backgroundColor: "#111", borderRadius: 4,
                      padding: "2px 8px", flexShrink: 0,
                      fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap",
                    }}>
                      {route.orderCount} Orders
                    </div>
                  </div>

                  {/* Time picker */}
                  <TimePicker
                    value={startTimes[id] ?? ""}
                    onChange={(v) => onTimeChange(id, v)}
                    disabledTimes={disabledForRoute(id)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              height: 36, padding: "8px 16px",
              backgroundColor: "transparent", border: "1px solid #333",
              borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#FAFAFA",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Cancel
          </button>
          <button
            onClick={allTimesSet ? onConfirm : undefined}
            style={{
              height: 36, padding: "8px 16px",
              backgroundColor: "#E5E5E5", border: "none",
              borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#171717",
              cursor: allTimesSet ? "pointer" : "default", fontFamily: "inherit",
              opacity: allTimesSet ? 1 : 0.5,
            }}
            onMouseEnter={(e) => { if (allTimesSet) e.currentTarget.style.backgroundColor = "#D4D4D4" }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E5E5E5")}
          >
            Confirm and Proceed
          </button>
        </div>
      </div>
    </div>
  )
}
