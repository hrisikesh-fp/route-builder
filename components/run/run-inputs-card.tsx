"use client"

import type { RunInputs } from "@/lib/run-types"
import { formatGallons } from "@/lib/run-history-data"
import { RUN } from "@/components/run/run-ui"

// "What went in": the #298 run audit, rewritten so a dispatcher can read it. Same stored
// fields (demand, fleet, rules, limits, goal, travel times), in plain words: goal names, not
// engine terms; no "not recorded" rows. The raw engine request and response stay admin-only.

export function RunInputsCard({ inputs, requestId }: { inputs: RunInputs; requestId: string }) {
  const rows: [string, React.ReactNode][] = [
    ["Orders", <>{inputs.orders} orders · {formatGallons(inputs.gallons)} gal · {inputs.products.length} products</>],
    ["Trucks", <>{inputs.trucks.length} trucks · {inputs.trucks.join(", ")}</>],
    ["Goal", inputs.goalLabel],
    ["Rules used", inputs.rules.join(" · ")],
    ["Limits", inputs.limits.join(" · ")],
    ["Drive times", inputs.travelTimes],
  ]
  return (
    <div>
      <div style={{ fontSize: 12, color: RUN.t4, marginBottom: 8 }}>What this run was given, as it was when you pressed Optimize. Changing settings later doesn&apos;t change this.</div>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "104px 1fr" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt style={{ fontSize: 12, color: RUN.t4, padding: "7px 0", borderBottom: `1px solid ${RUN.border}` }}>{k}</dt>
            <dd style={{ margin: 0, fontSize: 13, color: RUN.t2, padding: "7px 0", borderBottom: `1px solid ${RUN.border}`, lineHeight: "18px" }}>{v}</dd>
          </div>
        ))}
      </dl>
      <div style={{ marginTop: 10, fontSize: 11, color: RUN.t4 }}>
        Run reference <span style={{ fontFamily: RUN.mono, color: RUN.t3, userSelect: "all" }}>{requestId}</span> · give it to support if something looks wrong
      </div>
    </div>
  )
}
