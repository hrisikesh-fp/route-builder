"use client"

import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { ExtractionOrder } from "@/lib/mock-data"
import type { TruckCapacityProfile, FuelProduct, TruckCompartment } from "@/lib/truck-data"

// ─── Per-product bar fill (matches Figma) ─────────────────────────────────────
const PRODUCT_BAR_COLOR: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "rgba(250, 100, 0, 0.5)",
  "200*DIESEL-ONROAD CLEAR": "rgba(129, 140, 248, 0.55)",
  "87 OCT W/ 10% ETH": "rgba(163, 163, 163, 0.65)",
  "ULSD CLEAR DIESEL": "rgba(129, 140, 248, 0.55)",
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

// Emil's strong ease-out curve for tooltip motion
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"

// ─── Y-axis helpers ──────────────────────────────────────────────────────────

function chooseYAxisRange(maxValue: number, minValue: number): { steps: number[]; max: number; min: number } {
  let max: number
  if (maxValue <= 2000) max = 2000
  else if (maxValue <= 6000) max = 6000
  else max = Math.ceil(maxValue / 1000) * 1000

  let min = 0
  if (minValue < 0) {
    const stepGuess = max / 4
    const stepsBelow = Math.ceil(Math.abs(minValue) / stepGuess) || 1
    min = -stepsBelow * stepGuess
  }

  const stepSize = max / 4
  const steps: number[] = []
  if (min < 0) {
    const stepsBelow = Math.round(Math.abs(min) / stepSize)
    for (let i = stepsBelow; i >= 1; i--) steps.push(-i * stepSize)
  }
  for (let i = 0; i <= 4; i++) steps.push(i * stepSize)
  return { steps, max, min }
}

// ─── Media-query hook ────────────────────────────────────────────────────────

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia(query)
    const handler = () => setMatches(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [query])
  return matches
}

// ─── Bar spec used by the chart ──────────────────────────────────────────────

interface BarSpec {
  /** Unique key (e.g. "product:200*DIESEL-ONROAD CLEAR" or "comp:C3"). */
  id: string
  /** X-axis label. */
  label: string
  value: number
  color: string
  /** Heading shown at the top of the hover tooltip. */
  tooltipHeading: string
  /** Body shown below the heading (comma-separated list). */
  tooltipBody: string
}

// ─── Single bar (encapsulates hover + tooltip) ───────────────────────────────

function Bar({
  bar,
  isHovered,
  onEnter,
  onLeave,
  zeroLineTop,
  plotH,
  range,
  canHover,
  reducedMotion,
  instantTooltip,
}: {
  bar: BarSpec
  isHovered: boolean
  onEnter: () => void
  onLeave: () => void
  zeroLineTop: number
  plotH: number
  range: number
  canHover: boolean
  reducedMotion: boolean
  instantTooltip: boolean
}) {
  const value = bar.value
  const barPctH = range > 0 ? (Math.abs(value) / range) * 100 : 0
  const barTopPx = value >= 0
    ? zeroLineTop - (barPctH / 100) * plotH
    : zeroLineTop

  // Mount state for the entry transition
  const [mounted, setMounted] = useState(instantTooltip)
  useEffect(() => {
    if (!isHovered) {
      setMounted(false)
      return
    }
    if (instantTooltip || reducedMotion) {
      setMounted(true)
      return
    }
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [isHovered, instantTooltip, reducedMotion])

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        height: "100%",
      }}
      onMouseEnter={canHover ? onEnter : undefined}
      onMouseLeave={canHover ? onLeave : undefined}
    >
      {/* The bar itself */}
      <div
        style={{
          position: "absolute",
          top: barTopPx,
          left: 0,
          right: 0,
          height: `${barPctH}%`,
          backgroundColor: bar.color,
          borderRadius: value >= 0 ? "2px 2px 0 0" : "0 0 2px 2px",
          pointerEvents: "none", // hover handled by parent so empty-bar areas still trigger
        }}
      />

      {/* Hover overlay (full bar slot) — captures hover even when bar value is 0 */}
      {canHover && (
        <div style={{ position: "absolute", inset: 0 }} />
      )}

      {/* Value label + tooltip — only when hovered */}
      {isHovered && (
        <BarHoverContent
          value={value}
          barTopPx={barTopPx}
          barHeightPx={(barPctH / 100) * plotH}
          plotH={plotH}
          color={bar.color}
          mounted={mounted}
          reducedMotion={reducedMotion}
          tooltipHeading={bar.tooltipHeading}
          tooltipBody={bar.tooltipBody}
        />
      )}
    </div>
  )
}

// ─── Floating value label + tooltip rendered above (or below) a hovered bar ──

function BarHoverContent({
  value,
  barTopPx,
  barHeightPx,
  plotH,
  color: _color,
  mounted,
  reducedMotion,
  tooltipHeading,
  tooltipBody,
}: {
  value: number
  barTopPx: number
  barHeightPx: number
  plotH: number
  color: string
  mounted: boolean
  reducedMotion: boolean
  tooltipHeading: string
  tooltipBody: string
}) {
  const isNegative = value < 0
  // Position anchor: outer end of the bar (top for positive, bottom for negative)
  const outerEndPx = isNegative ? barTopPx + barHeightPx : barTopPx

  // Layout from the outer end outward:
  //   positive bar: [tooltip] (gap) [triangle ↓] (gap) [value label] (gap) [bar top]
  //   negative bar: [bar bottom] (gap) [value label] (gap) [triangle ↑] (gap) [tooltip]
  const VALUE_LABEL_GAP = 6
  const TRIANGLE_GAP = 4

  // Style for the wrapper containing label + tooltip
  // We position absolute children: value label at outer end, tooltip further out.
  const transitionStyle = reducedMotion
    ? { transition: "opacity 100ms linear" }
    : { transition: `opacity 175ms ${EASE_OUT}, transform 175ms ${EASE_OUT}` }

  return (
    <>
      {/* Value label */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          ...(isNegative
            ? { top: outerEndPx + VALUE_LABEL_GAP }
            : { top: outerEndPx - VALUE_LABEL_GAP, transform: "translateY(-100%)" }),
          textAlign: "center",
          fontSize: 14,
          fontWeight: 500,
          color: "#FAFAFA",
          lineHeight: 1.2,
          opacity: mounted ? 1 : 0,
          ...transitionStyle,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {value.toLocaleString()} gal
      </div>

      {/* Tooltip (with triangle pointer) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          ...(isNegative
            ? { top: outerEndPx + VALUE_LABEL_GAP + 18 + TRIANGLE_GAP } // label height (~18) + gap
            : { top: outerEndPx - VALUE_LABEL_GAP - 18 - TRIANGLE_GAP, transform: "translate(-50%, -100%) scale(" + (mounted ? 1 : 0.97) + ")" }),
          ...(isNegative
            ? { transform: "translateX(-50%) scale(" + (mounted ? 1 : 0.97) + ")" }
            : {}),
          // Origin: the side facing the bar (so the tooltip scales out of the bar)
          transformOrigin: isNegative ? "top center" : "bottom center",
          opacity: mounted ? 1 : 0,
          ...transitionStyle,
          backgroundColor: "#FAFAFA",
          color: "#171717",
          padding: "10px 12px",
          borderRadius: 6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          pointerEvents: "none",
          // Stop the tooltip from getting clipped by overflow on the chart container
          zIndex: 2,
          minWidth: 140,
          maxWidth: 240,
          textAlign: "left",
          // Prevent the bottom-out clamp from making the tooltip negative when the bar is near top
          ...(barTopPx < 60 && !isNegative ? { top: outerEndPx + barHeightPx + VALUE_LABEL_GAP + 18 + TRIANGLE_GAP } : {}),
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: "#171717", lineHeight: 1.2 }}>
          {tooltipHeading}
        </div>
        <div style={{ fontSize: 14, fontWeight: 400, color: "#525252", lineHeight: 1.4, marginTop: 4 }}>
          {tooltipBody}
        </div>

        {/* Triangle pointer */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            ...(isNegative
              ? {
                  top: -4,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderBottom: "5px solid #FAFAFA",
                }
              : {
                  bottom: -4,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid #FAFAFA",
                }),
          }}
        />
      </div>
    </>
  )
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({ bars }: { bars: BarSpec[] }) {
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)")
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const lastLeaveTimeRef = useRef<number>(0)
  const [instantTooltip, setInstantTooltip] = useState(false)

  const handleEnter = (id: string) => {
    const now = Date.now()
    const since = now - lastLeaveTimeRef.current
    setInstantTooltip(since < 500)
    setHoveredId(id)
  }
  const handleLeave = () => {
    lastLeaveTimeRef.current = Date.now()
    setHoveredId(null)
  }

  const maxValue = Math.max(...bars.map((b) => b.value), 0)
  const minValue = Math.min(...bars.map((b) => b.value), 0)
  const yAxis = chooseYAxisRange(maxValue, minValue)

  const CHART_H = 168
  const CHART_W = 523
  const Y_AXIS_W = 48
  const PLOT_H = CHART_H - 24
  const PLOT_W = CHART_W - Y_AXIS_W
  const range = yAxis.max - yAxis.min
  const zeroPctFromTop = range > 0 ? (yAxis.max / range) * 100 : 100
  const zeroLineTop = (zeroPctFromTop / 100) * PLOT_H

  return (
    <div style={{ width: CHART_W, height: CHART_H, position: "relative" }}>
      {/* Y-axis labels */}
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
          {bars.map((bar) => (
            <Bar
              key={bar.id}
              bar={bar}
              isHovered={hoveredId === bar.id}
              onEnter={() => handleEnter(bar.id)}
              onLeave={handleLeave}
              zeroLineTop={zeroLineTop}
              plotH={PLOT_H}
              range={range}
              canHover={canHover}
              reducedMotion={reducedMotion}
              instantTooltip={instantTooltip}
            />
          ))}
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
            key={bar.id}
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
  productBalances: Record<string, number>
  compartmentFills: Record<string, number>
}

function buildStopSnapshots(
  orders: ExtractionOrder[],
  truckProfile: TruckCapacityProfile | null,
): StopSnapshot[] {
  const sorted = [...orders].sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

  const productBalances: Record<string, number> = {}
  const compartmentFills: Record<string, number> = {}
  if (truckProfile) {
    for (const c of truckProfile.compartments) compartmentFills[c.id] = 0
  }

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

// ─── Tooltip data lookup helpers ─────────────────────────────────────────────

function compartmentsForProduct(
  product: string,
  truck: TruckCapacityProfile,
): string[] {
  return truck.compartments
    .filter((c) => (c.capacities[product as FuelProduct] ?? 0) > 0)
    .map((c) => c.id)
}

function productsForCompartment(
  comp: TruckCompartment,
  routeProducts: Set<string>,
): string[] {
  return Object.entries(comp.capacities)
    .filter(([, cap]) => (cap ?? 0) > 0)
    .map(([p]) => p)
    .filter((p) => routeProducts.has(p))
}

// ─── Main Sheet ──────────────────────────────────────────────────────────────

export interface BreakdownSheetProps {
  isOpen: boolean
  onClose: () => void
  orders: ExtractionOrder[]
  truckProfile: TruckCapacityProfile | null
  selectedOrderId: string | null
  anchorLeft: number
  anchorRight: number
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

  const snapshots = buildStopSnapshots(orders, truckProfile)
  const snapshot = snapshots.find((s) => s.orderId === selectedOrderId) ?? snapshots[snapshots.length - 1]

  const distinctProducts = Array.from(
    new Set(orders.flatMap((o) => (o.productBreakdown ?? []).map((pb) => pb.product))),
  )
  const routeProductSet = new Set(distinctProducts)
  const showCompartmentChart = distinctProducts.length === 1

  // ── By Product bars ──
  const productBars: BarSpec[] = distinctProducts.map((product) => {
    const compIds = truckProfile ? compartmentsForProduct(product, truckProfile) : []
    return {
      id: `product:${product}`,
      label: PRODUCT_LABEL[product] ?? product,
      value: snapshot?.productBalances[product] ?? 0,
      color: PRODUCT_BAR_COLOR[product] ?? COMPARTMENT_BAR_COLOR,
      tooltipHeading: "Compartments",
      tooltipBody: compIds.length > 0 ? compIds.join(", ") : "—",
    }
  })

  // ── By Compartments bars ──
  let compartmentBars: BarSpec[] = []
  if (showCompartmentChart && truckProfile) {
    compartmentBars = truckProfile.compartments.map((c) => {
      const products = productsForCompartment(c, routeProductSet)
      const productLabels = products.map((p) => PRODUCT_LABEL[p] ?? p)
      return {
        id: `comp:${c.id}`,
        label: c.id,
        value: snapshot?.compartmentFills[c.id] ?? 0,
        color: COMPARTMENT_BAR_COLOR,
        tooltipHeading: "Products",
        tooltipBody: productLabels.length > 0 ? productLabels.join(", ") : "—",
      }
    })
  }

  // Position dynamically (dropdown-style)
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 14, color: "#a3a3a3" }}>By Product</span>
        <BarChart bars={productBars} />
      </div>

      {/* By Compartments — only when single product */}
      {showCompartmentChart && compartmentBars.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#a3a3a3" }}>By Compartments</span>
          <BarChart bars={compartmentBars} />
        </div>
      )}
    </div>
  )
}
