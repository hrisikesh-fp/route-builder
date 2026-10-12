"use client"

import { useState } from "react"
import type { ReasonGroup } from "@/lib/run-types"
import { formatGallons } from "@/lib/run-history-data"
import { Chevron, RUN } from "@/components/run/run-ui"

// Unplanned orders grouped by their one blocking reason (closest-truck copy, mxq).
// Same component behind the "N unassigned" chip in the Planning workspace and in Run history.
// Order of groups = easiest fix first: fits now, then compartments, then a stop rule, then never.

const TIER_ORDER = { fits_now: 0, compartments: 1, stop_rule: 2, never: 3 } as const

export function RunReasonGroups({ groups, onHoverOrder, runNumber }: { groups: ReasonGroup[]; onHoverOrder?: (id: string | null) => void; runNumber?: number }) {
  const sorted = [...groups].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
  if (sorted.length === 0) {
    return <div style={{ fontSize: 13, color: RUN.t3, padding: "4px 2px" }}>Every order in this run was placed.</div>
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {sorted.map((g) => (
        <Group key={g.id} group={g} onHoverOrder={onHoverOrder} runNumber={runNumber} />
      ))}
    </div>
  )
}

function Group({ group, onHoverOrder, runNumber }: { group: ReasonGroup; onHoverOrder?: (id: string | null) => void; runNumber?: number }) {
  const [open, setOpen] = useState(group.tier === "fits_now")
  const fitsNow = group.tier === "fits_now"
  return (
    <div style={{ borderRadius: 4, backgroundColor: fitsNow ? "rgba(99,102,241,0.10)" : RUN.warnBg }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "none", border: "none", textAlign: "left", fontFamily: "inherit", cursor: "pointer" }}
      >
        <span style={{ marginTop: 4 }}><Chevron open={open} /></span>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, color: RUN.t2, lineHeight: "18px" }}>{group.message}</span>
          <span style={{ fontSize: 12, color: RUN.t4 }}>
            {group.hint}
            {group.coverage && <> · Applies to {group.coverage.trucks} of {group.coverage.of} trucks</>}
          </span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: fitsNow ? RUN.info : RUN.warn, fontVariantNumeric: "tabular-nums" }}>{group.orders.length}</span>
      </button>
      {open && (
        <div style={{ padding: "0 10px 8px 30px" }}>
          {group.orders.map((o) => (
            <div
              key={o.id}
              onMouseEnter={() => onHoverOrder?.(o.id)}
              onMouseLeave={() => onHoverOrder?.(null)}
              style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 6px", borderRadius: 3, fontSize: 13, color: RUN.t3, cursor: onHoverOrder ? "default" : undefined }}
            >
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
              <span style={{ color: RUN.t4, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {formatGallons(o.gallons)} gal{runNumber != null && <span style={{ marginLeft: 8, fontFamily: RUN.mono, fontSize: 11 }}>Run #{runNumber}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
