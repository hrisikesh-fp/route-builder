"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { RunRecord } from "@/lib/run-types"
import { formatGallons, formatMinutes } from "@/lib/run-history-data"
import { RunRouteList } from "@/components/run/run-route-list"
import { RunReasonGroups } from "@/components/run/run-reason-groups"
import { RunInputsCard } from "@/components/run/run-inputs-card"
import { RunGoalsTable } from "@/components/run/run-goals-table"
import { RUN, statusChip } from "@/components/run/run-ui"

// Run details: a floating sheet, the same pattern as the Route Summary sheet
// (route-summary-sheet.tsx): #1f1f1f card, 8px radius, header + badge + close, tab bar with
// the indigo underline. It floats to the left of the Workspace so you never leave it.
// Written for a dispatcher: plain sentences, goal names, no engine terms or user IDs.

const SHEET_W = 560

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{ height: 40, padding: "4px 12px", display: "flex", alignItems: "center", background: active ? "#282828" : "transparent", border: "none", borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottom: active ? "1px solid #6366f1" : "1px solid transparent", marginBottom: -1, cursor: "pointer", color: active ? "#e5e5e5" : "#a3a3a3", fontSize: 14, fontWeight: active ? 500 : 400, fontFamily: "Geist, sans-serif", whiteSpace: "nowrap" }}
    >
      {label}
    </button>
  )
}

type Tab = "summary" | "routes" | "unassigned" | "goals" | "inputs"

function Row({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: `1px solid ${RUN.border}` }}>
      <span style={{ fontSize: 14, color: RUN.t3 }}>{label}</span>
      <span style={{ textAlign: "right" }}>
        <span style={{ fontSize: 14, color: RUN.t2, fontWeight: 500 }}>{value}</span>
        {note && <span style={{ display: "block", fontSize: 12, color: RUN.t4 }}>{note}</span>}
      </span>
    </div>
  )
}

/** anchorRight: the left edge of the Workspace; the sheet sits just left of it. */
/** docked: the same content as a view at the bottom of the Workspace column (the Workspace
 *  then reads top to bottom: summary, the core lists, this run's details). */
export function RunDetailsDrawer({ run, onClose, anchorRight, top = 72, docked = false }: { run: RunRecord; onClose: () => void; anchorRight?: number; top?: number; docked?: boolean }) {
  const [tab, setTab] = useState<Tab>("summary")
  const r = run.result
  const unplanned = r?.unassigned.reduce((s, g) => s + g.orders.length, 0) ?? 0
  const tabs: [Tab, string][] = [["summary", "Summary"]]
  if (r) tabs.push(["routes", `Routes (${r.routes.length})`], ["unassigned", `Not planned (${unplanned})`])
  if (run.comparison) tabs.push(["goals", "Goals compared"])
  tabs.push(["inputs", "What went in"])

  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1440
  const left = Math.max(16, (anchorRight ?? viewportW - 560) - SHEET_W - 8)

  return (
    <div
      role={docked ? "region" : "dialog"}
      aria-label={`Run ${run.number} details`}
      style={
        docked
          ? { height: "100%", minHeight: 0, backgroundColor: "#1f1f1f", borderTop: "1px solid #333", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, fontFamily: "Geist, sans-serif" }
          : { position: "fixed", top, left, width: SHEET_W, maxHeight: `calc(100vh - ${top + 24}px)`, zIndex: 10000, backgroundColor: "#1f1f1f", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0px 8px 24px rgba(0,0,0,0.5)", fontFamily: "Geist, sans-serif" }
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: "#e5e5e5", margin: 0, lineHeight: "28px" }}>Run #{run.number}</h3>
        {statusChip(run.status)}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onClose} aria-label="Close run details" style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#a3a3a3", padding: 0 }}>
          <X size={20} />
        </button>
      </div>
      <div style={{ fontSize: 13, color: RUN.t4, marginTop: -8 }}>
        You ran this at {run.submittedAt}. It took {run.durationLabel.split(" ·")[0]}. {run.comparison ? `It compared ${run.comparison.goals.length} goals.` : `Goal: ${run.goalLabel}.`}
      </div>

      <div role="tablist" style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #333", overflowX: "auto", flexShrink: 0 }}>
        {tabs.map(([id, label]) => <TabButton key={id} label={label} active={tab === id} onClick={() => setTab(id)} />)}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {tab === "summary" &&
          (r ? (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 14, color: RUN.t2, lineHeight: "20px" }}>
                {r.placed} of {r.total} orders went on {r.routes.length} routes.
                {unplanned > 0 ? ` ${unplanned} couldn't be planned; see "Not planned" for why.` : " Every order was planned."}
              </p>
              <Row label="Orders planned" value={`${r.placed} of ${r.total}`} />
              <Row label="Routes" value={r.routes.length} />
              <Row label="Trucks used" value={r.trucksUsed} />
              <Row label="Gallons on routes" value={`${formatGallons(r.gallons)} gal`} />
              <Row label="Miles" value={r.miles} />
              <Row label="Last truck back" value={formatMinutes(r.timeToCompleteMin)} note="after the first truck leaves" />
              <Row label="Paid hours" value={formatMinutes(r.operatingMin)} note="all routes added up" />
              {r.warnings > 0 && <Row label="Route warnings" value={r.warnings} />}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: RUN.t2, lineHeight: "20px" }}>
              {run.failure?.summary}. {run.failure?.nextStep}
            </p>
          ))}
        {tab === "routes" && r && <RunRouteList routes={r.routes} />}
        {tab === "unassigned" && r && <RunReasonGroups groups={r.unassigned} />}
        {tab === "goals" && run.comparison && <RunGoalsTable goals={run.comparison.goals} />}
        {tab === "inputs" && <RunInputsCard inputs={run.inputs} requestId={run.requestId} />}
      </div>

      <div style={{ fontSize: 12, borderTop: `1px solid ${RUN.border}`, paddingTop: 10 }}>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: RUN.t3 }}>All runs ↗</a>
        <span style={{ color: RUN.t4 }}> · opens Run history in a new tab</span>
      </div>
    </div>
  )
}
