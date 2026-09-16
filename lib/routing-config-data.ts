// Tenant-level Routing Config v1 — maps to live UAT keys.
// Hard constraints only. Per-run overrides and per-entity settings are out of v1.
// Source mock: 1-projects/fp-ds-2026/routing-config-now.html

export type RoadProfile = "Hazmat" | "Balanced" | "Fastest" | "Shortest"

export type OptimizeFor =
  | "Most gallons delivered per shift"
  | "Fewest driver hours"
  | "Least driving time"
  | "Fewest trucks used"

export interface RoutingConfig {
  restrictToAuthorizedTerminals: boolean
  filterTerminalsByProduct: boolean
  bindLinkedDeliveriesSameRoute: boolean
  maxRouteDurationHours: number
  minJobsPerRoute: number
  profilePreference: RoadProfile
  timePerLoadMin: number
  pumpRateGalPerMin: number
  shortestDeliveryMin: number
  optimizeFor: OptimizeFor
}

/** Seeded to the values already in UAT for the product-demo tenant. */
export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  restrictToAuthorizedTerminals: true,
  filterTerminalsByProduct: true,
  bindLinkedDeliveriesSameRoute: true,
  maxRouteDurationHours: 10,
  minJobsPerRoute: 4,
  profilePreference: "Hazmat",
  timePerLoadMin: 15,
  pumpRateGalPerMin: 50,
  shortestDeliveryMin: 5,
  optimizeFor: "Most gallons delivered per shift",
}

export const ROAD_PROFILES: RoadProfile[] = ["Hazmat", "Balanced", "Fastest", "Shortest"]

export const OPTIMIZE_FOR_OPTIONS: OptimizeFor[] = [
  "Most gallons delivered per shift",
  "Fewest driver hours",
  "Least driving time",
  "Fewest trucks used",
]
