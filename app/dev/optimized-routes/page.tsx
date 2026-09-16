"use client"

import { useState } from "react"
import { OptimizationRoutesModal } from "@/components/optimization-routes-modal"
import { buildMockOptimizationResult } from "@/lib/mock-optimization-result"

/** Dev-only preview — open /dev/optimized-routes to inspect the modal without running merge flow */
export default function DevOptimizedRoutesPage() {
  const [open, setOpen] = useState(true)
  const result = buildMockOptimizationResult([])

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#141414" }}>
      <OptimizationRoutesModal
        isOpen={open}
        result={result}
        onClose={() => setOpen(false)}
        onProceed={() => setOpen(false)}
      />
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            margin: 40,
            padding: "12px 20px",
            borderRadius: 4,
            border: "1px solid #333",
            background: "#1F1F1F",
            color: "#E5E5E5",
            cursor: "pointer",
            fontFamily: "Geist, sans-serif",
          }}
        >
          Open Optimized Routes modal
        </button>
      )}
    </div>
  )
}
