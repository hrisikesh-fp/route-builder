"use client"

import { useEffect, useState } from "react"
import { X, Truck as TruckIcon, ChevronDown } from "lucide-react"
import type { FuelProduct, TruckCapacityProfile } from "@/lib/truck-data"

// ─── Display labels ─────────────────────────────────────────────────────────
const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

// Tokens from Figma node 4237:137432
const BG_MODAL = "#1B1B1B"
const BG_INFO_CARD = "#282828"
const STROKE_3 = "#333333"
const BORDER_INPUT_SEP = "#282828"
const TEXT_1 = "#FFFFFF"
const TEXT_2 = "#E5E5E5"
const TEXT_3 = "#A3A3A3"
const TEXT_4 = "#737373"
const PRIMARY_BG = "#E5E5E5"
const PRIMARY_FG = "#171717"

export interface CompartmentInputValue {
  product?: FuelProduct
  qty: number
}

export interface InitialInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  truckName: string
  truckProfile: TruckCapacityProfile
  routeDemandProducts: FuelProduct[]
  initialValues?: Record<string, CompartmentInputValue>
  onSave: (compartmentValues: Record<string, CompartmentInputValue>) => void
}

export function InitialInventoryModal({
  isOpen,
  onClose,
  truckName,
  truckProfile,
  routeDemandProducts,
  initialValues,
  onSave,
}: InitialInventoryModalProps) {
  const [values, setValues] = useState<Record<string, CompartmentInputValue>>(
    () => initialValues ?? {},
  )

  // Reset internal state whenever the modal opens (or the route's saved values change)
  useEffect(() => {
    if (isOpen) setValues(initialValues ?? {})
  }, [isOpen, initialValues])

  if (!isOpen) return null

  const productsOnTruck: FuelProduct[] = (Object.keys(truckProfile.productCapacities) as FuelProduct[])
  const compartmentCount = truckProfile.compartments.length

  // Header summary: "N Products: A, B, C"
  const truckProductsText = productsOnTruck.map((p) => PRODUCT_LABEL[p] ?? p).join(", ")

  // The set of products allowed in this modal context: route demand ∩ truck's products.
  const allowedProducts: FuelProduct[] = routeDemandProducts.filter((p) => productsOnTruck.includes(p))

  // For each compartment: products you can pick = allowedProducts ∩ compartment.capacities.
  const productsForCompartment = (compId: string): FuelProduct[] => {
    const comp = truckProfile.compartments.find((c) => c.id === compId)
    if (!comp) return []
    return allowedProducts.filter((p) => comp.capacities[p] != null)
  }

  // Update enables when at least one compartment has both product and qty > 0.
  const canUpdate = Object.values(values).some((v) => v.product != null && v.qty > 0)

  function setCompartmentProduct(compId: string, product: FuelProduct | undefined) {
    setValues((prev) => ({
      ...prev,
      [compId]: { ...(prev[compId] ?? { qty: 0 }), product },
    }))
  }

  function setCompartmentQty(compId: string, qty: number) {
    setValues((prev) => ({
      ...prev,
      [compId]: { ...(prev[compId] ?? {}), qty: Number.isFinite(qty) ? qty : 0 },
    }))
  }

  function handleUpdate() {
    onSave(values)
    onClose()
  }

  // Dot separator (4px circle) used in info card meta + comp labels
  const Dot = () => (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: 999,
        backgroundColor: TEXT_4,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
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
          width: 720,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: 560,
          backgroundColor: BG_MODAL,
          borderRadius: 8,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflow: "hidden",
          boxShadow: "0px 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3
            style={{
              flex: 1,
              fontSize: 18,
              fontWeight: 500,
              color: TEXT_2,
              margin: 0,
              lineHeight: "28px",
            }}
          >
            Initial Inventory
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
              color: TEXT_3,
              padding: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Truck info card */}
        <div
          style={{
            backgroundColor: BG_INFO_CARD,
            borderRadius: 4,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TruckIcon size={16} color={TEXT_1} />
            <span style={{ color: TEXT_1, fontSize: 16, fontWeight: 500, lineHeight: "24px" }}>
              {truckName}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              fontSize: 14,
              lineHeight: "20px",
            }}
          >
            <span style={{ color: TEXT_3 }}>
              {truckProfile.totalCapacity.toLocaleString()} gal
            </span>
            <Dot />
            <span style={{ color: TEXT_3 }}>{compartmentCount} Compartments</span>
            <Dot />
            <span>
              <span style={{ color: TEXT_4 }}>{productsOnTruck.length} Products: </span>
              <span style={{ color: TEXT_3 }}>{truckProductsText}</span>
            </span>
          </div>
        </div>

        {/* Compartment fields — flex:1 + overflow-y so this is the only scrolling region */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {truckProfile.compartments.map((comp) => {
            const v = values[comp.id] ?? { qty: 0 }
            const compProducts = productsForCompartment(comp.id)
            const noProductsAvailable = compProducts.length === 0

            return (
              <div
                key={comp.id}
                style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}
              >
                {/* Comp label row: "C1 • TW Comp 1" */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      color: TEXT_2,
                      fontSize: 16,
                      fontWeight: 500,
                      lineHeight: "24px",
                    }}
                  >
                    {comp.id}
                  </span>
                  {comp.displayName && (
                    <>
                      <Dot />
                      <span style={{ color: TEXT_3, fontSize: 16, lineHeight: "24px" }}>
                        {comp.displayName}
                      </span>
                    </>
                  )}
                </div>

                {/* Two fields side-by-side */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {/* Product select */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <label
                      style={{
                        color: TEXT_3,
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: 400,
                      }}
                    >
                      Product
                    </label>
                    <div
                      style={{
                        position: "relative",
                        border: `1px solid ${STROKE_3}`,
                        borderRadius: 4,
                        backgroundColor: "transparent",
                        boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
                        opacity: noProductsAvailable ? 0.5 : 1,
                      }}
                    >
                      <select
                        value={v.product ?? ""}
                        disabled={noProductsAvailable}
                        onChange={(e) => {
                          const next = e.target.value
                          setCompartmentProduct(comp.id, next === "" ? undefined : (next as FuelProduct))
                        }}
                        style={{
                          width: "100%",
                          appearance: "none",
                          WebkitAppearance: "none",
                          background: "transparent",
                          border: "none",
                          color: v.product ? TEXT_2 : TEXT_3,
                          fontSize: 16,
                          fontFamily: "inherit",
                          lineHeight: "24px",
                          padding: "8px 36px 8px 12px",
                          cursor: noProductsAvailable ? "not-allowed" : "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="" style={{ color: TEXT_3, background: BG_MODAL }}>
                          {noProductsAvailable ? "No compatible products" : "Select Product"}
                        </option>
                        {compProducts.map((p) => (
                          <option key={p} value={p} style={{ background: BG_MODAL, color: TEXT_2 }}>
                            {PRODUCT_LABEL[p] ?? p}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        color={TEXT_3}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Initial Inventory input */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <label
                      style={{
                        color: TEXT_3,
                        fontSize: 14,
                        lineHeight: "20px",
                        fontWeight: 400,
                      }}
                    >
                      Initial Inventory
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "stretch",
                        border: `1px solid ${STROKE_3}`,
                        borderRadius: 4,
                        backgroundColor: "transparent",
                        boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
                      }}
                    >
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="0"
                        value={v.qty === 0 ? "" : v.qty}
                        onChange={(e) => {
                          const raw = e.target.value
                          const n = raw === "" ? 0 : parseInt(raw, 10)
                          setCompartmentQty(comp.id, Number.isNaN(n) ? 0 : n)
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          background: "transparent",
                          border: "none",
                          color: TEXT_2,
                          fontSize: 16,
                          fontFamily: "inherit",
                          lineHeight: "24px",
                          padding: "8px 12px",
                          outline: "none",
                        }}
                      />
                      <div
                        style={{
                          borderLeft: `1px solid ${BORDER_INPUT_SEP}`,
                          display: "flex",
                          alignItems: "center",
                          padding: "0 8px",
                          height: 24,
                          alignSelf: "center",
                          marginRight: 4,
                        }}
                      >
                        <span
                          style={{
                            color: TEXT_3,
                            fontSize: 14,
                            lineHeight: "20px",
                          }}
                        >
                          gal
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 36,
              padding: "8px 16px",
              border: `1px solid ${STROKE_3}`,
              borderRadius: 4,
              background: "transparent",
              color: "#FAFAFA",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "inherit",
              lineHeight: "20px",
              cursor: "pointer",
              boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canUpdate}
            onClick={handleUpdate}
            style={{
              height: 36,
              padding: "8px 16px",
              border: "none",
              borderRadius: 4,
              background: PRIMARY_BG,
              color: PRIMARY_FG,
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "inherit",
              lineHeight: "20px",
              cursor: canUpdate ? "pointer" : "not-allowed",
              opacity: canUpdate ? 1 : 0.5,
            }}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper for callers: aggregate per-compartment values into per-product totals.
export function aggregateCompartmentValues(
  values: Record<string, CompartmentInputValue>,
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const v of Object.values(values)) {
    if (v.product && v.qty > 0) {
      totals[v.product] = (totals[v.product] ?? 0) + v.qty
    }
  }
  return totals
}
