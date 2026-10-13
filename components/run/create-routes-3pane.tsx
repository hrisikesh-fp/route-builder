"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { UnassignedOrderRef } from "@/lib/run-types"
import { formatGallons } from "@/lib/run-history-data"
import { KINDS } from "@/components/run/issue-kinds"
import { RUN } from "@/components/run/run-ui"
import type { TruckRow } from "@/components/run/trucks-panel"

// Create Routes, three panes (decided 13 Oct): Orders · Trucks and drivers · Goal and per-run
// overrides. Truck and driver pickers live here for now. The goal picker sits right of the trucks.
// A rough frame for estimation: the real dialog keeps today's modal rules (max-height etc.).

const GOALS = [
  { id: "current_default", label: "Current default", d: "What Route Builder does today" },
  { id: "least_driving_time", label: "Least driving time", d: "Less time driving, may cover more miles" },
  { id: "earliest_finish", label: "Earliest finish", d: "Last truck back soonest" },
  { id: "fewest_trucks", label: "Fewest trucks", d: "Serve the day on fewer trucks" },
  { id: "balanced_day", label: "Balanced day", d: "Even workload across drivers" },
]

export function CreateRoutes3Pane({ orders, excludedIds, trucks, onClose, onOptimize }: { orders: UnassignedOrderRef[]; excludedIds: string[]; trucks: (TruckRow & { blocked?: string })[]; onClose: () => void; onOptimize: () => void }) {
  const [picked, setPicked] = useState<string[]>(trucks.filter((t) => !t.blocked).map((t) => t.name))
  const [goals, setGoals] = useState<string[]>(["least_driving_time"])
  const [startTime, setStartTime] = useState("07:00")
  const [topOff, setTopOff] = useState(false)
  const inRun = orders.filter((o) => !excludedIds.includes(o.id))
  const capacity = trucks.filter((t) => picked.includes(t.name)).reduce((s, t) => s + t.capacity, 0)
  const gallons = inRun.reduce((s, o) => s + o.gallons, 0)
  const pane = { display: "flex", flexDirection: "column" as const, minHeight: 0, borderRight: `1px solid ${RUN.border}`, padding: "12px 16px" }
  const head = { fontSize: 12, color: RUN.t4, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }
  const cb = (on: boolean, disabled?: boolean) => ({ width: 16, height: 16, borderRadius: 3, border: `1px solid ${on ? RUN.t2 : RUN.border2}`, backgroundColor: on ? RUN.t2 : "transparent", color: "#111", fontSize: 11, display: "grid", placeItems: "center", flexShrink: 0, opacity: disabled ? 0.4 : 1 })

  return (
    <div role="dialog" aria-label="Create Routes" style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "min(1200px, 100%)", maxHeight: "min(720px, calc(100vh - 80px))", display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: RUN.panel, border: `1px solid ${RUN.border2}`, borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${RUN.border}`, flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: RUN.t1 }}>Create Routes</span>
          <span style={{ fontSize: 12, color: RUN.t4 }}>Auto</span>
          <button type="button" aria-label="Close" onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: RUN.t3, cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr" }}>
          {/* Pane 1: orders */}
          <div style={pane}>
            <div style={head}>Orders · {inRun.length} in this run</div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {orders.map((o) => {
                const excluded = excludedIds.includes(o.id)
                return (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 4px", borderBottom: `1px solid ${RUN.border}`, fontSize: 13, color: excluded ? RUN.t4 : RUN.t2 }}>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: excluded ? "line-through" : "none" }}>{o.name}</span>
                    <span style={{ color: RUN.t4, whiteSpace: "nowrap" }}>{excluded ? "Excluded" : `${formatGallons(o.gallons)} gal`}</span>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Pane 2: trucks and drivers */}
          <div style={pane}>
            <div style={head}>Trucks and drivers</div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {trucks.map((t) => {
                const on = picked.includes(t.name)
                return (
                  <button key={t.name} type="button" disabled={!!t.blocked} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== t.name) : [...p, t.name]))} style={{ width: "100%", display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 4px", background: "none", border: "none", borderBottom: `1px solid ${RUN.border}`, textAlign: "left", fontFamily: "inherit", cursor: t.blocked ? "not-allowed" : "pointer" }}>
                    <span style={cb(on, !!t.blocked)}>{on ? "✓" : ""}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13, color: t.blocked ? RUN.t4 : RUN.t2 }}>{t.name}</span>
                      <span style={{ display: "block", fontSize: 12, color: RUN.t4 }}>{formatGallons(t.capacity)} gal · {t.driver ?? "Pick a driver"}</span>
                      {t.blocked && (
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: KINDS.action.fg, marginTop: 2 }}>
                          {(() => { const I = KINDS.action.icon; return <I size={12} /> })()} {t.blocked}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 12, color: gallons > capacity ? RUN.warn : RUN.t4, paddingTop: 8 }}>
              {formatGallons(gallons)} gal across {picked.length} trucks, {formatGallons(capacity)} gal in one load each
            </div>
          </div>
          {/* Pane 3: goal and overrides */}
          <div style={{ ...pane, borderRight: "none", overflowY: "auto" }}>
            <div style={head}>Goal</div>
            {GOALS.map((g) => {
              const on = goals.includes(g.id)
              return (
                <button key={g.id} type="button" onClick={() => setGoals((p) => (on ? p.filter((x) => x !== g.id) : p.length >= 4 ? p : [...p, g.id]))} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 4px", background: "none", border: "none", textAlign: "left", fontFamily: "inherit", cursor: "pointer" }}>
                  <span style={cb(on)}>{on ? "✓" : ""}</span>
                  <span><span style={{ display: "block", fontSize: 13, color: RUN.t2 }}>{g.label}</span><span style={{ display: "block", fontSize: 12, color: RUN.t4 }}>{g.d}</span></span>
                </button>
              )
            })}
            <div style={{ fontSize: 12, color: RUN.t3, backgroundColor: RUN.card, borderRadius: 4, padding: "6px 8px", margin: "6px 0 14px" }}>
              {goals.length === 0 ? "Runs once with this tenant's configured goals." : goals.length === 1 ? `Runs once, optimizing for ${GOALS.find((g) => g.id === goals[0])?.label}.` : `Runs the day ${goals.length} times, one per goal, then shows a comparison.`}
            </div>
            <div style={head}>For this run only</div>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: RUN.t2, padding: "6px 0" }}>
              Start time
              <input value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: 70, background: "transparent", border: `1px solid ${RUN.border2}`, borderRadius: 4, color: RUN.t2, padding: "4px 6px", fontFamily: "inherit" }} />
            </label>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: RUN.t2, padding: "6px 0" }}>Start point <span style={{ color: RUN.t3 }}>Austin Hub ▾</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: RUN.t2, padding: "6px 0" }}>Loading facility <span style={{ color: RUN.t3 }}>Any allowed ▾</span></div>
            <button type="button" onClick={() => setTopOff((v) => !v)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", background: "none", border: "none", fontSize: 13, color: RUN.t2, fontFamily: "inherit", cursor: "pointer" }}>
              <span style={cb(topOff)}>{topOff ? "✓" : ""}</span> Top off at the end of the day
            </button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 18px", borderTop: `1px solid ${RUN.border}`, flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ height: 34, padding: "0 14px", borderRadius: 4, border: `1px solid ${RUN.border2}`, background: "transparent", color: RUN.t2, fontFamily: "inherit", cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={onOptimize} style={{ height: 34, padding: "0 16px", borderRadius: 4, border: "none", background: RUN.t1, color: "#111", fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>Optimize and Create Routes</button>
        </div>
      </div>
    </div>
  )
}
