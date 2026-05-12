"use client"

import { useState } from "react"
import { X, Truck } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import type { TruckCapacityProfile, FuelProduct } from "@/lib/truck-data"

// ─── Display labels (mirrors breakdown-sheet.tsx) ───────────────────────────
const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

function compartmentsForProduct(p: string, truck: TruckCapacityProfile): string[] {
  return truck.compartments
    .filter((c) => (c.capacities[p as FuelProduct] ?? 0) > 0)
    .map((c) => c.id)
}

function fmtGal(n: number): string {
  return `${n.toLocaleString()} gal`
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40,
        padding: "4px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: active ? "#282828" : "transparent",
        border: "none",
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottom: active ? "1px solid #6366f1" : "1px solid transparent",
        marginBottom: -1, // overlap the parent border-bottom for crisp underline
        cursor: "pointer",
        color: active ? "#e5e5e5" : "#a3a3a3",
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        fontFamily: "Geist, sans-serif",
      }}
    >
      {label}
    </button>
  )
}

function ProductsTab({
  orders,
  truckProfile,
}: {
  orders: ExtractionOrder[]
  truckProfile: TruckCapacityProfile | null
}) {
  // Group delivery-order volumes by product
  const byProduct: Record<string, number> = {}
  for (const o of orders) {
    if (o.orderType !== "D") continue
    for (const pb of o.productBreakdown ?? []) {
      byProduct[pb.product] = (byProduct[pb.product] ?? 0) + pb.volume
    }
  }
  const rows = Object.entries(byProduct).map(([product, qty]) => ({
    product,
    qty,
    compartments: truckProfile ? compartmentsForProduct(product, truckProfile).join(", ") : "—",
  }))
  const totalQty = rows.reduce((s, r) => s + r.qty, 0)

  const cellPad = "12px"

  return (
    <div
      style={{
        border: "1px solid #282828",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 2fr",
          height: 40,
          backgroundColor: "#333",
          color: "#a3a3a3",
          fontSize: 14,
          fontWeight: 500,
          alignItems: "center",
        }}
      >
        <div style={{ padding: `0 ${cellPad}` }}>Product</div>
        <div style={{ padding: `0 ${cellPad}` }}>Planned Qty</div>
        <div style={{ padding: `0 ${cellPad}` }}>Compartments</div>
      </div>

      {/* Data rows */}
      {rows.length === 0 ? (
        <div style={{ padding: "24px 12px", color: "#737373", fontSize: 14, textAlign: "center" }}>
          No delivery orders on this route yet.
        </div>
      ) : (
        rows.map((r) => (
          <div
            key={r.product}
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 2fr",
              minHeight: 64,
              borderTop: "1px solid #282828",
              color: "#e5e5e5",
              fontSize: 14,
              alignItems: "center",
            }}
          >
            <div style={{ padding: cellPad }}>{PRODUCT_LABEL[r.product] ?? r.product}</div>
            <div style={{ padding: cellPad }}>{fmtGal(r.qty)}</div>
            <div style={{ padding: cellPad, color: "#a3a3a3" }}>{r.compartments}</div>
          </div>
        ))
      )}

      {/* Total row */}
      {rows.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 2fr",
            height: 40,
            borderTop: "1px solid #282828",
            backgroundColor: "#1b1b1b",
            color: "#e5e5e5",
            fontSize: 14,
            fontWeight: 500,
            alignItems: "center",
          }}
        >
          <div style={{ padding: `0 ${cellPad}` }}>Total</div>
          <div style={{ padding: `0 ${cellPad}` }}>{fmtGal(totalQty)}</div>
          <div style={{ padding: `0 ${cellPad}`, color: "#a3a3a3" }}>-</div>
        </div>
      )}
    </div>
  )
}

export function TruckSummaryContent({
  truckName,
  truckProfile,
}: {
  truckName: string | null
  truckProfile: TruckCapacityProfile | null
}) {
  if (!truckProfile || !truckName) {
    return (
      <div style={{ padding: "24px 12px", color: "#737373", fontSize: 14 }}>
        No truck selected for this route yet.
      </div>
    )
  }

  const totalCap = truckProfile.totalCapacity
  const compCount = truckProfile.compartments.length
  // Distinct products configured anywhere in the truck
  const distinctProducts = new Set<string>()
  for (const c of truckProfile.compartments) {
    for (const p of Object.keys(c.capacities)) distinctProducts.add(p)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Truck-info section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Truck size={16} color="#e5e5e5" />
          <span style={{ fontSize: 14, color: "#e5e5e5", fontFamily: "Geist, sans-serif" }}>
            {truckName}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "#a3a3a3",
            paddingLeft: 24,
          }}
        >
          <span>{totalCap.toLocaleString()} gal</span>
          <span style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#4A4A4A" }} />
          <span>{compCount} Compartments</span>
          <span style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#4A4A4A" }} />
          <span>{distinctProducts.size} Products</span>
        </div>
      </div>

      {/* Compartment breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 16, fontWeight: 300, color: "#a3a3a3", fontFamily: "Geist, sans-serif" }}>
          Compartment breakdown
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          {truckProfile.compartments.map((c) => {
            // Max capacity = the largest capacity across products in this compartment
            const caps = Object.values(c.capacities).filter((v): v is number => typeof v === "number")
            const maxCap = caps.length > 0 ? Math.max(...caps) : 0
            const products = Object.keys(c.capacities)
              .filter((p) => (c.capacities[p as FuelProduct] ?? 0) > 0)
              .map((p) => PRODUCT_LABEL[p] ?? p)
              .join(", ")
            return (
              <div
                key={c.id}
                style={{
                  flex: "1 1 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* Card */}
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "#1b1b1b",
                    border: "1px solid #333",
                    borderRadius: 4,
                    padding: "8px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", lineHeight: 1.2 }}>
                    {c.id}
                  </span>
                  <span style={{ fontSize: 12, color: "#a3a3a3", lineHeight: 1.2 }}>
                    {maxCap.toLocaleString()} gal max.
                  </span>
                </div>
                {/* Caption */}
                <span
                  style={{
                    fontSize: 12,
                    color: "#737373",
                    lineHeight: 1.2,
                    textAlign: "center",
                  }}
                >
                  {products || "—"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Sheet ──────────────────────────────────────────────────────────────

export interface RouteSummarySheetProps {
  isOpen: boolean
  onClose: () => void
  orders: ExtractionOrder[]
  truckProfile: TruckCapacityProfile | null
  truckName: string | null
  anchorLeft: number
  anchorRight: number
  anchorY: number
}

export function RouteSummarySheet({
  isOpen,
  onClose,
  orders,
  truckProfile,
  truckName,
  anchorLeft,
  anchorRight,
  anchorY,
}: RouteSummarySheetProps) {
  const [activeTab, setActiveTab] = useState<"products" | "truck">("products")

  if (!isOpen) return null

  const orderCount = orders.length

  // Distinct products on the route's delivery orders (drives "Products (N)" label)
  const distinctProducts = new Set<string>()
  for (const o of orders) {
    if (o.orderType !== "D") continue
    for (const pb of o.productBreakdown ?? []) distinctProducts.add(pb.product)
  }
  const productCount = distinctProducts.size

  // Dropdown-style anchoring (mirrors breakdown-sheet)
  const SHEET_W = 640
  const SHEET_H_ESTIMATE = 400
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
        fontFamily: "Geist, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: "#e5e5e5", margin: 0, lineHeight: "28px" }}>
          Product &amp; Truck Summary
        </h3>
        {/* Orders badge */}
        <span
          style={{
            backgroundColor: "#111",
            color: "#fafafa",
            fontSize: 14,
            fontWeight: 500,
            padding: "2px 8px",
            borderRadius: 4,
            lineHeight: "20px",
          }}
        >
          {orderCount} Orders
        </span>
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

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #333",
          gap: 0,
        }}
      >
        <TabButton
          label={`Products (${productCount})`}
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
        />
        <TabButton
          label="Truck & Compartments"
          active={activeTab === "truck"}
          onClick={() => setActiveTab("truck")}
        />
      </div>

      {/* Tab content */}
      {activeTab === "products" ? (
        <ProductsTab orders={orders} truckProfile={truckProfile} />
      ) : (
        <TruckSummaryContent truckName={truckName} truckProfile={truckProfile} />
      )}
    </div>
  )
}
