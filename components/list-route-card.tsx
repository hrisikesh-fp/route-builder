"use client"

import { ArrowUpRight, ChevronDown } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { ORDER_TYPE_COLORS, getStopDisplayTime } from "@/lib/route-display"
import { CheckboxInput } from "@/components/lasso-workspace-sheet"

// Route card in the floating List panel (Routes tab, HTML spec V3). Read-only: opening a route here
// never edits it; "Edit in workspace" moves it to the workspace. No Figma node yet, built from existing
// order-card tokens + the route's map colour.

export interface ListRoute {
  id: string
  color: string
  driverName: string
  truckId?: string | null
  isPublished: boolean
}

interface ListRouteCardProps {
  route: ListRoute
  stops: ExtractionOrder[]
  checked: boolean
  onToggleCheck: () => void
  isExpanded: boolean
  onToggleExpand: () => void
  onHoverRouteChange: (routeId: string | null) => void
  onHoverStopChange: (orderId: string | null) => void
  onEditInWorkspace: () => void
  /** Briefly outlined after a route line click on the map expands this card. */
  isFocused?: boolean
}

const ghostButton: React.CSSProperties = {
  height: 32,
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 12px",
  border: "1px solid #333",
  borderRadius: 4,
  backgroundColor: "transparent",
  color: "#E5E5E5",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "20px",
  fontFamily: "inherit",
  cursor: "pointer",
}

export function ListRouteCard({
  route,
  stops,
  checked,
  onToggleCheck,
  isExpanded,
  onToggleExpand,
  onHoverRouteChange,
  onHoverStopChange,
  onEditInWorkspace,
  isFocused,
}: ListRouteCardProps) {
  // Gallons delivered (load orders pick fuel up, so they don't count toward the route's volume)
  const totalGal = stops.filter((s) => s.orderType !== "L").reduce((sum, s) => sum + (s.volume ?? 0), 0)

  return (
    <div
      data-list-route-id={route.id}
      className={isFocused ? "rb-stop-highlight" : undefined}
      role="button"
      aria-pressed={checked}
      onClick={onToggleCheck}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#282828"
        onHoverRouteChange(route.id)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#1F1F1F"
        onHoverRouteChange(null)
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "16px 16px 12px 12px",
        backgroundColor: "#1F1F1F",
        borderLeft: `4px solid ${route.color}`,
        borderRadius: 4,
        boxShadow: isFocused ? "inset 0 0 0 1px #E5E5E5" : "none",
        flexShrink: 0,
        cursor: "pointer",
        fontFamily: "Geist, sans-serif",
        transition: "background-color 120ms ease",
      }}
    >
      <div style={{ paddingTop: 4 }} onClick={(e) => e.stopPropagation()}>
        <CheckboxInput checked={checked} onChange={onToggleCheck} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Title row: truck · driver, status, expand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              minWidth: 0,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "24px",
              color: "#FFFFFF",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {route.truckId ?? "No truck"} · {route.driverName}
          </span>
          {route.isPublished && (
            <span style={{ fontSize: 12, fontWeight: 500, color: "#E5E5E5", backgroundColor: "#262626", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>
              Published
            </span>
          )}
          <button
            type="button"
            aria-label={isExpanded ? "Collapse route" : "Expand route"}
            aria-expanded={isExpanded}
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            style={{
              marginLeft: "auto",
              width: 24,
              height: 24,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: 4,
              backgroundColor: "transparent",
              cursor: "pointer",
            }}
          >
            <ChevronDown
              size={16}
              color="#A3A3A3"
              style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
            />
          </button>
        </div>

        <span style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#A3A3A3" }}>
          {stops.length} stop{stops.length === 1 ? "" : "s"} · {totalGal.toLocaleString()} gal
        </span>

        {isExpanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", marginTop: 8, paddingTop: 8, borderTop: "1px solid #333", cursor: "default" }}
          >
            {stops.map((stop) => {
              const type = stop.orderType ?? "D"
              const time = getStopDisplayTime(stop)
              return (
                <div
                  key={stop.id}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#333"
                    onHoverStopChange(stop.id)
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                    onHoverStopChange(null)
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 4px", borderRadius: 4 }}
                >
                  {type === "D" ? (
                    <span style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#262626", color: "#E5E5E5", fontSize: 12, fontWeight: 500 }}>
                      {stop.routeSequence ?? "·"}
                    </span>
                  ) : (
                    <span style={{ width: 20, height: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, backgroundColor: ORDER_TYPE_COLORS[type], color: "#171717", fontSize: 12, fontWeight: 500 }}>
                      {type}
                    </span>
                  )}
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {stop.shipToName ?? stop.customerName}
                  </span>
                  {time && <span style={{ fontSize: 14, color: "#A3A3A3", whiteSpace: "nowrap" }}>{time}</span>}
                  <span style={{ width: 72, textAlign: "right", fontSize: 14, color: "#E5E5E5", whiteSpace: "nowrap" }}>
                    {stop.volume.toLocaleString()}
                  </span>
                </div>
              )
            })}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={onEditInWorkspace}
                style={ghostButton}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                Edit in workspace
              </button>
              {/* Route page (V8) — shown, not wired yet */}
              <button type="button" title="Route page not wired in the prototype" style={{ ...ghostButton, cursor: "default", color: "#A3A3A3" }}>
                View route
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
