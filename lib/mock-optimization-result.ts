import type { ExtractionOrder } from "@/lib/mock-data"
import type { OptimizationResult, OptimizedRoute, UnassignedOrder } from "@/lib/optimization-types"

const ROUTE_COLORS = [
  "#D8B4FE", // purple
  "#FDBA74", // orange
  "#93C5FD", // blue
  "#FBCFE8", // pink
  "#6EE7B7", // green
  "#FDE68A", // yellow
  "#C4B5FD", // violet
  "#FCA5A5", // red
  "#5EEAD4", // teal
  "#A5B4FC", // indigo
  "#BEF264", // lime
  "#67E8F9", // cyan
]

const DETAIL_WHY = [
  "Orders grouped in the same delivery zone to minimize drive time.",
  "Products are compatible with this truck's compartment configuration.",
  "Stop sequence avoids run-out on must-go deliveries.",
]

const DETAIL_SEQUENCE: NonNullable<OptimizedRoute["sequence"]> = [
  { seq: "load", name: "Flint Hills Terminal", kind: "load", loadType: "suggested", product: "Clear Diesel", qtyGal: 2500 },
  { seq: 1, name: "Lost Creek Apartments", kind: "delivery", product: "Clear Diesel", qtyGal: 800, mustGo: true },
  { seq: 2, name: "Barton Creek Mall", kind: "delivery", product: "Regular Unleaded", qtyGal: 1200 },
  { seq: 3, name: "Westlake Medical Center", kind: "delivery", product: "Clear Diesel", qtyGal: 600, mustGo: true },
]

const ALL_12_ROUTES: Omit<OptimizedRoute, "id" | "why" | "sequence">[] = [
  {
    truckName: "H-118 · 2019 Kenworth Tank Wagon",
    specs: { capacityGal: "5,500 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 12, estTimeMins: 550, estDistanceMi: 128 },
    orderCount: 6, stopCount: 6, efficiencyPct: 94,
    color: ROUTE_COLORS[0],
    flags: {},
  },
  {
    truckName: "H-401 · 2023 Volvo VNL 860 Tanker",
    specs: { capacityGal: "6,200 gal", compartments: "6 Compartments", productCount: 3 },
    metrics: { gpm: 12, estTimeMins: 670, estDistanceMi: 152 },
    orderCount: 8, stopCount: 8, efficiencyPct: 78,
    color: ROUTE_COLORS[1],
    flags: { overShift: true, hosConflict: true },
  },
  {
    truckName: "H-589 · 2021 Volvo FH16 Tanker",
    specs: { capacityGal: "5,800 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 11, estTimeMins: 480, estDistanceMi: 110 },
    orderCount: 5, stopCount: 6, efficiencyPct: 88,
    color: ROUTE_COLORS[2],
    flags: { hasManualLoad: true },
  },
  {
    truckName: "H-561 · 2023 Kenworth T880 Box Truck",
    specs: { capacityGal: "5,000 gal", compartments: "4 Compartments", productCount: 3 },
    metrics: { gpm: 10, estTimeMins: 490, estDistanceMi: 118 },
    orderCount: 7, stopCount: 8, efficiencyPct: 91,
    color: ROUTE_COLORS[3],
    flags: { mustGoCount: 1 },
  },
  {
    truckName: "H-223 · 2020 Mack Pinnacle Tanker",
    specs: { capacityGal: "4,800 gal", compartments: "4 Compartments", productCount: 2 },
    metrics: { gpm: 9, estTimeMins: 360, estDistanceMi: 89 },
    orderCount: 4, stopCount: 5, efficiencyPct: 82,
    color: ROUTE_COLORS[4],
    flags: {},
  },
  {
    truckName: "H-334 · 2022 Peterbilt 579 Tanker",
    specs: { capacityGal: "6,000 gal", compartments: "6 Compartments", productCount: 3 },
    metrics: { gpm: 13, estTimeMins: 610, estDistanceMi: 145 },
    orderCount: 9, stopCount: 10, efficiencyPct: 75,
    color: ROUTE_COLORS[5],
    flags: { hasManualLoad: true, mustGoCount: 2 },
  },
  {
    truckName: "H-445 · 2021 International LT Tanker",
    specs: { capacityGal: "5,200 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 11, estTimeMins: 520, estDistanceMi: 122 },
    orderCount: 6, stopCount: 7, efficiencyPct: 90,
    color: ROUTE_COLORS[6],
    flags: {},
  },
  {
    truckName: "H-556 · 2022 Freightliner Cascadia",
    specs: { capacityGal: "5,600 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 12, estTimeMins: 540, estDistanceMi: 131 },
    orderCount: 6, stopCount: 8, efficiencyPct: 85,
    loadCount: 2,
    color: ROUTE_COLORS[7],
    flags: {},
  },
  {
    truckName: "H-667 · 2020 Kenworth W990 Tanker",
    specs: { capacityGal: "5,400 gal", compartments: "5 Compartments", productCount: 3 },
    metrics: { gpm: 11, estTimeMins: 470, estDistanceMi: 107 },
    orderCount: 5, stopCount: 6, efficiencyPct: 92,
    color: ROUTE_COLORS[8],
    flags: { mustGoCount: 1 },
  },
  {
    truckName: "H-778 · 2023 Volvo VNL 760 Tanker",
    specs: { capacityGal: "6,000 gal", compartments: "6 Compartments", productCount: 3 },
    metrics: { gpm: 12, estTimeMins: 640, estDistanceMi: 149 },
    orderCount: 8, stopCount: 9, efficiencyPct: 79,
    color: ROUTE_COLORS[9],
    flags: { overShift: true },
  },
  {
    truckName: "H-889 · 2021 Mack Anthem Tanker",
    specs: { capacityGal: "5,100 gal", compartments: "4 Compartments", productCount: 2 },
    metrics: { gpm: 10, estTimeMins: 510, estDistanceMi: 119 },
    orderCount: 5, stopCount: 6, efficiencyPct: 87,
    color: ROUTE_COLORS[10],
    flags: { hasManualLoad: true },
  },
  {
    truckName: "H-990 · 2022 Peterbilt 389 Tanker",
    specs: { capacityGal: "5,700 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 13, estTimeMins: 400, estDistanceMi: 96 },
    orderCount: 6, stopCount: 5, efficiencyPct: 95,
    color: ROUTE_COLORS[11],
    flags: {},
  },
]

const MOCK_UNASSIGNED: UnassignedOrder[] = [
  // 8 missing_data
  { id: "u1", name: "Sunrise Auto Body", reason: "missing_data", reasonDetail: "No product or quantity on this call-in order.", mustGo: true, suggestedFix: "Add product & quantity" },
  { id: "u2", name: "Cedar Park Fleet", reason: "missing_data", reasonDetail: "Missing delivery window — cannot schedule.", suggestedFix: "Add a delivery time window" },
  { id: "u3", name: "Pflugerville Tank Co.", reason: "missing_data", reasonDetail: "No ShipTo address set.", suggestedFix: "Add ShipTo location" },
  { id: "u4", name: "Round Rock Diesel", reason: "missing_data", reasonDetail: "No product or quantity on this call-in order.", suggestedFix: "Add product & quantity" },
  { id: "u5", name: "Georgetown Fuels", reason: "missing_data", reasonDetail: "Missing delivery window — cannot schedule.", suggestedFix: "Add a delivery time window" },
  { id: "u6", name: "Manor Gas Supply", reason: "missing_data", reasonDetail: "No ShipTo address set.", suggestedFix: "Add ShipTo location" },
  { id: "u7", name: "Buda Ag Services", reason: "missing_data", reasonDetail: "No product or quantity on this call-in order.", suggestedFix: "Add product & quantity" },
  { id: "u8", name: "Kyle Transport Hub", reason: "missing_data", reasonDetail: "Missing delivery window — cannot schedule.", suggestedFix: "Add a delivery time window" },
  // 10 no_capacity
  { id: "u9", name: "Capitol Fuel Stop", reason: "no_capacity", reasonDetail: "All routes are at capacity for this product.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u10", name: "Lakeline Industrial", reason: "no_capacity", reasonDetail: "No truck has remaining compartment space for Diesel.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u11", name: "North Loop Depot", reason: "no_capacity", reasonDetail: "All routes are at capacity for this product.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u12", name: "Domain Distribution", reason: "no_capacity", reasonDetail: "No truck has remaining compartment space for Premium.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u13", name: "Mueller Market", reason: "no_capacity", reasonDetail: "All routes are at capacity for this product.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u14", name: "Travis County Fleet", reason: "no_capacity", reasonDetail: "No remaining capacity for Reg Unleaded.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u15", name: "Montopolis Fueling", reason: "no_capacity", reasonDetail: "All routes at capacity.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u16", name: "East 7th Tank Farm", reason: "no_capacity", reasonDetail: "No remaining compartment space for Clear Diesel.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u17", name: "Slaughter Lane Stop", reason: "no_capacity", reasonDetail: "All routes at capacity for this product.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u18", name: "South Congress Fuels", reason: "no_capacity", reasonDetail: "No remaining capacity for Diesel.", suggestedFix: "Add a truck or re-optimize" },
  // 4 time_window
  { id: "u19", name: "Oak Hill Storage", reason: "time_window", reasonDetail: "Delivery window cannot be met from the planned start time.", suggestedFix: "Adjust window or start time" },
  { id: "u20", name: "Sunset Valley Ag", reason: "time_window", reasonDetail: "Delivery window closes before any route can reach it.", suggestedFix: "Adjust window or start time" },
  { id: "u21", name: "Bee Cave Fleet", reason: "time_window", reasonDetail: "Time window is too narrow — 15-min window with 45-min drive.", suggestedFix: "Widen time window" },
  { id: "u22", name: "Westlake Hills Co.", reason: "time_window", reasonDetail: "Delivery window cannot be met from the planned start time.", suggestedFix: "Adjust window or start time" },
  // 3 retain
  { id: "u23", name: "Riverbend Fleet", reason: "retain", reasonDetail: "Compartment must hold retain product after delivery.", suggestedFix: "Different compartment/truck" },
  { id: "u24", name: "Barton Springs Coop", reason: "retain", reasonDetail: "Retain constraint conflicts with requested product mix.", suggestedFix: "Different compartment/truck" },
  { id: "u25", name: "Zilker Park Fuels", reason: "retain", reasonDetail: "Compartment must hold retain product after delivery.", suggestedFix: "Different compartment/truck" },
]

export function buildMockOptimizationResult(
  _orders: ExtractionOrder[],
  _orderCount?: number,
): OptimizationResult {
  const routes: OptimizedRoute[] = ALL_12_ROUTES.map((card, i) => ({
    id: `opt-route-${i + 1}`,
    ...card,
    why: DETAIL_WHY,
    sequence: DETAIL_SEQUENCE,
  }))

  return {
    routes,
    unassigned: MOCK_UNASSIGNED,
    summary: {
      routeCount: 12,
      ordersPlaced: 75,
      ordersTotal: 100,
      unassignedCount: 25,
      conflictCount: 5,
      loadsSequenced: 12,
    },
  }
}

export function formatEstTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
