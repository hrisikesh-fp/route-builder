"use client"

import { TriangleAlert, ArrowRight } from "lucide-react"

interface ConflictAssignmentBannerProps {
  onReviewAndAssign: () => void
}

export function ConflictAssignmentBanner({ onReviewAndAssign }: ConflictAssignmentBannerProps) {
  return (
    <div style={{
      position: "absolute",
      top: 68,
      left: 0,
      right: 0,
      zIndex: 1100,
      backgroundColor: "#111",
      borderBottom: "1px solid #282828",
      padding: 8,
    }}>
      <div style={{
        backgroundColor: "rgba(184,157,20,0.1)",
        border: "1px solid rgba(234,179,8,0.5)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "16px",
      }}>
        {/* Icon + copy */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ paddingTop: 2, flexShrink: 0 }}>
            <TriangleAlert size={20} color="#eab308" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "#eab308", minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: "20px" }}>
              5 orders need route assignment
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: "20px" }}>
              2 drivers each have multiple routes, decide where each order goes.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onReviewAndAssign}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #333",
            borderRadius: 4,
            padding: "8px 12px",
            backgroundColor: "transparent",
            color: "#fafafa",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            lineHeight: "20px",
            flexShrink: 0,
          }}
        >
          Review &amp; Assign
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
