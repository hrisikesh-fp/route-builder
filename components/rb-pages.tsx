"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes } from "@/lib/mock-data"
import type { ListRoute } from "@/components/list-route-card"
import { PagePanel } from "@/components/page-panel"
import { CellText, DataTable, DataTablePagination, DataTableToolbar, StatusBadge, type DataTableColumn } from "@/components/data-table"

// Non-Map pages for the rail: Orders, Routes (table + map), empty pages, Analytics & reporting.

const PAGE_SIZE = 10
const ORDER_TYPE_LABEL: Record<string, string> = { D: "Delivery", L: "Load", T: "Transfer" }

function usePaged<T>(rows: T[]) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  return { pageRows: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), page: current, pageCount, setPage }
}

const routeLabel = (routeId?: string) => {
  const route = mockRoutes.find((r: any) => r.id === routeId)
  return route ? route.truckId ?? route.driverName : routeId
}

// ─── Orders ─────────────────────────────────────────────────────────────────

interface TablePageProps {
  topOffset: number
  isMapOpen: boolean
  onToggleMap: () => void
}

/** Orders table columns (Figma Orders page) — shared by the 3D Orders panel table view */
export function orderTableColumns(): DataTableColumn<ExtractionOrder>[] {
  return [
    { key: "stop", label: "Stop (ShipTo/Terminal)", width: "minmax(0, 1.3fr)", render: (o) => <CellText>{o.shipToName ?? o.customerName}</CellText> },
    { key: "customer", label: "Customer", render: (o) => <CellText>{o.orderType === "L" ? "NA" : o.customerName}</CellText> },
    { key: "qty", label: "Planned Qty", render: (o) => <CellText>{o.volume.toLocaleString()} gal</CellText> },
    { key: "type", label: "Order Type", render: (o) => <CellText>{ORDER_TYPE_LABEL[o.orderType ?? "D"]}</CellText> },
    {
      key: "status",
      label: "Status",
      render: (o) =>
        o.routeId ? (
          <>
            <StatusBadge label="Scheduled" tone="grey" />
            <CellText muted>Route: {routeLabel(o.routeId)}</CellText>
          </>
        ) : (
          <StatusBadge label="Unassigned" tone="orange" />
        ),
    },
  ]
}

export function OrdersPage({ orders, onHoverOrder, ...shell }: TablePageProps & { orders: ExtractionOrder[]; onHoverOrder: (id: string | null) => void }) {
  const [tab, setTab] = useState("all")
  const rows = tab === "all" ? orders : []
  const { pageRows, page, pageCount, setPage } = usePaged(rows)

  const columns: DataTableColumn<ExtractionOrder>[] = [
    { key: "stop", label: "Stop (ShipTo/Terminal)", width: "minmax(0, 1.3fr)", render: (o) => <CellText>{o.shipToName ?? o.customerName}</CellText> },
    { key: "customer", label: "Customer", render: (o) => <CellText>{o.orderType === "L" ? "NA" : o.customerName}</CellText> },
    { key: "qty", label: "Planned Qty", render: (o) => <CellText>{o.volume.toLocaleString()} gal</CellText> },
    { key: "type", label: "Order Type", render: (o) => <CellText>{ORDER_TYPE_LABEL[o.orderType ?? "D"]}</CellText> },
    {
      key: "status",
      label: "Status",
      render: (o) =>
        o.routeId ? (
          <>
            <StatusBadge label="Scheduled" tone="grey" />
            <CellText muted>Route: {routeLabel(o.routeId)}</CellText>
          </>
        ) : (
          <StatusBadge label="Unassigned" tone="orange" />
        ),
    },
  ]

  return (
    <PagePanel
      title="Orders"
      {...shell}
      showMapToggle
      tabs={[{ id: "all", label: "All Orders" }, { id: "forecasted", label: "Forecasted" }]}
      activeTab={tab}
      onTabChange={(id) => { setTab(id); setPage(1) }}
    >
      <DataTableToolbar />
      <DataTable columns={columns} rows={pageRows} getRowId={(o) => o.id} onRowHover={onHoverOrder} emptyText="No forecasted orders for this date" />
      <DataTablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </PagePanel>
  )
}

// ─── Routes ─────────────────────────────────────────────────────────────────

interface RouteRow extends ListRoute {
  stops: ExtractionOrder[]
}

export function RoutesPage({ routes, orders, onHoverRoute, ...shell }: TablePageProps & { routes: ListRoute[]; orders: ExtractionOrder[]; onHoverRoute: (id: string | null) => void }) {
  const [tab, setTab] = useState("all")
  const all: RouteRow[] = routes.map((r) => ({ ...r, stops: orders.filter((o) => o.routeId === r.id) }))
  const rows = all.filter((r) => tab === "all" || (tab === "published" ? r.isPublished : !r.isPublished))
  const { pageRows, page, pageCount, setPage } = usePaged(rows)

  const columns: DataTableColumn<RouteRow>[] = [
    {
      key: "route",
      label: "Route",
      width: "minmax(0, 1.2fr)",
      render: (r) => (
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.color, flexShrink: 0 }} />
          <CellText>{r.truckId ?? "No truck"}</CellText>
        </span>
      ),
    },
    { key: "driver", label: "Driver", render: (r) => <CellText>{r.driverName}</CellText> },
    { key: "stops", label: "Stops", render: (r) => <CellText>{r.stops.length}</CellText> },
    {
      key: "qty",
      label: "Planned Qty",
      render: (r) => <CellText>{r.stops.filter((s) => s.orderType !== "L").reduce((n, s) => n + s.volume, 0).toLocaleString()} gal</CellText>,
    },
    { key: "status", label: "Status", render: (r) => <StatusBadge label={r.isPublished ? "Published" : "Draft"} tone={r.isPublished ? "green" : "grey"} /> },
  ]

  return (
    <PagePanel
      title="Routes"
      {...shell}
      showMapToggle
      tabs={[{ id: "all", label: "All Routes" }, { id: "published", label: "Published" }, { id: "draft", label: "Draft" }]}
      activeTab={tab}
      onTabChange={(id) => { setTab(id); setPage(1) }}
    >
      <DataTableToolbar />
      <DataTable columns={columns} rows={pageRows} getRowId={(r) => r.id} onRowHover={onHoverRoute} emptyText="No routes" />
      <DataTablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </PagePanel>
  )
}

// ─── Empty pages (Trucks, Drivers, Inbox, Run history) ──────────────────────

export function EmptyPage({ title, icon: Icon, description, topOffset }: { title: string; icon: LucideIcon; description: string; topOffset: number }) {
  return (
    <PagePanel title={title} topOffset={topOffset}>
      <div style={{ height: "100%", minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "#1F1F1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color="#A3A3A3" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>Nothing here yet</div>
        <div style={{ fontSize: 14, color: "#737373", maxWidth: 360 }}>{description}</div>
      </div>
    </PagePanel>
  )
}

// ─── Analytics & reporting ──────────────────────────────────────────────────

interface Metric {
  id: string
  label: string
  definition: string
  plan: number
  actual: number
  decimals?: number
}

// Mock plan vs actual for the selected date (same measures as the routing comparison view)
const METRICS: Metric[] = [
  { id: "trucks", label: "Trucks used", definition: "Trucks with at least one stop", plan: 4, actual: 4 },
  { id: "stops", label: "Stops served", definition: "Stops delivered on a route", plan: 44, actual: 44 },
  { id: "unassigned", label: "Unassigned", definition: "Orders left off every route", plan: 0, actual: 0 },
  { id: "distance", label: "Distance (km)", definition: "Total driven distance", plan: 886.9, actual: 948.6, decimals: 1 },
  { id: "driving", label: "Driving time (h)", definition: "Total time behind the wheel", plan: 15.76, actual: 15.93, decimals: 2 },
  { id: "gph", label: "Gallons per hour", definition: "Gallons delivered per driving hour", plan: 547.9, actual: 545.1, decimals: 1 },
  { id: "mpg", label: "Miles per 1,000 gal", definition: "Distance driven per 1,000 gallons", plan: 30.3, actual: 32.4, decimals: 1 },
  { id: "breach", label: "Findings: breach", definition: "Hard rule broken", plan: 13, actual: 5 },
  { id: "defect", label: "Findings: defect", definition: "Plan error", plan: 0, actual: 0 },
  { id: "warn", label: "Findings: warn", definition: "Worth a look", plan: 0, actual: 0 },
  { id: "info", label: "Findings: info", definition: "For information", plan: 1, actual: 1 },
]

export function AnalyticsTable() {
  const fmt = (n: number, d = 0) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
  const columns: DataTableColumn<Metric>[] = [
    {
      key: "number",
      label: "Number",
      width: "minmax(0, 2fr)",
      render: (m) => (
        <>
          <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#E5E5E5" }}>{m.label}</span>
          <span style={{ fontSize: 12, lineHeight: "16px", color: "#737373" }}>{m.definition}</span>
        </>
      ),
    },
    { key: "plan", label: "Plan", render: (m) => <CellText>{fmt(m.plan, m.decimals)}</CellText> },
    { key: "actual", label: "Actual", render: (m) => <CellText>{fmt(m.actual, m.decimals)}</CellText> },
  ]
  return <DataTable columns={columns} rows={METRICS} getRowId={(m) => m.id} />
}

export function AnalyticsPage({ topOffset }: { topOffset: number }) {
  const fmt = (n: number, d = 0) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
  const columns: DataTableColumn<Metric>[] = [
    {
      key: "number",
      label: "Number",
      width: "minmax(0, 2fr)",
      render: (m) => (
        <>
          <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#E5E5E5" }}>{m.label}</span>
          <span style={{ fontSize: 12, lineHeight: "16px", color: "#737373" }}>{m.definition}</span>
        </>
      ),
    },
    { key: "plan", label: "Plan", render: (m) => <CellText>{fmt(m.plan, m.decimals)}</CellText> },
    { key: "actual", label: "Actual", render: (m) => <CellText>{fmt(m.actual, m.decimals)}</CellText> },
  ]
  return (
    <PagePanel title="Analytics & reporting" topOffset={topOffset}>
      <div style={{ maxWidth: 960 }}>
        <DataTable columns={columns} rows={METRICS} getRowId={(m) => m.id} />
      </div>
    </PagePanel>
  )
}
