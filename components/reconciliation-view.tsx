"use client"

import { useState } from "react"
import { RunHistoryView } from "@/components/run/run-history-view"

// 3D shell Reconciliation mode: no metrics bar. Sub nav: Run history (runs of the day, each as a
// read-only workspace with a map snapshot) and Analytics & reporting (plan vs actual).

type ReconPage = "history" | "analytics"

const FLEET = [
  ["Trucks", "3", "3", "0"],
  ["Orders", "13 of 14", "14 of 14", "+1"],
  ["Gallons", "16,639", "21,351", "+4,712"],
  ["Over 10h", "0 of 3", "3 of 3", "+3"],
  ["Loads", "5", "5", "0"],
]

const TRUCKS = [
  { id: "FF658", driver: "Troy Satterlee", orders: 8, gal: "6,979", loads: 2, miles: 161, route: "8h 02m", shift: "11h 16m", over: "Over", stops: [["Load", "Topeka Adams"], ["Delivery", "Williamstown", "364"], ["Delivery", "Oskaloosa", "406"], ["Delivery", "Valley Falls", "1,700"], ["Delivery", "Dist #4", "1,502"], ["Load", "Topeka Adams"], ["Delivery", "Oakland Waste Water", "413"], ["Delivery", "Crossgate Dr", "433"], ["Delivery", "527 N Main", "1,502"], ["Delivery", "527 Main St", "659"]] },
  { id: "FF661", driver: "Tom Cushing", orders: 2, gal: "4,105", loads: 1, miles: 100, route: "4h 14m", shift: "10h 43m", over: "Over", stops: [["Load", "Magellan"], ["Delivery", "Holmberg Oil", "2,511"], ["Delivery", "Jones Service", "1,594"]] },
  { id: "FF657", driver: "Shawn Brantingham", orders: 3, gal: "5,555", loads: 2, miles: 240, route: "7h 49m", shift: "11h 18m", over: "Over", stops: [["Load", "Topeka Adams"], ["Delivery", "Poland Rd", "3,647"], ["Load", "Manhattan Excel"], ["Delivery", "Skyway Drive", "394"], ["Delivery", "Herrington Airport", "1,513"]] },
]

const th = { textAlign: "left" as const, fontSize: 12, fontWeight: 500, color: "#A3A3A3", padding: "8px 12px", background: "#282828", whiteSpace: "nowrap" as const }
const td = { padding: "10px 12px", fontSize: 14, color: "#E5E5E5", borderTop: "1px solid #282828", whiteSpace: "nowrap" as const }

export function ReconciliationView({ top }: { top: number }) {
  const [page, setPage] = useState<ReconPage>("history")
  const [truckId, setTruckId] = useState(TRUCKS[0].id)
  const truck = TRUCKS.find((t) => t.id === truckId) ?? TRUCKS[0]
  const item = (id: ReconPage, label: string) => (
    <button
      type="button"
      onClick={() => setPage(id)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        border: "none",
        borderRadius: 4,
        backgroundColor: page === id ? "#282828" : "transparent",
        color: page === id ? "#FAFAFA" : "#A3A3A3",
        fontSize: 14,
        fontWeight: page === id ? 500 : 400,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, bottom: 0, display: "flex", backgroundColor: "#111", fontFamily: "Geist, sans-serif", zIndex: 1000 }}>
      <nav style={{ width: 220, flexShrink: 0, padding: 12, borderRight: "1px solid #282828", display: "flex", flexDirection: "column", gap: 4 }}>
        {item("history", "Run history")}
        {item("analytics", "Analytics & reporting")}
      </nav>
      {page === "history" ? (
        <main style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <RunHistoryView />
        </main>
      ) : (
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
            {FLEET.map(([label, plan, actual, delta]) => (
              <div key={label} style={{ background: "#282828", borderRadius: 4, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, color: "#A3A3A3" }}>{label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "#FAFAFA", lineHeight: "24px" }}>{plan}</div>
                    <div style={{ fontSize: 12, color: "#737373" }}>Plan</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "#FAFAFA", lineHeight: "24px" }}>{actual}</div>
                    <div style={{ fontSize: 12, color: "#737373" }}>Actual</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: delta === "0" ? "#737373" : "#FAFAFA" }}>Δ {delta}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: "#A3A3A3", margin: "28px 0 8px" }}>Trucks</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#1B1B1B" }}>
            <thead>
              <tr>
                <th style={th}>Truck</th>
                <th style={{ ...th, textAlign: "right" }}>Plan orders</th>
                <th style={{ ...th, textAlign: "right" }}>Plan gal</th>
                <th style={{ ...th, textAlign: "right" }}>Plan loads</th>
                <th style={{ ...th, textAlign: "right" }}>Plan miles</th>
                <th style={{ ...th, textAlign: "right" }}>Plan time</th>
                <th style={{ ...th, textAlign: "right" }}>Actual shift</th>
                <th style={{ ...th, textAlign: "right" }}>Actual over 10h</th>
              </tr>
            </thead>
            <tbody>
              {TRUCKS.map((t) => (
                <tr key={t.id} onClick={() => setTruckId(t.id)} style={{ cursor: "pointer", background: t.id === truck.id ? "#242424" : "transparent" }}>
                  <td style={{ ...td, fontWeight: 500 }}>{t.driver} <span style={{ color: "#737373", fontWeight: 400 }}>{t.id}</span></td>
                  <td style={{ ...td, textAlign: "right" }}>{t.orders}</td>
                  <td style={{ ...td, textAlign: "right" }}>{t.gal}</td>
                  <td style={{ ...td, textAlign: "right" }}>{t.loads}</td>
                  <td style={{ ...td, textAlign: "right" }}>{t.miles}</td>
                  <td style={{ ...td, textAlign: "right" }}>{t.route}</td>
                  <td style={{ ...td, textAlign: "right" }}>{t.shift}</td>
                  <td style={{ ...td, textAlign: "right" }}>{t.over}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ fontSize: 13, color: "#A3A3A3", margin: "28px 0 8px" }}>Stops · {truck.driver}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#1B1B1B" }}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Type</th>
                <th style={th}>Stop</th>
                <th style={{ ...th, textAlign: "right" }}>Gal</th>
              </tr>
            </thead>
            <tbody>
              {truck.stops.map((s, i) => (
                <tr key={i}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{s[0]}</td>
                  <td style={td}>{s[1]}</td>
                  <td style={{ ...td, textAlign: "right" }}>{s[2] ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      )}
    </div>
  )
}
