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
  terminalAuthorization: boolean
  terminalCarding: boolean
  productQualifications: boolean
  driverHours: boolean
  deliveryWindows: boolean
  runOutProtection: boolean
  urgentOrders: boolean
  linkedDeliveries: boolean
  terminalProductAvailability: boolean
  bulkPlantInventory: boolean
  shiftLength: boolean
  maxRouteDurationHours: number
  productContinuity: boolean
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
  terminalCarding: true,
  productQualifications: true,
  driverHours: true,
  deliveryWindows: true,
  runOutProtection: true,
  urgentOrders: true,
  linkedDeliveries: true,
  terminalProductAvailability: true,
  bulkPlantInventory: true,
  shiftLength: true,
  maxRouteDurationHours: 10,
  productContinuity: true,
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

export const OBJ_TYPES: { value: ObjType; label: string }[] = [
  { value: "min", label: "Minimize" },
  { value: "min-max", label: "Minimize the highest" },
]

export const OBJ_VALUES: { value: ObjValue; label: string }[] = [
  { value: "vehicles", label: "Trucks used" },
  { value: "completion_time", label: "Finish time with drive back" },
  { value: "completion_time_last_stop", label: "Finish time at last drop" },
  { value: "route_duration", label: "Route length" },
  { value: "transport_time", label: "Driving time" },
]
