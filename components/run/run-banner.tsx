"use client"

import type { ReactNode } from "react"
import type { RunRecord } from "@/lib/run-types"
import { formatGallons, formatMinutes } from "@/lib/run-history-data"
import { RUN } from "@/components/run/run-ui"
import { TopOffMark } from "@/components/run/workspace-summary"

// Line 2: the run block (decided 14 Oct). The run banner and the run's metrics are ONE block:
// Prashant's run summary panel (#432, #461), restyled. It changes only when you optimize or
// re-optimize; no automatic recalculation. C1: "planned vs unplanned count at the top".
// The "Not in this run" line shows when the Workspace holds orders or routes the run didn't include.

function Link({ children, onClick, tone }: { children: ReactNode; onClick?: () => void; tone?: "warn" }) {
  return (
    <button type="button" onClick={onClick} style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "inherit", color: tone === "warn" ? RUN.warn : RUN.t2, textDecoration: "underline", textUnderlineOffset: 2, textDecorationColor: RUN.border2, cursor: "pointer" }}>
      {children}
    </button>
  )
}

function Big({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div style={{ backgroundColor: "#232323", borderRadius: 6, padding: "10px 12px", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: RUN.t3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: RUN.t1, lineHeight: "28px", whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: RUN.t4 }}>{sub}</div>}
    </div>
  )
}

export function RunBanner({ run, notInRun, trucksAvailable, topOffOrders = [], onDetails, onUnassigned, onTrucks }: {
  run: RunRecord
  notInRun?: { routes: number; orders: number }
  trucksAvailable?: number
  topOffOrders?: string[]
  onDetails?: () => void
  onUnassigned?: () => void
  onTrucks?: () => void
}) {
  const r = run.result
  const dot = !r ? RUN.bad : r.placed < r.total ? RUN.warn : RUN.ok
  const unplanned = r ? r.total - r.placed : 0
  return (
    <div style={{ borderRadius: 6, backgroundColor: "#1A1A1A", border: `1px solid ${RUN.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", fontSize: 13, color: RUN.t3, borderBottom: `1px solid ${RUN.border}` }}>
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot }} />
        <span>
          <b style={{ color: RUN.t1, fontWeight: 500 }}>Run #{run.number}</b> · {r ? "Completed" : "Didn't finish"} {run.submittedAt} · took {run.durationLabel.split(" ·")[0]}
        </span>
        <button type="button" onClick={onDetails} style={{ marginLeft: "auto", height: 26, padding: "0 10px", borderRadius: 13, border: `1px solid ${RUN.border2}`, background: "transparent", color: RUN.t2, fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
          Run details
        </button>
      </div>
      {r ? (
        <div style={{ padding: "10px 12px 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
            <Big label="Planned" value={`${r.placed} of ${r.total}`} sub={unplanned > 0 ? <Link tone="warn" onClick={onUnassigned}>{unplanned} not planned</Link> : "all planned"} />
            <Big label="Gallons" value={<span style={{ display: "inline-flex", gap: 4 }}>{formatGallons(r.gallons)}<TopOffMark orders={topOffOrders} /></span>} />
            <Big label="Miles" value={r.miles} />
            <Big label="To complete" value={formatMinutes(r.timeToCompleteMin)} sub="last truck back" />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, fontSize: 13, color: RUN.t3 }}>
            <span><b style={{ color: RUN.t1, fontWeight: 500 }}>{r.routes.length}</b> routes</span>
            <span><Link onClick={onTrucks}>{r.trucksUsed}{trucksAvailable ? ` of ${trucksAvailable}` : ""} trucks used</Link></span>
            <span><b style={{ color: RUN.t1, fontWeight: 500 }}>{r.miles > 0 ? (r.gallons / r.miles).toFixed(1) : "-"}</b> gal / mile</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: "10px 12px", fontSize: 13, color: RUN.t3 }}>{run.failure?.summary}. Nothing changed in your Workspace.</div>
      )}
      {notInRun && (notInRun.routes > 0 || notInRun.orders > 0) && (
        <div style={{ borderTop: `1px dashed ${RUN.border2}`, padding: "6px 12px", fontSize: 12, color: RUN.t4 }}>
          Not in this run: {notInRun.routes > 0 && `${notInRun.routes} route${notInRun.routes > 1 ? "s" : ""}`}
          {notInRun.routes > 0 && notInRun.orders > 0 && ", "}
          {notInRun.orders > 0 && `${notInRun.orders} order${notInRun.orders > 1 ? "s" : ""}`}. Re-optimize to include them.
        </div>
      )}
    </div>
  )
}
