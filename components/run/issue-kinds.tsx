"use client"

import { CircleAlert, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react"
import { RUN } from "@/components/run/run-ui"

// The A2 contract's three kinds (interactions/a2-shared-decisions.md): same names, icons and
// colours everywhere. No dots, no "error / warning". Used before a run (pre-run checks) and,
// proposed, after a run (unplanned reasons).

export type IssueKind = "action" | "headsup" | "suggestion"

export const KINDS: Record<IssueKind, { label: string; plural: string; icon: LucideIcon; fg: string; bg: string }> = {
  action: { label: "Needs action", plural: "Needs action", icon: TriangleAlert, fg: "#F87171", bg: "rgba(248,113,113,0.10)" },
  headsup: { label: "Heads-up", plural: "Heads-up", icon: CircleAlert, fg: "#EAB308", bg: "rgba(234,179,8,0.10)" },
  suggestion: { label: "Suggestion", plural: "Suggestions", icon: Lightbulb, fg: "#60A5FA", bg: "rgba(96,165,250,0.10)" },
}

/** The strip at the top of a Workspace tab: counts by kind + Review. */
export function IssueStrip({ counts, scope, onReview }: { counts: Partial<Record<IssueKind, number>>; scope: string; onReview?: () => void }) {
  const kinds = (Object.keys(KINDS) as IssueKind[]).filter((k) => (counts[k] ?? 0) > 0)
  if (kinds.length === 0) return null
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", backgroundColor: RUN.card, borderRadius: 4, padding: "8px 12px", fontSize: 13 }}>
      {kinds.map((k) => {
        const K = KINDS[k]
        const Icon = K.icon
        return (
          <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: K.fg }}>
            <Icon size={14} aria-hidden /> {counts[k]} {counts[k] === 1 ? K.label : K.plural}
          </span>
        )
      })}
      <span style={{ color: RUN.t4 }}>{scope}</span>
      <button type="button" onClick={onReview} style={{ marginLeft: "auto", background: "none", border: "none", color: RUN.t2, fontSize: 13, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", fontFamily: "inherit" }}>
        Review
      </button>
    </div>
  )
}

/** One issue on a card: icon + one sentence + one fix link (+ Exclude on orders). */
export function IssueLine({ kind, text, fix, onFix, exclude, onExclude, meta }: { kind: IssueKind; text: string; fix?: string; onFix?: () => void; exclude?: boolean; onExclude?: () => void; meta?: string }) {
  const K = KINDS[kind]
  const Icon = K.icon
  const link = { background: "none", border: "none", padding: 0, fontSize: 12, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 } as const
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: K.bg, borderRadius: 4, padding: "6px 8px", marginTop: 6 }}>
      <Icon size={14} color={K.fg} aria-label={K.label} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: RUN.t2, flex: 1, minWidth: 0 }}>{text}</span>
      {meta && <span style={{ fontSize: 11, color: RUN.t4, fontFamily: RUN.mono }}>{meta}</span>}
      {fix && <button type="button" onClick={onFix} style={{ ...link, color: RUN.t2 }}>{fix}</button>}
      {exclude && <button type="button" onClick={onExclude} style={{ ...link, color: RUN.t3 }}>Exclude</button>}
    </div>
  )
}
