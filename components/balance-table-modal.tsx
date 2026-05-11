"use client"

import { Fragment } from "react"
import { X, TriangleAlert } from "lucide-react"
import type { ExtractionOrder, ProductBreakdown } from "@/lib/mock-data"

// ─── Display labels ─────────────────────────────────────────────────────────
const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

// L / D badge colors (match the existing route-card badges, M4)
const BADGE_COLOR: Record<string, string> = {
  L: "#189ffc",
  D: "#25b8a7",
  T: "#737373",
}

const RED_BG = "rgba(248, 113, 113, 0.18)"
const RED_FG = "#f87171"

interface BalanceRow {
  orderId: string
  type: "L" | "D" | "T"
  name: string
  // per-product delta at this stop (signed: +load, -delivery, 0 for no entry)
  deltas: Record<string, number>
  // per-product running balance AFTER this stop's transaction
  balances: Record<string, number>
}

function buildBalanceTable(
  orders: ExtractionOrder[],
  retainedFuel: ProductBreakdown[] | undefined,
): { products: string[]; rows: BalanceRow[]; finalBalance: Record<string, number> } {
  const sorted = [...orders].sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

  // distinct products on the route
  const productsSet = new Set<string>()
  for (const o of sorted) for (const pb of o.productBreakdown ?? []) productsSet.add(pb.product)
  // also include retained-fuel products
  for (const r of retainedFuel ?? []) productsSet.add(r.product)
  const products = Array.from(productsSet)

  // initialize balance from retained
  const balance: Record<string, number> = {}
  for (const p of products) balance[p] = 0
  for (const r of retainedFuel ?? []) balance[r.product] = r.volume

  const rows: BalanceRow[] = sorted.map((order) => {
    const deltas: Record<string, number> = {}
    for (const p of products) deltas[p] = 0
    for (const pb of order.productBreakdown ?? []) {
      const sign = order.orderType === "L" ? 1 : -1
      deltas[pb.product] = sign * pb.volume
      balance[pb.product] = (balance[pb.product] ?? 0) + sign * pb.volume
    }
    return {
      orderId: order.id,
      type: (order.orderType ?? "D") as "L" | "D" | "T",
      name: order.customerName,
      deltas,
      balances: { ...balance },
    }
  })

  return { products, rows, finalBalance: { ...balance } }
}

// Format a signed gallon delta — "+1,600 gal", "-300 gal", or "-" when 0
function fmtDelta(n: number): string {
  if (n === 0) return "-"
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toLocaleString()} gal`
}

// Format a balance — "1,600 gal", or "-100 gal" — same magnitude formatting either way
function fmtBalance(n: number): string {
  return `${n.toLocaleString()} gal`
}

// ─── Badge ──────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: "L" | "D" | "T" }) {
  return (
    <span
      style={{
        width: 20,
        height: 20,
        flexShrink: 0,
        backgroundColor: BADGE_COLOR[type] ?? "#737373",
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 500,
        color: "#171717",
        lineHeight: 1,
      }}
    >
      {type}
    </span>
  )
}

// ─── Cell helpers ───────────────────────────────────────────────────────────

function Cell({
  children,
  isNegative = false,
  withIcon = false,
  align = "left",
}: {
  children: React.ReactNode
  isNegative?: boolean
  withIcon?: boolean
  align?: "left" | "right"
}) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: align,
        verticalAlign: "middle",
        backgroundColor: isNegative ? RED_BG : undefined,
        color: isNegative ? RED_FG : "#e5e5e5",
        fontSize: 14,
        fontFamily: "Geist, sans-serif",
        borderBottom: "1px solid #282828",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {children}
        {isNegative && withIcon && <TriangleAlert size={14} color={RED_FG} />}
      </span>
    </td>
  )
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export interface BalanceTableModalProps {
  isOpen: boolean
  onClose: () => void
  orders: ExtractionOrder[]
  retainedFuel?: ProductBreakdown[]
  /** Optional route label shown in the header subtitle — TBD for design. */
  routeLabel?: string
}

export function BalanceTableModal({
  isOpen,
  onClose,
  orders,
  retainedFuel,
}: BalanceTableModalProps) {
  if (!isOpen) return null

  const { products, rows, finalBalance } = buildBalanceTable(orders, retainedFuel)

  return (
    <div
      // Backdrop
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Geist, sans-serif",
      }}
    >
      <div
        // Modal body — stop click propagation so backdrop click outside closes only
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#1f1f1f",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: "min(960px, calc(100vw - 48px))",
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          boxShadow: "0px 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: "#e5e5e5", margin: 0, lineHeight: "28px" }}>
            Route Summary
          </h3>
          <div style={{ flex: 1 }} />
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

        {/* Table */}
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "auto",
          }}
        >
          {/* Column-group header: product names spanning two sub-columns */}
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#737373",
                  borderBottom: "1px solid #282828",
                }}
              >
                {/* Empty cell above the Stops column */}
              </th>
              {products.map((p) => (
                <th
                  key={p}
                  colSpan={2}
                  style={{
                    textAlign: "left",
                    padding: "8px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#e5e5e5",
                    borderBottom: "1px solid #282828",
                  }}
                >
                  {PRODUCT_LABEL[p] ?? p}
                </th>
              ))}
            </tr>
            {/* Sub-header */}
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 400,
                  color: "#a3a3a3",
                  borderBottom: "1px solid #282828",
                }}
              >
                Stops
              </th>
              {products.map((p) => (
                <Fragment key={p}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 400,
                      color: "#a3a3a3",
                      borderBottom: "1px solid #282828",
                    }}
                  >
                    Planned Qty
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 16px",
                      fontSize: 12,
                      fontWeight: 400,
                      color: "#a3a3a3",
                      borderBottom: "1px solid #282828",
                    }}
                  >
                    Balance
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {rows.map((row) => (
              <tr key={row.orderId}>
                <td
                  style={{
                    padding: "12px 16px",
                    verticalAlign: "middle",
                    borderBottom: "1px solid #282828",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <TypeBadge type={row.type} />
                    <span style={{ color: "#e5e5e5", fontSize: 14 }}>{row.name}</span>
                  </span>
                </td>
                {products.map((p) => {
                  const delta = row.deltas[p] ?? 0
                  const bal = row.balances[p] ?? 0
                  const balNeg = bal < 0
                  return (
                    <Fragment key={`${row.orderId}-${p}`}>
                      <Cell>
                        <span style={{ color: "#a3a3a3" }}>{fmtDelta(delta)}</span>
                      </Cell>
                      <Cell isNegative={balNeg} withIcon={balNeg}>
                        {fmtBalance(bal)}
                      </Cell>
                    </Fragment>
                  )
                })}
              </tr>
            ))}

            {/* Retain row */}
            <tr>
              <td
                style={{
                  padding: "12px 16px",
                  verticalAlign: "middle",
                  color: "#a3a3a3",
                  fontSize: 14,
                  fontWeight: 500,
                  borderTop: "1px solid #333",
                  backgroundColor: "#1b1b1b",
                }}
              >
                Retain
              </td>
              {products.map((p) => {
                const bal = finalBalance[p] ?? 0
                const balNeg = bal < 0
                return (
                  <Fragment key={`retain-${p}`}>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#a3a3a3",
                        fontSize: 14,
                        borderTop: "1px solid #333",
                        backgroundColor: "#1b1b1b",
                      }}
                    >
                      -
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        fontWeight: 500,
                        borderTop: "1px solid #333",
                        backgroundColor: balNeg ? RED_BG : "#1b1b1b",
                        color: balNeg ? RED_FG : "#e5e5e5",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {fmtBalance(bal)}
                        {balNeg && <TriangleAlert size={14} color={RED_FG} />}
                      </span>
                    </td>
                  </Fragment>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
