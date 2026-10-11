"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Layers3, List, PanelLeft, Search, Table2, Truck, UserCheck, X } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import type { LeftPanel } from "@/components/side-nav-rail"
import { ListOrderCard } from "@/components/list-order-card"
import { DataTable, DataTablePagination } from "@/components/data-table"
import { orderTableColumns } from "@/components/rb-pages"

// 3D shell left panel — Figma RB - Routing v2, "1/2" panel (9175:89008), header 9175:89010, toolbar 9175:91592.
// Orders: List (cards) or Table view. Group By only in Table view. Trucks / Drivers: empty for now.

export const LEFT_PANEL_WIDTH = 600
type OrdersView = "list" | "table"
type GroupKey = "none" | "status" | "type" | "customer"

const GROUP_OPTIONS: { id: GroupKey; label: string }[] = [
  { id: "none", label: "No grouping" },
  { id: "status", label: "Status" },
  { id: "type", label: "Order Type" },
  { id: "customer", label: "Customer" },
]
const TYPE_LABEL: Record<string, string> = { D: "Delivery", L: "Load", T: "Transfer" }
const PAGE_SIZE = 10

const iconButton = (active = false): React.CSSProperties => ({
  width: 36,
  height: 36,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #333",
  borderRadius: 4,
  backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
  cursor: "pointer",
})

interface LeftPanelViewProps {
  panel: LeftPanel
  orders: ExtractionOrder[]
  onCollapse: () => void
  onHoverOrder: (id: string | null) => void
  onAddToWorkspace: (orderIds: string[]) => void
  style?: React.CSSProperties
}

function PanelShell({ title, onCollapse, children, style }: { title: string; onCollapse: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#171717",
        borderRadius: 4,
        overflow: "hidden",
        fontFamily: "Geist, sans-serif",
        zIndex: 5,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 0", height: 44, boxSizing: "border-box", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, lineHeight: "28px", color: "#FFFFFF" }}>{title}</h2>
        <button
          type="button"
          aria-label="Collapse panel"
          onClick={onCollapse}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#282828" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 4, backgroundColor: "transparent", cursor: "pointer" }}
        >
          <PanelLeft size={16} color="#E5E5E5" />
        </button>
      </div>
      {children}
    </section>
  )
}

function EmptyBody({ icon: Icon, text }: { icon: typeof Truck; text: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "#1F1F1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} color="#A3A3A3" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>Nothing here yet</div>
      <div style={{ fontSize: 14, color: "#737373", maxWidth: 320 }}>{text}</div>
    </div>
  )
}

export function LeftPanelView({ panel, orders, onCollapse, onHoverOrder, onAddToWorkspace, style }: LeftPanelViewProps) {
  if (panel === "trucks") {
    return (
      <PanelShell title="Trucks" onCollapse={onCollapse} style={style}>
        <EmptyBody icon={Truck} text="Trucks for the day, with capacity and status, will show here." />
      </PanelShell>
    )
  }
  if (panel === "drivers") {
    return (
      <PanelShell title="Drivers" onCollapse={onCollapse} style={style}>
        <EmptyBody icon={UserCheck} text="Drivers and their shifts will show here." />
      </PanelShell>
    )
  }
  return (
    <PanelShell title="Orders" onCollapse={onCollapse} style={style}>
      <OrdersBody orders={orders} onHoverOrder={onHoverOrder} onAddToWorkspace={onAddToWorkspace} />
    </PanelShell>
  )
}

function OrdersBody({ orders, onHoverOrder, onAddToWorkspace }: { orders: ExtractionOrder[]; onHoverOrder: (id: string | null) => void; onAddToWorkspace: (ids: string[]) => void }) {
  const [view, setView] = useState<OrdersView>("list")
  const [search, setSearch] = useState("")
  const [groupKey, setGroupKey] = useState<GroupKey>("none")
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false)
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => { if (groupRef.current && !groupRef.current.contains(e.target as Node)) setIsGroupMenuOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const query = search.trim().toLowerCase()
  const visible = useMemo(
    () => orders.filter((o) => !query || [o.customerName, o.shipToName, o.shipToAddress, o.city].some((v) => v?.toLowerCase().includes(query))),
    [orders, query]
  )
  useEffect(() => setPage(1), [query, groupKey])

  const groupBy = groupKey === "none" ? undefined : (o: ExtractionOrder) =>
    groupKey === "status" ? (o.routeId ? "Scheduled" : "Unassigned")
    : groupKey === "type" ? TYPE_LABEL[o.orderType ?? "D"]
    : o.customerName

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const tableRows = groupBy ? visible : visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const toggle = (id: string) => setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "16px 12px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "6px 12px", border: "1px solid #333", borderRadius: 4, boxSizing: "border-box", width: 400, maxWidth: "100%" }}>
            <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 16, lineHeight: "24px", color: "#E5E5E5", fontFamily: "inherit" }}
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch("")} style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                <X size={14} color="#737373" />
              </button>
            )}
          </div>
          {/* Group By — table view only */}
          {view === "table" && (
            <div ref={groupRef} style={{ position: "relative" }}>
              <button type="button" aria-label="Group by" title="Group by" onClick={() => setIsGroupMenuOpen((v) => !v)} style={iconButton(groupKey !== "none" || isGroupMenuOpen)}>
                <Layers3 size={16} color="#E5E5E5" />
              </button>
              {isGroupMenuOpen && (
                <div style={{ position: "absolute", top: 40, left: 0, zIndex: 20, width: 180, padding: 4, backgroundColor: "#1A1A1A", border: "1px solid #282828", borderRadius: 6, boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
                  <div style={{ padding: "6px 8px", fontSize: 12, color: "#737373" }}>Group by</div>
                  {GROUP_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setGroupKey(opt.id); setIsGroupMenuOpen(false) }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#282828" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", border: "none", borderRadius: 4, backgroundColor: "transparent", color: "#E5E5E5", fontSize: 14, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}
                    >
                      {opt.label}
                      {groupKey === opt.id && <Check size={14} color="#E5E5E5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" aria-label="Table view" aria-pressed={view === "table"} onClick={() => setView("table")} style={iconButton(view === "table")}>
            <Table2 size={16} color="#E5E5E5" />
          </button>
          <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} style={iconButton(view === "list")}>
            <List size={16} color="#E5E5E5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {view === "list" ? (
          visible.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", fontSize: 14, color: "#737373" }}>No orders match "{search}"</div>
          ) : (
            visible.map((order) => (
              <ListOrderCard key={order.id} order={order} checked={checkedIds.includes(order.id)} onToggleCheck={() => toggle(order.id)} onHoverChange={onHoverOrder} />
            ))
          )
        ) : (
          <>
            <DataTable columns={orderTableColumns()} rows={tableRows} getRowId={(o) => o.id} onRowHover={onHoverOrder} groupBy={groupBy} emptyText={`No orders match "${search}"`} />
            {!groupBy && <DataTablePagination page={page} pageCount={pageCount} onPageChange={setPage} />}
          </>
        )}
      </div>

      {/* Selection footer — only when something is selected (not in Figma; keeps Add to workspace) */}
      {view === "list" && checkedIds.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderTop: "1px solid #282828", flexShrink: 0 }}>
          <span style={{ fontSize: 14, color: "#A3A3A3" }}>{checkedIds.length} selected</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setCheckedIds([])} style={{ height: 36, padding: "0 12px", border: "1px solid #333", borderRadius: 4, background: "transparent", color: "#E5E5E5", fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onAddToWorkspace(checkedIds); setCheckedIds([]) }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#3D45E8" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4D55F8" }}
              style={{ height: 36, padding: "0 16px", border: "none", borderRadius: 4, backgroundColor: "#4D55F8", color: "#FAFAFA", fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}
            >
              Add {checkedIds.length} to workspace
            </button>
          </div>
        </div>
      )}
    </>
  )
}
