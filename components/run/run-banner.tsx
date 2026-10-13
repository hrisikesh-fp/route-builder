"use client"

import type { RunRecord } from "@/lib/run-types"
import { RUN } from "@/components/run/run-ui"

// B. Run banner: one FROZEN line about the last run, like a job header
// ("Job 148 · Completed · 9:32 AM · 31m 4s"). Never changes after the run lands.
// The second line shows only when the Workspace holds routes or orders the run didn't include.

export function RunBanner({ run, notInRun, onDetails }: { run: RunRecord; notInRun?: { routes: number; orders: number }; onDetails?: () => void }) {
  const r = run.result
  const failed = !r
  const dot = failed ? RUN.bad : r && r.placed < r.total ? RUN.warn : RUN.ok
  const status = failed ? "Didn't finish" : "Completed"
  return (
    <div style={{ borderRadius: 6, border: `1px dashed ${RUN.border2}`, backgroundColor: "#1A1A1A" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", fontSize: 13, color: RUN.t3, flexWrap: "wrap" }}>
        <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot }} />
        <span>
          <b style={{ color: RUN.t1, fontWeight: 500 }}>Run #{run.number}</b> · {status} {run.submittedAt} · took {run.durationLabel.split(" ·")[0]}
          {r ? <> · {r.placed} of {r.total} placed</> : <> · Nothing changed in your workspace</>}
        </span>
        <button type="button" onClick={onDetails} style={{ marginLeft: "auto", height: 26, padding: "0 10px", borderRadius: 13, border: `1px solid ${RUN.border2}`, background: "transparent", color: RUN.t2, fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
          Run details
        </button>
      </div>
      {notInRun && (notInRun.routes > 0 || notInRun.orders > 0) && (
        <div style={{ borderTop: `1px dashed ${RUN.border2}`, padding: "6px 12px 6px 30px", fontSize: 12, color: RUN.t4 }}>
          Not in this run: {notInRun.routes > 0 && `${notInRun.routes} route${notInRun.routes > 1 ? "s" : ""}`}
          {notInRun.routes > 0 && notInRun.orders > 0 && ", "}
          {notInRun.orders > 0 && `${notInRun.orders} order${notInRun.orders > 1 ? "s" : ""}`}. The summary above includes them; this run&apos;s numbers don&apos;t.
        </div>
      )}
    </div>
  )
}
