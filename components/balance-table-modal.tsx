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

// L / D badge colors
const BADGE_COLOR: Record<string, string> = {
  L: "#189FFC",
  D: "#25B8A7",
  T: "#737373",
}

// Tokens from Figma node 4194:104586
const BG_MODAL = "#1B1B1B" // background-2
const BG_STRIP = "#282828" // background-4 / stroke-2
const BORDER = "#282828"
const TEXT_2 = "#E5E5E5" // text-2
const TEXT_3 = "#A3A3A3" // text-3
const DESTRUCTIVE = "#F87171" // base/destructive
const DESTRUCTIVE_BG = "rgba(248, 113, 113, 0.2)"
const TEXT_DARK = "#171717"

interface BalanceRow {
  orderId: string
  type: "L" | "D" | "T"
  name: string
  deltas: Record<string, number>
  balances: Record<string, number>
}

function buildBalanceTable(
  orders: ExtractionOrder[],
  retainedFuel: ProductBreakdown[] | undefined,
): { products: string[]; rows: BalanceRow[]; finalBalance: Record<string, number> } {
  const sorted = [...orders].sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

  const productsSet = new Set<string>()
  for (const o of sorted) for (const pb of o.productBreakdown ?? []) productsSet.add(pb.product)
  for (const r of retainedFuel ?? []) productsSet.add(r.product)
  const products = Array.from(productsSet)

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

function fmtDelta(n: number): string {
  if (n === 0) return "-"
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toLocaleString()} gal`
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

// ─── Main Modal ─────────────────────────────────────────────────────────────

export interface BalanceTableModalProps {
  isOpen: boolean
  onClose: () => void
  orders: ExtractionOrder[]
  retainedFuel?: ProductBreakdown[]
}

export function BalanceTableModal({
  isOpen,
  onClose,
  orders,
  retainedFuel,
}: BalanceTableModalProps) {
  if (!isOpen) return null

  const { products, rows, finalBalance } = buildBalanceTable(orders, retainedFuel)

  // Shared cell styles
  const headStripCell: React.CSSProperties = {
    height: 40,
    padding: "0 12px",
    backgroundColor: BG_STRIP,
    borderBottom: `1px solid ${BORDER}`,
    fontFamily: "Geist, sans-serif",
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "20px",
    textAlign: "left",
    verticalAlign: "middle",
  }

  const subHeadCell: React.CSSProperties = {
    ...headStripCell,
    color: TEXT_3,
  }

  const productHeadCell: React.CSSProperties = {
    ...headStripCell,
    color: TEXT_2,
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
          width: 1200,
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

        {/* Table */}
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "fixed",
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
          }}
        >
          <colgroup>
            <col style={{ width: 280 }} />
            {products.flatMap((p) => [
              <col key={`${p}-pq`} />,
              <col key={`${p}-bal`} />,
            ])}
          </colgroup>

          <thead>
            {/* Header strip 1 — product spanner */}
            <tr>
              <th style={{ ...headStripCell }} />
              {products.map((p) => (
                <th key={p} colSpan={2} style={productHeadCell}>
                  {PRODUCT_LABEL[p] ?? p}
                </th>
              ))}
            </tr>
            {/* Header strip 2 — sub-headers */}
            <tr>
              <th style={subHeadCell}>Stops</th>
              {products.map((p) => (
                <Fragment key={p}>
                  <th style={subHeadCell}>Planned Qty</th>
                  <th style={subHeadCell}>Balance</th>
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.orderId}>
                <td style={bodyCellBase}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <TypeBadge type={row.type} />
                    <span style={{ color: TEXT_2 }}>{row.name}</span>
                  </span>
                </td>
                {products.map((p) => {
                  const delta = row.deltas[p] ?? 0
                  const bal = row.balances[p] ?? 0
                  const balNeg = bal < 0
                  return (
                    <Fragment key={`${row.orderId}-${p}`}>
                      {/* Planned Qty cell */}
                      <td style={{ ...bodyCellBase, color: TEXT_3 }}>
                        {fmtDelta(delta)}
                      </td>
                      {/* Balance cell — different treatment when negative */}
                      <td
                        style={{
                          ...bodyCellBase,
                          backgroundColor: balNeg ? DESTRUCTIVE_BG : undefined,
                          fontWeight: balNeg ? 500 : 400,
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          {fmtBalance(bal)}
                          {balNeg && <TriangleAlert size={16} color={DESTRUCTIVE} />}
                        </span>
                      </td>
                    </Fragment>
                  )
                })}
              </tr>
            ))}

            {/* Retain row */}
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
                Retain
              </td>
              {products.map((p) => {
                const bal = finalBalance[p] ?? 0
                const balNeg = bal < 0
                return (
                  <Fragment key={`retain-${p}`}>
                    <td style={{ ...retainCellBase, color: TEXT_3 }}>-</td>
                    <td
                      style={{
                        ...retainCellBase,
                        color: balNeg ? DESTRUCTIVE : TEXT_2,
                        fontWeight: balNeg ? 500 : 400,
                      }}
                    >
                      {fmtBalance(bal)}
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
