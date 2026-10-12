"use client"

import { useMemo, useState } from "react"
import { Copy, RotateCcw } from "lucide-react"
import type { RunRecord } from "@/lib/run-types"
import { PLANNED_DATE, RUNS, formatMinutes } from "@/lib/run-history-data"
import { RunList } from "@/components/run/run-list"
import { RunMetricsStrip, type StripAction } from "@/components/run/run-metrics-strip"
import { RunReasonGroups } from "@/components/run/run-reason-groups"
import { RunRouteList } from "@/components/run/run-route-list"
import { RunInputsCard } from "@/components/run/run-inputs-card"
import { RunGoalsTable } from "@/components/run/run-goals-table"
import { RunSnapshotMap } from "@/components/run/run-snapshot-map"
import { RUN, fateChip } from "@/components/run/run-ui"

// Reconciliation > Run history. Three columns:
//   runs of the day | the selected run as a read-only workspace | a map snapshot of that run
// Every piece in the middle column is the same component the Planning workspace uses,
// in "snapshot" mode: the metrics strip, the reason groups, the route rows.

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
          <Comparison run={run} runs={runs} />
          <ScopeNote run={run} />
        </div>
        <Tabs run={run} tab={tab} onTab={setTab} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px 24px" }}>
          {tab === "routes" && run.result && <RunRouteList routes={run.result.routes} onHoverRoute={setHoverRoute} hoveredRouteId={hoverRoute} />}
          {tab === "unassigned" && run.result && <RunReasonGroups groups={run.result.unassigned} onHoverOrder={setHoverOrder} />}
          {tab === "goals" && run.comparison && <RunGoalsTable goals={run.comparison.goals} chosen={run.comparison.chosen} />}
          {tab === "inputs" && <RunInputsCard inputs={run.inputs} requestId={run.requestId} />}
        </div>
      </section>

      <div style={{ flex: 1, minWidth: 320, minHeight: 0 }}>
        <RunSnapshotMap
          routes={run.result?.routes ?? []}
          unassigned={unassignedOrders}
          highlightRouteId={hoverRoute}
          highlightOrderId={hoverOrder}
          label={run.result ? `Snapshot of Run #${run.number}, as it came back at ${run.submittedAt}` : `Run #${run.number} returned no plan`}
        />
      </div>
    </div>
  )
}

function RunHeader({ run }: { run: RunRecord }) {
  const [copied, setCopied] = useState(false)
  const iconBtn = { display: "inline-flex", alignItems: "center", gap: 6, height: 28, padding: "0 10px", borderRadius: 4, border: `1px solid ${RUN.border2}`, background: "transparent", color: RUN.t2, fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" } as const
  return (
    <header style={{ padding: "14px 16px 12px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: RUN.t1 }}>Run #{run.number}</h2>
        {fateChip(run.fate, run.status)}
        <span style={{ fontSize: 11, color: RUN.t4, border: `1px solid ${RUN.border2}`, borderRadius: 3, padding: "0 6px" }}>Read only</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            type="button"
            style={iconBtn}
            onClick={() => {
              navigator.clipboard?.writeText(run.requestId).catch(() => {})
              setCopied(true)
              setTimeout(() => setCopied(false), 1400)
            }}
            title="Copy the engine request ID for support"
          >
            <Copy size={13} /> {copied ? "Copied" : "Copy ID"}
          </button>
          <button type="button" style={iconBtn} title="Opens Create Routes in Planning with this run's orders, trucks and goal">
            <RotateCcw size={13} /> Re-run these inputs
          </button>
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: RUN.t4 }}>
        {run.submittedAt} · {run.by} · took {run.durationLabel} · {run.goalLabel}
      </div>
    </header>
  )
}

function RunStrip({ run, onOpenTab }: { run: RunRecord; onOpenTab: (t: Tab) => void }) {
  if (!run.result) {
    return <RunMetricsStrip variant="snapshot" state={{ kind: "failed", summary: run.failure?.summary ?? "No plan returned", nextStep: run.failure?.nextStep ?? "" }} />
  }
  const unplanned = run.result.unassigned.reduce((s, g) => s + g.orders.length, 0)
  const actions: StripAction[] = []
  if (unplanned > 0) actions.push({ id: "una", label: `${unplanned} unassigned`, tone: "warn", onClick: () => onOpenTab("unassigned") })
  if (run.result.warnings > 0) actions.push({ id: "warn", label: `${run.result.warnings} warnings`, tone: "neutral", onClick: () => onOpenTab("routes") })
  return (
    <RunMetricsStrip
      variant="snapshot"
      state={{ kind: "result", result: run.result, scopeLabel: run.scope.kind === "reoptimize" ? "placed, of this re-optimize" : "orders placed" }}
      actions={actions}
    />
  )
}

// "How did this run do against the one before it?" Only compares like with like (same scope).
function Comparison({ run, runs }: { run: RunRecord; runs: RunRecord[] }) {
  const idx = runs.indexOf(run)
  const prev = runs.slice(idx + 1).find((r) => r.result && r.scope.kind === run.scope.kind)
  if (!run.result || !prev?.result) return null
  const a = run.result
  const b = prev.result
  const parts: { text: string; good: boolean | null }[] = [
    { text: `${a.placed - b.placed >= 0 ? "+" : ""}${a.placed - b.placed} placed`, good: a.placed === b.placed ? null : a.placed > b.placed },
    { text: `${a.miles - b.miles >= 0 ? "+" : ""}${a.miles - b.miles} mi`, good: a.miles === b.miles ? null : a.miles < b.miles },
    { text: `${a.timeToCompleteMin - b.timeToCompleteMin >= 0 ? "+" : "-"}${formatMinutes(Math.abs(a.timeToCompleteMin - b.timeToCompleteMin))} to complete`, good: a.timeToCompleteMin === b.timeToCompleteMin ? null : a.timeToCompleteMin < b.timeToCompleteMin },
  ]
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: RUN.t4, margin: "8px 2px 0" }}>
      <span>vs Run #{prev.number}:</span>
      {parts.map((p) => (
        <span key={p.text} style={{ color: p.good == null ? RUN.t4 : p.good ? RUN.ok : RUN.warn, fontVariantNumeric: "tabular-nums" }}>{p.text}</span>
      ))}
    </div>
  )
}

function ScopeNote({ run }: { run: RunRecord }) {
  if (run.scope.kind !== "reoptimize") return null
  return (
    <div style={{ marginTop: 8, fontSize: 12, color: RUN.t3, backgroundColor: RUN.card, borderRadius: 4, padding: "8px 10px" }}>
      This run re-optimized {run.scope.routeCount} routes ({run.scope.orderCount} orders). The rest of the day wasn&apos;t part of it, so its numbers cover only those routes.
    </div>
  )
}

function Tabs({ run, tab, onTab }: { run: RunRecord; tab: Tab; onTab: (t: Tab) => void }) {
  const unplanned = run.result?.unassigned.reduce((s, g) => s + g.orders.length, 0) ?? 0
  const items: [Tab, string][] = []
  if (run.result) {
    items.push(["routes", `Routes (${run.result.routes.length})`])
    items.push(["unassigned", `Unassigned (${unplanned})`])
  }
  if (run.comparison) items.push(["goals", `Goals compared (${run.comparison.goals.length})`])
  items.push(["inputs", "Inputs"])
  return (
    <div role="tablist" style={{ display: "flex", gap: 18, padding: "0 16px", marginTop: 12, borderBottom: `1px solid ${RUN.border}`, flexShrink: 0 }}>
      {items.map(([id, label]) => (
        <button
          key={id}
          role="tab"
          aria-selected={tab === id}
          onClick={() => onTab(id)}
          style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === id ? RUN.t2 : "transparent"}`, padding: "8px 0", marginBottom: -1, fontSize: 14, fontWeight: tab === id ? 500 : 400, color: tab === id ? RUN.t1 : RUN.t3, fontFamily: "inherit", cursor: "pointer" }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
