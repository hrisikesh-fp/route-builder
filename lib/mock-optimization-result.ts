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
  "14 orders in the same delivery zone",
  "All diesel — one compatible load source",
  "Sequenced to clear before each tank runs out",
  "1 must-go included, not dropped",
]

const DETAIL_SEQUENCE: NonNullable<OptimizedRoute["sequence"]> = [
  { seq: 1, name: "Georgetown Fuel Depot", kind: "load", loadType: "manual", product: "Clear Diesel", qtyGal: 5200 },
  { seq: 2, name: "Taylor Auto Group", kind: "delivery", product: "Clear Diesel", qtyGal: 1400 },
  { seq: 3, name: "Hutto Farms Co-op", kind: "delivery", product: "Clear Diesel", qtyGal: 1100, mustGo: true },
  { seq: 4, name: "Round Rock Express Stadium", kind: "delivery", product: "Clear Diesel", qtyGal: 700 },
  { seq: 5, name: "Georgetown Municipal", kind: "delivery", product: "Clear Diesel", qtyGal: 500 },
  { seq: 6, name: "Jarrell Equipment", kind: "delivery", product: "Clear Diesel", qtyGal: 150 },
]

const ALL_3_ROUTES: Omit<OptimizedRoute, "id" | "why" | "sequence">[] = [
  {
    // Clean route — efficiency % only
    truckName: "H-118 · 2019 Kenworth Tank Wagon",
    specs: { capacityGal: "5,500 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 12, estTimeMins: 550, estDistanceMi: 128 },
    orderCount: 6, stopCount: 6, efficiencyPct: 94,
    color: ROUTE_COLORS[0],
    flags: {},
  },
  {
    // Manual Load + HOS conflict (overShift) — no efficiency badge
    truckName: "H-401 · 2023 Volvo VNL 860 Tanker",
    specs: { capacityGal: "6,200 gal", compartments: "6 Compartments", productCount: 3 },
    metrics: { gpm: 12, estTimeMins: 670, estDistanceMi: 152 },
    orderCount: 8, stopCount: 8,
    color: ROUTE_COLORS[1],
    flags: { overShift: true, hosConflict: true, hasManualLoad: true },
  },
  {
    // Must-go + efficiency %
    truckName: "H-589 · 2021 Volvo FH16 Tanker",
    specs: { capacityGal: "5,800 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 11, estTimeMins: 480, estDistanceMi: 110 },
    orderCount: 5, stopCount: 6, efficiencyPct: 88,
    color: ROUTE_COLORS[2],
    flags: { mustGoCount: 1 },
  },
]

const MOCK_UNASSIGNED: UnassignedOrder[] = [
  // missing_product_qty (1)
  { id: "u1", name: "Sunrise Auto Body", reason: "missing_product_qty", reasonDetail: "No product or quantity on this order.", mustGo: true, suggestedFix: "Add product & quantity" },
  // missing_data (2)
  { id: "u2", name: "Cedar Park Fleet", reason: "missing_data", reasonDetail: "Missing delivery window — cannot schedule.", suggestedFix: "Add a delivery time window" },
  { id: "u3", name: "Pflugerville Tank Co.", reason: "missing_data", reasonDetail: "No delivery location set.", suggestedFix: "Add ShipTo location" },
  // no_capacity (4)
  { id: "u4", name: "Capitol Fuel Stop", reason: "no_capacity", reasonDetail: "No available truck had enough capacity for its planned quantity.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u5", name: "Lakeline Industrial", reason: "no_capacity", reasonDetail: "No truck has remaining compartment space for Diesel.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u6", name: "North Loop Depot", reason: "no_capacity", reasonDetail: "No available truck had enough capacity for its planned quantity.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u7", name: "Domain Distribution", reason: "no_capacity", reasonDetail: "No truck has remaining compartment space for Premium.", suggestedFix: "Add a truck or re-optimize" },
  // time_window (2)
  { id: "u8", name: "Oak Hill Storage", reason: "time_window", reasonDetail: "Delivery window cannot be met by any route from this run.", suggestedFix: "Adjust window or assign manually" },
  { id: "u9", name: "Bee Cave Fleet", reason: "time_window", reasonDetail: "Time window is too narrow — 15-min window with 45-min drive.", suggestedFix: "Widen time window" },
  // product_truck_fit (1)
  { id: "u10", name: "Riverbend Fleet", reason: "product_truck_fit", reasonDetail: "No available truck could carry this product.", suggestedFix: "Add a truck or re-optimize" },
]

export function buildMockOptimizationResult(
  _orders: ExtractionOrder[],
  _orderCount?: number,
): OptimizationResult {
  const routes: OptimizedRoute[] = ALL_3_ROUTES.map((card, i) => ({
    id: `opt-route-${i + 1}`,
    ...card,
    why: DETAIL_WHY,
    sequence: DETAIL_SEQUENCE,
  }))

  return {
    routes,
    unassigned: MOCK_UNASSIGNED,
    summary: {
      routeCount: 3,
      ordersPlaced: 19,
      ordersTotal: 29,
      unassignedCount: 10,
      conflictCount: 2,
      loadsSequenced: 3,
    },
  }
}

export function formatEstTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
