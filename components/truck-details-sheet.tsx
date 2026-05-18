"use client"

import { X } from "lucide-react"
import type { TruckCapacityProfile, FuelProduct } from "@/lib/truck-data"
import { TruckInfoCard } from "@/components/truck-info-card"

const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

export interface TruckDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
  truckProfile: TruckCapacityProfile | null
  truckName: string | null
  anchorLeft: number
  anchorRight: number
  anchorY: number
}

export function TruckDetailsSheet({
  isOpen,
  onClose,
  truckProfile,
  truckName,
  anchorLeft,
  anchorRight,
  anchorY,
}: TruckDetailsSheetProps) {
  if (!isOpen) return null

  const SHEET_W = 640
  const SHEET_H_ESTIMATE = 280
  const VIEWPORT_GUTTER = 16
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1440
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800

  const wantLeft = anchorLeft - SHEET_W - 4
  const fitsLeft = wantLeft >= VIEWPORT_GUTTER
  const left = fitsLeft
    ? wantLeft
    : Math.min(anchorRight + 4, viewportW - SHEET_W - VIEWPORT_GUTTER)

  const maxTop = viewportH - SHEET_H_ESTIMATE - VIEWPORT_GUTTER
  const top = Math.max(VIEWPORT_GUTTER, Math.min(anchorY, maxTop))

  return (
    <div
      style={{
        position: "fixed",
        top,
        left,
        width: SHEET_W,
        zIndex: 10000,
        backgroundColor: "#1f1f1f",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.5)",
        fontFamily: "Geist, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: "#e5e5e5", margin: 0, lineHeight: "28px" }}>
          Truck Details
        </h3>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#a3a3a3",
            padding: 0,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {truckProfile && truckName ? (
        <>
          <TruckInfoCard truckName={truckName} truckProfile={truckProfile} />
          <CompartmentBreakdown truckProfile={truckProfile} />
        </>
      ) : (
        <div style={{ padding: "24px 0", color: "#737373", fontSize: 14 }}>
          No truck selected for this route yet.
        </div>
      )}
    </div>
  )
}

function CompartmentBreakdown({ truckProfile }: { truckProfile: TruckCapacityProfile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 14, color: "#a3a3a3", lineHeight: "20px" }}>
        Compartment breakdown
      </span>
      <div
        style={{
          border: "1px solid #282828",
          borderRadius: 4,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {truckProfile.compartments.map((c, i) => {
          const caps = Object.values(c.capacities).filter((v): v is number => typeof v === "number")
          const maxCap = caps.length > 0 ? Math.max(...caps) : 0
          const products = (Object.keys(c.capacities) as FuelProduct[])
            .filter((p) => (c.capacities[p] ?? 0) > 0)
            .map((p) => PRODUCT_LABEL[p] ?? p)
            .join(", ")
          const isLast = i === truckProfile.compartments.length - 1

          return (
            <div
              key={c.id}
              style={{
                flex: "1 1 0",
                borderRight: isLast ? "none" : "1px solid #282828",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid #282828",
                  textAlign: "center",
                  color: "#e5e5e5",
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: "20px",
                }}
              >
                {c.id}
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  textAlign: "center",
                  color: "#a3a3a3",
                  fontSize: 12,
                  lineHeight: "16px",
                }}
              >
                <span>{maxCap.toLocaleString()} gal max.</span>
                <span>{products || "—"}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
