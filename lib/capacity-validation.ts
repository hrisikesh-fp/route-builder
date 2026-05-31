import type { ExtractionOrder, ProductBreakdown } from "./mock-data"
import type { FuelProduct, TruckCapacityProfile } from "./truck-data"

// ─── Result Types ───────────────────────────────────────────────────────────

export interface L1Result {
  status: "ok" | "exceeding" | "below"
  totalPlanned: number
  truckCapacity: number
  diff: number // positive = exceeding, negative = below
}

export interface ProductIssue {
  product: FuelProduct
  planned: number
  capacity: number
  overflow: number // how many gal over
}

export interface IncompatibilityIssue {
  product: FuelProduct
  stopIndex: number // unified stop index (same counter as L3)
  stopName: string
}

export interface RunoutIssue {
  product: FuelProduct
  stopIndex: number // 1-based delivery stop index where balance is negative
  stopName: string
  deficit: number // how many gal negative
  isFirstFailing: boolean // true if this is where the product first went negative;
                          // false for downstream stops that inherit the negative balance
}

export interface BalanceRow {
  stopIndex: number
  stopName: string
  type: "load" | "delivery" | "start"
  balances: Partial<Record<FuelProduct, number>>
}

export interface ZoneA {
  color: "accent" | "amber" | "none"
  lines: string[] // bullet items shown under truck row
}

export interface ZoneB {
  visible: boolean
  // When visible, uses collapsedBannerType/text/expandedIssues for rendering
}

export interface ValidationResult {
  severity: "error" | "warning" | "ok"

  l0: IncompatibilityIssue[]
  l1: L1Result
  l2: ProductIssue[]
  l3: RunoutIssue[]
  runningBalance: BalanceRow[]

  // Zone A (truck-level, under truck row)
  zoneA: ZoneA
  // Zone B (route-level banner, L3-only)
  zoneB: ZoneB

  // Pre-computed UI strings (kept for backward compat / Zone B rendering)
  collapsedBannerText: string
  expandedBannerText: string
  collapsedBannerType: "red" | "amber" | "orange" | "none"
  collapsedBannerDelta: string
  expandedIssues: string[]
  truckMessage: string
  truckMessageColor: "red" | "amber" | "green"
  firstFailingStopIndex: number | null
  firstBlockedStopIndex: number | null // first stop with L0 incompatibility
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getShortProductName(product: FuelProduct | string): string {
  switch (product) {
    case "200*DIESEL-OFFROAD RED":
      return "Red"
    case "200*DIESEL-ONROAD CLEAR":
      return "Clear"
    case "87 OCT W/ 10% ETH":
      return "Gas 87"
    case "ULSD CLEAR DIESEL":
      return "ULSD Clear"
    case "DEF PACKAGED":
      return "DEF Pkd"
    default:
      return product
  }
}

// ─── Main Validation Function ───────────────────────────────────────────────

export function validateRouteCapacity(
  orders: ExtractionOrder[],
  truckProfile: TruckCapacityProfile | null,
  retainedFuel?: ProductBreakdown[],
): ValidationResult | null {
  // No truck = no validation
  if (!truckProfile) return null

  const sorted = [...orders].sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

  const deliveries = sorted.filter((o) => !o.orderType || o.orderType === "D")
  const loads = sorted.filter((o) => o.orderType === "L")

  const hasLoads = loads.length > 0

  // ── L1: Total capacity check (G1 — fires with truck alone) ─────────────
  const totalPlanned = deliveries.reduce((sum, o) => sum + (o.volume ?? 0), 0)
  const diff = totalPlanned - truckProfile.totalCapacity
  const l1: L1Result = {
    status: diff > 0 ? "exceeding" : diff < 0 ? "below" : "ok",
    totalPlanned,
    truckCapacity: truckProfile.totalCapacity,
    diff,
  }

  // ── L0: Product incompatibility check (fires with truck alone) ────────────
  const l0: IncompatibilityIssue[] = []
  let firstBlockedStopIndex: number | null = null
  {
    let sc = 0
    for (const order of sorted) {
      if (order.orderType === "T") continue
      sc++
      if (order.orderType === "L") continue // loads don't need compatibility check
      if (order.productBreakdown) {
        for (const pb of order.productBreakdown) {
          const truckCanCarry = (truckProfile.productCapacities[pb.product] ?? 0) > 0
          if (!truckCanCarry) {
            l0.push({ product: pb.product, stopIndex: sc, stopName: order.customerName })
            if (firstBlockedStopIndex === null) firstBlockedStopIndex = sc
          }
        }
      }
    }
  }

  // ── L2: Per-product capacity check ──────────────────────────────────────
  const productPlanned: Partial<Record<FuelProduct, number>> = {}
  for (const order of deliveries) {
    if (order.productBreakdown) {
      for (const pb of order.productBreakdown) {
        productPlanned[pb.product] = (productPlanned[pb.product] ?? 0) + pb.volume
      }
    }
  }

  const l2: ProductIssue[] = []
  for (const [product, planned] of Object.entries(productPlanned) as [FuelProduct, number][]) {
    const capacity = truckProfile.productCapacities[product] ?? 0
    if (planned > capacity) {
      l2.push({ product, planned, capacity, overflow: planned - capacity })
    }
  }
  // Sort L2 by largest overflow first
  l2.sort((a, b) => b.overflow - a.overflow)

  // ── L3: Running balance (stop-by-stop) — G2, requires truck + load order ─
  let runningBalance: BalanceRow[] = []
  let l3: RunoutIssue[] = []
  let firstFailingStopIndex: number | null = null

  if (hasLoads) {
  // Collect all products involved
  const allProducts = new Set<FuelProduct>()
  for (const order of sorted) {
    if (order.productBreakdown) {
      for (const pb of order.productBreakdown) allProducts.add(pb.product)
    }
  }

  // Initialize balance from retained fuel
  const balance: Partial<Record<FuelProduct, number>> = {}
  for (const p of allProducts) balance[p] = 0
  if (retainedFuel) {
    for (const rf of retainedFuel) {
      balance[rf.product] = (balance[rf.product] ?? 0) + rf.volume
    }
  }

  // Tracks which products have ALREADY been flagged at an earlier stop. Used to set
  // `isFirstFailing` correctly — we no longer dedupe by product; every (stop, product)
  // negative balance becomes an issue entry. This way the per-stop banner can render
  // on each affected stop, with copy differing between "will run out at this stop"
  // (first failing) and "already ran out before this stop" (downstream).
  const productsAlreadyFlagged = new Set<FuelProduct>()

  // Start row (retained)
  runningBalance.push({
    stopIndex: 0,
    stopName: "Start",
    type: "start",
    balances: { ...balance },
  })

  // Walk through stops — unified counter for both loads and deliveries
  let stopCounter = 0
  for (const order of sorted) {
    if (order.orderType === "T") continue // skip transfers

    stopCounter++

    if (order.orderType === "L") {
      // Load: add volumes
      if (order.productBreakdown) {
        for (const pb of order.productBreakdown) {
          balance[pb.product] = (balance[pb.product] ?? 0) + pb.volume
        }
      }
      runningBalance.push({
        stopIndex: stopCounter,
        stopName: order.customerName,
        type: "load",
        balances: { ...balance },
      })
    } else {
      // Delivery: subtract volumes
      if (order.productBreakdown) {
        for (const pb of order.productBreakdown) {
          balance[pb.product] = (balance[pb.product] ?? 0) - pb.volume
        }
      }
      runningBalance.push({
        stopIndex: stopCounter,
        stopName: order.customerName,
        type: "delivery",
        balances: { ...balance },
      })

      // Check for negatives — push an issue entry for EVERY (stop, product) negative
      // balance so the per-stop UI can show on each affected stop. The product set
      // tracks whether this is the first failing stop for the product (different copy).
      for (const [product, bal] of Object.entries(balance) as [FuelProduct, number][]) {
        if (bal < 0) {
          const isFirstFailing = !productsAlreadyFlagged.has(product)
          if (isFirstFailing) productsAlreadyFlagged.add(product)
          l3.push({
            product,
            stopIndex: stopCounter,
            stopName: order.customerName,
            deficit: Math.abs(bal),
            isFirstFailing,
          })
          if (firstFailingStopIndex === null && isFirstFailing) {
            firstFailingStopIndex = stopCounter
          }
        }
      }
    }
  }
  } // end if (hasLoads)

  // ── Compute Zone A + Zone B + UI strings ──────────────────────────────────
  const multiLoad = loads.length >= 2
  const l3Passes = l3.length === 0
  const suppressL1L2 = multiLoad && l3Passes && hasLoads

  // Zone A: truck-level info under truck row
  let zoneAColor: ZoneA["color"] = "none"
  let zoneALines: string[] = []

  if (!hasLoads) {
    // G1 only, no load → accent info (L2 only, not L1)
    if (l2.length > 0) {
      zoneAColor = "accent"
      for (const issue of l2) {
        zoneALines.push(`${getShortProductName(issue.product)} exceeds available truck capacity by ${issue.overflow.toLocaleString()} gal`)
      }
    }
  } else if (suppressL1L2) {
    // Multi-load + L3 passes → L2 hidden, Zone A empty (Zone B handles amber)
  } else if (l3.length > 0 && l2.length > 0) {
    // L3 fails + L2 as context → accent
    zoneAColor = "accent"
    for (const issue of l2) {
      zoneALines.push(`${getShortProductName(issue.product)} exceeds available truck capacity by ${issue.overflow.toLocaleString()} gal`)
    }
  }
  // Zone A does NOT show "Below Truck Capacity" — that goes in Zone B amber

  const zoneA: ZoneA = { color: zoneAColor, lines: zoneALines }

  // Zone B: visible when loads exist, capacity issue, or L0 fires
  const zoneBVisible = hasLoads || l1.status !== "ok" || l0.length > 0
  const zoneB: ZoneB = { visible: zoneBVisible }

  const severity: ValidationResult["severity"] =
    l0.length > 0 || l3.length > 0 || l2.length > 0
      ? "error"
      : l1.status === "exceeding" || l1.status === "below"
        ? "warning"
        : "ok"

  let collapsedBannerText = ""
  let expandedBannerText = ""
  let collapsedBannerType: ValidationResult["collapsedBannerType"] = "none"
  let collapsedBannerDelta = ""

  let finalExpandedIssues: string[] = []

  // Zone B banner content — L0 dominates (red), then L3 (amber), then L1 (orange)
  if (zoneBVisible && l0.length > 0) {
    // L0 present → RED banner (highest severity)
    collapsedBannerType = "red"
    const allIssueStops = new Set([...l0.map(i => i.stopIndex), ...l3.map(i => i.stopIndex)])
    const totalCount = allIssueStops.size
    collapsedBannerText = `${totalCount} ${totalCount === 1 ? "Issue" : "Issues"}`
    expandedBannerText = collapsedBannerText
    // Build expanded issues: L0 stops first, then L3
    const expandedIssues: string[] = []
    const l0Grouped: Record<number, { products: FuelProduct[]; stopName: string }> = {}
    for (const issue of l0) {
      if (!l0Grouped[issue.stopIndex]) l0Grouped[issue.stopIndex] = { products: [], stopName: issue.stopName }
      l0Grouped[issue.stopIndex].products.push(issue.product)
    }
    for (const [stopIdx, g] of Object.entries(l0Grouped).sort(([a], [b]) => Number(a) - Number(b))) {
      const names = g.products.map((p) => getShortProductName(p)).join(", ")
      expandedIssues.push(`${names} incompatible at Stop ${stopIdx} (${g.stopName})`)
    }
    const l3Grouped: Record<number, { products: FuelProduct[]; stopName: string }> = {}
    for (const issue of l3) {
      if (!l3Grouped[issue.stopIndex]) l3Grouped[issue.stopIndex] = { products: [], stopName: issue.stopName }
      l3Grouped[issue.stopIndex].products.push(issue.product)
    }
    for (const [stopIdx, g] of Object.entries(l3Grouped).sort(([a], [b]) => Number(a) - Number(b))) {
      const names = g.products.map((p) => getShortProductName(p)).join(", ")
      expandedIssues.push(`${names} will run out before Stop ${stopIdx} (${g.stopName})`)
    }
    finalExpandedIssues = expandedIssues
  } else if (zoneBVisible && l3.length > 0) {
    // L3 failures → amber banner (red reserved for L0)
    collapsedBannerType = "amber"

    // Build expanded issues — L3 only, same-stop products merged
    const expandedIssues: string[] = []
    const grouped: Record<number, { products: FuelProduct[]; stopName: string }> = {}
    for (const issue of l3) {
      if (!grouped[issue.stopIndex]) grouped[issue.stopIndex] = { products: [], stopName: issue.stopName }
      grouped[issue.stopIndex].products.push(issue.product)
    }
    const sortedStops = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b))
    for (const [stopIdx, g] of sortedStops) {
      const names = g.products.map((p) => getShortProductName(p)).join(", ")
      expandedIssues.push(`${names} will run out before Stop ${stopIdx} (${g.stopName})`)
    }

    const itemCount = expandedIssues.length
    collapsedBannerText = `${itemCount} ${itemCount === 1 ? "Issue" : "Issues"}`
    expandedBannerText = collapsedBannerText
    finalExpandedIssues = expandedIssues
  } else if (zoneBVisible && l3.length === 0 && l0.length === 0) {
    if (suppressL1L2) {
      // Multi-load + L3 passes → suppress L1/L2 details, but still show correct capacity direction
      collapsedBannerType = "orange"
      collapsedBannerText = l1.status === "exceeding" ? "Exceeding Truck Capacity" : "Below Truck Capacity"
      collapsedBannerDelta = l1.status === "exceeding" ? `${diff.toLocaleString()} gal` : `${Math.abs(diff).toLocaleString()} gal`
    } else if (l1.status === "exceeding") {
      collapsedBannerType = "orange"
      collapsedBannerText = "Exceeding Truck Capacity"
      collapsedBannerDelta = `${diff.toLocaleString()} gal`
    } else {
      collapsedBannerType = "orange"
      collapsedBannerText = "Below Truck Capacity"
      collapsedBannerDelta = `${Math.abs(diff).toLocaleString()} gal`
    }
    expandedBannerText = collapsedBannerText
  }

  // Truck message — always mirrors L1 status below the truck dropdown.
  // Shown regardless of L3/L2 — truck capacity is a fixed fact about the route.
  let truckMessage = ""
  let truckMessageColor: ValidationResult["truckMessageColor"] = "green"

  if (l1.status === "exceeding") {
    truckMessage = "Exceeding Truck Capacity"
    truckMessageColor = "amber"
  } else if (l1.status === "below") {
    truckMessage = "Below Truck Capacity"
    truckMessageColor = "amber"
  }
  // "ok" → no message below truck

  return {
    severity,
    l0,
    l1,
    l2,
    l3,
    runningBalance,
    zoneA,
    zoneB,
    collapsedBannerText,
    expandedBannerText,
    collapsedBannerType,
    collapsedBannerDelta,
    expandedIssues: finalExpandedIssues,
    truckMessage,
    truckMessageColor,
    firstFailingStopIndex,
    firstBlockedStopIndex,
  }
}
