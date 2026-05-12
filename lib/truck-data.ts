// ─── Fuel Product Types ─────────────────────────────────────────────────────
export type FuelProduct =
  | "200*DIESEL-OFFROAD RED"
  | "200*DIESEL-ONROAD CLEAR"
  | "87 OCT W/ 10% ETH"
  | "ULSD CLEAR DIESEL"
  | "DEF PACKAGED"

// ─── Compartment & Capacity Profile ─────────────────────────────────────────

export interface TruckCompartment {
  id: string // "C1", "C2", etc. — system-assigned identifier
  displayName?: string // user-defined name (e.g. "TW Comp 1")
  capacities: Partial<Record<FuelProduct, number>> // product → gallons this compartment holds
}

export interface TruckCapacityProfile {
  truckId: string
  totalCapacity: number
  compartments: TruckCompartment[]
  /** Derived: max gallons per product (sum across all compartments that carry it) */
  productCapacities: Partial<Record<FuelProduct, number>>
}

// ─── Truck Capacity Profiles (per user's plan) ─────────────────────────────
// These match the compartment tables in plan-rb-capacity-v2.md

export const TRUCK_CAPACITIES: Record<string, TruckCapacityProfile> = {
  // Route 1 — Mark Ruffalo (S1: 1 product, fits in 1 load, no issues)
  // 5 equal-volume compartments, each can hold Diesel CLR OR Gas 87
  // Volumes: 1000 / 1000 / 1500 / 1000 / 1000 = 5,500 total
  "H-118": {
    truckId: "H-118",
    totalCapacity: 5500,
    compartments: [
      { id: "C1", displayName: "TW Comp 1", capacities: { "200*DIESEL-ONROAD CLEAR": 1000, "87 OCT W/ 10% ETH": 1000 } },
      { id: "C2", displayName: "TW Comp 2", capacities: { "200*DIESEL-ONROAD CLEAR": 1000, "87 OCT W/ 10% ETH": 1000 } },
      { id: "C3", displayName: "TW Comp 3", capacities: { "200*DIESEL-ONROAD CLEAR": 1500, "87 OCT W/ 10% ETH": 1500 } },
      { id: "C4", displayName: "TW Comp 4", capacities: { "200*DIESEL-ONROAD CLEAR": 1000, "87 OCT W/ 10% ETH": 1000 } },
      { id: "C5", displayName: "TW Comp 5", capacities: { "200*DIESEL-ONROAD CLEAR": 1000, "87 OCT W/ 10% ETH": 1000 } },
    ],
    productCapacities: {
      "200*DIESEL-ONROAD CLEAR": 5500,
      "87 OCT W/ 10% ETH": 5500,
    },
  },

  // Route 2 — Dwayne Johnson
  // 3 compartments, ULSD only, total 4,200
  "H-205": {
    truckId: "H-205",
    totalCapacity: 4200,
    compartments: [
      { id: "C1", displayName: "Tanker Comp 1", capacities: { "ULSD CLEAR DIESEL": 1500 } },
      { id: "C2", displayName: "Tanker Comp 2", capacities: { "ULSD CLEAR DIESEL": 1500 } },
      { id: "C3", displayName: "Tanker Comp 3", capacities: { "ULSD CLEAR DIESEL": 1200 } },
    ],
    productCapacities: {
      "ULSD CLEAR DIESEL": 4200,
    },
  },

  // Route 3 — Jessica Harper (S3: 2 products, mid-route load needed, multi-load options)
  // 4 equal-volume compartments, each can hold Diesel CLR OR Gas 87
  // Volumes: 1200 / 1200 / 1200 / 1000 = 4,600 total
  "H-310": {
    truckId: "H-310",
    totalCapacity: 4600,
    compartments: [
      { id: "C1", displayName: "Tanker Comp 1", capacities: { "200*DIESEL-ONROAD CLEAR": 1200, "87 OCT W/ 10% ETH": 1200 } },
      { id: "C2", displayName: "Tanker Comp 2", capacities: { "200*DIESEL-ONROAD CLEAR": 1200, "87 OCT W/ 10% ETH": 1200 } },
      { id: "C3", displayName: "Tanker Comp 3", capacities: { "200*DIESEL-ONROAD CLEAR": 1200, "87 OCT W/ 10% ETH": 1200 } },
      { id: "C4", displayName: "Tanker Comp 4", capacities: { "200*DIESEL-ONROAD CLEAR": 1000, "87 OCT W/ 10% ETH": 1000 } },
    ],
    productCapacities: {
      "200*DIESEL-ONROAD CLEAR": 4600,
      "87 OCT W/ 10% ETH": 4600,
    },
  },

  // Route 4 — Kyle Reese
  // 4 compartments, ULSD + 87 Reg, total 2,600
  // ULSD = 800+0+600+0 = 1,400 | 87 Reg = 0+700+600+500 = 1,800 → plan says 1,200
  // Per plan: ULSD = 1,400 | 87 Reg = 1,200
  "H-442": {
    truckId: "H-442",
    totalCapacity: 2600,
    compartments: [
      { id: "C1", displayName: "Tanker Comp 1", capacities: { "ULSD CLEAR DIESEL": 800 } },
      { id: "C2", displayName: "Tanker Comp 2", capacities: { "87 OCT W/ 10% ETH": 700 } },
      { id: "C3", displayName: "Tanker Comp 3", capacities: { "ULSD CLEAR DIESEL": 600, "87 OCT W/ 10% ETH": 600 } },
      { id: "C4", displayName: "Tanker Comp 4", capacities: { "87 OCT W/ 10% ETH": 500 } },
    ],
    productCapacities: {
      "ULSD CLEAR DIESEL": 1400,
      "87 OCT W/ 10% ETH": 1200,
    },
  },

  // Route 5 — Forrest Gump
  // 3 compartments, ULSD only, total 5,000
  "H-556": {
    truckId: "H-556",
    totalCapacity: 5000,
    compartments: [
      { id: "C1", displayName: "Tanker Comp 1", capacities: { "ULSD CLEAR DIESEL": 2000 } },
      { id: "C2", displayName: "Tanker Comp 2", capacities: { "ULSD CLEAR DIESEL": 1800 } },
      { id: "C3", displayName: "Tanker Comp 3", capacities: { "ULSD CLEAR DIESEL": 1200 } },
    ],
    productCapacities: {
      "ULSD CLEAR DIESEL": 5000,
    },
  },
}
