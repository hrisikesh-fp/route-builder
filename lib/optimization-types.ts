export type UnassignedReason =
  | "missing_data"
  | "time_window"
  | "no_terminal_product"
  | "no_capacity"
  | "retain"
  | "compartment_not_empty"

export type Stop = {
  seq: number | "load"
  name: string
  kind: "delivery" | "load"
  loadType?: "suggested" | "manual"
  product: string
  qtyGal?: number
  mustGo?: boolean
  eta?: string
  durationMins?: number
}

export type OptimizedRoute = {
  id: string
  truckName: string
  specs: { capacityGal: string; compartments: string; productCount: number }
  metrics: { gpm: number; estTimeMins: number; estDistanceMi: number }
  orderCount: number
  stopCount?: number
  efficiencyPct?: number
  loadCount?: number
  capacityDeltaGal?: number
  color: string
  flags: { mustGoCount?: number; hasManualLoad?: boolean; overShift?: boolean; hosConflict?: boolean }
  why?: string[]
  sequence?: Stop[]
}

export type UnassignedOrder = {
  id: string
  name: string
  reason: UnassignedReason
  reasonDetail: string
  mustGo?: boolean
  suggestedFix?: string
}

export type OptimizationResult = {
  routes: OptimizedRoute[]
  unassigned: UnassignedOrder[]
  summary: {
    routeCount: number
    ordersPlaced: number
    ordersTotal: number
    unassignedCount: number
    conflictCount: number
    loadsSequenced?: number
  }
}
