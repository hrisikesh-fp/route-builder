"use client"

import { TriangleAlert, Truck } from "lucide-react"
import type { OptimizedRoute } from "@/lib/optimization-types"
import { formatEstTime } from "@/lib/mock-optimization-result"

const WARNING_AMBER = "#eab308"

/** Pill badge for the right side of the route card */
function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        color,
        backgroundColor: bg,
        borderRadius: 4,
        padding: "2px 6px",
        lineHeight: "16px",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

/** Figma: route card with 6px color rail, truck row, 4-col metrics, badge row */
export function OptimizationRouteCard({ route, onClick }: { route: OptimizedRoute; onClick: () => void }) {
  const overShift = route.flags.overShift

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick() }}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        overflow: "hidden",
        flexShrink: 0,
        cursor: "pointer",
        fontFamily: "Geist, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* 6px color rail — absolute left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 6,
          backgroundColor: route.color,
          zIndex: 1,
        }}
      />

      {/* Upper — bg #1F1F1F, truck name row */}
      <div
        style={{
          backgroundColor: "#1F1F1F",
          padding: "14px 16px 12px 20px",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* Row 1: truck icon + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Truck size={15} color="#E5E5E5" strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#E5E5E5",
              lineHeight: "20px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {route.truckName}
          </span>
        </div>
      </div>

      {/* Lower — bg #282828, metrics + badges */}
      <div
        style={{
          backgroundColor: "#282828",
          padding: "8px 12px 8px 20px",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* 4-column metrics */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flex: 1, minWidth: 0 }}>
          {route.stopCount != null && (
            <MetricCol value={String(route.stopCount)} label="Stops" />
          )}
          <MetricCol value={String(route.metrics.gpm)} label="GPM" />
          <MetricCol
            value={formatEstTime(route.metrics.estTimeMins)}
            label="Estimated Time"
            valueColor={overShift ? WARNING_AMBER : "#FFFFFF"}
            suffix={overShift ? <TriangleAlert size={11} color={WARNING_AMBER} strokeWidth={2} /> : undefined}
          />
          <MetricCol value={`${route.metrics.estDistanceMi} mi`} label="Distance" />
        </div>

        {/* Right-side badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {route.efficiencyPct != null && (
            <Pill label={`${route.efficiencyPct}%`} bg="rgba(34,197,94,0.15)" color="#22c55e" />
          )}
          {route.flags.hasManualLoad && (
            <Pill label="Manual Load" bg="rgba(234,179,8,0.15)" color="#eab308" />
          )}
          {!!route.flags.mustGoCount && (
            <Pill label={`${route.flags.mustGoCount} Must-go`} bg="rgba(239,68,68,0.15)" color="#f87171" />
          )}
          {(route.flags.overShift || route.flags.hosConflict) && (
            <Pill label="HOS conflict" bg="rgba(234,179,8,0.12)" color="#eab308" />
          )}
          {(route.loadCount ?? 0) > 1 && (
            <Pill label={`${route.loadCount} Loads`} bg="#1a1a1a" color="#A3A3A3" />
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCol({
  value,
  label,
  valueColor = "#FFFFFF",
  suffix,
}: {
  value: string
  label: string
  valueColor?: string
  suffix?: React.ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: valueColor, lineHeight: "20px", whiteSpace: "nowrap" }}>
          {value}
        </span>
        {suffix}
      </div>
      <span style={{ fontSize: 11, fontWeight: 400, color: "#737373", lineHeight: "14px", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  )
}
