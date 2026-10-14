"use client"

import { useState } from "react"
import { ChevronRight, X } from "lucide-react"
import { KINDS, type IssueKind } from "@/components/run/issue-kinds"
import { RUN } from "@/components/run/run-ui"

// Pre-run checks as a PANEL (the version for the main shell, 14 Oct): the Workspace only shows
// a narrow banner with a message and a button; the button opens this panel below the map
// (or on the right, depending on screen width). Same content as the welcome modal and the
// Inbox dropdown: one card per kind, expand a card to see its rows, each row with its fix.

export type IssueRow = { id: string; kind: IssueKind; entity: string; text: string; fix: string; exclude?: boolean }

export function IssuesBanner({ rows, onOpen }: { rows: IssueRow[]; onOpen: () => void }) {
  if (rows.length === 0) return null
  const action = rows.filter((r) => r.kind === "action").length
  const K = action > 0 ? KINDS.action : KINDS.headsup
  const Icon = K.icon
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: K.bg, borderRadius: 6, padding: "8px 12px", fontSize: 13 }}>
      <Icon size={15} color={K.fg} aria-hidden />
      <span style={{ color: RUN.t2 }}>
        {rows.length} {rows.length === 1 ? "thing needs" : "things need"} a look before you plan
        {action > 0 && <span style={{ color: RUN.t3 }}> · {action} {action === 1 ? "order is" : "orders are"} left out until fixed</span>}
      </span>
      <button type="button" onClick={onOpen} style={{ marginLeft: "auto", height: 28, padding: "0 12px", borderRadius: 4, border: `1px solid ${RUN.border2}`, background: "#1B1B1B", color: RUN.t1, fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
        Review checks
      </button>
    </div>
  )
}

export function IssuesPanel({ rows, onClose, onExclude }: { rows: IssueRow[]; onClose: () => void; onExclude?: (id: string) => void }) {
  const kinds = (Object.keys(KINDS) as IssueKind[]).filter((k) => rows.some((r) => r.kind === k))
  const [open, setOpen] = useState<IssueKind | null>(kinds[0] ?? null)
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: RUN.panel, borderTop: `1px solid ${RUN.border2}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: RUN.t1 }}>Before you plan</span>
        <span style={{ fontSize: 12, color: RUN.t4 }}>Checks on the orders and trucks in this Workspace</span>
        <button type="button" aria-label="Close checks" onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: RUN.t3, cursor: "pointer" }}><X size={15} /></button>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 14px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
        {kinds.map((k) => {
          const K = KINDS[k]
          const Icon = K.icon
          const list = rows.filter((r) => r.kind === k)
          const isOpen = open === k
          return (
            <div key={k} style={{ flex: 1, minWidth: 220, backgroundColor: RUN.card, borderRadius: 6, border: `1px solid ${isOpen ? K.fg : RUN.border}` }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : k)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "none", border: "none", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
                <Icon size={15} color={K.fg} aria-hidden />
                <span style={{ fontSize: 14, color: K.fg, fontWeight: 500 }}>{list.length} {list.length === 1 ? K.label : K.plural}</span>
                <ChevronRight size={14} color={RUN.t4} style={{ marginLeft: "auto", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 150ms" }} />
              </button>
              {!isOpen && <div style={{ padding: "0 12px 10px", fontSize: 12, color: RUN.t4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{list[0].entity}: {list[0].text}</div>}
              {isOpen &&
                list.map((r) => (
                  <div key={r.id} style={{ padding: "8px 12px", borderTop: `1px solid ${RUN.border}` }}>
                    <div style={{ fontSize: 13, color: RUN.t2 }}>{r.entity}</div>
                    <div style={{ fontSize: 12, color: RUN.t3, margin: "2px 0 4px" }}>{r.text}</div>
                    <span style={{ display: "flex", gap: 12, fontSize: 12 }}>
                      <button type="button" style={{ background: "none", border: "none", padding: 0, color: RUN.t2, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>{r.fix}</button>
                      {r.exclude && <button type="button" onClick={() => onExclude?.(r.id)} style={{ background: "none", border: "none", padding: 0, color: RUN.t3, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>Exclude</button>}
                    </span>
                  </div>
                ))}
            </div>
          )
        })}
        {kinds.length === 0 && <div style={{ fontSize: 13, color: RUN.t3, padding: 8 }}>Nothing to check. You&apos;re good to plan.</div>}
      </div>
    </div>
  )
}
