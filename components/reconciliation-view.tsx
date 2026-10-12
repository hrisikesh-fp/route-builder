"use client"

import { useState } from "react"
import { AnalyticsTable } from "@/components/rb-pages"
import { RunHistoryView } from "@/components/run/run-history-view"

// 3D shell Reconciliation mode: no metrics bar. Sub nav: Run history (runs of the day, each as a
// read-only workspace with a map snapshot) and Analytics & reporting (plan vs actual).

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
      <nav style={{ width: 180, flexShrink: 0, padding: 12, borderRight: "1px solid #282828", display: "flex", flexDirection: "column", gap: 4 }}>
        {item("history", "Run history")}
        {item("analytics", "Analytics & reporting")}
      </nav>
      {page === "history" ? (
        <main style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <RunHistoryView />
        </main>
      ) : (
        <main style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: 24 }}>
          <h1 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 500, color: "#FAFAFA" }}>Analytics &amp; reporting</h1>
          <div style={{ maxWidth: 960 }}>
            <AnalyticsTable />
          </div>
        </main>
      )}
    </div>
  )
}
