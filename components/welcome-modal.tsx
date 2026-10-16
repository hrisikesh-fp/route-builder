"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Check, Search, TriangleAlert } from "lucide-react"
import { KINDS, type IssueKind } from "@/components/run/issue-kinds"
import type { WelcomeCat, WelcomeKind, WelcomeRow } from "@/components/welcome-checks"
import { WELCOME_LINES } from "@/components/welcome-checks"

// Welcome modal v2 (docs/interactions/a2-welcome-modal-v2.html).
// Nothing here blocks planning. Fix labels do not open Dispatch.

export const WELCOME_STRIP_HEIGHT = 56

const KIND_KEY: Record<WelcomeKind, IssueKind> = { act: "action", heads: "headsup" }
const TABS: { id: "all" | WelcomeKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "act", label: "Needs action" },
  { id: "heads", label: "Heads-up" },
]
const CAT_LABEL: Record<WelcomeCat, string> = { Order: "Orders", Truck: "Trucks", Driver: "Drivers", Setup: "Setup" }
const CATS: WelcomeCat[] = ["Order", "Truck", "Driver", "Setup"]

function KindIcon({ kind, size = 16 }: { kind: WelcomeKind; size?: number }) {
  const K = KINDS[KIND_KEY[kind]]
  const Icon = K.icon
  return <Icon size={size} color={K.fg} aria-hidden />
}

export function WelcomeModal({
  rows,
  initialSyncing = false,
  sourceFailed = false,
  onClose,
  onRowsChange,
  onFix,
  onReviewIssues,
  dateLabel,
  dateIso,
  onDateChange,
}: {
  rows: WelcomeRow[]
  initialSyncing?: boolean
  sourceFailed?: boolean
  onClose: () => void
  onRowsChange: (rows: WelcomeRow[]) => void
  onFix: (row: WelcomeRow) => void
  onReviewIssues: () => void
  dateLabel: string
  dateIso: string
  onDateChange: (iso: string) => void
}) {
  const [tab, setTab] = useState<"all" | WelcomeKind>("all")
  const [chip, setChip] = useState<"all" | WelcomeCat>("all")
  const [search, setSearch] = useState("")
  const [excluded, setExcluded] = useState<Record<number, boolean>>({})
  const [syncing, setSyncing] = useState(initialSyncing)
  const [failed, setFailed] = useState(sourceFailed)
  const [cleared, setCleared] = useState(0)
  const [syncedAt, setSyncedAt] = useState("2:14 PM")

  useEffect(() => {
    if (!initialSyncing) return
    const timer = window.setTimeout(() => setSyncing(false), 1400)
    return () => window.clearTimeout(timer)
  }, [initialSyncing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const counts = useMemo(() => ({
    all: rows.length,
    act: rows.filter((r) => r.kind === "act").length,
    heads: rows.filter((r) => r.kind === "heads").length,
  }), [rows])

  const activeTab = tab !== "all" && counts[tab] === 0 ? "all" : tab
  const tabRows = rows.filter((r) => activeTab === "all" || r.kind === activeTab)
  const query = search.trim().toLowerCase()
  const searched = tabRows.filter((r) => !query || [r.name, r.sub, r.det, r.issue].some((v) => v.toLowerCase().includes(query)))
  const cats = CATS.map((cat) => [cat, searched.filter((r) => r.cat === cat).length] as const).filter(([, n]) => n > 0)
  const activeChip = chip !== "all" && !cats.some(([cat]) => cat === chip) ? "all" : chip
  const shown = searched.filter((r) => activeChip === "all" || r.cat === activeChip)

  const resync = () => {
    if (syncing) return
    setSyncing(true)
    window.setTimeout(() => {
      const next = rows.filter((r) => r.id !== 2)
      const dropped = rows.length - next.length
      setSyncing(false)
      setCleared(dropped)
      setSyncedAt("2:31 PM")
      onRowsChange(next)
    }, 1400)
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 1800, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <style>{`@keyframes rb-welcome-spin { to { transform: rotate(360deg); } } @keyframes rb-welcome-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(920px, 100%)", maxHeight: "calc(100vh - 32px)", overflow: "auto", backgroundColor: "#1B1B1B", border: "1px solid #333", borderRadius: 8, padding: 20, fontFamily: "Geist, sans-serif", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <h2 id="welcome-title" style={{ margin: 0, fontSize: 18, fontWeight: 500, lineHeight: "24px", color: "#E5E5E5" }}>Welcome Forrest Gump</h2>
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <label style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8, height: 32, border: "1px solid #333", borderRadius: 4, padding: "0 12px", color: "#FFFFFF", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              <Calendar size={14} color="#A3A3A3" /> {dateLabel}
              <input type="date" aria-label="Planning date" value={dateIso} onChange={(e) => { if (e.target.value) onDateChange(e.target.value) }} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
            </label>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#A3A3A3", fontSize: 12 }}>
              {syncing ? (
                <>
                  <span style={{ width: 11, height: 11, border: "2px solid #737373", borderTopColor: "#FAFAFA", borderRadius: "50%", animation: "rb-welcome-spin 0.8s linear infinite" }} />
                  Syncing…
                </>
              ) : (
                <>
                  Last synced {syncedAt}
                  {cleared > 0 && <span style={{ color: "#4ADE80" }}>· {cleared} cleared</span>}
                  <span>·</span>
                  <button type="button" onClick={resync} style={{ background: "none", border: "none", padding: 0, color: "#A3A3A3", textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", font: "inherit" }}>Re-sync</button>
                </>
              )}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Metric label="Total Gallons" value="20,000 gal" />
          <Metric label="Routes" value="0" />
          <Metric label="Unassigned Orders" value="45" />
        </div>

        <div style={{ fontSize: 16, fontWeight: 500, lineHeight: "24px", color: "#E5E5E5" }}>Before you plan</div>

        {failed && !syncing && (
          <div style={{ marginTop: 12, borderRadius: 6, padding: "8px 12px", display: "flex", gap: 8, alignItems: "center", backgroundColor: "#242424", border: "1px solid #333", color: "#A3A3A3", fontSize: 12 }}>
            <TriangleAlert size={16} color="#A3A3A3" />
            <span><b style={{ color: "#FAFAFA", fontWeight: 500 }}>Truck and driver checks couldn't run.</b> Orders and setup were checked. Trucks and drivers may still have problems.</span>
            <button type="button" onClick={resync} style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, color: "#FAFAFA", textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", font: "inherit", whiteSpace: "nowrap" }}>Re-sync</button>
          </div>
        )}

        <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "1px solid #333" }}>
          {TABS.map((item) => {
            const n = counts[item.id]
            const disabled = syncing || (item.id !== "all" && n === 0)
            const on = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={on}
                disabled={disabled}
                onClick={() => { setTab(item.id); setChip("all") }}
                style={{ background: "none", border: "none", borderBottom: on ? "2px solid #FFFFFF" : "2px solid transparent", color: disabled ? "#4A4A4A" : on ? "#FFFFFF" : "#A3A3A3", font: "inherit", fontSize: 14, fontWeight: on ? 500 : 400, padding: "8px 10px", marginBottom: -1, cursor: disabled ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {item.id !== "all" && <KindIcon kind={item.id} />}
                {item.label} ({syncing ? "…" : n})
              </button>
            )
          })}
        </div>
        {!syncing && activeTab !== "all" && (
          <p style={{ margin: 0, color: "#A3A3A3", fontSize: 13, lineHeight: "18px" }}>{WELCOME_LINES[activeTab]}</p>
        )}
        {syncing && (
          <p style={{ margin: 0, color: "#A3A3A3", fontSize: 13, lineHeight: "18px" }}>Checking orders, trucks and drivers for {dateLabel.replace(/^Tomorrow: /, "")}…</p>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 32, border: "1px solid #333", borderRadius: 4, padding: "0 10px", minWidth: 0, boxSizing: "border-box" }}>
            <Search size={14} color="#737373" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              disabled={syncing}
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", color: "#E5E5E5", font: "inherit", fontSize: 13 }}
            />
          </label>
          {!syncing && cats.length > 1 && (
            <Chip on={activeChip === "all"} onClick={() => setChip("all")}>All <span style={{ color: "#737373", marginLeft: 6 }}>{searched.length}</span></Chip>
          )}
          {!syncing && cats.map(([cat, n]) => (
            <Chip key={cat} on={activeChip === cat || cats.length === 1} onClick={() => setChip(cat)}>{CAT_LABEL[cat]} <span style={{ color: "#737373", marginLeft: 6 }}>{n}</span></Chip>
          ))}
        </div>

        <div style={{ borderRadius: 4, border: "1px solid #282828", maxHeight: 240, overflow: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {["Name", "Category", "Details", "What's wrong", "How to fix"].map((label) => (
                  <th key={label} style={{ position: "sticky", top: 0, background: "#282828", textAlign: "left", fontWeight: 500, color: "#A3A3A3", fontSize: 13, lineHeight: "18px", padding: "8px 12px", whiteSpace: "nowrap", zIndex: 1 }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {syncing ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {["70%", "50%", "40%", "85%", "60%"].map((width, col) => (
                      <td key={col} style={{ padding: "18px 16px", borderTop: "1px solid #2E2E2E", background: "#1B1B1B" }}>
                        <div style={{ height: 10, width, borderRadius: 4, background: "linear-gradient(90deg, #262626, #303030, #262626)", backgroundSize: "200% 100%", animation: "rb-welcome-shimmer 1.2s ease-in-out infinite" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : shown.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 24, color: "#737373", background: "#1B1B1B" }}>Nothing matches.</td></tr>
              ) : shown.map((row) => {
                const muted = excluded[row.id]
                const tone = KINDS[KIND_KEY[row.kind]]
                return (
                  <tr key={row.id}>
                    <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", background: "#1B1B1B", opacity: muted ? 0.45 : 1, maxWidth: 180 }}>
                      <span style={{ display: "block", color: "#E5E5E5", fontSize: 13, lineHeight: "18px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</span>
                      <span style={{ display: "block", color: "#A3A3A3", fontSize: 12, lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.sub}</span>
                    </td>
                    <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", background: "#1B1B1B", color: "#A3A3A3", fontSize: 13, whiteSpace: "nowrap", opacity: muted ? 0.45 : 1 }}>{row.cat}</td>
                    <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", background: "#1B1B1B", color: "#A3A3A3", fontSize: 13, whiteSpace: "nowrap", opacity: muted ? 0.45 : 1 }}>{row.det}</td>
                    <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", background: "#1B1B1B", opacity: muted ? 0.45 : 1 }}>
                      <span style={{ display: "flex", gap: 6, alignItems: "center", color: tone.fg, fontSize: 13, whiteSpace: "nowrap" }}>
                        <KindIcon kind={row.kind} size={14} />
                        <span>{row.issue}</span>
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", borderTop: "1px solid #282828", background: "#1B1B1B", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        {!muted && (
                          <button type="button" onClick={() => onFix(row)} style={{ height: 28, border: "1px solid #333", borderRadius: 4, padding: "0 10px", background: "transparent", color: "#E5E5E5", font: "inherit", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                            {row.fix}
                          </button>
                        )}
                        {row.cat === "Order" ? (
                          excluded[row.id]
                            ? <><span style={{ color: "#737373", fontSize: 12 }}>Excluded</span><TextButton onClick={() => setExcluded((cur) => { const next = { ...cur }; delete next[row.id]; return next })}>Undo</TextButton></>
                            : <TextButton title="Leave this order out of the plan. It stays in Unassigned, marked Excluded, until you add it back." onClick={() => setExcluded((cur) => ({ ...cur, [row.id]: true }))}>Exclude</TextButton>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#737373", fontSize: 13 }}>{syncing ? "" : `Showing ${shown.length} of ${tabRows.length}`}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            <button type="button" disabled={syncing} onClick={onReviewIssues} style={ghostBtn}>Review all issues</button>
            <button type="button" onClick={onClose} style={{ ...ghostBtn, backgroundColor: "#E5E5E5", color: "#111", borderColor: "#E5E5E5" }}>Start planning</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ backgroundColor: "#282828", borderRadius: 4, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ color: "#A3A3A3", fontSize: 13, lineHeight: "18px", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 18, lineHeight: "24px", fontWeight: 500, color: "#E5E5E5", whiteSpace: "nowrap" }}>
        {value}
        {note && <small style={{ fontSize: 12, color: "#A3A3A3", marginLeft: 6, fontWeight: 400 }}>{note}</small>}
      </div>
    </div>
  )
}

function Chip({ on, onClick, children, title }: { on: boolean; onClick?: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" aria-pressed={on} title={title} onClick={onClick} style={{ height: 32, border: "1px solid #333", borderRadius: 4, padding: "0 10px", background: on ? "#282828" : "transparent", color: on ? "#E5E5E5" : "#A3A3A3", font: "inherit", fontSize: 13, fontWeight: 500, cursor: onClick ? "pointer" : "default", whiteSpace: "nowrap" }}>
      {children}
    </button>
  )
}

function TextButton({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{ background: "none", border: "none", padding: 0, color: "#A3A3A3", textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", font: "inherit", fontSize: 13 }}>
      {children}
    </button>
  )
}

const ghostBtn: React.CSSProperties = {
  height: 32,
  border: "1px solid #333",
  borderRadius: 4,
  padding: "0 12px",
  background: "none",
  color: "#E5E5E5",
  font: "inherit",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
}

export function WelcomeStrip({ rows, onReview }: { rows: WelcomeRow[]; onReview: () => void }) {
  const action = rows.filter((r) => r.kind === "act")
  if (action.length === 0) return null
  const bits = (["Order", "Truck", "Driver", "Setup"] as WelcomeCat[]).flatMap((cat) => {
    const n = action.filter((r) => r.cat === cat).length
    if (n === 0) return []
    const word = cat === "Order" ? "order" : cat === "Truck" ? "truck" : cat === "Driver" ? "driver" : "setup"
    return [`${n} ${word}${n === 1 ? "" : "s"}`]
  })
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, height: "100%", padding: "12px 16px", backgroundColor: "rgba(220,38,38,0.12)", color: "#F87171", borderBottom: "1px solid rgba(248,113,113,0.25)", fontSize: 13, fontFamily: "Geist, sans-serif", boxSizing: "border-box" }}>
      <TriangleAlert size={16} />
      <span>{action.length} {action.length === 1 ? "thing needs" : "things need"} action before they can be planned: {bits.join(", ")}.</span>
      <button type="button" onClick={onReview} style={{ background: "none", border: "none", padding: 0, color: "#FAFAFA", textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", font: "inherit", fontSize: 13 }}>Review</button>
    </div>
  )
}

export function ChecksClearToast({ text }: { text: string }) {
  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 1900, backgroundColor: "#262626", border: "1px solid #3A3A3A", borderRadius: 8, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "#FAFAFA", fontFamily: "Geist, sans-serif", boxShadow: "0 12px 30px rgba(0,0,0,0.4)" }}>
      <Check size={16} color="#4ADE80" />
      {text}
    </div>
  )
}
