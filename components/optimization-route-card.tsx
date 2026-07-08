"use client"

import { useState } from "react"
import { TriangleAlert, Truck } from "lucide-react"
import type { OptimizedRoute } from "@/lib/optimization-types"
import { formatEstTime } from "@/lib/mock-optimization-result"

const WARNING_AMBER = "#eab308"

function Pill({
  label,
  bg,
  color,
  border,
  px = 8,
}: {
  label: string
  bg: string
  color: string
  border?: string
  px?: number
}) {
  return (
    <span
      style={{
        fontSize: 14,
        fontWeight: 500,
        color,
        backgroundColor: bg,
        borderRadius: 4,
        padding: `2px ${px}px`,
        lineHeight: "20px",
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: border ?? "none",
        boxSizing: "border-box",
      }}
    >
      {label}
    </span>
  )
}

export function OptimizationRouteCard({ route, onClick }: { route: OptimizedRoute; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const overShift = route.flags.overShift
  const hosConflict = route.flags.hosConflict
  const showHos = overShift || hosConflict

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
      {/* 6px color rail */}
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

      {/* Upper — default #1F1F1F, hover #282828: truck icon + name on left, badge pills on right */}
      <div
        style={{
          backgroundColor: hovered ? "#282828" : "#1F1F1F",
          padding: "12px 12px 12px 20px",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)",
          transition: "background-color 0.15s ease",
        }}
      >
        {/* Left: truck icon + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <Truck size={16} color="#E5E5E5" strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#E5E5E5",
              lineHeight: "24px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {route.truckName}
          </span>
        </div>

        {/* Right: badge pills — order: Manual Load, Must-go, HOS conflict, Loads, Efficiency % */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {route.flags.hasManualLoad && (
            <Pill label="Manual Load" bg="rgba(234,179,8,0.1)" color="#eab308" />
          )}
          {!!route.flags.mustGoCount && (
            <Pill label={`${route.flags.mustGoCount} Must-go`} bg="rgba(248,113,113,0.1)" color="#f87171" />
          )}
          {showHos && (
            <Pill label="1 HOS conflict" bg="rgba(248,113,113,0.1)" color="#f87171" />
          )}
          {(route.loadCount ?? 0) > 1 && (
            <Pill
              label={`${route.loadCount} Loads`}
              bg="#111"
              color="#fafafa"
              border="1px solid transparent"
            />
          )}
          {route.efficiencyPct != null && (
            <Pill label={`${route.efficiencyPct}%`} bg="rgba(16,185,129,0.1)" color="#10b981" px={6} />
          )}
        </div>
      </div>

      {/* Lower — default #282828, hover #333: 4-column metrics only */}
      <div
        style={{
          backgroundColor: hovered ? "#333" : "#282828",
          padding: "8px 12px 8px 20px",
          transition: "background-color 0.15s ease",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          {route.stopCount != null && (
            <MetricCol value={String(route.stopCount)} label="Stops" />
          )}
          <MetricCol value={String(route.metrics.gpm)} label="GPM" />
          <MetricCol
            value={formatEstTime(route.metrics.estTimeMins)}
            label="Estimated Time"
            valueColor={overShift ? WARNING_AMBER : "#FFFFFF"}
            suffix={overShift ? <TriangleAlert size={12} color={WARNING_AMBER} strokeWidth={2} /> : undefined}
          />
          <MetricCol value={`${route.metrics.estDistanceMi} mi`} label="Estimated Distance" />
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
    <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: valueColor, lineHeight: "20px", whiteSpace: "nowrap" }}>
          {value}
        </span>
        {suffix}
      </div>
      <span style={{ fontSize: 12, fontWeight: 400, color: "#a3a3a3", lineHeight: "16px", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  )
}
