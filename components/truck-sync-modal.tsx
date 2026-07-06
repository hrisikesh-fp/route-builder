"use client"

import { X } from "lucide-react"

interface TruckSyncModalProps {
  isOpen: boolean
  driverName: string
  pendingTruckName: string
  siblingRouteName: string
  siblingTruckName: string
  onApplyBoth: () => void
  onThisRouteOnly: () => void
  onCancel: () => void
}

export function TruckSyncModal({
  isOpen,
  driverName,
  pendingTruckName,
  siblingRouteName,
  siblingTruckName,
  onApplyBoth,
  onThisRouteOnly,
  onCancel,
}: TruckSyncModalProps) {
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
              Apply truck to both routes?
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
            {" also has "}
            <span style={{ fontWeight: 500, color: "#E5E5E5" }}>{siblingRouteName}</span>
            {" assigned to "}
            <span style={{ fontWeight: 500, color: "#E5E5E5" }}>{siblingTruckName}</span>
            {"."}
          </p>
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
            onClick={onThisRouteOnly}
            style={{
              height: 36, padding: "8px 16px",
              backgroundColor: "transparent", border: "1px solid #333",
              borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#FAFAFA",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            This route only
          </button>
          <button
            onClick={onApplyBoth}
            style={{
              height: 36, padding: "8px 16px",
              backgroundColor: "#E5E5E5", border: "none",
              borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#171717",
              cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D4D4D4")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E5E5E5")}
          >
            Apply to both routes
          </button>
        </div>
      </div>
    </div>
  )
}
