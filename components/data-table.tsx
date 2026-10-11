"use client"

import { ChevronDown, ChevronRight, Filter, Layers3, LayoutGrid, ListFilter, Plus, Search } from "lucide-react"

// Table pieces from the Figma Orders page (RB - Routing v2, 9145:127262): toolbar, table, pagination.
// Toolbar and pagination are visual only in the prototype.

// ─── Toolbar ────────────────────────────────────────────────────────────────

const outlineButton: React.CSSProperties = {
  height: 40,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 16px",
  border: "1px solid #333",
  borderRadius: 4,
  backgroundColor: "transparent",
  color: "#A3A3A3",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: "20px",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
  flexShrink: 0,
  cursor: "default",
}

export function DataTableToolbar({ searchPlaceholder = "Search" }: { searchPlaceholder?: string }) {
  return (
    // overflow hidden: when the map is open the right-hand buttons clip, same as the Figma map-open frame
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", flexShrink: 0 }}>
        <div style={{ ...outlineButton, width: 240, borderRadius: "4px 0 0 4px", cursor: "text" }}>
          <Search size={16} />
          <span style={{ fontWeight: 400 }}>{searchPlaceholder}</span>
        </div>
        <div style={{ ...outlineButton, borderLeft: "none", borderRadius: "0 4px 4px 0" }}>
          Filter columns <ListFilter size={16} />
        </div>
      </div>
      <div style={outlineButton}><Filter size={16} /> Filters</div>
      <div style={outlineButton}><Layers3 size={16} /> Group By</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          <div style={{ ...outlineButton, borderRadius: "4px 0 0 4px" }}>
            <LayoutGrid size={16} /> Views: Default View <ChevronDown size={16} />
          </div>
          <div style={{ ...outlineButton, borderLeft: "none", borderRadius: "0 4px 4px 0", padding: "0 12px" }}>
            <Plus size={16} />
          </div>
        </div>
        <div style={{ width: 1, height: 32, backgroundColor: "#333" }} />
        <div style={{ ...outlineButton, border: "none", backgroundColor: "#262626", color: "#FAFAFA", padding: "0 24px" }}>Action</div>
      </div>
    </div>
  )
}

// ─── Table ──────────────────────────────────────────────────────────────────

export interface DataTableColumn<Row> {
  key: string
  label: string
  /** CSS grid track, e.g. "2fr" or "120px". Defaults to 1fr. */
  width?: string
  render: (row: Row) => React.ReactNode
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[]
  rows: Row[]
  getRowId: (row: Row) => string
  onRowHover?: (id: string | null) => void
  emptyText?: string
  /** When set, rows are grouped under a full-width header row per group (in first-seen order). */
  groupBy?: (row: Row) => string
}

export function DataTable<Row>({ columns, rows, getRowId, onRowHover, emptyText = "Nothing to show", groupBy }: DataTableProps<Row>) {
  const template = columns.map((c) => c.width ?? "minmax(0, 1fr)").join(" ")
  const groups: { key: string; rows: Row[] }[] = []
  if (groupBy) {
    for (const row of rows) {
      const key = groupBy(row)
      const existing = groups.find((g) => g.key === key)
      if (existing) existing.rows.push(row)
      else groups.push({ key, rows: [row] })
    }
  } else {
    groups.push({ key: "", rows })
  }
  return (
    <div style={{ border: "1px solid #282828", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: template, backgroundColor: "#282828" }}>
        {columns.map((c) => (
          <div key={c.key} style={{ minHeight: 40, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#A3A3A3" }}>
            {c.label}
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <div style={{ padding: "32px 12px", textAlign: "center", fontSize: 14, color: "#737373" }}>{emptyText}</div>
      )}
      {groups.map((group) => (
        <div key={group.key || "all"}>
          {groupBy && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderTop: "1px solid #282828", backgroundColor: "#1B1B1B", fontSize: 13, fontWeight: 500, color: "#E5E5E5" }}>
              {group.key}
              <span style={{ fontSize: 12, fontWeight: 400, color: "#737373" }}>{group.rows.length}</span>
            </div>
          )}
          {group.rows.map((row) => {
        const id = getRowId(row)
        return (
          <div
            key={id}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#1A1A1A"; onRowHover?.(id) }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; onRowHover?.(null) }}
            style={{ display: "grid", gridTemplateColumns: template, borderTop: "1px solid #282828" }}
          >
            {columns.map((c) => (
              <div key={c.key} style={{ minHeight: 72, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: 12, fontSize: 16, lineHeight: "24px", color: "#E5E5E5", boxSizing: "border-box" }}>
                {c.render(row)}
              </div>
            ))}
          </div>
        )
      })}
        </div>
      ))}
    </div>
  )
}

/** Single-line text that ellipsises inside a table cell */
export function CellText({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: muted ? "#A3A3A3" : undefined, fontSize: muted ? 14 : undefined, lineHeight: muted ? "20px" : undefined }}>
      {children}
    </span>
  )
}

export function StatusBadge({ label, tone }: { label: string; tone: "orange" | "grey" | "green" }) {
  const colors = {
    orange: { bg: "#FF931E", fg: "#171717" },
    grey: { bg: "#333", fg: "#FAFAFA" },
    green: { bg: "rgba(16,185,129,0.15)", fg: "#34D399" },
  }[tone]
  return (
    <span style={{ alignSelf: "flex-start", padding: "2px 8px", borderRadius: 4, backgroundColor: colors.bg, color: colors.fg, fontSize: 14, fontWeight: 500, lineHeight: "20px", whiteSpace: "nowrap" }}>
      {label}
    </span>
  )
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export function DataTablePagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (p: number) => void }) {
  if (pageCount <= 1) return null
  const pages = Array.from({ length: Math.min(pageCount, 3) }, (_, i) => i + 1)
  const item = (active: boolean): React.CSSProperties => ({
    minWidth: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 10px",
    border: active ? "1px solid #333" : "1px solid transparent", borderRadius: 6, backgroundColor: "transparent",
    color: "#E5E5E5", fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
  })
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 24 }}>
      {pages.map((p) => (
        <button key={p} type="button" onClick={() => onPageChange(p)} style={item(p === page)}>{p}</button>
      ))}
      {pageCount > 3 && <span style={{ ...item(false), cursor: "default" }}>…</span>}
      <button type="button" onClick={() => onPageChange(Math.min(page + 1, pageCount))} style={item(false)}>
        Next <ChevronRight size={16} />
      </button>
    </div>
  )
}
