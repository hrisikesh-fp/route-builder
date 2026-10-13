// Run history data model. One shape serves two places:
//  - Planning workspace: the live result of the run the dispatcher just did
//  - Reconciliation > Run history: the frozen snapshot of any past run
// Grounded in what route-builder-web already has: #296 run summary, #297 goal comparison,
// #298 run audit (inputs + who/when), and the closest-truck reasons from mxq.

export type RunStatus = "finished" | "failed" | "no_answer"

/** What happened to the run's plan afterwards. The list's most useful column. */
export type RunFate = "published" | "used" | "not_used" | "failed"

export type RunScope =
  | { kind: "full_day"; orderCount: number }
  | { kind: "reoptimize"; routeCount: number; orderCount: number }

export type GoalId =
  | "current_default"
  | "least_driving_time"
  | "earliest_finish"
  | "least_paid_hours"
  | "fewest_trucks"
  | "balanced_day"

export interface RunStop {
  sequence: number | string
  type: "Hub" | "Load" | "Delivery" | "Transfer In" | "Transfer Out" | string
  name: string
  latitude: number
  longitude: number
  volume?: number
}

export interface RunRoute {
  id: string
  truck: string
  driver?: string
  color: string
  orderCount: number
  gallons: number
  miles: number
  minutes: number
  stops: RunStop[]
}

export interface UnassignedOrderRef {
  id: string
  name: string
  latitude: number
  longitude: number
  gallons: number
}

export type ReasonTier = "fits_now" | "compartments" | "stop_rule" | "never"

export interface ReasonGroup {
  id: string
  /** Closest-truck copy: names the truck when the reason isn't true for every truck. */
  message: string
  /** What would unblock it. Only when the reason is certain. */
  hint?: string
  tier: ReasonTier
  /** "Applies to 2 of 3 trucks" */
  coverage?: { trucks: number; of: number }
  orders: UnassignedOrderRef[]
}

export interface RunResult {
  placed: number
  total: number
  gallons: number
  miles: number
  /** First truck out to last truck back. */
  timeToCompleteMin: number
  /** All route hours added up, the paid hours. */
  operatingMin: number
  trucksUsed: number
  routes: RunRoute[]
  unassigned: ReasonGroup[]
  warnings: number
}

export interface GoalResult {
  goalId: GoalId
  label: string
  descriptor: string
  placed: number
  total: number
  gallons: number
  miles: number
  timeToCompleteMin: number
  trucksUsed: number
  /** Same plan as another goal (every number matches). */
  sameAs?: GoalId
}

export interface RunInputs {
  orders: number
  gallons: number
  products: { name: string; gallons: number }[]
  trucks: string[]
  drivers: string[]
  rules: string[]
  limits: string[]
  goalLabel: string
  travelTimes: string
}

export interface RunRecord {
  /** Engine request ID, as stored by #298. */
  requestId: string
  /** Short, human run number for the day. */
  number: number
  plannedDate: string
  submittedAt: string
  by: string
  durationLabel: string
  status: RunStatus
  fate: RunFate
  scope: RunScope
  /** Present when 2+ goals were compared. One entry, not one row per goal. */
  comparison?: { goals: GoalResult[]; chosen?: GoalId }
  /** The goal of a single run, or the chosen goal of a comparison. */
  goalLabel: string
  inputs: RunInputs
  result?: RunResult
  failure?: { summary: string; nextStep: string }
}
