"use client"

import { X } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import type { TruckCapacityProfile, FuelProduct } from "@/lib/truck-data"

// ─── Per-product bar fill (matches Figma) ─────────────────────────────────────
const PRODUCT_BAR_COLOR: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "rgba(250, 100, 0, 0.5)",        // orange
  "200*DIESEL-ONROAD CLEAR": "rgba(129, 140, 248, 0.55)",    // indigo
  "87 OCT W/ 10% ETH": "rgba(163, 163, 163, 0.65)",          // neutral
  "ULSD CLEAR DIESEL": "rgba(129, 140, 248, 0.55)",          // indigo (TBD)
  "DEF PACKAGED": "rgba(129, 140, 248, 0.55)",
}

const COMPARTMENT_BAR_COLOR = "rgba(129, 140, 248, 0.55)"

const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

// ─── Y-axis helpers ──────────────────────────────────────────────────────────

function chooseYAxisRange(maxValue: number, minValue: number): { steps: number[]; max: number; min: number } {
  // Pick a top step that fits the data with Figma cadence.
  let max: number
  if (maxValue <= 2000) max = 2000
  else if (maxValue <= 6000) max = 6000
  else max = Math.ceil(maxValue / 1000) * 1000

  // Negative range: extend down by one "nice" step (e.g. −500 for the small chart, −1500 for the big one)
  let min = 0
  if (minValue < 0) {
    const stepGuess = max / 4 // matches the 4 visible steps above 0
    const stepsBelow = Math.ceil(Math.abs(minValue) / stepGuess) || 1
    min = -stepsBelow * stepGuess
  }

  // Build evenly-spaced steps across [min, max], 4 intervals = 5 labels (incl. 0)
  // For consistency with original Figma cadence we use 5 labels above 0; if min < 0, append below 0.
  const stepSize = max / 4
  const steps: number[] = []
  // Below 0 (only when negative)
  if (min < 0) {
    const stepsBelow = Math.round(Math.abs(min) / stepSize)
    for (let i = stepsBelow; i >= 1; i--) steps.push(-i * stepSize)
  }
  // 0 → max
  for (let i = 0; i <= 4; i++) steps.push(i * stepSize)
  return { steps, max, min }
}

// ─── Bar Chart (supports negative bars dipping below 0) ───────────────────────

function BarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const maxValue = Math.max(...bars.map((b) => b.value), 0)
  const minValue = Math.min(...bars.map((b) => b.value), 0)
  const yAxis = chooseYAxisRange(maxValue, minValue)

  const CHART_H = 168
  const CHART_W = 523
  const Y_AXIS_W = 48
  const PLOT_H = CHART_H - 24 // leave room for x-axis labels
  const PLOT_W = CHART_W - Y_AXIS_W

  const range = yAxis.max - yAxis.min // total numeric span
  const zeroPctFromTop = range > 0 ? (yAxis.max / range) * 100 : 100 // % from top where 0 line sits
  const zeroLineTop = (zeroPctFromTop / 100) * PLOT_H

  return (
    <div style={{ width: CHART_W, height: CHART_H, position: "relative" }}>
      {/* Y-axis labels — positioned by their value within [min, max] */}
      <div style={{ position: "absolute", left: 0, top: 0, width: Y_AXIS_W, height: PLOT_H }}>
        {yAxis.steps.map((step) => {
          const pctFromTop = ((yAxis.max - step) / range) * 100
          return (
            <div
              key={step}
              style={{
                position: "absolute",
                top: `${pctFromTop}%`,
                right: 8,
                transform: "translateY(-50%)",
                fontSize: 12,
                color: "#737373",
                lineHeight: 1,
                textAlign: "right",
              }}
            >
              {step.toLocaleString()}
            </div>
          )
        })}
      </div>

      {/* Plot area */}
      <div
        style={{
          position: "absolute",
          left: Y_AXIS_W,
          top: 0,
          width: PLOT_W,
          height: PLOT_H,
          borderLeft: "1px solid #333",
        }}
      >
        {/* Zero line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: zeroLineTop,
            height: 1,
            backgroundColor: "#333",
          }}
        />

        {/* Bars row */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "space-around",
            padding: "0 16px",
            gap: 12,
          }}
        >
          {bars.map((bar) => {
            const value = bar.value
            // Bar height as % of plot height = |value| / range * 100
            const barPctH = range > 0 ? (Math.abs(value) / range) * 100 : 0
            const barTopPx = value >= 0
              ? zeroLineTop - (barPctH / 100) * PLOT_H
              : zeroLineTop
            return (
              <div
                key={bar.label}
                style={{
                  flex: 1,
                  position: "relative",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: barTopPx,
                    left: 0,
                    right: 0,
                    height: `${barPctH}%`,
                    backgroundColor: bar.color,
                    borderRadius: value >= 0 ? "2px 2px 0 0" : "0 0 2px 2px",
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div
        style={{
          position: "absolute",
          left: Y_AXIS_W,
          top: PLOT_H + 4,
          width: PLOT_W,
          display: "flex",
          justifyContent: "space-around",
          padding: "0 16px",
          gap: 12,
        }}
      >
        {bars.map((bar) => (
          <div
            key={bar.label}
            style={{
              flex: 1,
              fontSize: 12,
              color: "#a3a3a3",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Per-stop snapshot computation ───────────────────────────────────────────

interface StopSnapshot {
  orderId: string
  /** On-truck balance per product AFTER this stop's transaction. */
  productBalances: Record<string, number>
  /** Compartment fills per compartment id AFTER this stop's transaction. Only meaningful for single-product routes. */
  compartmentFills: Record<string, number>
}

/**
 * Walks orders in routeSequence order and builds a per-stop snapshot of:
 * - on-truck product balances (post-transaction)
 * - compartment fills (sequential drain: fill C1→Cn on Load; drain C1→Cn on Delivery)
 *
 * Compartment fills only make sense for single-product routes; we compute them anyway and
 * the caller decides whether to render the chart.
 */
function buildStopSnapshots(
  orders: ExtractionOrder[],
  truckProfile: TruckCapacityProfile | null,
): StopSnapshot[] {
  // Sort orders by routeSequence to ensure correct chronological order
  const sorted = [...orders].sort(
    (a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0),
  )

  // Initialize state
  const productBalances: Record<string, number> = {}
  const compartmentFills: Record<string, number> = {}
  if (truckProfile) {
    for (const c of truckProfile.compartments) compartmentFills[c.id] = 0
  }

  // Determine the active product for sequential drain (single-product routes)
  const distinctProducts = new Set<string>()
  for (const o of sorted) {
    for (const pb of o.productBreakdown ?? []) distinctProducts.add(pb.product)
  }
  const singleProduct = distinctProducts.size === 1
    ? (Array.from(distinctProducts)[0] as FuelProduct)
    : null

  const snapshots: StopSnapshot[] = []

  for (const order of sorted) {
    for (const pb of order.productBreakdown ?? []) {
      const sign = order.orderType === "L" ? 1 : -1
      productBalances[pb.product] = (productBalances[pb.product] ?? 0) + sign * pb.volume
    }

    if (truckProfile && singleProduct) {
      const productVol = (order.productBreakdown ?? [])
        .filter((pb) => pb.product === singleProduct)
        .reduce((s, pb) => s + pb.volume, 0)

      if (order.orderType === "L") {
        // Fill C1 → Cn until volume exhausted
        let remaining = productVol
        for (const c of truckProfile.compartments) {
          const cap = c.capacities[singleProduct] ?? 0
          const room = cap - (compartmentFills[c.id] ?? 0)
          const add = Math.min(room, remaining)
          compartmentFills[c.id] = (compartmentFills[c.id] ?? 0) + add
          remaining -= add
          if (remaining <= 0) break
        }
      } else if (order.orderType === "D") {
        // Drain C1 → Cn
        let remaining = productVol
        for (const c of truckProfile.compartments) {
          const draw = Math.min(compartmentFills[c.id] ?? 0, remaining)
          compartmentFills[c.id] = (compartmentFills[c.id] ?? 0) - draw
          remaining -= draw
          if (remaining <= 0) break
        }
      }
    }

    snapshots.push({
      orderId: order.id,
      productBalances: { ...productBalances },
      compartmentFills: { ...compartmentFills },
    })
  }

  return snapshots
}

// ─── Main Sheet ──────────────────────────────────────────────────────────────

export interface BreakdownSheetProps {
  isOpen: boolean
  onClose: () => void
  /** All orders (deliveries + loads) for the active route. */
  orders: ExtractionOrder[]
  /** Truck capacity profile for compartment breakdown. */
  truckProfile: TruckCapacityProfile | null
  /** The order id whose stop snapshot to render. */
  selectedOrderId: string | null
  /** Left-edge X (px, viewport) of the order card. Sheet prefers 4px to its left, flips right if no room. */
  anchorLeft: number
  /** Right-edge X (px, viewport) of the order card. Used for right-side flip placement. */
  anchorRight: number
  /** Top Y (px, viewport) of the clicked FAB. Sheet starts vertically here, clamped to viewport. */
  anchorY: number
}

export function BreakdownSheet({
  isOpen,
  onClose,
  orders,
  truckProfile,
  selectedOrderId,
  anchorLeft,
  anchorRight,
  anchorY,
}: BreakdownSheetProps) {
  if (!isOpen) return null

  // Build per-stop snapshots and pick the one for the clicked order.
  const snapshots = buildStopSnapshots(orders, truckProfile)
  const snapshot = snapshots.find((s) => s.orderId === selectedOrderId) ?? snapshots[snapshots.length - 1]

  // Distinct products on this route → drives the rule "single-product = both charts"
  const distinctProducts = Array.from(
    new Set(orders.flatMap((o) => (o.productBreakdown ?? []).map((pb) => pb.product))),
  )
  const showCompartmentChart = distinctProducts.length === 1

  // ── By Product bars: snapshot.productBalances per product ──
  const productBars = distinctProducts.map((product) => ({
    label: PRODUCT_LABEL[product] ?? product,
    value: snapshot?.productBalances[product] ?? 0,
    color: PRODUCT_BAR_COLOR[product] ?? COMPARTMENT_BAR_COLOR,
  }))

  // ── By Compartments bars: snapshot.compartmentFills per compartment ──
  let compartmentBars: { label: string; value: number; color: string }[] = []
  if (showCompartmentChart && truckProfile) {
    compartmentBars = truckProfile.compartments.map((c) => ({
      label: c.id,
      value: snapshot?.compartmentFills[c.id] ?? 0,
      color: COMPARTMENT_BAR_COLOR,
    }))
  }

  // Position dynamically (dropdown-style):
  // - Prefer LEFT: 4px gap between sheet's right edge and the order card's left edge.
  // - If left placement would clip the viewport, flip to RIGHT of the card.
  // - Vertical: anchor to FAB top, clamp to viewport (16px gutter top + bottom).
  const SHEET_W = 600
  const SHEET_H_ESTIMATE = showCompartmentChart ? 480 : 280
  const VIEWPORT_GUTTER = 16
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1440
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800

  const wantLeft = anchorLeft - SHEET_W - 4
  const fitsLeft = wantLeft >= VIEWPORT_GUTTER
  const left = fitsLeft
    ? wantLeft
    : Math.min(anchorRight + 4, viewportW - SHEET_W - VIEWPORT_GUTTER)

  const maxTop = viewportH - SHEET_H_ESTIMATE - VIEWPORT_GUTTER
  const top = Math.max(VIEWPORT_GUTTER, Math.min(anchorY, maxTop))

  return (
    <div
      style={{
        position: "fixed",
        top,
        left,
        width: SHEET_W,
        zIndex: 10000,
        backgroundColor: "#1f1f1f",
        borderRadius: 8,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 16, fontWeight: 500, color: "#e5e5e5", margin: 0 }}>
          Product and Compartment breakdown
        </h3>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#a3a3a3",
            padding: 0,
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* By Product */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 14, color: "#a3a3a3" }}>By Product</span>
        <BarChart bars={productBars} />
      </div>

      {/* By Compartments — only when single product */}
      {showCompartmentChart && compartmentBars.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#a3a3a3" }}>By Compartments</span>
          <BarChart bars={compartmentBars} />
        </div>
      )}
    </div>
  )
}
