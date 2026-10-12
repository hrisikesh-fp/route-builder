"use client"

import { useState } from "react"
import { Truck, User } from "lucide-react"
import type { RunRoute } from "@/lib/run-types"
import { formatGallons, formatMinutes } from "@/lib/run-history-data"
import { Chevron, RUN } from "@/components/run/run-ui"

// Read-only route rows for a run snapshot. Mirrors the workspace route card's anatomy
// (colour bar, truck, driver, orders · gal · mi · time) without any editing controls.
// Hovering a row highlights its line on the snapshot map.

export function RunRouteList({ routes, onHoverRoute, hoveredRouteId }: { routes: RunRoute[]; onHoverRoute?: (id: string | null) => void; hoveredRouteId?: string | null }) {
  if (routes.length === 0) return <div style={{ fontSize: 13, color: RUN.t3 }}>No routes in this run.</div>
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {routes.map((r) => (
        <RouteRow key={r.id} route={r} hovered={hoveredRouteId === r.id} onHover={onHoverRoute} />
      ))}
    </div>
  )
}

function RouteRow({ route, hovered, onHover }: { route: RunRoute; hovered: boolean; onHover?: (id: string | null) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onMouseEnter={() => onHover?.(route.id)}
      onMouseLeave={() => onHover?.(null)}
      style={{ backgroundColor: hovered ? RUN.hover : RUN.card, borderRadius: 4, borderLeft: `3px solid ${route.color}`, transition: "background-color 120ms" }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", textAlign: "left", fontFamily: "inherit", cursor: "pointer" }}
      >
        <Chevron open={open} />
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, color: RUN.t2 }}>
            <Truck size={14} color={RUN.t3} /> {route.truck}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: RUN.t4 }}>
            <User size={12} /> {route.driver ?? "No driver"}
          </span>
        </span>
        <span style={{ display: "flex", gap: 12, fontSize: 12, color: RUN.t3, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          <span><b style={{ color: RUN.t2, fontWeight: 500 }}>{route.orderCount}</b> orders</span>
          <span>{formatGallons(route.gallons)} gal</span>
          <span>{route.miles} mi</span>
          <span>{formatMinutes(route.minutes)}</span>
        </span>
      </button>
      {open && (
        <ol style={{ listStyle: "none", margin: 0, padding: "0 12px 10px 34px", display: "flex", flexDirection: "column", gap: 2 }}>
          {route.stops.map((s, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: RUN.t3, alignItems: "baseline" }}>
              <span style={{ width: 18, textAlign: "right", color: RUN.t4, fontVariantNumeric: "tabular-nums" }}>{s.sequence}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: typeof s.sequence === "number" ? RUN.t2 : RUN.t3 }}>{s.name}</span>
              <span style={{ color: RUN.t4, whiteSpace: "nowrap" }}>{s.type}{s.volume ? ` · ${formatGallons(s.volume)} gal` : ""}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
