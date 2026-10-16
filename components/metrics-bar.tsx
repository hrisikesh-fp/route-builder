"use client"

import { useState } from "react"
import { ChevronDown, Plus } from "lucide-react"
import { APP_HEADER_HEIGHT } from "@/components/app-header"

// Planning metrics bar — Figma RB - Routing v2, node 9175:88983.
// Left: the day's numbers. Right: Create Order | Routes  Workspace (the last two open panels on the right edge).

export const METRICS_BAR_HEIGHT = 56
export type RightPanel = "routes" | "workspace" | null

interface MetricsBarProps {
  totalGallons: number
  routeCount: number
  unassignedCount: number
  rightPanel: RightPanel
  onRightPanelChange: (panel: RightPanel) => void
  onCreateOrder: () => void
  isCreateOrderDisabled?: boolean
  /** Orders currently in the Workspace. Same count as the Workspace header. Stays visible when the sheet is closed. */
  workspaceOrderCount: number
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

function BarButton({ label, isActive, onClick, badge }: { label: string; isActive: boolean; onClick: () => void; badge?: number }) {
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
        display: "flex",
        alignItems: "center",
        gap: 8,
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
      {badge != null && (
        <span
          style={{
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: 4,
            backgroundColor: isActive ? "#333" : "#282828",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "20px",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

function CreateOrderSplit({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const [hover, setHover] = useState<"label" | "chevron" | null>(null)
  return (
    <div style={{ display: "flex", height: 32, border: "1px solid #333", borderRadius: 4, overflow: "hidden", opacity: disabled ? 0.4 : 1 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => setHover("label")}
        onMouseLeave={() => setHover(null)}
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          border: "none",
          borderRight: "1px solid #333",
          backgroundColor: hover === "label" && !disabled ? "#1F1F1F" : "#111",
          color: "#FAFAFA",
          fontSize: 14,
          fontWeight: 500,
          lineHeight: "20px",
          fontFamily: "inherit",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Plus size={16} />
        Create Order
      </button>
      <button
        type="button"
        aria-label="More ways to create an order"
        disabled={disabled}
        onMouseEnter={() => setHover("chevron")}
        onMouseLeave={() => setHover(null)}
        style={{
          width: 36,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          backgroundColor: hover === "chevron" && !disabled ? "#1F1F1F" : "#111",
          color: "#FAFAFA",
          cursor: disabled ? "not-allowed" : "default",
        }}
      >
        <ChevronDown size={16} />
      </button>
    </div>
  )
}

export function MetricsBar({ totalGallons, routeCount, unassignedCount, rightPanel, onRightPanelChange, onCreateOrder, isCreateOrderDisabled = false, workspaceOrderCount, topOffset = 0 }: MetricsBarProps) {
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
        <CreateOrderSplit onClick={onCreateOrder} disabled={isCreateOrderDisabled} />
        <span style={{ width: 1, height: 18.5, backgroundColor: "#333" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Route list is not in this handoff. Bring the button back when that view is ready. */}
          {false && <BarButton label="Routes" isActive={rightPanel === "routes"} onClick={() => toggle("routes")} />}
          <BarButton label="Workspace" badge={workspaceOrderCount} isActive={rightPanel === "workspace"} onClick={() => toggle("workspace")} />
        </div>
      </div>
    </div>
  )
}
