"use client"

import { useState, type ReactNode } from "react"
import type { RunResult } from "@/lib/run-types"
import { formatGallons, formatMinutes } from "@/lib/run-history-data"
import { Chip, Kv, RUN } from "@/components/run/run-ui"

// RunMetricsStrip: one slim strip at the top of a workspace, the same height in every state.
// Built for two homes:
//  - Planning workspace (variant "live"): after a lasso, while optimizing, after a run
//  - Run history (variant "snapshot"): the frozen result of one past run
// Chips on the right open a panel underneath (unassigned reasons, pre-run checks, picker...).
// Only one panel is open at a time, so the strip never grows past one panel.

export type StripAction = {
  id: string
  label: ReactNode
  tone?: "neutral" | "warn" | "bad" | "ok" | "info"
  mono?: boolean
  /** Opens under the strip when clicked. */
  content?: ReactNode
  /** Or does something else (open a run, open a dialog). */
  onClick?: () => void
}

export type StripState =
  | { kind: "selection"; orders: number; gallons: number; products: { name: string; gallons: number }[]; trucks?: { count: number; capacity: number } }
  | { kind: "optimizing"; label: string; elapsed: string; onCancel?: () => void }
  | { kind: "result"; result: RunResult; scopeLabel?: string }
  | { kind: "failed"; summary: string; nextStep: string }

export function RunMetricsStrip({ state, actions = [], variant = "live", defaultOpen }: { state: StripState; actions?: StripAction[]; variant?: "live" | "snapshot"; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null)
  const openAction = actions.find((a) => a.id === open && a.content)

  return (
    <div style={{ backgroundColor: RUN.raised, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.35)", border: variant === "snapshot" ? `1px dashed ${RUN.border2}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "10px 14px", minHeight: 56 }}>
        <StripBody state={state} />
        {actions.length > 0 && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {actions.map((a) => (
              <Chip
                key={a.id}
                tone={a.tone}
                mono={a.mono}
                active={open === a.id}
                onClick={() => {
                  if (a.content) setOpen((cur) => (cur === a.id ? null : a.id))
                  a.onClick?.()
                }}
              >
                {a.label}
              </Chip>
            ))}
          </span>
        )}
      </div>
      {openAction && <div style={{ borderTop: `1px solid ${RUN.border2}`, padding: "10px 12px" }}>{openAction.content}</div>}
    </div>
  )
}

function Divider() {
  return <span aria-hidden style={{ width: 1, alignSelf: "stretch", backgroundColor: RUN.border2 }} />
}

function StripBody({ state }: { state: StripState }) {
  if (state.kind === "selection") {
    return (
      <>
        <Kv value={state.orders} label="orders" emphasis />
        <Divider />
        <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: RUN.t1 }}>{formatGallons(state.gallons)} gal</span>
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {state.products.map((p) => (
              <span key={p.name} style={{ fontSize: 11, color: RUN.t3, backgroundColor: "#2A2A2A", borderRadius: 3, padding: "0 6px" }}>
                {p.name} {formatGallons(p.gallons)}
              </span>
            ))}
          </span>
        </span>
        {state.trucks && (
          <>
            <Divider />
            <Kv value={`${state.trucks.count} ${state.trucks.count === 1 ? "truck" : "trucks"}`} label={`${formatGallons(state.trucks.capacity)} gal capacity`} />
          </>
        )}
      </>
    )
  }
  if (state.kind === "optimizing") {
    return (
      <>
        <Kv value="Optimizing" label={`${state.label} · ${state.elapsed}`} />
        <span aria-hidden style={{ width: 160, height: 3, borderRadius: 2, backgroundColor: RUN.border2, overflow: "hidden" }}>
          <span style={{ display: "block", width: "45%", height: "100%", backgroundColor: RUN.t3, animation: "rb-strip-progress 1.6s ease-in-out infinite" }} />
        </span>
        <style>{"@keyframes rb-strip-progress{0%{transform:translateX(-100%)}100%{transform:translateX(230%)}}@media (prefers-reduced-motion:reduce){[style*=rb-strip-progress]{animation:none!important}}"}</style>
      </>
    )
  }
  if (state.kind === "failed") {
    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: RUN.bad }}>{state.summary}</span>
        <span style={{ fontSize: 12, color: RUN.t3 }}>{state.nextStep}</span>
      </span>
    )
  }
  const r = state.result
  return (
    <>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
        <span style={{ fontSize: 16, fontWeight: 500, color: RUN.t1, whiteSpace: "nowrap" }}>
          {r.placed}
          <span style={{ color: RUN.t4, fontWeight: 400 }}> / {r.total}</span>
        </span>
        <span style={{ fontSize: 11, color: RUN.t4, whiteSpace: "nowrap" }}>{state.scopeLabel ?? "orders placed"}</span>
      </span>
      <Divider />
      <Kv value={r.routes.length} label={r.routes.length === 1 ? "route" : "routes"} />
      <Kv value={formatGallons(r.gallons)} label="gal" />
      <Kv value={r.miles} label="mi" />
      <Kv value={formatMinutes(r.timeToCompleteMin)} label="to complete" />
    </>
  )
}
