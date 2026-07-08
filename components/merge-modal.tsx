"use client"

import { useState } from "react"
import { X, Truck } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import type { OptimizationResult } from "@/lib/optimization-types"
import { FLEET_TRUCK_GROUPS, getFleetHubCount, getFleetTruckCount } from "@/lib/optimization-fleet-data"
import { buildMockOptimizationResult } from "@/lib/mock-optimization-result"
import { useSettings } from "@/contexts/settings-context"

const MOCK_TIMES = [
  "12:32 PM", "1:15 PM", "2:45 PM", "3:30 PM", "3:30 PM",
  "4:00 PM", "4:15 PM", "8:30 AM", "9:00 AM", "9:45 AM",
  "10:15 AM", "10:45 AM", "11:00 AM", "11:30 AM", "12:00 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM",
]

const SpecsDot = () => <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#4A4A4A", flexShrink: 0, margin: "0 6px" }} />

interface MergeModalProps {
  isOpen: boolean
  onClose: () => void
  checkedRouteIds: string[]
  checkedUnassignedOrderIds?: string[]
  selectedOrders: ExtractionOrder[]
  modalMode?: "create" | "optimise"
  onComplete?: (result: OptimizationResult) => void
}

function OrdersTable({ orderRows }: { orderRows: ExtractionOrder[] }) {
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #333", borderRadius: 4 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "34%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "22%" }} />
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: "#282828", borderBottom: "1px solid #333" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Stops</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Planned Qty</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Planned Time</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#A3A3A3", lineHeight: "16px" }}>Order Type</th>
          </tr>
        </thead>
      </table>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "34%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>
          <tbody>
            {orderRows.map((o, i) => (
              <tr key={o.id} style={{ borderBottom: i < orderRows.length - 1 ? "1px solid #282828" : "none" }}>
                <td style={{ padding: "12px", verticalAlign: "middle" }}>
                  <div style={{ fontSize: 14, color: "#E5E5E5", lineHeight: "20px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.orderType === "L" ? (o.shipToAddress?.split(",")[0] || "Terminal") : (o.shipToAddress?.split(",")[0] || o.customerName)}
                  </div>
                  <div style={{ fontSize: 13, color: "#737373", lineHeight: "18px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.customerName}
                  </div>
                </td>
                <td style={{ padding: "12px", verticalAlign: "middle" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                    {o.volume ? `${o.volume.toLocaleString()} gal` : "—"}
                  </span>
                </td>
                <td style={{ padding: "12px", verticalAlign: "middle" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                    {MOCK_TIMES[i % MOCK_TIMES.length]}
                  </span>
                </td>
                <td style={{ padding: "12px", verticalAlign: "middle" }}>
                  <span style={{ fontSize: 14, color: "#E5E5E5" }}>
                    {o.orderType === "L" ? "Load" : o.orderType === "T" ? "Transfer" : "Delivery"}
                  </span>
                </td>
              </tr>
            ))}
            {orderRows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "40px 20px", color: "#737373", fontSize: 14, textAlign: "center" }}>
                  No orders in selected routes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FleetInfoPanel() {
  const truckCount = getFleetTruckCount()
  const hubCount = getFleetHubCount()

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>Fleet ({truckCount} trucks)</span>
        <span style={{ fontSize: 13, color: "#737373", lineHeight: "18px" }}>
          {truckCount} trucks · {hubCount} hubs will be included in this run
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {FLEET_TRUCK_GROUPS.map(group => (
          <div key={group.hub}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#737373", lineHeight: "16px", display: "block", marginBottom: 8 }}>
              {group.hub}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {group.trucks.map(truck => (
                <div
                  key={truck.id}
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 0", borderBottom: "1px solid #282828" }}
                >
                  <Truck size={16} color="#737373" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: "#E5E5E5", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {truck.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", marginTop: 2 }}>
                      <span style={{ fontSize: 13, color: "#A3A3A3", flexShrink: 0 }}>{truck.capacity}</span>
                      <SpecsDot />
                      <span style={{ fontSize: 13, color: "#A3A3A3", flexShrink: 0 }}>{truck.compartments}</span>
                      <SpecsDot />
                      <span style={{ fontSize: 13, color: "#A3A3A3" }}>{truck.productNames.length} Products</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#E5E5E5", backgroundColor: "#262626", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {truck.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MergeModal({ isOpen, onClose, checkedRouteIds, checkedUnassignedOrderIds = [], selectedOrders, modalMode = "create", onComplete }: MergeModalProps) {
  const { optimizationInputLayout } = useSettings()
  const [screen, setScreen] = useState<"main" | "loading">("main")
  const [mode, setMode] = useState<"auto" | "manual">("auto")
  const [loadingPhase, setLoadingPhase] = useState("")
  const [canCancel, setCanCancel] = useState(true)

  if (!isOpen) return null

  const showFleetInfo = mode === "auto" && optimizationInputLayout === "fleet_info"
  const isManual = mode === "manual"
  const mainWidth = screen === "loading" ? 480 : (isManual || showFleetInfo ? 1040 : 640)

  const handleClose = () => {
    setScreen("main")
    setMode("auto")
    setCanCancel(true)
    onClose()
  }

  const orderRows = selectedOrders
    .filter(o =>
      checkedRouteIds.includes(o.routeId ?? "") ||
      (!o.routeId && checkedUnassignedOrderIds.includes(o.id))
    )
    .sort((a, b) => (a.routeSequence ?? 0) - (b.routeSequence ?? 0))

  const handleOptimise = () => {
    setScreen("loading")
    setLoadingPhase("Evaluating orders across fleet...")
    setCanCancel(true)

    const phases = [
      { delay: 1800, text: "Evaluating orders across fleet...", canCancel: true },
      { delay: 1500, text: "Applying compartment constraints...", canCancel: true },
      { delay: 1400, text: "Checking product compatibility...", canCancel: true },
      { delay: 1800, text: "Optimising stop sequences...", canCancel: false },
      { delay: 1500, text: "Finalising routes...", canCancel: false },
    ]

    let i = 0
    const runPhase = () => {
      if (i >= phases.length) {
        setTimeout(() => {
          const result = buildMockOptimizationResult(orderRows, orderRows.length)
          onComplete?.(result)
          setScreen("main")
          setMode("auto")
          setCanCancel(true)
          onClose()
        }, 800)
        return
      }
      const phase = phases[i]
      setLoadingPhase(phase.text)
      setCanCancel(phase.canCancel)
      i++
      setTimeout(runPhase, phase.delay)
    }
    runPhase()
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        fontFamily: "Geist, sans-serif",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: mainWidth,
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)",
          transition: "width 200ms ease",
          height: screen === "loading" ? "auto" : 640,
          maxHeight: "85vh",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {screen === "main" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
                  {modalMode === "optimise" ? "Optimise Route" : "Create Routes"}
                </span>
                {modalMode === "create" && (
                  <>
                    <div style={{ width: 1, height: 20, backgroundColor: "#333", flexShrink: 0 }} />
                    <div style={{
                      display: "inline-flex", alignItems: "center",
                      height: 28, padding: 2, borderRadius: 4,
                      backgroundColor: "#1B1B1B", border: "1px solid #282828",
                      boxSizing: "border-box" as const,
                    }}>
                      {(["auto", "manual"] as const).map(m => {
                        const isActive = mode === m
                        return (
                          <button
                            key={m}
                            onClick={() => setMode(m)}
                            style={{
                              padding: "0 16px", fontSize: 14, lineHeight: "20px",
                              height: "100%",
                              fontWeight: isActive ? 500 : 400,
                              color: isActive ? "#E5E5E5" : "#A3A3A3",
                              backgroundColor: isActive ? "#282828" : "transparent",
                              border: isActive ? "1px solid #333" : "1px solid transparent",
                              borderRadius: 2, cursor: "pointer",
                              fontFamily: "Geist, sans-serif",
                              boxShadow: isActive ? "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px 0px rgba(0,0,0,0.1)" : "none",
                              transition: "background-color 150ms, color 150ms",
                            }}
                          >
                            {m === "auto" ? "Auto" : "Manual"}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
                <div style={{ flex: 1 }} />
                <button onClick={handleClose} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#E5E5E5", padding: 0 }}>
                  <X size={24} strokeWidth={2} />
                </button>
              </div>
              <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>
                {modalMode === "optimise"
                  ? "All available trucks will be used to optimise this route automatically."
                  : mode === "auto"
                    ? "All available trucks will be used to create optimised routes automatically."
                    : "Select atleast one truck or a driver to create route manually."}
              </span>
            </div>

            <div style={{ display: "flex", gap: (showFleetInfo || isManual) ? 32 : 0, flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div style={{ flex: (showFleetInfo || isManual) ? "0 0 480px" : 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px", marginBottom: 12, flexShrink: 0 }}>Orders ({orderRows.length})</span>
                <OrdersTable orderRows={orderRows} />
              </div>

              {mode === "auto" && showFleetInfo && <FleetInfoPanel />}

              {mode === "manual" && (
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
                  <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3", lineHeight: "24px", flexShrink: 0 }}>Enter Details</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {["Truck (& Trailer)", "Driver", "Starting Hub", "Ending Hub"].map(label => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>{label}</span>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                          border: "1px solid #333", borderRadius: 4, cursor: "pointer",
                          boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                        }}>
                          <span style={{ flex: 1, fontSize: 16, color: "#A3A3A3", lineHeight: "24px" }}>Select</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <button
                onClick={handleClose}
                style={{
                  height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#FAFAFA", backgroundColor: "transparent", border: "1px solid #333",
                  cursor: "pointer", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                  fontFamily: "Geist, sans-serif",
                }}
              >
                Cancel
              </button>
              {(modalMode === "optimise" || mode === "auto") ? (
                <button
                  onClick={handleOptimise}
                  style={{
                    height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                    color: "#171717", backgroundColor: "#E5E5E5", border: "none",
                    cursor: "pointer",
                    fontFamily: "Geist, sans-serif",
                  }}
                >
                  {modalMode === "optimise" ? "Optimize Route" : "Optimise and Create Routes"}
                </button>
              ) : (
                <button
                  style={{
                    height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                    color: "#171717", backgroundColor: "#E5E5E5", border: "none",
                    cursor: "default", opacity: 0.5,
                    fontFamily: "Geist, sans-serif",
                  }}
                >
                  Create Routes
                </button>
              )}
            </div>
          </>
        )}

        {screen === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 16, padding: "40px 0" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5", lineHeight: "24px" }}>Optimising Routes...</span>
            <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px", textAlign: "center", minHeight: 20 }}>{loadingPhase}</span>
            {canCancel && (
              <button
                onClick={handleClose}
                style={{
                  marginTop: 4, height: 36, padding: "8px 16px", borderRadius: 4, fontSize: 14, fontWeight: 500,
                  color: "#FAFAFA", backgroundColor: "transparent", border: "1px solid #333",
                  cursor: "pointer", boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
                  fontFamily: "Geist, sans-serif",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
