"use client"

import { X, ChevronRight, ChevronDown, MoreVertical, Home, Truck, Caravan, TriangleAlert, Plus, ArrowUp, ArrowDown, Info, Search, UserCheck, Check, ChevronsLeft, ExternalLink, Sparkles, Package, Route } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes, mockHubs } from "@/lib/mock-data"
import { useState, useRef, useEffect } from "react"
import { useSettings } from "@/contexts/settings-context"
import { base1Infrastructure } from "@/lib/infrastructure-data"
import { AddLoadOrderModal } from "@/components/add-load-order-modal"
import { CreateOrderModal, type CreateOrderSubmit } from "@/components/create-order-modal"
import { validateRouteCapacity, getShortProductName, type ValidationResult } from "@/lib/capacity-validation"
import { TRUCK_CAPACITIES } from "@/lib/truck-data"
import { MergeModal } from "@/components/merge-modal"
import { BreakdownSheet } from "@/components/breakdown-sheet"
import { RouteSummarySheet } from "@/components/route-summary-sheet"
import { TruckDetailsSheet } from "@/components/truck-details-sheet"
import { BalanceTableModal } from "@/components/balance-table-modal"
import { InitialInventoryModal, aggregateCompartmentValues } from "@/components/initial-inventory-modal"

interface LassoWorkspaceSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedOrders: ExtractionOrder[]
  selectedRouteIds: string[]
  checkedRouteIds: string[]
  onCheckedRoutesChange: (routeIds: string[]) => void
  hoveredRouteId: string | null
  onHoveredRouteChange: (routeId: string | null) => void
  onHoveredOrderChange?: (orderId: string | null) => void
  onAddedLoadOrdersChange?: (added: Record<string, ExtractionOrder[]>) => void
  onAddedDeliveryOrdersChange?: (added: Record<string, ExtractionOrder[]>) => void
  onShowToast?: (driverName: string) => void
  onShowMessage?: (message: string) => void
  initialExpandedRouteIds?: string[]
  /** When set (by the map-pin → Create Order flow), opens the modal prefilled to this shipto with no originating route. */
  createOrderPrefillShipToId?: string | null
  onClearCreateOrderPrefillShipToId?: () => void
  /** Called when a new synthetic route is created (driver-from-modal flow) so page.tsx can register it. */
  onAddSelectedRouteId?: (routeId: string) => void
  /** Modal 3 (side sheet): called when Create Order opens so page.tsx can collapse the workspace. */
  onCreateOrderSideSheetOpen?: () => void
  /** Modal 3 (side sheet): called when Create Order closes so page.tsx can revert map controls. */
  onCreateOrderSideSheetClose?: () => void
  /** Modal 3: orders created via the side sheet flow (owned by page.tsx, merged into unassigned list). */
  externalUnassignedOrders?: ExtractionOrder[]
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
  productBreakdown?: { product: string; volume: number }[]
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
  { id: "H-205", name: "H-205 - 2021 Peterbilt Tanker",        badge: "Tank Wagon", capacity: "4,200 gal", compartments: "3 Compartments" },
  { id: "H-310", name: "H-310 - 2020 Freightliner Tanker",     badge: "Truck",      capacity: "4,600 gal", compartments: "4 Compartments" },
  { id: "H-442", name: "H-442 - 2018 Mack Tanker",             badge: "Tank Wagon", capacity: "2,600 gal", compartments: "4 Compartments" },
  { id: "H-556", name: "H-556 - 2022 International Tanker",     badge: "Truck",      capacity: "5,000 gal", compartments: "3 Compartments" },
  { id: "TR289", name: "TR289 - TR 289 2022 Freightliner",          badge: "Tractor",    capacity: "",          compartments: "" },
  { id: "TR291", name: "TR291 - TR 291 International ProStar",      badge: "Tractor",    capacity: "",          compartments: "" },
  { id: "TR298", name: "TR298 - TR 298 2021 Kenworth T680",         badge: "Tractor",    capacity: "",          compartments: "" },
  { id: "TR290", name: "TR290 - TR 290 2020 Peterbilt 579",         badge: "Tractor",    capacity: "",          compartments: "" },
  { id: "TR293", name: "TR293 - TR 293 2019 Mack Anthem",           badge: "Tractor",    capacity: "",          compartments: "" },
  { id: "TR297", name: "TR297 - TR 297 2023 Volvo VNL 860",         badge: "Tractor",    capacity: "",          compartments: "" },
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
  { id: "TT-13",  name: "TT-13 - Transport Trailer 13",                   capacity: "",          compartments: ""                },
  { id: "TT-79",  name: "TT-79 - Transport Trailer 79",                   capacity: "",          compartments: ""                },
  { id: "TT-9",   name: "TT-9 - Transport Trailer 9",                     capacity: "",          compartments: ""                },
  { id: "TT-108", name: "TT-108 - Transport Trailer 108",                 capacity: "",          compartments: ""                },
  { id: "TT-110", name: "TT-110 - Transport Trailer 110",                 capacity: "",          compartments: ""                },
  { id: "TT-16",  name: "TT-16 - Transport Trailer 16",                   capacity: "",          compartments: ""                },
]

type DriverItem = { id: string; name: string; orderCount: number }

const DRIVERS: DriverItem[] = [
  { id: "driver-1", name: "Mark Ruffalo", orderCount: 8 },
  { id: "driver-2", name: "Dwayne Johnson", orderCount: 8 },
  { id: "driver-3", name: "Jessica Harper", orderCount: 5 },
  { id: "driver-4", name: "Kyle Reese", orderCount: 7 },
  { id: "driver-5", name: "Benedict Cumberbatch", orderCount: 0 },
  { id: "driver-6", name: "Valerie Thomas", orderCount: 7 },
]

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

const parseGal = (s: string) => parseInt(s.replace(/,/g, "")) || 0
const parseComp = (s: string) => parseInt(s) || 0

function getCumulativeCapacity(truck: TruckItem | null, t1: TrailerItem | null, t2: TrailerItem | null) {
  const gal = (truck ? parseGal(truck.capacity) : 0) + (t1 ? parseGal(t1.capacity) : 0) + (t2 ? parseGal(t2.capacity) : 0)
  const comp = (truck ? parseComp(truck.compartments) : 0) + (t1 ? parseComp(t1.compartments) : 0) + (t2 ? parseComp(t2.compartments) : 0)
  return { totalGal: gal.toLocaleString() + " gal", totalCompartments: comp }
}

const SpecsDot = () => <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#4A4A4A", flexShrink: 0, margin: "0 6px" }} />
const TypeBadge = ({ label }: { label: string }) => (
  <span style={{ fontSize: 12, fontWeight: 500, color: "#E5E5E5", backgroundColor: "#262626", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>{label}</span>
)

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

// ─── Stop Chip (for chip banner) ────────────────────────────────────────────────

function StopChip({ stopIndex, onClick }: { stopIndex: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        height: 28,
        borderRadius: 4,
        background: hovered ? "rgba(255,255,255,0.06)" : "none",
        border: "none",
        cursor: "pointer",
        transition: "background-color 150ms ease",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 400, color: "#e5e5e5", lineHeight: "20px" }}>Stop</span>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: hovered ? "#737373" : "#a3a3a3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 500,
          color: "#171717",
          lineHeight: 1,
          transition: "background-color 150ms ease",
        }}
      >
        {stopIndex}
      </div>
    </button>
  )
}

// ─── Collapsed Route Card ──────────────────────────────────────────────────────

function RouteCardCollapsed({
  color,
  driverName,
  orderCount,
  plannedQty,
  truckName,
  truckCapacity,
  compartmentCount,
  productCount,
  isHovered,
  hasBanner = false,
  hasTruck = true,
  hasFuelCapacity = true,
  trailer1 = null,
  trailer2 = null,
  onTruckClick,
  isTruckDropdownOpen = false,
  onAddTrailer,
  isTrailerDropdownOpen = false,
  onDriverClick,
  isDriverDropdownOpen = false,
  onMenuClick,
  isMenuOpen = false,
  isPublished = true,
  onViewRoute,
  onRemoveRoute,
  onDriverSelect,
  currentDriverId,
  onOptimise,
  onViewSummary,
  isSummaryOpen = false,
}: {
  color: string
  driverName: string
  orderCount: number
  plannedQty: number
  truckName: string
  truckCapacity: string
  compartmentCount: number
  productCount: number
  isHovered: boolean
  hasBanner?: boolean
  hasTruck?: boolean
  hasFuelCapacity?: boolean
  trailer1?: TrailerItem | null
  trailer2?: TrailerItem | null
  onTruckClick?: (rect: DOMRect) => void
  isTruckDropdownOpen?: boolean
  onAddTrailer?: () => void
  isTrailerDropdownOpen?: boolean
  onDriverClick?: (rect: DOMRect) => void
  isDriverDropdownOpen?: boolean
  onMenuClick?: () => void
  isMenuOpen?: boolean
  isPublished?: boolean
  onViewRoute?: () => void
  onRemoveRoute?: () => void
  onDriverSelect?: (driver: DriverItem) => void
  currentDriverId?: string
  onOptimise?: () => void
  onViewSummary?: (cardLeft: number, cardRight: number, fabTop: number) => void
  isSummaryOpen?: boolean
}) {
  // Determine config
  const config: "A" | "B" | "C" | "D" | "E" = !hasTruck ? "E"
    : !hasFuelCapacity ? "D"
    : trailer1 && trailer2 ? "C"
    : trailer1 ? "B"
    : "A"

  // Cumulative capacity for configs B/C
  const truckItem = hasTruck ? TRUCKS.find(t => t.name === truckName) ?? null : null
  const cumulative = (config === "B" || config === "C") ? getCumulativeCapacity(truckItem, trailer1, trailer2) : null

  // Outline pill shared styles
  const pillBorder = (isOpen: boolean) => isOpen ? "1px solid #737373" : "1px solid #333"
  const pillShadow = (isOpen: boolean) => isOpen ? "0px 0px 0px 3px rgba(115,115,115,0.5)" : "0px 1px 2px 0px rgba(0,0,0,0.05)"

  // Vertical divider inside unified pill
  const PillDivider = () => <div style={{ width: 1, alignSelf: "stretch", backgroundColor: "#333", flexShrink: 0 }} />

  return (
    <div
      style={{
        borderRadius: hasBanner ? "4px 4px 0px 0px" : "4px 4px 0px 4px",
        boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
    <div
      style={{
        backgroundColor: isHovered ? "#282828" : "#1F1F1F",
        padding: "16px 16px 12px 20px",
        transition: "background-color 150ms ease",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      {/* Inner — all card content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Equipment zone — Row 1 + Row 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Row 1 — Equipment pills */}
          {config === "E" ? (
            /* Config E — No truck: dimmed "Select Truck" pill */
            <button
              data-truck-dropdown
              onClick={(e) => { e.stopPropagation(); onTruckClick?.(e.currentTarget.getBoundingClientRect()) }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, height: 28,
                paddingLeft: 8, paddingRight: 10,
                border: pillBorder(isTruckDropdownOpen), borderRadius: 4, background: "none",
                cursor: "pointer", boxShadow: pillShadow(isTruckDropdownOpen),
                alignSelf: "flex-start", opacity: 0.6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1" }}
              onMouseLeave={(e) => { if (!isTruckDropdownOpen) e.currentTarget.style.opacity = "0.6" }}
            >
              <Truck size={16} color="#FAFAFA" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap" }}>Select Truck</span>
            </button>
          ) : config === "D" ? (
            /* Config D — Truck pill + ghost "+ Add Trailer" */
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                data-truck-dropdown
                onClick={(e) => { e.stopPropagation(); onTruckClick?.(e.currentTarget.getBoundingClientRect()) }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, height: 28,
                  paddingLeft: 8, paddingRight: 10,
                  border: pillBorder(isTruckDropdownOpen), borderRadius: 4, background: "none",
                  cursor: "pointer", boxShadow: pillShadow(isTruckDropdownOpen),
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (!isTruckDropdownOpen) e.currentTarget.style.backgroundColor = "#404040" }}
                onMouseLeave={(e) => { if (!isTruckDropdownOpen) e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <Truck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{truckName}</span>
              </button>
              <button
                data-trailer-dropdown
                onClick={(e) => { e.stopPropagation(); onAddTrailer?.() }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, height: 28,
                  paddingLeft: 8, paddingRight: 10,
                  border: "none", borderRadius: 4, background: "none",
                  cursor: "pointer", opacity: 0.6, flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1" }}
                onMouseLeave={(e) => { if (!isTrailerDropdownOpen) e.currentTarget.style.opacity = "0.6" }}
              >
                <Plus size={16} color="#FAFAFA" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap" }}>Add Trailer</span>
              </button>
            </div>
          ) : (config === "B" || config === "C") ? (
            /* Config B/C — Unified pill: truck | trailer(s) */
            <div
              data-truck-dropdown
              onClick={(e) => { e.stopPropagation(); onTruckClick?.(e.currentTarget.getBoundingClientRect()) }}
              style={{
                display: "flex", alignItems: "center", height: 28,
                border: pillBorder(isTruckDropdownOpen || isTrailerDropdownOpen), borderRadius: 4, background: "none",
                cursor: "pointer", boxShadow: pillShadow(isTruckDropdownOpen || isTrailerDropdownOpen),
                overflow: "hidden", maxWidth: "100%",
              }}
              onMouseEnter={(e) => { if (!isTruckDropdownOpen && !isTrailerDropdownOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "#404040" }}
              onMouseLeave={(e) => { if (!isTruckDropdownOpen && !isTrailerDropdownOpen) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
            >
              {/* Truck section */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, paddingRight: 8 }}>
                <Truck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{truckName}</span>
              </div>
              <PillDivider />
              {/* Trailer 1 section */}
              <div
                data-trailer-dropdown
                onClick={(e) => { e.stopPropagation(); onAddTrailer?.() }}
                style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, paddingRight: 8, cursor: "pointer" }}
              >
                <Caravan size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trailer1?.name ?? "Trailer"}</span>
              </div>
              {config === "C" && trailer2 && (
                <>
                  <PillDivider />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, paddingRight: 10, cursor: "pointer" }}>
                    <Caravan size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trailer2.name}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Config A — Truck only pill */
            <button
              data-truck-dropdown
              onClick={(e) => { e.stopPropagation(); onTruckClick?.(e.currentTarget.getBoundingClientRect()) }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, height: 28,
                paddingLeft: 8, paddingRight: 10,
                border: pillBorder(isTruckDropdownOpen), borderRadius: 4, background: "none",
                cursor: "pointer", boxShadow: pillShadow(isTruckDropdownOpen),
                alignSelf: "flex-start", maxWidth: "100%",
              }}
              onMouseEnter={(e) => { if (!isTruckDropdownOpen) e.currentTarget.style.backgroundColor = "#404040" }}
              onMouseLeave={(e) => { if (!isTruckDropdownOpen) e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <Truck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{truckName}</span>
            </button>
          )}

          {/* Row 2 — Capacity / info line */}
          {config === "E" ? (
            <span style={{ fontSize: 14, fontWeight: 400, color: "#737373", lineHeight: "20px" }}>No Truck selected yet.</span>
          ) : config === "D" ? (
            <span style={{ fontSize: 14, fontWeight: 400, color: "#737373", lineHeight: "20px" }}>Selected truck has no fuel capacity</span>
          ) : (
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>
                {cumulative ? cumulative.totalGal : truckCapacity}
              </span>
              {(cumulative ? cumulative.totalCompartments : compartmentCount) > 0 && (
                <>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#A3A3A3", flexShrink: 0, margin: "0 6px" }} />
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>
                    {cumulative ? cumulative.totalCompartments : compartmentCount} Compartments
                  </span>
                </>
              )}
              {productCount > 0 && (
                <>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#A3A3A3", flexShrink: 0, margin: "0 6px" }} />
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>
                    {productCount} Products
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderBottom: "1px solid #282828" }} />

        {/* Section B — Driver button + Orders badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Driver button — icon-only if no driver, icon+label if assigned */}
          {driverName ? (
            <button
              data-driver-dropdown
              onClick={(e) => { e.stopPropagation(); onDriverClick?.(e.currentTarget.getBoundingClientRect()) }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 28,
                paddingLeft: 8,
                paddingRight: 10,
                border: isDriverDropdownOpen ? "1px solid #737373" : "1px solid #333",
                borderRadius: 4,
                background: "none",
                cursor: "pointer",
                boxShadow: isDriverDropdownOpen
                  ? "0px 0px 0px 3px rgba(115,115,115,0.5)"
                  : "0px 1px 2px 0px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => { if (!isDriverDropdownOpen) e.currentTarget.style.backgroundColor = "#404040" }}
              onMouseLeave={(e) => { if (!isDriverDropdownOpen) e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <UserCheck size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap" }}>
                {driverName}
              </span>
            </button>
          ) : (
            <button
              data-driver-dropdown
              onClick={(e) => { e.stopPropagation(); onDriverClick?.(e.currentTarget.getBoundingClientRect()) }}
              style={{
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: isDriverDropdownOpen ? "1px solid #737373" : "1px solid #333",
                borderRadius: 4,
                background: "none",
                cursor: "pointer",
                boxShadow: isDriverDropdownOpen
                  ? "0px 0px 0px 3px rgba(115,115,115,0.5)"
                  : "0px 1px 2px 0px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => { if (!isDriverDropdownOpen) e.currentTarget.style.backgroundColor = "#404040" }}
              onMouseLeave={(e) => { if (!isDriverDropdownOpen) e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <UserCheck size={16} color="#A3A3A3" />
            </button>
          )}
          {/* Orders badge */}
          <span
            style={{
              backgroundColor: "#111",
              padding: "2px 8px",
              borderRadius: 4,
            fontSize: 14,
            fontWeight: 500,
            color: "#FAFAFA",
            lineHeight: "20px",
            whiteSpace: "nowrap",
          }}
        >
          {orderCount} Orders
        </span>
      </div>
      </div>
      {/* 3-dot menu — absolute top-right, hidden by default, visible on card hover */}
      {/* FAB — Optimise + 3-dot menu, appears on card hover.
          (ScanEye summary button removed — Route Summary is now reached via the
          3-dot dropdown's "View Route Summary" item.) */}
      <div
        data-route-menu
        style={{
          position: "absolute", top: 8, right: 8,
          opacity: isSummaryOpen
            ? 0
            : (isHovered || isMenuOpen || isTruckDropdownOpen || isTrailerDropdownOpen || isDriverDropdownOpen) ? 1 : 0,
          transition: "opacity 150ms ease",
          display: "flex", alignItems: "center",
          backgroundColor: "#1B1B1B",
          border: "1px solid #282828",
          borderRadius: 4,
          padding: 4,
          gap: 4,
        }}
      >
        {/* Optimise Route icon button — hidden when no truck */}
        {hasTruck && (
        <div
          style={{ position: "relative" }}
          onMouseEnter={(e) => {
            const tip = e.currentTarget.querySelector<HTMLElement>("[data-fab-tooltip]")
            if (tip) tip.style.display = "flex"
            const btn = e.currentTarget.querySelector<HTMLElement>("button")
            if (btn) btn.style.backgroundColor = "#333"
          }}
          onMouseLeave={(e) => {
            const tip = e.currentTarget.querySelector<HTMLElement>("[data-fab-tooltip]")
            if (tip) tip.style.display = "none"
            const btn = e.currentTarget.querySelector<HTMLElement>("button")
            if (btn) btn.style.backgroundColor = "transparent"
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onOptimise?.() }}
            style={{
              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 2, border: "none", background: "transparent", cursor: "pointer",
              color: "#FAFAFA", padding: 0,
            }}
          >
            <Sparkles size={16} />
          </button>
          <div data-fab-tooltip style={{
            display: "none", position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
            flexDirection: "column", alignItems: "center", pointerEvents: "none", zIndex: 1001,
          }}>
            <div style={{ backgroundColor: "#E5E5E5", color: "#111", fontSize: 12, padding: "6px 12px", borderRadius: 4, whiteSpace: "nowrap", fontFamily: "Geist, sans-serif" }}>
              Optimise Route
            </div>
            <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #E5E5E5" }} />
          </div>
        </div>
        )}
        {/* View Route icon removed from FAB (M6): accessible only from the 3-dot dropdown. */}
        {/* 3-dot icon button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onMenuClick?.() }}
            style={{
              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 2, border: "none", backgroundColor: isMenuOpen ? "#333" : "transparent",
              cursor: "pointer", color: "#FAFAFA", padding: 0,
            }}
            onMouseEnter={(e) => { if (!isMenuOpen) e.currentTarget.style.backgroundColor = "#333" }}
            onMouseLeave={(e) => { if (!isMenuOpen) e.currentTarget.style.backgroundColor = "transparent" }}
          >
            <MoreVertical size={16} />
          </button>
          {isMenuOpen && (
            <div
              data-route-menu
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                width: 180,
                zIndex: 999,
                backgroundColor: "#1A1A1A",
                border: "1px solid #333",
                borderRadius: 4,
                boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)",
                padding: 4,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Optimize Route — hidden when no truck */}
              {hasTruck && (
              <div
                onClick={(e) => { e.stopPropagation(); onOptimise?.() }}
                style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333"; e.currentTarget.style.borderRadius = "2px" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderRadius = "4px" }}
              >
                Optimize Route
              </div>
              )}
              {/* Driver — sub-trigger with submenu */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={(e) => {
                  const item = e.currentTarget.querySelector<HTMLElement>("[data-driver-subtrigger]")
                  if (item) { item.style.backgroundColor = "#333"; item.style.borderRadius = "2px" }
                  const sub = e.currentTarget.querySelector<HTMLElement>("[data-driver-submenu]")
                  if (sub) sub.style.display = "flex"
                }}
                onMouseLeave={(e) => {
                  const item = e.currentTarget.querySelector<HTMLElement>("[data-driver-subtrigger]")
                  if (item) { item.style.backgroundColor = "transparent"; item.style.borderRadius = "4px" }
                  const sub = e.currentTarget.querySelector<HTMLElement>("[data-driver-submenu]")
                  if (sub) sub.style.display = "none"
                }}
              >
                <div
                  data-driver-subtrigger
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                    borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5",
                    lineHeight: "20px", cursor: "pointer",
                  }}
                >
                  <span style={{ flex: 1 }}>Driver</span>
                  <ChevronRight size={16} color="#E5E5E5" />
                </div>
                {/* Driver submenu — positioned to the left */}
                <div
                  data-driver-submenu
                  data-route-menu
                  style={{
                    display: "none", position: "absolute", top: -5, right: "calc(100% + 4px)",
                    width: 260, flexDirection: "column", backgroundColor: "#1A1A1A",
                    border: "1px solid #333", borderRadius: 4,
                    boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)",
                    overflow: "hidden", zIndex: 1000,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                    <Search size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>Search Drivers</span>
                  </div>
                  <div style={{ padding: 4 }}>
                    {DRIVERS.map((driver) => {
                      const isSelected = driver.id === currentDriverId
                      return (
                        <div
                          key={driver.id}
                          onClick={(e) => { e.stopPropagation(); onDriverSelect?.(driver) }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                            borderRadius: 4, cursor: "pointer", fontSize: 14, fontWeight: 400,
                            color: "#E5E5E5", lineHeight: "20px",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333"; e.currentTarget.style.borderRadius = "2px" }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderRadius = "4px" }}
                        >
                          <span style={{ flex: 1 }}>{driver.name} ({driver.orderCount})</span>
                          {isSelected && <Check size={16} color="#E5E5E5" style={{ flexShrink: 0 }} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              {/* Separator */}
              <div style={{ height: 6, display: "flex", alignItems: "center", padding: "0 0" }}>
                <div style={{ height: 1, width: "100%", backgroundColor: "#333" }} />
              </div>
              {/* View Route Summary — opens BalanceTableModal */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onViewSummary?.(0, 0, 0)
                }}
                style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333"; e.currentTarget.style.borderRadius = "2px" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderRadius = "4px" }}
              >
                View Route Summary
              </div>
              {/* View Route Details — only for published routes */}
              {isPublished && (
                <div
                  onClick={(e) => { e.stopPropagation(); onViewRoute?.() }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333"; e.currentTarget.style.borderRadius = "2px" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderRadius = "4px" }}
                >
                  <span style={{ flex: 1 }}>View Route Details</span>
                  <ExternalLink size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                </div>
              )}
              {/* Remove — with hover tooltip */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={(e) => {
                  const item = e.currentTarget.querySelector<HTMLElement>("[data-remove-item]")
                  if (item) { item.style.backgroundColor = "#333"; item.style.borderRadius = "2px" }
                  const tip = e.currentTarget.querySelector<HTMLElement>("[data-remove-tooltip]")
                  if (tip) tip.style.display = "flex"
                }}
                onMouseLeave={(e) => {
                  const item = e.currentTarget.querySelector<HTMLElement>("[data-remove-item]")
                  if (item) { item.style.backgroundColor = "transparent"; item.style.borderRadius = "4px" }
                  const tip = e.currentTarget.querySelector<HTMLElement>("[data-remove-tooltip]")
                  if (tip) tip.style.display = "none"
                }}
              >
                <div
                  data-remove-item
                  onClick={(e) => { e.stopPropagation(); onRemoveRoute?.() }}
                  style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                >
                  Remove
                </div>
                {/* Tooltip — left side */}
                <div
                  data-remove-tooltip
                  style={{
                    display: "none", position: "absolute", right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)",
                    alignItems: "center", gap: 0, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 1001,
                  }}
                >
                  <div style={{
                    backgroundColor: "#E5E5E5", color: "#111", fontSize: 12, fontWeight: 400,
                    padding: "6px 12px", borderRadius: 4, lineHeight: "16px", fontFamily: "Geist, sans-serif",
                  }}>
                    Remove Route from Workspace
                  </div>
                  {/* Arrow pointing right */}
                  <div style={{
                    width: 0, height: 0,
                    borderTop: "6px solid transparent", borderBottom: "6px solid transparent",
                    borderLeft: "6px solid #E5E5E5", flexShrink: 0,
                  }} />
                </div>
              </div>
              {/* Unassign Route — destructive on hover */}
              <div
                style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.2)"; e.currentTarget.style.color = "#F87171"; e.currentTarget.style.borderRadius = "2px" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#E5E5E5"; e.currentTarget.style.borderRadius = "4px" }}
              >
                Unassign Route
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* View Route Summary row */}
    <div
      style={{
        backgroundColor: "#282828",
        padding: "4px 12px 4px 12px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onViewSummary?.(0, 0, 0) }}
        style={{ display: "flex", alignItems: "center", gap: 8, height: 28, paddingLeft: 8, paddingRight: 10, borderRadius: 4, cursor: "pointer" }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333" }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
      >
        <Route size={16} color="#FAFAFA" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px" }}>
          View Route Summary
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
function TruckHubStartRow({ truckName, hubName, onTruckChange, validation, hasLoadOrders, onViewTruckDetails }: { truckName: string | null; hubName: string; onTruckChange?: (truck: TruckItem) => void; validation?: ValidationResult | null; hasLoadOrders?: boolean; onViewTruckDetails?: (cardLeft: number, cardRight: number, btnTop: number) => void }) {
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
      <TruckHubCard truckNameProp={truckName} hubName={hubName} onTruckChange={onTruckChange} validation={validation} hasLoadOrders={hasLoadOrders} onViewTruckDetails={onViewTruckDetails} />
    </div>
  )
}

function TruckHubCard({ truckNameProp, hubName, onTruckChange, validation, hasLoadOrders, onViewTruckDetails }: { truckNameProp: string | null; hubName: string; onTruckChange?: (truck: TruckItem) => void; validation?: ValidationResult | null; hasLoadOrders?: boolean; onViewTruckDetails?: (cardLeft: number, cardRight: number, btnTop: number) => void }) {
  const [selectedTruck, setSelectedTruck] = useState<TruckItem | null>(
    () => (truckNameProp ? TRUCKS.find((t) => t.name === truckNameProp) ?? null : null)
  )
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

  // SpecsDot and TypeBadge are now module-level

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
                                {t.capacity && (
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                  </div>
                                )}
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
                                {t.capacity && (
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                  </div>
                                )}
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
                                    {t.capacity && <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span></div>}
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
                                    {t.capacity && <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span></div>}
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
          {/* Zone A: L2 info under truck row */}
          {validation?.zoneA && validation.zoneA.color !== "none" && validation.zoneA.lines.length > 0 && (
            <div style={{ paddingLeft: 12, paddingTop: 4, paddingBottom: 8 }}>
              {validation.zoneA.lines.map((line, i) => (
                <div key={i} style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: validation.zoneA.color === "accent" ? "#818cf8" : "#eab308",
                  lineHeight: "20px",
                }}>
                  {line}
                </div>
              ))}
            </div>
          )}
          {/* "No fuel loaded" — only when no validation AND no load orders */}
          {(selectedTruck || truckNameProp) && hasLoadOrders === false && !validation && (
            <div style={{ padding: "2px 12px 2px" }}>
              <span style={{ fontSize: 13, fontWeight: 400, color: "#eab308" }}>
                No fuel loaded. Add a load order to supply this route.
              </span>
            </div>
          )}
          {/* Truck message for healthy state */}
          {validation && validation.truckMessage && validation.zoneA.color === "none" && (
            <div style={{ padding: "2px 12px 2px" }}>
              <span style={{ fontSize: 13, fontWeight: 400, color: "#eab308" }}>
                {validation.truckMessage}
              </span>
            </div>
          )}
          {/* View Truck Details — ghost button below truck row + messages.
              4px top gap from preceding element via padding. Only rendered when a truck is selected. */}
          {(selectedTruck || truckNameProp) && (
            <div style={{ padding: "4px 8px 0" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Anchor to the BUTTON itself (not the route card) so the sheet sits
                  // right next to where the user clicked, not way off at the card's left edge.
                  const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  onViewTruckDetails?.(
                    btnRect.left,
                    btnRect.right,
                    btnRect.top,
                  )
                }}
                style={{
                  height: 32,
                  padding: "8px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "#E5E5E5",
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "Geist, sans-serif",
                  lineHeight: "20px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                View Truck Details
              </button>
            </div>
          )}
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
    <div style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
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
  validation,
  hasLoadOrders,
  onOpenModal,
  onOpenCreateOrderModal,
  onTruckChange,
  onReorder,
  routeId,
  onPlannedQtyClick,
  detailsOpenOrderId,
  onHoverOrder,
  checkedScheduledOrderIds,
  onToggleScheduledOrder,
  onBreakdownClick,
  breakdownOpenOrderId,
  onViewTruckDetails,
}: {
  orders: ExtractionOrder[]
  color?: string
  hubName: string
  truckName: string | null
  driverName: string
  recentlyAddedOrderId?: string | null
  validation: ValidationResult | null
  hasLoadOrders: boolean
  onOpenModal: () => void
  onOpenCreateOrderModal?: () => void
  onTruckChange?: (truck: TruckItem) => void
  onReorder?: (fromIdx: number, toIdx: number) => void
  routeId?: string
  onPlannedQtyClick?: (order: ExtractionOrder, anchorY: number, anchorX: number) => void
  detailsOpenOrderId?: string | null
  onHoverOrder?: (orderId: string | null) => void
  checkedScheduledOrderIds?: string[]
  onToggleScheduledOrder?: (orderId: string) => void
  onBreakdownClick?: (orderId: string, cardLeft: number, cardRight: number, fabTop: number) => void
  breakdownOpenOrderId?: string | null
  onViewTruckDetails?: (cardLeft: number, cardRight: number, btnTop: number) => void
}) {
  const { orderCardView } = useSettings()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  // Inline "Create Order" + overlay — which gaps (keyed by the orderId above the gap) are currently active
  const [activeGapIds, setActiveGapIds] = useState<Set<string>>(new Set())
  const gapLeaveTimers = useRef<Map<string, number>>(new Map())
  const activateGap = (orderId: string) => {
    const existing = gapLeaveTimers.current.get(orderId)
    if (existing) {
      clearTimeout(existing)
      gapLeaveTimers.current.delete(orderId)
    }
    setActiveGapIds((prev) => (prev.has(orderId) ? prev : new Set(prev).add(orderId)))
  }
  const deactivateGap = (orderId: string) => {
    const existing = gapLeaveTimers.current.get(orderId)
    if (existing) clearTimeout(existing)
    const timeoutId = window.setTimeout(() => {
      setActiveGapIds((prev) => {
        if (!prev.has(orderId)) return prev
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
      gapLeaveTimers.current.delete(orderId)
    }, 120)
    gapLeaveTimers.current.set(orderId, timeoutId)
  }

  // Change 6: Build a map of delivery stop index → single warning string (comma-separated short names)
  const stopWarnings: Record<number, string> = {}
  if (validation?.l3) {
    const grouped: Record<number, { products: string[]; stopName: string }> = {}
    for (const issue of validation.l3) {
      if (!grouped[issue.stopIndex]) grouped[issue.stopIndex] = { products: [], stopName: issue.stopName }
      grouped[issue.stopIndex].products.push(getShortProductName(issue.product))
    }
    for (const [idx, g] of Object.entries(grouped)) {
      stopWarnings[Number(idx)] = `${g.products.join(", ")} will run out before this stop`
    }
  }

  // Track unified stop counter to match validation stop indices (loads + deliveries)
  let stopIdx = 0

  return (
    <div style={{ paddingTop: 8, paddingBottom: 8, display: "flex", flexDirection: "column" }}>

      {/* Starting hub: truck + hub combined, arm → down only */}
      <TruckHubStartRow truckName={truckName} hubName={hubName} onTruckChange={onTruckChange} validation={validation} hasLoadOrders={hasLoadOrders} onViewTruckDetails={onViewTruckDetails} />

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
          // Track unified stop index for validation matching (loads + deliveries)
          const isDelivery = !order.orderType || order.orderType === "D"
          const isTransfer = order.orderType === "T"
          if (!isTransfer) stopIdx++
          const currentStopIdx = stopIdx

          // Check if we need a mid-route "Add Load Order" CTA before this stop
          const showMidRouteCTA = isDelivery
            && validation?.firstFailingStopIndex != null
            && currentStopIdx === validation.firstFailingStopIndex
            && orders.some((o) => o.orderType === "L") // only if there's already a load (otherwise the top banner handles it)

          // Use MOCK_STOP_TIMES for ALL order types (load + delivery).
          // Exception: orders added through the inline "Create Order" flow carry their picked
          // time on `scheduledDate` as an "HH:MM AM/PM" string — surface that directly.
          const explicitTime = /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(order.scheduledDate ?? "")
            ? order.scheduledDate
            : null
          const stopTime = explicitTime
            || MOCK_STOP_TIMES[(Math.floor(order.routeSequence ?? idx + 1)) - 1]
            || MOCK_STOP_TIMES[idx]
            || "—"

          const warning = isDelivery ? stopWarnings[currentStopIdx] : undefined

          // Only the hovered card lights its own bottom-edge + (the gap below it).
          // The + between cards N and N+1 lives at the bottom of card N — so reach it via card N's hover.
          const handleCardEnter = () => activateGap(order.id)
          const handleCardLeave = () => deactivateGap(order.id)
          const gapVisible = activeGapIds.has(order.id)

          return (
            <div
              key={order.id}
              style={{ position: "relative" }}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
            >
              {showMidRouteCTA && (
                <MidRouteAddLoadCTA onOpenModal={onOpenModal} />
              )}
              {(() => {
                const sharedProps = {
                  order,
                  idx,
                  stopTime,
                  isNew: order.id === recentlyAddedOrderId,
                  warning,
                  draggable: true as const,
                  isDragOver: dragOverIdx === idx,
                  onDragStart: (e: React.DragEvent) => { setDragIdx(idx); e.dataTransfer.effectAllowed = "move" },
                  onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIdx(idx) },
                  onDrop: (e: React.DragEvent) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { onReorder?.(dragIdx, idx) }; setDragIdx(null); setDragOverIdx(null) },
                  onDragEnd: () => { setDragIdx(null); setDragOverIdx(null) },
                  stopIndex: currentStopIdx,
                  routeId,
                  onPlannedQtyClick,
                  isDetailsOpen: detailsOpenOrderId === order.id,
                  onHoverOrder,
                  isChecked: checkedScheduledOrderIds?.includes(order.id) ?? false,
                  onToggleCheck: () => onToggleScheduledOrder?.(order.id),
                  hasLoadOrders: orders.some((o) => o.orderType === "L"),
                  onBreakdownClick,
                  isBreakdownOpen: order.id === breakdownOpenOrderId,
                }
                return orderCardView === "detailed"
                  ? <OrderStopRowDetailed {...sharedProps} />
                  : <OrderStopRow {...sharedProps} />
              })()}
              {onOpenCreateOrderModal && (
                <InsertOrderOverlay
                  visible={gapVisible}
                  onActivate={() => activateGap(order.id)}
                  onDeactivate={() => deactivateGap(order.id)}
                  onClick={onOpenCreateOrderModal}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Bridge gap between orders and ending hub */}
      <SeqLineBridge />

      {/* Ending hub: arm → up only. Hovering the hub also reveals the + overlay below the LAST order. */}
      {(() => {
        const lastOrderId = orders[orders.length - 1]?.id
        if (!lastOrderId) {
          return <EndHubRow hubName={hubName} />
        }
        return (
          <div
            onMouseEnter={() => activateGap(lastOrderId)}
            onMouseLeave={() => deactivateGap(lastOrderId)}
          >
            <EndHubRow hubName={hubName} />
          </div>
        )
      })()}
    </div>
  )
}

/** Inline + overlay rendered below an order card. Visible on hover; click → open Create Order modal. */
function InsertOrderOverlay({
  visible,
  onActivate,
  onDeactivate,
  onClick,
}: {
  visible: boolean
  onActivate: () => void
  onDeactivate: () => void
  onClick: () => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div
      onMouseEnter={onActivate}
      onMouseLeave={() => {
        onDeactivate()
        setShowTooltip(false)
      }}
      style={{
        position: "absolute",
        left: SEQ_COL_W + SEQ_TO_CARD_GAP,
        right: 0,
        bottom: -12,
        display: "flex",
        justifyContent: "center",
        pointerEvents: visible ? "auto" : "none",
        zIndex: 20,
      }}
    >
      <div style={{ position: "relative" }}>
        <button
          type="button"
          aria-label="Create Order"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#282828",
            border: "1px solid #333",
            borderRadius: 4,
            color: "#E5E5E5",
            cursor: "pointer",
            opacity: visible ? 1 : 0,
            transition: "opacity 120ms ease, background-color 120ms ease",
            padding: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.currentTarget.style.backgroundColor = "#333")}
          onBlur={(e) => (e.currentTarget.style.backgroundColor = "#282828")}
        >
          <Plus size={14} />
        </button>
        {visible && showTooltip && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: "calc(100% + 6px)",
              padding: "4px 8px",
              backgroundColor: "#171717",
              border: "1px solid #282828",
              borderRadius: 4,
              color: "#E5E5E5",
              fontSize: 12,
              fontWeight: 400,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              fontFamily: "inherit",
            }}
          >
            Create Order
          </div>
        )}
      </div>
    </div>
  )
}

/** Mid-route "Add Load Order" CTA — inserted between stops when a runout is detected */
function MidRouteAddLoadCTA({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: SEQ_TO_CARD_GAP,
        position: "relative",
        zIndex: 1,
        marginBottom: ORDER_LIST_GAP,
      }}
    >
      <div style={{ width: SEQ_COL_W, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#818CF8" }} />
      </div>
      <div
        style={{
          flex: 1,
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderRadius: 4,
          padding: "8px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 400, color: "#818CF8" }}>Add Load Order</span>
        <button
          onClick={onOpenModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 12px",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.05)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 400,
            color: "#E5E5E5",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)" }}
        >
          <Plus size={14} color="#E5E5E5" />
          Add Load Order
        </button>
      </div>
    </div>
  )
}

function OrderStopRow({
  order,
  idx,
  stopTime,
  isNew,
  warning,
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragOver,
  stopIndex,
  routeId,
  onPlannedQtyClick,
  isDetailsOpen,
  onHoverOrder,
  isChecked,
  onToggleCheck,
  hasLoadOrders,
  onBreakdownClick,
  isBreakdownOpen,
}: {
  order: ExtractionOrder
  idx: number
  stopTime: string
  isNew?: boolean
  warning?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
  stopIndex?: number
  routeId?: string
  onPlannedQtyClick?: (order: ExtractionOrder, anchorY: number, anchorX: number) => void
  isDetailsOpen?: boolean
  onHoverOrder?: (orderId: string | null) => void
  isChecked?: boolean
  onToggleCheck?: () => void
  hasLoadOrders?: boolean
  onBreakdownClick?: (orderId: string, cardLeft: number, cardRight: number, fabTop: number) => void
  isBreakdownOpen?: boolean
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // When breakdown sheet is open for this order, force the hover bg + hide the FAB
  // so the user knows which card the open sheet belongs to.
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const fab = card.querySelector<HTMLDivElement>(".order-fab")
    if (isBreakdownOpen) {
      card.style.backgroundColor = "#282828"
      if (fab) fab.style.opacity = "0"
    } else {
      card.style.backgroundColor = "#1F1F1F"
      if (fab) fab.style.opacity = isMenuOpen ? "1" : "0"
    }
  }, [isBreakdownOpen, isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isMenuOpen])
  const seq = idx + 1
  const type = order.orderType ?? "D"
  const hasWarning = !!warning

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      data-stop-index={stopIndex}
      data-route-id={routeId}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: SEQ_TO_CARD_GAP,
        position: "relative",
        zIndex: isMenuOpen ? 50 : 1,
        borderTop: isDragOver ? "2px solid #6366f1" : "2px solid transparent",
        transition: "border-color 0.1s",
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
          paddingTop: 16,
        }}
      >
        {/* Sequence badge — 16×16 circle per Figma spec, #A3A3A3 bg, #171717 text */}
        <div
          className="order-seq-badge"
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

      {/* Order card with optional warning strip */}
      <div data-order-card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          ref={cardRef}
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: isBreakdownOpen ? "#282828" : "#1F1F1F",
            borderRadius: hasWarning ? "4px 4px 0 0" : 4,
            border: hasWarning ? "1px solid rgba(248, 113, 113, 0.3)" : undefined,
            padding: "16px 16px 12px 16px",
            gap: 12,
            display: "flex",
            flexDirection: "row",
            animation: isNew ? "rb-flicker 0.5s ease 8" : undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#282828"
            const grip = e.currentTarget.querySelector<SVGElement>(".order-grip-icon")
            if (grip) grip.style.opacity = "1"
            const fab = e.currentTarget.querySelector<HTMLDivElement>(".order-fab")
            if (fab && !isBreakdownOpen) fab.style.opacity = "1"
            onHoverOrder?.(order.id)
          }}
          onMouseLeave={(e) => {
            if (isMenuOpen || isBreakdownOpen) return
            e.currentTarget.style.backgroundColor = "#1F1F1F"
            const grip = e.currentTarget.querySelector<SVGElement>(".order-grip-icon")
            if (grip) grip.style.opacity = "0"
            const fab = e.currentTarget.querySelector<HTMLDivElement>(".order-fab")
            if (fab) fab.style.opacity = "0"
            onHoverOrder?.(null)
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
          <div style={{ paddingTop: 4 }}>
            <CheckboxInput checked={isChecked ?? false} onChange={onToggleCheck ?? (() => {})} />
          </div>
          {/* Grip icon — visible on hover, cursor grab */}
          <svg className="order-grip-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0, transition: "opacity 0.15s", cursor: "grab" }}>
            <circle cx="7" cy="6" r="1.5" fill="#A3A3A3" />
            <circle cx="7" cy="10" r="1.5" fill="#A3A3A3" />
            <circle cx="7" cy="14" r="1.5" fill="#A3A3A3" />
            <circle cx="13" cy="6" r="1.5" fill="#A3A3A3" />
            <circle cx="13" cy="10" r="1.5" fill="#A3A3A3" />
            <circle cx="13" cy="14" r="1.5" fill="#A3A3A3" />
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
            {/* Type badge: 20×20, color by type (L=#189ffc blue, D=#25b8a7 teal), no stroke */}
            <div
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                backgroundColor: type === "L" ? "#189ffc" : "#25b8a7",
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
              {order.shipToName ?? order.customerName}
            </span>
          </div>

          {/* Planned qty — ghost button, self-hover like driver dropdown */}
          <button
            className="planned-qty-btn"
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              const card = e.currentTarget.closest<HTMLElement>("[data-order-card]")
              const cardLeft = card ? card.getBoundingClientRect().left : rect.left
              // Toggle: click again to close
              onPlannedQtyClick?.(order, rect.top + rect.height / 2, cardLeft)
            }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#FAFAFA",
              opacity: 0.6,
              lineHeight: "20px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              height: 28,
              padding: "0 10px",
              marginLeft: -10,
              borderRadius: 4,
              textAlign: "left",
              transition: "opacity 0.15s, background-color 0.15s, box-shadow 0.15s",
              alignSelf: "flex-start",
              boxShadow: isDetailsOpen ? "0px 0px 0px 3px rgba(163,163,163,0.5)" : "none",
              ...(isDetailsOpen ? { opacity: 1 } : {}),
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.backgroundColor = "#404040" }}
            onMouseLeave={(e) => { if (!isDetailsOpen) { e.currentTarget.style.opacity = "0.6" }; e.currentTarget.style.backgroundColor = "transparent" }}
          >
            Planned Qty: {order.volume > 0 ? `${order.volume.toLocaleString()} gal` : "—"}
          </button>
        </div>

        {/* FAB — Package + 3-dot menu, positioned top-right of card */}
        <div
          className="order-fab"
          style={{
            position: "absolute", top: 8, right: 8,
            opacity: isMenuOpen ? 1 : 0, transition: "opacity 0.15s",
            display: "flex", alignItems: "center", gap: 4,
            backgroundColor: "#1B1B1B", border: "1px solid #282828",
            borderRadius: 4, padding: 4,
          }}
        >
          {/* v2: per-stop product balance (package icon → breakdown sheet) removed.
              Route-level Balance Table modal (ScanEye on route card) covers this use case. */}
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen) }}
              style={{
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 2, border: "none", backgroundColor: isMenuOpen ? "#333" : "transparent",
                cursor: "pointer", color: "#FAFAFA", padding: 0,
              }}
              onMouseEnter={(e) => { if (!isMenuOpen) e.currentTarget.style.backgroundColor = "#333" }}
              onMouseLeave={(e) => { if (!isMenuOpen) e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              <div ref={menuRef} style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 999,
                width: 120, backgroundColor: "#1B1B1B", border: "1px solid #282828", borderRadius: 4,
                padding: 4, display: "flex", flexDirection: "column",
                boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)",
              }}>
                {/* Move */}
                <div
                  style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false) }}
                >
                  Move
                </div>
                {/* Unassign — destructive on hover */}
                <div
                  style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.2)"; e.currentTarget.style.color = "#F87171" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#E5E5E5" }}
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false) }}
                >
                  Unassign
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        {/* Warning strip for products that run out at this stop — one per stop, comma-separated */}
        {hasWarning && (
          <div
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.2)",
              borderLeft: "1px solid rgba(248, 113, 113, 0.3)",
              borderRight: "1px solid rgba(248, 113, 113, 0.3)",
              borderBottom: "1px solid rgba(248, 113, 113, 0.3)",
              borderRadius: "0 0 4px 4px",
              padding: "6px 16px 6px 20px",
              fontSize: 14,
              fontWeight: 400,
              color: "#f87171",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <TriangleAlert size={16} color="#f87171" style={{ flexShrink: 0 }} />
            {warning}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Detailed Order Stop Row ────────────────────────────────────────────────

const URGENCY_COLORS = [
  { key: "red" as const, color: "#EF4444" },
  { key: "yellow" as const, color: "#EAB308" },
  { key: "green" as const, color: "#22C55E" },
  { key: "blue" as const, color: "#3B82F6" },
]

function OrderStopRowDetailed({
  order,
  idx,
  stopTime,
  isNew,
  warning,
  draggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragOver,
  stopIndex,
  routeId,
  onPlannedQtyClick,
  isDetailsOpen,
  onHoverOrder,
  isChecked,
  onToggleCheck,
  hasLoadOrders,
  onBreakdownClick,
  isBreakdownOpen,
}: {
  order: ExtractionOrder
  idx: number
  stopTime: string
  isNew?: boolean
  warning?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  isDragOver?: boolean
  stopIndex?: number
  routeId?: string
  onPlannedQtyClick?: (order: ExtractionOrder, anchorY: number, anchorX: number) => void
  isDetailsOpen?: boolean
  onHoverOrder?: (orderId: string | null) => void
  isChecked?: boolean
  onToggleCheck?: () => void
  hasLoadOrders?: boolean
  onBreakdownClick?: (orderId: string, cardLeft: number, cardRight: number, fabTop: number) => void
  isBreakdownOpen?: boolean
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // When breakdown sheet is open for this order, force the hover bg + hide the FAB
  // so the user knows which card the open sheet belongs to.
  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const fab = card.querySelector<HTMLDivElement>(".order-fab")
    if (isBreakdownOpen) {
      card.style.backgroundColor = "#282828"
      if (fab) fab.style.opacity = "0"
    } else {
      card.style.backgroundColor = "#1F1F1F"
      if (fab) fab.style.opacity = isMenuOpen ? "1" : "0"
    }
  }, [isBreakdownOpen, isMenuOpen])

  useEffect(() => {
    if (!isMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isMenuOpen])
  const seq = idx + 1
  const type = order.orderType ?? "D"
  const isLoad = type === "L"
  const hasWarning = !!warning

  const totalAssets = order.totalAssets ?? 0
  const totalTopOffs = order.totalTopOffs ?? 0
  const urgency = order.urgency ?? { red: 0, yellow: 0, green: 0, blue: 0 }
  const productCount = order.productBreakdown?.length ?? 0

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      data-stop-index={stopIndex}
      data-route-id={routeId}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: SEQ_TO_CARD_GAP,
        position: "relative",
        zIndex: isMenuOpen ? 50 : 1,
        borderTop: isDragOver ? "2px solid #6366f1" : "2px solid transparent",
        transition: "border-color 0.1s",
      }}
    >
      {/* Seq column — center-aligned with card */}
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
        <div
          className="order-seq-badge"
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
      <div data-order-card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "#1F1F1F",
            borderRadius: hasWarning ? "4px 4px 0 0" : 4,
            border: hasWarning ? "1px solid rgba(248, 113, 113, 0.3)" : undefined,
            padding: 16,
            gap: 12,
            display: "flex",
            flexDirection: "row",
            animation: isNew ? "rb-flicker 0.5s ease 8" : undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#282828"
            const grip = e.currentTarget.querySelector<SVGElement>(".order-grip-icon")
            if (grip) grip.style.opacity = "1"
            const fab = e.currentTarget.querySelector<HTMLDivElement>(".order-fab")
            if (fab) fab.style.opacity = "1"
            const sec = e.currentTarget.querySelector<HTMLDivElement>(".detailed-secondary")
            if (sec) sec.style.backgroundColor = "#333"
            const card = e.currentTarget.closest<HTMLElement>("[data-order-card]")
            const chevBtn = card?.querySelector<HTMLButtonElement>(".chevrons-left-btn")
            if (chevBtn) chevBtn.style.opacity = "1"
            onHoverOrder?.(order.id)
          }}
          onMouseLeave={(e) => {
            if (isMenuOpen) return
            e.currentTarget.style.backgroundColor = "#1F1F1F"
            const grip = e.currentTarget.querySelector<SVGElement>(".order-grip-icon")
            if (grip) grip.style.opacity = "0"
            const fab = e.currentTarget.querySelector<HTMLDivElement>(".order-fab")
            if (fab) fab.style.opacity = "0"
            const sec = e.currentTarget.querySelector<HTMLDivElement>(".detailed-secondary")
            if (sec) sec.style.backgroundColor = "#282828"
            const card = e.currentTarget.closest<HTMLElement>("[data-order-card]")
            const chevBtn = card?.querySelector<HTMLButtonElement>(".chevrons-left-btn")
            if (chevBtn) chevBtn.style.opacity = "0"
            onHoverOrder?.(null)
          }}
        >
          {/* Left: checkbox + grip (top-aligned) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <div style={{ paddingTop: 4 }}>
              <CheckboxInput checked={isChecked ?? false} onChange={onToggleCheck ?? (() => {})} />
            </div>
            <svg className="order-grip-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0, transition: "opacity 0.15s", cursor: "grab" }}>
              <circle cx="7" cy="6" r="1.5" fill="#A3A3A3" />
              <circle cx="7" cy="10" r="1.5" fill="#A3A3A3" />
              <circle cx="7" cy="14" r="1.5" fill="#A3A3A3" />
              <circle cx="13" cy="6" r="1.5" fill="#A3A3A3" />
              <circle cx="13" cy="10" r="1.5" fill="#A3A3A3" />
              <circle cx="13" cy="14" r="1.5" fill="#A3A3A3" />
            </svg>
          </div>

          {/* Right: content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}>
            {/* Primary row — type badge + name + kebab */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 20, height: 20, flexShrink: 0,
                  backgroundColor: type === "L" ? "#189ffc" : "#25b8a7", borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 500, color: "#171717", lineHeight: 1,
                }}
              >
                {type}
              </div>
              <span
                style={{
                  flex: 1, fontSize: 16, fontWeight: 500, color: "#FFFFFF",
                  lineHeight: "24px", minWidth: 0, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {order.shipToName ?? order.customerName}
              </span>
            </div>

            {/* Secondary section wrapper — « button + stats card */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", marginLeft: -44 }}>
              {/* « button */}
              <button
                className="chevrons-left-btn"
                title="View more details"
                onClick={(e) => {
                  e.stopPropagation()
                  const card = e.currentTarget.closest<HTMLElement>("[data-order-card]")
                  const cardLeft = card ? card.getBoundingClientRect().left : 0
                  const rect = e.currentTarget.getBoundingClientRect()
                  onPlannedQtyClick?.(order, rect.top + rect.height / 2, cardLeft)
                }}
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "#333",
                  borderRadius: "4px 0 0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                  opacity: 0,
                  transition: "opacity 0.15s",
                  boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                  color: "#A3A3A3",
                  padding: 0,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#404040" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#333" }}
              >
                <ChevronsLeft size={16} />
              </button>
              {/* Stats card */}
              <div
                className="detailed-secondary"
                style={{
                  flex: 1,
                  backgroundColor: "#282828",
                  borderRadius: 4,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "background-color 0.15s",
                }}
              >
              {/* Stats */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Assets / Products */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", lineHeight: "28px" }}>
                    {isLoad ? productCount : totalAssets}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>
                    {isLoad ? "Products" : "Assets"}
                  </span>
                </div>

                {/* Planned Qty */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", lineHeight: "28px" }}>
                    {order.volume > 0 ? order.volume.toLocaleString() : "—"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>
                    Planned Qty
                  </span>
                </div>

                {/* Divider + Top Off (delivery only) */}
                {!isLoad && (
                  <>
                    <div style={{ width: 1, alignSelf: "stretch", backgroundColor: "#333" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#E5E5E5", lineHeight: "28px" }}>
                        {totalTopOffs}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>
                        Top Off
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Urgency dots — 2x2 grid */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  maxWidth: 88,
                  width: 88,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isLoad ? 0 : 1,
                }}
              >
                {URGENCY_COLORS.map(({ key, color }) => (
                  <div
                    key={key}
                    style={{
                      width: 40,
                      backgroundColor: "#333",
                      borderRadius: 4,
                      padding: "4px 6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 400, color: "#E5E5E5", lineHeight: "16px" }}>
                      {urgency[key]}
                    </span>
                  </div>
                ))}
              </div>{/* end urgency dots */}
            </div>{/* end stats card (detailed-secondary) */}
          </div>{/* end wrapper: « + stats */}
          </div>{/* end Right: content */}

        {/* FAB — Package + 3-dot menu, positioned top-right of card */}
        <div
          className="order-fab"
          style={{
            position: "absolute", top: 8, right: 8,
            opacity: isMenuOpen ? 1 : 0, transition: "opacity 0.15s",
            display: "flex", alignItems: "center", gap: 4,
            backgroundColor: "#1B1B1B", border: "1px solid #282828",
            borderRadius: 4, padding: 4,
          }}
        >
          {/* v2: per-stop product balance (package icon → breakdown sheet) removed.
              Route-level Balance Table modal (ScanEye on route card) covers this use case. */}
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen) }}
              style={{
                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 2, border: "none", backgroundColor: isMenuOpen ? "#333" : "transparent",
                cursor: "pointer", color: "#FAFAFA", padding: 0,
              }}
              onMouseEnter={(e) => { if (!isMenuOpen) e.currentTarget.style.backgroundColor = "#333" }}
              onMouseLeave={(e) => { if (!isMenuOpen) e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              <div ref={menuRef} style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 999,
                width: 120, backgroundColor: "#1B1B1B", border: "1px solid #282828", borderRadius: 4,
                padding: 4, display: "flex", flexDirection: "column",
                boxShadow: "0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)",
              }}>
                {/* Move */}
                <div
                  style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false) }}
                >
                  Move
                </div>
                {/* Unassign — destructive on hover */}
                <div
                  style={{ padding: "6px 8px", borderRadius: 4, fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.2)"; e.currentTarget.style.color = "#F87171" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#E5E5E5" }}
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false) }}
                >
                  Unassign
                </div>
              </div>
            )}
          </div>
        </div>
        </div>{/* end inner card bg div with hover */}

        {/* Warning strip */}
        {hasWarning && (
          <div
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.2)",
              borderLeft: "1px solid rgba(248, 113, 113, 0.3)",
              borderRight: "1px solid rgba(248, 113, 113, 0.3)",
              borderBottom: "1px solid rgba(248, 113, 113, 0.3)",
              borderRadius: "0 0 4px 4px",
              padding: "6px 16px 6px 20px",
              fontSize: 14, fontWeight: 400, color: "#f87171",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <TriangleAlert size={16} color="#f87171" style={{ flexShrink: 0 }} />
            {warning}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Order Details Popover ──────────────────────────────────────────────────

function OrderDetailsPopover({
  order,
  anchorY,
  anchorX,
  onClose,
}: {
  order: ExtractionOrder
  anchorY: number
  anchorX: number
  onClose: () => void
}) {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close on click outside (ignore clicks on planned-qty buttons to let toggle work)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        if ((e.target as HTMLElement).closest?.(".planned-qty-btn")) return
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const breakdown = order.productBreakdown ?? []
  const totalVolume = breakdown.reduce((sum, pb) => sum + pb.volume, 0) || order.volume

  // Mock assets data — random number per product row
  const mockAssets = breakdown.map((_, i) => {
    const assets = [3, 5, 2, 4, 7, 1][i % 6]
    const topOffs = i % 3 === 0 ? [2, 3, 1][Math.floor(i / 3) % 3] : null
    return { assets, topOffs }
  })
  const totalAssets = mockAssets.reduce((sum, m) => sum + m.assets, 0)
  const totalTopOffs = mockAssets.reduce((sum, m) => sum + (m.topOffs ?? 0), 0)

  // Position: 4px gap to the left of the order card, centered vertically near the clicked button
  const popoverWidth = 520
  const popoverHeight = 300 // approximate
  const top = Math.max(80, Math.min(anchorY - popoverHeight / 2, window.innerHeight - popoverHeight - 20))
  const left = Math.max(0, anchorX - popoverWidth - 4)

  return (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 10000,
        backgroundColor: "#1F1F1F",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.4), 0px 2px 8px rgba(0,0,0,0.3)",
        width: popoverWidth,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5" }}>Order Details</span>
        <button
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: 4,
            color: "#A3A3A3",
            padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#FFFFFF" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#A3A3A3" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #282828", borderRadius: 4, overflow: "clip" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          lineHeight: "20px",
        }}
      >
        <colgroup>
          <col style={{ width: 228 }} />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: "#333", height: 40 }}>
            <th style={{ padding: "0 12px", fontWeight: 500, color: "#A3A3A3", textAlign: "left" }}>Product</th>
            <th style={{ padding: "0 12px", fontWeight: 500, color: "#A3A3A3", textAlign: "left" }}>Planned Qty</th>
            <th style={{ padding: "0 12px", fontWeight: 500, color: "#A3A3A3", textAlign: "left" }}>Assets</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.length > 0 ? breakdown.map((pb, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #282828" }}>
              <td style={{ padding: 12, fontWeight: 400, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 228 }}>{pb.product}</td>
              <td style={{ padding: 12, fontWeight: 500, color: "#E5E5E5" }}>{pb.volume.toLocaleString()} gal</td>
              <td style={{ padding: 12, color: "#E5E5E5" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 500 }}>{mockAssets[i].assets}</span>
                  {mockAssets[i].topOffs && (
                    <>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#A3A3A3", flexShrink: 0 }} />
                      <span style={{ fontWeight: 400, color: "#A3A3A3" }}>{mockAssets[i].topOffs} Top-Offs</span>
                    </>
                  )}
                </span>
              </td>
            </tr>
          )) : (
            <tr style={{ borderBottom: "1px solid #282828" }}>
              <td style={{ padding: 12, fontWeight: 400, color: "#E5E5E5" }}>—</td>
              <td style={{ padding: 12, fontWeight: 500, color: "#E5E5E5" }}>{order.volume > 0 ? `${order.volume.toLocaleString()} gal` : "—"}</td>
              <td style={{ padding: 12, fontWeight: 500, color: "#E5E5E5" }}>—</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: "#1B1B1B" }}>
            <td style={{ padding: "10px 12px", fontWeight: 500, color: "#E5E5E5" }}>Total</td>
            <td style={{ padding: "10px 12px", fontWeight: 500, color: "#E5E5E5" }}>{totalVolume.toLocaleString()} gal</td>
            <td style={{ padding: "10px 12px", fontWeight: 500, color: "#E5E5E5" }}>{totalAssets}</td>
          </tr>
        </tfoot>
      </table>
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
  onHoveredOrderChange,
  onAddedLoadOrdersChange,
  onAddedDeliveryOrdersChange,
  onShowToast,
  onShowMessage,
  createOrderPrefillShipToId,
  onClearCreateOrderPrefillShipToId,
  onAddSelectedRouteId,
  initialExpandedRouteIds = [],
  onCreateOrderSideSheetOpen,
  onCreateOrderSideSheetClose,
  externalUnassignedOrders = [],
}: LassoWorkspaceSheetProps) {
  const { orderCardView, createOrderModalView, updateCreateOrderModalView } = useSettings()
  const [activeTab, setActiveTab] = useState<"routes" | "unassigned">("routes")
  const [expandedRouteIds, setExpandedRouteIds] = useState<string[]>(initialExpandedRouteIds)

  const [addedLoadOrders, setAddedLoadOrders] = useState<Record<string, ExtractionOrder[]>>({})
  const [addedDeliveryOrders, setAddedDeliveryOrders] = useState<Record<string, ExtractionOrder[]>>({})
  // Create Order modal. Two entry points:
  //  - Inline + on a route card → opens with createOrderRouteId set
  //  - Map shipto-no-order pin → opens with createOrderRouteId null + a prefillShipToId
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false)
  const [createOrderRouteId, setCreateOrderRouteId] = useState<string | null>(null)
  // Unassigned orders added through the shipto-pin → Create Order flow (no originating route)
  const [addedUnassignedOrders, setAddedUnassignedOrders] = useState<ExtractionOrder[]>([])

  // Map-pin entry point: when parent sets createOrderPrefillShipToId, open the modal.
  useEffect(() => {
    if (createOrderPrefillShipToId) {
      setCreateOrderRouteId(null)
      setIsCreateOrderModalOpen(true)
      if (createOrderModalView === "modal3") onCreateOrderSideSheetOpen?.()
    }
  }, [createOrderPrefillShipToId])

  // Route focus while the Create Order modal is open: expand that route's card so it stays
  // visible behind the modal backdrop, and pull the map zoom back one notch (maxZoom 12 vs
  // the default 13) so the route is fully in view. See DESIGN_JOURNAL: "Route focus while modal is open".
  useEffect(() => {
    if (!isCreateOrderModalOpen || !createOrderRouteId) return
    setExpandedRouteIds((prev) => (prev.includes(createOrderRouteId) ? prev : [...prev, createOrderRouteId]))
  }, [isCreateOrderModalOpen, createOrderRouteId])
  const [reorderedRoutes, setReorderedRoutes] = useState<Record<string, string[]>>({}) // routeId → ordered order IDs
  const [recentlyAddedOrderId, setRecentlyAddedOrderId] = useState<string | null>(null)
  // Selected trucks per route: { [routeId]: TruckItem }
  // Pre-populate from mockRoutes for routes that have truckId
  const [selectedTrucks, setSelectedTrucks] = useState<Record<string, TruckItem>>(() => {
    const initial: Record<string, TruckItem> = {}
    for (const route of mockRoutes) {
      if (route.truckId) {
        const truck = TRUCKS.find((t) => t.id === route.truckId)
        if (truck) initial[route.id] = truck
      }
    }
    return initial
  })
  // Add Load Order modal state
  const [isAddLoadModalOpen, setIsAddLoadModalOpen] = useState(false)
  const [activeRouteIdForModal, setActiveRouteIdForModal] = useState<string | null>(null)

  // Order Details popover state
  const [orderDetailsOrder, setOrderDetailsOrder] = useState<ExtractionOrder | null>(null)
  const [orderDetailsAnchorY, setOrderDetailsAnchorY] = useState<number>(0)
  const [orderDetailsAnchorX, setOrderDetailsAnchorX] = useState<number>(0)

  // Product & Compartment Breakdown sheet state — shows route-level allocation
  // for the route the clicked order belongs to. Anchor coords come from the
  // order card's bounding rect so the sheet sits 4px LEFT of the order card,
  // flipping to the right side when there's not enough space.
  const [breakdownOrderId, setBreakdownOrderId] = useState<string | null>(null)
  const [breakdownAnchorLeft, setBreakdownAnchorLeft] = useState<number>(0)
  const [breakdownAnchorRight, setBreakdownAnchorRight] = useState<number>(0)
  const [breakdownAnchorY, setBreakdownAnchorY] = useState<number>(0)

  // Route Summary sheet (Product + Truck tabs) — opens from route-card ScanEye button
  const [routeSummaryRouteId, setRouteSummaryRouteId] = useState<string | null>(null)
  const [routeSummaryAnchorLeft, setRouteSummaryAnchorLeft] = useState<number>(0)
  const [routeSummaryAnchorRight, setRouteSummaryAnchorRight] = useState<number>(0)
  const [routeSummaryAnchorY, setRouteSummaryAnchorY] = useState<number>(0)

  // Initial Inventory modal — per-route, per-compartment {product, qty} values.
  // Aggregated into per-product totals when passed into BalanceTableModal.
  const [editingInitialInventoryRouteId, setEditingInitialInventoryRouteId] = useState<string | null>(null)
  const [initialInventories, setInitialInventories] = useState<
    Record<string, Record<string, { product?: import("@/lib/truck-data").FuelProduct; qty: number }>>
  >({})

  // Truck Details sheet — opens from "View Truck Details" button inside the expanded route card
  const [truckDetailsRouteId, setTruckDetailsRouteId] = useState<string | null>(null)
  const [truckDetailsAnchorLeft, setTruckDetailsAnchorLeft] = useState<number>(0)
  const [truckDetailsAnchorRight, setTruckDetailsAnchorRight] = useState<number>(0)
  const [truckDetailsAnchorY, setTruckDetailsAnchorY] = useState<number>(0)

  // Route 3-dot menu state
  const [menuRouteId, setMenuRouteId] = useState<string | null>(null)

  // Truck dropdown state
  const [truckDropdownRouteId, setTruckDropdownRouteId] = useState<string | null>(null)
  const [cardTruckSearch, setCardTruckSearch] = useState("")
  const [truckSearchExpanded, setTruckSearchExpanded] = useState(false)

  // Trailer state
  const [selectedTrailers, setSelectedTrailers] = useState<Record<string, { t1: TrailerItem | null; t2: TrailerItem | null }>>({})
  const [trailerDropdownRouteId, setTrailerDropdownRouteId] = useState<string | null>(null)
  const [cardTrailerSearch, setCardTrailerSearch] = useState("")
  const [cardTrailerSlot, setCardTrailerSlot] = useState<0 | 1 | 2>(0)
  const [truckDropupEnabled, setTruckDropupEnabled] = useState(false)
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  const [mergeModalMode, setMergeModalMode] = useState<"create" | "optimise">("create")
  const [optimiseRouteId, setOptimiseRouteId] = useState<string | null>(null)
  // Inline optimise loading state (per route, on the card itself)
  const [optimisingInlineRouteId, setOptimisingInlineRouteId] = useState<string | null>(null)
  const [optimisingPhaseIndex, setOptimisingPhaseIndex] = useState(0)
  const OPTIMISE_PHASES = [
    { delay: 2500, text: "Evaluating orders across truck selection..." },
    { delay: 2200, text: "Applying compartment constraints..." },
    { delay: 2000, text: "Checking product compatibility..." },
    { delay: 2500, text: "Optimising stop sequences..." },
    { delay: 2000, text: "Finalising routes..." },
  ]
  // Drive phase progression
  useEffect(() => {
    if (!optimisingInlineRouteId) return
    let i = optimisingPhaseIndex
    const timers: ReturnType<typeof setTimeout>[] = []
    const runPhase = () => {
      if (i >= OPTIMISE_PHASES.length) {
        const routeId = optimisingInlineRouteId
        const orderCount = selectedOrders.filter(o => o.routeId === routeId).length
        const t = setTimeout(() => {
          setOptimisingInlineRouteId(null)
          setOptimisingPhaseIndex(0)
          onShowMessage?.(`Route optimised with ${orderCount} orders`)
        }, 600)
        timers.push(t)
        return
      }
      const phase = OPTIMISE_PHASES[i]
      i++
      const t = setTimeout(() => {
        setOptimisingPhaseIndex(i)
        runPhase()
      }, phase.delay)
      timers.push(t)
    }
    runPhase()
    return () => { timers.forEach(clearTimeout) }
  }, [optimisingInlineRouteId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [checkedUnassignedOrderIds, setCheckedUnassignedOrderIds] = useState<string[]>([])
  const [checkedScheduledOrderIds, setCheckedScheduledOrderIds] = useState<string[]>([])
  const toggleScheduledOrderChecked = (orderId: string) => {
    setCheckedScheduledOrderIds(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId])
  }

  // Auto-sync route checkbox when individual orders are toggled
  useEffect(() => {
    const updates: string[] = []
    const removals: string[] = []
    for (const routeId of selectedRouteIds) {
      const routeOrderIds = selectedOrders.filter(o => o.routeId === routeId).map(o => o.id)
      if (routeOrderIds.length === 0) continue
      const allCheckedNow = routeOrderIds.every(id => checkedScheduledOrderIds.includes(id))
      const isRouteChecked = checkedRouteIds.includes(routeId)
      if (allCheckedNow && !isRouteChecked) updates.push(routeId)
      else if (!allCheckedNow && isRouteChecked) removals.push(routeId)
    }
    if (updates.length > 0 || removals.length > 0) {
      onCheckedRoutesChange(
        [...checkedRouteIds.filter(id => !removals.includes(id)), ...updates]
      )
    }
  }, [checkedScheduledOrderIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Driver dropdown state
  const [driverDropdownRouteId, setDriverDropdownRouteId] = useState<string | null>(null)
  const [driverDropdownRect, setDriverDropdownRect] = useState<DOMRect | null>(null)
  const [driverSearch, setDriverSearch] = useState("")
  // Selected drivers per route — pre-populate from mockRoutes
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, DriverItem>>(() => {
    const initial: Record<string, DriverItem> = {}
    for (const route of mockRoutes) {
      if (route.driverName) {
        const driver = DRIVERS.find((d) => d.name === route.driverName)
        if (driver) initial[route.id] = driver
      }
    }
    return initial
  })

  // Synthetic routes created via "Create Order → select driver" (no base orders in selectedOrders)
  const [addedRouteInfo, setAddedRouteInfo] = useState<Record<string, { driverName: string; driverId: string; color: string }>>({})

  // Scroll container ref for chip scroll-to-stop
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const unassignedSectionRef = useRef<HTMLDivElement>(null)
  const routesSectionRef = useRef<HTMLDivElement>(null)

  // Update active tab based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    const unassignedEl = unassignedSectionRef.current
    if (!container || !unassignedEl) return
    const onScroll = () => {
      const containerRect = container.getBoundingClientRect()
      const unassignedRect = unassignedEl.getBoundingClientRect()
      // Switch to "unassigned" tab when its top reaches upper third of container
      const threshold = containerRect.top + containerRect.height * 0.33
      setActiveTab(unassignedRect.top <= threshold ? "unassigned" : "routes")
    }
    container.addEventListener("scroll", onScroll, { passive: true })
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  // Close route menu on outside click
  useEffect(() => {
    if (!menuRouteId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-route-menu]")) {
        setMenuRouteId(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuRouteId])

  // Close truck dropdown on outside click
  useEffect(() => {
    if (!truckDropdownRouteId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-truck-dropdown]")) {
        setTruckDropdownRouteId(null)
        setCardTruckSearch("")
        setTruckSearchExpanded(false)
        setCardTrailerSlot(0)
        setCardTrailerSearch("")
        document.querySelectorAll<HTMLElement>("[data-truck-dropdown]").forEach((el) => {
          el.style.backgroundColor = "transparent"
        })
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [truckDropdownRouteId])

  // Close trailer dropdown on outside click
  useEffect(() => {
    if (!trailerDropdownRouteId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-trailer-dropdown]")) {
        setTrailerDropdownRouteId(null)
        setCardTrailerSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [trailerDropdownRouteId])

  // Close driver dropdown on outside click
  useEffect(() => {
    if (!driverDropdownRouteId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-driver-dropdown]")) {
        setDriverDropdownRouteId(null)
        setDriverSearch("")
        // Reset any stuck hover bg on driver buttons
        document.querySelectorAll<HTMLElement>("[data-driver-dropdown]").forEach((el) => {
          el.style.backgroundColor = "transparent"
        })
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [driverDropdownRouteId])

  const scrollToStop = (routeId: string, stopIndex: number) => {
    const container = scrollContainerRef.current
    if (!container) return
    const target = container.querySelector(
      `[data-route-id="${routeId}"][data-stop-index="${stopIndex}"]`
    ) as HTMLElement | null
    if (!target) return

    // Use getBoundingClientRect for reliable positioning
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const stickyHeaderHeight = 130 // card + banner height approx
    const offsetFromTop = targetRect.top - containerRect.top - stickyHeaderHeight
    container.scrollBy({ top: offsetFromTop, behavior: "smooth" })

    // Trigger highlight animation
    target.classList.add("rb-stop-highlight")
    setTimeout(() => target.classList.remove("rb-stop-highlight"), 3000)
  }

  const toggleExpanded = (routeId: string) => {
    setExpandedRouteIds((prev) =>
      prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId]
    )
  }

  const toggleRouteChecked = (routeId: string) => {
    const routeOrderIds = (routeGroups[routeId] ?? []).map(o => o.id)
    if (checkedRouteIds.includes(routeId)) {
      // Uncheck route → remove all its orders from scheduled
      onCheckedRoutesChange(checkedRouteIds.filter((id) => id !== routeId))
      setCheckedScheduledOrderIds(prev => prev.filter(id => !routeOrderIds.includes(id)))
    } else {
      // Check route → add all its orders to scheduled
      onCheckedRoutesChange([...checkedRouteIds, routeId])
      setCheckedScheduledOrderIds(prev => [...new Set([...prev, ...routeOrderIds])])
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

  // Include synthetic routes (driver-created, no base orders) at the end of the list
  const syntheticRouteIds = Object.keys(addedRouteInfo).filter(
    (id) => !Object.keys(routeGroups).includes(id) && (addedDeliveryOrders[id]?.length ?? 0) > 0
  )
  const allRouteIds = [...Object.keys(routeGroups), ...syntheticRouteIds]
  const allChecked = allRouteIds.length > 0 && allRouteIds.every((id) => checkedRouteIds.includes(id))
  const someChecked = checkedRouteIds.length > 0 && !allChecked

  const toggleAllRoutes = () => {
    if (allChecked) {
      onCheckedRoutesChange([])
      // Remove all route orders from scheduled
      const allRouteOrderIds = allRouteIds.flatMap(rid => (routeGroups[rid] ?? []).map(o => o.id))
      setCheckedScheduledOrderIds(prev => prev.filter(id => !allRouteOrderIds.includes(id)))
    } else {
      onCheckedRoutesChange(allRouteIds)
      // Add all route orders to scheduled
      const allRouteOrderIds = allRouteIds.flatMap(rid => (routeGroups[rid] ?? []).map(o => o.id))
      setCheckedScheduledOrderIds(prev => [...new Set([...prev, ...allRouteOrderIds])])
    }
  }

  const unassignedOrders = [...selectedOrders.filter((o) => !o.routeId), ...addedUnassignedOrders, ...externalUnassignedOrders]

  // Unassigned order checkbox logic
  const unassignedOrderIds = unassignedOrders.map(o => o.id)
  const allUnassignedChecked = unassignedOrderIds.length > 0 && unassignedOrderIds.every(id => checkedUnassignedOrderIds.includes(id))
  const someUnassignedChecked = checkedUnassignedOrderIds.length > 0 && !allUnassignedChecked
  const toggleUnassignedOrderChecked = (orderId: string) => {
    setCheckedUnassignedOrderIds(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId])
  }
  const toggleAllUnassigned = () => {
    if (allUnassignedChecked) {
      setCheckedUnassignedOrderIds([])
    } else {
      setCheckedUnassignedOrderIds(unassignedOrderIds)
    }
  }

  const getTankLevelColor = (level: number) => {
    if (level > 75) return "#E15252"
    if (level >= 40) return "#FDE68A"
    return "#69BF88"
  }

  if (!isOpen) {
    // Modal 3 side sheet: workspace is collapsed but the Create Order modal must stay rendered.
    // Component stays mounted (never conditionally removed from page.tsx), so state is preserved.
    if (createOrderModalView === "modal3" && isCreateOrderModalOpen) {
      const closeModal3 = () => {
        setIsCreateOrderModalOpen(false)
        setCreateOrderRouteId(null)
        onClearCreateOrderPrefillShipToId?.()
        onCreateOrderSideSheetClose?.()
      }
      return (
        <CreateOrderModal
          isOpen={true}
          prefillShipToId={createOrderPrefillShipToId ?? null}
          prefillDriverName={null}
          onClose={closeModal3}
          onExpandToModal={() => {
            updateCreateOrderModalView("modal1")
            onCreateOrderSideSheetClose?.()
          }}
          onSubmit={(data: CreateOrderSubmit) => {
            const orderId = `delivery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            const newOrder: ExtractionOrder = {
              id: orderId,
              customerId: data.customerId,
              customerName: data.customerName,
              shipToName: data.shipToName,
              shipToAddress: data.shipToAddress,
              latitude: data.latitude,
              longitude: data.longitude,
              status: "pending",
              volume: data.volume,
              scheduledDate: data.scheduledTimeLabel,
              zoneId: "",
              hubId: "",
              city: data.city,
              state: data.state,
              zip: data.zip,
              tankSize: 0,
              currentLevel: 0,
              daysUntilEmpty: 0,
              priority: "Medium",
              lastDelivery: "",
              zone: data.zone,
              orderType: "D",
            }
            setAddedUnassignedOrders((prev) => [...prev, newOrder])
            onShowMessage?.("Order added to Unassigned. Move it to a route from there.")
            closeModal3()
          }}
        />
      )
    }
    return null
  }

  const hasSelection = selectedOrders.length > 0

  return (
    <div
      className="fixed right-0 top-[68px] bottom-0 z-[1100] flex flex-col"
      style={{
        width: 560,
        backgroundColor: "#111111",
        borderLeft: "1px solid #282828",
        animation: "rb-co-drawer-in 320ms cubic-bezier(0.32, 0.72, 0, 1)",
      }}
    >
      {/* Inline optimise overlay keyframes */}
      <style>{`
        @keyframes rb-overlay-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes rb-shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        @keyframes rb-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes rb-phase-in {
          from { opacity: 0; filter: blur(2px); transform: translateY(2px); }
          to   { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
      `}</style>
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
                  onClick={() => {
                    setActiveTab(tab)
                    const target = tab === "routes" ? routesSectionRef.current : unassignedSectionRef.current
                    if (target && scrollContainerRef.current) {
                      const containerRect = scrollContainerRef.current.getBoundingClientRect()
                      const targetRect = target.getBoundingClientRect()
                      scrollContainerRef.current.scrollBy({ top: targetRect.top - containerRect.top, behavior: "smooth" })
                    }
                  }}
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
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
            style={{ padding: "0 24px" }}
          >
            {/* ── ROUTES SECTION ── */}
              <div ref={routesSectionRef}>
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
                    const orders = routeGroups[routeId] ?? []
                    const route = mockRoutes.find((r) => r.id === routeId)
                    const syntheticInfo = addedRouteInfo[routeId]
                    const driverName = route?.driverName ?? syntheticInfo?.driverName ?? `Route ${routeId.replace("route-", "")}`
                    const color = route?.color ?? syntheticInfo?.color ?? "#A3A3A3"
                    const isExpanded = expandedRouteIds.includes(routeId)
                    const isChecked = checkedRouteIds.includes(routeId)

                    // Merge in any added load orders + create-order additions for this route
                    const extraLoads = addedLoadOrders[routeId] ?? []
                    const extraDeliveries = addedDeliveryOrders[routeId] ?? []
                    const defaultSorted = [...orders, ...extraLoads, ...extraDeliveries].sort(
                      (a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0)
                    )
                    // Apply reorder if user has dragged — stamp new routeSequence so validation engine respects drag order
                    const reorderIds = reorderedRoutes[routeId]
                    const sortedOrders = reorderIds
                      ? reorderIds.map((id, i) => {
                          const order = defaultSorted.find((o) => o.id === id)
                          return order ? { ...order, routeSequence: i + 1 } : null
                        }).filter(Boolean) as ExtractionOrder[]
                      : defaultSorted

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
                    const truckId = userSelectedTruck?.id ?? route?.truckId ?? null
                    const truckProfile = truckId ? TRUCK_CAPACITIES[truckId] ?? null : null
                    const retainedFuel = route?.retainedFuel ?? undefined

                    // Run validation engine (returns null if no truck)
                    const validation = validateRouteCapacity(sortedOrders, truckProfile, retainedFuel)

                    // Hub name
                    const hubId = (orders[0] ?? extraDeliveries[0])?.hubId
                    const hub = mockHubs.find((h) => h.id === hubId)
                    const hubName = hub?.name ?? "Austin HUB"

                    // left-col width (checkbox 16 + gap 4 + chevron 24) + outer gap 8 = 52px
                    const LEFT_INDENT = 52

                    return (
                      <div
                        key={routeId}
                        data-route-card
                        style={{ display: "flex", flexDirection: "column" }}
                      >
                        {/* Sticky wrapper for card + banner when expanded */}
                        <div style={{
                          position: isExpanded ? "sticky" : "static",
                          top: 0,
                          zIndex: isExpanded ? (driverDropdownRouteId === routeId || truckDropdownRouteId === routeId || trailerDropdownRouteId === routeId ? 1000 : 10) : "auto",
                          backgroundColor: isExpanded ? "#111111" : "transparent",
                        }}>
                        {/* Card row: checkbox+chevron centered with card body — hover only on this row */}
                        <div
                          style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}
                          onMouseEnter={() => onHoveredRouteChange(routeId)}
                          onMouseLeave={() => onHoveredRouteChange(null)}
                        >
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

                          {/* Card wrapper — contains card body + banner */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Card body — position relative for wedge */}
                            <div data-route-card style={{ position: "relative" }}>
                              {/* Color wedge — covers card body only, top-left radius only (bottom-left rounded when no banner) */}
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 6,
                                  backgroundColor: color,
                                  borderRadius: validation && validation.zoneB.visible ? "4px 0 0 0" : "4px 0 0 4px",
                                  pointerEvents: "none",
                                  zIndex: 1,
                                }}
                              />
                            <RouteCardCollapsed
                              color={color}
                              driverName={selectedDrivers[routeId]?.name ?? driverName}
                              orderCount={orderCount}
                              plannedQty={plannedQty}
                              truckName={truckName ?? "Not Selected"}
                              truckCapacity={truckProfile ? `${truckProfile.totalCapacity.toLocaleString()} gal` : "—"}
                              compartmentCount={truckProfile?.compartments.length ?? 0}
                              productCount={truckProfile ? Object.keys(truckProfile.productCapacities).length : 0}
                              isHovered={hoveredRouteId === routeId}
                              hasBanner={!!(validation && validation.zoneB.visible)}
                              hasTruck={!!(userSelectedTruck ?? truckProfile ?? route?.truckName)}
                              hasFuelCapacity={userSelectedTruck ? !!userSelectedTruck.capacity : (truckProfile ? truckProfile.totalCapacity > 0 : false)}
                              trailer1={selectedTrailers[routeId]?.t1 ?? null}
                              trailer2={selectedTrailers[routeId]?.t2 ?? null}
                              onTruckClick={(rect) => {
                                setTruckDropupEnabled(window.innerHeight - rect.bottom < 350)
                                setTruckDropdownRouteId(truckDropdownRouteId === routeId ? null : routeId)
                                setCardTruckSearch("")
                                setTruckSearchExpanded(false)
                                setTrailerDropdownRouteId(null)
                                setDriverDropdownRouteId(null)
                                setMenuRouteId(null)
                              }}
                              isTruckDropdownOpen={truckDropdownRouteId === routeId}
                              onAddTrailer={() => {
                                setTrailerDropdownRouteId(trailerDropdownRouteId === routeId ? null : routeId)
                                setCardTrailerSearch("")
                                setTruckDropdownRouteId(null)
                                setDriverDropdownRouteId(null)
                                setMenuRouteId(null)
                              }}
                              isTrailerDropdownOpen={trailerDropdownRouteId === routeId}
                              onDriverClick={(rect) => {
                                setDriverDropdownRouteId(driverDropdownRouteId === routeId ? null : routeId)
                                setDriverDropdownRect(driverDropdownRouteId === routeId ? null : rect)
                                setDriverSearch("")
                                setTruckDropdownRouteId(null)
                                setTrailerDropdownRouteId(null)
                                setMenuRouteId(null)
                              }}
                              isDriverDropdownOpen={driverDropdownRouteId === routeId}
                              onMenuClick={() => {
                                setMenuRouteId(menuRouteId === routeId ? null : routeId)
                                setDriverDropdownRouteId(null)
                                setDriverSearch("")
                              }}
                              isMenuOpen={menuRouteId === routeId}
                              isPublished={routeId !== "route-6"}
                              onOptimise={() => {
                                // Run inline on the card (no modal) — only triggered when truck is present
                                // Clear any selections for this route so FAB doesn't show on top
                                const orderIdsForRoute = selectedOrders.filter(o => o.routeId === routeId).map(o => o.id)
                                onCheckedRoutesChange(checkedRouteIds.filter(id => id !== routeId))
                                setCheckedScheduledOrderIds(prev => prev.filter(id => !orderIdsForRoute.includes(id)))
                                setOptimisingPhaseIndex(0)
                                setOptimisingInlineRouteId(routeId)
                                setMenuRouteId(null)
                              }}
                              onViewRoute={() => { /* future: open route detail */ }}
                              onRemoveRoute={() => {
                                setSelectedOrders(prev => prev.filter(o => o.routeId !== routeId))
                                setSelectedRouteIds(prev => prev.filter(id => id !== routeId))
                                setMenuRouteId(null)
                              }}
                              currentDriverId={selectedDrivers[routeId]?.id}
                              onDriverSelect={(driver) => {
                                setSelectedDrivers((prev) => ({ ...prev, [routeId]: driver }))
                                setMenuRouteId(null)
                              }}
                              onViewSummary={(cardLeft, cardRight, fabTop) => {
                                setRouteSummaryAnchorLeft(cardLeft)
                                setRouteSummaryAnchorRight(cardRight)
                                setRouteSummaryAnchorY(fabTop)
                                setRouteSummaryRouteId(routeId)
                              }}
                              isSummaryOpen={routeSummaryRouteId === routeId}
                            />

                            {/* Inline optimise loading overlay — covers card body, leaves wedge visible */}
                            {optimisingInlineRouteId === routeId && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0, bottom: 0, left: 6, right: 0,
                                  backgroundColor: "#282828",
                                  borderRadius: validation && validation.zoneB.visible ? "0 4px 0 0" : "0 4px 0 4px",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  overflow: "hidden",
                                  animation: "rb-overlay-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both",
                                  zIndex: 2,
                                }}
                              >
                                {/* Subtle shimmer sweep */}
                                <div
                                  aria-hidden
                                  style={{
                                    position: "absolute", inset: 0, pointerEvents: "none",
                                    background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)",
                                    backgroundSize: "200% 100%",
                                    animation: "rb-shimmer 2.4s linear infinite",
                                  }}
                                />
                                {/* Centred content column — Figma "Empty" frame, width 308, gap 12 */}
                                <div style={{
                                  position: "relative",
                                  display: "flex", flexDirection: "column",
                                  alignItems: "center", gap: 12,
                                  width: 308,
                                  padding: "16px 16px 12px 20px",
                                }}>
                                  {/* EmptyHeader: title row + subtitle with tight 2px gap */}
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", alignSelf: "stretch", gap: 2 }}>
                                    {/* Title row: spinner + title, gap 8 */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                      {/* 32×32 spinner container with 20px svg inside */}
                                      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "rb-spin 1s linear infinite" }}>
                                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                        </svg>
                                      </div>
                                      <span style={{ fontSize: 16, fontWeight: 500, color: "#FAFAFA", lineHeight: "24px", fontFamily: "Geist, sans-serif" }}>
                                        Optimising Routes...
                                      </span>
                                    </div>
                                    {/* Phase subtitle (keyed for crossfade) */}
                                    <span
                                      key={optimisingPhaseIndex}
                                      style={{
                                        display: "block",
                                        fontSize: 14, color: "#A3A3A3", lineHeight: "20px",
                                        textAlign: "center", fontFamily: "Geist, sans-serif",
                                        animation: "rb-phase-in 220ms ease both",
                                      }}
                                    >
                                      {OPTIMISE_PHASES[Math.min(optimisingPhaseIndex, OPTIMISE_PHASES.length - 1)].text}
                                    </span>
                                  </div>
                                  {/* Cancel */}
                                  <button
                                    onClick={() => {
                                      setOptimisingInlineRouteId(null)
                                      setOptimisingPhaseIndex(0)
                                    }}
                                    style={{
                                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                                      height: 32, padding: "0 12px", borderRadius: 4,
                                      fontSize: 14, fontWeight: 500, lineHeight: 1, color: "#FAFAFA",
                                      backgroundColor: "transparent", border: "1px solid #333",
                                      cursor: "pointer", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                                      fontFamily: "Geist, sans-serif",
                                      transition: "background-color 150ms ease, transform 120ms ease",
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)" }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                                    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)" }}
                                    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Driver dropdown — floating popover anchored to button via fixed positioning */}
                            {driverDropdownRouteId === routeId && driverDropdownRect && (
                              <div
                                data-driver-dropdown
                                style={{
                                  position: "fixed",
                                  top: driverDropdownRect.bottom + 4,
                                  left: driverDropdownRect.left,
                                  width: Math.max(driverDropdownRect.width, 260),
                                  zIndex: 9999,
                                  backgroundColor: "#1A1A1A",
                                  border: "1px solid #333",
                                  borderRadius: 4,
                                  boxShadow: "0px 4px 6px 0px rgba(0,0,0,0.1), 0px 2px 4px 0px rgba(0,0,0,0.1)",
                                  overflow: "hidden",
                                }}
                              >
                                {/* Search */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "10px 12px",
                                    borderBottom: "1px solid #333",
                                  }}
                                >
                                  <Search size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                                  <input
                                    type="text"
                                    placeholder="Search"
                                    value={driverSearch}
                                    onChange={(e) => setDriverSearch(e.target.value)}
                                    autoFocus
                                    style={{
                                      flex: 1,
                                      fontSize: 14,
                                      fontWeight: 400,
                                      color: "#E5E5E5",
                                      background: "none",
                                      border: "none",
                                      outline: "none",
                                      lineHeight: "20px",
                                      padding: 0,
                                    }}
                                  />
                                </div>
                                {/* Driver list */}
                                <div style={{ padding: 4 }}>
                                  {DRIVERS
                                    .filter((d) => d.name.toLowerCase().includes(driverSearch.toLowerCase()))
                                    .map((driver) => {
                                      const isSelected = selectedDrivers[routeId]?.id === driver.id
                                      return (
                                        <div
                                          key={driver.id}
                                          onClick={() => {
                                            setSelectedDrivers((prev) => ({ ...prev, [routeId]: driver }))
                                            setDriverDropdownRouteId(null)
                                            setDriverSearch("")
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "6px 8px",
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            fontSize: 14,
                                            fontWeight: 400,
                                            color: "#E5E5E5",
                                            lineHeight: "20px",
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "#333"
                                            e.currentTarget.style.borderRadius = "2px"
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                            e.currentTarget.style.borderRadius = "4px"
                                          }}
                                        >
                                          <span style={{ flex: 1 }}>
                                            {driver.name} ({driver.orderCount})
                                          </span>
                                          {isSelected && <Check size={16} color="#E5E5E5" style={{ flexShrink: 0 }} />}
                                        </div>
                                      )
                                    })}
                                </div>
                              </div>
                            )}

                            {/* Equipment dropdown — two-level: primary (selected truck + add trailer) → expanded (search + list) */}
                            {truckDropdownRouteId === routeId && (() => {
                              const currentTruck = selectedTrucks[routeId] ?? (truckId ? TRUCKS.find(t => t.id === truckId) : null) ?? null
                              const currentTrailers = selectedTrailers[routeId] ?? { t1: null, t2: null }
                              const filteredTrucks = TRUCKS.filter((t) => t.name.toLowerCase().includes(cardTruckSearch.toLowerCase()))
                              const filteredTrailers = TRAILERS.filter((t) => t.name.toLowerCase().includes(cardTrailerSearch.toLowerCase()))
                              return (
                              <div
                                data-truck-dropdown
                                style={{
                                  position: "absolute",
                                  ...(truckDropupEnabled
                                    ? { bottom: "calc(100% - 44px)", top: "auto" }
                                    : { top: 44, bottom: "auto" }),
                                  left: 20, right: 16, zIndex: 999,
                                  backgroundColor: truckSearchExpanded ? "#111" : "#1B1B1B",
                                  border: "1px solid #333", borderRadius: 4,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)", overflow: "hidden",
                                }}
                              >
                                {/* Selected truck row (or "No truck selected") */}
                                <div style={{ padding: 4, backgroundColor: "#1B1B1B", borderBottom: "1px solid #333" }}>
                                  <div
                                    onClick={() => { setTruckSearchExpanded(s => !s); setCardTruckSearch("") }}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 16, padding: "6px 8px",
                                      borderRadius: 2, cursor: "pointer",
                                      backgroundColor: truckSearchExpanded ? "#282828" : "transparent",
                                    }}
                                    onMouseEnter={(e) => { if (!truckSearchExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = "#282828" }}
                                    onMouseLeave={(e) => { if (!truckSearchExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
                                  >
                                    {currentTruck ? (
                                      <>
                                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                          <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTruck.name}</span>
                                          {currentTruck.capacity && (
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                              <span style={{ fontSize: 14, color: "#A3A3A3" }}>{currentTruck.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{currentTruck.compartments}</span>
                                            </div>
                                          )}
                                        </div>
                                        <TypeBadge label={currentTruck.badge} />
                                        <ChevronDown size={16} color="#737373" style={{ flexShrink: 0, transform: truckSearchExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
                                      </>
                                    ) : (
                                      <>
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                                          <span style={{ fontSize: 16, color: "#E5E5E5" }}>No truck selected</span>
                                          <span style={{ fontSize: 14, color: "#A3A3A3" }}>Click to search trucks</span>
                                        </div>
                                        <Plus size={20} color="#A3A3A3" style={{ flexShrink: 0 }} />
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Truck search + list (expanded) */}
                                {truckSearchExpanded && (
                                  <>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                                      <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                                      <input type="text" placeholder="Search Truck" value={cardTruckSearch} onChange={(e) => setCardTruckSearch(e.target.value)} autoFocus
                                        style={{ flex: 1, fontSize: 14, fontWeight: 400, color: "#E5E5E5", background: "none", border: "none", outline: "none", lineHeight: "20px", padding: 0, fontFamily: "Geist, sans-serif" }} />
                                    </div>
                                    <div style={{ padding: 4, maxHeight: 220, overflowY: "auto", borderBottom: "1px solid #333" }}>
                                      {filteredTrucks.map((truck) => {
                                        const isSelected = currentTruck?.id === truck.id
                                        return (
                                          <div key={truck.id} onClick={() => {
                                            setSelectedTrucks((prev) => ({ ...prev, [routeId]: truck }))
                                            setSelectedTrailers((prev) => ({ ...prev, [routeId]: { t1: null, t2: null } }))
                                            setTruckSearchExpanded(false)
                                            setCardTruckSearch("")
                                          }}
                                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer",
                                              backgroundColor: isSelected ? "rgba(255,255,255,0.06)" : "transparent" }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)" }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "rgba(255,255,255,0.06)" : "transparent" }}
                                          >
                                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                              <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{truck.name}</span>
                                              {truck.capacity && (
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{truck.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{truck.compartments}</span>
                                                </div>
                                              )}
                                            </div>
                                            <TypeBadge label={truck.badge} />
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </>
                                )}

                                {/* Trailer section — mirrors TruckHubCard (only when truck search NOT expanded) */}
                                {!truckSearchExpanded && currentTruck && (
                                  <>
                                    {/* Trailer 1 selected row */}
                                    {currentTrailers.t1 && (
                                      <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                                        <div
                                          onClick={() => { setCardTrailerSlot(cardTrailerSlot === 1 ? 0 : 1); setCardTrailerSearch("") }}
                                          style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 8px", borderRadius: 2, backgroundColor: "#1B1B1B", cursor: "pointer" }}
                                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                                        >
                                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                            <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrailers.t1.name}</span>
                                            {currentTrailers.t1.capacity && <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{currentTrailers.t1.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{currentTrailers.t1.compartments}</span></div>}
                                          </div>
                                          <TypeBadge label="Trailer" />
                                          <ChevronDown size={16} color="#737373" style={{ flexShrink: 0, transform: cardTrailerSlot === 1 ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
                                        </div>
                                      </div>
                                    )}
                                    {/* Trailer 1 search */}
                                    {cardTrailerSlot === 1 && (
                                      <div style={{ borderBottom: "1px solid #333" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                                          <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                                          <input autoFocus value={cardTrailerSearch} onChange={(e) => setCardTrailerSearch(e.target.value)} placeholder="Search Trailer"
                                            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }} />
                                        </div>
                                        <div style={{ padding: 4, maxHeight: 180, overflowY: "auto", backgroundColor: "#111" }}>
                                          {TRAILERS.filter(t => t.name.toLowerCase().includes(cardTrailerSearch.toLowerCase())).map((t) => (
                                            <div key={t.id} onClick={() => { setSelectedTrailers(prev => ({ ...prev, [routeId]: { ...currentTrailers, t1: t } })); setCardTrailerSlot(0); setCardTrailerSearch("") }}
                                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer", backgroundColor: currentTrailers.t1?.id === t.id ? "rgba(255,255,255,0.06)" : "transparent" }}
                                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"}
                                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = currentTrailers.t1?.id === t.id ? "rgba(255,255,255,0.06)" : "transparent" }}
                                            >
                                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                                                {t.capacity && <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span></div>}
                                              </div>
                                              <TypeBadge label="Trailer" />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Trailer 2 selected row */}
                                    {currentTrailers.t2 && (
                                      <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                                        <div
                                          onClick={() => { setCardTrailerSlot(cardTrailerSlot === 2 ? 0 : 2); setCardTrailerSearch("") }}
                                          style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 8px", borderRadius: 2, backgroundColor: "#1B1B1B", cursor: "pointer" }}
                                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                                        >
                                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                            <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrailers.t2.name}</span>
                                            {currentTrailers.t2.capacity && <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{currentTrailers.t2.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{currentTrailers.t2.compartments}</span></div>}
                                          </div>
                                          <TypeBadge label="Trailer" />
                                          <ChevronDown size={16} color="#737373" style={{ flexShrink: 0, transform: cardTrailerSlot === 2 ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
                                        </div>
                                      </div>
                                    )}
                                    {/* Trailer 2 search */}
                                    {cardTrailerSlot === 2 && (
                                      <div style={{ borderBottom: "1px solid #333" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                                          <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                                          <input autoFocus value={cardTrailerSearch} onChange={(e) => setCardTrailerSearch(e.target.value)} placeholder="Search Trailer"
                                            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif" }} />
                                        </div>
                                        <div style={{ padding: 4, maxHeight: 180, overflowY: "auto", backgroundColor: "#111" }}>
                                          {TRAILERS.filter(t => t.name.toLowerCase().includes(cardTrailerSearch.toLowerCase())).map((t) => (
                                            <div key={t.id} onClick={() => { setSelectedTrailers(prev => ({ ...prev, [routeId]: { ...currentTrailers, t2: t } })); setCardTrailerSlot(0); setCardTrailerSearch("") }}
                                              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer", backgroundColor: currentTrailers.t2?.id === t.id ? "rgba(255,255,255,0.06)" : "transparent" }}
                                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"}
                                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = currentTrailers.t2?.id === t.id ? "rgba(255,255,255,0.06)" : "transparent" }}
                                            >
                                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                                                {t.capacity && <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span></div>}
                                              </div>
                                              <TypeBadge label="Trailer" />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Add Trailer button — only if a slot is still free */}
                                    {!(currentTrailers.t1 && currentTrailers.t2) && cardTrailerSlot === 0 && (
                                      <div
                                        onClick={() => { setCardTrailerSlot(currentTrailers.t1 ? 2 : 1); setCardTrailerSearch("") }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer" }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)" }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
                                      >
                                        <Plus size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px" }}>Add Trailer</span>
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Hint when no truck selected and search not expanded */}
                                {!truckSearchExpanded && !currentTruck && (
                                  <div style={{ padding: "8px 12px 10px" }}>
                                    <span style={{ fontSize: 14, color: "#737373" }}>Trailers can be added only after adding a Truck</span>
                                  </div>
                                )}
                              </div>
                              )
                            })()}

                            {/* Trailer dropdown — search + list */}
                            {trailerDropdownRouteId === routeId && (() => {
                              const currentTrailers = selectedTrailers[routeId] ?? { t1: null, t2: null }
                              const filteredTrailers = TRAILERS.filter((t) => t.name.toLowerCase().includes(cardTrailerSearch.toLowerCase()))
                              return (
                              <div
                                data-trailer-dropdown
                                style={{
                                  position: "absolute", top: 44, left: 20, right: 16, zIndex: 999,
                                  backgroundColor: "#111", border: "1px solid #333", borderRadius: 4,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)", overflow: "hidden",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #333" }}>
                                  <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
                                  <input type="text" placeholder="Search Trailer" value={cardTrailerSearch} onChange={(e) => setCardTrailerSearch(e.target.value)} autoFocus
                                    style={{ flex: 1, fontSize: 14, fontWeight: 400, color: "#E5E5E5", background: "none", border: "none", outline: "none", lineHeight: "20px", padding: 0, fontFamily: "Geist, sans-serif" }} />
                                </div>
                                <div style={{ padding: 4, maxHeight: 240, overflowY: "auto" }}>
                                  {filteredTrailers.map((trailer) => {
                                    const isSelected = currentTrailers.t1?.id === trailer.id || currentTrailers.t2?.id === trailer.id
                                    return (
                                      <div key={trailer.id} onClick={() => {
                                        if (!currentTrailers.t1) {
                                          setSelectedTrailers((prev) => ({ ...prev, [routeId]: { ...currentTrailers, t1: trailer } }))
                                        } else if (!currentTrailers.t2) {
                                          setSelectedTrailers((prev) => ({ ...prev, [routeId]: { ...currentTrailers, t2: trailer } }))
                                        } else {
                                          setSelectedTrailers((prev) => ({ ...prev, [routeId]: { ...currentTrailers, t1: trailer } }))
                                        }
                                        setTrailerDropdownRouteId(null)
                                        setCardTrailerSearch("")
                                      }}
                                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer",
                                          backgroundColor: isSelected ? "rgba(255,255,255,0.06)" : "transparent" }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)" }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "rgba(255,255,255,0.06)" : "transparent" }}
                                      >
                                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                          <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trailer.name}</span>
                                          {trailer.capacity && (
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                              <span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer.capacity}</span><SpecsDot /><span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer.compartments}</span>
                                            </div>
                                          )}
                                        </div>
                                        <TypeBadge label="Trailer" />
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                              )
                            })()}
                            </div>{/* end card body (wedge scope) */}

                            {/* Zone B: Banner — inside card wrapper, below wedge */}
                            {validation && validation.zoneB.visible && (() => {
                              const isRed = validation.collapsedBannerType === "red"
                              const isAmber = validation.collapsedBannerType === "amber"
                              const bannerColor = isRed ? "#f87171" : "#eab308"
                              const bannerBg = isRed ? "rgba(220, 38, 38, 0.2)" : "rgba(234, 179, 8, 0.09)"
                              const hasIssues = validation.expandedIssues.length > 0
                              const issueCount = validation.expandedIssues.length
                              const uniqueStops = isRed && validation.l3.length > 0
                                ? [...new Set(validation.l3.map(i => i.stopIndex))].sort((a, b) => a - b)
                                : []

                              return (
                                <div
                                  style={{
                                    backgroundColor: bannerBg,
                                    borderRadius: "0px 0px 4px 4px",
                                    padding: "6px 16px 6px 20px",
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                    {(isRed || (isAmber && hasIssues)) && <TriangleAlert size={16} color={bannerColor} style={{ flexShrink: 0 }} />}
                                    <span style={{
                                      fontSize: 14, fontWeight: 400, color: bannerColor,
                                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                    }}>
                                      {isRed && uniqueStops.length > 0
                                        ? `${issueCount} Issue${issueCount !== 1 ? "s" : ""}`
                                        : (isExpanded && hasIssues
                                            ? validation.expandedBannerText
                                            : validation.collapsedBannerText)
                                      }
                                    </span>
                                  </div>
                                  {isRed && uniqueStops.length > 0 && isExpanded ? (
                                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                      {uniqueStops.map(stopIdx => (
                                        <StopChip key={stopIdx} stopIndex={stopIdx} onClick={() => scrollToStop(routeId, stopIdx)} />
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                      {validation.expandedIssues.length <= 1 && !(isExpanded && hasIssues) && isAmber && validation.l1.status === "below" && (
                                        <ArrowDown size={16} color={bannerColor} />
                                      )}
                                      {validation.expandedIssues.length <= 1 && !(isExpanded && hasIssues) && validation.collapsedBannerDelta && (
                                        <span style={{ fontSize: 14, fontWeight: 400, color: bannerColor, whiteSpace: "nowrap" }}>
                                          {validation.collapsedBannerDelta}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })()}

                          </div>{/* end card wrapper */}
                        </div>{/* end flex-row: checkbox + card */}
                        </div>{/* end sticky wrapper */}

                        {/* Expanded accordion — full width (no indent), CARD_LEFT handled internally */}
                        {isExpanded && (
                          <div>
                          <ExpandedRouteCard
                            orders={sortedOrders}
                            color={color}
                            hubName={hubName}
                            truckName={userSelectedTruck?.name ?? truckName}
                            driverName={driverName}
                            recentlyAddedOrderId={recentlyAddedOrderId}
                            validation={validation}
                            hasLoadOrders={sortedOrders.some((o) => o.orderType === "L")}
                            routeId={routeId}
                            onTruckChange={(truck) => setSelectedTrucks((prev) => ({ ...prev, [routeId]: truck }))}
                            onOpenModal={() => {
                              setActiveRouteIdForModal(routeId)
                              setIsAddLoadModalOpen(true)
                            }}
                            onOpenCreateOrderModal={() => {
                              setCreateOrderRouteId(routeId)
                              setIsCreateOrderModalOpen(true)
                              if (createOrderModalView === "modal3") onCreateOrderSideSheetOpen?.()
                            }}
                            onReorder={(fromIdx, toIdx) => {
                              const ids = sortedOrders.map((o) => o.id)
                              const [moved] = ids.splice(fromIdx, 1)
                              ids.splice(toIdx, 0, moved)
                              setReorderedRoutes((prev) => ({ ...prev, [routeId]: ids }))
                            }}
                            onPlannedQtyClick={(order, anchorY, anchorX) => {
                              if (orderDetailsOrder?.id === order.id) {
                                setOrderDetailsOrder(null)
                              } else {
                                setOrderDetailsOrder(order)
                                setOrderDetailsAnchorY(anchorY)
                                setOrderDetailsAnchorX(anchorX)
                              }
                            }}
                            detailsOpenOrderId={orderDetailsOrder?.id ?? null}
                            onHoverOrder={onHoveredOrderChange}
                            checkedScheduledOrderIds={checkedScheduledOrderIds}
                            onToggleScheduledOrder={toggleScheduledOrderChecked}
                            onBreakdownClick={(orderId, cardLeft, cardRight, fabTop) => {
                              setBreakdownAnchorLeft(cardLeft)
                              setBreakdownAnchorRight(cardRight)
                              setBreakdownAnchorY(fabTop)
                              setBreakdownOrderId(orderId)
                            }}
                            breakdownOpenOrderId={breakdownOrderId}
                            onViewTruckDetails={(cardLeft, cardRight, btnTop) => {
                              setTruckDetailsAnchorLeft(cardLeft)
                              setTruckDetailsAnchorRight(cardRight)
                              setTruckDetailsAnchorY(btnTop)
                              setTruckDetailsRouteId(routeId)
                            }}
                          />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

            {/* ── UNASSIGNED SECTION ── */}
              <div
                ref={unassignedSectionRef}
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
                  <>
                  {/* Select All Unassigned Orders header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 0 4px" }}>
                    <CheckboxInput checked={allUnassignedChecked} indeterminate={someUnassignedChecked} onChange={toggleAllUnassigned} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", lineHeight: "20px" }}>
                      Select All Unassigned Orders
                    </span>
                  </div>
                  {unassignedOrders.map((order) => {
                    const type = order.orderType ?? "D"
                    const totalAssets = order.totalAssets ?? 0
                    const totalTopOffs = order.totalTopOffs ?? 0
                    const urgency = order.urgency ?? { red: 0, yellow: 0, green: 0, blue: 0 }
                    const unassignedTime = /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(order.scheduledDate ?? "")
                      ? order.scheduledDate
                      : new Date(order.scheduledDate ?? "").toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })

                    if (orderCardView === "condensed") {
                      return (
                        <div
                          key={order.id}
                          style={{
                            backgroundColor: "#1F1F1F",
                            borderRadius: 4,
                            padding: "16px 16px 12px",
                            display: "flex",
                            flexDirection: "row",
                            gap: 12,
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#282828"
                            const grip = e.currentTarget.querySelector<SVGElement>(".unassigned-grip-icon")
                            if (grip) grip.style.opacity = "1"
                            const fab = e.currentTarget.querySelector<HTMLDivElement>(".unassigned-fab")
                            if (fab) fab.style.opacity = "1"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#1F1F1F"
                            const grip = e.currentTarget.querySelector<SVGElement>(".unassigned-grip-icon")
                            if (grip) grip.style.opacity = "0"
                            const fab = e.currentTarget.querySelector<HTMLDivElement>(".unassigned-fab")
                            if (fab) fab.style.opacity = "0"
                          }}
                        >
                          {/* Left: checkbox + grip */}
                          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", paddingBottom: 4, gap: 12, flexShrink: 0 }}>
                            <div style={{ paddingTop: 4 }}>
                              <CheckboxInput checked={checkedUnassignedOrderIds.includes(order.id)} onChange={() => toggleUnassignedOrderChecked(order.id)} />
                            </div>
                            <svg className="unassigned-grip-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0, transition: "opacity 0.15s", cursor: "grab" }}>
                              <circle cx="7" cy="6" r="1.5" fill="#A3A3A3" />
                              <circle cx="7" cy="10" r="1.5" fill="#A3A3A3" />
                              <circle cx="7" cy="14" r="1.5" fill="#A3A3A3" />
                              <circle cx="13" cy="6" r="1.5" fill="#A3A3A3" />
                              <circle cx="13" cy="10" r="1.5" fill="#A3A3A3" />
                              <circle cx="13" cy="14" r="1.5" fill="#A3A3A3" />
                            </svg>
                          </div>
                          {/* Right: content */}
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                            {/* Badge + name row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{
                                width: 20, height: 20, backgroundColor: type === "L" ? "#189ffc" : "#25b8a7",
                                borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 500, color: "#171717", lineHeight: 1, flexShrink: 0,
                              }}>
                                {type}
                              </div>
                              <span style={{ flex: 1, fontSize: 16, fontWeight: 500, color: "#FFFFFF", lineHeight: "24px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {order.shipToName ?? order.customerName}
                              </span>
                            </div>
                            {/* Planned qty + time row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <button
                                style={{
                                  fontSize: 14, fontWeight: 500, color: "#FAFAFA", opacity: 0.6, lineHeight: "20px",
                                  background: "transparent", border: "none", cursor: "pointer",
                                  height: 28, padding: "0 10px", marginLeft: -10, borderRadius: 4,
                                  textAlign: "left", transition: "opacity 0.15s, background-color 0.15s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.backgroundColor = "#404040" }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.backgroundColor = "transparent" }}
                              >
                                Planned Qty: {order.volume > 0 ? `${order.volume.toLocaleString()} gal` : "—"}
                              </button>
                              <span style={{ fontSize: 12, fontWeight: 400, color: "#A3A3A3", lineHeight: "16px", flexShrink: 0 }}>
                                5:45 AM
                              </span>
                            </div>
                          </div>
                          {/* FAB — 3-dot, positioned top-right */}
                          <div
                            className="unassigned-fab"
                            style={{
                              position: "absolute", top: 8, right: 8,
                              opacity: 0, transition: "opacity 0.15s",
                              display: "flex", alignItems: "center",
                              backgroundColor: "#1B1B1B", border: "1px solid #282828",
                              borderRadius: 4, padding: 4,
                            }}
                          >
                            <button
                              style={{
                                width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 2, border: "none", background: "transparent",
                                cursor: "pointer", color: "#FAFAFA", padding: 0,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333" }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: "#1F1F1F",
                        borderRadius: 4,
                        padding: 16,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#282828" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1F1F1F" }}
                    >
                      {/* Left: checkbox */}
                      <div style={{ paddingTop: 4, flexShrink: 0 }}>
                        <CheckboxInput checked={checkedUnassignedOrderIds.includes(order.id)} onChange={() => toggleUnassignedOrderChecked(order.id)} />
                      </div>
                      {/* Right: content */}
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Header: name + address */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 16, fontWeight: 500, color: "#FFFFFF", lineHeight: "24px" }}>
                          {order.shipToName ?? order.customerName}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span style={{ fontSize: 14, fontWeight: 400, color: "#737373", lineHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {order.shipToAddress}
                          </span>
                        </div>
                      </div>

                      {/* Inner card: time + badge + stats */}
                      <div style={{ backgroundColor: "#282828", borderRadius: 4, padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Planned at + type badge */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5", lineHeight: "20px" }}>
                              Planned at: <strong>{unassignedTime}</strong>
                            </span>
                          </div>
                          <div style={{
                            width: 20, height: 20, backgroundColor: type === "L" ? "#189ffc" : "#25b8a7",
                            borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 500, color: "#171717", lineHeight: 1,
                          }}>
                            {type}
                          </div>
                        </div>

                        {/* Stats row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", lineHeight: "28px" }}>{totalAssets}</span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Assets</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", lineHeight: "28px" }}>{order.volume > 0 ? order.volume.toLocaleString() : "—"}</span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Ordered Gals</span>
                            </div>
                            <div style={{ width: 1, alignSelf: "stretch", backgroundColor: "#333" }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 18, fontWeight: 700, color: "#E5E5E5", lineHeight: "28px" }}>{totalTopOffs}</span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Top Off Assets</span>
                            </div>
                          </div>
                          {/* Urgency dots */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 88, width: 88, alignItems: "center", justifyContent: "center" }}>
                            {URGENCY_COLORS.map(({ key, color }) => (
                              <div key={key} style={{ width: 40, backgroundColor: "#333", borderRadius: 4, padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 400, color: "#E5E5E5", lineHeight: "16px" }}>{urgency[key]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                    )
                  })}
                  </>
                )}
              </div>
          </div>

          {/* ── UNIFIED FAB — appears when anything is checked ── */}
          {(checkedRouteIds.length > 0 || checkedUnassignedOrderIds.length > 0 || checkedScheduledOrderIds.length > 0) && (() => {
            const hasRoutes = checkedRouteIds.length > 0
            const hasUnassigned = checkedUnassignedOrderIds.length > 0
            const hasScheduled = checkedScheduledOrderIds.length > 0
            const hasBoth = hasRoutes && hasUnassigned
            const totalCount = checkedScheduledOrderIds.length + checkedUnassignedOrderIds.length
            const btnStyle: React.CSSProperties = {
              height: 32, padding: "0 12px", borderRadius: 4, fontSize: 14, fontWeight: 500,
              color: "#FAFAFA", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
            }
            const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)" }
            const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "transparent" }

            // Scheduled orders only (individual order checkboxes inside routes) → Unassign + Move
            if (hasScheduled && !hasRoutes && !hasUnassigned) {
              return (
                <div style={{
                  position: "absolute", bottom: 40, left: 24, right: 24, zIndex: 100,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: 12, backgroundColor: "#3E45C8", borderRadius: 8,
                  boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)",
                  fontFamily: "Geist, sans-serif",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap", padding: "8px 4px" }}>
                    {checkedScheduledOrderIds.length} Order{checkedScheduledOrderIds.length !== 1 ? "s" : ""} Selected
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setCheckedScheduledOrderIds([])} style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                      Unassign
                    </button>
                    <button style={{ ...btnStyle, display: "flex", alignItems: "center", gap: 4 }} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                      Move
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div style={{
                position: "absolute", bottom: 40, left: 24, right: 24, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: 12, backgroundColor: "#3E45C8", borderRadius: 8,
                boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)",
                fontFamily: "Geist, sans-serif",
              }}>
                {/* Left: count */}
                <span style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA", lineHeight: "20px", whiteSpace: "nowrap", padding: "8px 4px" }}>
                  {totalCount} Order{totalCount !== 1 ? "s" : ""} Selected
                </span>
                {/* Right: actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Remove — always present */}
                  <button
                    onClick={() => {
                      if (hasRoutes) {
                        setSelectedOrders(prev => prev.filter(o => !o.routeId || !checkedRouteIds.includes(o.routeId)))
                        setSelectedRouteIds(prev => prev.filter(id => !checkedRouteIds.includes(id)))
                        onCheckedRoutesChange([])
                      }
                      if (hasUnassigned) {
                        setCheckedUnassignedOrderIds([])
                      }
                      if (hasScheduled) {
                        setCheckedScheduledOrderIds([])
                      }
                    }}
                    style={btnStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                  >
                    Remove
                  </button>

                  {hasBoth ? (
                    /* ── Mixed: routes + unassigned → Remove | Merge ── */
                    <>
                      <div style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                      <button
                        onClick={() => { setMergeModalMode("create"); setIsMergeModalOpen(true) }}
                        style={btnStyle}
                        onMouseEnter={hoverIn}
                        onMouseLeave={hoverOut}
                      >
                        Merge
                      </button>
                    </>
                  ) : hasRoutes ? (
                    /* ── Routes only → Unassign | Optimise/Merge ── */
                    (() => {
                      const singleId = checkedRouteIds.length === 1 ? checkedRouteIds[0] : null
                      const singleRoute = singleId ? mockRoutes.find(r => r.id === singleId) : null
                      const singleTruckProfile = singleId
                        ? (selectedTrucks[singleId]?.id ? TRUCK_CAPACITIES[selectedTrucks[singleId].id] : null) ?? (singleRoute?.truckId ? TRUCK_CAPACITIES[singleRoute.truckId] : null)
                        : null
                      const singleHasTruck = !!(singleId && (selectedTrucks[singleId] ?? singleTruckProfile ?? singleRoute?.truckName))
                      return (
                        <>
                          <button style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                            Unassign
                          </button>
                          {checkedRouteIds.length === 1 ? (
                            singleHasTruck && (
                              <>
                                <div style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                                <button
                                  onClick={() => {
                                    const rid = checkedRouteIds[0]
                                    const orderIdsForRoute = selectedOrders.filter(o => o.routeId === rid).map(o => o.id)
                                    onCheckedRoutesChange([])
                                    setCheckedScheduledOrderIds(prev => prev.filter(id => !orderIdsForRoute.includes(id)))
                                    setOptimisingPhaseIndex(0)
                                    setOptimisingInlineRouteId(rid)
                                  }}
                                  style={btnStyle}
                                  onMouseEnter={hoverIn}
                                  onMouseLeave={hoverOut}
                                >
                                  Optimise
                                </button>
                              </>
                            )
                          ) : (
                            <>
                              <div style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                              <button
                                onClick={() => { setMergeModalMode("create"); setIsMergeModalOpen(true) }}
                                style={btnStyle}
                                onMouseEnter={hoverIn}
                                onMouseLeave={hoverOut}
                              >
                                Merge
                              </button>
                            </>
                          )}
                        </>
                      )
                    })()
                  ) : (
                    /* ── Unassigned only → Move | Create ── */
                    <>
                      <button style={{ ...btnStyle, display: "flex", alignItems: "center", gap: 4 }} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                        Move
                        <ChevronDown size={16} />
                      </button>
                      <div style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
                      <button
                        onClick={() => { setMergeModalMode("create"); setIsMergeModalOpen(true) }}
                        style={btnStyle}
                        onMouseEnter={hoverIn}
                        onMouseLeave={hoverOut}
                      >
                        Create
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })()}

          {/* ── FOOTER ── */}
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid rgba(115, 115, 115, 0.2)",
              flexShrink: 0,
            }}
          >
            <button
              disabled={checkedRouteIds.length > 0 || checkedUnassignedOrderIds.length > 0 || checkedScheduledOrderIds.length > 0}
              style={{
                width: "100%",
                height: 40,
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                color: "#FAFAFA",
                backgroundColor: "#4D55F8",
                border: "none",
                cursor: (checkedRouteIds.length > 0 || checkedUnassignedOrderIds.length > 0 || checkedScheduledOrderIds.length > 0) ? "default" : "pointer",
                opacity: (checkedRouteIds.length > 0 || checkedUnassignedOrderIds.length > 0 || checkedScheduledOrderIds.length > 0) ? 0.5 : 1,
                transition: "opacity 150ms ease",
              }}
              onMouseEnter={(e) => { if (checkedRouteIds.length === 0 && checkedUnassignedOrderIds.length === 0 && checkedScheduledOrderIds.length === 0) e.currentTarget.style.backgroundColor = "#3D45E8" }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4D55F8" }}
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
          routeProducts={(() => {
            const routeOrders = [...(selectedOrders.filter((o) => o.routeId === activeRouteIdForModal)), ...(addedLoadOrders[activeRouteIdForModal] ?? [])]
            const products = new Set<string>()
            for (const o of routeOrders) {
              if ((!o.orderType || o.orderType === "D") && o.productBreakdown) {
                for (const pb of o.productBreakdown) products.add(pb.product)
              }
            }
            return Array.from(products)
          })()}
          productShortfalls={(() => {
            const route = mockRoutes.find((r) => r.id === activeRouteIdForModal)
            const truckId = selectedTrucks[activeRouteIdForModal]?.id ?? route?.truckId
            const truckProfile = truckId ? TRUCK_CAPACITIES[truckId] ?? null : null
            if (!truckProfile) return []
            const routeOrders = [...(selectedOrders.filter((o) => o.routeId === activeRouteIdForModal)), ...(addedLoadOrders[activeRouteIdForModal] ?? [])]
            const v = validateRouteCapacity(routeOrders, truckProfile, route?.retainedFuel)
            if (!v) return []
            return v.l2.map((issue) => ({ product: issue.product, shortfall: issue.overflow }))
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
              productBreakdown: info.productBreakdown?.map((pb) => ({
                product: pb.product as any,
                volume: pb.volume,
              })),
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

      {/* Create Order Modal — two entry paths:
         • inline + on a route card (createOrderRouteId set) → splices into that route
         • map shipto-pin tooltip (createOrderRouteId null + prefill) → lands in Unassigned */}
      {isCreateOrderModalOpen && (
        <CreateOrderModal
          isOpen={isCreateOrderModalOpen}
          prefillShipToId={createOrderPrefillShipToId ?? null}
          prefillDriverName={
            createOrderRouteId
              ? (mockRoutes.find((r) => r.id === createOrderRouteId)?.driverName ?? null)
              : null
          }
          onClose={() => {
            setIsCreateOrderModalOpen(false)
            setCreateOrderRouteId(null)
            onClearCreateOrderPrefillShipToId?.()
          }}
          onCollapseToDrawer={() => {
            updateCreateOrderModalView("modal3")
            onCreateOrderSideSheetOpen?.()
          }}
          onSubmit={(data: CreateOrderSubmit) => {
            const routeId = createOrderRouteId

            if (!routeId) {
              const orderId = `delivery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
              // Orders created from the map UI always land in Unassigned
              const newOrder: ExtractionOrder = {
                id: orderId,
                customerId: data.customerId,
                customerName: data.customerName,
                shipToName: data.shipToName,
                shipToAddress: data.shipToAddress,
                latitude: data.latitude,
                longitude: data.longitude,
                status: "pending",
                volume: data.volume,
                scheduledDate: data.scheduledTimeLabel,
                zoneId: "",
                hubId: "",
                city: data.city,
                state: data.state,
                zip: data.zip,
                tankSize: 0,
                currentLevel: 0,
                daysUntilEmpty: 0,
                priority: "Medium",
                lastDelivery: "",
                zone: data.zone,
                orderType: "D",
              }
              setAddedUnassignedOrders((prev) => [...prev, newOrder])
              setRecentlyAddedOrderId(orderId)
              setTimeout(() => setRecentlyAddedOrderId(null), 4500)
              onShowMessage?.("Order added to Unassigned. Move it to a route from there.")

              setIsCreateOrderModalOpen(false)
              setCreateOrderRouteId(null)
              onClearCreateOrderPrefillShipToId?.()
              return
            }

            const baseRouteOrders = selectedOrders.filter((o) => o.routeId === routeId)
            const existing = [
              ...baseRouteOrders,
              ...(addedLoadOrders[routeId] ?? []),
              ...(addedDeliveryOrders[routeId] ?? []),
            ]
            const route = mockRoutes.find((r) => r.id === routeId)
            const hubId = existing[0]?.hubId ?? route?.hubId ?? ""

            // Use time-of-day (minutes since midnight) for insertion.
            // Existing orders show their time via MOCK_STOP_TIMES[routeSequence-1]; new
            // create-order entries carry an explicit "HH:MM AM/PM" string on scheduledDate.
            const orderMins = (o: ExtractionOrder, fallbackIdx: number) => {
              if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(o.scheduledDate ?? "")) {
                return timeStrToMins(o.scheduledDate)
              }
              const seqIdx = Math.floor(o.routeSequence ?? fallbackIdx + 1) - 1
              const slot = MOCK_STOP_TIMES[seqIdx] ?? MOCK_STOP_TIMES[fallbackIdx]
              return slot ? timeStrToMins(slot) : 0
            }
            const newMins = timeStrToMins(data.scheduledTimeLabel)
            // Sort existing by time-of-day to find the slot the new order goes into.
            const indexed = existing.map((o, i) => ({ o, mins: orderMins(o, i) }))
            indexed.sort((a, b) => a.mins - b.mins)
            let insertAfterIdx = -1
            for (let i = 0; i < indexed.length; i++) {
              if (indexed[i].mins <= newMins) insertAfterIdx = i
              else break
            }
            const prevSeq = insertAfterIdx >= 0
              ? (indexed[insertAfterIdx].o.routeSequence ?? insertAfterIdx + 1)
              : 0
            const nextIdx = insertAfterIdx + 1
            const nextSeq = nextIdx < indexed.length
              ? (indexed[nextIdx].o.routeSequence ?? nextIdx + 1)
              : prevSeq + 1
            const newSeq = (prevSeq + nextSeq) / 2

            const newOrder: ExtractionOrder = {
              id: `delivery-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              customerId: data.customerId,
              customerName: data.customerName,
              shipToName: data.shipToName,
              shipToAddress: data.shipToAddress,
              latitude: data.latitude,
              longitude: data.longitude,
              status: "assigned",
              volume: data.volume,
              // Carry the picked time as "HH:MM AM/PM" so the seq column displays it directly.
              scheduledDate: data.scheduledTimeLabel,
              zoneId: "",
              hubId,
              city: data.city,
              state: data.state,
              zip: data.zip,
              tankSize: 0,
              currentLevel: 0,
              daysUntilEmpty: 0,
              priority: "Medium",
              lastDelivery: "",
              zone: data.zone,
              routeId,
              routeSequence: newSeq,
              orderType: "D",
            }

            const updated = {
              ...addedDeliveryOrders,
              [routeId]: [...(addedDeliveryOrders[routeId] ?? []), newOrder],
            }
            setAddedDeliveryOrders(updated)
            onAddedDeliveryOrdersChange?.(updated)

            setRecentlyAddedOrderId(newOrder.id)
            setTimeout(() => setRecentlyAddedOrderId(null), 4500)

            // Expand the route card so the new order is immediately visible
            setExpandedRouteIds((prev) => prev.includes(routeId) ? prev : [...prev, routeId])

            const driverFirstName = (route?.driverName ?? "Driver").split(" ")[0]
            onShowMessage?.(`Delivery Order added to ${driverFirstName}'s Route successfully`)

            setIsCreateOrderModalOpen(false)
            setCreateOrderRouteId(null)
            onClearCreateOrderPrefillShipToId?.()
          }}
        />
      )}

      {/* Order Details Popover */}
      {orderDetailsOrder && (
        <OrderDetailsPopover
          order={orderDetailsOrder}
          anchorY={orderDetailsAnchorY}
          anchorX={orderDetailsAnchorX}
          onClose={() => setOrderDetailsOrder(null)}
        />
      )}

      {/* Merge / Optimise Modal */}
      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => { setIsMergeModalOpen(false); setOptimiseRouteId(null) }}
        checkedRouteIds={mergeModalMode === "optimise" && optimiseRouteId ? [optimiseRouteId] : checkedRouteIds}
        checkedUnassignedOrderIds={checkedUnassignedOrderIds}
        selectedOrders={selectedOrders}
        modalMode={mergeModalMode}
        onComplete={(truckCount, orderCount) => {
          onCheckedRoutesChange([])
          setCheckedUnassignedOrderIds([])
          setOptimiseRouteId(null)
          onShowMessage?.(mergeModalMode === "optimise"
            ? `Route optimised with ${orderCount} orders`
            : `${truckCount} optimised routes created with ${orderCount} orders`)
        }}
      />

      {/* Truck Details sheet — opens from "View Truck Details" button inside expanded route card */}
      {(() => {
        if (!truckDetailsRouteId) return null
        const route = mockRoutes.find((r) => r.id === truckDetailsRouteId)
        const truck = selectedTrucks[truckDetailsRouteId] ?? null
        const truckId = truck?.id ?? route?.truckId
        const truckProfile = truckId ? TRUCK_CAPACITIES[truckId] ?? null : null
        const truckName = truck?.name ?? route?.truckName ?? null
        return (
          <TruckDetailsSheet
            isOpen={true}
            onClose={() => setTruckDetailsRouteId(null)}
            truckProfile={truckProfile}
            truckName={truckName}
            anchorLeft={truckDetailsAnchorLeft}
            anchorRight={truckDetailsAnchorRight}
            anchorY={truckDetailsAnchorY}
          />
        )
      })()}

      {/* Route Summary modal — opened from the 3-dot dropdown's "View Route Summary" item.
          BalanceTableModal handles both cases natively:
            - Load order present → L stop becomes numbered stop #1
            - No load order → "Assumed starting load" row computes per-product starting qty from truck capacity */}
      {(() => {
        if (!routeSummaryRouteId) return null
        const route = mockRoutes.find((r) => r.id === routeSummaryRouteId)
        if (!route) return null
        const baseOrders = selectedOrders.filter((o) => o.routeId === routeSummaryRouteId)
        const added = addedLoadOrders[routeSummaryRouteId] ?? []
        const allOrders = [...baseOrders, ...added]

        const truck = selectedTrucks[routeSummaryRouteId] ?? null
        const truckId = truck?.id ?? route.truckId
        const truckCapacity = truckId ? TRUCK_CAPACITIES[truckId]?.totalCapacity : undefined
        const compartmentValues = initialInventories[routeSummaryRouteId] ?? {}
        const initialInventory = aggregateCompartmentValues(compartmentValues)
        const canEditInitialInventory = truckId != null && TRUCK_CAPACITIES[truckId] != null

        return (
          <BalanceTableModal
            isOpen={true}
            onClose={() => setRouteSummaryRouteId(null)}
            orders={allOrders}
            truckCapacity={truckCapacity}
            initialInventory={initialInventory}
            onEditInitialInventory={
              canEditInitialInventory
                ? () => setEditingInitialInventoryRouteId(routeSummaryRouteId)
                : undefined
            }
          />
        )
      })()}

      {/* Initial Inventory editor — opens on pencil-icon click inside Route Summary */}
      {(() => {
        const routeId = editingInitialInventoryRouteId
        if (!routeId) return null
        const route = mockRoutes.find((r) => r.id === routeId)
        if (!route) return null
        const truck = selectedTrucks[routeId] ?? null
        const truckId = truck?.id ?? route.truckId
        const truckProfile = truckId ? TRUCK_CAPACITIES[truckId] : null
        if (!truckProfile) return null
        const truckName = truck?.name ?? route.truckName ?? truckId ?? "Truck"

        // Route-demand products = distinct products across delivery orders for this route
        const baseOrders = selectedOrders.filter((o) => o.routeId === routeId)
        const added = addedLoadOrders[routeId] ?? []
        const allOrders = [...baseOrders, ...added]
        const demandSet = new Set<import("@/lib/truck-data").FuelProduct>()
        for (const o of allOrders) {
          if (o.orderType === "L") continue
          for (const pb of o.productBreakdown ?? []) {
            demandSet.add(pb.product)
          }
        }
        const routeDemandProducts = Array.from(demandSet)

        return (
          <InitialInventoryModal
            isOpen={true}
            onClose={() => setEditingInitialInventoryRouteId(null)}
            truckName={truckName}
            truckProfile={truckProfile}
            routeDemandProducts={routeDemandProducts}
            initialValues={initialInventories[routeId]}
            onSave={(values) =>
              setInitialInventories((prev) => ({ ...prev, [routeId]: values }))
            }
          />
        )
      })()}

      {/* Product & Compartment Breakdown sheet — opens from order-card FAB package icon */}
      {(() => {
        if (!breakdownOrderId) return null
        const allOrdersIncludingAdded = [
          ...selectedOrders,
          ...Object.values(addedLoadOrders).flat(),
        ]
        const sourceOrder = allOrdersIncludingAdded.find((o) => o.id === breakdownOrderId)
        const routeId = sourceOrder?.routeId
        if (!routeId) return null
        const route = mockRoutes.find((r) => r.id === routeId)
        if (!route) return null
        const baseOrders = selectedOrders.filter((o) => o.routeId === routeId)
        const added = addedLoadOrders[routeId] ?? []
        const allOrders = [...baseOrders, ...added]
        const truckId = selectedTrucks[routeId]?.id ?? route.truckId
        const truckProfile = truckId ? TRUCK_CAPACITIES[truckId] ?? null : null
        return (
          <BreakdownSheet
            isOpen={true}
            onClose={() => setBreakdownOrderId(null)}
            orders={allOrders}
            truckProfile={truckProfile}
            selectedOrderId={breakdownOrderId}
            anchorLeft={breakdownAnchorLeft}
            anchorRight={breakdownAnchorRight}
            anchorY={breakdownAnchorY}
          />
        )
      })()}
    </div>
  )
}
