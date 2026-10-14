"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, Truck } from "lucide-react"
import { formatGallons } from "@/lib/run-history-data"
import { RUN } from "@/components/run/run-ui"

// Line 1: the Workspace banner (decided 14 Oct). Always on top, describes whatever is in the
// Workspace (a fresh lasso, or published routes plus orders). Not tied to any run.
//   Total gallons (demand) · Routes (only when there are routes) · Orders · Available trucks (before a run)
// Below it, an accordion with gallons by PRODUCT CATEGORY (Diesel, Gasoline, DEF), not products.
// Any total-gallons figure gets an asterisk when at least one order is a top-off: approximate.

export type CategoryGallons = { name: string; gallons: number }

function Card({ label, children, onClick, title }: { label: string; children: ReactNode; onClick?: () => void; title?: string }) {
  const [hover, setHover] = useState(false)
  const inner = (
    <>
      <span style={{ fontSize: 12, color: RUN.t3 }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 500, color: RUN.t1, lineHeight: "28px", display: "flex", alignItems: "center", gap: 6 }}>{children}</span>
    </>
  )
  const style = { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, gap: 2, padding: "10px 12px", borderRadius: 6, backgroundColor: onClick && hover ? "#2A2A2A" : "#232323", border: "none", textAlign: "left" as const, fontFamily: "inherit", cursor: onClick ? "pointer" : "default" }
  return onClick ? (
    <button type="button" title={title} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={style}>{inner}</button>
  ) : (
    <div style={style} title={title}>{inner}</div>
  )
}

/** Asterisk with a hover list of the top-off orders. */
export function TopOffMark({ orders }: { orders: string[] }) {
  const [open, setOpen] = useState(false)
  if (orders.length === 0) return null
  return (
    <span style={{ position: "relative", display: "inline-flex" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span tabIndex={0} aria-label={`${orders.length} top-off orders, gallons are approximate`} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} style={{ color: RUN.warn, fontSize: 14, cursor: "help", lineHeight: 1 }}>*</span>
      {open && (
        <span role="tooltip" style={{ position: "absolute", top: 22, left: -8, zIndex: 20, width: 240, backgroundColor: "#171717", border: `1px solid ${RUN.border2}`, borderRadius: 6, padding: "8px 10px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", fontSize: 12, fontWeight: 400, color: RUN.t3, lineHeight: "18px" }}>
          <span style={{ display: "block", color: RUN.t2, marginBottom: 4 }}>Approximate: {orders.length} top-off {orders.length === 1 ? "order" : "orders"}</span>
          {orders.map((o) => <span key={o} style={{ display: "block" }}>{o}</span>)}
        </span>
      )}
    </span>
  )
}

export function WorkspaceBanner({ gallons, categories, routes, orders, topOffOrders = [], availableTrucks, onTrucks, onRoutes, onOrders, compact = true }: {
  gallons: number
  categories: CategoryGallons[]
  routes: number
  orders: number
  topOffOrders?: string[]
  /** Shown on a fresh lasso (before any run). After a run, trucks move to the run block. */
  availableTrucks?: number
  onTrucks?: () => void
  onRoutes?: () => void
  onOrders?: () => void
  /** One quiet line, before and after a run (14 Oct): the run block is what leads. */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  if (compact) {
    const link = { background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 13, color: RUN.t2, cursor: "pointer" } as const
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13, color: RUN.t3, padding: "2px 2px" }}>
          <span style={{ color: RUN.t4 }}>In this Workspace</span>
          <span style={{ display: "inline-flex", gap: 4, color: RUN.t2 }}>{formatGallons(gallons)} gal<TopOffMark orders={topOffOrders} /></span>
          {routes > 0 && (
            <>
              <span aria-hidden>·</span>
              <button type="button" onClick={onRoutes} style={link}>{routes} routes</button>
            </>
          )}
          <span aria-hidden>·</span>
          <button type="button" onClick={onOrders} style={link}>{orders} orders</button>
          {availableTrucks != null && (
            <>
              <span aria-hidden>·</span>
              <button type="button" onClick={onTrucks} title="Opens the Trucks panel below the map" style={{ ...link, display: "inline-flex", alignItems: "center", gap: 4 }}>
                {availableTrucks} available trucks <Truck size={13} color={RUN.t3} />
              </button>
            </>
          )}
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ ...link, marginLeft: "auto", color: RUN.t3, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            By product category <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none" }} />
          </button>
        </div>
        {open && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "6px 0 2px" }}>
            {categories.map((c) => (
              <span key={c.name} style={{ fontSize: 12, color: RUN.t2, backgroundColor: "#232323", borderRadius: 4, padding: "3px 8px" }}>{c.name} <b style={{ fontWeight: 500 }}>{formatGallons(c.gallons)}</b> gal</span>
            ))}
          </div>
        )}
      </div>
    )
  }
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <Card label="Total gallons">
          {formatGallons(gallons)}
          <TopOffMark orders={topOffOrders} />
        </Card>
        {routes > 0 && <Card label="Routes" onClick={onRoutes}>{routes}</Card>}
        <Card label="Orders" onClick={onOrders}>{orders}</Card>
        {availableTrucks != null && (
          <Card label="Available trucks" onClick={onTrucks} title="Opens the Trucks panel below the map">
            {availableTrucks} <Truck size={16} color={RUN.t3} />
          </Card>
        )}
      </div>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "4px 2px", background: "none", border: "none", color: RUN.t3, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
        By product category
      </button>
      {open && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "4px 0 2px" }}>
          {categories.map((c) => (
            <span key={c.name} style={{ fontSize: 13, color: RUN.t2, backgroundColor: "#232323", borderRadius: 4, padding: "4px 10px" }}>
              {c.name} <b style={{ fontWeight: 500 }}>{formatGallons(c.gallons)}</b> gal
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
