"use client"

import { useMemo, useState } from "react"
import { Caravan, List, ListFilter, Search, Table2, Truck, UserCheck, X } from "lucide-react"
import { DataTable } from "@/components/data-table"
import { FLEET_HUB_GROUPS, type FleetUnit } from "@/lib/mock-truck-fleet"

// Same unit as Create Routes: truck, trailer, driver, products.
// Status (Available / In-plan / Published) is not drawn yet. The ids are still
// passed in so that badge can be designed without changing the data hook.

const UNITS: FleetUnit[] = FLEET_HUB_GROUPS.flatMap((g) => g.units)

const iconButton = (active: boolean): React.CSSProperties => ({
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #333",
  borderRadius: 4,
  backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
  cursor: "pointer",
})

function TypeBadge({ label }: { label: string }) {
  return (
    <span style={{ flexShrink: 0, fontSize: 12, lineHeight: "16px", color: "#FAFAFA", backgroundColor: "#333", borderRadius: 4, padding: "2px 6px" }}>{label}</span>
  )
}

function productLabel(names: string[]) {
  const n = names.length
  return `${n} Product${n === 1 ? "" : "s"}`
}

function FleetCard({ unit }: { unit: FleetUnit }) {
  const capacity = unit.trailer?.capacity || unit.capacity || "0 gal"
  const compartments = unit.trailer?.compartments || unit.compartments || "0 Compartments"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12, borderRadius: 4, backgroundColor: "#1F1F1F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Truck size={20} color="#A3A3A3" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 16, lineHeight: "24px", color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{unit.name}</span>
        <TypeBadge label={unit.badge} />
      </div>
      {unit.trailer && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <Caravan size={20} color="#A3A3A3" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 16, lineHeight: "24px", color: "#E5E5E5" }}>{unit.trailer.name}</span>
            <span style={{ fontSize: 13, lineHeight: "18px", color: "#A3A3A3" }}>
              {capacity} · {compartments} · {productLabel(unit.productNames)}
            </span>
          </div>
          <TypeBadge label="Trailer" />
        </div>
      )}
      {!unit.trailer && (
        <span style={{ fontSize: 13, lineHeight: "18px", color: "#A3A3A3", paddingLeft: 32 }}>
          {capacity} · {compartments} · {productLabel(unit.productNames)}
        </span>
      )}
      {unit.driver ? (
        <>
          <div style={{ height: 1, backgroundColor: "#282828" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <UserCheck size={16} color="#A3A3A3" />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#A3A3A3" }}>{unit.driver.displayLine}</span>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function TrucksBody({ inPlanTruckIds = [], publishedTruckIds = [], preferredView = "list" }: { inPlanTruckIds?: string[]; publishedTruckIds?: string[]; preferredView?: "list" | "table" }) {
  // Status badge is not drawn. These stay so the design can use which trucks are in a plan or published.
  void inPlanTruckIds
  void publishedTruckIds
  const [view, setView] = useState<"list" | "table">(preferredView)
  const [search, setSearch] = useState("")
  const [filtersHover, setFiltersHover] = useState(false)
  const query = search.trim().toLowerCase()
  const visible = useMemo(
    () => UNITS.filter((u) => !query || [u.name, u.badge, u.trailer?.name, u.driver?.displayLine, ...u.productNames].some((v) => v?.toLowerCase().includes(query))),
    [query]
  )

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 12px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "6px 12px", border: "1px solid #333", borderRadius: 4, flex: 1, minWidth: 0, maxWidth: 400 }}>
          <Search size={16} color="#737373" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: 16, color: "#E5E5E5", fontFamily: "inherit" }}
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch("")} style={{ display: "flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <X size={14} color="#737373" />
            </button>
          )}
        </div>
        {/* Filters come back as soon as they are ready. */}
        {false && <button
          type="button"
          title="Filters are not wired yet"
          onMouseEnter={() => setFiltersHover(true)}
          onMouseLeave={() => setFiltersHover(false)}
          style={{
            height: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            border: "1px solid transparent",
            borderRadius: 4,
            backgroundColor: filtersHover ? "#333" : "transparent",
            color: "#E5E5E5",
            fontSize: 16,
            fontWeight: 400,
            lineHeight: "24px",
            fontFamily: "inherit",
            cursor: "default",
            flexShrink: 0,
          }}
        >
          <ListFilter size={16} color="#E5E5E5" />
          Filters
        </button>}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button type="button" aria-label="Table view" aria-pressed={view === "table"} onClick={() => setView("table")} style={iconButton(view === "table")}>
            <Table2 size={16} color="#E5E5E5" />
          </button>
          <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} style={iconButton(view === "list")}>
            <List size={16} color="#E5E5E5" />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 12px 12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {view === "list" ? (
          visible.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", fontSize: 14, color: "#737373" }}>No trucks match "{search}"</div>
          ) : (
            visible.map((unit) => <FleetCard key={unit.id} unit={unit} />)
          )
        ) : (
          <DataTable
            columns={[
              { key: "name", label: "Truck", render: (u: FleetUnit) => u.name },
              { key: "trailer", label: "Trailer", width: "140px", render: (u: FleetUnit) => u.trailer?.name ?? "—" },
              { key: "driver", label: "Driver", width: "180px", render: (u: FleetUnit) => u.driver?.displayLine ?? "—" },
              { key: "products", label: "Products", width: "160px", render: (u: FleetUnit) => u.productNames.join(", ") || "—" },
              { key: "capacity", label: "Capacity", width: "110px", render: (u: FleetUnit) => u.trailer?.capacity || u.capacity || "0 gal" },
            ]}
            rows={visible}
            getRowId={(u) => u.id}
            emptyText={`No trucks match "${search}"`}
          />
        )}
        </div>
      </div>
    </div>
  )
}
