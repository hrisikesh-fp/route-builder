"use client"

import { useEffect, useRef, useState } from "react"
import { AppWindow, Check, ChevronDown, PanelBottom, PanelLeft, PanelTop, Truck, UserCheck, X, type LucideIcon } from "lucide-react"
import type { ExtractionOrder } from "@/lib/mock-data"
import type { LeftPanel } from "@/components/side-nav-rail"
import { EmptyBody, OrdersBody } from "@/components/orders-panel"

// A dockable view (Orders, Trucks, Drivers). The map is the anchor, like the chat in Claude Code:
// views dock to its left, above it or below it. The right edge is reserved for Routes / Workspace.
// Header: title · dock button (icon of where it sits + chevron menu to move it) · close.

export type ViewDock = "left" | "top" | "bottom"

const DOCKS: { id: ViewDock; label: string; icon: LucideIcon }[] = [
  { id: "left", label: "Dock left", icon: PanelLeft },
  { id: "top", label: "Dock above map", icon: PanelTop },
  { id: "bottom", label: "Dock below map", icon: PanelBottom },
]

const TITLES: Record<LeftPanel, string> = { orders: "Orders", trucks: "Trucks", drivers: "Drivers" }

interface ViewPanelProps {
  id: LeftPanel
  dock: ViewDock
  onDockChange: (dock: ViewDock) => void
  onClose: () => void
  orders: ExtractionOrder[]
  onHoverOrder: (id: string | null) => void
  onAddToWorkspace: (orderIds: string[]) => void
}

const headerButton: React.CSSProperties = {
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  border: "none",
  borderRadius: 4,
  backgroundColor: "transparent",
  cursor: "pointer",
}

function DockMenu({ dock, onDockChange }: { dock: ViewDock; onDockChange: (d: ViewDock) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])
  const Current = DOCKS.find((d) => d.id === dock)!.icon
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label="Move view"
        aria-expanded={open}
        title="Move view"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.backgroundColor = "#282828" }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.backgroundColor = "transparent" }}
        style={{ ...headerButton, padding: "0 6px 0 8px", backgroundColor: open ? "#333" : "transparent" }}
      >
        <Current size={16} color="#E5E5E5" />
        <ChevronDown size={14} color="#A3A3A3" />
      </button>
      {open && (
        <div style={{ position: "absolute", top: 36, right: 0, zIndex: 1300, width: 232, padding: 8, backgroundColor: "#1A1A1A", border: "1px solid #282828", borderRadius: 8, boxShadow: "0 16px 40px rgba(0,0,0,0.55)" }}>
          <div style={{ padding: "2px 4px 6px", fontSize: 12, color: "#737373" }}>Move</div>
          <div style={{ display: "flex", gap: 6, padding: "0 4px 8px" }}>
            {DOCKS.map(({ id, label, icon: Icon }) => {
              const isOn = id === dock
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => { onDockChange(id); setOpen(false) }}
                  style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: isOn ? "1px solid #6366F1" : "1px solid #282828", backgroundColor: isOn ? "rgba(99,102,241,0.18)" : "transparent", cursor: "pointer" }}
                >
                  <Icon size={16} color={isOn ? "#C7D2FE" : "#E5E5E5"} />
                </button>
              )
            })}
          </div>
          <div style={{ height: 1, backgroundColor: "#282828", margin: "0 4px 6px" }} />
          {/* Multi-monitor (Arnav, 9 Oct): shown, not built */}
          <div title="Not built in the prototype yet" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", fontSize: 14, color: "#737373", cursor: "default" }}>
            <AppWindow size={16} /> Open in new window
            <span style={{ marginLeft: "auto", fontSize: 11 }}>later</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function ViewPanel({ id, dock, onDockChange, onClose, orders, onHoverOrder, onAddToWorkspace }: ViewPanelProps) {
  return (
    <section
      data-view={id}
      style={{
        position: "relative",
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#171717",
        borderRadius: 4,
        overflow: "hidden",
        fontFamily: "Geist, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 0", height: 44, boxSizing: "border-box", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, lineHeight: "28px", color: "#FFFFFF" }}>{TITLES[id]}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <DockMenu dock={dock} onDockChange={onDockChange} />
          <button
            type="button"
            aria-label={`Close ${TITLES[id]}`}
            title="Close"
            onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#282828" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            style={{ ...headerButton, width: 32 }}
          >
            <X size={16} color="#E5E5E5" />
          </button>
        </div>
      </div>
      {id === "orders" && (
        <OrdersBody orders={orders} onHoverOrder={onHoverOrder} onAddToWorkspace={onAddToWorkspace} preferredView={dock === "left" ? "list" : "table"} />
      )}
      {id === "trucks" && <EmptyBody icon={Truck} text="Trucks for the day, with capacity and status, will show here." />}
      {id === "drivers" && <EmptyBody icon={UserCheck} text="Drivers and their shifts will show here." />}
    </section>
  )
}
