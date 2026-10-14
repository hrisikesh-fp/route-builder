import type { OptimizationResult, UnassignedReason } from "@/lib/optimization-types"
import type { ReasonGroup, ReasonTier, RunRecord, RunRoute } from "@/lib/run-types"
import { PLANNED_DATE } from "@/lib/run-history-data"

// Turns the prototype's optimize result (OptimizationResult, the shape the Create Routes and
// Optimise modals already return) into a RunRecord, so the Workspace can show the run block and
// Run details with the same components as Run history. In route-builder-web this is the #296 run
// summary plus #298's stored request.

const TIER: Record<UnassignedReason, ReasonTier> = {
  missing_product_qty: "never",
  missing_data: "never",
  product_truck_fit: "never",
  no_terminal_product: "never",
  retain: "compartments",
  compartment_not_empty: "compartments",
  time_window: "stop_rule",
  no_capacity: "stop_rule",
}

export function runFromOptimization(result: OptimizationResult, number: number, goalLabel = "Current default"): RunRecord {
  const routes: RunRoute[] = result.routes.map((r) => ({
    id: r.id,
    truck: r.truckName,
    color: r.color,
    orderCount: r.orderCount,
    gallons: Math.round(r.metrics.gpm * r.metrics.estDistanceMi),
    miles: r.metrics.estDistanceMi,
    minutes: r.metrics.estTimeMins,
    stops: [],
  }))

  const byReason = new Map<string, ReasonGroup>()
  for (const u of result.unassigned) {
    const key = `${u.reason}|${u.reasonDetail}`
    const g = byReason.get(key) ?? { id: key, message: u.reasonDetail.replace(/\.$/, ""), hint: u.suggestedFix, tier: TIER[u.reason], orders: [] }
    g.orders.push({ id: u.id, name: u.name, latitude: 0, longitude: 0, gallons: 0 })
    byReason.set(key, g)
  }

  const now = new Date()
  const gallons = routes.reduce((s, r) => s + r.gallons, 0)
  return {
    requestId: `rb-${now.getTime()}-proto`,
    number,
    plannedDate: PLANNED_DATE,
    submittedAt: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    by: "You",
    durationLabel: "9.8s",
    status: "finished",
    fate: "not_used",
    scope: { kind: "full_day", orderCount: result.summary.ordersTotal },
    goalLabel,
    inputs: {
      orders: result.summary.ordersTotal,
      gallons,
      products: [],
      trucks: routes.map((r) => r.truck),
      drivers: [],
      rules: ["Truck capacity", "Product fits the compartment", "Terminal access per truck"],
      limits: ["Day capped at 10h"],
      goalLabel,
      travelTimes: "Fetched fresh from the map service",
    },
    result: {
      placed: result.summary.ordersPlaced,
      total: result.summary.ordersTotal,
      gallons,
      miles: routes.reduce((s, r) => s + r.miles, 0),
      timeToCompleteMin: Math.max(0, ...routes.map((r) => r.minutes)),
      operatingMin: routes.reduce((s, r) => s + r.minutes, 0),
      trucksUsed: routes.length,
      routes,
      unassigned: [...byReason.values()],
      warnings: result.summary.conflictCount,
    },
  }
}
