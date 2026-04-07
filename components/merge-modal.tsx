"use client"

import { useState, type ReactNode } from "react"
import { X, Truck, Search, Check, ArrowUpDown } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes } from "@/lib/mock-data"

// ─── Truck mock data ─────────────────────────────────────────────────────────
type TruckItem = {
  id: string
  name: string
  badge: string
  capacity: string
  compartments: string
  productNames: string[]
  matchLabel?: "best" | "incompatible"
  incompatibleCount?: number
}
type TruckGroup = { hub: string; trucks: TruckItem[] }

const TRUCK_GROUPS: TruckGroup[] = [
  {
    hub: "Austin Hub",
    trucks: [
      { id: "H-138", name: "H-138 - 2019 Polar Transport Trailer 9,500 gal", badge: "Truck", capacity: "4,500 gal", compartments: "11 Compartments", productNames: ["Clear Diesel", "Regular Unleaded", "Premium Unleaded"], matchLabel: "best" },
      { id: "H-401", name: "H-401 - 2023 Volvo VNL 860 Tanker",       badge: "Tank Wagon", capacity: "6,200 gal", compartments: "6 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
      { id: "H-415", name: "H-415 - 2022 Kenworth W990 Flatbed",      badge: "Truck",      capacity: "5,800 gal", compartments: "5 Compartments", productNames: ["Regular Unleaded", "Premium Unleaded"] },
      { id: "H-450", name: "H-450 - 2023 International LT Tanker",    badge: "Truck",      capacity: "5,000 gal", compartments: "4 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Kerosene"] },
    ],
  },
  {
    hub: "Corpus Christi Hub",
    trucks: [
      { id: "H-495", name: "H-495 - 2021 Kenworth T680 Tanker",       badge: "Truck",      capacity: "5,200 gal", compartments: "5 Compartments", productNames: ["Regular Unleaded", "Premium Unleaded", "Clear Diesel"] },
      { id: "H-502", name: "H-502 - 2020 Volvo VNR 400 Tank Wagon",   badge: "Tank Wagon", capacity: "4,000 gal", compartments: "3 Compartments", productNames: ["Dyed Diesel", "Kerosene"], matchLabel: "best" },
      { id: "H-517", name: "H-517 - 2023 Peterbilt 389 Tanker",       badge: "Tank Wagon", capacity: "5,600 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Regular Unleaded", "Ethanol"], matchLabel: "incompatible", incompatibleCount: 1 },
      { id: "H-428", name: "H-428 - 2021 Peterbilt 579 Box Truck",    badge: "Box Truck",  capacity: "4,800 gal", compartments: "4 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
      { id: "H-538", name: "H-538 - 2022 International HV Tanker",    badge: "Truck",      capacity: "5,100 gal", compartments: "4 Compartments", productNames: ["Premium Unleaded", "Regular Unleaded", "Kerosene"] },
    ],
  },
  {
    hub: "San Antonio Hub",
    trucks: [
      { id: "H-544", name: "H-544 - 2019 Freightliner Cascadia Tank", badge: "Tank Wagon", capacity: "4,700 gal", compartments: "4 Compartments", productNames: ["Red Diesel", "Clear Diesel"] },
      { id: "H-575", name: "H-575 - 2020 Western Star 5700XE Tank",   badge: "Tank Wagon", capacity: "5,300 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
      { id: "H-589", name: "H-589 - 2021 Volvo FH16 Tanker",          badge: "Truck",      capacity: "6,000 gal", compartments: "6 Compartments", productNames: ["Clear Diesel", "Premium Unleaded", "Ethanol"], matchLabel: "best" },
      { id: "H-602", name: "H-602 - 2022 Peterbilt 567 Flatbed",      badge: "Truck",      capacity: "4,400 gal", compartments: "4 Compartments", productNames: ["Regular Unleaded", "Red Diesel"] },
    ],
  },
  {
    hub: "Others",
    trucks: [
      { id: "H-433", name: "H-433 - 2020 Mack Anthem Tanker",         badge: "Tank Wagon", capacity: "5,400 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Dyed Diesel"] },
      { id: "H-467", name: "H-467 - 2019 Western Star 4900 Tank",     badge: "Tank Wagon", capacity: "4,500 gal", compartments: "4 Compartments", productNames: ["Kerosene", "Regular Unleaded"] },
      { id: "H-480", name: "H-480 - 2022 Freightliner M2 Box",        badge: "Box Truck",  capacity: "3,800 gal", compartments: "3 Compartments", productNames: ["Clear Diesel", "Premium Unleaded"] },
      { id: "H-523", name: "H-523 - 2021 Mack Granite Box Truck",     badge: "Box Truck",  capacity: "4,200 gal", compartments: "4 Compartments", productNames: ["Dyed Diesel", "Regular Unleaded"] },
      { id: "H-561", name: "H-561 - 2023 Kenworth T880 Box Truck",    badge: "Box Truck",  capacity: "3,600 gal", compartments: "3 Compartments", productNames: ["Red Diesel", "Clear Diesel"] },
      { id: "H-618", name: "H-618 - 2023 Mack Pinnacle Tank Wagon",   badge: "Tank Wagon", capacity: "5,500 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Regular Unleaded", "Ethanol"] },
      { id: "H-625", name: "H-625 - 2020 International LoneStar",     badge: "Truck",      capacity: "4,900 gal", compartments: "4 Compartments", productNames: ["Premium Unleaded", "Kerosene"] },
      { id: "H-640", name: "H-640 - 2021 Kenworth W900 Tanker",       badge: "Tank Wagon", capacity: "5,700 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
    ],
  },
]

const ALL_HUBS = ["All Hubs", ...TRUCK_GROUPS.map(g => g.hub)]

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
interface MergeModalProps {
  isOpen: boolean
  onClose: () => void
  checkedRouteIds: string[]
  selectedOrders: ExtractionOrder[]
  onComplete?: (truckCount: number, orderCount: number) => void
}

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

// ─── Shared components ───────────────────────────────────────────────────────
const SpecsDot = () => <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#4A4A4A", flexShrink: 0, margin: "0 6px" }} />
const TypeBadge = ({ label, query }: { label: string; query?: string }) => (
  <span style={{ fontSize: 12, fontWeight: 500, color: "#E5E5E5", backgroundColor: "#262626", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>
    {query ? highlightText(label, query) : label}
  </span>
)

// ─── Main Component ─────────────────────────────────────────────────────────
export function MergeModal({ isOpen, onClose, checkedRouteIds, selectedOrders, onComplete }: MergeModalProps) {
  const [screen, setScreen] = useState<"main" | "loading">("main")
  const [selectedTruckIds, setSelectedTruckIds] = useState<string[]>([])
  const [truckSearch, setTruckSearch] = useState("")
  const [activeHub, setActiveHub] = useState("All Hubs")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState("")

  if (!isOpen) return null

  const handleClose = () => {
    setScreen("main")
    setSelectedTruckIds([])
    setTruckSearch("")
    setActiveHub("All Hubs")
    onClose()
  }

  // Orders for the left panel — all orders belonging to checked routes
  const orderRows = selectedOrders
    .filter(o => checkedRouteIds.includes(o.routeId ?? ""))
    .sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

  // Search: match against name, badge, or product names
  const q = truckSearch.trim().toLowerCase()
  const getFilteredTrucks = () => {
    const groups = activeHub === "All Hubs" ? TRUCK_GROUPS : TRUCK_GROUPS.filter(g => g.hub === activeHub)
    const all = groups.flatMap(g => g.trucks)
    if (!q) return all
    return all.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.badge.toLowerCase().includes(q) ||
      t.productNames.some(p => p.toLowerCase().includes(q))
    )
  }
  const filteredTrucks = getFilteredTrucks()

  // Per-truck: does the search match name / badge / products?
  const getMatchTypes = (truck: TruckItem) => {
    if (!q) return { name: false, badge: false, product: false, matchedProduct: null as string | null }
    const nameMatch = truck.name.toLowerCase().includes(q)
    const badgeMatch = truck.badge.toLowerCase().includes(q)
    const matchedProduct = truck.productNames.find(p => p.toLowerCase().includes(q)) ?? null
    return { name: nameMatch, badge: badgeMatch, product: !!matchedProduct, matchedProduct }
  }

  // Build the products/meta segment for a truck row
  const renderProductsMeta = (truck: TruckItem, matchTypes: ReturnType<typeof getMatchTypes>) => {
    if (matchTypes.product && matchTypes.matchedProduct) {
      const remaining = truck.productNames.length - 1
      return (
        <>
          <SpecsDot />
          <span style={{ fontSize: 13, color: "#A3A3A3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {highlightText(matchTypes.matchedProduct, truckSearch)}
          </span>
          {remaining > 0 && (
            <span style={{ fontSize: 13, color: "#737373", whiteSpace: "nowrap", flexShrink: 0 }}> + {remaining} more</span>
          )}
        </>
      )
    }
    return (
      <>
        <SpecsDot />
        <span style={{ fontSize: 13, color: "#A3A3A3" }}>{truck.productNames.length} Products</span>
      </>
    )
  }

  const toggleTruck = (truckId: string) => {
    setSelectedTruckIds(prev => prev.includes(truckId) ? prev.filter(id => id !== truckId) : [...prev, truckId])
  }

  const handleOptimise = () => {
    setScreen("loading")
    setLoadingProgress(0)
    setLoadingPhase("Evaluating orders across trucks")

    const phases = [
      { at: 15, text: "Evaluating orders across trucks" },
      { at: 35, text: "Applying compartment constraints" },
      { at: 55, text: "Computing travel times" },
      { at: 75, text: "Optimising stop sequences" },
      { at: 90, text: "Finalising routes" },
    ]
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setTimeout(() => {
          const orderCount = orderRows.length
          onComplete?.(selectedTruckIds.length, orderCount)
          handleClose()
        }, 600)
      }
      setLoadingProgress(Math.min(progress, 100))
      const phase = [...phases].reverse().find(p => progress >= p.at)
      if (phase) setLoadingPhase(phase.text)
    }, 200)
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        fontFamily: "Geist, sans-serif",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: screen === "loading" ? 640 : 1040,
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)",
          transition: "width 200ms ease",
          height: 640,
          maxHeight: "85vh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MAIN SCREEN: Optimise Routes ── */}
        {screen === "main" && (
          <>
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>Optimise Routes</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", backgroundColor: "#262626", borderRadius: 9999, padding: "2px 8px", lineHeight: "16px" }}>Auto</span>
                <div style={{ flex: 1 }} />
                <button onClick={handleClose} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#E5E5E5", padding: 0 }}>
                  <X size={24} strokeWidth={2} />
                </button>
              </div>
              <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>Select atleast one truck to create optimised routes automatically.</span>
            </div>

            {/* Two-panel layout */}
            <div style={{ display: "flex", gap: 32, flex: 1, minHeight: 0, overflow: "hidden" }}>
              {/* ─── Left: Orders table ─── */}
              <div style={{ flex: "0 0 480px", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px", marginBottom: 12, flexShrink: 0 }}>Orders ({orderRows.length})</span>

                {/* Table container */}
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #333", borderRadius: 4 }}>
                  {/* Sticky header */}
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "34%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "22%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ backgroundColor: "#282828", borderBottom: "1px solid #333" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#737373", lineHeight: "16px" }}>Stops</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#737373", lineHeight: "16px" }}>Planned Qty</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#737373", lineHeight: "16px" }}>Planned Time</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#737373", lineHeight: "16px" }}>Order Type</th>
                      </tr>
                    </thead>
                  </table>

                  {/* Scrollable body */}
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "34%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "22%" }} />
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
                            <td style={{ padding: "12px", verticalAlign: "middle" }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                                {MOCK_TIMES[i % MOCK_TIMES.length]}
                              </span>
                            </td>
                            <td style={{ padding: "12px", verticalAlign: "middle" }}>
                              <span style={{ fontSize: 14, color: "#E5E5E5" }}>
                                {o.orderType === "L" ? "Load" : o.orderType === "T" ? "Transfer" : "Delivery"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orderRows.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: "40px 20px", color: "#737373", fontSize: 14, textAlign: "center" }}>
                              No orders in selected routes
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ─── Right: Truck (& Trailer) selector ─── */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
                <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px", flexShrink: 0 }}>Truck (& Trailer)</span>

                {/* Search + Sort */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #333", borderRadius: 4 }}>
                    <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                    <input
                      value={truckSearch}
                      onChange={(e) => setTruckSearch(e.target.value)}
                      placeholder="Search by truck name, truck category or products"
                      style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }}
                    />
                  </div>
                  <button style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "8px 12px",
                    border: "1px solid #333", borderRadius: 4, background: "none",
                    cursor: "pointer", color: "#E5E5E5", fontSize: 14, fontFamily: "Geist, sans-serif",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    <ArrowUpDown size={14} color="#A3A3A3" />
                    <span>Sort</span>
                  </button>
                </div>

                {/* Hub tabs */}
                <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #333", flexShrink: 0, overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap", scrollbarWidth: "none" }}>
                  {ALL_HUBS.map(hub => (
                    <button
                      key={hub}
                      onClick={() => setActiveHub(hub)}
                      style={{
                        padding: "8px 16px", fontSize: 14, fontWeight: activeHub === hub ? 500 : 400,
                        color: activeHub === hub ? "#E5E5E5" : "#737373",
                        background: "none", border: "none", cursor: "pointer",
                        borderBottom: activeHub === hub ? "2px solid #E5E5E5" : "2px solid transparent",
                        fontFamily: "Geist, sans-serif",
                        transition: "color 150ms",
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}
                    >
                      {hub}
                    </button>
                  ))}
                </div>

                {/* Truck list — scrollable */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
                  {filteredTrucks.map((truck) => {
                    const isSelected = selectedTruckIds.includes(truck.id)
                    const matchTypes = getMatchTypes(truck)
                    return (
                      <div
                        key={truck.id}
                        onClick={() => toggleTruck(truck.id)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "rgba(255,255,255,0.04)" : "transparent",
                          transition: "background-color 100ms",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "rgba(255,255,255,0.04)" : "transparent" }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 16, height: 16, borderRadius: 3, border: isSelected ? "none" : "1px solid #737373",
                          backgroundColor: isSelected ? "#E5E5E5" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
                        }}>
                          {isSelected && <Check size={12} color="#171717" strokeWidth={2.5} />}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {matchTypes.name ? highlightText(truck.name, truckSearch) : truck.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                            <span style={{ fontSize: 13, color: "#A3A3A3", flexShrink: 0 }}>{truck.capacity}</span>
                            <SpecsDot />
                            <span style={{ fontSize: 13, color: "#A3A3A3", flexShrink: 0 }}>{truck.compartments}</span>
                            {renderProductsMeta(truck, matchTypes)}
                          </div>
                          {truck.matchLabel === "best" && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#10B981", marginTop: 2 }}>Best match</span>
                          )}
                          {truck.matchLabel === "incompatible" && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#FBBF24", marginTop: 2 }}>
                              {truck.incompatibleCount ?? 1} product incompatible
                            </span>
                          )}
                        </div>
                        <TypeBadge label={truck.badge} query={matchTypes.badge ? truckSearch : undefined} />
                      </div>
                    )
                  })}
                  {filteredTrucks.length === 0 && (
                    <div style={{ padding: "40px 20px", color: "#737373", fontSize: 14, textAlign: "center" }}>
                      No trucks found
                    </div>
                  )}
                </div>
              </div>
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
              <button
                disabled={selectedTruckIds.length === 0}
                onClick={handleOptimise}
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#171717", backgroundColor: "#E5E5E5", border: "none",
                  cursor: selectedTruckIds.length > 0 ? "pointer" : "default",
                  opacity: selectedTruckIds.length > 0 ? 1 : 0.5,
                  transition: "opacity 150ms ease",
                  fontFamily: "Geist, sans-serif",
                }}
              >
                Optimise and Create Routes
              </button>
            </div>
          </>
        )}

        {/* ── LOADING SCREEN ── */}
        {screen === "loading" && (
          <>
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>Optimising Routes...</span>
                <button onClick={handleClose} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#E5E5E5", padding: 0 }}>
                  <X size={24} strokeWidth={2} />
                </button>
              </div>
              <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>Please wait while we calculate the optimal routes.</span>
            </div>

            {/* Progress area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "40px 0" }}>
              <div style={{ position: "relative", width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#282828" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="#4D55F8" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - loadingProgress / 100)}`}
                    style={{ transition: "stroke-dashoffset 200ms ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: "#E5E5E5" }}>{Math.round(loadingProgress)}%</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>Optimising routes...</span>
                <span style={{ fontSize: 14, color: "#A3A3A3", textAlign: "center" }}>{loadingPhase}</span>
              </div>

              <div style={{ width: "60%", height: 4, backgroundColor: "#282828", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", backgroundColor: "#4D55F8", borderRadius: 2, width: `${loadingProgress}%`, transition: "width 200ms ease" }} />
              </div>

              <span style={{ fontSize: 13, color: "#737373" }}>
                Evaluating {orderRows.length} orders across {selectedTruckIds.length} trucks
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
