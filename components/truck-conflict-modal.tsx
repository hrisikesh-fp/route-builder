"use client"

import { X } from "lucide-react"

interface ConflictRoute {
  id: string
  truckName: string
  specs: string
  driverName: string
  orderCount: number
  color: string
}

interface TruckConflictModalProps {
  isOpen: boolean
  truckName: string
  conflictRoutes: ConflictRoute[]
  onConfirm: () => void
  onCancel: () => void
}

export function TruckConflictModal({ isOpen, truckName, conflictRoutes, onConfirm, onCancel }: TruckConflictModalProps) {
  if (!isOpen) return null

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
              Confirm Truck Selection
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
            {"Truck: "}
            <span style={{ fontWeight: 500, color: "#E5E5E5" }}>{truckName}</span>
            {" is already planned for below route. Are you sure you want to proceed anyway?"}
          </p>
        </div>

        {/* Conflict route cards */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {conflictRoutes.map((route) => (
            <div
              key={route.id}
              style={{
                position: "relative",
                backgroundColor: "#282828",
                borderRadius: 4,
                paddingTop: 16, paddingBottom: 12, paddingLeft: 20, paddingRight: 16,
                overflow: "hidden",
                marginBottom: conflictRoutes.length > 1 ? 8 : 0,
              }}
            >
              {/* Left rail */}
              <div style={{
                position: "absolute", top: 0, left: 0, bottom: 0, width: 6,
                backgroundColor: route.color,
              }} />

              {/* Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Truck info */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{
                    fontSize: 14, fontWeight: 400, color: "#FFFFFF", lineHeight: "20px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {route.truckName}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px", whiteSpace: "nowrap" }}>{route.specs}</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: "rgba(115,115,115,0.2)", width: "100%" }} />

                {/* Driver + orders badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>
                    {route.driverName || "No driver assigned"}
                  </span>
                  <div style={{
                    backgroundColor: "#111", borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px",
                    whiteSpace: "nowrap",
                  }}>
                    {route.orderCount} Orders
                  </div>
                </div>
              </div>
            </div>
          ))}
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
            onClick={onConfirm}
            style={{
              height: 36, padding: "8px 16px",
              backgroundColor: "#E5E5E5", border: "none",
              borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#171717",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D4D4D4")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E5E5E5")}
          >
            Yes, Confirm and Proceed
          </button>
        </div>
      </div>
    </div>
  )
}
