"use client"

import type { GoalId, GoalResult } from "@/lib/run-types"
import { formatGallons, formatMinutes } from "@/lib/run-history-data"
import { Chip, RUN } from "@/components/run/run-ui"

// The goals a comparison run tried, side by side, read-only. A compact version of the
// #434 scorecard with the 12 Oct rules applied:
//  - Orders placed is ranked first; a plan that places fewer than the best reads
//    "Leaves N unplanned" and gets no "best" on trucks, miles or time
//  - a plan identical to another is flagged instead of shown as a separate choice
//  - the goal that was used is marked

export function RunGoalsTable({ goals, chosen }: { goals: GoalResult[]; chosen?: GoalId }) {
  const maxPlaced = Math.max(...goals.map((g) => g.placed))
  const full = goals.filter((g) => g.placed === maxPlaced && !g.sameAs)
  const best = (pick: (g: GoalResult) => number) => {
    const vals = full.map(pick)
    const min = Math.min(...vals)
    const allTie = vals.every((v) => Math.abs(v - min) <= Math.abs(min) * 0.01)
    return (g: GoalResult) => !allTie && full.includes(g) && Math.abs(pick(g) - min) <= Math.abs(min) * 0.01
  }
  const rows: { label: string; render: (g: GoalResult) => string; isBest: (g: GoalResult) => boolean }[] = [
    { label: "Orders placed", render: (g) => `${g.placed} of ${g.total}`, isBest: () => false },
    { label: "Trucks used", render: (g) => String(g.trucksUsed), isBest: best((g) => g.trucksUsed) },
    { label: "Total distance", render: (g) => `${g.miles} mi`, isBest: best((g) => g.miles) },
    { label: "Time to complete", render: (g) => formatMinutes(g.timeToCompleteMin), isBest: best((g) => g.timeToCompleteMin) },
    { label: "Gallons delivered", render: (g) => `${formatGallons(g.gallons)}`, isBest: () => false },
  ]
  const cell = { padding: "8px 10px", borderBottom: `1px solid ${RUN.border}`, fontSize: 13, textAlign: "left" as const, verticalAlign: "top" as const }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 380 }}>
        <thead>
          <tr>
            <th style={{ ...cell, color: RUN.t4, fontWeight: 400, fontSize: 11, width: 120 }} />
            {goals.map((g) => (
              <th key={g.goalId} style={{ ...cell, backgroundColor: g.goalId === chosen ? "rgba(99,102,241,0.10)" : "transparent", borderTop: g.goalId === chosen ? `2px solid ${RUN.info}` : "2px solid transparent" }}>
                <div style={{ color: RUN.t2, fontWeight: 500 }}>{g.label}</div>
                <div style={{ color: RUN.t4, fontSize: 11, fontWeight: 400, margin: "2px 0 6px" }}>{g.descriptor}</div>
                {g.goalId === chosen && <Chip tone="info" style={{ marginRight: 4 }}>Used</Chip>}
                {g.sameAs ? (
                  <Chip>Same plan as {goals.find((x) => x.goalId === g.sameAs)?.label}</Chip>
                ) : g.placed < maxPlaced ? (
                  <Chip tone="warn">Leaves {maxPlaced - g.placed} unplanned</Chip>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" style={{ ...cell, color: RUN.t3, fontWeight: 400 }}>{row.label}</th>
              {goals.map((g) => {
                const b = row.isBest(g)
                return (
                  <td key={g.goalId} style={{ ...cell, color: b ? RUN.ok : g.sameAs || g.placed < maxPlaced ? RUN.t4 : RUN.t2, fontVariantNumeric: "tabular-nums", backgroundColor: g.goalId === chosen ? "rgba(99,102,241,0.06)" : "transparent" }}>
                    {row.render(g)}
                    {b && <span style={{ fontSize: 11, marginLeft: 6 }}>best</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
