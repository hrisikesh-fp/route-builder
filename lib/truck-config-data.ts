// ─── Truck Config — editable compartment/capacity/product setup ────────────
// This is the *setup* model (Self Customer → Assets → Edit replacement), not
// the read-only in-route display model in truck-data.ts. Capacity here is a
// single physical number per compartment, not summed per product — that's
// the exact bug found in TFF prod (see why-routing-breaks-truck-config.md).

export type TruckCategory = "Tank Wagon" | "Truck" | "Tractor" | "Trailer"

export interface TruckConfigCompartment {
  id: string // "C1", "C2" — display label
  capacity: number | null // gallons, single physical value, null = not set
  products: string[] // product labels this compartment can carry
}

export interface TruckConfig {
  id: string
  name: string
  category: TruckCategory
  useInDelivery: boolean
  compartments: TruckConfigCompartment[]
}

export const PRODUCT_OPTIONS = [
  "Diesel Dyed",
  "Diesel Clear",
  "Gas Regular",
  "Gas E10",
  "Fuel Oil",
  "Hydraulic Fluid",
]

// Seeded with a real gap pattern: C4 has no capacity and no product,
// mirroring the FF655 orphan-compartment bug found in TFF prod/UAT.
export const MOCK_TRUCK_CONFIG: TruckConfig = {
  id: "FF655",
  name: "655 - Topeka Retainage",
  category: "Tank Wagon",
  useInDelivery: true,
  compartments: [
    { id: "C1", capacity: 2000, products: ["Diesel Dyed"] },
    { id: "C2", capacity: 2000, products: ["Diesel Dyed"] },
    { id: "C3", capacity: 1800, products: ["Diesel Dyed"] },
    { id: "C4", capacity: null, products: [] },
  ],
}

export interface ReadinessCheck {
  label: string
  pass: boolean
}

export function computeReadiness(truck: TruckConfig): ReadinessCheck[] {
  const hasCategory = Boolean(truck.category)
  const compartmentsHaveCapacity = truck.compartments.every((c) => c.capacity !== null && c.capacity > 0)
  const compartmentsHaveProduct = truck.compartments.every((c) => c.products.length > 0)
  return [
    { label: "Category set", pass: hasCategory },
    { label: "Marked use in delivery", pass: truck.useInDelivery },
    { label: "Every compartment has a capacity", pass: compartmentsHaveCapacity },
    { label: "Every compartment has a product", pass: compartmentsHaveProduct },
    { label: "No empty/orphan compartment rows", pass: !truck.compartments.some((c) => c.capacity === null && c.products.length === 0) },
  ]
}

export function totalCapacity(truck: TruckConfig): number {
  return truck.compartments.reduce((sum, c) => sum + (c.capacity ?? 0), 0)
}

export function distinctProducts(truck: TruckConfig): string[] {
  const seen = new Set<string>()
  truck.compartments.forEach((c) => c.products.forEach((p) => seen.add(p)))
  return Array.from(seen)
}
