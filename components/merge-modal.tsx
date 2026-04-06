"use client"

import { useState } from "react"
import { X, Truck, Search, Check } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes } from "@/lib/mock-data"

// ─── Truck mock data (subset for merge modal) ────────────────────────────────
type TruckItem = { id: string; name: string; badge: string; capacity: string; compartments: string; products: string }

const AVAILABLE_TRUCKS: TruckItem[] = [
  { id: "H-401", name: "H-401 - 2023 Volvo VNL 860 Tanker",       badge: "Tank Wagon", capacity: "6,200 gal", compartments: "6 Compartments", products: "3 Products" },
  { id: "H-415", name: "H-415 - 2022 Kenworth W990 Flatbed",      badge: "Truck",      capacity: "5,800 gal", compartments: "5 Compartments", products: "2 Products" },
  { id: "H-428", name: "H-428 - 2021 Peterbilt 579 Box Truck",    badge: "Box Truck",  capacity: "4,800 gal", compartments: "4 Compartments", products: "3 Products" },
  { id: "H-433", name: "H-433 - 2020 Mack Anthem Tanker",         badge: "Tank Wagon", capacity: "5,400 gal", compartments: "5 Compartments", products: "2 Products" },
  { id: "H-450", name: "H-450 - 2023 International LT Tanker",    badge: "Truck",      capacity: "5,000 gal", compartments: "4 Compartments", products: "3 Products" },
  { id: "H-467", name: "H-467 - 2019 Western Star 4900 Tank",     badge: "Tank Wagon", capacity: "4,500 gal", compartments: "4 Compartments", products: "2 Products" },
  { id: "H-480", name: "H-480 - 2022 Freightliner M2 Box",        badge: "Box Truck",  capacity: "3,800 gal", compartments: "3 Compartments", products: "2 Products" },
  { id: "H-495", name: "H-495 - 2021 Kenworth T680 Tanker",       badge: "Truck",      capacity: "5,200 gal", compartments: "5 Compartments", products: "3 Products" },
  { id: "H-502", name: "H-502 - 2020 Volvo VNR 400 Tank Wagon",   badge: "Tank Wagon", capacity: "4,000 gal", compartments: "3 Compartments", products: "2 Products" },
  { id: "H-517", name: "H-517 - 2023 Peterbilt 389 Tanker",       badge: "Tank Wagon", capacity: "5,600 gal", compartments: "5 Compartments", products: "3 Products" },
  { id: "H-523", name: "H-523 - 2021 Mack Granite Box Truck",     badge: "Box Truck",  capacity: "4,200 gal", compartments: "4 Compartments", products: "2 Products" },
  { id: "H-538", name: "H-538 - 2022 International HV Tanker",    badge: "Truck",      capacity: "5,100 gal", compartments: "4 Compartments", products: "3 Products" },
  { id: "H-544", name: "H-544 - 2019 Freightliner Cascadia Tank", badge: "Tank Wagon", capacity: "4,700 gal", compartments: "4 Compartments", products: "2 Products" },
  { id: "H-561", name: "H-561 - 2023 Kenworth T880 Box Truck",    badge: "Box Truck",  capacity: "3,600 gal", compartments: "3 Compartments", products: "2 Products" },
  { id: "H-575", name: "H-575 - 2020 Western Star 5700XE Tank",   badge: "Tank Wagon", capacity: "5,300 gal", compartments: "5 Compartments", products: "3 Products" },
  { id: "H-589", name: "H-589 - 2021 Volvo FH16 Tanker",          badge: "Truck",      capacity: "6,000 gal", compartments: "6 Compartments", products: "3 Products" },
  { id: "H-602", name: "H-602 - 2022 Peterbilt 567 Flatbed",      badge: "Truck",      capacity: "4,400 gal", compartments: "4 Compartments", products: "2 Products" },
  { id: "H-618", name: "H-618 - 2023 Mack Pinnacle Tank Wagon",   badge: "Tank Wagon", capacity: "5,500 gal", compartments: "5 Compartments", products: "3 Products" },
  { id: "H-625", name: "H-625 - 2020 International LoneStar",     badge: "Truck",      capacity: "4,900 gal", compartments: "4 Compartments", products: "2 Products" },
  { id: "H-640", name: "H-640 - 2021 Kenworth W900 Tanker",       badge: "Tank Wagon", capacity: "5,700 gal", compartments: "5 Compartments", products: "3 Products" },
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface MergeModalProps {
  isOpen: boolean
  onClose: () => void
  checkedRouteIds: string[]
  selectedOrders: ExtractionOrder[]
  onComplete?: (truckCount: number, orderCount: number) => void
}

// ─── Shared components ────────────────────────────────────────────────────────
const SpecsDot = () => <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#4A4A4A", flexShrink: 0, margin: "0 6px" }} />
const TypeBadge = ({ label }: { label: string }) => (
  <span style={{ fontSize: 12, fontWeight: 500, color: "#E5E5E5", backgroundColor: "#262626", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span>
)

// ─── Main Component ──────────────────────────────────────────────────────────
export function MergeModal({ isOpen, onClose, checkedRouteIds, selectedOrders, onComplete }: MergeModalProps) {
  const [screen, setScreen] = useState<1 | 2 | 3>(1)
  const [selectedMode, setSelectedMode] = useState<"auto" | "manual" | null>(null)
  const [selectedTruckIds, setSelectedTruckIds] = useState<string[]>([])
  const [truckSearch, setTruckSearch] = useState("")
  const [summaryTab, setSummaryTab] = useState<"routes" | "orders">("routes")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState("")

  if (!isOpen) return null

  const handleClose = () => {
    setScreen(1)
    setSelectedMode(null)
    setSelectedTruckIds([])
    setTruckSearch("")
    onClose()
  }

  const handleContinue = () => {
    if (selectedMode === "auto") setScreen(2)
    // Manual: placeholder for now
  }

  const handleBack = () => {
    setScreen(1)
    setSelectedTruckIds([])
    setTruckSearch("")
  }

  const handleMerge = () => {
    setScreen(3)
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
          const orderCount = checkedRouteIds.reduce((sum, rid) => sum + selectedOrders.filter(o => o.routeId === rid).length, 0)
          onComplete?.(selectedTruckIds.length, orderCount)
          handleClose()
        }, 600)
      }
      setLoadingProgress(Math.min(progress, 100))
      const phase = [...phases].reverse().find(p => progress >= p.at)
      if (phase) setLoadingPhase(phase.text)
    }, 200)
  }

  // Routes data for selection summary
  const checkedRoutes = checkedRouteIds.map(rid => {
    const route = mockRoutes.find(r => r.id === rid)
    const routeOrders = selectedOrders.filter(o => o.routeId === rid)
    const plannedQty = routeOrders.reduce((sum, o) => (!o.orderType || o.orderType === "D" ? sum + (o.volume ?? 0) : sum), 0)
    // Mock trailer names for some routes
    const trailerMap: Record<string, string> = { "route-1": "Trailer #4598", "route-3": "Trailer #4598", "route-5": "Trailer #4598" }
    return {
      id: rid,
      truckName: route?.truckName ?? "No Truck",
      trailerName: trailerMap[rid] ?? null as string | null,
      driverName: route?.driverName ?? "Unassigned",
      plannedQty,
      orderCount: routeOrders.length,
    }
  })

  // Filtered trucks for search
  const filteredTrucks = AVAILABLE_TRUCKS.filter(t => t.name.toLowerCase().includes(truckSearch.toLowerCase()))

  const toggleTruck = (truckId: string) => {
    setSelectedTruckIds(prev => prev.includes(truckId) ? prev.filter(id => id !== truckId) : [...prev, truckId])
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
          width: screen === 1 ? 640 : screen === 3 ? 640 : 1200,
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)",
          transition: "width 200ms ease",
          height: (screen === 2 || screen === 3) ? 640 : "auto",
          maxHeight: "85vh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── SCREEN 1: Mode Selection ── */}
        {screen === 1 && (
          <>
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>Merge</span>
                <button onClick={handleClose} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#E5E5E5", padding: 0 }}>
                  <X size={24} strokeWidth={2} />
                </button>
              </div>
              <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>Choose how you'd like your routes to be merged and created.</span>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", gap: 12 }}>
              {/* Auto card */}
              <div
                onClick={() => setSelectedMode("auto")}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 4, cursor: "pointer",
                  backgroundColor: selectedMode === "auto" ? "#1B1B1B" : "#282828",
                  border: selectedMode === "auto" ? "2px solid #737373" : "2px solid transparent",
                  display: "flex", flexDirection: "column", gap: 2, overflow: "hidden",
                  transition: "background-color 150ms ease, border-color 150ms ease",
                }}
              >
                <span style={{ fontSize: 16, color: "#FFFFFF", lineHeight: "24px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Auto</span>
                <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>Let the system build and optimise routes based on your truck selection</span>
              </div>
              {/* Manual card */}
              <div
                onClick={() => setSelectedMode("manual")}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 4, cursor: "pointer",
                  backgroundColor: selectedMode === "manual" ? "#1B1B1B" : "#282828",
                  border: selectedMode === "manual" ? "2px solid #737373" : "2px solid transparent",
                  display: "flex", flexDirection: "column", gap: 2, overflow: "hidden",
                  transition: "background-color 150ms ease, border-color 150ms ease",
                }}
              >
                <span style={{ fontSize: 16, color: "#FFFFFF", lineHeight: "24px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Manual</span>
                <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>Manually merge selected routes and orders into one route</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button
                onClick={handleContinue}
                disabled={!selectedMode}
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#171717", backgroundColor: "#E5E5E5", border: "none",
                  cursor: selectedMode ? "pointer" : "default",
                  opacity: selectedMode ? 1 : 0.5,
                  transition: "opacity 150ms ease",
                }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* ── SCREEN 2: Auto Mode — Truck Selection ── */}
        {screen === 2 && (
          <>
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>Merge</span>
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
              {/* Left: Selection Summary */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
                <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3", lineHeight: "24px" }}>Selection Summary</span>
                {/* Tabs */}
                <div style={{ display: "flex", height: 40, borderBottom: "1px solid #333", flexShrink: 0 }}>
                  <button
                    onClick={() => setSummaryTab("routes")}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "4px 12px", fontSize: 14, fontWeight: summaryTab === "routes" ? 500 : 400,
                      background: summaryTab === "routes" ? "#282828" : "none",
                      border: "none", cursor: "pointer",
                      color: summaryTab === "routes" ? "#E5E5E5" : "#A3A3A3",
                      borderBottom: summaryTab === "routes" ? "1px solid #6366F1" : "1px solid transparent",
                      borderTopLeftRadius: 4, borderTopRightRadius: 4,
                      transition: "color 150ms, background-color 150ms",
                    }}
                  >
                    Routes ({checkedRoutes.length})
                  </button>
                  <button
                    onClick={() => setSummaryTab("orders")}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "4px 12px", fontSize: 14, fontWeight: summaryTab === "orders" ? 500 : 400,
                      background: summaryTab === "orders" ? "#282828" : "none",
                      border: "none", cursor: "pointer",
                      color: summaryTab === "orders" ? "#E5E5E5" : "#A3A3A3",
                      borderBottom: summaryTab === "orders" ? "1px solid #6366F1" : "1px solid transparent",
                      borderTopLeftRadius: 4, borderTopRightRadius: 4,
                      transition: "color 150ms, background-color 150ms",
                    }}
                  >
                    Orders ({selectedOrders.filter(o => checkedRouteIds.includes(o.routeId ?? "")).length})
                  </button>
                </div>
                {/* Table — column-based like Figma */}
                <div style={{ flex: 1, overflowY: "auto", border: "1px solid #333", borderRadius: 4, overflow: "hidden" }}>
                  {summaryTab === "routes" && (
                    <div style={{ display: "flex", minHeight: "100%" }}>
                      {/* Column 1: Truck (& Trailer) */}
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px", backgroundColor: "#282828", borderBottom: "1px solid #333" }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3", lineHeight: "20px" }}>Truck (& Trailer)</span>
                        </div>
                        {checkedRoutes.map((r, i) => (
                          <div key={r.id} style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 72, padding: 12, borderBottom: i < checkedRoutes.length - 1 ? "1px solid #333" : "none" }}>
                            <span style={{ fontSize: 16, color: "#E5E5E5", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.truckName}</span>
                            {r.trailerName && <span style={{ fontSize: 16, color: "#A3A3A3", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.trailerName}</span>}
                          </div>
                        ))}
                      </div>
                      {/* Column 2: Driver */}
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px", backgroundColor: "#282828", borderBottom: "1px solid #333" }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3", lineHeight: "20px" }}>Driver</span>
                        </div>
                        {checkedRoutes.map((r, i) => (
                          <div key={r.id} style={{ display: "flex", alignItems: "center", minHeight: 72, padding: 12, borderBottom: i < checkedRoutes.length - 1 ? "1px solid #333" : "none" }}>
                            <span style={{ fontSize: 16, color: "#E5E5E5", lineHeight: "24px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.driverName}</span>
                          </div>
                        ))}
                      </div>
                      {/* Column 3: Planned Qty & Orders */}
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px", backgroundColor: "#282828", borderBottom: "1px solid #333" }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3", lineHeight: "20px" }}>Planned Qty & Orders</span>
                        </div>
                        {checkedRoutes.map((r, i) => (
                          <div key={r.id} style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 72, padding: "8px 12px", borderBottom: i < checkedRoutes.length - 1 ? "1px solid #333" : "none" }}>
                            <span style={{ fontSize: 16, color: "#E5E5E5", lineHeight: "24px" }}>{r.plannedQty.toLocaleString()} gal</span>
                            <span style={{ fontSize: 16, color: "#A3A3A3", lineHeight: "24px" }}>{r.orderCount} Orders</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {summaryTab === "orders" && (
                    <div style={{ padding: "40px 20px", color: "#737373", fontSize: 14, textAlign: "center" }}>
                      Order details view coming soon
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Truck Selector */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3", lineHeight: "24px" }}>Truck (& Trailer)</span>

                {/* Search */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #333", borderRadius: 4, flexShrink: 0 }}>
                  <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                  <input
                    value={truckSearch}
                    onChange={(e) => setTruckSearch(e.target.value)}
                    placeholder="Search Trucks"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }}
                  />
                </div>

                {/* Truck list — scrollable area */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, height: 328, overflowY: "auto" }}>
                  {filteredTrucks.map((truck) => {
                    const isSelected = selectedTruckIds.includes(truck.id)
                    return (
                      <div
                        key={truck.id}
                        onClick={() => toggleTruck(truck.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                          borderRadius: 4, cursor: "pointer", flexShrink: 0,
                          backgroundColor: isSelected ? "rgba(255,255,255,0.04)" : "transparent",
                          border: isSelected ? "1px solid #333" : "1px solid transparent",
                          transition: "background-color 100ms",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "rgba(255,255,255,0.04)" : "transparent" }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 16, height: 16, borderRadius: 3, border: isSelected ? "none" : "1px solid #737373",
                          backgroundColor: isSelected ? "#E5E5E5" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {isSelected && <Check size={12} color="#171717" strokeWidth={2.5} />}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{truck.name}</span>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#A3A3A3" }}>{truck.capacity}</span>
                            <SpecsDot />
                            <span style={{ fontSize: 13, color: "#A3A3A3" }}>{truck.compartments}</span>
                            <SpecsDot />
                            <span style={{ fontSize: 13, color: "#A3A3A3" }}>{truck.products}</span>
                          </div>
                        </div>
                        <TypeBadge label={truck.badge} />
                      </div>
                    )
                  })}
                </div>

                {/* Bottom area: selected chips OR empty state */}
                {selectedTruckIds.length > 0 ? (
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "14px 16px",
                    backgroundColor: "rgba(255,255,255,0.01)",
                    border: "1px solid #333", borderRadius: 4,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#737373" }}>{selectedTruckIds.length} Added</span>
                      <button
                        onClick={() => setSelectedTruckIds([])}
                        style={{ fontSize: 13, color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                      >
                        Clear all
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedTruckIds.map(tid => {
                        const truck = AVAILABLE_TRUCKS.find(t => t.id === tid)
                        return (
                          <div key={tid} style={{
                            display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px",
                            backgroundColor: "#282828", borderRadius: 4, fontSize: 13, color: "#E5E5E5",
                          }}>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                              {truck?.name ?? tid}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedTruckIds(prev => prev.filter(id => id !== tid)) }}
                              style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#737373", padding: 0 }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                    padding: "14px 16px", height: 84,
                    backgroundColor: "rgba(255,255,255,0.01)",
                    border: "1px solid #333", borderRadius: 4,
                    boxShadow: "0px 0px 0px 0px rgba(163,163,163,0.5)",
                  }}>
                    <Truck size={20} color="#737373" />
                    <span style={{ fontSize: 14, color: "#A3A3A3", textAlign: "center" }}>Select from {AVAILABLE_TRUCKS.length} available trucks</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <button
                onClick={handleBack}
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#FAFAFA", backgroundColor: "transparent", border: "1px solid #333",
                  cursor: "pointer", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                }}
              >
                Cancel
              </button>
              <button
                disabled={selectedTruckIds.length === 0}
                onClick={handleMerge}
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#171717", backgroundColor: "#E5E5E5", border: "none",
                  cursor: selectedTruckIds.length > 0 ? "pointer" : "default",
                  opacity: selectedTruckIds.length > 0 ? 1 : 0.5,
                  transition: "opacity 150ms ease",
                }}
              >
                Merge
              </button>
            </div>
          </>
        )}

        {/* ── SCREEN 3: Loading / Optimising ── */}
        {screen === 3 && (
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
              {/* Circular progress ring */}
              <div style={{ position: "relative", width: 120, height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                  {/* Background ring */}
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#282828" strokeWidth="8" />
                  {/* Progress ring */}
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

              {/* Status text */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>Optimising routes...</span>
                <span style={{ fontSize: 14, color: "#A3A3A3", textAlign: "center" }}>
                  {loadingPhase}
                </span>
              </div>

              {/* Linear progress bar */}
              <div style={{ width: "60%", height: 4, backgroundColor: "#282828", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", backgroundColor: "#4D55F8", borderRadius: 2, width: `${loadingProgress}%`, transition: "width 200ms ease" }} />
              </div>

              <span style={{ fontSize: 13, color: "#737373" }}>
                Evaluating {checkedRouteIds.reduce((sum, rid) => sum + selectedOrders.filter(o => o.routeId === rid).length, 0)} orders across {selectedTruckIds.length} trucks
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
