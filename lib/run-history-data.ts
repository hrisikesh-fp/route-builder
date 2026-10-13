import { allRoutes, type Route } from "@/lib/routes-data"
import type { GoalResult, ReasonGroup, RunInputs, RunRecord, RunResult, RunRoute, UnassignedOrderRef } from "@/lib/run-types"

// Mock run history for one planning day (tomorrow). Seven runs a dispatcher could
// plausibly make in an hour: a first try, a fuller one, a failed re-optimize, two goal
// comparisons, and a re-optimize of two routes that got published. Routes come from the
// prototype's real route data so the map snapshot draws real stops.

// The planning day is "tomorrow", like the app header's date picker.
export const PLANNED_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
})()
const DAY_ORDERS = 31

export const TRUCKS = ["T-104 Kenworth", "T-112 Peterbilt", "T-120 Freightliner", "T-131 International", "T-140 Mack"]

// Orders that never landed on a route in any run (beyond the five mock routes).
export const EXTRAS: UnassignedOrderRef[] = [
  { id: "x-buda", name: "Buda Fuel Stop", latitude: 30.0852, longitude: -97.8403, gallons: 900 },
  { id: "x-hutto", name: "Hutto Ag Supply", latitude: 30.5427, longitude: -97.5467, gallons: 1200 },
  { id: "x-dripping", name: "Dripping Springs Ranch", latitude: 30.1902, longitude: -98.0867, gallons: 600 },
  { id: "x-liberty", name: "Liberty Hill Quarry", latitude: 30.6649, longitude: -97.9225, gallons: 2000 },
]

function haversineMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

const isDelivery = (type: string) => type.startsWith("Delivery") || type === "Extraction"

function toRunRoute(route: Route, truckIndex: number, milesFactor = 1.25): RunRoute {
  const stops = route.stops.map((s) => ({ sequence: s.sequence, type: s.type, name: s.name, latitude: s.latitude, longitude: s.longitude, volume: s.volume }))
  let miles = 0
  for (let i = 1; i < stops.length; i++) miles += haversineMiles(stops[i - 1], stops[i])
  miles = Math.round(miles * milesFactor)
  const deliveries = stops.filter((s) => isDelivery(s.type))
  const loads = stops.filter((s) => s.type === "Load" || s.type.startsWith("Transfer")).length
  const minutes = Math.round((miles / 38) * 60 + deliveries.length * 22 + loads * 35)
  return {
    id: `${route.id}-t${truckIndex}`,
    truck: TRUCKS[truckIndex],
    driver: route.driverName,
    color: route.color,
    orderCount: deliveries.length,
    gallons: deliveries.reduce((sum, s) => sum + (s.volume ?? 0), 0),
    miles,
    minutes,
    stops,
  }
}

function ordersOf(route: Route): UnassignedOrderRef[] {
  return route.stops
    .filter((s) => isDelivery(s.type))
    .map((s, i) => ({ id: `${route.id}-o${i}`, name: s.name, latitude: s.latitude, longitude: s.longitude, gallons: s.volume ?? 0 }))
}

function buildResult(routes: RunRoute[], total: number, unassigned: ReasonGroup[], warnings = 0): RunResult {
  const placed = routes.reduce((s, r) => s + r.orderCount, 0)
  return {
    placed,
    total,
    gallons: routes.reduce((s, r) => s + r.gallons, 0),
    miles: routes.reduce((s, r) => s + r.miles, 0),
    timeToCompleteMin: Math.max(0, ...routes.map((r) => r.minutes)),
    operatingMin: routes.reduce((s, r) => s + r.minutes, 0),
    trucksUsed: routes.length,
    routes,
    unassigned,
    warnings,
  }
}

const [r1, r2, r3, r4, r5] = allRoutes

// Every order of the day: the five mock routes' deliveries plus the extras.
const DAY_GALLONS = allRoutes.flatMap(ordersOf).reduce((sum, o) => sum + o.gallons, 0) + EXTRAS.reduce((sum, o) => sum + o.gallons, 0)

function inputs(over: Partial<RunInputs> & { trucks: string[] }): RunInputs {
  return {
    orders: DAY_ORDERS,
    gallons: DAY_GALLONS,
    products: [
      { name: "Clear", gallons: Math.round(DAY_GALLONS * 0.56) },
      { name: "Dyed", gallons: DAY_GALLONS - Math.round(DAY_GALLONS * 0.56) - 600 },
      { name: "DEF", gallons: 600 },
    ],
    drivers: ["Mark Ruffalo", "Kyle Reese", "Forrest Gump"],
    rules: ["Truck capacity", "Product and compartment fit", "Terminal access per truck", "Stop sequencing", "Delivery time windows"],
    limits: ["Route capped at 10h", "Shift starts 07:00"],
    goalLabel: "Current default",
    travelTimes: "Fetched fresh from the map service",
    ...over,
  }
}

const goal = (g: Omit<GoalResult, "total">): GoalResult => ({ ...g, total: DAY_ORDERS })

// ─── Runs, newest first ─────────────────────────────────────────────────────

const run6Routes = [toRunRoute(r1, 0, 1.18), toRunRoute(r3, 2, 1.2)]
const run5Routes = [toRunRoute(r1, 0, 1.22), toRunRoute(r2, 1, 1.3), toRunRoute(r3, 2), toRunRoute(r4, 3), toRunRoute(r5, 4, 1.21)]
const run5bRoutes = [toRunRoute(r1, 0, 1.27), toRunRoute(r2, 1, 1.33), toRunRoute(r3, 2, 1.24), toRunRoute(r4, 3, 1.29), toRunRoute(r5, 4, 1.27)]
const run4Routes = [toRunRoute(r1, 0), toRunRoute(r2, 1), toRunRoute(r3, 2), toRunRoute(r5, 4)]
const run2Routes = [toRunRoute(r1, 0, 1.3), toRunRoute(r2, 1, 1.32), toRunRoute(r3, 2, 1.28), toRunRoute(r4, 3, 1.3), toRunRoute(r5, 4, 1.3)]
const run1Routes = [toRunRoute(r1, 0, 1.3), toRunRoute(r2, 1, 1.3), toRunRoute(r3, 2, 1.3)]

export const RUNS: RunRecord[] = [
  {
    requestId: "rb-1791816712044-k3p9ad",
    number: 7,
    plannedDate: PLANNED_DATE,
    submittedAt: "9:52 AM",
    by: "Hrisikesh M.",
    durationLabel: "6.1s",
    status: "finished",
    fate: "published",
    scope: { kind: "reoptimize", routeCount: 2, orderCount: 10 },
    goalLabel: "Least driving time",
    inputs: inputs({ orders: 10, gallons: 7900, trucks: [TRUCKS[0], TRUCKS[2]], goalLabel: "Least driving time", products: [{ name: "Clear", gallons: 4700 }, { name: "Dyed", gallons: 3200 }], travelTimes: "Reused from run #6" }),
    result: buildResult(run6Routes, 10, []),
  },
  {
    requestId: "rb-1791816039601-y2ib1q",
    number: 6,
    plannedDate: PLANNED_DATE,
    submittedAt: "9:40 AM",
    by: "Hrisikesh M.",
    durationLabel: "41.8s · 3 goals",
    status: "finished",
    fate: "used",
    scope: { kind: "full_day", orderCount: DAY_ORDERS },
    goalLabel: "Least driving time",
    comparison: {
      chosen: "least_driving_time",
      goals: [
        goal({ goalId: "current_default", label: "Current default", descriptor: "What Route Builder does today", placed: 27, gallons: 23986, miles: 412, timeToCompleteMin: 548, trucksUsed: 5 }),
        goal({ goalId: "least_driving_time", label: "Least driving time", descriptor: "Less time driving, may cover more miles", placed: 27, gallons: 23986, miles: 0, timeToCompleteMin: 0, trucksUsed: 5 }),
        goal({ goalId: "earliest_finish", label: "Earliest finish", descriptor: "Last truck back soonest", placed: 27, gallons: 23986, miles: 412, timeToCompleteMin: 548, trucksUsed: 5, sameAs: "current_default" }),
      ],
    },
    inputs: inputs({ trucks: TRUCKS, goalLabel: "Comparison: Current default, Least driving time, Earliest finish" }),
    result: buildResult(run5Routes, DAY_ORDERS, [
      {
        id: "g-fits",
        tier: "fits_now",
        message: "T-112 Peterbilt can take this now",
        hint: "Drag it onto that route, or re-run.",
        orders: [EXTRAS[1]],
      },
      {
        id: "g-dur",
        tier: "stop_rule",
        message: "Would push T-140 Mack past its 10h route limit",
        hint: "Add a truck, or raise the route time limit in Routing Configuration.",
        coverage: { trucks: 2, of: 5 },
        orders: [EXTRAS[0], EXTRAS[3]],
      },
      {
        id: "g-def",
        tier: "never",
        message: "No truck has a compartment for DEF",
        hint: "Add a truck with a compartment for DEF.",
        coverage: { trucks: 5, of: 5 },
        orders: [EXTRAS[2]],
      },
    ], 2),
  },
  {
    requestId: "rb-1791816002580-6as4a4",
    number: 5,
    plannedDate: PLANNED_DATE,
    submittedAt: "9:40 AM",
    by: "Hrisikesh M.",
    durationLabel: "41.4s · 3 goals",
    status: "finished",
    fate: "not_used",
    scope: { kind: "full_day", orderCount: DAY_ORDERS },
    goalLabel: "Comparison, none used (showing Current default)",
    comparison: {
      goals: [
        goal({ goalId: "current_default", label: "Current default", descriptor: "What Route Builder does today", placed: 27, gallons: 23986, miles: 418, timeToCompleteMin: 552, trucksUsed: 5 }),
        goal({ goalId: "least_driving_time", label: "Least driving time", descriptor: "Less time driving, may cover more miles", placed: 27, gallons: 23986, miles: 421, timeToCompleteMin: 561, trucksUsed: 5 }),
        goal({ goalId: "earliest_finish", label: "Earliest finish", descriptor: "Last truck back soonest", placed: 26, gallons: 22986, miles: 402, timeToCompleteMin: 512, trucksUsed: 5 }),
      ],
    },
    inputs: inputs({ trucks: TRUCKS, goalLabel: "Comparison: Current default, Least driving time, Earliest finish" }),
    result: buildResult(run5bRoutes, DAY_ORDERS, [
      { id: "g-dur", tier: "stop_rule", message: "Would push T-140 Mack past its 10h route limit", hint: "Add a truck, or raise the route time limit in Routing Configuration.", coverage: { trucks: 2, of: 5 }, orders: [EXTRAS[0], EXTRAS[1], EXTRAS[3]] },
      { id: "g-def", tier: "never", message: "No truck has a compartment for DEF", hint: "Add a truck with a compartment for DEF.", coverage: { trucks: 5, of: 5 }, orders: [EXTRAS[2]] },
    ], 2),
  },
  {
    requestId: "rb-1791815601251-tagkkc",
    number: 4,
    plannedDate: PLANNED_DATE,
    submittedAt: "9:33 AM",
    by: "Hrisikesh M.",
    durationLabel: "38.2s · 3 goals",
    status: "finished",
    fate: "not_used",
    scope: { kind: "full_day", orderCount: DAY_ORDERS },
    goalLabel: "Comparison, none used (showing Current default)",
    comparison: {
      goals: [
        goal({ goalId: "current_default", label: "Current default", descriptor: "What Route Builder does today", placed: 22, gallons: 19886, miles: 371, timeToCompleteMin: 590, trucksUsed: 4 }),
        goal({ goalId: "fewest_trucks", label: "Fewest trucks", descriptor: "Serve the day on fewer trucks", placed: 18, gallons: 16200, miles: 304, timeToCompleteMin: 596, trucksUsed: 3 }),
        goal({ goalId: "least_driving_time", label: "Least driving time", descriptor: "Less time driving, may cover more miles", placed: 22, gallons: 19886, miles: 380, timeToCompleteMin: 601, trucksUsed: 4 }),
      ],
    },
    inputs: inputs({ trucks: [TRUCKS[0], TRUCKS[1], TRUCKS[2], TRUCKS[4]], goalLabel: "Comparison: Current default, Fewest trucks, Least driving time" }),
    result: buildResult(run4Routes, DAY_ORDERS, [
      { id: "g-dur", tier: "stop_rule", message: "Would push every truck past its 10h route limit", hint: "Add a truck, or raise the route time limit in Routing Configuration.", coverage: { trucks: 4, of: 4 }, orders: [...ordersOf(r4), EXTRAS[0], EXTRAS[1], EXTRAS[3]] },
      { id: "g-def", tier: "never", message: "No truck has a compartment for DEF", hint: "Add a truck with a compartment for DEF.", coverage: { trucks: 4, of: 4 }, orders: [EXTRAS[2]] },
    ]),
  },
  {
    requestId: "rb-1791815201977-u81mzq",
    number: 3,
    plannedDate: PLANNED_DATE,
    submittedAt: "9:20 AM",
    by: "Hrisikesh M.",
    durationLabel: "2m 0s",
    status: "no_answer",
    fate: "failed",
    scope: { kind: "reoptimize", routeCount: 2, orderCount: 9 },
    goalLabel: "Current default",
    inputs: inputs({ orders: 9, gallons: 7100, trucks: [TRUCKS[2], TRUCKS[3]], products: [{ name: "Clear", gallons: 4900 }, { name: "Dyed", gallons: 2200 }] }),
    failure: { summary: "The optimizer didn't answer within 2 minutes", nextStep: "Nothing changed in the workspace. Run it again, or share the run number with support." },
  },
  {
    requestId: "rb-1791813972903-xqb7f1",
    number: 2,
    plannedDate: PLANNED_DATE,
    submittedAt: "9:06 AM",
    by: "Hrisikesh M.",
    durationLabel: "16.4s",
    status: "finished",
    fate: "used",
    scope: { kind: "full_day", orderCount: DAY_ORDERS },
    goalLabel: "Current default",
    inputs: inputs({ trucks: TRUCKS }),
    result: buildResult(run2Routes, DAY_ORDERS, [
      { id: "g-dur", tier: "stop_rule", message: "Would push T-140 Mack past its 10h route limit", hint: "Add a truck, or raise the route time limit in Routing Configuration.", coverage: { trucks: 3, of: 5 }, orders: [EXTRAS[0], EXTRAS[1], EXTRAS[3]] },
      { id: "g-def", tier: "never", message: "No truck has a compartment for DEF", hint: "Add a truck with a compartment for DEF.", coverage: { trucks: 5, of: 5 }, orders: [EXTRAS[2]] },
    ], 3),
  },
  {
    requestId: "rb-1791813502114-a0c2nn",
    number: 1,
    plannedDate: PLANNED_DATE,
    submittedAt: "8:58 AM",
    by: "Hrisikesh M.",
    durationLabel: "11.9s",
    status: "finished",
    fate: "not_used",
    scope: { kind: "full_day", orderCount: DAY_ORDERS },
    goalLabel: "Current default",
    inputs: inputs({ trucks: [TRUCKS[0], TRUCKS[1], TRUCKS[2]] }),
    result: buildResult(run1Routes, DAY_ORDERS, [
      { id: "g-dur", tier: "stop_rule", message: "Would push all 3 trucks past their 10h route limit", hint: "Add a truck, or raise the route time limit in Routing Configuration.", coverage: { trucks: 3, of: 3 }, orders: [...ordersOf(r4), ...ordersOf(r5), EXTRAS[0], EXTRAS[1], EXTRAS[3]] },
      { id: "g-def", tier: "never", message: "No truck has a compartment for DEF", hint: "Add a truck with a compartment for DEF.", coverage: { trucks: 3, of: 3 }, orders: [EXTRAS[2]] },
    ]),
  },
]

// In a comparison, the plan shown is the chosen goal's (or the first goal's when none was used),
// so that goal's column takes the result's real numbers.
for (const run of RUNS) {
  if (!run.comparison || !run.result) continue
  const shown = run.comparison.goals.find((g) => g.goalId === (run.comparison!.chosen ?? run.comparison!.goals[0].goalId))!
  // Other goals keep their mocked ratios to the shown one, so the comparison stays believable.
  const orig = { ...shown }
  for (const g of run.comparison.goals) {
    if (g === shown || g.sameAs) continue
    g.miles = Math.round(run.result.miles * (g.miles / orig.miles))
    g.timeToCompleteMin = Math.round(run.result.timeToCompleteMin * (g.timeToCompleteMin / orig.timeToCompleteMin))
    g.gallons = Math.round(run.result.gallons * (g.gallons / orig.gallons))
  }
  shown.placed = run.result.placed
  shown.gallons = run.result.gallons
  shown.miles = run.result.miles
  shown.timeToCompleteMin = run.result.timeToCompleteMin
  shown.trucksUsed = run.result.trucksUsed
  for (const g of run.comparison.goals) {
    if (g.sameAs === shown.goalId) Object.assign(g, { placed: shown.placed, gallons: shown.gallons, miles: shown.miles, timeToCompleteMin: shown.timeToCompleteMin, trucksUsed: shown.trucksUsed })
  }
}

export function formatMinutes(min: number) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export const formatGallons = (g: number) => g.toLocaleString("en-US")

/** Every order of the planning day (the five mock routes' deliveries plus the extras). */
export function dayOrders(): UnassignedOrderRef[] {
  return [...allRoutes.flatMap((r) => ordersOf(r)), ...EXTRAS]
}
