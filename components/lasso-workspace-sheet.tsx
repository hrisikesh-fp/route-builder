"use client"

import { X, ChevronRight, ChevronDown, MoreVertical, Home, Truck, TriangleAlert, Plus, ArrowUp, ArrowDown } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes, mockHubs } from "@/lib/mock-data"
import { useState, useRef, useEffect } from "react"
import { base1Infrastructure } from "@/lib/infrastructure-data"
import { AddLoadOrderModal } from "@/components/add-load-order-modal"

interface LassoWorkspaceSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedOrders: ExtractionOrder[]
  selectedRouteIds: string[]
  checkedRouteIds: string[]
  onCheckedRoutesChange: (routeIds: string[]) => void
  hoveredRouteId: string | null
  onHoveredRouteChange: (routeId: string | null) => void
  onAddedLoadOrdersChange?: (added: Record<string, ExtractionOrder[]>) => void
  onShowToast?: (driverName: string) => void
  initialExpandedRouteIds?: string[]
}

type LoadOrderInfo = {
  terminalId: string
  terminalName: string
  terminalLat: number
  terminalLng: number
  terminalAddress: string
  time: string
  gal: number
  products: number
}

function timeStrToMins(t: string): number {
  const m = t.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!m) return 0
  let h = parseInt(m[1]), min = parseInt(m[2])
  const period = m[3].toUpperCase()
  if (period === "PM" && h !== 12) h += 12
  if (period === "AM" && h === 12) h = 0
  return h * 60 + min
}

const TRUCK_CAPACITY = 4500

// ─── Truck / trailer mock data (shared with create-route-panel) ───────────────
type TruckItem = { id: string; name: string; badge: string; capacity: string; compartments: string }
type TrailerItem = { id: string; name: string; capacity: string; compartments: string }

const TRUCKS: TruckItem[] = [
  { id: "H-109", name: "H-109 - 2018 Lube Box Truck",           badge: "Box truck",  capacity: "5,000 gal", compartments: "4 Compartments" },
  { id: "H-118", name: "H-118 - 2019 Kenworth Tank Wagon",       badge: "Tank Wagon", capacity: "4,500 gal", compartments: "4 Compartments" },
  { id: "H-107", name: "H-107 - 2017 Chevrolet Silverado 2500",  badge: "Truck",      capacity: "5,000 gal", compartments: "4 Compartments" },
  { id: "H-215", name: "H-215 - 2022 Freightliner Cascadia",     badge: "Truck",      capacity: "5,500 gal", compartments: "5 Compartments" },
  { id: "H-133", name: "H-133 - 2016 International ProStar",     badge: "Box truck",  capacity: "4,000 gal", compartments: "3 Compartments" },
  { id: "H-177", name: "H-177 - 2015 Mack Pinnacle Tank Wagon",  badge: "Tank Wagon", capacity: "3,500 gal", compartments: "4 Compartments" },
  { id: "H-162", name: "H-162 - 2019 Peterbilt 389 Flatbed",    badge: "Truck",      capacity: "4,500 gal", compartments: "4 Compartments" },
  { id: "H-301", name: "H-301 - 2021 Peterbilt 389 Tanker",     badge: "Tank Wagon", capacity: "5,200 gal", compartments: "5 Compartments" },
]

const TRAILERS: TrailerItem[] = [
  { id: "H-138", name: "H-138 - 2019 Polar Transport Trailer 9,500 gal", capacity: "4,500 gal", compartments: "11 Compartments" },
  { id: "H-146", name: "H-146 - 2005 Van Trailer",                        capacity: "5,000 gal", compartments: "5 Compartments"  },
  { id: "H-147", name: "H-147 - 2018 Van Trailer",                        capacity: "5,000 gal", compartments: "4 Compartments"  },
  { id: "H-149", name: "H-149 - 2019 Van Trailer",                        capacity: "4,500 gal", compartments: "4 Compartments"  },
  { id: "H-152", name: "H-152 - 2017 Van Trailer",                        capacity: "5,000 gal", compartments: "4 Compartments"  },
  { id: "H-201", name: "H-201 - 2020 Peterbilt 579 Tanker Trailer",       capacity: "6,000 gal", compartments: "6 Compartments"  },
  { id: "H-244", name: "H-244 - 2023 Volvo VNL 760 Trailer",              capacity: "6,500 gal", compartments: "7 Compartments"  },
  { id: "H-298", name: "H-298 - 2021 Kenworth T680 Tanker Trailer",       capacity: "7,500 gal", compartments: "8 Compartments"  },
  { id: "H-256", name: "H-256 - 2020 Kenworth W990 Tanker Trailer",       capacity: "8,000 gal", compartments: "9 Compartments"  },
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function CheckboxInput({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}) {
  const showCheck = checked
  const showDash = indeterminate && !checked

  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => e.key === " " && onChange()}
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        border: showCheck || showDash ? "1px solid #E5E5E5" : "1px solid #333333",
        backgroundColor: showCheck || showDash ? "#E5E5E5" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        outline: "none",
      }}
    >
      {showDash && (
        <div style={{ width: 8, height: 2, backgroundColor: "#111111", borderRadius: 1 }} />
      )}
      {showCheck && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4L3.5 6.5L9 1"
            stroke="#111111"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}

// ─── Collapsed Route Card ──────────────────────────────────────────────────────

function RouteCardCollapsed({
  color,
  driverName,
  orderCount,
  plannedQty,
  truckName,
  isHovered,
}: {
  color: string
  driverName: string
  orderCount: number
  plannedQty: number
  truckName: string
  isHovered: boolean
}) {
  return (
    <div
      style={{
        backgroundColor: isHovered ? "#333333" : "#1F1F1F",
        borderRadius: "4px 4px 0px 4px",
        boxShadow:
          "0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)",
        padding: "16px 16px 12px 20px",
        transition: "background-color 150ms ease",
      }}
    >

      {/* Top row: avatar + name | badge + 3-dot */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        {/* Left: avatar + driver name */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "1px solid rgba(115,115,115,0.2)",
              backgroundColor: "#1B1B1B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 600,
              color: color,
              flexShrink: 0,
            }}
          >
            {getInitials(driverName)}
          </div>
          <span style={{ fontSize: 16, fontWeight: 500, color: "#FFFFFF" }}>
            {driverName}
          </span>
        </div>

        {/* Right: badge + 3-dot */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
          <span
            style={{
              backgroundColor: "#111111",
              color: "#FAFAFA",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {orderCount} Orders
          </span>
          <button
            style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#737373",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: 4,
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Info row: Planned Qty + Truck */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3" }}>Planned Qty</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
            {plannedQty.toLocaleString()} gal
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", whiteSpace: "nowrap" }}>Truck</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#E5E5E5",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {truckName}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Expanded Route Card ───────────────────────────────────────────────────────

const MOCK_STOP_TIMES = [
  "5:45 AM", "06:30 AM", "7:15 AM", "8:00 AM", "8:45 AM",
  "9:30 AM", "10:15 AM", "11:00 AM", "11:45 AM", "12:30 PM",
]

// Figma node 4038-156532: seq col = 68px, gap seq→card = 24px
const SEQ_COL_W = 68
const SEQ_TO_CARD_GAP = 24
const ORDER_LIST_GAP = 8
// Center of seq col (for connector line x-position)
const SEQ_CENTER = SEQ_COL_W / 2  // 34
// Left edge of order card (seq col + gap)
const CARD_LEFT = SEQ_COL_W + SEQ_TO_CARD_GAP  // 92
// Width of horizontal arm (from seq center to card left)
const ARM_W = CARD_LEFT - SEQ_CENTER  // 58

// Hub row height = 4px outer padding + (8+16+8)px inner = 40px. Center from each edge = 20px.
const HUB_ROW_H = 40
const HUB_ARM_OFFSET = HUB_ROW_H / 2  // 20px

// Thin bridge div that draws the vertical line across the gap between sections
function SeqLineBridge() {
  return (
    <div style={{ position: "relative", height: ORDER_LIST_GAP, flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          left: SEQ_CENTER,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: "#282828",
          pointerEvents: "none",
        }}
      />
    </div>
  )
}

// Starting hub row: truck + hub combined card, arm at bottom-20 (hub row center), vertical line going DOWN only
function TruckHubStartRow({ truckName, hubName, onTruckChange }: { truckName: string | null; hubName: string; onTruckChange?: (truck: TruckItem) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: SEQ_TO_CARD_GAP }}>
      {/* Seq col: arm + vertical segment going DOWN from arm only */}
      <div style={{ width: SEQ_COL_W, flexShrink: 0, alignSelf: "stretch", position: "relative", overflow: "visible" }}>
        {/* Horizontal arm — from SEQ_CENTER going right, at hub row center (bottom: HUB_ARM_OFFSET) */}
        <div
          style={{
            position: "absolute",
            left: SEQ_CENTER,
            bottom: HUB_ARM_OFFSET,
            width: ARM_W,
            height: 1,
            backgroundColor: "#282828",
            pointerEvents: "none",
          }}
        />
        {/* Vertical line from arm down to bottom of row only (no upward overflow) */}
        <div
          style={{
            position: "absolute",
            left: SEQ_CENTER,
            bottom: 0,
            height: HUB_ARM_OFFSET,
            width: 1,
            backgroundColor: "#282828",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Truck + Hub combined card */}
      <TruckHubCard truckNameProp={truckName} hubName={hubName} onTruckChange={onTruckChange} />
    </div>
  )
}

function TruckHubCard({ truckNameProp, hubName, onTruckChange }: { truckNameProp: string | null; hubName: string; onTruckChange?: (truck: TruckItem) => void }) {
  const [selectedTruck, setSelectedTruck] = useState<TruckItem | null>(null)
  const [trailer1, setTrailer1] = useState<TrailerItem | null>(null)
  const [trailer2, setTrailer2] = useState<TrailerItem | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [truckSearch, setTruckSearch] = useState(false)
  const [truckQuery, setTruckQuery] = useState("")
  const [trailerSlot, setTrailerSlot] = useState<0 | 1 | 2>(0)
  const [trailerQuery, setTrailerQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const truckSearchRef = useRef<HTMLInputElement>(null)
  const trailerSearchRef = useRef<HTMLInputElement>(null)

  // Initialize from prop
  const displayName = selectedTruck ? selectedTruck.name : truckNameProp

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setTruckSearch(false)
        setTrailerSlot(0)
        setTruckQuery("")
        setTrailerQuery("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (truckSearch) setTimeout(() => truckSearchRef.current?.focus(), 30)
  }, [truckSearch])

  useEffect(() => {
    if (trailerSlot > 0) setTimeout(() => trailerSearchRef.current?.focus(), 30)
  }, [trailerSlot])

  const filteredTrucks = TRUCKS.filter((t) => t.name.toLowerCase().includes(truckQuery.toLowerCase()))
  const filteredTrailers = TRAILERS.filter((t) => t.name.toLowerCase().includes(trailerQuery.toLowerCase()))

  const handleSelectTruck = (item: TruckItem) => {
    setSelectedTruck(item)
    setTruckSearch(false)
    setTruckQuery("")
    setTrailer1(null)
    setTrailer2(null)
    setTrailerSlot(0)
    onTruckChange?.(item)
  }

  const SpecsDot = () => <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#4A4A4A", flexShrink: 0, margin: "0 6px" }} />
  const TypeBadge = ({ label }: { label: string }) => (
    <span style={{ fontSize: 12, fontWeight: 500, color: "#E5E5E5", backgroundColor: "#262626", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span>
  )

  return (
    <div style={{ flex: 1 }}>
      <div style={{ backgroundColor: "#1F1F1F", borderRadius: 4, boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.06)" }}>

        {/* Truck row with dropdown */}
        <div style={{ padding: 4, borderBottom: "1px solid #282828" }}>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            {/* Trigger */}
            <div
              onClick={() => { setDropdownOpen((o) => !o); if (!dropdownOpen) setTruckSearch(false) }}
              style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 4, backgroundColor: "transparent", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Truck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 400, color: displayName ? "#E5E5E5" : "#737373", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName ?? "Select Truck"}
              </span>
              <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0, transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
                backgroundColor: (truckSearch || trailerSlot > 0) ? "#111" : "#1B1B1B",
                border: "1px solid #333", borderRadius: 4, zIndex: 200,
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)", overflow: "hidden",
              }}>

                {/* No truck selected state */}
                {!selectedTruck && (
                  <>
                    {/* Always #1B1B1B so it visually floats above the #111 search area */}
                    <div style={{ padding: 4, backgroundColor: "#1B1B1B", borderBottom: "1px solid #333" }}>
                      <div
                        onClick={() => setTruckSearch((s) => !s)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                          borderRadius: 2, cursor: "pointer", justifyContent: "space-between",
                          backgroundColor: truckSearch ? "#282828" : "transparent",
                        }}
                        onMouseEnter={(e) => { if (!truckSearch) (e.currentTarget as HTMLElement).style.backgroundColor = "#282828" }}
                        onMouseLeave={(e) => { if (!truckSearch) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 16, color: "#E5E5E5" }}>No truck selected</span>
                          <span style={{ fontSize: 14, color: "#A3A3A3" }}>Last used: Truck #347</span>
                        </div>
                        <Plus size={20} color="#A3A3A3" style={{ flexShrink: 0 }} />
                      </div>
                    </div>
                    {truckSearch && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                          <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                          <input ref={truckSearchRef} value={truckQuery} onChange={(e) => setTruckQuery(e.target.value)} placeholder="Search Truck" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }} />
                        </div>
                        <div style={{ padding: 4, borderBottom: "1px solid #333", maxHeight: 220, overflowY: "auto" }}>
                          {filteredTrucks.map((t) => (
                            <div key={t.id} onClick={() => handleSelectTruck(t)}
                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer", backgroundColor: "transparent" }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                </div>
                              </div>
                              <TypeBadge label={t.badge} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {!truckSearch && (
                      <div style={{ padding: "8px 12px 10px" }}>
                        <span style={{ fontSize: 14, color: "#737373" }}>Trailers can be added only after adding a Truck</span>
                      </div>
                    )}
                  </>
                )}

                {/* Truck selected state */}
                {selectedTruck && (
                  <>
                    <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                      <div onClick={() => { setTruckSearch((s) => !s); setTruckQuery("") }}
                        style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 8px", borderRadius: 2, backgroundColor: "#1B1B1B", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                      >
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTruck.name}</span>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 14, color: "#A3A3A3" }}>{selectedTruck.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{selectedTruck.compartments}</span>
                          </div>
                        </div>
                        <TypeBadge label={selectedTruck.badge} />
                        <ChevronDown size={16} color="#737373" style={{ flexShrink: 0 }} />
                      </div>
                    </div>

                    {/* Change truck search */}
                    {truckSearch && (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                          <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                          <input ref={truckSearchRef} value={truckQuery} onChange={(e) => setTruckQuery(e.target.value)} placeholder="Search Truck" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }} />
                        </div>
                        <div style={{ padding: 4, borderBottom: "1px solid #333", maxHeight: 200, overflowY: "auto", backgroundColor: "#111" }}>
                          {filteredTrucks.map((t) => (
                            <div key={t.id} onClick={() => handleSelectTruck(t)}
                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer", backgroundColor: t.id === selectedTruck.id ? "rgba(255,255,255,0.06)" : "transparent" }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = t.id === selectedTruck.id ? "rgba(255,255,255,0.06)" : "transparent"}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                </div>
                              </div>
                              <TypeBadge label={t.badge} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Trailer section */}
                    {!truckSearch && (
                      <>
                        {/* Trailer 1 selected */}
                        {trailer1 && (
                          <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                            <div onClick={() => { setTrailerSlot(trailerSlot === 1 ? 0 : 1); setTrailerQuery("") }}
                              style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 8px", borderRadius: 2, backgroundColor: "#1B1B1B", cursor: "pointer" }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trailer1.name}</span>
                                <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer1.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer1.compartments}</span></div>
                              </div>
                              <TypeBadge label="Trailer" />
                              <ChevronDown size={16} color="#737373" style={{ flexShrink: 0 }} />
                            </div>
                          </div>
                        )}
                        {trailerSlot === 1 && (
                          <div style={{ borderBottom: "1px solid #333" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                              <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                              <input ref={trailerSearchRef} value={trailerQuery} onChange={(e) => setTrailerQuery(e.target.value)} placeholder="Search Trailer" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }} />
                            </div>
                            <div style={{ padding: 4, maxHeight: 180, overflowY: "auto", backgroundColor: "#111" }}>
                              {filteredTrailers.map((t) => (
                                <div key={t.id} onClick={() => { setTrailer1(t); setTrailerSlot(0); setTrailerQuery("") }}
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer", backgroundColor: "transparent" }}
                                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"}
                                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                                >
                                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                                    <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Trailer 2 selected */}
                        {trailer2 && (
                          <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                            <div onClick={() => { setTrailerSlot(trailerSlot === 2 ? 0 : 2); setTrailerQuery("") }}
                              style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 8px", borderRadius: 2, backgroundColor: "#1B1B1B", cursor: "pointer" }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trailer2.name}</span>
                                <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer2.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer2.compartments}</span></div>
                              </div>
                              <TypeBadge label="Trailer" />
                              <ChevronDown size={16} color="#737373" style={{ flexShrink: 0 }} />
                            </div>
                          </div>
                        )}
                        {trailerSlot === 2 && (
                          <div style={{ borderBottom: "1px solid #333" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                              <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                              <input ref={trailerSearchRef} value={trailerQuery} onChange={(e) => setTrailerQuery(e.target.value)} placeholder="Search Trailer" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }} />
                            </div>
                            <div style={{ padding: 4, maxHeight: 180, overflowY: "auto", backgroundColor: "#111" }}>
                              {filteredTrailers.map((t) => (
                                <div key={t.id} onClick={() => { setTrailer2(t); setTrailerSlot(0); setTrailerQuery("") }}
                                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer", backgroundColor: "transparent" }}
                                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"}
                                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                                >
                                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                                    <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Add Trailer button */}
                        {!(trailer1 && trailer2) && trailerSlot === 0 && (
                          <div style={{ padding: 4 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setTrailerQuery(""); if (!trailer1) setTrailerSlot(1); else setTrailerSlot(2) }}
                              style={{ width: "100%", height: 32, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: "transparent", border: "none", borderRadius: 4, cursor: "pointer", color: "#FAFAFA", fontSize: 14, fontWeight: 500 }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                            >
                              <Plus size={16} style={{ flexShrink: 0 }} /> Add Trailer
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hub row */}
        <div style={{ padding: 4 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 4, backgroundColor: "transparent", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <Home size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 400, color: "#E5E5E5" }}>{hubName}</span>
            <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Ending hub row: arm at top+20 (hub row center), vertical line going UP only
function EndHubRow({ hubName }: { hubName: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: SEQ_TO_CARD_GAP }}>
      {/* Seq col: arm + vertical segment going UP from arm only */}
      <div style={{ width: SEQ_COL_W, flexShrink: 0, alignSelf: "stretch", position: "relative", overflow: "visible" }}>
        {/* Horizontal arm */}
        <div
          style={{
            position: "absolute",
            left: SEQ_CENTER,
            top: HUB_ARM_OFFSET,
            width: ARM_W,
            height: 1,
            backgroundColor: "#282828",
            pointerEvents: "none",
          }}
        />
        {/* Vertical line from top of row to arm only (no downward overflow) */}
        <div
          style={{
            position: "absolute",
            left: SEQ_CENTER,
            top: 0,
            height: HUB_ARM_OFFSET,
            width: 1,
            backgroundColor: "#282828",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Hub card */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            backgroundColor: "#1F1F1F",
            borderRadius: 4,
            boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.06)",
            padding: 4,
          }}
        >
          <div
            style={{
              display: "flex", flexDirection: "row", alignItems: "center",
              gap: 8, padding: "8px 12px", borderRadius: 4,
              backgroundColor: "transparent", cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Home size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 400, color: "#E5E5E5" }}>
              {hubName}
            </span>
            <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Mock supplier info per terminal id
const TERMINAL_SUPPLIERS: Record<string, { count: number; names: string; address: string }> = {
  "inf-1": { count: 3, names: "Flint Hills / 332023, Motiva / 441021, Valero / 211078", address: "7501 Johnny Morris Road, Austin, TX" },
  "inf-2": { count: 2, names: "Valero / 211078, Motiva / 441021", address: "3100 N Main Street, Taylor, TX" },
  "inf-3": { count: 2, names: "Magellan / 551034, Shell / 662045", address: "1500 Gattis School Road, Round Rock, TX" },
}

// Mock load orders per terminal
const TERMINAL_LOAD_ORDERS: Record<string, Array<{ id: string; gal: number; products: number; time: string }>> = {
  "inf-1": [
    { id: "lo-1-1", gal: 2800, products: 2, time: "06:45 AM" },
    { id: "lo-1-2", gal: 0, products: 0, time: "07:00 AM" },
    { id: "lo-1-3", gal: 4500, products: 2, time: "08:45 PM" },
    { id: "lo-1-4", gal: 7200, products: 3, time: "10:45 AM" },
    { id: "lo-1-5", gal: 0, products: 0, time: "11:00 AM" },
    { id: "lo-1-6", gal: 4500, products: 2, time: "12:45 PM" },
    { id: "lo-1-7", gal: 4500, products: 2, time: "01:45 PM" },
    { id: "lo-1-8", gal: 0, products: 0, time: "02:45 PM" },
  ],
  "inf-2": [
    { id: "lo-2-1", gal: 3200, products: 2, time: "07:30 AM" },
    { id: "lo-2-2", gal: 4500, products: 3, time: "09:00 AM" },
    { id: "lo-2-3", gal: 2400, products: 1, time: "11:30 AM" },
  ],
  "inf-3": [
    { id: "lo-3-1", gal: 5000, products: 2, time: "06:00 AM" },
    { id: "lo-3-2", gal: 3600, products: 2, time: "09:45 AM" },
  ],
}

const terminals = base1Infrastructure.filter((i) => i.type === "Terminal")

// "No Load Orders added yet" banner row — shown when route has no L-type orders
function NoLoadOrderRow({ onOpenModal }: { onOpenModal: () => void }) {
  const DOT_SIZE = 8

  return (
    <div style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 20 }}>
      {/* Banner row */}
      <div style={{ display: "flex", flexDirection: "row", gap: SEQ_TO_CARD_GAP, alignItems: "center" }}>
        {/* Seq col: small dot */}
        <div
          style={{
            width: SEQ_COL_W,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: "50%", backgroundColor: "#A3A3A3" }} />
        </div>

        {/* Alert banner */}
        <div
          style={{
            flex: 1,
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            borderRadius: 4,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <TriangleAlert size={16} color="#818CF8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 400, color: "#818CF8", whiteSpace: "nowrap" }}>
              No Load Orders added yet
            </span>
          </div>
          <button
            onClick={onOpenModal}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              height: 32,
              borderRadius: 4,
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
              cursor: "pointer",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
          >
            <Plus size={16} color="#FAFAFA" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", whiteSpace: "nowrap" }}>
              Add Load Order
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpandedRouteCard({
  orders,
  hubName,
  truckName,
  driverName,
  recentlyAddedOrderId,
  onOpenModal,
  onTruckChange,
}: {
  orders: ExtractionOrder[]
  color?: string
  hubName: string
  truckName: string | null
  driverName: string
  recentlyAddedOrderId?: string | null
  onOpenModal: () => void
  onTruckChange?: (truck: TruckItem) => void
}) {
  return (
    <div style={{ paddingTop: 8, paddingBottom: 8, display: "flex", flexDirection: "column" }}>

      {/* Starting hub: truck + hub combined, arm → down only */}
      <TruckHubStartRow truckName={truckName} hubName={hubName} onTruckChange={onTruckChange} />

      {/* Bridge gap between starting hub and orders */}
      <SeqLineBridge />

      {/* Order rows: one continuous vertical line through all stops */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: ORDER_LIST_GAP }}>
        <div
          style={{
            position: "absolute",
            left: SEQ_CENTER,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: "#282828",
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
        {/* Show "No Load Orders" banner if no L-type orders exist on this route */}
        {!orders.some((o) => o.orderType === "L") && (
          <NoLoadOrderRow onOpenModal={onOpenModal} />
        )}
        {orders.map((order, idx) => {
          // Load orders carry their actual time in scheduledDate
          // Delivery orders use routeSequence to stay stable after insertions
          const stopTime =
            order.orderType === "L" && order.scheduledDate
              ? order.scheduledDate
              : MOCK_STOP_TIMES[(order.routeSequence ?? idx + 1) - 1] || MOCK_STOP_TIMES[idx] || "—"
          return (
            <OrderStopRow
              key={order.id}
              order={order}
              idx={idx}
              stopTime={stopTime}
              isNew={order.id === recentlyAddedOrderId}
            />
          )
        })}
      </div>

      {/* Bridge gap between orders and ending hub */}
      <SeqLineBridge />

      {/* Ending hub: arm → up only */}
      <EndHubRow hubName={hubName} />
    </div>
  )
}

function OrderStopRow({
  order,
  idx,
  stopTime,
  isNew,
}: {
  order: ExtractionOrder
  idx: number
  stopTime: string
  isNew?: boolean
}) {
  const seq = idx + 1
  const type = order.orderType ?? "D"

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: SEQ_TO_CARD_GAP,
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Seq column — 68px, zIndex 1 above connector line */}
      <div
        style={{
          width: SEQ_COL_W,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Sequence badge — 16×16 circle per Figma spec, #A3A3A3 bg, #171717 text */}
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "#A3A3A3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 500,
            color: "#171717",
            lineHeight: 1,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {seq}
        </div>
        {/* Time label — Geist 12px w400 #A3A3A3 */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "#A3A3A3",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {stopTime}
        </span>
      </div>

      {/* Order card */}
      <div
        style={{
          flex: 1,
          backgroundColor: "#1F1F1F",
          borderRadius: 4,
          padding: 16,
          gap: 12,
          display: "flex",
          flexDirection: "row",
          animation: isNew ? "rb-flicker 0.5s ease 8" : undefined,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#333333"
          const btn = e.currentTarget.querySelector<HTMLButtonElement>(".order-menu-btn")
          if (btn) btn.style.opacity = "1"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#1F1F1F"
          const btn = e.currentTarget.querySelector<HTMLButtonElement>(".order-menu-btn")
          if (btn) btn.style.opacity = "0"
        }}
      >
        {/* Left: checkbox + grip */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 4,
            gap: 12,
            flexShrink: 0,
          }}
        >
          <CheckboxInput checked={false} onChange={() => {}} />
          {/* Grip icon (hidden) */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0 }}>
            <circle cx="7" cy="6" r="1" fill="#A3A3A3" />
            <circle cx="7" cy="10" r="1" fill="#A3A3A3" />
            <circle cx="7" cy="14" r="1" fill="#A3A3A3" />
            <circle cx="13" cy="6" r="1" fill="#A3A3A3" />
            <circle cx="13" cy="10" r="1" fill="#A3A3A3" />
            <circle cx="13" cy="14" r="1" fill="#A3A3A3" />
          </svg>
        </div>

        {/* Right: type badge + name + qty */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {/* Type badge: 20×20, neutral #E5E5E5 bg */}
            <div
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                backgroundColor: "#E5E5E5",
                border: "1px solid #737373",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 500,
                color: "#171717",
                lineHeight: 1,
              }}
            >
              {type}
            </div>
            {/* Stop name */}
            <span
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: 500,
                color: "#FFFFFF",
                lineHeight: "1.5em",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {order.customerName}
            </span>
            {/* 3-dot menu — hidden until card hover */}
            <button
              className="order-menu-btn"
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
                opacity: 0,
                transition: "opacity 0.15s",
                color: "#A3A3A3",
                padding: 0,
              }}
            >
              <MoreVertical size={14} />
            </button>
          </div>

          {/* Planned qty */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#FAFAFA",
              opacity: 0.6,
              lineHeight: "1.429em",
            }}
          >
            Planned Qty: {order.volume > 0 ? `${order.volume.toLocaleString()} gal` : "—"}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LassoWorkspaceSheet({
  isOpen,
  onClose,
  selectedOrders,
  selectedRouteIds,
  checkedRouteIds,
  onCheckedRoutesChange,
  hoveredRouteId,
  onHoveredRouteChange,
  onAddedLoadOrdersChange,
  onShowToast,
  initialExpandedRouteIds = [],
}: LassoWorkspaceSheetProps) {
  const [activeTab, setActiveTab] = useState<"routes" | "unassigned">("routes")
  const [expandedRouteIds, setExpandedRouteIds] = useState<string[]>(initialExpandedRouteIds)
  const [addedLoadOrders, setAddedLoadOrders] = useState<Record<string, ExtractionOrder[]>>({})
  const [recentlyAddedOrderId, setRecentlyAddedOrderId] = useState<string | null>(null)
  // Selected trucks per route: { [routeId]: TruckItem }
  const [selectedTrucks, setSelectedTrucks] = useState<Record<string, TruckItem>>({})
  // Add Load Order modal state
  const [isAddLoadModalOpen, setIsAddLoadModalOpen] = useState(false)
  const [activeRouteIdForModal, setActiveRouteIdForModal] = useState<string | null>(null)

  const toggleExpanded = (routeId: string) => {
    setExpandedRouteIds((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
    )
  }

  const toggleRouteChecked = (routeId: string) => {
    if (checkedRouteIds.includes(routeId)) {
      onCheckedRoutesChange(checkedRouteIds.filter((id) => id !== routeId))
    } else {
      onCheckedRoutesChange([...checkedRouteIds, routeId])
    }
  }

  const routeGroups = selectedRouteIds.reduce(
    (acc, routeId) => {
      const routeOrders = selectedOrders.filter((o) => o.routeId === routeId)
      if (routeOrders.length > 0) acc[routeId] = routeOrders
      return acc
    },
    {} as Record<string, ExtractionOrder[]>
  )

  const allRouteIds = Object.keys(routeGroups)
  const allChecked = allRouteIds.length > 0 && allRouteIds.every((id) => checkedRouteIds.includes(id))
  const someChecked = checkedRouteIds.length > 0 && !allChecked

  const toggleAllRoutes = () => {
    if (allChecked) {
      onCheckedRoutesChange([])
    } else {
      onCheckedRoutesChange(allRouteIds)
    }
  }

  const unassignedOrders = selectedOrders.filter((o) => !o.routeId)

  const getTankLevelColor = (level: number) => {
    if (level > 75) return "#E15252"
    if (level >= 40) return "#FDE68A"
    return "#69BF88"
  }

  if (!isOpen) return null

  const hasSelection = selectedOrders.length > 0

  return (
    <div
      className="fixed right-0 top-[68px] bottom-0 z-[10000] flex flex-col"
      style={{
        width: 560,
        backgroundColor: "#111111",
        borderLeft: "1px solid #282828",
      }}
    >
      {!hasSelection ? (
        /* ── Empty state ── */
        <>
          {/* Close button */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px 0" }}>
            <button
              onClick={onClose}
              style={{
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                color: "#737373", background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              <X size={16} />
            </button>
          </div>
          {/* Centred message */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 40px", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", marginBottom: 8 }}>
              Workspace is Empty
            </p>
            <p style={{ fontSize: 14, fontWeight: 400, color: "#737373", lineHeight: "1.5em" }}>
              Use filters or zoom in to begin adding orders and creating routes.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* ── HEADER ── */}
          <div
            style={{
              padding: "20px 24px 12px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 500, color: "#FFFFFF" }}>
              {selectedOrders.length} Orders selected
            </span>
            <button
              onClick={onClose}
              style={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#737373",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderRadius: 4,
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── TABS ── */}
          <div
            style={{
              padding: "0 24px",
              flexShrink: 0,
              borderBottom: "1px solid #333333",
              display: "flex",
              gap: 4,
            }}
          >
            {(["routes", "unassigned"] as const).map((tab) => {
              const isActive = activeTab === tab
              const label =
                tab === "routes"
                  ? `Driver Routes (${allRouteIds.length})`
                  : `Unassigned Orders (${unassignedOrders.length})`
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    height: 56,
                    padding: "0 12px",
                    fontSize: 16,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "#FFFFFF" : "#A3A3A3",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    borderRadius: isActive ? 0 : 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        backgroundColor: "#FFFFFF",
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── SCROLLABLE CONTENT ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: "0 24px" }}
          >
            {/* ── ROUTES TAB ── */}
            {activeTab === "routes" && (
              <div>
                {/* Select All Row */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: "20px 0 20px",
                  }}
                >
                  <CheckboxInput
                    checked={allChecked}
                    indeterminate={someChecked}
                    onChange={toggleAllRoutes}
                  />
                  <span style={{ fontSize: 16, fontWeight: 300, color: "#E5E5E5" }}>
                    Select All Routes
                  </span>
                </div>

                {/* Route card list */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    paddingBottom: 16,
                  }}
                >
                  {allRouteIds.map((routeId) => {
                    const orders = routeGroups[routeId]
                    const route = mockRoutes.find((r) => r.id === routeId)
                    const driverName = route?.driverName ?? `Route ${routeId.replace("route-", "")}`
                    const color = route?.color ?? "#A3A3A3"
                    const isExpanded = expandedRouteIds.includes(routeId)
                    const isChecked = checkedRouteIds.includes(routeId)

                    // Merge in any added load orders for this route
                    const extraOrders = addedLoadOrders[routeId] ?? []
                    const sortedOrders = [...orders, ...extraOrders].sort(
                      (a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0)
                    )

                    // Data layer: count unique sequences (all stop types)
                    const uniqueSeqs = new Set(
                      sortedOrders.map((o) => o.routeSequence).filter((s) => s != null)
                    )
                    const orderCount = uniqueSeqs.size || sortedOrders.length
                    // Planned qty = delivery orders (type "D") only
                    const plannedQty = sortedOrders.reduce(
                      (sum, o) => (!o.orderType || o.orderType === "D" ? sum + (o.volume ?? 0) : sum),
                      0
                    )
                    // Use user-selected truck if available, else fall back to mock data truck
                    const userSelectedTruck = selectedTrucks[routeId] ?? null
                    const truckName = userSelectedTruck?.name ?? route?.truckName ?? null
                    // Parse capacity like "4,500 gal" → 4500
                    const truckCapacity = userSelectedTruck
                      ? parseInt(userSelectedTruck.capacity.replace(/,/g, ""))
                      : TRUCK_CAPACITY
                    const diff = truckName ? plannedQty - truckCapacity : 0

                    // Determine alert state (only when a truck is selected)
                    type AlertState = "exceeding-truck" | "exceeding-product" | "below-truck" | null
                    let alertState: AlertState = null
                    let alertAmount = 0
                    if (truckName && userSelectedTruck) {
                      if (diff > 0) {
                        alertState = "exceeding-truck"
                        alertAmount = diff
                      } else {
                        // Check if any single delivery order exceeds per-compartment capacity
                        const compartmentCount = parseInt(userSelectedTruck.compartments) || 1
                        const perCompartment = truckCapacity / compartmentCount
                        const deliveryOrders = sortedOrders.filter((o) => !o.orderType || o.orderType === "D")
                        let maxProductOverflow = 0
                        for (const o of deliveryOrders) {
                          const vol = o.volume ?? 0
                          if (vol > perCompartment) {
                            maxProductOverflow = Math.max(maxProductOverflow, vol - perCompartment)
                          }
                        }
                        if (maxProductOverflow > 0) {
                          alertState = "exceeding-product"
                          alertAmount = Math.round(maxProductOverflow)
                        } else {
                          alertState = "below-truck"
                          alertAmount = Math.abs(diff)
                        }
                      }
                    }

                    // Hub name
                    const hubId = orders[0]?.hubId
                    const hub = mockHubs.find((h) => h.id === hubId)
                    const hubName = hub?.name ?? "Austin HUB"

                    // left-col width (checkbox 16 + gap 4 + chevron 24) + outer gap 8 = 52px
                    const LEFT_INDENT = 52

                    return (
                      <div
                        key={routeId}
                        style={{ display: "flex", flexDirection: "column" }}
                        onMouseEnter={() => onHoveredRouteChange(routeId)}
                        onMouseLeave={() => onHoveredRouteChange(null)}
                      >
                        {/* Card row: checkbox+chevron centered with card body */}
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                          {/* Left col: checkbox + chevron */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            <CheckboxInput
                              checked={isChecked}
                              onChange={() => toggleRouteChecked(routeId)}
                            />
                            <button
                              onClick={() => toggleExpanded(routeId)}
                              style={{
                                width: 24,
                                height: 24,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#737373",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: 4,
                                padding: 0,
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </div>

                          {/* Card body — position relative for color bar */}
                          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                            <div
                              style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 6,
                                backgroundColor: color,
                                borderRadius: "4px 0 0 4px",
                                pointerEvents: "none",
                              }}
                            />
                            <RouteCardCollapsed
                              color={color}
                              driverName={driverName}
                              orderCount={orderCount}
                              plannedQty={plannedQty}
                              truckName={truckName ?? "Not Selected"}
                              isHovered={hoveredRouteId === routeId}
                            />
                          </div>
                        </div>

                        {/* Alert bar — indented to align with card left edge */}
                        {alertState && (
                          <div style={{ paddingLeft: LEFT_INDENT }}>
                            <div
                              style={{
                                backgroundColor: "rgba(234, 179, 8, 0.09)",
                                borderRadius: "0px 0px 4px 4px",
                                padding: "6px 16px 6px 20px",
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <span style={{ fontSize: 14, fontWeight: 400, color: "#EAB308", whiteSpace: "nowrap" }}>
                                {alertState === "exceeding-truck" && "Exceeding Truck Capacity"}
                                {alertState === "exceeding-product" && "Exceeding Product Capacity"}
                                {alertState === "below-truck" && "Below Truck Capacity"}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                {alertState === "exceeding-truck" && <ArrowUp size={16} color="#EAB308" />}
                                {alertState === "below-truck" && <ArrowDown size={16} color="#EAB308" />}
                                <span style={{ fontSize: 14, fontWeight: 400, color: "#EAB308", whiteSpace: "nowrap" }}>
                                  {alertAmount.toLocaleString()} gal
                                </span>
                                <Info size={16} color="#EAB308" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expanded accordion — full width (no indent), CARD_LEFT handled internally */}
                        {isExpanded && (
                          <ExpandedRouteCard
                            orders={sortedOrders}
                            color={color}
                            hubName={hubName}
                            truckName={userSelectedTruck?.name ?? truckName}
                            driverName={driverName}
                            recentlyAddedOrderId={recentlyAddedOrderId}
                            onTruckChange={(truck) => setSelectedTrucks((prev) => ({ ...prev, [routeId]: truck }))}
                            onOpenModal={() => {
                              setActiveRouteIdForModal(routeId)
                              setIsAddLoadModalOpen(true)
                            }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── UNASSIGNED TAB ── */}
            {activeTab === "unassigned" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "12px 0 16px",
                }}
              >
                {unassignedOrders.length === 0 ? (
                  <p
                    style={{
                      fontSize: 14,
                      color: "#737373",
                      textAlign: "center",
                      padding: "32px 0",
                    }}
                  >
                    No unassigned orders selected.
                  </p>
                ) : (
                  unassignedOrders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: "#1F1F1F",
                        border: "1px solid #282828",
                        borderRadius: 4,
                        padding: 12,
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <CheckboxInput checked={false} onChange={() => {}} />
                        <div>
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              color: "#FAFAFA",
                              margin: 0,
                            }}
                          >
                            {order.customerName}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 400,
                              color: "#737373",
                              margin: 0,
                            }}
                          >
                            {order.shipToAddress}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: getTankLevelColor(order.currentLevel),
                            }}
                          />
                          <span style={{ fontSize: 12, color: "#A3A3A3" }}>
                            {order.currentLevel}%
                          </span>
                        </div>
                        <button
                          style={{
                            width: 24,
                            height: 24,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#737373",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: 4,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid rgba(115, 115, 115, 0.2)",
              flexShrink: 0,
            }}
          >
            <button
              style={{
                width: "100%",
                height: 40,
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                color: "#FAFAFA",
                backgroundColor: "#4D55F8",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3D45E8")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4D55F8")}
            >
              Publish Routes
            </button>
          </div>
        </>
      )}

      {/* Add Load Order Modal */}
      {isAddLoadModalOpen && activeRouteIdForModal && (
        <AddLoadOrderModal
          isOpen={isAddLoadModalOpen}
          driverName={(() => {
            const route = mockRoutes.find((r) => r.id === activeRouteIdForModal)
            return route?.driverName ?? "Driver"
          })()}
          onClose={() => {
            setIsAddLoadModalOpen(false)
            setActiveRouteIdForModal(null)
          }}
          onConfirm={(info) => {
            const routeId = activeRouteIdForModal
            const routeOrders = [...(selectedOrders.filter((o) => o.routeId === routeId)), ...(addedLoadOrders[routeId] ?? [])]
            const sortedRouteOrders = [...routeOrders].sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

            // Find insertion position by time
            const newTimeMins = timeStrToMins(info.time)
            let insertAfterIdx = -1
            for (let i = 0; i < sortedRouteOrders.length; i++) {
              const stopMins = timeStrToMins(MOCK_STOP_TIMES[i] || "")
              if (stopMins <= newTimeMins) insertAfterIdx = i
              else break
            }
            const prevSeq = insertAfterIdx >= 0
              ? (sortedRouteOrders[insertAfterIdx].routeSequence ?? insertAfterIdx + 1)
              : 0
            const nextIdx = insertAfterIdx + 1
            const nextSeq = nextIdx < sortedRouteOrders.length
              ? (sortedRouteOrders[nextIdx].routeSequence ?? nextIdx + 1)
              : prevSeq + 1
            const newSeq = (prevSeq + nextSeq) / 2

            const hubId = routeOrders[0]?.hubId ?? ""
            const newOrder: ExtractionOrder = {
              id: `load-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              customerId: "terminal",
              customerName: info.terminalName,
              shipToAddress: info.terminalAddress,
              latitude: info.terminalLat,
              longitude: info.terminalLng,
              status: "assigned",
              volume: info.gal,
              scheduledDate: info.time,
              zoneId: "",
              hubId,
              city: "",
              state: "",
              zip: "",
              tankSize: 0,
              currentLevel: 0,
              daysUntilEmpty: 0,
              priority: "Medium",
              lastDelivery: "",
              zone: "",
              routeId,
              routeSequence: newSeq,
              orderType: "L",
            }

            const updated = {
              ...addedLoadOrders,
              [routeId]: [...(addedLoadOrders[routeId] ?? []), newOrder],
            }
            setAddedLoadOrders(updated)
            onAddedLoadOrdersChange?.(updated)

            setRecentlyAddedOrderId(newOrder.id)
            setTimeout(() => setRecentlyAddedOrderId(null), 4500)

            const route = mockRoutes.find((r) => r.id === routeId)
            const driverFirstName = (route?.driverName ?? "Driver").split(" ")[0]
            onShowToast?.(driverFirstName)

            setIsAddLoadModalOpen(false)
            setActiveRouteIdForModal(null)
          }}
        />
      )}
    </div>
  )
}
