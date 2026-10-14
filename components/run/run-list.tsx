"use client"

import { useState } from "react"
import type { RunRecord } from "@/lib/run-types"
import { Chip, RUN, statusChip } from "@/components/run/run-ui"

// The day's runs, newest first. Only data the backend stores today (#298, #433): when, who,
// how long, outcome, goal, and the run's own summary (#296). A 3-goal comparison is ONE entry:
// its runs share a request ID prefix (rb-…-y2ib1q--<goal>), so they group without new data.

type Filter = "all" | "finished" | "failed" | "no_answer"

export function RunList({ runs, selectedId, onSelect, plannedDate }: { runs: RunRecord[]; selectedId: string | null; onSelect: (id: string) => void; plannedDate: string }) {
  const [filter, setFilter] = useState<Filter>("all")
  const shown = runs.filter((r) => filter === "all" || r.status === filter || (filter === "failed" && r.status === "failed"))
  const filters: [Filter, string][] = [["all", "All"], ["finished", "Finished"], ["failed", "Didn't finish"], ["no_answer", "No answer"]]
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "14px 14px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: RUN.t1 }}>Runs</div>
        <div style={{ fontSize: 12, color: RUN.t4, marginTop: 2 }}>Planning day {plannedDate} · {runs.length} runs</div>
        <div role="group" aria-label="Filter runs" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {filters.map(([id, label]) => (
            <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}</Chip>
          ))}
        </div>
      </div>
      <div role="listbox" aria-label="Runs" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 8px 12px" }}>
        {shown.map((run) => (
          <RunListItem key={run.requestId} run={run} selected={run.requestId === selectedId} onSelect={() => onSelect(run.requestId)} />
        ))}
        {shown.length === 0 && <div style={{ padding: 12, fontSize: 13, color: RUN.t4 }}>No runs match this filter.</div>}
      </div>
    </div>
  )
}

function RunListItem({ run, selected, onSelect }: { run: RunRecord; selected: boolean; onSelect: () => void }) {
  const [hover, setHover] = useState(false)
  const what = run.comparison ? `Comparison · ${run.comparison.goals.length} goals` : run.goalLabel
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4, padding: 10, marginBottom: 4, borderRadius: 6, border: "none", borderLeft: `2px solid ${selected ? RUN.t2 : "transparent"}`, backgroundColor: selected ? RUN.hover : hover ? "#202020" : "transparent", textAlign: "left", fontFamily: "inherit", cursor: "pointer" }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: RUN.t1 }}>Run #{run.number}</span>
        <span style={{ fontSize: 12, color: RUN.t4 }}>{run.submittedAt} · took {run.durationLabel.split(" ·")[0]}</span>
        {run.status !== "finished" && <span style={{ marginLeft: "auto" }}>{statusChip(run.status)}</span>}
      </span>
      <span style={{ fontSize: 12, color: RUN.t3 }}>{what}</span>
      <span style={{ fontSize: 12, color: RUN.t4, display: "flex", gap: 8 }}>
        {run.result ? (
          <>
            <span><b style={{ color: run.result.placed < run.result.total ? RUN.warn : RUN.t2, fontWeight: 500 }}>{run.result.placed} of {run.result.total}</b> planned</span>
            <span>{run.result.routes.length} routes</span>
          </>
        ) : (
          <span style={{ color: RUN.bad }}>No plan came back</span>
        )}
        <span style={{ marginLeft: "auto" }}>{run.by}</span>
      </span>
    </button>
  )
}
