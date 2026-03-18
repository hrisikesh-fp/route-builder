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
  collapsedBannerType: "red" | "amber" | "none"
  collapsedBannerDelta: string // e.g. "↑ 900 gal" or "↓ 1,500 gal" or "200 gal"
  expandedIssues: string[]
  truckMessage: string
  truckMessageColor: "red" | "amber" | "green"
  firstFailingStopIndex: number | null // for mid-route CTA placement (1-based index in sorted orders)
  noFuelLoaded: boolean // truck selected but no load orders
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
  const noFuelLoaded = loads.length === 0

  // Start row (retained)
  runningBalance.push({
    stopIndex: 0,
    stopName: "Start",
    type: "start",
    balances: { ...balance },
  })

  // Walk through stops
  let deliveryStopCounter = 0
  for (const order of sorted) {
    if (order.orderType === "T") continue // skip transfers

    if (order.orderType === "L") {
      // Load: add volumes
      if (order.productBreakdown) {
        for (const pb of order.productBreakdown) {
          balance[pb.product] = (balance[pb.product] ?? 0) + pb.volume
        }
      }
      runningBalance.push({
        stopIndex: runningBalance.length,
        stopName: order.customerName,
        type: "load",
        balances: { ...balance },
      })
    } else {
      // Delivery: subtract volumes
      deliveryStopCounter++
      if (order.productBreakdown) {
        for (const pb of order.productBreakdown) {
          balance[pb.product] = (balance[pb.product] ?? 0) - pb.volume
        }
      }
      runningBalance.push({
        stopIndex: deliveryStopCounter,
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
            stopIndex: deliveryStopCounter,
            stopName: order.customerName,
            deficit: Math.abs(bal),
          })
          if (firstFailingStopIndex === null) {
            firstFailingStopIndex = deliveryStopCounter
          }
        }
      }
    }
  }

  // ── Compute UI strings ──────────────────────────────────────────────────
  const severity: ValidationResult["severity"] =
    l3.length > 0 || l1.status === "exceeding" || l2.length > 0
      ? "error"
      : l1.status === "below"
        ? "warning"
        : "ok"

  // Collapsed banner
  let collapsedBannerText = ""
  let collapsedBannerType: ValidationResult["collapsedBannerType"] = "none"
  let collapsedBannerDelta = ""

  if (noFuelLoaded) {
    // No load orders — every stop would fail, but show a different message
    collapsedBannerText = ""
    collapsedBannerType = "none"
  } else if (l3.length > 0) {
    // Worst-problem-first: runout issues
    const worst = l3[0]
    const shortName = getShortProductName(worst.product)
    const moreCount = l3.length + l2.length - 1
    collapsedBannerText =
      moreCount > 0
        ? `${shortName} runs out at Stop ${worst.stopIndex} + ${moreCount} more`
        : `${shortName} runs out at Stop ${worst.stopIndex}`
    collapsedBannerType = "red"
    collapsedBannerDelta = ""
  } else if (l2.length > 0) {
    collapsedBannerText = "Exceeding Product Capacity"
    collapsedBannerType = "amber"
    collapsedBannerDelta = `${l2.reduce((s, i) => s + i.overflow, 0).toLocaleString()} gal`
  } else if (l1.status === "exceeding") {
    collapsedBannerText = "Exceeding Truck Capacity"
    collapsedBannerType = "red"
    collapsedBannerDelta = `↑ ${diff.toLocaleString()} gal`
  } else if (l1.status === "below") {
    collapsedBannerText = "Below Truck Capacity"
    collapsedBannerType = "amber"
    collapsedBannerDelta = `↓ ${Math.abs(diff).toLocaleString()} gal`
  }

  // Expanded issues (bullet points)
  const expandedIssues: string[] = []
  // Runout issues first (most severe)
  for (const issue of l3) {
    expandedIssues.push(
      `${issue.product} will run out before Stop ${issue.stopIndex} (${issue.stopName})`,
    )
  }
  // Then product capacity issues
  for (const issue of l2) {
    expandedIssues.push(
      `${issue.product} exceeds available truck capacity by ${issue.overflow.toLocaleString()} gal`,
    )
  }

  // Truck message
  let truckMessage = ""
  let truckMessageColor: ValidationResult["truckMessageColor"] = "green"

  if (noFuelLoaded) {
    truckMessage = "No fuel loaded. Add a load order to supply this route."
    truckMessageColor = "red"
  } else if (l3.length > 0 || l2.length > 0) {
    truckMessage = "Truck capacity is insufficient for 1 or more products."
    truckMessageColor = "red"
  } else if (l1.status === "exceeding") {
    truckMessage = "Truck capacity is not sufficient for all orders."
    truckMessageColor = "red"
  } else {
    truckMessage = "This truck can accommodate more orders."
    truckMessageColor = "amber"
  }

  return {
    severity,
    l1,
    l2,
    l3,
    runningBalance,
    collapsedBannerText,
    collapsedBannerType,
    collapsedBannerDelta,
    expandedIssues,
    truckMessage,
    truckMessageColor,
    firstFailingStopIndex,
    noFuelLoaded,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getShortProductName(product: FuelProduct): string {
  switch (product) {
    case "200*DIESEL-OFFROAD RED":
      return "Diesel-Offroad Red"
    case "200*DIESEL-ONROAD CLEAR":
      return "Diesel-Onroad Clear"
    case "87 OCT W/ 10% ETH":
      return "87 Regular"
    case "ULSD CLEAR DIESEL":
      return "ULSD Clear"
    case "DEF PACKAGED":
      return "DEF Pkd"
    default:
      return product
  }
}
