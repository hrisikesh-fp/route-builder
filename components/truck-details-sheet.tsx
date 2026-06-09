"use client"

import { X, Maximize2, Minimize2, Truck, Caravan } from "lucide-react"
import { useState } from "react"
import type { TruckCapacityProfile, FuelProduct } from "@/lib/truck-data"

// ─── Product → { label, color } map ─────────────────────────────────────────
const PRODUCT_INFO: Record<string, { label: string; color: string }> = {
  "200*DIESEL-OFFROAD RED": { label: "Diesel-Offroad RED", color: "#E91E63" },
  "200*DIESEL-ONROAD CLEAR": { label: "Diesel", color: "#E91E63" },
  "87 OCT W/ 10% ETH": { label: "Gas", color: "#10B981" },
  "ULSD CLEAR DIESEL": { label: "ULSD", color: "#3B82F6" },
  "DEF PACKAGED": { label: "DEF", color: "#8B5CF6" },
}

// Default products for synthesized trailers (no profile data yet for trailers)
const DEFAULT_TRAILER_PRODUCTS = [
  { label: "Diesel", color: "#E91E63" },
  { label: "Gas", color: "#10B981" },
  { label: "Bio", color: "#FBBF24" },
]

// ─── Vehicle info — normalized shape for rendering ──────────────────────────
export interface VehicleInfo {
  kind: "truck" | "trailer"
  name: string
  totalCapacity: number
  compartments: {
    id: string
    capacity: number
    products: { label: string; color: string }[]
  }[]
  productSummary: { label: string; color: string }[]
}

// Helper: build VehicleInfo for a truck from its TruckCapacityProfile
export function truckProfileToVehicleInfo(profile: TruckCapacityProfile, name: string): VehicleInfo {
  const compartments = profile.compartments.map((c) => {
    const productsInCompartment = (Object.keys(c.capacities) as FuelProduct[])
      .filter((p) => (c.capacities[p] ?? 0) > 0)
      .map((p) => PRODUCT_INFO[p] ?? { label: p, color: "#737373" })
    const caps = Object.values(c.capacities).filter((v): v is number => typeof v === "number")
    const maxCap = caps.length > 0 ? Math.max(...caps) : 0
    return { id: c.id, capacity: maxCap, products: productsInCompartment }
  })
  const seen = new Set<string>()
  const productSummary: { label: string; color: string }[] = []
  compartments.forEach((c) => c.products.forEach((p) => {
    if (!seen.has(p.label)) {
      seen.add(p.label)
      productSummary.push(p)
    }
  }))
  return { kind: "truck", name, totalCapacity: profile.totalCapacity, compartments, productSummary }
}

// Helper: synthesize VehicleInfo for trailer from capacity + compartment count strings
// (trailers don't have full profiles in the mock data yet)
export function synthesizeTrailerVehicleInfo(name: string, capacityStr: string, compartmentsStr: string): VehicleInfo | null {
  const capMatch = capacityStr.match(/([\d,]+)/)
  const totalCapacity = capMatch ? parseInt(capMatch[1].replace(/,/g, ""), 10) : 0
  const compMatch = compartmentsStr.match(/(\d+)/)
  const compartmentCount = compMatch ? parseInt(compMatch[1], 10) : 0
  if (totalCapacity === 0 || compartmentCount === 0) return null
  // Equal split rounded to nearest 100; remainder lands in the last compartment
  const baseCap = Math.floor(totalCapacity / compartmentCount / 100) * 100
  const remainder = totalCapacity - baseCap * (compartmentCount - 1)
  const compartments = Array.from({ length: compartmentCount }, (_, i) => ({
    id: `C${i + 1}`,
    capacity: i === compartmentCount - 1 ? remainder : baseCap,
    products: DEFAULT_TRAILER_PRODUCTS,
  }))
  return { kind: "trailer", name, totalCapacity, compartments, productSummary: DEFAULT_TRAILER_PRODUCTS }
}

// ─── Component ──────────────────────────────────────────────────────────────
export interface TruckDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
  vehicles: VehicleInfo[]
  anchorLeft: number
  anchorRight: number
  anchorY: number
}

export function TruckDetailsSheet({
  isOpen,
  onClose,
  vehicles,
  anchorLeft,
  anchorRight,
  anchorY,
}: TruckDetailsSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isOpen) return null

  const SHEET_W = 560
  const SHEET_H_ESTIMATE = 280 + Math.max(0, vehicles.length - 1) * 200
  const VIEWPORT_GUTTER = 16
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1440
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800

  const wantLeft = anchorLeft - SHEET_W - 4
  const fitsLeft = wantLeft >= VIEWPORT_GUTTER
  const sheetLeft = fitsLeft
    ? wantLeft
    : Math.min(anchorRight + 4, viewportW - SHEET_W - VIEWPORT_GUTTER)
  const maxTop = viewportH - SHEET_H_ESTIMATE - VIEWPORT_GUTTER
  const sheetTop = Math.max(VIEWPORT_GUTTER, Math.min(anchorY, maxTop))

  const totalCapacity = vehicles.reduce((sum, v) => sum + v.totalCapacity, 0)
  const showTotal = vehicles.length >= 2

  const containerStyle: React.CSSProperties = isExpanded
    ? {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 720,
        maxHeight: "calc(100vh - 96px)",
        overflowY: "auto",
        zIndex: 10001,
      }
    : {
        position: "fixed",
        top: sheetTop,
        left: sheetLeft,
        width: SHEET_W,
        zIndex: 10000,
      }

  return (
    <>
      {isExpanded && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 10000,
          }}
        />
      )}
      <div
        data-truck-details-sheet
        style={{
          ...containerStyle,
          backgroundColor: "#1f1f1f",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.5)",
          fontFamily: "Geist, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1, fontSize: 18, fontWeight: 500, color: "#e5e5e5", lineHeight: "28px" }}>
            Truck Details
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            className="rb-icon-btn"
            style={{
              width: 28,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 4,
              color: "#a3a3a3",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rb-icon-btn"
            style={{
              width: 28,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 4,
              color: "#a3a3a3",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div style={{ padding: "24px 0", color: "#737373", fontSize: 14 }}>
            No truck selected for this route yet.
          </div>
        ) : (
          <>
            {vehicles.map((v, i) => (
              <VehiclePanel key={`${v.kind}-${i}-${v.name}`} vehicle={v} />
            ))}
            {showTotal && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ height: 1, backgroundColor: "#282828", width: "100%" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px" }}>
                    Total Capacity
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", lineHeight: "20px" }}>
                    {totalCapacity.toLocaleString()} gal max.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── VehiclePanel — single truck or trailer ─────────────────────────────────
function VehiclePanel({ vehicle }: { vehicle: VehicleInfo }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vehicle.kind === "truck" ? 12 : 8 }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {vehicle.kind === "truck" ? (
            <Truck size={16} color="#e5e5e5" />
          ) : (
            <Caravan size={16} color="#e5e5e5" />
          )}
          <span style={{ fontSize: 14, fontWeight: 400, color: "#e5e5e5", lineHeight: "20px" }}>
            {vehicle.name}
          </span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", lineHeight: "20px" }}>
          {vehicle.totalCapacity.toLocaleString()} gal max.
        </span>
      </div>

      {/* Connector + Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          {vehicle.kind === "truck" ? <CabConnector /> : <HookConnector />}
          <CompartmentGrid compartments={vehicle.compartments} />
        </div>
        {/* Footer */}
        <VehicleFooter
          compartmentCount={vehicle.compartments.length}
          products={vehicle.productSummary}
        />
      </div>
    </div>
  )
}

// ─── Connectors ─────────────────────────────────────────────────────────────
function CabConnector() {
  return (
    <div
      style={{
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        padding: "12px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          width: 48,
          backgroundColor: "#282828",
          border: "1px solid #333",
          borderRight: "none",
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            transform: "rotate(-90deg)",
            color: "#e5e5e5",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "16px",
            whiteSpace: "nowrap",
            letterSpacing: "0.5px",
          }}
        >
          CAB
        </span>
      </div>
    </div>
  )
}

function HookConnector() {
  return (
    <div
      style={{
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* Small hook icon (link shape) */}
      <svg width="26" height="8" viewBox="0 0 26 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="3" stroke="#737373" strokeWidth="1" fill="none" />
        <line x1="7" y1="4" x2="26" y2="4" stroke="#737373" strokeWidth="1" />
      </svg>
      <div
        style={{
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          padding: "12px 0",
        }}
      >
        <div
          style={{
            flex: 1,
            width: 12,
            backgroundColor: "#282828",
            border: "1px solid #333",
            borderRight: "none",
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        />
      </div>
    </div>
  )
}

// ─── Compartment grid ───────────────────────────────────────────────────────
function CompartmentGrid({
  compartments,
}: {
  compartments: VehicleInfo["compartments"]
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        backgroundColor: "#1f1f1f",
        border: "1px solid #333",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      {compartments.map((c, i) => (
        <div
          key={c.id}
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            borderLeft: i === 0 ? "none" : "1px solid #333",
          }}
        >
          {/* Header — Cn label */}
          <div
            style={{
              padding: "4px 8px",
              borderBottom: "1px solid #333",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: "#a3a3a3", lineHeight: "16px" }}>
              {c.id}
            </span>
          </div>
          {/* Value + gal max. + product dots */}
          <div
            style={{
              padding: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", lineHeight: "20px" }}>
                {c.capacity.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, fontWeight: 400, color: "#737373", lineHeight: "16px" }}>
                gal max.
              </span>
            </div>
            {/* Product dots — small 4px circles */}
            {c.products.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                {c.products.map((p, j) => (
                  <span
                    key={`${p.label}-${j}`}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      backgroundColor: p.color,
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Vehicle footer — "N Compartments • Products [dot] X [dot] Y" ───────────
function VehicleFooter({
  compartmentCount,
  products,
}: {
  compartmentCount: number
  products: { label: string; color: string }[]
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 400, color: "#737373", lineHeight: "16px" }}>
        {compartmentCount} Compartments
      </span>
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          backgroundColor: "#737373",
          display: "inline-block",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 400, color: "#737373", lineHeight: "16px" }}>
          Products
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {products.map((p, i) => (
            <div key={`${p.label}-${i}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: p.color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 400, color: "#a3a3a3", lineHeight: "16px" }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
