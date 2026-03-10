"use client"

import { tankThresholdColors, type TankThreshold } from "@/lib/routes-data"

interface MapPinProps {
  tankThreshold?: TankThreshold // red, yellow, green, blue (NA)
  routeSequence?: number // sequence number for on-route orders
  isUnassigned?: boolean // has order but not on any route
  isShipToOnly?: boolean // no order for selected day
  isHovered?: boolean
  isSelected?: boolean
  isActive?: boolean // shows original colors on hover/select
}

// New simplified pin design:
// - Grey teardrop with dark circular hole
// - Badge at top-right: large with number (on-route), small dot (unassigned), none (shipTo only)
// - Badge color = tank threshold

export function MapPin({
  tankThreshold = "green",
  routeSequence,
  isUnassigned = false,
  isShipToOnly = false,
  isHovered = false,
  isSelected = false,
  isActive = false,
}: MapPinProps) {
  const isOnRoute = routeSequence !== undefined && !isUnassigned
  // Only show badge if on route (has sequence) OR explicitly marked as unassigned
  const showBadge = !isShipToOnly && (isOnRoute || isUnassigned)
  const badgeColor = tankThresholdColors[tankThreshold]
  // Yellow and green badges need dark text for contrast
  const badgeTextColor = tankThreshold === "yellow" || tankThreshold === "green" ? "#18181B" : "#FFF"

  return (
    <div
      className="relative transition-transform duration-200"
      style={{
        transform: isHovered ? "scale(1.1)" : isSelected ? "scale(1.15)" : "scale(1)",
      }}
    >
      {/* Container for pin + badge */}
      <div className="relative" style={{ width: "24px", height: "32px" }}>
        {/* Pin base - grey teardrop with hole */}
        <svg
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", top: "8px", left: "2px", zIndex: 1 }}
        >
          {/* Teardrop shape */}
          <path
            d="M10 0C4.477 0 0 4.477 0 10c0 7 10 14 10 14s10-7 10-14c0-5.523-4.477-10-10-10z"
            fill="#71717A"
          />
          {/* Center hole */}
          <circle cx="10" cy="10" r="5" fill="#3F3F46" />
        </svg>

        {/* Badge - positioned at top-right, overlapping the pin */}
        {showBadge && (
          <div
            style={{
              position: "absolute",
              top: isOnRoute ? "2px" : "4px",
              right: isOnRoute ? "-4px" : "-2px",
              width: isOnRoute ? "16px" : "10px",
              height: isOnRoute ? "16px" : "10px",
              borderRadius: "50%",
              backgroundColor: badgeColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            {isOnRoute && (
              <span
                style={{
                  color: badgeTextColor,
                  fontSize: "9px",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {routeSequence}
              </span>
            )}
          </div>
        )}

        {/* Selected indicator */}
        {isSelected && (
          <div
            style={{
              position: "absolute",
              top: "6px",
              left: "0",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "2px solid #A855F7",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
        )}
      </div>
    </div>
  )
}

// HTML version for Leaflet markers
export function renderMapPinToHTML(
  tankThreshold: TankThreshold = "green",
  routeSequence?: number,
  isUnassigned: boolean = false,
  isShipToOnly: boolean = false,
  isHovered: boolean = false,
  isSelected: boolean = false,
  isActive: boolean = false,
): string {
  const isOnRoute = routeSequence !== undefined && !isUnassigned
  // Only show badge if on route (has sequence) OR explicitly marked as unassigned
  const showBadge = !isShipToOnly && (isOnRoute || isUnassigned)
  const badgeColor = tankThresholdColors[tankThreshold]
  const badgeTextColor = tankThreshold === "yellow" || tankThreshold === "green" ? "#18181B" : "#FFF"
  const scale = isHovered ? 1.1 : isSelected ? 1.15 : 1

  const badgeHTML = showBadge
    ? `<div style="position: absolute; top: ${isOnRoute ? "2px" : "4px"}; right: ${isOnRoute ? "-4px" : "-2px"}; width: ${isOnRoute ? "16px" : "10px"}; height: ${isOnRoute ? "16px" : "10px"}; border-radius: 50%; background-color: ${badgeColor}; display: flex; align-items: center; justify-content: center; z-index: 10;">
        ${isOnRoute ? `<span style="color: ${badgeTextColor}; font-size: 9px; font-weight: 700; line-height: 1;">${routeSequence}</span>` : ""}
       </div>`
    : ""

  const selectedHTML = isSelected
    ? `<div style="position: absolute; top: 6px; left: 0; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #A855F7; pointer-events: none; z-index: 5;"></div>`
    : ""

  return `
    <div class="pin-wrapper" style="position: relative; width: 24px; height: 32px; transform: scale(${scale}); transition: transform 0.2s; pointer-events: auto;" data-active="${isActive ? "true" : "false"}" data-threshold="${tankThreshold}">
      <!-- Pin SVG -->
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 8px; left: 2px; z-index: 1;">
        <path d="M10 0C4.477 0 0 4.477 0 10c0 7 10 14 10 14s10-7 10-14c0-5.523-4.477-10-10-10z" fill="#71717A"/>
        <circle cx="10" cy="10" r="5" fill="#3F3F46"/>
      </svg>
      ${badgeHTML}
      ${selectedHTML}
    </div>
  `
}
