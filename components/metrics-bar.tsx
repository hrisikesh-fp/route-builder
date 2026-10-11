"use client"

import { useState } from "react"
import { APP_HEADER_HEIGHT } from "@/components/app-header"

// Planning metrics bar — Figma RB - Routing v2, node 9175:88983.
// Left: the day's numbers. Right: Routes | Workspace, which open panels on the right edge.

export const METRICS_BAR_HEIGHT = 56
export type RightPanel = "routes" | "workspace" | null

interface MetricsBarProps {
  totalGallons: number
  routeCount: number
  unassignedCount: number
  rightPanel: RightPanel
  onRightPanelChange: (panel: RightPanel) => void
  topOffset?: number
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 16, fontWeight: 400, lineHeight: "24px", color: "#A3A3A3" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: "#FFFFFF" }}>{value}</span>
    </div>
  )
}

function BarButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 32,
        padding: "0 12px",
        border: "none",
        borderRadius: 4,
        backgroundColor: isActive ? "#282828" : hover ? "#1F1F1F" : "#111",
        color: "#FAFAFA",
        fontSize: 14,
        fontWeight: 500,
        lineHeight: "20px",
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
}

export function MetricsBar({ totalGallons, routeCount, unassignedCount, rightPanel, onRightPanelChange, topOffset = 0 }: MetricsBarProps) {
  const toggle = (panel: Exclude<RightPanel, null>) => onRightPanelChange(rightPanel === panel ? null : panel)
  return (
    <div
      style={{
        position: "absolute",
        top: APP_HEADER_HEIGHT + topOffset,
        left: 0,
        right: 0,
        height: METRICS_BAR_HEIGHT,
        zIndex: 1150,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: "#111",
        borderBottom: "1px solid #282828",
        boxSizing: "border-box",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Metric label="Total Gallons" value={totalGallons.toLocaleString()} />
        <Metric label="Routes" value={routeCount} />
        <Metric label="Unassigned Orders" value={unassignedCount} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <BarButton label="Routes" isActive={rightPanel === "routes"} onClick={() => toggle("routes")} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 1, height: 18.5, backgroundColor: "#333" }} />
          <BarButton label="Workspace" isActive={rightPanel === "workspace"} onClick={() => toggle("workspace")} />
        </div>
      </div>
    </div>
  )
}
