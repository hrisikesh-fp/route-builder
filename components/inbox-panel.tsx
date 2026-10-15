"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { List, Table2 } from "lucide-react"
import { KINDS, type IssueKind } from "@/components/run/issue-kinds"
import { WELCOME_LINES, type WelcomeKind, type WelcomeRow } from "@/components/welcome-checks"

// Same three groups as the welcome modal. List is the cards. Table is the modal's columns.
// Opening from the bell scrolls to that group and holds a highlight on it.

const KIND_KEY: Record<WelcomeKind, IssueKind> = { act: "action", heads: "headsup" }
const ORDER: WelcomeKind[] = ["act", "heads"]

const iconButton = (active: boolean): CSSProperties => ({
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #333",
  borderRadius: 4,
  backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
  cursor: "pointer",
})

export function InboxBody({
  rows,
  focusKind,
  focusToken,
  onFix,
}: {
  rows: WelcomeRow[]
  focusKind: WelcomeKind | null
  focusToken: number
  onFix: (row: WelcomeRow) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<"list" | "table">("list")
  const groups = ORDER.map((kind) => ({ kind, rows: rows.filter((r) => r.kind === kind) })).filter((g) => g.rows.length > 0)

  useEffect(() => {
    const scroller = root.current
    if (!scroller) return
    if (!focusKind) {
      scroller.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    const el = scroller.querySelector<HTMLElement>(`[data-inbox-kind="${focusKind}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    el.classList.add("rb-inbox-focus")
    const timer = window.setTimeout(() => el.classList.remove("rb-inbox-focus"), 2500)
    return () => window.clearTimeout(timer)
  }, [focusKind, focusToken, view])

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes rb-inbox-flash {
          0%, 100% { background-color: transparent; }
          50% { background-color: #282828; }
        }
        .rb-inbox-focus { animation: rb-inbox-flash 0.5s ease 5; border-radius: 6px; }
      `}</style>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "8px 12px 0", flexShrink: 0 }}>
        <button type="button" aria-label="Table view" aria-pressed={view === "table"} onClick={() => setView("table")} style={iconButton(view === "table")}>
          <Table2 size={16} color="#E5E5E5" />
        </button>
        <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} style={iconButton(view === "list")}>
          <List size={16} color="#E5E5E5" />
        </button>
      </div>
      <div ref={root} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 12px 12px" }}>
        {groups.length === 0 && (
          <div style={{ padding: "32px 8px", textAlign: "center", fontSize: 14, color: "#737373" }}>Nothing needs a look for this date.</div>
        )}
        {view === "list" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {groups.map((group) => {
              const K = KINDS[KIND_KEY[group.kind]]
              const Icon = K.icon
              return (
                <section key={group.kind} data-inbox-kind={group.kind} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 4 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: K.fg, fontSize: 14, fontWeight: 500 }}>
                      <Icon size={16} />
                      {group.rows.length === 1 ? K.label : K.plural}
                      <span style={{ color: "#737373", fontWeight: 400 }}>{group.rows.length}</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: "16px", color: "#A3A3A3" }}>{WELCOME_LINES[group.kind]}</p>
                  </div>
                  {group.rows.map((row) => (
                    <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 4, backgroundColor: "#1F1F1F" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</div>
                        <div style={{ fontSize: 12, color: K.fg }}>{row.issue}</div>
                      </div>
                      <FixButton label={row.fix} onClick={() => onFix(row)} />
                    </div>
                  ))}
                </section>
              )
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {groups.map((group) => {
              const K = KINDS[KIND_KEY[group.kind]]
              const Icon = K.icon
              return (
                <section key={group.kind} data-inbox-kind={group.kind} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: K.fg, fontSize: 13, fontWeight: 500 }}>
                      <Icon size={14} />
                      {group.rows.length === 1 ? K.label : K.plural}
                      <span style={{ color: "#737373", fontWeight: 400 }}>{group.rows.length}</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: "16px", color: "#A3A3A3" }}>{WELCOME_LINES[group.kind]}</p>
                  </div>
                  <div style={{ border: "1px solid #282828", borderRadius: 4, overflow: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                      <thead>
                        <tr>
                          {["Name", "Category", "Details", "What's wrong", "How to fix"].map((label) => (
                            <th key={label} style={{ background: "#282828", textAlign: "left", fontWeight: 500, color: "#A3A3A3", fontSize: 13, padding: "8px 12px", whiteSpace: "nowrap" }}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => (
                          <tr key={row.id}>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", color: "#E5E5E5", fontSize: 13, whiteSpace: "nowrap" }}>
                              {row.name}
                              <span style={{ display: "block", color: "#A3A3A3", fontSize: 12 }}>{row.sub}</span>
                            </td>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", color: "#A3A3A3", fontSize: 13, whiteSpace: "nowrap" }}>{row.cat}</td>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", color: "#A3A3A3", fontSize: 13, whiteSpace: "nowrap" }}>{row.det}</td>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", color: K.fg, fontSize: 13, whiteSpace: "nowrap" }}>{row.issue}</td>
                            <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", whiteSpace: "nowrap" }}>
                              <FixButton label={row.fix} onClick={() => onFix(row)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FixButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ height: 28, flexShrink: 0, border: "1px solid #333", borderRadius: 4, padding: "0 10px", background: "transparent", color: "#E5E5E5", font: "inherit", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
      {label}
    </button>
  )
}
