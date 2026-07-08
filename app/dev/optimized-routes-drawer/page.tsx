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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Geist, sans-serif",
      }}
    >
      {/* Simulated map content behind drawer */}
      <div style={{ textAlign: "center", color: "#404040" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🗺</div>
        <div style={{ fontSize: 14, color: "#404040" }}>Map canvas (dimmed when drawer is open)</div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#333" }}>12 routes · 75/100 orders · 25 unassigned</div>
      </div>

      <OptimizationRoutesDrawer
        isOpen={open}
        result={result}
        onClose={() => setOpen(false)}
        onProceed={() => {
          console.log("[dev] Proceed & Add to Workspace triggered")
          setOpen(false)
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
