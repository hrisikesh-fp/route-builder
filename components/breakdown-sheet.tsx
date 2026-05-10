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

// Display label for each product (Figma uses friendly names)
const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chooseYAxis(maxValue: number): { steps: number[]; max: number } {
  // Pick a Y-axis that matches Figma cadence
  if (maxValue <= 2000) return { steps: [0, 500, 1000, 1500, 2000], max: 2000 }
  if (maxValue <= 6000) return { steps: [0, 1500, 3000, 4500, 6000], max: 6000 }
  // Fallback: round up to next nice multiple
  const nice = Math.ceil(maxValue / 1000) * 1000
  return { steps: [0, nice * 0.25, nice * 0.5, nice * 0.75, nice], max: nice }
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({
  bars,
}: {
  bars: { label: string; value: number; color: string }[]
}) {
  const maxValue = Math.max(...bars.map((b) => b.value), 0)
  const yAxis = chooseYAxis(maxValue)
  const CHART_H = 168
  const CHART_W = 523
  const Y_AXIS_W = 40
  const PLOT_H = CHART_H - 24 // leave room for x-axis labels
  const PLOT_W = CHART_W - Y_AXIS_W

  return (
    <div style={{ width: CHART_W, height: CHART_H, position: "relative" }}>
      {/* Y-axis labels */}
      <div style={{ position: "absolute", left: 0, top: 0, width: Y_AXIS_W, height: PLOT_H, display: "flex", flexDirection: "column-reverse", justifyContent: "space-between" }}>
        {yAxis.steps.map((step) => (
          <div
            key={step}
            style={{
              fontSize: 12,
              color: "#737373",
              lineHeight: 1,
              textAlign: "right",
              paddingRight: 8,
              transform: "translateY(50%)",
            }}
          >
            {step.toLocaleString()}
          </div>
        ))}
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
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          padding: "0 16px",
          gap: 12,
        }}
      >
        {bars.map((bar) => {
          const heightPct = yAxis.max > 0 ? (bar.value / yAxis.max) * 100 : 0
          return (
            <div
              key={bar.label}
              style={{
                flex: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${heightPct}%`,
                  backgroundColor: bar.color,
                  borderRadius: "2px 2px 0 0",
                }}
              />
            </div>
          )
        })}
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

// ─── Main Sheet ──────────────────────────────────────────────────────────────

export interface BreakdownSheetProps {
  isOpen: boolean
  onClose: () => void
  /** All orders (deliveries + loads) for the active route. */
  orders: ExtractionOrder[]
  /** Truck capacity profile for compartment breakdown. */
  truckProfile: TruckCapacityProfile | null
}

export function BreakdownSheet({ isOpen, onClose, orders, truckProfile }: BreakdownSheetProps) {
  if (!isOpen) return null

  // ── By Product: sum delivery demand per product ──
  const byProductMap: Record<string, number> = {}
  for (const o of orders) {
    if (o.orderType !== "D") continue
    for (const pb of o.productBreakdown ?? []) {
      byProductMap[pb.product] = (byProductMap[pb.product] ?? 0) + pb.volume
    }
  }
  const productEntries = Object.entries(byProductMap)
  const productBars = productEntries.map(([product, volume]) => ({
    label: PRODUCT_LABEL[product] ?? product,
    value: volume,
    color: PRODUCT_BAR_COLOR[product] ?? COMPARTMENT_BAR_COLOR,
  }))

  // Render rule: 1 product → both charts, 2+ products → product only
  const showCompartmentChart = productEntries.length === 1

  // ── By Compartment: load distribution from the load order's product breakdown ──
  // For a single-product route, each compartment gets filled to its capacity for that product
  // up to the total loaded volume. We derive a simple even-fill representation.
  let compartmentBars: { label: string; value: number; color: string }[] = []
  if (showCompartmentChart && truckProfile) {
    const product = productEntries[0]?.[0] as FuelProduct | undefined
    if (product) {
      // Total loaded volume of this product across all L orders
      const totalLoaded = orders
        .filter((o) => o.orderType === "L")
        .flatMap((o) => o.productBreakdown ?? [])
        .filter((pb) => pb.product === product)
        .reduce((sum, pb) => sum + pb.volume, 0)

      // Distribute totalLoaded across compartments, filling each up to its capacity.
      let remaining = totalLoaded
      compartmentBars = truckProfile.compartments.map((c) => {
        const cap = c.capacities[product] ?? 0
        const fill = Math.min(cap, remaining)
        remaining -= fill
        return {
          label: c.id,
          value: fill,
          color: COMPARTMENT_BAR_COLOR,
        }
      })
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: 24,
        right: 24,
        zIndex: 200,
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
