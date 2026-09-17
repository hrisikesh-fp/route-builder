// Tenant-level Routing Config v1 — port of routing-config-v8.html
// Hard constraints only. Per-run overrides, search, and soft constraints are out.

export type PanelId =
  | "truck"
  | "driver"
  | "orders"
  | "terminal"
  | "route"
  | "timing"
  | "goal"

export const PANELS: { id: PanelId; label: string }[] = [
  { id: "truck", label: "Truck" },
  { id: "driver", label: "Driver" },
  { id: "orders", label: "Order and Customer" },
  { id: "terminal", label: "Terminal and Supply" },
  { id: "route", label: "Route" },
  { id: "timing", label: "Loading and Delivery" },
  { id: "goal", label: "Optimization Goal" },
]

export type RoadProfile = "hazmat" | "balanced" | "fastest" | "shortest"
export type ObjType = "min" | "min-max"
export type ObjValue =
  | "vehicles"
  | "completion_time"
  | "completion_time_last_stop"
  | "route_duration"
  | "transport_time"

export interface Objective {
  type: ObjType
  value: ObjValue
}

export interface RoutingConfig {
  compartmentCapacity: boolean
  productCompatibility: boolean
  compartmentProductApprovals: boolean
  /** Always on. Not a toggle — off times out the engine on large terminal lists. */
  terminalAuthorization: true
  terminalCarding: boolean
  driverHours: boolean
  deliveryWindows: boolean
  runOutProtection: boolean
  urgentOrders: boolean
  linkedDeliveries: boolean
  terminalProductAvailability: boolean
  /** UI `HH:mm`. API `optimization.shiftStartTime` as `HH:mm:ss`. */
  defaultStartTime: string
  maxRouteDurationHours: number
  minDeliveries: boolean
  minJobsPerRoute: number
  profilePreference: RoadProfile
  timePerLoadMin: number
  pumpRateGalPerMin: number
  shortestDeliveryMin: number
  objectives: Objective[]
}

export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  compartmentCapacity: true,
  productCompatibility: true,
  compartmentProductApprovals: true,
  terminalAuthorization: true,
  terminalCarding: false,
  driverHours: true,
  // Off until product-demo testing. Dylan enabling this in UAT broke optimize (16 Sept).
  deliveryWindows: false,
  runOutProtection: true,
  urgentOrders: true,
  linkedDeliveries: true,
  terminalProductAvailability: true,
  // Engine today falls back to 00:00 if this is unset. 07:00 is the tenant default for the UI.
  defaultStartTime: "07:00",
  maxRouteDurationHours: 10,
  minDeliveries: true,
  minJobsPerRoute: 5,
  profilePreference: "hazmat",
  timePerLoadMin: 15,
  pumpRateGalPerMin: 50,
  shortestDeliveryMin: 5,
  objectives: [
    { type: "min", value: "vehicles" },
    { type: "min", value: "completion_time_last_stop" },
  ],
}

export const ROAD_PROFILES: { value: RoadProfile; label: string }[] = [
  { value: "hazmat", label: "Hazmat approved roads" },
  { value: "balanced", label: "Balanced" },
  { value: "fastest", label: "Fastest" },
  { value: "shortest", label: "Shortest" },
]

/** Live UAT/prod blend as of 11 Sept. Both are type `min`. Do not add rows in v1. */
export const LIVE_OBJECTIVES = [
  { n: 1, typeLabel: "Minimize", valueLabel: "Trucks used", engine: "min vehicles" },
  {
    n: 2,
    typeLabel: "Minimize",
    valueLabel: "Finish time (last stop)",
    engine: "min completion_time_last_stop",
  },
] as const
