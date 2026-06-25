"use client"

import { ArrowDown, TriangleAlert, Truck } from "lucide-react"
import type { OptimizedRoute } from "@/lib/optimization-types"
import { formatEstTime } from "@/lib/mock-optimization-result"

/** Figma: text/highlight/warning-2 — capacity delta */
const WARNING_ORANGE = "#fb923c"
/** Figma: text/highlight/warning-1 — over-shift estimated time */
const WARNING_AMBER = "#eab308"

/** Figma node 6052:8198 — exact tokens from get_design_context */
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
      {/* Rectangle 8 — absolute 6px rail */}
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

      {/* Content_upper — bg background-3 #1F1F1F + shadow/md */}
      <div
        style={{
          backgroundColor: "#1F1F1F",
          padding: "16px 16px 12px 20px",
          boxShadow:
            "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Row 1 — truck icon + name, gap 8, items-center */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Truck size={16} color="#E5E5E5" strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#E5E5E5",
                lineHeight: "20px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {route.truckName}
            </span>
          </div>

          {/* Row 2 — specs left · 300 gal right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px", flexShrink: 0 }}>
                {route.specs.capacityGal}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#737373", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px", flexShrink: 0 }}>
                {route.specs.compartments}
              </span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#737373", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px", flexShrink: 0 }}>
                {route.specs.productCount} Products
              </span>
            </div>

            {route.capacityDeltaGal != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 12 }}>
                <ArrowDown size={16} color={WARNING_ORANGE} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: WARNING_ORANGE,
                    lineHeight: "20px",
                    whiteSpace: "nowrap",
                    textDecoration: "underline dotted",
                    textDecorationColor: WARNING_ORANGE,
                    textUnderlinePosition: "from-font",
                    textDecorationSkipInk: "none",
                  }}
                >
                  {route.capacityDeltaGal.toLocaleString()} gal
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Summary — bg background-4 #282828 (NOT border-top) */}
      <div
        style={{
          backgroundColor: "#282828",
          padding: "8px 12px 8px 20px",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          {/* Metrics — gap 32 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
            <MetricCol value={String(route.metrics.gpm)} label="GPM" />
            <MetricCol
              value={formatEstTime(route.metrics.estTimeMins)}
              label="Estimated Time"
              valueColor={overShift ? WARNING_AMBER : "#FFFFFF"}
              suffix={overShift ? <TriangleAlert size={12} color={WARNING_AMBER} strokeWidth={2} /> : undefined}
            />
            <MetricCol value={`${route.metrics.estDistanceMi} mi`} label="Estimated Distance" />
          </div>

          {/* Badge — bg #111, 14px medium */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#FAFAFA",
              backgroundColor: "#111111",
              borderRadius: 4,
              padding: "2px 8px",
              lineHeight: "20px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {route.orderCount} Orders
          </span>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 24 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: valueColor, lineHeight: "24px", whiteSpace: "nowrap" }}>
          {value}
        </span>
        {suffix}
      </div>
      <span style={{ fontSize: 12, fontWeight: 400, color: "#A3A3A3", lineHeight: "16px", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  )
}
