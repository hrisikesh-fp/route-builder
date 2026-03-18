// ─── Fuel Product Types ─────────────────────────────────────────────────────
export type FuelProduct =
  | "200*DIESEL-OFFROAD RED"
  | "200*DIESEL-ONROAD CLEAR"
  | "87 OCT W/ 10% ETH"
  | "ULSD CLEAR DIESEL"
  | "DEF PACKAGED"

// ─── Compartment & Capacity Profile ─────────────────────────────────────────

export interface TruckCompartment {
  id: string // "C1", "C2", etc.
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
  // Route 1 — Mark Ruffalo (user selects this truck)
  // Total truck capacity: C1+C2+C3+C4+C5 max per compartment
  // Red max = 1500+0+0+800+0 = 2,300
  // Clear max = 0+1000+0+800+0 = 1,800
  // 87 Reg max = 0+0+800+800+900 = 2,500 → but plan says 1,700 (C3 800 + C5 900)
  // Per the plan: Red = 2,300 | Clear = 1,800 | 87 Regular = 1,700
  // Compartment C4 is flexible (800 each) but product caps are as stated in plan
  "H-118": {
    truckId: "H-118",
    totalCapacity: 5000,
    compartments: [
      { id: "C1", capacities: { "200*DIESEL-OFFROAD RED": 1500 } },
      { id: "C2", capacities: { "200*DIESEL-ONROAD CLEAR": 1000 } },
      { id: "C3", capacities: { "87 OCT W/ 10% ETH": 800 } },
      { id: "C4", capacities: { "200*DIESEL-OFFROAD RED": 800, "200*DIESEL-ONROAD CLEAR": 800, "87 OCT W/ 10% ETH": 800 } },
      { id: "C5", capacities: { "87 OCT W/ 10% ETH": 900 } },
    ],
    productCapacities: {
      "200*DIESEL-OFFROAD RED": 2300,
      "200*DIESEL-ONROAD CLEAR": 1800,
      "87 OCT W/ 10% ETH": 1700,
    },
  },

  // Route 2 — Dwayne Johnson
  // 3 compartments, ULSD only, total 4,200
  "H-205": {
    truckId: "H-205",
    totalCapacity: 4200,
    compartments: [
      { id: "C1", capacities: { "ULSD CLEAR DIESEL": 1500 } },
      { id: "C2", capacities: { "ULSD CLEAR DIESEL": 1500 } },
      { id: "C3", capacities: { "ULSD CLEAR DIESEL": 1200 } },
    ],
    productCapacities: {
      "ULSD CLEAR DIESEL": 4200,
    },
  },

  // Route 3 — Jessica Harper
  // 4 compartments, Red + Clear, total 4,600
  // Red = 1200+0+800+800 = 2,800 | Clear = 0+1000+800+0 = 1,800
  "H-310": {
    truckId: "H-310",
    totalCapacity: 4600,
    compartments: [
      { id: "C1", capacities: { "200*DIESEL-OFFROAD RED": 1200 } },
      { id: "C2", capacities: { "200*DIESEL-ONROAD CLEAR": 1000 } },
      { id: "C3", capacities: { "200*DIESEL-OFFROAD RED": 800, "200*DIESEL-ONROAD CLEAR": 800 } },
      { id: "C4", capacities: { "200*DIESEL-OFFROAD RED": 800 } },
    ],
    productCapacities: {
      "200*DIESEL-OFFROAD RED": 2800,
      "200*DIESEL-ONROAD CLEAR": 1800,
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
      { id: "C1", capacities: { "ULSD CLEAR DIESEL": 800 } },
      { id: "C2", capacities: { "87 OCT W/ 10% ETH": 700 } },
      { id: "C3", capacities: { "ULSD CLEAR DIESEL": 600, "87 OCT W/ 10% ETH": 600 } },
      { id: "C4", capacities: { "87 OCT W/ 10% ETH": 500 } },
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
      { id: "C1", capacities: { "ULSD CLEAR DIESEL": 2000 } },
      { id: "C2", capacities: { "ULSD CLEAR DIESEL": 1800 } },
      { id: "C3", capacities: { "ULSD CLEAR DIESEL": 1200 } },
    ],
    productCapacities: {
      "ULSD CLEAR DIESEL": 5000,
    },
  },
}
