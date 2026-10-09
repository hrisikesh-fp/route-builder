"use client"

import { useState } from "react"
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
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusVisible, setIsFocusVisible] = useState(false)
  // Open / keyboard focus = outlined (pill focused tokens). Hover = lighter fill that stands off the #111 chip.
  const isOutlined = isActive || isFocusVisible
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={(e) => setIsFocusVisible(e.currentTarget.matches(":focus-visible"))}
      onBlur={() => setIsFocusVisible(false)}
      style={{
        height: 40,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        border: isOutlined ? "1px solid #737373" : "1px solid transparent",
        boxShadow: isOutlined ? "0px 0px 0px 3px rgba(115,115,115,0.5)" : "none",
        borderRadius: 4,
        backgroundColor: isHovered ? "#333" : "transparent",
        outline: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background-color 120ms ease, box-shadow 120ms ease",
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
