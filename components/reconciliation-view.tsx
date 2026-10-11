"use client"

import { useState } from "react"
import { History } from "lucide-react"
import { AnalyticsTable } from "@/components/rb-pages"

// 3D shell Reconciliation mode: no map, no metrics bar. Sub nav: Run history (empty for now) and
// Analytics & reporting (plan vs actual, same measures as the routing comparison view).

type ReconPage = "history" | "analytics"

export function ReconciliationView({ top }: { top: number }) {
  const [page, setPage] = useState<ReconPage>("history")
  const item = (id: ReconPage, label: string) => (
    <button
      type="button"
      onClick={() => setPage(id)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "8px 12px",
        border: "none",
        borderRadius: 4,
        backgroundColor: page === id ? "#282828" : "transparent",
        color: page === id ? "#FAFAFA" : "#A3A3A3",
        fontSize: 14,
        fontWeight: page === id ? 500 : 400,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  )
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, bottom: 0, display: "flex", backgroundColor: "#111", fontFamily: "Geist, sans-serif", zIndex: 1000 }}>
      <nav style={{ width: 220, padding: 12, borderRight: "1px solid #282828", display: "flex", flexDirection: "column", gap: 4 }}>
        {item("history", "Run history")}
        {item("analytics", "Analytics & reporting")}
      </nav>
      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 24 }}>
        <h1 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 500, color: "#FAFAFA" }}>{page === "history" ? "Run history" : "Analytics & reporting"}</h1>
        {page === "history" ? (
          <div style={{ minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "#1F1F1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <History size={20} color="#A3A3A3" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>Nothing here yet</div>
            <div style={{ fontSize: 14, color: "#737373", maxWidth: 360 }}>Past routing runs will show here, each opening as a read-only workspace.</div>
          </div>
        ) : (
          <div style={{ maxWidth: 960 }}>
            <AnalyticsTable />
          </div>
        )}
      </main>
    </div>
  )
}
