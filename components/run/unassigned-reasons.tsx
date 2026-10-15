"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, TriangleAlert } from "lucide-react"
import type { ReasonGroup, UnassignedOrderRef } from "@/lib/run-types"

// Prashant's run summary, housed in the Unassigned section.
// The whole banner is one accordion. Each reason opens inside it.

export function UnassignedReasons({ groups, total, onOrder }: {
  groups: ReasonGroup[]
  /** Orders this run was given. */
  total: number
  onOrder?: (order: UnassignedOrderRef) => void
}) {
  const [open, setOpen] = useState(true)
  const [openGroup, setOpenGroup] = useState<string | null>(groups[0]?.id ?? null)
  const count = groups.reduce((sum, g) => sum + g.orders.length, 0)
  if (count === 0) return null
  const sent = Math.max(total, count + 1)

  return (
    <div style={{ borderRadius: 4, backgroundColor: "rgba(234, 179, 8, 0.09)", overflow: "hidden" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", background: "none", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}
      >
        <TriangleAlert size={16} color="#EAB308" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#EAB308" }}>
          {count} of {sent} orders could not be placed
        </span>
        <ChevronDown size={16} color="#EAB308" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{ padding: "0 8px 8px 16px" }}>
          {groups.map((group) => {
            const isOpen = openGroup === group.id
            return (
              <div key={group.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroup(isOpen ? null : group.id)}
                  style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, padding: "6px 8px", border: "none", borderRadius: 4, background: "none", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
                    <ChevronRight size={14} color="#A3A3A3" style={{ marginTop: 2, flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none" }} />
                    <span style={{ fontSize: 14, lineHeight: "20px", color: "#E5E5E5" }}>{group.message}</span>
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 14, lineHeight: "20px", color: "#EAB308" }}>{group.orders.length}</span>
                </button>
                {isOpen && (
                  <div style={{ paddingLeft: 28 }}>
                    {group.orders.map((order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => onOrder?.(order)}
                        style={{ display: "block", width: "100%", padding: "4px 8px", border: "none", borderRadius: 4, background: "none", fontFamily: "inherit", fontSize: 14, lineHeight: "20px", color: "#A3A3A3", textAlign: "left", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                      >
                        {order.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
