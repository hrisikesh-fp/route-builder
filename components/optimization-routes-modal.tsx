"use client"

import { useState } from "react"
import { X, Truck, ArrowLeft, Sparkles } from "lucide-react"
import type { OptimizationResult, OptimizedRoute, Stop } from "@/lib/optimization-types"
import { OptimizationRouteCard } from "@/components/optimization-route-card"

type TabId = "routes" | "unassigned"
type ViewId = "list" | "detail"

interface OptimizationRoutesModalProps {
  isOpen: boolean
  result: OptimizationResult | null
  onClose: () => void
  onProceed?: () => void
}

function Dot() {
  return (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: "50%",
        backgroundColor: "#737373",
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  )
}

function SummaryTabCard({
  label,
  count,
  subtext,
  countColor = "#FFFFFF",
  isActive,
  onClick,
}: {
  label: string
  count: number
  subtext: React.ReactNode
  countColor?: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "16px",
        backgroundColor: isActive ? "#282828" : "#1F1F1F",
        borderRadius: 4,
        border: "none",
        borderBottom: isActive ? "2px solid #D4D4D8" : "2px solid transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "Geist, sans-serif",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3", lineHeight: "20px", display: "block" }}>
        {label}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 500, color: countColor, lineHeight: "28px", display: "block" }}>
          {count}
        </span>
        <div
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "#A3A3A3",
            lineHeight: "16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {subtext}
        </div>
      </div>
    </button>
  )
}

function StopRow({ stop }: { stop: Stop }) {
  const isLoad = stop.kind === "load"
  const badgeBg = isLoad ? (stop.loadType === "manual" ? "#737373" : "#189FFC") : "#25B8A7"
  const badgeLabel = isLoad ? "L" : "D"

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", borderBottom: "1px solid #282828" }}>
      <span style={{ width: 24, fontSize: 14, color: "#A3A3A3", textAlign: "center", flexShrink: 0 }}>{stop.seq}</span>
      <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: badgeBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#171717" }}>{badgeLabel}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "#E5E5E5", lineHeight: "20px" }}>
          {stop.name}
          {stop.mustGo && <span style={{ marginLeft: 8, fontSize: 12, color: "#EAB308" }}>Must-go</span>}
        </div>
        <div style={{ fontSize: 13, color: "#737373", lineHeight: "18px" }}>
          {stop.product}
          {stop.qtyGal != null && ` · ${stop.qtyGal.toLocaleString()} gal`}
        </div>
      </div>
    </div>
  )
}

function RouteDetailView({ route, onBack }: { route: OptimizedRoute; onBack: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 16, flexShrink: 0, fontFamily: "Geist, sans-serif" }}
      >
        <ArrowLeft size={20} color="#A3A3A3" />
        <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>Back to routes</span>
      </button>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 40, backgroundColor: route.color, flexShrink: 0 }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Truck size={16} color="#E5E5E5" />
                <span style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5", lineHeight: "24px" }}>{route.truckName}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { /* OPEN: re-optimize with manually-placed load */ }}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 4, border: "1px solid #333", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#FAFAFA", fontFamily: "Geist, sans-serif" }}
          >
            <Sparkles size={14} color="#A3A3A3" />
            Re-optimize
          </button>
        </div>
        {route.why && route.why.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", lineHeight: "20px", display: "block", marginBottom: 8 }}>Why this route</span>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              {route.why.map((line, i) => (
                <li key={i} style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {route.sequence && route.sequence.length > 0 && (
          <div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", lineHeight: "20px", display: "block", marginBottom: 8 }}>Stops</span>
            {route.sequence.map((stop, i) => <StopRow key={i} stop={stop} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export function OptimizationRoutesModal({ isOpen, result, onClose, onProceed }: OptimizationRoutesModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("routes")
  const [view, setView] = useState<ViewId>("list")
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)

  if (!isOpen || !result) return null

  const selectedRoute = result.routes.find(r => r.id === selectedRouteId) ?? null
  const { summary } = result

  const handleClose = () => {
    setActiveTab("routes")
    setView("list")
    setSelectedRouteId(null)
    onClose()
  }

  const handleProceed = () => {
    onProceed?.()
    handleClose()
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        fontFamily: "Geist, sans-serif",
      }}
      onClick={handleClose}
    >
      {/* Figma Dialog: 1200×888 */}
      <div
        style={{
          width: 1200,
          height: "min(888px, calc(100vh - 80px))",
          maxWidth: "calc(100vw - 48px)",
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow:
            "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — _AlertDialogHeader 50px content */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 28 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
              Optimized Routes
            </span>
            <button
              type="button"
              onClick={handleClose}
              style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#E5E5E5", padding: 0 }}
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 400, color: "#A3A3A3", lineHeight: "20px" }}>
            Generated from {summary.ordersTotal} orders across {summary.routeCount} trucks
          </p>
        </div>

        {view === "list" && (
          <>
            {/* Summary tab cards — 110px row, 12px gap, 570px each */}
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              <SummaryTabCard
                label="Routes"
                count={summary.routeCount}
                isActive={activeTab === "routes"}
                onClick={() => setActiveTab("routes")}
                subtext={
                  <>
                    <span>{summary.routeCount} Trucks</span>
                    <Dot />
                    <span>{summary.ordersPlaced}/{summary.ordersTotal} Orders</span>
                  </>
                }
              />
              <SummaryTabCard
                label="Unassigned orders"
                count={summary.unassignedCount}
                countColor="#EAB308"
                isActive={activeTab === "unassigned"}
                onClick={() => setActiveTab("unassigned")}
                subtext={<span>{summary.conflictCount} conflicts</span>}
              />
            </div>

            {activeTab === "routes" ? (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden", gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3", lineHeight: "24px", flexShrink: 0 }}>
                  Routes
                </span>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
                  {result.routes.map(route => (
                    <OptimizationRouteCard
                      key={route.id}
                      route={route}
                      onClick={() => { setSelectedRouteId(route.id); setView("detail") }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
                <span style={{ fontSize: 14, color: "#737373", lineHeight: "20px" }}>
                  Unassigned orders design coming soon
                </span>
              </div>
            )}
          </>
        )}

        {view === "detail" && selectedRoute && (
          <RouteDetailView route={selectedRoute} onBack={() => { setView("list"); setSelectedRouteId(null) }} />
        )}

        {/* Footer — _AlertDialogFooter 36px */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, height: 36 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              height: 36,
              padding: "8px 16px",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              color: "#FAFAFA",
              backgroundColor: "transparent",
              border: "1px solid #333",
              cursor: "pointer",
              fontFamily: "Geist, sans-serif",
              boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            style={{
              height: 36,
              padding: "8px 16px",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              color: "#171717",
              backgroundColor: "#E5E5E5",
              border: "none",
              cursor: "pointer",
              fontFamily: "Geist, sans-serif",
            }}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  )
}
