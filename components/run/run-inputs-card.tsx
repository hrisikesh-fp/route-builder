"use client"

import type { RunInputs } from "@/lib/run-types"
import { formatGallons } from "@/lib/run-history-data"
import { RUN } from "@/components/run/run-ui"

// "What was this run given?" Same content as the #298 run audit page, but in dispatcher
// words (goal names, truck names) and inside Route Builder instead of a new tab.
// Recorded at submit time, so later settings changes don't rewrite it.

export function RunInputsCard({ inputs, requestId }: { inputs: RunInputs; requestId: string }) {
  const rows: [string, React.ReactNode][] = [
    ["Orders", <>{inputs.orders} orders · {formatGallons(inputs.gallons)} gal · {inputs.products.map((p) => `${p.name} ${formatGallons(p.gallons)}`).join(", ")}</>],
    ["Trucks", <>{inputs.trucks.length} · {inputs.trucks.join(", ")}</>],
    ["Drivers", inputs.drivers.join(", ")],
    ["Goal", inputs.goalLabel],
    ["Rules applied", inputs.rules.join(" · ")],
    ["Limits", inputs.limits.join(" · ")],
    ["Travel times", inputs.travelTimes],
  ]
  return (
    <div>
      <div style={{ fontSize: 12, color: RUN.t4, marginBottom: 8 }}>Recorded when the run was submitted. Later changes to settings don&apos;t change what this run was given.</div>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "112px 1fr" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt style={{ fontSize: 12, color: RUN.t4, padding: "7px 0", borderBottom: `1px solid ${RUN.border}` }}>{k}</dt>
            <dd style={{ margin: 0, fontSize: 13, color: RUN.t2, padding: "7px 0", borderBottom: `1px solid ${RUN.border}`, lineHeight: "18px" }}>{v}</dd>
          </div>
        ))}
      </dl>
      <div style={{ marginTop: 10, fontSize: 11, color: RUN.t4 }}>
        Engine request <span style={{ fontFamily: RUN.mono, color: RUN.t3, userSelect: "all" }}>{requestId}</span> · raw request and response for admins only
      </div>
    </div>
  )
}
