"use client"

import { ListFilter, MapPin, Route } from "lucide-react"

// Bottom-left map chips (Figma RB - Routing v2 map frame): Filters | N Routes · N Orders.
// Filters opens the floating filter panel upward. Routes / Orders deep link into the List panel.

interface MapSummaryChipsProps {
  left: number
  routeCount: number
  orderCount: number
  activeFilterCount: number
  isFilterOpen: boolean
  onFiltersClick: () => void
  onRoutesClick: () => void
  onOrdersClick: () => void
}

const chipText: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "24px",
  color: "#E5E5E5",
  whiteSpace: "nowrap",
}

function ChipButton({ onClick, children, isActive = false }: { onClick: () => void; children: React.ReactNode; isActive?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "#1F1F1F" }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent" }}
      style={{
        height: 40,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        border: "none",
        borderRadius: 4,
        backgroundColor: isActive ? "#282828" : "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  )
}

export function MapSummaryChips({
  left,
  routeCount,
  orderCount,
  activeFilterCount,
  isFilterOpen,
  onFiltersClick,
  onRoutesClick,
  onOrdersClick,
}: MapSummaryChipsProps) {
  const surface: React.CSSProperties = { display: "flex", alignItems: "center", backgroundColor: "#111", borderRadius: 4 }

  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom: 24,
        zIndex: 1001,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "Geist, sans-serif",
        transition: "left 200ms ease",
      }}
    >
      <div style={surface}>
        <ChipButton onClick={onFiltersClick} isActive={isFilterOpen}>
          <ListFilter size={16} color="#E5E5E5" />
          <span style={chipText}>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
        </ChipButton>
      </div>
      <div style={surface}>
        <ChipButton onClick={onRoutesClick}>
          <Route size={16} color="#E5E5E5" />
          <span style={chipText}>{routeCount} Routes</span>
        </ChipButton>
        <ChipButton onClick={onOrdersClick}>
          <MapPin size={16} color="#E5E5E5" />
          <span style={chipText}>{orderCount} Orders</span>
        </ChipButton>
      </div>
    </div>
  )
}
