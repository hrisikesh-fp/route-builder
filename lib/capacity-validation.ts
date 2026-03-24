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

export interface RunoutIssue {
  product: FuelProduct
  stopIndex: number // 1-based delivery stop index where balance goes negative
  stopName: string
  deficit: number // how many gal negative
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
  collapsedBannerType: "red" | "amber" | "none"
  collapsedBannerDelta: string
  expandedIssues: string[]
  truckMessage: string
  truckMessageColor: "red" | "amber" | "green"
  firstFailingStopIndex: number | null
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

  const runoutProducts = new Set<FuelProduct>() // track which products already flagged

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

      // Check for negatives
      for (const [product, bal] of Object.entries(balance) as [FuelProduct, number][]) {
        if (bal < 0 && !runoutProducts.has(product)) {
          runoutProducts.add(product)
          l3.push({
            product,
            stopIndex: stopCounter,
            stopName: order.customerName,
            deficit: Math.abs(bal),
          })
          if (firstFailingStopIndex === null) {
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
  const suppressL2 = multiLoad && l3Passes && hasLoads

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
  } else if (suppressL2) {
    // Multi-load + L3 passes → amber, L2 hidden
    zoneAColor = "amber"
    zoneALines.push(`Below Truck Capacity ↓ ${Math.abs(diff).toLocaleString()} gal`)
  } else if (l3.length > 0 && l2.length > 0) {
    // L3 fails + L2 as context → accent
    zoneAColor = "accent"
    for (const issue of l2) {
      zoneALines.push(`${getShortProductName(issue.product)} exceeds available truck capacity by ${issue.overflow.toLocaleString()} gal`)
    }
  } else if (l2.length === 0 && l3.length === 0) {
    // All pass → amber
    zoneAColor = "amber"
    zoneALines.push(`Below Truck Capacity ↓ ${Math.abs(diff).toLocaleString()} gal`)
  }

  const zoneA: ZoneA = { color: zoneAColor, lines: zoneALines }

  // Zone B: route-level banner, L3-only
  const zoneBVisible = hasLoads && l3.length > 0
  const zoneB: ZoneB = { visible: zoneBVisible }

  const severity: ValidationResult["severity"] =
    l3.length > 0 || l2.length > 0
      ? "error"
      : l1.status === "exceeding" || l1.status === "below"
        ? "warning"
        : "ok"

  // Change 2 & 3: Banner colors — amber=healthy, red=issues; collapsed vs expanded text
  let collapsedBannerText = ""
  let expandedBannerText = ""
  let collapsedBannerType: ValidationResult["collapsedBannerType"] = "none"
  let collapsedBannerDelta = ""

  let finalExpandedIssues: string[] = []

  // Zone B banner: L3-only (run-outs at specific stops)
  if (zoneBVisible) {
    collapsedBannerType = "red"

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
      expandedIssues.push(
        `${names} will run out before Stop ${stopIdx} (${g.stopName})`
      )
    }

    const itemCount = expandedIssues.length

    // Collapsed text: worst-problem-first L3 runout
    const firstGroup = sortedStops[0]
    const [stopIdx, { products }] = firstGroup
    const names = products.map((p) => getShortProductName(p)).join(", ")
    const moreCount = itemCount - 1
    collapsedBannerText = moreCount > 0
      ? `${names} runs out at Stop ${stopIdx} + ${moreCount} more`
      : `${names} runs out at Stop ${stopIdx}`

    expandedBannerText = itemCount === 1
      ? "1 Item needs your attention"
      : `${itemCount} Items need your attention`

    finalExpandedIssues = expandedIssues
  }
  // No Zone B banner for L2-only or healthy states — those are in Zone A now

  // Change 7: Truck message — only for healthy state (no "no fuel loaded" here, that's UI layer)
  let truckMessage = ""
  let truckMessageColor: ValidationResult["truckMessageColor"] = "green"

  if (l3.length === 0 && l2.length === 0) {
    truckMessage = "This truck can accommodate more orders."
    truckMessageColor = "amber"
  }
  // When warnings exist (l3/l2), truckMessage stays empty — banner handles it

  return {
    severity,
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
  }
}
