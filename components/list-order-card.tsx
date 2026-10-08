"use client"

import { Droplet } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import { ORDER_TYPE_COLORS } from "@/lib/route-display"
import { CheckboxInput } from "@/components/lasso-workspace-sheet"

// Order card in the floating List panel — Figma RB - Routing v2, "Order Card" in node 9103:41099.
// Read-only: the list never edits an order. The checkbox is not in Figma yet (needed for "N selected").

interface ListOrderCardProps {
  order: ExtractionOrder
  checked: boolean
  onToggleCheck: () => void
  onHoverChange: (orderId: string | null) => void
  /** Briefly outlined after a map pin click scrolls the list to this card. */
  isFocused?: boolean
}

export function ListOrderCard({ order, checked, onToggleCheck, onHoverChange, isFocused }: ListOrderCardProps) {
  const type = order.orderType ?? "D"
  const title = order.shipToName ?? order.customerName
  // Figma shows the legal customer name under the ship-to; fall back to the address when there is no ship-to name.
  const subtitle = order.shipToName ? order.customerName : order.shipToAddress
  const productCount = order.productBreakdown?.length || 1

  return (
    <div
      data-list-order-id={order.id}
      className={isFocused ? "rb-stop-highlight" : undefined}
      role="button"
      aria-pressed={checked}
      onClick={onToggleCheck}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#282828"
        onHoverChange(order.id)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#1F1F1F"
        onHoverChange(null)
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "16px 16px 12px",
        backgroundColor: "#1F1F1F",
        borderRadius: 4,
        boxShadow: isFocused ? "inset 0 0 0 1px #E5E5E5" : "none",
        flexShrink: 0,
        overflow: "hidden",
        cursor: "pointer",
        fontFamily: "Geist, sans-serif",
        transition: "background-color 120ms ease",
      }}
    >
      {/* stopPropagation: the card's own click already toggles, avoid a double toggle */}
      <div style={{ paddingTop: 4 }} onClick={(e) => e.stopPropagation()}>
        <CheckboxInput checked={checked} onChange={onToggleCheck} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 20,
                height: 20,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                backgroundColor: ORDER_TYPE_COLORS[type],
                color: "#171717",
                fontSize: 14,
                fontWeight: 500,
                lineHeight: "20px",
              }}
            >
              {type}
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 16,
                fontWeight: 500,
                lineHeight: "24px",
                color: "#FFFFFF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </span>
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              lineHeight: "20px",
              color: "#A3A3A3",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 2, opacity: 0.6 }}>
            <Droplet size={16} color="#FAFAFA" />
            <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "#FAFAFA" }}>
              {productCount} Product{productCount === 1 ? "" : "s"}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#E5E5E5", whiteSpace: "nowrap" }}>
            {order.volume.toLocaleString()} gal
          </span>
        </div>
      </div>
    </div>
  )
}
