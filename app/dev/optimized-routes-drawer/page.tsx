"use client"

import { useState } from "react"
import { OptimizationRoutesDrawer } from "@/components/optimization-routes-drawer"
import { buildMockOptimizationResult } from "@/lib/mock-optimization-result"

/** Dev preview — open /dev/optimized-routes-drawer to inspect the drawer without running merge flow */
export default function DevOptimizedRoutesDrawerPage() {
  const [open, setOpen] = useState(true)
  const result = buildMockOptimizationResult([])

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#141414",
        backgroundImage:
          "repeating-linear-gradient(0deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 40px), repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 40px)",
        fontFamily: "Geist, sans-serif",
      }}
    >
      {/* Fake top nav — matches real app's 68px MapHeader so drawer top:68 positioning works */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 68,
          backgroundColor: "#111",
          borderBottom: "1px solid #282828",
          display: "flex",
          alignItems: "center",
          paddingLeft: 24,
          zIndex: 1200,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>Route Builder</span>
        <span style={{ fontSize: 12, color: "#555", marginLeft: 8 }}>— Optimization Drawer Dev Preview</span>
      </div>

      {/* Map canvas area — starts below the 68px nav */}
      <div
        style={{
          paddingTop: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", color: "#404040" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗺</div>
          <div style={{ fontSize: 14, color: "#404040" }}>Map canvas (dimmed when drawer is open)</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#333" }}>3 routes · 19/29 orders · 10 unassigned</div>
        </div>
      </div>

      <OptimizationRoutesDrawer
        isOpen={open}
        result={result}
        onClose={() => setOpen(false)}
        onProceed={() => {
          console.log("[dev] Proceed & Add to Workspace triggered")
          setOpen(false)
        }}
        onUnassignedCta={(action, order) => {
          console.log("[dev] onUnassignedCta", action, order)
        }}
      />

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: 40,
            right: 40,
            padding: "12px 20px",
            borderRadius: 4,
            border: "1px solid #333",
            background: "#1F1F1F",
            color: "#E5E5E5",
            cursor: "pointer",
            fontFamily: "Geist, sans-serif",
            fontSize: 14,
          }}
        >
          Open Optimized Routes drawer
        </button>
      )}
    </div>
  )
}
