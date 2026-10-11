"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { ListRouteCard, type ListRoute } from "@/components/list-route-card"

// 3D shell Routes panel (right side, read only; width comes from the layout tier, see lib/layout-tiers.ts) — opened from "Routes" in the metrics bar.
// Viewing the day's routes; "Edit in workspace" moves a route into the Workspace. No Figma node yet.

export const RIGHT_PANEL_WIDTH = 560

interface RoutesPanelProps {
  routes: ListRoute[]
  orders: ExtractionOrder[]
  onClose: () => void
  onHoverRoute: (id: string | null) => void
  onHoverStop: (id: string | null) => void
  onEditInWorkspace: (routeId: string) => void
  style?: React.CSSProperties
}

export function RoutesPanel({ routes, orders, onClose, onHoverRoute, onHoverStop, onEditInWorkspace, style }: RoutesPanelProps) {
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<string[]>([])
  const stopsByRoute = useMemo(() => {
    const map = new Map<string, ExtractionOrder[]>()
    for (const o of orders) if (o.routeId) map.set(o.routeId, [...(map.get(o.routeId) ?? []), o])
    for (const stops of map.values()) stops.sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))
    return map
  }, [orders])
  const q = search.trim().toLowerCase()
  const visible = routes.filter((r) => !q || [r.driverName, r.truckId ?? ""].some((v) => v.toLowerCase().includes(q)))

  return (
    <aside
      style={{
        position: "absolute",
        width: RIGHT_PANEL_WIDTH,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#111",
        borderLeft: "1px solid #282828",
        fontFamily: "Geist, sans-serif",
        zIndex: 1100,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 24px", borderBottom: "1px solid #282828", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, lineHeight: "28px", color: "#FFFFFF" }}>Routes</h2>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", border: "1px dashed #333", borderRadius: 4, padding: "1px 6px" }}>View only</span>
        <button type="button" aria-label="Close routes" onClick={onClose} style={{ marginLeft: "auto", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 4, background: "transparent", cursor: "pointer" }}>
          <X size={16} color="#A3A3A3" />
        </button>
      </div>
      <div style={{ padding: "12px 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "6px 12px", border: "1px solid #333", borderRadius: 4, boxSizing: "border-box" }}>
          <Search size={16} color="#737373" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search routes, trucks, drivers" style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "inherit" }} />
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
        {routes.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>No routes yet</div>
            <div style={{ fontSize: 14, color: "#737373", maxWidth: 320 }}>Every order is still unassigned. Routes you create in the workspace will show here.</div>
          </div>
        )}
        {visible.map((route) => (
          <ListRouteCard
            key={route.id}
            route={route}
            stops={stopsByRoute.get(route.id) ?? []}
            checked={false}
            onToggleCheck={() => setExpanded((p) => (p.includes(route.id) ? p.filter((x) => x !== route.id) : [...p, route.id]))}
            isExpanded={expanded.includes(route.id)}
            onToggleExpand={() => setExpanded((p) => (p.includes(route.id) ? p.filter((x) => x !== route.id) : [...p, route.id]))}
            onHoverRouteChange={onHoverRoute}
            onHoverStopChange={onHoverStop}
            onEditInWorkspace={() => onEditInWorkspace(route.id)}
          />
        ))}
      </div>
    </aside>
  )
}
