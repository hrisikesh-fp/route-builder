"use client"

import { useMemo, useState } from "react"
import { Caravan, List, ListFilter, Search, Table2, Truck, X } from "lucide-react"
import { OrderIssueLine } from "@/components/list-order-card"
import { FLEET_HUB_GROUPS } from "@/lib/mock-truck-fleet"
import type { WelcomeRow } from "@/components/welcome-checks"

// Same card / table switch as Trucks. Columns follow the Dispatch drivers list:
// who they are, the truck if one is linked, how to reach them, the shift, the hub, the terminals.

interface DriverRow {
  id: string
  name: string
  truck: string | null
  trailer: string | null
  email: string
  phone: string
  schedule: string
  hub: string
  terminals: string
  issue: WelcomeRow | null
}

const TERMINALS: Record<string, string> = {
  "Austin Hub": "Valero Taylor, Flint Hills",
  "Corpus Christi Hub": "Flint Hills Corpus",
}

function driverName(displayLine: string) {
  const parts = displayLine.split(" - ")
  return parts[parts.length - 1]?.trim() || displayLine
}

function emailFor(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")
  return `${slug}@fleet.example`
}

function phoneFor(index: number) {
  return `(512) 555-${String(1400 + index * 17).slice(-4)}`
}

function buildDrivers(rows: WelcomeRow[]): DriverRow[] {
  const checks = rows.filter((r) => r.cat === "Driver")
  const used = new Set<number>()
  const take = (name: string) => {
    const hit = checks.find((r) => !used.has(r.id) && name.toLowerCase().includes(r.name.toLowerCase()))
    if (hit) used.add(hit.id)
    return hit ?? null
  }

  const fromFleet: DriverRow[] = []
  FLEET_HUB_GROUPS.forEach((group) => {
    group.units.forEach((unit) => {
      if (!unit.driver) return
      const name = driverName(unit.driver.displayLine)
      const issue = take(name)
      fromFleet.push({
        id: unit.driver.id,
        name,
        truck: unit.name.split(" - ")[0],
        trailer: unit.trailer?.name ?? null,
        email: emailFor(name),
        phone: phoneFor(fromFleet.length),
        schedule: issue?.det ?? "6:00 AM to 4:00 PM",
        hub: group.hub,
        terminals: TERMINALS[group.hub] ?? "None mapped",
        issue,
      })
    })
  })

  checks.filter((r) => !used.has(r.id)).forEach((issue) => {
    fromFleet.push({
      id: `check-${issue.id}`,
      name: issue.name,
      truck: issue.sub && issue.sub !== "No truck" ? issue.sub : null,
      trailer: null,
      email: emailFor(issue.name),
      phone: phoneFor(fromFleet.length),
      schedule: issue.det,
      hub: "Austin Hub",
      terminals: TERMINALS["Austin Hub"],
      issue,
    })
  })

  return fromFleet
}

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

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase()
}

function DriverCard({ driver, onFix }: { driver: DriverRow; onFix?: (row: WelcomeRow) => void }) {
  const assets = [
    driver.truck ? { key: "truck", icon: Truck, label: driver.truck } : null,
    driver.trailer ? { key: "trailer", icon: Caravan, label: driver.trailer } : null,
  ].filter((item): item is { key: string; icon: typeof Truck; label: string } => item !== null)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, borderRadius: 4, backgroundColor: "#1F1F1F" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: "50%", backgroundColor: "#8A8A8A", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>
          {initials(driver.name)}
        </div>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500, lineHeight: "20px", color: "#EAEAEA", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{driver.name}</span>
      </div>
      {assets.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, paddingLeft: 42 }}>
          {assets.map((item, index) => {
            const Icon = item.icon
            return (
              <span key={item.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon size={14} color="#979798" />
                <span style={{ fontSize: 14, lineHeight: "20px", color: "#979798" }}>{item.label}</span>
                {index < assets.length - 1 && <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#404040" }} />}
              </span>
            )
          })}
        </div>
      )}
      <div style={{ paddingLeft: 42, fontSize: 13, lineHeight: "18px", color: "#A3A3A3" }}>
        {driver.email} · {driver.phone}
      </div>
      <div style={{ paddingLeft: 42, fontSize: 13, lineHeight: "18px", color: "#737373" }}>
        {driver.schedule} · {driver.hub} · {driver.terminals}
      </div>
      {driver.issue && <div style={{ paddingLeft: 42 }}><OrderIssueLine issue={driver.issue} onFix={onFix} /></div>}
    </div>
  )
}

const cell: React.CSSProperties = {
  padding: "10px 12px",
  borderTop: "1px solid #282828",
  fontSize: 14,
  lineHeight: "20px",
  color: "#E5E5E5",
  whiteSpace: "nowrap",
  textAlign: "left",
  verticalAlign: "middle",
}

export function DriversBody({ welcomeRows = [], onWelcomeFix, preferredView = "list" }: { welcomeRows?: WelcomeRow[]; onWelcomeFix?: (row: WelcomeRow) => void; preferredView?: "list" | "table" }) {
  const [view, setView] = useState<"list" | "table">(preferredView)
  const [search, setSearch] = useState("")
  const drivers = useMemo(() => buildDrivers(welcomeRows), [welcomeRows])
  const query = search.trim().toLowerCase()
  const visible = drivers.filter((d) => !query || [d.name, d.truck, d.email, d.phone, d.hub, d.schedule].some((v) => v?.toLowerCase().includes(query)))

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
        {false && (
          <button type="button" title="Filters are not wired yet" style={{ height: 36, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", border: "1px solid transparent", borderRadius: 4, background: "transparent", color: "#E5E5E5", fontSize: 16, fontFamily: "inherit", cursor: "default" }}>
            <ListFilter size={16} color="#E5E5E5" />
            Filters
          </button>
        )}
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
        {view === "list" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", fontSize: 14, color: "#737373" }}>No drivers match "{search}"</div>
            ) : (
              visible.map((driver) => <DriverCard key={driver.id} driver={driver} onFix={onWelcomeFix} />)
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid #282828", borderRadius: 4 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 980 }}>
              <thead>
                <tr>
                  {["Driver", "Truck", "Phone", "Schedule", "Hub", "Terminals", "What's wrong"].map((label) => (
                    <th key={label} style={{ ...cell, borderTop: "none", background: "#282828", color: "#A3A3A3", fontWeight: 500 }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...cell, textAlign: "center", color: "#737373" }}>No drivers match "{search}"</td></tr>
                ) : visible.map((driver) => (
                  <tr key={driver.id}>
                    <td style={cell}>
                      <div style={{ fontWeight: 500 }}>{driver.name}</div>
                      <div style={{ fontSize: 13, lineHeight: "18px", color: "#A3A3A3" }}>{driver.email}</div>
                    </td>
                    <td style={cell}>{[driver.truck, driver.trailer].filter(Boolean).join(" · ") || "—"}</td>
                    <td style={cell}>{driver.phone}</td>
                    <td style={cell}>{driver.schedule}</td>
                    <td style={cell}>{driver.hub}</td>
                    <td style={cell}>{driver.terminals}</td>
                    <td style={cell}>{driver.issue ? <OrderIssueLine issue={driver.issue} onFix={onWelcomeFix} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
