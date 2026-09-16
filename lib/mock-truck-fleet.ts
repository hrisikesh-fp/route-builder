// ─── Mock fleet data for the Create Routes modal v2 prototype ─────────────────
// Standalone dataset — not shared with merge-modal.tsx's TRUCK_GROUPS, lasso-workspace-sheet.tsx's
// TRUCKS/TRAILERS/DRIVERS, or lib/truck-data.ts. Combines truck + paired trailer + assigned driver
// into a single selectable unit, per the "Driver-to-truck mapping" prototype.

export interface FleetTrailer {
  id: string
  name: string
  capacity: string // "" for zero-capacity transport trailers
  compartments: string // "" for zero-capacity transport trailers
}

export interface FleetDriver {
  id: string
  // Opaque mock display string matching the Figma reference format, e.g. "2 - TW - Shawn Brantingham"
  displayLine: string
}

export interface FleetUnit {
  id: string
  name: string
  badge: "Truck" | "Tractor" | "Tank Wagon" | "Box Truck"
  capacity: string
  compartments: string
  productNames: string[]
  trailer: FleetTrailer | null
  driver: FleetDriver | null
}

export interface FleetHubGroup {
  hub: string
  units: FleetUnit[]
}

export const ALL_HUBS_LABEL = "All Hubs"

// ─── Exact examples lifted verbatim from Figma node 6625:29435 ────────────────
// Kept faithful to the Figma mock data as given, INCLUDING what looks like a
// naming mismatch in the design itself (first row's truck is named "FF658" but
// paired with trailer "Fuel 657-T") — not "fixed" here on purpose, per instruction
// to reproduce these exact examples for dev-handoff parity.
const FIGMA_EXAMPLE_UNITS: FleetUnit[] = [
  {
    id: "figma-ex-1",
    name: "FF658 - 2017 Freightliner 122SD - TW",
    badge: "Truck",
    capacity: "4,500 gal",
    compartments: "5 Compartments",
    productNames: ["Diesel", "gas"],
    trailer: { id: "figma-ex-1-trailer", name: "Fuel 657-T", capacity: "", compartments: "" },
    driver: { id: "figma-ex-1-driver", displayLine: "2 - TW - Shawn Brantingham" },
  },
  {
    id: "figma-ex-2",
    name: "FF658 - 2017 Freightliner 122SD - TW",
    badge: "Truck",
    capacity: "4,500 gal",
    compartments: "5 Compartments",
    productNames: ["Diesel", "gas"],
    trailer: { id: "figma-ex-2-trailer", name: "Fuel 658-T", capacity: "", compartments: "" },
    driver: { id: "figma-ex-2-driver", displayLine: "2 - TW - Troy Satterlee" },
  },
  {
    id: "figma-ex-3",
    name: "FF659 - 2017 Freightliner 122SD - TW",
    badge: "Truck",
    capacity: "4,500 gal",
    compartments: "5 Compartments",
    productNames: ["Diesel", "gas"],
    trailer: { id: "figma-ex-3-trailer", name: "Fuel 659-T", capacity: "", compartments: "" },
    driver: { id: "figma-ex-3-driver", displayLine: "2 - TW - Brian Peters" },
  },
  {
    id: "figma-ex-4",
    name: "H-118 - 2019 Kenworth Tank Wagon",
    badge: "Tank Wagon",
    capacity: "4,500 gal",
    compartments: "5 Compartments",
    productNames: ["Diesel", "gas"],
    trailer: null,
    driver: null,
  },
  {
    id: "figma-ex-5",
    name: "H-118 - 2019 Kenworth Tank Wagon",
    badge: "Tank Wagon",
    capacity: "4,500 gal",
    compartments: "5 Compartments",
    productNames: ["Diesel", "gas"],
    trailer: null,
    driver: null,
  },
  // Edge-case example from the "0 gal · 0 Compartments · 0 Products" reference screenshot —
  // demonstrates the zero-value fallback for a unit with no defined capacity of its own.
  {
    id: "figma-ex-test-tank-wagon",
    name: "Test Tank Wagon",
    badge: "Tank Wagon",
    capacity: "",
    compartments: "2 Compartments",
    productNames: ["diesel"],
    trailer: null,
    driver: null,
  },
]

export const FLEET_HUB_GROUPS: FleetHubGroup[] = [
  {
    hub: "Austin Hub",
    units: [
      ...FIGMA_EXAMPLE_UNITS,
      {
        id: "H-415",
        name: "H-415 - 2022 Kenworth W990 Flatbed",
        badge: "Truck",
        capacity: "5,800 gal",
        compartments: "5 Compartments",
        productNames: ["Regular Unleaded", "Premium Unleaded"],
        trailer: null,
        driver: { id: "driver-415", displayLine: "1 - FB - Priya Anand" },
      },
      {
        id: "H-450",
        name: "H-450 - 2023 International LT Tanker",
        badge: "Truck",
        capacity: "5,000 gal",
        compartments: "4 Compartments",
        productNames: ["Clear Diesel", "Dyed Diesel", "Kerosene"],
        trailer: { id: "T-450", name: "Fuel 450-T", capacity: "2,800 gal", compartments: "5 Compartments" },
        driver: null,
      },
      {
        id: "TR289",
        name: "TR289 - 2020 Volvo VNL Tractor",
        badge: "Tractor",
        capacity: "",
        compartments: "",
        productNames: [],
        trailer: null,
        driver: null,
      },
    ],
  },
  {
    hub: "Corpus Christi Hub",
    units: [
      {
        id: "H-502",
        name: "H-502 - 2020 Volvo VNR 400 Tank Wagon",
        badge: "Tank Wagon",
        capacity: "4,000 gal",
        compartments: "3 Compartments",
        productNames: ["Dyed Diesel", "Kerosene"],
        trailer: null,
        driver: { id: "driver-502", displayLine: "1 - TW - Marcus Chen" },
      },
      {
        id: "H-517",
        name: "H-517 - 2023 Peterbilt 389 Tanker",
        badge: "Tank Wagon",
        capacity: "5,600 gal",
        compartments: "5 Compartments",
        productNames: ["Clear Diesel", "Regular Unleaded", "Ethanol"],
        trailer: { id: "T-517", name: "Fuel 517-T", capacity: "3,000 gal", compartments: "5 Compartments" },
        driver: null,
      },
      {
        id: "H-428",
        name: "H-428 - 2021 Peterbilt 579 Box Truck",
        badge: "Box Truck",
        capacity: "4,800 gal",
        compartments: "4 Compartments",
        productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"],
        trailer: null,
        driver: { id: "driver-428", displayLine: "1 - BT - Lena Ortiz" },
      },
      {
        id: "H-538",
        name: "H-538 - 2022 International HV Tanker",
        badge: "Truck",
        capacity: "5,100 gal",
        compartments: "4 Compartments",
        productNames: ["Premium Unleaded", "Regular Unleaded", "Kerosene"],
        trailer: null,
        driver: null,
      },
      {
        id: "TR291",
        name: "TR291 - 2021 Kenworth T680 Tractor",
        badge: "Tractor",
        capacity: "",
        compartments: "",
        productNames: [],
        trailer: { id: "TT-79", name: "TT-79 Transport Trailer", capacity: "", compartments: "" },
        driver: { id: "driver-291", displayLine: "2 - TR - Devon Walsh" },
      },
    ],
  },
  {
    hub: "San Antonio Hub",
    units: [
      {
        id: "H-544",
        name: "H-544 - 2019 Freightliner Cascadia Tank",
        badge: "Tank Wagon",
        capacity: "4,700 gal",
        compartments: "4 Compartments",
        productNames: ["Red Diesel", "Clear Diesel"],
        trailer: null,
        driver: { id: "driver-544", displayLine: "1 - TW - Nia Robinson" },
      },
      {
        id: "H-575",
        name: "H-575 - 2020 Western Star 5700XE Tank",
        badge: "Tank Wagon",
        capacity: "5,300 gal",
        compartments: "5 Compartments",
        productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"],
        trailer: { id: "T-575", name: "Fuel 575-T", capacity: "2,900 gal", compartments: "5 Compartments" },
        driver: { id: "driver-575", displayLine: "2 - TW - Carlos Medina" },
      },
      {
        id: "H-589",
        name: "H-589 - 2021 Volvo FH16 Tanker",
        badge: "Truck",
        capacity: "6,000 gal",
        compartments: "6 Compartments",
        productNames: ["Clear Diesel", "Premium Unleaded", "Ethanol"],
        trailer: null,
        driver: null,
      },
      {
        id: "H-602",
        name: "H-602 - 2022 Peterbilt 567 Flatbed",
        badge: "Truck",
        capacity: "4,400 gal",
        compartments: "4 Compartments",
        productNames: ["Regular Unleaded", "Red Diesel"],
        trailer: { id: "T-602", name: "Fuel 602-T", capacity: "2,600 gal", compartments: "4 Compartments" },
        driver: null,
      },
      {
        id: "TR295",
        name: "TR295 - 2022 Mack Anthem Tractor",
        badge: "Tractor",
        capacity: "",
        compartments: "",
        productNames: [],
        trailer: { id: "TT-84", name: "TT-84 Transport Trailer", capacity: "", compartments: "" },
        driver: null,
      },
    ],
  },
]

export const ALL_HUBS = [ALL_HUBS_LABEL, ...FLEET_HUB_GROUPS.map((g) => g.hub)]
