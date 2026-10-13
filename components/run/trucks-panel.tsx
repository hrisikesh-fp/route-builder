"use client"

import { Truck, X } from "lucide-react"
import { formatGallons } from "@/lib/run-history-data"
import { RUN } from "@/components/run/run-ui"

// E. Trucks panel, below the map: planned vs available. Unused trucks say why, in the same
// closest-truck style as unplanned orders (C1, Jyotirmay's "every truck accounted for").

export type TruckRow = { name: string; capacity: number; driver?: string; routeColor?: string; orders?: number; miles?: number; unusedReason?: string }

export function TrucksPanel({ trucks, highlight, onClose }: { trucks: TruckRow[]; highlight?: boolean; onClose?: () => void }) {
  const used = trucks.filter((t) => t.routeColor)
  const unused = trucks.filter((t) => !t.routeColor)
  const cell = { padding: "7px 10px", borderBottom: `1px solid ${RUN.border}`, fontSize: 13, textAlign: "left" as const }
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: RUN.panel, borderTop: `1px solid ${highlight ? RUN.t3 : RUN.border2}`, transition: "border-color 300ms" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: RUN.t1 }}>Trucks</span>
        <span style={{ fontSize: 12, color: RUN.t4 }}>{used.length} planned · {unused.length} available, not used</span>
        <button type="button" aria-label="Close trucks panel" onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: RUN.t3, cursor: "pointer" }}><X size={15} /></button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["Truck", "Capacity", "Driver", "Plan"].map((h) => <th key={h} style={{ ...cell, fontSize: 11, color: RUN.t4, fontWeight: 500 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[...used, ...unused].map((t) => (
              <tr key={t.name} style={{ opacity: t.routeColor ? 1 : 0.9 }}>
                <td style={{ ...cell, color: RUN.t2 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span aria-hidden style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: t.routeColor ?? RUN.border2 }} />
                    <Truck size={13} color={RUN.t3} /> {t.name}
                  </span>
                </td>
                <td style={{ ...cell, color: RUN.t3 }}>{formatGallons(t.capacity)} gal</td>
                <td style={{ ...cell, color: RUN.t3 }}>{t.driver ?? "No driver"}</td>
                <td style={{ ...cell, color: t.routeColor ? RUN.t2 : RUN.warn }}>
                  {t.routeColor ? `${t.orders} orders · ${t.miles} mi` : `Not used: ${t.unusedReason}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
