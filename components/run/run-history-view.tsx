"use client"

import { useMemo, useState } from "react"
import { Copy } from "lucide-react"
import type { RunRecord } from "@/lib/run-types"
import { PLANNED_DATE, RUNS } from "@/lib/run-history-data"
import { RunList } from "@/components/run/run-list"
import { RunMetricsStrip, type StripAction } from "@/components/run/run-metrics-strip"
import { RunReasonGroups } from "@/components/run/run-reason-groups"
import { RunRouteList } from "@/components/run/run-route-list"
import { RunInputsCard } from "@/components/run/run-inputs-card"
import { RunGoalsTable } from "@/components/run/run-goals-table"
import { RunSnapshotMap } from "@/components/run/run-snapshot-map"
import { RUN, statusChip } from "@/components/run/run-ui"

// Reconciliation > Run history. Three columns: the day's runs | the selected run, read-only |
// a map of that run (the stored engine response carries each route's geometry).
// Only data the backend stores today (#296, #297, #298). Nothing invented: no "used / published"
// badges, no run-to-run deltas, no re-run button.

type Tab = "routes" | "unassigned" | "goals" | "inputs"

export function RunHistoryView({ runs = RUNS, initialRunId }: { runs?: RunRecord[]; initialRunId?: string }) {
  const [selectedId, setSelectedId] = useState<string>(initialRunId ?? runs[0]?.requestId)
  const run = runs.find((r) => r.requestId === selectedId) ?? runs[0]
  const [tab, setTab] = useState<Tab>("routes")
  const [hoverRoute, setHoverRoute] = useState<string | null>(null)
  const [hoverOrder, setHoverOrder] = useState<string | null>(null)

  const select = (id: string) => {
    setSelectedId(id)
    const next = runs.find((r) => r.requestId === id)
    setTab(next?.result ? "routes" : "inputs")
  }

  const unassignedOrders = useMemo(() => run?.result?.unassigned.flatMap((g) => g.orders) ?? [], [run])
  if (!run) return null

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <aside style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${RUN.border}`, backgroundColor: "#141414", minHeight: 0 }}>
        <RunList runs={runs} selectedId={run.requestId} onSelect={select} plannedDate={PLANNED_DATE} />
      </aside>

      <section aria-label={`Run ${run.number}`} style={{ width: 540, flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0, borderRight: `1px solid ${RUN.border}`, backgroundColor: RUN.panel }}>
        <RunHeader run={run} />
        <div style={{ padding: "0 16px", flexShrink: 0 }}>
          <RunStrip run={run} onOpenTab={setTab} />
        </div>
        <Tabs run={run} tab={tab} onTab={setTab} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px 24px" }}>
          {tab === "routes" && run.result && <RunRouteList routes={run.result.routes} onHoverRoute={setHoverRoute} hoveredRouteId={hoverRoute} />}
          {tab === "unassigned" && run.result && <RunReasonGroups groups={run.result.unassigned} onHoverOrder={setHoverOrder} />}
          {tab === "goals" && run.comparison && <RunGoalsTable goals={run.comparison.goals} />}
          {tab === "inputs" && <RunInputsCard inputs={run.inputs} requestId={run.requestId} />}
        </div>
      </section>

      <div style={{ flex: 1, minWidth: 320, minHeight: 0 }}>
        <RunSnapshotMap
          routes={run.result?.routes ?? []}
          unassigned={unassignedOrders}
          highlightRouteId={hoverRoute}
          highlightOrderId={hoverOrder}
          label={run.result ? `Run #${run.number} as it came back at ${run.submittedAt}` : `Run #${run.number}: no plan came back`}
        />
      </div>
    </div>
  )
}

function RunHeader({ run }: { run: RunRecord }) {
  const [copied, setCopied] = useState(false)
  return (
    <header style={{ padding: "14px 16px 12px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: RUN.t1 }}>Run #{run.number}</h2>
        {statusChip(run.status)}
        <span style={{ marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(run.requestId).catch(() => {})
              setCopied(true)
              setTimeout(() => setCopied(false), 1400)
            }}
            title="Give this reference to support if something looks wrong"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", borderRadius: 4, border: `1px solid ${RUN.border2}`, background: "transparent", color: RUN.t2, fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}
          >
            <Copy size={13} /> {copied ? "Copied" : "Copy run reference"}
          </button>
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: RUN.t4 }}>
        {run.submittedAt} · {run.by} · took {run.durationLabel} · {run.comparison ? `Compared ${run.comparison.goals.length} goals` : `Goal: ${run.goalLabel}`}
      </div>
    </header>
  )
}

function RunStrip({ run, onOpenTab }: { run: RunRecord; onOpenTab: (t: Tab) => void }) {
  if (!run.result) {
    return <RunMetricsStrip variant="snapshot" state={{ kind: "failed", summary: run.failure?.summary ?? "No plan came back", nextStep: run.failure?.nextStep ?? "" }} />
  }
  const unplanned = run.result.unassigned.reduce((s, g) => s + g.orders.length, 0)
  const actions: StripAction[] = []
  if (unplanned > 0) actions.push({ id: "una", label: `${unplanned} not planned`, tone: "warn", onClick: () => onOpenTab("unassigned") })
  if (run.result.warnings > 0) actions.push({ id: "warn", label: `${run.result.warnings} route warnings`, onClick: () => onOpenTab("routes") })
  return <RunMetricsStrip variant="snapshot" state={{ kind: "result", result: run.result, scopeLabel: "orders planned" }} actions={actions} />
}

function Tabs({ run, tab, onTab }: { run: RunRecord; tab: Tab; onTab: (t: Tab) => void }) {
  const unplanned = run.result?.unassigned.reduce((s, g) => s + g.orders.length, 0) ?? 0
  const items: [Tab, string][] = []
  if (run.result) {
    items.push(["routes", `Routes (${run.result.routes.length})`])
    items.push(["unassigned", `Not planned (${unplanned})`])
  }
  if (run.comparison) items.push(["goals", `Goals compared (${run.comparison.goals.length})`])
  items.push(["inputs", "What went in"])
  return (
    <div role="tablist" style={{ display: "flex", gap: 18, padding: "0 16px", marginTop: 12, borderBottom: `1px solid ${RUN.border}`, flexShrink: 0 }}>
      {items.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={tab === id} onClick={() => onTab(id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === id ? RUN.t2 : "transparent"}`, padding: "8px 0", marginBottom: -1, fontSize: 14, fontWeight: tab === id ? 500 : 400, color: tab === id ? RUN.t1 : RUN.t3, fontFamily: "inherit", cursor: "pointer" }}>
          {label}
        </button>
      ))}
    </div>
  )
}
