"use client"

import { useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { X, Truck, Caravan, UserCheck, Search, Filter, ArrowUpDown, Check as CheckIcon, Minus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import type { ExtractionOrder } from "@/lib/mock-data"
import { ALL_HUBS, ALL_HUBS_LABEL, FLEET_HUB_GROUPS, type FleetUnit } from "@/lib/mock-truck-fleet"
import { ObjectiveComparisonModal } from "@/components/objective-comparison-modal"

// ─── Feature flags ──────────────────────────────────────────────────────────
// Flip these back to `true` to restore features that were pulled per the Figma
// node 6625:29435 pass (dated 2026-09-02). State + logic for all of them is kept
// intact below — only the JSX render is gated — so restoring is a one-line flip.
const SHOW_HUB_TABS = false
const SHOW_SORT = false
const SHOW_PLANNED_TIME_COLUMN = false

// Generate a stable mock time for each order based on its index
const MOCK_TIMES = [
  "12:32 PM", "1:15 PM", "2:45 PM", "3:30 PM", "3:30 PM",
  "4:00 PM", "4:15 PM", "8:30 AM", "9:00 AM", "9:45 AM",
  "10:15 AM", "10:45 AM", "11:00 AM", "11:30 AM", "12:00 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
]

// Highlight style — warm yellow/peach tint on dark bg
const HIGHLIGHT_BG = "rgba(217, 175, 96, 0.35)"

// ─── Types ───────────────────────────────────────────────────────────────────
interface CreateRoutesModalV2Props {
  isOpen: boolean
  onClose: () => void
  checkedRouteIds: string[]
  checkedUnassignedOrderIds?: string[]
  selectedOrders: ExtractionOrder[]
  // Passes back the actual selected FleetUnit objects (truck + trailer + driver mapping intact)
  // so the caller can build a real route per unit — not just a count.
  onComplete?: (selectedUnits: FleetUnit[], orderCount: number) => void
}

type ProductTooltipState = { x: number; y: number; products: string[] } | null

// ─── Highlight helper ────────────────────────────────────────────────────────
function highlightText(text: string, query: string): ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + query.length)
  const after = text.slice(idx + query.length)
  return (
    <>
      {before}
      <span style={{ backgroundColor: HIGHLIGHT_BG, borderRadius: 2, padding: "0 1px" }}>{match}</span>
      {after}
    </>
  )
}

// ─── Meta-line formatting helpers ───────────────────────────────────────────
// Zero-value fallback: render "0 gal" / "0 Compartments" literally instead of
// hiding the segment, per the reference screenshot of a unit with no defined
// capacity of its own.
const formatCapacity = (capacity: string) => capacity || "0 gal"
const formatCompartments = (compartments: string) => compartments || "0 Compartments"

// ─── Shared components ───────────────────────────────────────────────────────
const SpecsDot = () => <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#4A4A4A", flexShrink: 0, margin: "0 6px" }} />
const TypeBadge = ({ label }: { label: string }) => (
  <span style={{ fontSize: 12, fontWeight: 500, color: "#E5E5E5", backgroundColor: "#333", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>
    {label}
  </span>
)

// ─── Main Component ─────────────────────────────────────────────────────────
export function CreateRoutesModalV2({ isOpen, onClose, checkedRouteIds, checkedUnassignedOrderIds = [], selectedOrders, onComplete }: CreateRoutesModalV2Props) {
  const [screen, setScreen] = useState<"main" | "loading" | "objectives">("main")
  const [mode, setMode] = useState<"auto" | "manual">("auto")
  const [driverMappingEnabled, setDriverMappingEnabled] = useState(true)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [unitSearch, setUnitSearch] = useState("")
  const [activeHub, setActiveHub] = useState(ALL_HUBS_LABEL)
  const [loadingPhase, setLoadingPhase] = useState("")
  const [canCancel, setCanCancel] = useState(true)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [sortField, setSortField] = useState<"capacity" | "name">("capacity")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [productTooltip, setProductTooltip] = useState<ProductTooltipState>(null)
  const [pendingUnits, setPendingUnits] = useState<FleetUnit[]>([])

  if (!isOpen) return null

  const handleClose = () => {
    setScreen("main")
    setMode("auto")
    setSelectedUnitIds([])
    setUnitSearch("")
    setActiveHub(ALL_HUBS_LABEL)
    setCanCancel(true)
    setIsSortOpen(false)
    setSortField("capacity")
    setSortDir("asc")
    setProductTooltip(null)
    setPendingUnits([])
    onClose()
  }

  // Orders for the left panel — all orders belonging to checked routes + checked unassigned orders
  const orderRows = selectedOrders
    .filter(o =>
      checkedRouteIds.includes(o.routeId ?? "") ||
      (!o.routeId && checkedUnassignedOrderIds.includes(o.id))
    )
    .sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

  // Full flat unit list, regardless of hub/search filter — used to resolve selectedUnitIds
  // back to FleetUnit objects when the modal completes, since the filtered view may not
  // include every unit that was selected before the filter changed.
  const allUnits = FLEET_HUB_GROUPS.flatMap(g => g.units)

  // Search: match against name, badge, or product names
  const q = unitSearch.trim().toLowerCase()
  const getFilteredUnits = () => {
    const groups = activeHub === ALL_HUBS_LABEL ? FLEET_HUB_GROUPS : FLEET_HUB_GROUPS.filter(g => g.hub === activeHub)
    const all = groups.flatMap(g => g.units)
    if (!q) return all
    return all.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.badge.toLowerCase().includes(q) ||
      u.productNames.some(p => p.toLowerCase().includes(q))
    )
  }
  const filteredUnits = (() => {
    const units = getFilteredUnits()
    if (!SHOW_SORT) return units
    const sorted = [...units].sort((a, b) => {
      if (sortField === "capacity") {
        const capA = parseInt(a.capacity.replace(/[^0-9]/g, "")) || 0
        const capB = parseInt(b.capacity.replace(/[^0-9]/g, "")) || 0
        return sortDir === "asc" ? capA - capB : capB - capA
      }
      const cmp = a.name.localeCompare(b.name)
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
  })()

  const visibleSelectedCount = filteredUnits.filter(u => selectedUnitIds.includes(u.id)).length
  const allVisibleSelected = filteredUnits.length > 0 && visibleSelectedCount === filteredUnits.length
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredUnits.map(u => u.id))
      setSelectedUnitIds(prev => prev.filter(id => !visibleIds.has(id)))
    } else {
      setSelectedUnitIds(prev => Array.from(new Set([...prev, ...filteredUnits.map(u => u.id)])))
    }
  }

  // Build the products/meta segment for whichever tier is showing capacity data.
  // n === 0 → "0 Products" (plain). n === 1 → "1 Product" (plain, nothing to disambiguate).
  // n >= 2 → "{n} Product Categories", underlined + hoverable to reveal the product list —
  // matches the Figma reference for both the trailer tier and standalone truck rows.
  const renderProductsMeta = (productNames: string[]) => {
    const n = productNames.length
    if (n <= 1) {
      return (
        <>
          <SpecsDot />
          <span style={{ fontSize: 13, color: "#A3A3A3" }}>{n} Product{n === 1 ? "" : "s"}</span>
        </>
      )
    }
    return (
      <>
        <SpecsDot />
        <span
          style={{
            fontSize: 13, color: "#A3A3A3", textDecoration: "underline dotted", textUnderlineOffset: 3, cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setProductTooltip({ x: rect.left + rect.width / 2, y: rect.bottom, products: productNames })
          }}
          onMouseLeave={() => setProductTooltip(null)}
        >
          {n} Product Categories
        </span>
      </>
    )
  }

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds(prev => prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId])
  }

  const handleOptimise = () => {
    setScreen("loading")
    setLoadingPhase("Evaluating orders across truck selection...")
    setCanCancel(true)

    const phases = [
      { delay: 2500, text: "Evaluating orders across truck selection...", canCancel: true },
      { delay: 2200, text: "Applying compartment constraints...", canCancel: true },
      { delay: 2000, text: "Checking product compatibility...", canCancel: true },
      { delay: 2500, text: "Optimising stop sequences...", canCancel: false },
      { delay: 1800, text: "Solving for each objective...", canCancel: false },
      { delay: 1300, text: "Scoring the results...", canCancel: false },
    ]

    let i = 0
    const runPhase = () => {
      if (i >= phases.length) {
        setTimeout(() => {
          setPendingUnits(allUnits.filter(u => selectedUnitIds.includes(u.id)))
          setScreen("objectives")
          setCanCancel(true)
        }, 800)
        return
      }
      const phase = phases[i]
      setLoadingPhase(phase.text)
      setCanCancel(phase.canCancel)
      i++
      setTimeout(runPhase, phase.delay)
    }
    runPhase()
  }

  if (screen === "objectives") {
    return (
      <ObjectiveComparisonModal
        isOpen
        onClose={handleClose}
        onContinue={() => {
          onComplete?.(pendingUnits, orderRows.length)
          handleClose()
        }}
      />
    )
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        fontFamily: "Geist, sans-serif",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: screen === "loading" ? 480 : 1040,
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)",
          transition: "width 200ms ease",
          height: screen === "loading" ? "auto" : "min(720px, calc(100vh - 80px))",
          maxHeight: "min(720px, calc(100vh - 80px))",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MAIN SCREEN ── */}
        {screen === "main" && (
          <>
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
                  Create Routes
                </span>
                {/* Divider + Auto/Manual toggle — matches merge-modal.tsx */}
                <div style={{ width: 1, height: 20, backgroundColor: "#333", flexShrink: 0 }} />
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  height: 28, padding: 2, borderRadius: 4,
                  backgroundColor: "#1B1B1B", border: "1px solid #282828",
                  boxSizing: "border-box" as const,
                }}>
                  {(["auto", "manual"] as const).map(m => {
                    const isActive = mode === m
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                          padding: "0 16px", fontSize: 14, lineHeight: "20px",
                          height: "100%",
                          fontWeight: isActive ? 500 : 400,
                          color: isActive ? "#E5E5E5" : "#A3A3A3",
                          backgroundColor: isActive ? "#282828" : "transparent",
                          border: isActive ? "1px solid #333" : "1px solid transparent",
                          borderRadius: 2, cursor: "pointer",
                          fontFamily: "Geist, sans-serif",
                          boxShadow: isActive ? "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)" : "none",
                          transition: "background-color 150ms, color 150ms",
                        }}
                      >
                        {m === "auto" ? "Auto" : "Manual"}
                      </button>
                    )
                  })}
                </div>
                <div style={{ flex: 1 }} />
                {/* Demo-only toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#A3A3A3" }}>Driver-to-truck mapping</span>
                  <Switch
                    checked={driverMappingEnabled}
                    onCheckedChange={setDriverMappingEnabled}
                    className="data-[state=checked]:bg-[#6366F1] data-[state=unchecked]:bg-[#404040]"
                  />
                </div>
                <button onClick={handleClose} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#E5E5E5", padding: 0 }}>
                  <X size={24} strokeWidth={2} />
                </button>
              </div>
              <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>
                {mode === "auto"
                  ? "Select atleast one truck to create optimised routes automatically."
                  : "Select atleast one truck or a driver to create route manually."}
              </span>
            </div>

            {/* Two-panel layout */}
            <div style={{ display: "flex", gap: 32, flex: 1, minHeight: 0, overflow: "hidden" }}>
              {/* ─── Left: Orders table ─── */}
              <div style={{ flex: "0 0 480px", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px", marginBottom: 12, flexShrink: 0 }}>Orders ({orderRows.length})</span>

                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #333", borderRadius: 4 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: SHOW_PLANNED_TIME_COLUMN ? "34%" : "40%" }} />
                      <col style={{ width: SHOW_PLANNED_TIME_COLUMN ? "22%" : "30%" }} />
                      {SHOW_PLANNED_TIME_COLUMN && <col style={{ width: "22%" }} />}
                      <col style={{ width: SHOW_PLANNED_TIME_COLUMN ? "22%" : "30%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ backgroundColor: "#282828", borderBottom: "1px solid #333" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Stops</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Planned Qty</th>
                        {SHOW_PLANNED_TIME_COLUMN && (
                          <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Planned Time</th>
                        )}
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Order Type</th>
                      </tr>
                    </thead>
                  </table>

                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: SHOW_PLANNED_TIME_COLUMN ? "34%" : "40%" }} />
                        <col style={{ width: SHOW_PLANNED_TIME_COLUMN ? "22%" : "30%" }} />
                        {SHOW_PLANNED_TIME_COLUMN && <col style={{ width: "22%" }} />}
                        <col style={{ width: SHOW_PLANNED_TIME_COLUMN ? "22%" : "30%" }} />
                      </colgroup>
                      <tbody>
                        {orderRows.map((o, i) => (
                          <tr key={o.id} style={{ borderBottom: i < orderRows.length - 1 ? "1px solid #282828" : "none" }}>
                            <td style={{ padding: "12px", verticalAlign: "middle" }}>
                              <div style={{ fontSize: 14, color: "#E5E5E5", lineHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {o.orderType === "L" ? (o.shipToAddress?.split(",")[0] || "Terminal") : (o.shipToAddress?.split(",")[0] || o.customerName)}
                              </div>
                              <div style={{ fontSize: 13, color: "#737373", lineHeight: "18px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {o.customerName}
                              </div>
                            </td>
                            <td style={{ padding: "12px", verticalAlign: "middle" }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                                {o.volume ? `${o.volume.toLocaleString()} gal` : "—"}
                              </span>
                            </td>
                            {SHOW_PLANNED_TIME_COLUMN && (
                              <td style={{ padding: "12px", verticalAlign: "middle" }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                                  {MOCK_TIMES[i % MOCK_TIMES.length]}
                                </span>
                              </td>
                            )}
                            <td style={{ padding: "12px", verticalAlign: "middle" }}>
                              <span style={{ fontSize: 14, color: "#E5E5E5" }}>
                                {o.orderType === "L" ? "Load" : o.orderType === "T" ? "Transfer" : "Delivery"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orderRows.length === 0 && (
                          <tr>
                            <td colSpan={SHOW_PLANNED_TIME_COLUMN ? 4 : 3} style={{ padding: "40px 20px", color: "#737373", fontSize: 14, textAlign: "center" }}>
                              No orders in selected routes
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ─── Right panel: Auto (Truck & Trailer) or Manual ─── */}
              {mode === "auto" ? (
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
                <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3", lineHeight: "24px", flexShrink: 0 }}>Truck (& Trailer)</span>

                {/* Hub tabs */}
                {SHOW_HUB_TABS && (
                  <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #282828", flexShrink: 0, overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap", scrollbarWidth: "none" }}>
                    {ALL_HUBS.map(hub => (
                      <button
                        key={hub}
                        onClick={() => setActiveHub(hub)}
                        style={{
                          padding: "10px 12px", fontSize: 16, fontWeight: activeHub === hub ? 500 : 400,
                          color: activeHub === hub ? "#FFFFFF" : "#A3A3A3",
                          background: "none", border: "none", cursor: "pointer",
                          borderBottom: activeHub === hub ? "1px solid #FFFFFF" : "1px solid transparent",
                          fontFamily: "Geist, sans-serif",
                          transition: "color 150ms",
                          whiteSpace: "nowrap", flexShrink: 0,
                        }}
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0, overflow: "hidden" }}>
                  {/* Search + Filter (+ Sort, hidden) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 36, padding: "8px 12px", border: "1px solid #333", borderRadius: 4, boxSizing: "border-box" }}>
                      <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                      <input
                        value={unitSearch}
                        onChange={(e) => setUnitSearch(e.target.value)}
                        placeholder="Search Trucks"
                        style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 16, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }}
                      />
                    </div>
                    {/* Filter — visual stub, no logic yet */}
                    <button
                      style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", height: 36, boxSizing: "border-box",
                        border: "1px solid #333", borderRadius: 4, background: "none",
                        cursor: "default", color: "#A3A3A3", fontSize: 14, fontWeight: 500, fontFamily: "Geist, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Filter size={16} color="#A3A3A3" />
                      <span>Filter</span>
                    </button>
                    {SHOW_SORT && (
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <button
                          onClick={() => setIsSortOpen(!isSortOpen)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", height: 40,
                            border: isSortOpen ? "1px solid #737373" : "1px solid #333", borderRadius: 4, background: "none",
                            cursor: "pointer", color: "#A3A3A3", fontSize: 14, fontWeight: 500, fontFamily: "Geist, sans-serif",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <ArrowUpDown size={16} color="#A3A3A3" />
                          <span>Sort</span>
                        </button>
                        {isSortOpen && (
                          <>
                            <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setIsSortOpen(false)} />
                            <div style={{
                              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 999,
                              width: 180, backgroundColor: "#1A1A1A", border: "1px solid #333", borderRadius: 4,
                              boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)",
                              padding: "8px 0", fontFamily: "Geist, sans-serif",
                            }}>
                              <div style={{ padding: "0 12px 6px", fontSize: 12, fontWeight: 500, color: "#737373", lineHeight: "16px" }}>Sort by</div>
                              {(["capacity", "name"] as const).map(field => (
                                <div
                                  key={field}
                                  onClick={() => { setSortField(field); setSortDir("asc") }}
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", cursor: "pointer", fontSize: 14, color: "#E5E5E5", lineHeight: "20px" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#282828" }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                                >
                                  <div style={{
                                    width: 14, height: 14, borderRadius: "50%",
                                    border: sortField === field ? "4px solid #E5E5E5" : "1.5px solid #737373",
                                    boxSizing: "border-box", flexShrink: 0,
                                  }} />
                                  {field === "capacity" ? "Truck Capacity" : "Truck Name"}
                                </div>
                              ))}
                              <div style={{ height: 1, backgroundColor: "#333", margin: "6px 0" }} />
                              {(sortField === "capacity"
                                ? [{ dir: "asc" as const, label: "Ascending", icon: "↑" }, { dir: "desc" as const, label: "Descending", icon: "↓" }]
                                : [{ dir: "asc" as const, label: "A-Z", icon: "↑" }, { dir: "desc" as const, label: "Z-A", icon: "↓" }]
                              ).map(opt => (
                                <div
                                  key={opt.dir}
                                  onClick={() => { setSortDir(opt.dir); setIsSortOpen(false) }}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", cursor: "pointer",
                                    fontSize: 14, color: sortDir === opt.dir ? "#E5E5E5" : "#A3A3A3", lineHeight: "20px",
                                    fontWeight: sortDir === opt.dir ? 500 : 400,
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#282828" }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                                >
                                  <span style={{ fontSize: 12, width: 14, textAlign: "center", flexShrink: 0 }}>{opt.icon}</span>
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Select All — three states: unchecked / indeterminate (some selected) / checked (all selected) */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={toggleSelectAll}>
                      <CheckboxPrimitive.Root
                        checked={someVisibleSelected ? "indeterminate" : allVisibleSelected}
                        onCheckedChange={toggleSelectAll}
                        onClick={(e) => e.stopPropagation()}
                        className="size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none data-[state=unchecked]:bg-transparent data-[state=unchecked]:border-[#333] data-[state=checked]:bg-[#E5E5E5] data-[state=checked]:border-[#E5E5E5] data-[state=indeterminate]:bg-[#E5E5E5] data-[state=indeterminate]:border-[#E5E5E5]"
                      >
                        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-[#171717]">
                          {someVisibleSelected ? <Minus className="size-3.5" /> : <CheckIcon className="size-3.5" />}
                        </CheckboxPrimitive.Indicator>
                      </CheckboxPrimitive.Root>
                      <span style={{ fontSize: 16, fontWeight: 300, color: "#E5E5E5" }}>Select All {filteredUnits.length}</span>
                    </div>
                    {visibleSelectedCount > 0 && (
                      <span style={{ fontSize: 14, color: "#A3A3A3" }}>{visibleSelectedCount}/{filteredUnits.length} selected</span>
                    )}
                  </div>

                  {/* Unit list — scrollable */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                    {filteredUnits.map((unit) => {
                      const isSelected = selectedUnitIds.includes(unit.id)
                      const showCombined = driverMappingEnabled && !!unit.trailer

                      const truckMeta = (
                        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                          <span style={{ fontSize: 13, color: "#A3A3A3", flexShrink: 0 }}>{formatCapacity(unit.capacity)}</span>
                          <SpecsDot />
                          <span style={{ fontSize: 13, color: "#A3A3A3", flexShrink: 0 }}>{formatCompartments(unit.compartments)}</span>
                          {renderProductsMeta(unit.productNames)}
                        </div>
                      )

                      return (
                        <div
                          key={unit.id}
                          onClick={() => toggleUnit(unit.id)}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12, padding: 12,
                            cursor: "pointer", borderRadius: 4,
                            backgroundColor: isSelected ? "#282828" : "#1f1f1f",
                            border: isSelected ? "1px solid #737373" : "1px solid transparent",
                            transition: "background-color 100ms, border-color 100ms",
                            boxSizing: "border-box",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#282828" }}
                          onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#1f1f1f" }}
                        >
                          <div style={{ paddingTop: 2 }}>
                            <Checkbox
                              checked={isSelected}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => toggleUnit(unit.id)}
                              className="border-[#737373] data-[state=checked]:bg-[#E5E5E5] data-[state=checked]:border-[#E5E5E5] data-[state=checked]:text-[#171717]"
                            />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                            {showCombined ? (
                              <>
                                {/* Tier 1 — truck name + badge only. No meta line here: today's mock
                                    doesn't model a truck-only capacity separate from the combo's, so
                                    when a trailer is paired, the capacity/compartments/products data
                                    always renders on the trailer tier below instead. Once the backend
                                    sends a truck-level capacity independent of its trailer, add that
                                    field to FleetUnit and render it here too — see mock-truck-fleet.ts. */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                      <Truck size={20} color="#A3A3A3" style={{ flexShrink: 0 }} />
                                      <span style={{ fontSize: 16, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {q && unit.name.toLowerCase().includes(q) ? highlightText(unit.name, unitSearch) : unit.name}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ width: 96, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                                    <TypeBadge label={unit.badge} />
                                  </div>
                                </div>

                                {/* Tier 2 — trailer name + its meta line (capacity/compartments/products) */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                      <Caravan size={20} color="#A3A3A3" style={{ flexShrink: 0 }} />
                                      <span style={{ fontSize: 16, color: "#E5E5E5", whiteSpace: "nowrap" }}>{unit.trailer!.name}</span>
                                    </div>
                                    {truckMeta}
                                  </div>
                                  <div style={{ width: 96, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                                    <TypeBadge label="Trailer" />
                                  </div>
                                </div>

                                {/* Divider + driver line — only when the truck+trailer combo actually
                                    has a driver mapped to it. This is a fixed mapping, not an assignable
                                    field, so there's no "unassigned" state to show here — the row just
                                    ends at the trailer tier when no driver is mapped. */}
                                {unit.driver && (
                                  <>
                                    <div style={{ height: 1, backgroundColor: "#282828", width: "100%" }} />
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <UserCheck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                                      <span style={{ fontSize: 13, color: "#A3A3A3" }}>{unit.driver.displayLine}</span>
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              /* Single tier — no trailer (or driver-mapping demo toggle OFF) */
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                    <Truck size={20} color="#A3A3A3" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 16, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {q && unit.name.toLowerCase().includes(q) ? highlightText(unit.name, unitSearch) : unit.name}
                                    </span>
                                  </div>
                                  {truckMeta}
                                </div>
                                <div style={{ width: 96, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
                                  <TypeBadge label={unit.badge} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {filteredUnits.length === 0 && (
                      <div style={{ padding: "40px 20px", color: "#737373", fontSize: 14, textAlign: "center" }}>
                        No trucks found
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ) : (
              /* ─── Manual: Enter Details form (visual stub, matches merge-modal.tsx) ─── */
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
                <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3", lineHeight: "24px", flexShrink: 0 }}>Enter Details</span>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Truck (& Trailer) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>Truck (& Trailer)</span>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      border: "1px solid #333", borderRadius: 4, cursor: "pointer",
                      boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                    }}>
                      <Truck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 16, color: "#A3A3A3", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Select Truck</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  {/* Driver */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>Driver</span>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      border: "1px solid #333", borderRadius: 4, cursor: "pointer",
                      boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                    }}>
                      <UserCheck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 16, color: "#A3A3A3", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Assign Driver</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  {/* Starting Hub */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>Starting Hub</span>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      border: "1px solid #333", borderRadius: 4, cursor: "pointer",
                      boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span style={{ flex: 1, fontSize: 16, color: "#A3A3A3", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Select</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  {/* Ending Hub */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>Ending Hub</span>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      border: "1px solid #333", borderRadius: 4, cursor: "pointer",
                      boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span style={{ flex: 1, fontSize: 16, color: "#A3A3A3", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Select</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <button
                onClick={handleClose}
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#FAFAFA", backgroundColor: "transparent", border: "1px solid #333",
                  cursor: "pointer", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                  fontFamily: "Geist, sans-serif",
                }}
              >
                Cancel
              </button>
              {mode === "auto" ? (
              <button
                disabled={selectedUnitIds.length === 0}
                onClick={handleOptimise}
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#171717", backgroundColor: "#E5E5E5", border: "none",
                  cursor: selectedUnitIds.length > 0 ? "pointer" : "default",
                  opacity: selectedUnitIds.length > 0 ? 1 : 0.5,
                  transition: "opacity 150ms ease",
                  fontFamily: "Geist, sans-serif",
                }}
              >
                Optimise and Create Routes
              </button>
              ) : (
              <button
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#171717", backgroundColor: "#E5E5E5", border: "none",
                  cursor: "default", opacity: 0.5,
                  fontFamily: "Geist, sans-serif",
                }}
              >
                Create Routes
              </button>
              )}
            </div>
          </>
        )}

        {/* ── LOADING SCREEN ── */}
        {screen === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, padding: "40px 0" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            <span style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5", lineHeight: "24px" }}>Optimising Routes...</span>

            <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px", textAlign: "center", minHeight: 20 }}>{loadingPhase}</span>

            {canCancel && (
              <button
                onClick={handleClose}
                style={{
                  marginTop: 4, height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#FAFAFA", backgroundColor: "transparent", border: "1px solid #333",
                  cursor: "pointer", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                  fontFamily: "Geist, sans-serif",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Categories hover tooltip — matches Figma node 6635:33420 exactly:
          title, dashed divider, plain (no bullet) list lines, arrow pointing up into the trigger. */}
      {productTooltip && (
        <div style={{
          position: "fixed", top: productTooltip.y + 8, left: productTooltip.x,
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center",
          pointerEvents: "none", zIndex: 10000,
        }}>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid #E5E5E5" }} />
          <div style={{
            backgroundColor: "#E5E5E5", borderRadius: 4, padding: "6px 12px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            fontFamily: "Geist, sans-serif", minWidth: "max-content",
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#111", lineHeight: "20px", whiteSpace: "nowrap" }}>Product Categories</span>
            <div style={{ width: "100%", borderTop: "1px dashed #A3A3A3" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start", width: "100%" }}>
              {productTooltip.products.map((p, i) => (
                <span key={`${p}-${i}`} style={{ fontSize: 12, color: "#404040", lineHeight: "16px", whiteSpace: "nowrap" }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
