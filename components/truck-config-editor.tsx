"use client"

import { useState } from "react"
import { Truck as TruckIcon, X, Plus, Check, AlertCircle } from "lucide-react"
import {
  type TruckConfig,
  type TruckCategory,
  PRODUCT_OPTIONS,
  computeReadiness,
  totalCapacity,
  distinctProducts,
} from "@/lib/truck-config-data"

const CATEGORIES: TruckCategory[] = ["Tank Wagon", "Truck", "Tractor", "Trailer"]

export function TruckConfigEditor({ initial }: { initial: TruckConfig }) {
  const [truck, setTruck] = useState<TruckConfig>(initial)
  const [saved, setSaved] = useState(false)

  const readiness = computeReadiness(truck)
  const isRoutingReady = readiness.every((r) => r.pass)
  const total = totalCapacity(truck)
  const products = distinctProducts(truck)

  function updateCompartment(id: string, patch: Partial<TruckConfig["compartments"][number]>) {
    setTruck((t) => ({
      ...t,
      compartments: t.compartments.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
    setSaved(false)
  }

  function toggleProduct(compartmentId: string, product: string) {
    const comp = truck.compartments.find((c) => c.id === compartmentId)
    if (!comp) return
    const has = comp.products.includes(product)
    updateCompartment(compartmentId, {
      products: has ? comp.products.filter((p) => p !== product) : [...comp.products, product],
    })
  }

  function removeCompartment(id: string) {
    setTruck((t) => ({ ...t, compartments: t.compartments.filter((c) => c.id !== id) }))
    setSaved(false)
  }

  function addCompartment() {
    const nextIndex = truck.compartments.length + 1
    setTruck((t) => ({
      ...t,
      compartments: [...t.compartments, { id: `C${nextIndex}`, capacity: null, products: [] }],
    }))
    setSaved(false)
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 24px 120px",
        fontFamily: "Geist, sans-serif",
        color: "#E5E5E5",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#737373", marginBottom: 4 }}>Truck Config</div>
        <div style={{ fontSize: 20, fontWeight: 500, color: "#FAFAFA" }}>Truck Details</div>
        <div style={{ fontSize: 14, color: "#A3A3A3", marginTop: 4 }}>
          Configure compartment capacity and products so this truck is routing-ready. Separate from the
          in-route Truck Details view, this is where the data actually gets set.
        </div>
      </div>

      {/* Header card */}
      <div
        style={{
          backgroundColor: "#1F1F1F",
          border: "1px solid #282828",
          borderRadius: 8,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              backgroundColor: "#282828",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TruckIcon size={18} color="#FAFAFA" />
          </div>
          <input
            value={truck.name}
            onChange={(e) => {
              setTruck((t) => ({ ...t, name: e.target.value }))
              setSaved(false)
            }}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#FAFAFA",
              fontSize: 16,
              fontWeight: 500,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#737373", marginBottom: 6 }}>Category</div>
            <select
              value={truck.category}
              onChange={(e) => {
                setTruck((t) => ({ ...t, category: e.target.value as TruckCategory }))
                setSaved(false)
              }}
              style={{
                width: "100%",
                backgroundColor: "#1b1b1b",
                border: "1px solid #333",
                borderRadius: 4,
                color: "#E5E5E5",
                fontSize: 14,
                padding: "8px 10px",
                outline: "none",
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#737373", marginBottom: 6 }}>Use in delivery</div>
            <button
              type="button"
              onClick={() => {
                setTruck((t) => ({ ...t, useInDelivery: !t.useInDelivery }))
                setSaved(false)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                backgroundColor: "#1b1b1b",
                border: "1px solid #333",
                borderRadius: 4,
                padding: "8px 10px",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 999,
                  backgroundColor: truck.useInDelivery ? "#4D55F8" : "#404040",
                  position: "relative",
                  transition: "background-color 0.15s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: truck.useInDelivery ? 16 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: "#FAFAFA",
                    transition: "left 0.15s",
                  }}
                />
              </span>
              <span style={{ fontSize: 14, color: "#E5E5E5" }}>{truck.useInDelivery ? "Yes" : "No"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Routing readiness checklist */}
      <div
        style={{
          backgroundColor: isRoutingReady ? "rgba(16,185,129,0.08)" : "rgba(234,179,8,0.09)",
          border: `1px solid ${isRoutingReady ? "rgba(16,185,129,0.3)" : "rgba(234,179,8,0.3)"}`,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          {isRoutingReady ? (
            <Check size={16} color="#10B981" />
          ) : (
            <AlertCircle size={16} color="#EAB308" />
          )}
          <span style={{ fontSize: 14, fontWeight: 500, color: isRoutingReady ? "#10B981" : "#EAB308" }}>
            {isRoutingReady ? "Routing-ready" : "Not routing-ready yet"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {readiness.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: r.pass ? "rgba(16,185,129,0.15)" : "rgba(115,115,115,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {r.pass && <Check size={9} color="#10B981" />}
              </span>
              <span style={{ fontSize: 13, color: r.pass ? "#A3A3A3" : "#737373" }}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Compartments */}
      <div
        style={{
          backgroundColor: "#1F1F1F",
          border: "1px solid #282828",
          borderRadius: 8,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", marginBottom: 4 }}>Compartments</div>
        <div style={{ fontSize: 12, color: "#737373", marginBottom: 16 }}>
          Each compartment has one physical capacity, shared across every product assigned to it, not a
          separate number per product.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {truck.compartments.map((c) => {
            const isEmpty = c.capacity === null && c.products.length === 0
            return (
              <div
                key={c.id}
                style={{
                  border: `1px solid ${isEmpty ? "rgba(234,179,8,0.4)" : "#333"}`,
                  borderRadius: 6,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  backgroundColor: isEmpty ? "rgba(234,179,8,0.04)" : "#1b1b1b",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#A3A3A3",
                      width: 24,
                      flexShrink: 0,
                    }}
                  >
                    {c.id}
                  </span>
                  <input
                    type="number"
                    placeholder="Capacity"
                    value={c.capacity ?? ""}
                    onChange={(e) =>
                      updateCompartment(c.id, {
                        capacity: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    style={{
                      width: 110,
                      backgroundColor: "#141414",
                      border: "1px solid #333",
                      borderRadius: 4,
                      color: "#E5E5E5",
                      fontSize: 13,
                      padding: "6px 8px",
                      outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "#737373" }}>gal</span>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => removeCompartment(c.id)}
                    aria-label={`Remove ${c.id}`}
                    style={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      border: "none",
                      borderRadius: 4,
                      color: "#737373",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PRODUCT_OPTIONS.map((p) => {
                    const active = c.products.includes(p)
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toggleProduct(c.id, p)}
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 999,
                          border: `1px solid ${active ? "#4D55F8" : "#333"}`,
                          backgroundColor: active ? "rgba(77,85,248,0.15)" : "transparent",
                          color: active ? "#818CF8" : "#737373",
                          cursor: "pointer",
                        }}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>

                {isEmpty && (
                  <div style={{ fontSize: 12, color: "#EAB308", display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertCircle size={12} />
                    Empty compartment — no capacity or product set. The optimizer will treat this as 0 gal.
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addCompartment}
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#A3A3A3",
            background: "transparent",
            border: "1px dashed #404040",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Plus size={14} />
          Add Compartment
        </button>
      </div>

      {/* Sticky summary + save footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#1B1B1B",
          borderTop: "1px solid #282828",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: 720, width: "100%", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#A3A3A3" }}>
            <span style={{ color: "#FAFAFA", fontWeight: 500 }}>{total.toLocaleString()} gal</span>
            <span style={{ color: "#737373" }}>total</span>
            <span style={{ color: "#404040" }}>·</span>
            <span>{truck.compartments.length} Compartments</span>
            <span style={{ color: "#404040" }}>·</span>
            <span>{products.length} Products</span>
          </div>
          <div style={{ flex: 1 }} />
          {saved && <span style={{ fontSize: 13, color: "#10B981" }}>Saved</span>}
          <button
            type="button"
            onClick={() => setSaved(true)}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#FAFAFA",
              backgroundColor: "#4D55F8",
              border: "none",
              borderRadius: 6,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Save Truck Config
          </button>
        </div>
      </div>
    </div>
  )
}
