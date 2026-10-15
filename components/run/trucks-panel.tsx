"use client"

import { Truck, User, X } from "lucide-react"
import { formatGallons } from "@/lib/run-history-data"
import { RUN } from "@/components/run/run-ui"

// E. Trucks panel, below the map: planned vs available. The candidate list is the trucks with
// "Use in delivery" on (to confirm the RB API respects it). Unused trucks say why (C1).
// Clicking a mapped driver opens the Drivers panel with that driver highlighted.

export type TruckRow = { name: string; capacity: number; driver?: string; routeColor?: string; orders?: number; miles?: number; unusedReason?: string }

const cell = { padding: "7px 10px", borderBottom: `1px solid ${RUN.border}`, fontSize: 13, textAlign: "left" as const, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }

function PanelHead({ title, sub, onClose }: { title: string; sub: string; onClose?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", flexShrink: 0 }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: RUN.t1 }}>{title}</span>
      <span style={{ fontSize: 12, color: RUN.t4 }}>{sub}</span>
      <button type="button" aria-label={`Close ${title}`} onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: RUN.t3, cursor: "pointer" }}><X size={15} /></button>
    </div>
  )
}

export function TrucksPanel({ trucks, highlight, onClose, onDriver }: { trucks: TruckRow[]; highlight?: boolean; onClose?: () => void; onDriver?: (name: string) => void }) {
  const used = trucks.filter((t) => t.routeColor)
  const unused = trucks.filter((t) => !t.routeColor)
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: RUN.panel, borderTop: `1px solid ${highlight ? RUN.t3 : RUN.border2}`, transition: "border-color 300ms" }}>
      <PanelHead title="Trucks" sub={used.length > 0 ? `${used.length} planned · ${unused.length} not used` : `${trucks.length} available`} onClose={onClose} />
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>{["Truck", "Capacity", "Driver", "Plan"].map((h) => <th key={h} style={{ ...cell, fontSize: 11, color: RUN.t4, fontWeight: 500 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[...used, ...unused].map((t) => (
              <tr key={t.name}>
                <td style={{ ...cell, color: RUN.t2 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span aria-hidden style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: t.routeColor ?? RUN.border2 }} />
                    <Truck size={13} color={RUN.t3} /> {t.name}
                  </span>
                </td>
                <td style={{ ...cell, color: RUN.t3 }}>{formatGallons(t.capacity)} gal</td>
                <td style={{ ...cell }}>
                  {t.driver ? (
                    <button type="button" onClick={() => onDriver?.(t.driver!)} style={{ background: "none", border: "none", padding: 0, color: RUN.t2, textDecoration: "underline", textUnderlineOffset: 2, textDecorationColor: RUN.border2, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>{t.driver}</button>
                  ) : (
                    <span style={{ color: RUN.t4 }}>No driver</span>
                  )}
                </td>
                <td style={{ ...cell, color: t.routeColor ? RUN.t2 : t.unusedReason ? RUN.warn : RUN.t4 }}>
                  {t.routeColor ? `${t.orders} orders · ${t.miles} mi` : t.unusedReason ? `Not used: ${t.unusedReason}` : "Not planned yet"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function DriversPanel({ drivers, highlighted, onClose }: { drivers: { name: string; truck?: string; shift: string }[]; highlighted?: string | null; onClose?: () => void }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: RUN.panel, borderTop: `1px solid ${RUN.border2}` }}>
      <PanelHead title="Drivers" sub={`${drivers.length} on shift`} onClose={onClose} />
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr>{["Driver", "Truck", "Shift"].map((h) => <th key={h} style={{ ...cell, fontSize: 11, color: RUN.t4, fontWeight: 500 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const on = d.name === highlighted
              return (
                <tr key={d.name} style={{ backgroundColor: on ? "rgba(99,102,241,0.14)" : "transparent", transition: "background-color 300ms" }}>
                  <td style={{ ...cell, color: RUN.t2 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><User size={13} color={RUN.t3} /> {d.name}</span></td>
                  <td style={{ ...cell, color: RUN.t3 }}>{d.truck ?? "No truck"}</td>
                  <td style={{ ...cell, color: RUN.t3 }}>{d.shift}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
