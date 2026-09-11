"use client"

import { useState } from "react"
import { MergeModal } from "@/components/merge-modal"
import { OptimizationRoutesDrawer } from "@/components/optimization-routes-drawer"
import { syracuseCustomers } from "@/lib/mock-data"
import type { OptimizationResult } from "@/lib/optimization-types"

/**
 * Dev harness for the full post-optimise flow:
 * Create Routes → loading → objective scorecard → Optimized Routes drawer.
 */
export default function OptimizeFlowDevPage() {
  const [isMergeOpen, setIsMergeOpen] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)

  const orders = syracuseCustomers.slice(0, 8).map((o) => ({ ...o, routeId: undefined }))
  const unassignedIds = orders.map((o) => o.id)

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#141414", padding: 40, fontFamily: "Geist, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5" }}>Optimise flow — end to end</span>
        <span style={{ fontSize: 14, color: "#A3A3A3" }}>
          Create Routes → loading → objective scorecard → routes drawer.
        </span>
        <button
          onClick={() => setIsMergeOpen(true)}
          style={{
            height: 36, padding: "0 16px", borderRadius: 4, border: "none",
            backgroundColor: "#FA6400", color: "#171717", fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "Geist, sans-serif",
          }}
        >
          Start
        </button>
      </div>

      <MergeModal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        checkedRouteIds={[]}
        checkedUnassignedOrderIds={unassignedIds}
        selectedOrders={orders as any}
        modalMode="create"
        onComplete={(r) => setResult(r)}
      />

      <OptimizationRoutesDrawer
        isOpen={!!result}
        result={result}
        onClose={() => setResult(null)}
        onProceed={() => setResult(null)}
      />
    </div>
  )
}
