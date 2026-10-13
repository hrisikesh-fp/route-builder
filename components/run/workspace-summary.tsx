"use client"

import type { ReactNode } from "react"
import { formatGallons, formatMinutes } from "@/lib/run-history-data"
import { Kv, RUN } from "@/components/run/run-ui"

// A. Workspace summary: always on top of the Workspace, always LIVE. It describes the Workspace
// as it is now, independent of any run. Content depends on the stage.

function Divider() {
  return <span aria-hidden style={{ width: 1, alignSelf: "stretch", backgroundColor: RUN.border2 }} />
}

function Link({ children, onClick, tone }: { children: ReactNode; onClick?: () => void; tone?: "warn" }) {
  return (
    <button type="button" onClick={onClick} style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 13, color: tone === "warn" ? RUN.warn : RUN.t2, textDecoration: "underline", textUnderlineOffset: 2, textDecorationColor: RUN.border2, cursor: "pointer" }}>
      {children}
    </button>
  )
}

const box = { backgroundColor: RUN.raised, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }

/** Before a run (Dan Warren): orders, gallons by product category, trucks picked vs capacity. */
export function WorkspaceSummaryBefore({ orders, gallons, products, trucks }: { orders: number; gallons: number; products: { name: string; gallons: number }[]; trucks?: { count: number; capacity: number } }) {
  const over = trucks && gallons > trucks.capacity
  return (
    <div style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "10px 14px", minHeight: 56 }}>
        <Kv value={orders} label="orders" emphasis />
        <Divider />
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: RUN.t1 }}>{formatGallons(gallons)} gal</span>
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {products.map((p) => (
              <span key={p.name} style={{ fontSize: 11, color: RUN.t3, backgroundColor: "#2A2A2A", borderRadius: 3, padding: "0 6px" }}>{p.name} {formatGallons(p.gallons)}</span>
            ))}
          </span>
        </span>
        {trucks && (
          <>
            <Divider />
            <Kv value={`${trucks.count} trucks`} label={`${formatGallons(trucks.capacity)} gal in one load each`} />
          </>
        )}
      </div>
      {over && (
        <div style={{ borderTop: `1px solid ${RUN.border2}`, padding: "8px 14px", fontSize: 12, color: RUN.warn }}>
          {formatGallons(gallons)} gal is more than these {trucks!.count} trucks carry in one load each. Plan reloads, or add a truck.
        </div>
      )}
    </div>
  )
}

/** After a run: tier 1 is the plan's size and efficiency, tier 2 is coverage, each clickable. */
export function WorkspaceSummaryAfter({ gallons, miles, driveMin, routes, planned, unassigned, trucksUsed, trucksAvailable, onUnassigned, onRoutes, onTrucks }: {
  gallons: number
  miles: number
  driveMin: number
  routes: number
  planned: number
  unassigned: number
  trucksUsed: number
  trucksAvailable: number
  onUnassigned?: () => void
  onRoutes?: () => void
  onTrucks?: () => void
}) {
  return (
    <div style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", padding: "10px 14px", minHeight: 56 }}>
        <Kv value={formatGallons(gallons)} label="gal planned" emphasis />
        <Kv value={miles > 0 ? (gallons / miles).toFixed(1) : "-"} label="gal / mile" emphasis />
        <Kv value={miles} label="miles" emphasis />
        <Kv value={formatMinutes(driveMin)} label="drive time" emphasis />
      </div>
      <div style={{ borderTop: `1px solid ${RUN.border2}`, padding: "8px 14px", display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13, color: RUN.t3 }}>
        <span><Link onClick={onRoutes}>{routes} routes</Link></span>
        <span>
          <b style={{ color: RUN.t1, fontWeight: 500 }}>{planned}</b> planned · {unassigned > 0 ? <Link tone="warn" onClick={onUnassigned}>{unassigned} unassigned</Link> : "0 unassigned"}
        </span>
        <span><Link onClick={onTrucks}>{trucksUsed} of {trucksAvailable} trucks</Link></span>
      </div>
    </div>
  )
}
