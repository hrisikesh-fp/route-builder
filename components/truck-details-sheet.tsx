"use client"

import { X } from "lucide-react"
import type { TruckCapacityProfile } from "@/lib/truck-data"
import { TruckSummaryContent } from "@/components/route-summary-sheet"

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

  // Dropdown-style anchoring (mirrors route-summary-sheet and breakdown-sheet)
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

      {/* Body — same content as route summary's Truck tab */}
      <TruckSummaryContent truckName={truckName} truckProfile={truckProfile} />
    </div>
  )
}
