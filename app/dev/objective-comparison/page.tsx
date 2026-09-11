"use client"

import { useState } from "react"
import { ObjectiveComparisonModal } from "@/components/objective-comparison-modal"

/** Dev harness — the scorecard on its own, no optimisation run required. */
export default function ObjectiveComparisonDevPage() {
  const [isOpen, setIsOpen] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#141414", padding: 40, fontFamily: "Geist, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5" }}>Objective Comparison Scorecard</span>
        <span style={{ fontSize: 14, color: "#A3A3A3" }}>
          {picked ? `Last pick: ${picked}` : "No objective chosen yet."}
        </span>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            height: 36, padding: "0 16px", borderRadius: 4, border: "none",
            backgroundColor: "#E5E5E5", color: "#171717", fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "Geist, sans-serif",
          }}
        >
          Open scorecard
        </button>
      </div>

      <ObjectiveComparisonModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onContinue={(id) => { setPicked(id); setIsOpen(false) }}
      />
    </div>
  )
}
