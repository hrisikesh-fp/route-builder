"use client"

import { X } from "lucide-react"
import { TimePicker } from "@/components/time-picker"

interface ConflictRouteReadOnly {
  id: string
  truckName: string
  orderCount: number
  color: string
  startTime?: string
}

interface RouteStartTimeModalProps {
  isOpen: boolean
  routeId: string
  routeLabel: string
  conflictRoutes: ConflictRouteReadOnly[]
  currentTime?: string
  onTimeChange: (time: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function RouteStartTimeModal({
  isOpen,
  routeLabel,
  conflictRoutes,
  currentTime = "",
  onTimeChange,
  onConfirm,
  onCancel,
}: RouteStartTimeModalProps) {
  if (!isOpen) return null

  const disabledTimes = conflictRoutes.filter((r) => r.startTime).map((r) => r.startTime!)
  const canConfirm = !!currentTime

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
            Route Start Time
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

        {/* Route label + time input for this route */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>
            {"Set the start time for "}
            <span style={{ fontWeight: 500, color: "#E5E5E5" }}>{routeLabel}</span>
          </span>
          <TimePicker
            value={currentTime}
            onChange={onTimeChange}
            disabledTimes={disabledTimes}
          />
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "#282828" }} />

        {/* Same-driver routes section */}
        {conflictRoutes.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 400, color: "#737373", lineHeight: "20px" }}>
              Route(s) with the same driver
            </span>
            {conflictRoutes.map((route) => (
              <div
                key={route.id}
                style={{
                  position: "relative",
                  backgroundColor: "#282828",
                  borderRadius: 4,
                  paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8,
                  overflow: "hidden",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
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
            ))}
          </div>
        )}

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
            onClick={canConfirm ? onConfirm : undefined}
            style={{
              height: 36, padding: "8px 16px",
              backgroundColor: "#E5E5E5", border: "none",
              borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#171717",
              cursor: canConfirm ? "pointer" : "default", fontFamily: "inherit",
              opacity: canConfirm ? 1 : 0.5,
            }}
            onMouseEnter={(e) => { if (canConfirm) e.currentTarget.style.backgroundColor = "#D4D4D4" }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E5E5E5")}
          >
            Confirm and Proceed
          </button>
        </div>
      </div>
    </div>
  )
}
