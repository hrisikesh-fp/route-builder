// Frozen A2 checks from a2-welcome-modal-v2.html section 5.
// Left out: snap-to-road, unroutable, invalid retain, unsupported order type,
// shift starts at a ship-to, top-off sized from history. Those are still with Dylan.

export type WelcomeKind = "act" | "heads"
export type WelcomeCat = "Order" | "Truck" | "Driver" | "Setup"
export type WelcomeScenario = "all" | "headsup" | "syncing" | "failed" | "clear"

// Where the fix goes. Order edits stay in Route Builder. Truck, driver, ship-to,
// terminal, and setup open the Dispatch page, the same paths Routing config uses.
export type WelcomeWhere = "order" | "routes" | "map" | "dispatch"

export interface WelcomeRow {
  id: number
  kind: WelcomeKind
  cat: WelcomeCat
  name: string
  sub: string
  det: string
  issue: string
  fix: string
  where: WelcomeWhere
  href?: string
}

export const WELCOME_SCENARIOS: { id: WelcomeScenario; label: string; hint: string }[] = [
  { id: "all", label: "Needs action and heads-up", hint: "Both kinds. The strip stays after you start planning." },
  { id: "headsup", label: "Heads-up only", hint: "Nothing needs action, so the strip does not show." },
  { id: "syncing", label: "Syncing", hint: "The list is loading, then the checks appear." },
  { id: "failed", label: "A source failed", hint: "Truck and driver checks did not run. An empty list is not all clear." },
  { id: "clear", label: "All clear", hint: "The modal stays closed. A toast says the checks passed." },
]

const SHIPTO = "/self_customer/customer_branches"
const TRUCK = "/self_customer/assets"
const DRIVER = "/self_customer/drivers"
const TERMINAL = "/self_customer/terminals"
const PLANT = "/self_customer/warehouses"

export const WELCOME_ROWS: WelcomeRow[] = [
  { id: 1, kind: "act", cat: "Order", name: "Dripping Springs Ranch", sub: "Hill Country Ranches", det: "Delivery · 800 gal", issue: "No location for this site.", fix: "Go to ShipTo", where: "dispatch", href: SHIPTO },
  { id: 2, kind: "act", cat: "Order", name: "Kyle Paving Co", sub: "Kyle Paving", det: "Delivery · 0 gal", issue: "No product on this order.", fix: "Edit order", where: "order" },
  { id: 3, kind: "act", cat: "Order", name: "Buda Feed Store", sub: "Buda Feed & Supply", det: "Delivery · Diesel", issue: "No planned gallons.", fix: "Edit order", where: "order" },
  { id: 4, kind: "act", cat: "Order", name: "Manor Ag Supply", sub: "Manor Ag", det: "Delivery · Top off", issue: "Top-off can't be sized: no tank reading.", fix: "Set gallons", where: "order" },
  { id: 5, kind: "act", cat: "Order", name: "Round Rock Plant", sub: "Round Rock Materials", det: "Delivery · DEF 600 gal", issue: "No terminal this hub uses carries DEF.", fix: "Go to Terminal", where: "dispatch", href: TERMINAL },
  { id: 7, kind: "act", cat: "Order", name: "Bastrop Quarry", sub: "Bastrop Aggregates", det: "Delivery · 14,000 gal", issue: "Bigger than any truck (largest 9,800 gal).", fix: "Edit order", where: "order" },
  { id: 8, kind: "act", cat: "Truck", name: "H-118", sub: "2019 Kenworth Tank Wagon", det: "3,000 gal · 3 compartments", issue: "Fuel card expired on 30 Sep.", fix: "Go to Truck", where: "dispatch", href: TRUCK },
  { id: 9, kind: "act", cat: "Truck", name: "TR289", sub: "2020 Volvo VNL · TT-79", det: "8,500 gal · 4 compartments", issue: "Not allowed at any terminal for today's products.", fix: "Map terminals", where: "dispatch", href: TRUCK },
  { id: 10, kind: "act", cat: "Truck", name: "H-517", sub: "2023 Peterbilt 389 · Fuel 517-T", det: "6,000 gal · 4 compartments", issue: "No hub and no shift.", fix: "Go to Truck", where: "dispatch", href: TRUCK },
  { id: 11, kind: "heads", cat: "Driver", name: "Maria Lopez", sub: "H-118", det: "5:00 AM to 3:00 PM", issue: "TWIC expired on 2 Oct.", fix: "Go to Driver", where: "dispatch", href: DRIVER },
  { id: 13, kind: "act", cat: "Driver", name: "Jordan Morris", sub: "H-450", det: "5:00 AM to 5:00 PM", issue: "Licence expires at 2 PM, mid-shift.", fix: "Go to Driver", where: "dispatch", href: DRIVER },
  { id: 15, kind: "heads", cat: "Setup", name: "Pflugerville DEF Storage", sub: "Bulk plant", det: "Austin Hub", issue: "No product on this bulk plant's tank.", fix: "Go to Bulk plant", where: "dispatch", href: PLANT },
  { id: 19, kind: "heads", cat: "Setup", name: "Terminals", sub: "45 terminals", det: "No products", issue: "45 terminals have no products.", fix: "Go to Terminal", where: "dispatch", href: TERMINAL },
]

export const WELCOME_LINES: Record<WelcomeKind, string> = {
  act: "These can't go into a plan as they are. Fix them in Dispatch, or exclude orders to leave them out of the plan.",
  heads: "These can be planned, but may cause trouble on the day. The risk shows on the route after you plan.",
}

export function rowsForScenario(scenario: WelcomeScenario): WelcomeRow[] {
  if (scenario === "clear") return []
  if (scenario === "headsup") return WELCOME_ROWS.filter((r) => r.kind === "heads")
  if (scenario === "failed") return WELCOME_ROWS.filter((r) => r.cat === "Order" || r.cat === "Setup")
  return WELCOME_ROWS.slice()
}

export function isWelcomeScenario(value: string | null): value is WelcomeScenario {
  return WELCOME_SCENARIOS.some((s) => s.id === value)
}

export function tomorrowNoon() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(12, 0, 0, 0)
  return d
}

export function toDateInput(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

export function fromDateInput(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day, 12)
}

export function formatPlanDate(d: Date) {
  const pretty = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return d.toDateString() === tomorrowNoon().toDateString() ? `Tomorrow: ${pretty}` : pretty
}
