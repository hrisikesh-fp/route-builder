"use client"

import { useEffect, useState } from "react"
import { RUNS } from "@/lib/run-history-data"
import { RunMetricsStrip, type StripState } from "@/components/run/run-metrics-strip"
import { RunReasonGroups } from "@/components/run/run-reason-groups"
import { RUN } from "@/components/run/run-ui"

// Dev preview: the run components as the Planning workspace would use them (variant "live").
// Same components as Reconciliation > Run history, different state. Open at /dev/run-components.

const run = RUNS[1] // Run #6, the one that got used

function Picker() {
  const sel = { border: `1px solid ${RUN.border2}`, borderRadius: 4, padding: "7px 10px", fontSize: 13, color: RUN.t2, display: "flex", justifyContent: "space-between" } as const
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={sel}>5 trucks · T-104, T-112, T-120 +2 <span style={{ color: RUN.t4 }}>▾</span></div>
        <div style={sel}>3 drivers <span style={{ color: RUN.t4 }}>▾</span></div>
      </div>
      <div style={{ fontSize: 12, color: RUN.warn, marginTop: 8 }}>{run.inputs.gallons.toLocaleString("en-US")} gal is more than these 5 trucks carry in one load each. Plan reloads, or add a truck.</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <button type="button" style={{ height: 30, padding: "0 12px", borderRadius: 4, border: `1px solid ${RUN.border2}`, background: "transparent", color: RUN.t2, fontSize: 13, fontFamily: "inherit" }}>Goal: Current default ▾</button>
        <button type="button" style={{ height: 30, padding: "0 12px", borderRadius: 4, border: "none", background: "#4D55F8", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>Optimize</button>
      </div>
    </div>
  )
}

export default function RunComponentsPreview() {
  const [stage, setStage] = useState<"selection" | "optimizing" | "result">("selection")
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (stage !== "optimizing") return
    setElapsed(0)
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [stage])

  const state: StripState =
    stage === "selection"
      ? { kind: "selection", orders: run.inputs.orders, gallons: run.inputs.gallons, products: run.inputs.products, trucks: { count: 5, capacity: 22500 } }
      : stage === "optimizing"
        ? { kind: "optimizing", label: "Least driving time", elapsed: `0:${String(elapsed).padStart(2, "0")}`, onCancel: () => setStage("selection") }
        : { kind: "result", result: run.result! }

  const unplanned = run.result!.unassigned.reduce((s, g) => s + g.orders.length, 0)
  const actions =
    stage === "selection"
      ? [
          { id: "checks", label: "⚠ 2 pre-run checks", tone: "warn" as const, content: <div style={{ fontSize: 13, color: RUN.t3, display: "flex", flexDirection: "column", gap: 4 }}><span style={{ color: RUN.warn }}>1 order needs DEF, and no selected truck has a DEF compartment.</span><span>FP Test TW has 0 gal capacity and can&apos;t take orders.</span></div> },
          { id: "pick", label: "Trucks & drivers ▾", content: <Picker /> },
        ]
      : stage === "optimizing"
        ? [{ id: "cancel", label: "Cancel", onClick: () => setStage("selection") }]
        : [
            { id: "una", label: `${unplanned} unassigned ▾`, tone: "warn" as const, content: <RunReasonGroups groups={run.result!.unassigned} runNumber={run.number} /> },
            { id: "warn", label: `${run.result!.warnings} warnings`, content: <div style={{ fontSize: 13, color: RUN.t3 }}>Route warnings list here (capacity, run-out).</div> },
            { id: "run", label: `Run #${run.number}`, mono: true, content: <div style={{ fontSize: 13, color: RUN.t3 }}>Opens Run #{run.number} in Reconciliation → Run history: the same strip, frozen, with this run&apos;s map.</div> },
          ]

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#111", color: RUN.t2, fontFamily: "Geist, sans-serif", padding: 32 }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: RUN.t1, margin: "0 0 4px" }}>Run components, as the Planning workspace uses them</h1>
      <p style={{ fontSize: 13, color: RUN.t4, margin: "0 0 20px", maxWidth: 720 }}>
        One strip at the top of the workspace, the same height in every state. The chips open one panel at a time underneath. Run history uses the same components frozen ("snapshot").
      </p>
      <div role="group" aria-label="Stage" style={{ display: "inline-flex", border: `1px solid ${RUN.border2}`, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
        {(["selection", "optimizing", "result"] as const).map((s) => (
          <button key={s} type="button" aria-pressed={stage === s} onClick={() => setStage(s)} style={{ padding: "6px 14px", border: "none", background: stage === s ? "#282828" : "transparent", color: stage === s ? RUN.t1 : RUN.t3, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
            {s === "selection" ? "After lasso" : s === "optimizing" ? "Optimizing" : "After a run"}
          </button>
        ))}
      </div>
      <div style={{ width: 560, backgroundColor: RUN.panel, border: `1px solid ${RUN.border}`, borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: RUN.t1, marginBottom: 10 }}>Workspace</div>
        <RunMetricsStrip key={stage} state={state} actions={actions} defaultOpen={stage === "selection" ? "pick" : undefined} />
        <div style={{ display: "flex", gap: 20, borderBottom: `1px solid ${RUN.border}`, margin: "12px 0 10px", fontSize: 14 }}>
          <span style={{ color: RUN.t3, paddingBottom: 8 }}>Driver Routes ({stage === "result" ? run.result!.routes.length : 0})</span>
          <span style={{ color: RUN.t1, paddingBottom: 8, borderBottom: `2px solid ${RUN.t2}` }}>Unassigned Orders ({stage === "result" ? unplanned : run.inputs.orders})</span>
        </div>
        {[0, 1, 2].map((i) => <div key={i} style={{ height: 52, borderRadius: 6, backgroundColor: RUN.card, opacity: 0.6, marginTop: 8 }} />)}
      </div>
    </div>
  )
}
