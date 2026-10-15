"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, Clock } from "lucide-react"
import type { RunRecord } from "@/lib/run-types"
import { formatGallons } from "@/lib/run-history-data"

// Run block, Figma 9312:141626 (15 Oct). Frozen on the last run.
// Four cards are the run: Planned Gallons, Miles, Driver Hours (the route times added up), GPM.
// The row under them is this run's results. Routes scrolls to the routes section.
// Unassigned Orders is only the orders this run did not place. Trucks used opens the Trucks panel.
// Product category is not in this block.

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, backgroundColor: "#282828", borderRadius: 4, padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 500, lineHeight: "16px", color: "#A3A3A3", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: "#E5E5E5", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  )
}

function Dot() {
  return <span aria-hidden style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#737373", flexShrink: 0 }} />
}

function Result({ label, value, onClick, warn }: { label: string; value: ReactNode; onClick?: () => void; warn?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        border: "none",
        borderRadius: 4,
        backgroundColor: warn ? "rgba(234,179,8,0.1)" : "transparent",
        fontFamily: "inherit",
        cursor: onClick ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#A3A3A3", textDecoration: warn ? "none" : undefined }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", color: warn ? "#EAB308" : "#E5E5E5" }}>{value}</span>
    </button>
  )
}

export function RunBanner({ run, onDetails, onRoutes, onUnassigned, onTrucks }: {
  run: RunRecord
  /** Kept so older callers still type-check. Not drawn in this pass. */
  notInRun?: { routes: number; orders: number }
  trucksAvailable?: number
  topOffOrders?: string[]
  onDetails?: () => void
  onRoutes?: () => void
  onUnassigned?: () => void
  onTrucks?: () => void
}) {
  const [open, setOpen] = useState(true)
  const r = run.result
  const duration = run.durationLabel.split(" ·")[0]
  const driverHours = r ? Math.round(r.routes.reduce((sum, route) => sum + route.minutes, 0) / 60) : 0
  const gpm = r && r.miles > 0 ? Math.round(r.gallons / r.miles) : 0
  const unassigned = r ? r.total - r.placed : 0
  return (
    <div style={{ width: "100%", borderRadius: 4, backgroundColor: "#1B1B1B", border: "1px solid #282828", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderBottom: open ? "1px solid #282828" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: "#FFFFFF", whiteSpace: "nowrap" }}>Run #{run.number}</span>
          <Dot />
          <span style={{ fontSize: 14, lineHeight: "20px", color: "#A3A3A3", whiteSpace: "nowrap" }}>{r ? "Completed" : "Didn't finish"} {run.submittedAt}</span>
          <Dot />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, lineHeight: "20px", color: "#A3A3A3", whiteSpace: "nowrap" }}>
            <Clock size={12} color="#A3A3A3" />
            {duration}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onDetails}
            style={{
              height: 28,
              padding: "0 10px 0 8px",
              borderRadius: 4,
              border: "1px solid #333",
              background: "transparent",
              color: "#FAFAFA",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: "20px",
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            Run Details
          </button>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Collapse run" : "Expand run"}
            onClick={() => setOpen((v) => !v)}
            style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: "none", background: "none", cursor: "pointer" }}
          >
            <ChevronDown size={12} color="#A3A3A3" style={{ transform: open ? "rotate(180deg)" : "none" }} />
          </button>
        </div>
      </div>
      {open && r && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Metric label="Planned Gallons" value={formatGallons(r.gallons)} />
            <Metric label="Miles" value={r.miles} />
            <Metric label="Driver Hours" value={driverHours} />
            <Metric label="GPM" value={gpm} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, borderTop: "1px dashed #282828", paddingTop: 12 }}>
            <Result label="Routes" value={r.routes.length} onClick={onRoutes} />
            <Result label="Unassigned Orders" value={unassigned} onClick={onUnassigned} warn={unassigned > 0} />
            <span aria-hidden style={{ width: 1, height: 18, backgroundColor: "#333" }} />
            <button
              type="button"
              onClick={onTrucks}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 8px", border: "none", background: "none", fontFamily: "inherit", cursor: "pointer" }}
            >
              <span style={{ fontSize: 14, lineHeight: "20px", color: "#A3A3A3", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>Trucks used</span>
              <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#E5E5E5" }}>{r.trucksUsed}</span>
            </button>
          </div>
        </div>
      )}
      {open && !r && (
        <div style={{ padding: "12px 16px", fontSize: 14, color: "#A3A3A3" }}>{run.failure?.summary}. Nothing changed in your Workspace.</div>
      )}
    </div>
  )
}
