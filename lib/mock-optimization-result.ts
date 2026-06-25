import type { ExtractionOrder } from "@/lib/mock-data"
import type { OptimizationResult, OptimizedRoute, UnassignedOrder } from "@/lib/optimization-types"

const ROUTE_COLORS = ["#D8B4FE", "#FDBA74", "#93C5FD", "#FBCFE8"]

/** First 4 cards match Figma frame 6051:32770 exactly */
const FIGMA_ROUTE_CARDS: Omit<OptimizedRoute, "id" | "why" | "sequence">[] = [
  {
    truckName: "H-118 · 2019 Kenworth Tank Wagon",
    specs: { capacityGal: "5,500 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 12, estTimeMins: 550, estDistanceMi: 128 },
    orderCount: 6,
    capacityDeltaGal: 300,
    color: ROUTE_COLORS[0],
    flags: {},
  },
  {
    truckName: "H-401 · 2023 Volvo VNL 860 Tanker",
    specs: { capacityGal: "6,200 gal", compartments: "6 Compartments", productCount: 3 },
    metrics: { gpm: 12, estTimeMins: 670, estDistanceMi: 128 },
    orderCount: 6,
    capacityDeltaGal: 300,
    color: ROUTE_COLORS[1],
    flags: { overShift: true },
  },
  {
    truckName: "H-589 · 2021 Volvo FH16 Tanker",
    specs: { capacityGal: "5,800 gal", compartments: "5 Compartments", productCount: 2 },
    metrics: { gpm: 12, estTimeMins: 550, estDistanceMi: 128 },
    orderCount: 6,
    capacityDeltaGal: 300,
    color: ROUTE_COLORS[2],
    flags: {},
  },
  {
    truckName: "H-561 · 2023 Kenworth T880 Box Truck",
    specs: { capacityGal: "5,000 gal", compartments: "4 Compartments", productCount: 3 },
    metrics: { gpm: 12, estTimeMins: 490, estDistanceMi: 128 },
    orderCount: 6,
    capacityDeltaGal: 300,
    color: ROUTE_COLORS[3],
    flags: {},
  },
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

const MOCK_UNASSIGNED: UnassignedOrder[] = [
  { id: "u1", name: "Sunrise Auto Body", reason: "missing_data", reasonDetail: "No product or quantity on this call-in order.", mustGo: true, suggestedFix: "Add product & quantity" },
  { id: "u2", name: "Oak Hill Storage", reason: "time_window", reasonDetail: "Delivery window cannot be met from the planned start time.", suggestedFix: "Adjust window or start time" },
  { id: "u3", name: "Riverbend Fleet", reason: "no_terminal_product", reasonDetail: "No allowed terminal stocks Premium Unleaded for this customer.", suggestedFix: "Add an allowed terminal" },
  { id: "u4", name: "Capitol Fuel Stop", reason: "no_capacity", reasonDetail: "All routes are at capacity for this product.", suggestedFix: "Add a truck or re-optimize" },
  { id: "u5", name: "Lakeline Industrial", reason: "retain", reasonDetail: "Compartment must hold retain product after delivery.", suggestedFix: "Different compartment/truck" },
]

export function buildMockOptimizationResult(
  _orders: ExtractionOrder[],
  _orderCount?: number,
): OptimizationResult {
  const routeCount = 12
  const routes: OptimizedRoute[] = FIGMA_ROUTE_CARDS.map((card, i) => ({
    id: `opt-route-${i + 1}`,
    ...card,
    why: DETAIL_WHY,
    sequence: DETAIL_SEQUENCE,
  }))

  return {
    routes,
    unassigned: MOCK_UNASSIGNED,
    summary: {
      routeCount,
      ordersPlaced: 75,
      ordersTotal: 100,
      unassignedCount: 25,
      conflictCount: 5,
      loadsSequenced: routeCount,
    },
  }
}

export function formatEstTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}
