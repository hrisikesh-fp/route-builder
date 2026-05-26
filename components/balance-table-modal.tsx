"use client"

import { useState } from "react"
import { X, TriangleAlert, Pencil } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"

// ─── Display labels ─────────────────────────────────────────────────────────
const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

const BADGE_COLOR: Record<string, string> = {
  L: "#189FFC",
  D: "#25B8A7",
  T: "#737373",
}

// Tokens from Figma node 4237:137608
const BG_MODAL = "#1B1B1B"
const BG_STRIP = "#282828"
const BORDER = "#282828"
const STROKE_3 = "#333333"
const TEXT_2 = "#E5E5E5"
const TEXT_3 = "#A3A3A3"
const TEXT_4 = "#737373"
const ACCENT_1 = "#818CF8"
const DESTRUCTIVE = "#F87171"
const TEXT_DARK = "#171717"

interface BalanceRow {
  orderId: string
  type: "L" | "D" | "T"
  name: string
  balances: Record<string, number>
}

function collectProducts(orders: ExtractionOrder[]): string[] {
  const sorted = [...orders].sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))
  const seen = new Set<string>()
  const products: string[] = []
  for (const o of sorted) {
    for (const pb of o.productBreakdown ?? []) {
      if (!seen.has(pb.product)) {
        seen.add(pb.product)
        products.push(pb.product)
      }
    }
  }
  return products
}

function computeDemand(
  orders: ExtractionOrder[],
  products: string[],
): Record<string, number> {
  const demand: Record<string, number> = {}
  for (const p of products) demand[p] = 0
  for (const o of orders) {
    if (o.orderType === "L") continue
    for (const pb of o.productBreakdown ?? []) {
      demand[pb.product] = (demand[pb.product] ?? 0) + pb.volume
    }
  }
  return demand
}


function buildBalanceTable(
  orders: ExtractionOrder[],
  products: string[],
  initialBalance: Record<string, number>,
): { rows: BalanceRow[]; finalBalance: Record<string, number> } {
  const sorted = [...orders].sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))
  const balance: Record<string, number> = {}
  for (const p of products) balance[p] = initialBalance[p] ?? 0

  const rows: BalanceRow[] = sorted.map((order) => {
    for (const pb of order.productBreakdown ?? []) {
      const sign = order.orderType === "L" ? 1 : -1
      balance[pb.product] = (balance[pb.product] ?? 0) + sign * pb.volume
    }
    return {
      orderId: order.id,
      type: (order.orderType ?? "D") as "L" | "D" | "T",
      name: order.customerName,
      balances: { ...balance },
    }
  })

  return { rows, finalBalance: { ...balance } }
}

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
        fontSize: 14,
        fontWeight: 500,
        color: TEXT_DARK,
        lineHeight: "20px",
      }}
    >
      {type}
    </span>
  )
}

// ─── Negative-balance warning with hover tooltip ───────────────────────────
// Tooltip uses position:fixed so it escapes the table wrapper's overflow:hidden
// (which would otherwise clip it when the icon is near the bottom of the table).

function NegativeBalanceWarning({ productLabel, isFirstFailing }: { productLabel: string; isFirstFailing: boolean }) {
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null)

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setTipPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
      }}
      onMouseLeave={() => setTipPos(null)}
    >
      <TriangleAlert size={16} color={DESTRUCTIVE} />
      {tipPos && (
        <div
          style={{
            position: "fixed",
            top: tipPos.y,
            left: tipPos.x,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 10002,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "6px solid #E5E5E5",
            }}
          />
          <div
            style={{
              backgroundColor: "#E5E5E5",
              color: "#111111",
              fontSize: 12,
              padding: "6px 12px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              fontFamily: "Geist, sans-serif",
              lineHeight: "16px",
            }}
          >
            {isFirstFailing
              ? `${productLabel} will run out at this stop`
              : `${productLabel} already ran out before this stop`}
          </div>
        </div>
      )}
    </span>
  )
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export interface BalanceTableModalProps {
  isOpen: boolean
  onClose: () => void
  orders: ExtractionOrder[]
  truckCapacity?: number
  initialInventory?: Record<string, number>
  onEditInitialInventory?: () => void
}

export function BalanceTableModal({
  isOpen,
  onClose,
  orders,
  truckCapacity,
  initialInventory,
  onEditInitialInventory,
}: BalanceTableModalProps) {
  if (!isOpen) return null

  const inventory = initialInventory ?? {}
  const products = collectProducts(orders)
  const demand = computeDemand(orders, products)
  const hasLoadOrder = orders.some((o) => o.orderType === "L")
  const startingBalance: Record<string, number> = {}
  for (const p of products) {
    startingBalance[p] = inventory[p] ?? 0
  }

  const { rows, finalBalance } = buildBalanceTable(orders, products, startingBalance)

  // Pre-compute "first failing row" per product column. Used by the negative-balance
  // tooltip so the copy differs between the stop where it first goes negative ("will
  // run out at this stop") and downstream stops where it's already out ("already ran
  // out before this stop"). Aligns with capacity-validation.ts's isFirstFailing flag.
  const firstFailingRowByProduct: Record<string, number> = {}
  for (const p of products) {
    for (let i = 0; i < rows.length; i++) {
      const bal = rows[i].balances[p] ?? 0
      if (bal < 0) {
        firstFailingRowByProduct[p] = i
        break
      }
    }
  }

  const MODAL_W = products.length <= 1 ? 800 : 1200

  const subHeadCell: React.CSSProperties = {
    height: 40,
    padding: "0 12px",
    backgroundColor: BG_STRIP,
    borderBottom: `1px solid ${BORDER}`,
    fontFamily: "Geist, sans-serif",
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "20px",
    color: TEXT_3,
    textAlign: "left",
    verticalAlign: "middle",
  }

  const bodyCellBase: React.CSSProperties = {
    padding: 12,
    fontFamily: "Geist, sans-serif",
    fontSize: 16,
    lineHeight: "24px",
    color: TEXT_2,
    borderBottom: `1px solid ${BORDER}`,
    verticalAlign: "middle",
  }

  const initialInvCell: React.CSSProperties = {
    ...bodyCellBase,
    borderBottom: `1px solid ${BORDER}`,
  }

  const retainCellBase: React.CSSProperties = {
    padding: 12,
    height: 48,
    fontFamily: "Geist, sans-serif",
    fontSize: 16,
    lineHeight: "24px",
    color: TEXT_2,
    borderTop: `1px solid ${BORDER}`,
    verticalAlign: "middle",
  }

  return (
    <div
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
        onClick={(e) => e.stopPropagation()}
        style={{
          width: MODAL_W,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          backgroundColor: BG_MODAL,
          borderRadius: 8,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0px 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: TEXT_2,
              margin: 0,
              lineHeight: "28px",
            }}
          >
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
              color: TEXT_3,
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* No-load banner — shown when route has no load order */}
        {!hasLoadOrder && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            backgroundColor: "#1f1f1f",
            border: "1px solid #282828",
            borderRadius: 4,
          }}>
            <TriangleAlert size={20} color="#818cf8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 400, color: "#818cf8", lineHeight: "20px" }}>
              No Load Order added yet. Add one to see product depletion stop by stop.
            </span>
          </div>
        )}

        {/* Table — header strip, starting-state rows, stop rows, Expected Retain.
            Wrapper div carries the 4px border-radius because <table> with border-collapse
            ignores border-radius on its own. */}
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            overflow: "hidden",
            width: "100%",
          }}
        >
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col />
            {products.map((p) => (
              <col key={p} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th style={subHeadCell}>Stops</th>
              {products.map((p) => (
                <th key={p} style={subHeadCell}>
                  {PRODUCT_LABEL[p] ?? p}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Initial inventory — always renders */}
            <tr>
              <td style={initialInvCell}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>Initial inventory</span>
                  <button
                    type="button"
                    aria-label="Edit initial inventory"
                    onClick={onEditInitialInventory}
                    disabled={!onEditInitialInventory}
                    style={{
                      width: 28,
                      height: 28,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: TEXT_3,
                      padding: 0,
                      borderRadius: 4,
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                </span>
              </td>
              {products.map((p) => (
                <td key={p} style={initialInvCell}>
                  {fmtBalance(inventory[p] ?? 0)}
                </td>
              ))}
            </tr>



            {/* Stop rows — numbered prefix, L/D badge, name, balance per product */}
            {rows.map((row, i) => (
              <tr key={row.orderId}>
                <td style={bodyCellBase}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 12,
                        textAlign: "center",
                        color: TEXT_3,
                        fontSize: 14,
                        lineHeight: "20px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <TypeBadge type={row.type} />
                    <span style={{ color: TEXT_2 }}>{row.name}</span>
                  </span>
                </td>
                {products.map((p) => {
                  const bal = row.balances[p] ?? 0
                  const balNeg = bal < 0
                  const isFirstFailing = balNeg && firstFailingRowByProduct[p] === i
                  return (
                    <td key={`${row.orderId}-${p}`} style={bodyCellBase}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: TEXT_2, fontWeight: balNeg ? 500 : 400 }}>
                          {fmtBalance(bal)}
                        </span>
                        {balNeg && (
                          <NegativeBalanceWarning
                            productLabel={PRODUCT_LABEL[p] ?? p}
                            isFirstFailing={isFirstFailing}
                          />
                        )}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Expected Retain */}
            <tr>
              <td
                style={{
                  ...retainCellBase,
                  fontSize: 14,
                  lineHeight: "20px",
                  fontWeight: 500,
                  color: TEXT_2,
                }}
              >
                Expected Retain
              </td>
              {products.map((p) => {
                const bal = finalBalance[p] ?? 0
                const balNeg = bal < 0
                return (
                  <td
                    key={`retain-${p}`}
                    style={{
                      ...retainCellBase,
                      color: balNeg ? DESTRUCTIVE : TEXT_2,
                      fontWeight: balNeg ? 500 : 400,
                    }}
                  >
                    {fmtBalance(bal)}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
