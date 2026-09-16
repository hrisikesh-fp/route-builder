/**
 * Objective Comparison Scorecard — data model + mock run set.
 *
 * Shown after the optimisation loading state and before the Optimized Routes
 * drawer: the same demand day solved under each available objective, so the
 * dispatcher picks the plan instead of receiving one.
 *
 * Layout note: objectives are COLUMNS (left → right), KPIs are ROWS (left
 * header column). This is the transpose of the PRD's illustrative table.
 *
 * Grounding:
 *  - Objective list = what fp-routing's ObjectiveFactory exposes today.
 *    Min distance has no SolutionCostCalculator yet, so it renders unavailable
 *    rather than producing a misleading result (PRD US-1).
 *  - KPI set = the PRD's fixed columns. Compartment fill stays blocked on the
 *    compartment-data integrity work (D-01/D-02) and never renders as 0.
 *  - Every run serves the same orders and the same gallons: the engine's
 *    unserved penalty protects volume in every mode, so gallons is not an
 *    objective row — it's the KPIs that measure the side effects (TSD §4.2).
 *  - Ties use the TSD's rule: within 1% of the column's best value → shared
 *    rank, displayed "2=".
 */

export type KpiId =
  | "gal_per_mile"
  | "gal_per_truck_hour"
  | "total_distance"
  | "time_to_complete"
  | "trucks_used"
  | "compartment_fill"
  | "feasibility"

export type KpiDirection = "higher_better" | "lower_better" | "none"

export type Kpi = {
  id: KpiId
  label: string
  /** One-line definition, shown under the label so nobody has to guess. */
  definition: string
  direction: KpiDirection
  /** Blocked KPIs render a reason instead of a rank — never a 0, never a fake win. */
  blocked?: { short: string; why: string }
}

export type ObjectiveId =
  | "min_driving_time"
  | "min_shift_end"
  | "min_driver_hours"
  | "min_trucks"
  | "balanced"
  | "min_distance"

export type ObjectiveRun = {
  id: ObjectiveId
  label: string
  /** What this objective actually asks the solver for, in one line. */
  descriptor: string
  /** Engine-side name, so eng and design are talking about the same thing. */
  engineTerm: string
  /** Not yet in the engine → column renders unavailable (PRD US-1). */
  unavailable?: boolean
  /** The tenant's configured objective — what today's run would have produced. */
  isCurrentDefault?: boolean
  values: Partial<Record<KpiId, number>>
  /** Feasibility is categorical, not a number. */
  feasibility: { ok: boolean; warnings: number; note?: string }
  /** Plain-language tradeoff — PRD US-5. Derived from the KPI values above. */
  tradeoff: string
  routeCount: number
  ordersPlaced: number
}

export const SCENARIO = {
  ordersTotal: 29,
  ordersPlaced: 19,
  unassigned: 10,
  gallons: 20900,
  trucksAvailable: 3,
  date: "Sat Sep 12, 2026",
  constraints: [
    "Vehicle capacity",
    "Compartment + product fit",
    "Truck ↔ terminal authorization",
    "Max route duration 10h",
    "Must-go orders",
  ],
}

export const KPIS: Kpi[] = [
  {
    id: "gal_per_mile",
    label: "Gallons per mile",
    definition: "Gallons delivered ÷ total miles. Absorbs deadhead.",
    direction: "higher_better",
  },
  {
    id: "gal_per_truck_hour",
    label: "Gallons per truck-hour",
    definition: "Gallons delivered ÷ truck operating hours.",
    direction: "higher_better",
  },
  {
    id: "total_distance",
    label: "Total distance",
    definition: "Miles driven across every route in the plan.",
    direction: "lower_better",
  },
  {
    id: "time_to_complete",
    label: "Time to complete",
    definition: "When the last route finishes, including stop time.",
    direction: "lower_better",
  },
  {
    id: "trucks_used",
    label: "Trucks used",
    definition: "Trucks needed to serve the same demand.",
    direction: "lower_better",
  },
  {
    id: "compartment_fill",
    label: "Compartment fill",
    definition: "Capacity used ÷ capacity available.",
    direction: "higher_better",
    blocked: {
      short: "Not measurable",
      why: "Compartment capacity data isn't trustworthy yet, so this would rank on bad numbers. Shown as unmeasurable rather than as a zero.",
    },
  },
  {
    id: "feasibility",
    label: "Feasibility",
    definition: "Routes checked against their declared limits.",
    direction: "none",
  },
]

export const OBJECTIVE_RUNS: ObjectiveRun[] = [
  {
    id: "min_driving_time",
    label: "Least driving time",
    descriptor: "Keep trucks off the road",
    engineTerm: "min transport_time",
    values: {
      gal_per_mile: 56.2,
      gal_per_truck_hour: 763,
      total_distance: 372,
      time_to_complete: 560,
      trucks_used: 3,
    },
    feasibility: { ok: true, warnings: 0 },
    tradeoff:
      "Fewest miles of any plan — 372 mi, 29 below the earliest-finish plan. You pay for it at the end of the day: the last truck comes in 35 minutes later, and it moves the least volume per paid truck-hour of the three-truck plans.",
    routeCount: 3,
    ordersPlaced: 19,
  },
  {
    id: "min_shift_end",
    label: "Earliest finish",
    descriptor: "Last truck back soonest",
    engineTerm: "min-max completion_time_last_stop",
    isCurrentDefault: true,
    values: {
      gal_per_mile: 52.1,
      gal_per_truck_hour: 798,
      total_distance: 401,
      time_to_complete: 525,
      trucks_used: 3,
    },
    feasibility: { ok: true, warnings: 0 },
    tradeoff:
      "Everyone is done by 8h 45m — the earliest of any plan, and the safest margin against the 10h shift cap. It buys that by driving 29 more miles than the least-driving-time plan.",
    routeCount: 3,
    ordersPlaced: 19,
  },
  {
    id: "min_driver_hours",
    label: "Least paid hours",
    descriptor: "Least time on the clock",
    engineTerm: "min route_duration",
    values: {
      gal_per_mile: 53.9,
      gal_per_truck_hour: 823,
      total_distance: 388,
      time_to_complete: 545,
      trucks_used: 3,
    },
    feasibility: { ok: true, warnings: 0 },
    tradeoff:
      "Moves the most volume per paid truck-hour — 823 gal, the best labour efficiency on the board. Finishes 20 minutes later than the earliest-finish plan, which is the whole cost of it.",
    routeCount: 3,
    ordersPlaced: 19,
  },
  {
    id: "min_trucks",
    label: "Fewest trucks",
    descriptor: "Serve the day on fewer trucks",
    engineTerm: "min vehicles",
    values: {
      gal_per_mile: 49.3,
      gal_per_truck_hour: 701,
      total_distance: 424,
      time_to_complete: 670,
      trucks_used: 2,
    },
    feasibility: { ok: false, warnings: 1, note: "One route runs 11h 10m — past the 10h soft shift limit." },
    tradeoff:
      "Frees a truck and a driver for other work — the only plan that does. Everything else gets worse: 52 extra miles, the last truck in 2h 25m later, and one route pushed past the 10h soft shift limit.",
    routeCount: 2,
    ordersPlaced: 19,
  },
  {
    id: "balanced",
    label: "Balanced day",
    descriptor: "Even workload across drivers",
    engineTerm: "min-max route_duration",
    values: {
      gal_per_mile: 53.6,
      gal_per_truck_hour: 804,
      total_distance: 390,
      time_to_complete: 532,
      trucks_used: 3,
    },
    feasibility: { ok: true, warnings: 0 },
    tradeoff:
      "Wins no column and loses none badly — it splits the day evenly across the three drivers instead of loading one. Pick it when a fair day matters more than any single metric.",
    routeCount: 3,
    ordersPlaced: 19,
  },
  {
    id: "min_distance",
    label: "Shortest distance",
    descriptor: "Minimise total miles",
    engineTerm: "min distance",
    unavailable: true,
    values: {},
    feasibility: { ok: true, warnings: 0 },
    tradeoff: "",
    routeCount: 0,
    ordersPlaced: 0,
  },
]

/** Tie threshold from the TSD: within 1% of the column's best value. */
const TIE_EPSILON = 0.01

export type RankCell = {
  rank: number
  /** True when another run shares this rank inside the tie threshold. */
  tied: boolean
}

/**
 * Ranks every available run on one KPI. Values inside 1% of the column's best
 * share a rank, so a 0.3-gal difference doesn't read as a real win.
 */
export function rankColumn(kpi: Kpi): Record<string, RankCell> {
  const out: Record<string, RankCell> = {}
  if (kpi.blocked || kpi.direction === "none") return out

  const entries = OBJECTIVE_RUNS.filter((r) => !r.unavailable)
    .map((r) => ({ id: r.id, value: r.values[kpi.id] }))
    .filter((e): e is { id: ObjectiveId; value: number } => typeof e.value === "number")

  if (entries.length === 0) return out

  const higher = kpi.direction === "higher_better"
  entries.sort((a, b) => (higher ? b.value - a.value : a.value - b.value))

  const best = entries[0].value
  const epsilon = Math.abs(best) * TIE_EPSILON

  // Group values that sit within epsilon of each other into a shared rank.
  const groups: { value: number; ids: ObjectiveId[] }[] = []
  for (const e of entries) {
    const last = groups[groups.length - 1]
    if (last && Math.abs(e.value - last.value) <= epsilon) {
      last.ids.push(e.id)
    } else {
      groups.push({ value: e.value, ids: [e.id] })
    }
  }

  let rank = 1
  for (const g of groups) {
    for (const id of g.ids) out[id] = { rank, tied: g.ids.length > 1 }
    rank += g.ids.length
  }
  return out
}

/** Pre-computed rank table, keyed KPI → objective → rank. */
export const RANKS: Record<string, Record<string, RankCell>> = Object.fromEntries(
  KPIS.map((k) => [k.id, rankColumn(k)]),
)

/** How many KPI columns this objective ranks first on — the header's at-a-glance line. */
export function winCount(objectiveId: ObjectiveId): number {
  return KPIS.reduce((n, k) => (RANKS[k.id]?.[objectiveId]?.rank === 1 ? n + 1 : n), 0)
}

export function formatKpiValue(kpi: Kpi, run: ObjectiveRun): string {
  if (kpi.id === "feasibility") {
    return run.feasibility.ok ? "Within limits" : `${run.feasibility.warnings} warning`
  }
  const v = run.values[kpi.id]
  if (typeof v !== "number") return "—"
  switch (kpi.id) {
    case "gal_per_mile":
      return `${v.toFixed(1)} gal`
    case "gal_per_truck_hour":
      return `${v} gal`
    case "total_distance":
      return `${v} mi`
    case "time_to_complete": {
      const h = Math.floor(v / 60)
      const m = v % 60
      return m === 0 ? `${h}h` : `${h}h ${m}m`
    }
    case "trucks_used":
      return `${v}`
    default:
      return `${v}`
  }
}
