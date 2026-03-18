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

export interface ValidationResult {
  severity: "error" | "warning" | "ok"

  l1: L1Result
  l2: ProductIssue[]
  l3: RunoutIssue[]
  runningBalance: BalanceRow[]

  // Pre-computed UI strings
  collapsedBannerText: string
  expandedBannerText: string
  collapsedBannerType: "red" | "amber" | "none"
  collapsedBannerDelta: string // e.g. "↑ 900 gal" or "↓ 1,500 gal" or "200 gal"
  expandedIssues: string[]
  truckMessage: string
  truckMessageColor: "red" | "amber" | "green"
  firstFailingStopIndex: number | null // for mid-route CTA placement (1-based index in sorted orders)
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

  // Change 1: No validation without BOTH truck AND load orders
  if (loads.length === 0) return null

  // ── L1: Total capacity check ────────────────────────────────────────────
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

  // ── L3: Running balance (stop-by-stop) ──────────────────────────────────
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

  const runningBalance: BalanceRow[] = []
  const l3: RunoutIssue[] = []
  const runoutProducts = new Set<FuelProduct>() // track which products already flagged
  let firstFailingStopIndex: number | null = null

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

  // ── Compute UI strings ──────────────────────────────────────────────────
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

  const hasL3 = l3.length > 0
  const hasIssues = hasL3 || l2.length > 0 || l1.status === "exceeding"

  let finalExpandedIssues: string[] = []

  if (hasIssues) {
    // L3 (runout) → red banner; L2-only or L1-exceeding → amber banner
    collapsedBannerType = hasL3 ? "red" : "amber"

    // Change 5: Build expanded issues with same-stop products merged for L3
    const expandedIssues: string[] = []

    // L3: group by stopIndex, merge same-stop products
    if (l3.length > 0) {
      const grouped: Record<number, { products: FuelProduct[]; stopName: string }> = {}
      for (const issue of l3) {
        if (!grouped[issue.stopIndex]) grouped[issue.stopIndex] = { products: [], stopName: issue.stopName }
        grouped[issue.stopIndex].products.push(issue.product)
      }
      // Sort by stop index
      const sortedStops = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b))
      for (const [stopIdx, g] of sortedStops) {
        const names = g.products.map((p) => getShortProductName(p)).join(", ")
        expandedIssues.push(
          `${names} will run out before Stop ${stopIdx} (${g.stopName})`
        )
      }
    }

    // L2: one per product, sorted by largest overflow first (already sorted above)
    for (const issue of l2) {
      expandedIssues.push(
        `${getShortProductName(issue.product)} exceeds available truck capacity by ${issue.overflow.toLocaleString()} gal`
      )
    }

    // Item count = bullet count (merged)
    const itemCount = expandedIssues.length

    // Collapsed text: worst-problem-first
    if (l3.length > 0) {
      // L3 is worst — show first runout group
      const firstGroup = Object.entries(
        l3.reduce((acc, issue) => {
          const key = issue.stopIndex
          if (!acc[key]) acc[key] = []
          acc[key].push(issue.product)
          return acc
        }, {} as Record<number, FuelProduct[]>)
      ).sort(([a], [b]) => Number(a) - Number(b))[0]

      const [stopIdx, products] = firstGroup
      const names = products.map((p) => getShortProductName(p)).join(", ")
      const moreCount = itemCount - 1
      collapsedBannerText = moreCount > 0
        ? `${names} runs out at Stop ${stopIdx} + ${moreCount} more`
        : `${names} runs out at Stop ${stopIdx}`
    } else if (l2.length > 0) {
      // L2 only
      const moreCount = itemCount - 1
      const delta = `${l2[0].overflow.toLocaleString()} gal`
      collapsedBannerText = moreCount > 0
        ? `Exceeding Product Capacity by ${delta} + ${moreCount} more`
        : `Exceeding Product Capacity by ${delta}`
    } else if (l1.status === "exceeding") {
      // L1 exceeding only
      collapsedBannerText = "Exceeding Truck Capacity"
      collapsedBannerDelta = `${diff.toLocaleString()} gal`
    }

    // Expanded text: count header
    expandedBannerText = itemCount === 1
      ? "1 Item needs your attention"
      : `${itemCount} Items need your attention`

    finalExpandedIssues = expandedIssues
  } else if (l1.status === "below") {
    // AMBER banner — below capacity, healthy
    collapsedBannerType = "amber"
    collapsedBannerText = "Below Truck Capacity"
    collapsedBannerDelta = `${Math.abs(diff).toLocaleString()} gal`
    expandedBannerText = collapsedBannerText
  }

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
