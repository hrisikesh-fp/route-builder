"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { RunRecord } from "@/lib/run-types"
import { formatGallons, formatMinutes } from "@/lib/run-history-data"
import { RunRouteList } from "@/components/run/run-route-list"
import { RunReasonGroups } from "@/components/run/run-reason-groups"
import { RunInputsCard } from "@/components/run/run-inputs-card"
import { RunGoalsTable } from "@/components/run/run-goals-table"
import { Kv, RUN, fateChip } from "@/components/run/run-ui"

// Run details as a floating drawer over the Workspace (decided 13 Oct, for now), like the
// order summary drawer on order cards. Metrics on top, then tabs. The same pieces are a
// run's tabs in Reconciliation > Run history. Engine request/response is admin only (not here).

type Tab = "summary" | "routes" | "unassigned" | "goals" | "inputs"

export function RunDetailsDrawer({ run, onClose, style }: { run: RunRecord; onClose: () => void; style?: React.CSSProperties }) {
  const [tab, setTab] = useState<Tab>("summary")
  const r = run.result
  const unplanned = r?.unassigned.reduce((s, g) => s + g.orders.length, 0) ?? 0
  const tabs: [Tab, string][] = [["summary", "Summary"]]
  if (r) tabs.push(["routes", `Routes (${r.routes.length})`], ["unassigned", `Unassigned (${unplanned})`])
  if (run.comparison) tabs.push(["goals", "Goals compared"])
  tabs.push(["inputs", "Inputs"])

  return (
    <aside role="dialog" aria-label={`Run ${run.number} details`} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 440, backgroundColor: RUN.panel, borderLeft: `1px solid ${RUN.border2}`, boxShadow: "-12px 0 32px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", zIndex: 30, ...style }}>
      <div style={{ padding: "14px 16px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: RUN.t1 }}>Run #{run.number}</span>
          {fateChip(run.fate, run.status)}
          <button type="button" aria-label="Close run details" onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: RUN.t3, cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12, color: RUN.t4, marginTop: 2 }}>{run.submittedAt} · {run.by} · took {run.durationLabel} · {run.goalLabel}</div>
        {r && (
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12 }}>
            <Kv value={`${r.placed}/${r.total}`} label="placed" />
            <Kv value={r.routes.length} label="routes" />
            <Kv value={formatGallons(r.gallons)} label="gal" />
            <Kv value={r.miles} label="mi" />
            <Kv value={formatMinutes(r.timeToCompleteMin)} label="to complete" />
          </div>
        )}
      </div>
      <div role="tablist" style={{ display: "flex", gap: 14, padding: "0 16px", borderBottom: `1px solid ${RUN.border}`, flexShrink: 0, overflowX: "auto" }}>
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === id ? RUN.t2 : "transparent"}`, padding: "8px 0", marginBottom: -1, fontSize: 13, color: tab === id ? RUN.t1 : RUN.t3, fontWeight: tab === id ? 500 : 400, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px 20px" }}>
        {tab === "summary" && (
          <div style={{ fontSize: 13, color: RUN.t3, lineHeight: "20px" }}>
            {r ? (
              <>
                <p style={{ margin: "0 0 8px" }}>This run planned <b style={{ color: RUN.t1, fontWeight: 500 }}>{r.placed} of {r.total} orders</b> on {r.routes.length} routes, using {r.trucksUsed} trucks. The last truck is back {formatMinutes(r.timeToCompleteMin)} after the first one leaves.</p>
                <p style={{ margin: 0 }}>These are the run&apos;s numbers as it came back. Your Workspace may have changed since; the summary at the top of the Workspace is the live one.</p>
              </>
            ) : (
              <p style={{ margin: 0 }}>{run.failure?.summary}. {run.failure?.nextStep}</p>
            )}
          </div>
        )}
        {tab === "routes" && r && <RunRouteList routes={r.routes} />}
        {tab === "unassigned" && r && <RunReasonGroups groups={r.unassigned} runNumber={run.number} />}
        {tab === "goals" && run.comparison && <RunGoalsTable goals={run.comparison.goals} chosen={run.comparison.chosen} />}
        {tab === "inputs" && <RunInputsCard inputs={run.inputs} requestId={run.requestId} />}
      </div>
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${RUN.border}`, fontSize: 12, flexShrink: 0 }}>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ color: RUN.t3 }}>All runs ↗</a>
        <span style={{ color: RUN.t4 }}> · opens Reconciliation → Run history in a new tab</span>
      </div>
    </aside>
  )
}
