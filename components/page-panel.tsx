"use client"

import { Map as MapIcon } from "lucide-react"
import { SIDE_NAV_WIDTH } from "@/components/side-nav-rail"

// Shell for every non-Map page (Figma RB - Routing v2, Orders page 9145:127262): title, optional map toggle,
// optional tabs, body. Sits over the always-mounted map: half width with the map open beside it, full width otherwise.

export interface PageTab {
  id: string
  label: string
}

interface PagePanelProps {
  title: string
  topOffset?: number
  /** Show the map toggle (Map icon, top right). Orders / Routes open with the map by default. */
  showMapToggle?: boolean
  isMapOpen?: boolean
  onToggleMap?: () => void
  tabs?: PageTab[]
  activeTab?: string
  onTabChange?: (id: string) => void
  children: React.ReactNode
}

export function PagePanel({
  title,
  topOffset = 0,
  showMapToggle = false,
  isMapOpen = false,
  onToggleMap,
  tabs,
  activeTab,
  onTabChange,
  children,
}: PagePanelProps) {
  return (
    <section
      style={{
        position: "absolute",
        top: 68 + topOffset,
        left: SIDE_NAV_WIDTH,
        bottom: 0,
        width: isMapOpen ? `calc((100% - ${SIDE_NAV_WIDTH}px) / 2)` : `calc(100% - ${SIDE_NAV_WIDTH}px)`,
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#111",
        borderRight: isMapOpen ? "1px solid #282828" : "none",
        boxSizing: "border-box",
        fontFamily: "Geist, sans-serif",
        transition: "width 250ms ease",
      }}
    >
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 12px", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 400, lineHeight: "28px", color: "#FAFAFA" }}>{title}</h1>
        {showMapToggle && (
          <button
            type="button"
            aria-label={isMapOpen ? "Hide map" : "Show map"}
            aria-pressed={isMapOpen}
            onClick={onToggleMap}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: 4,
              backgroundColor: isMapOpen ? "#282828" : "transparent",
              cursor: "pointer",
            }}
          >
            <MapIcon size={16} color="#E5E5E5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div role="tablist" style={{ display: "flex", padding: "0 24px", borderBottom: "1px solid #282828", flexShrink: 0 }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  padding: 12,
                  marginBottom: -1,
                  border: "none",
                  borderBottom: isActive ? "1px solid #FFFFFF" : "1px solid transparent",
                  backgroundColor: "transparent",
                  fontSize: 16,
                  lineHeight: "24px",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "#FFFFFF" : "#A3A3A3",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 24, boxSizing: "border-box" }}>{children}</div>
    </section>
  )
}
