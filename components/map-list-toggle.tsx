"use client"

// Map / List segmented toggle — Figma RB - Routing v2, node 9103:41084 (shadcn Tabs).
// Floats at the top-left of the map. "List" opens the floating MapListPanel.

export type MapViewMode = "map" | "list"

interface MapListToggleProps {
  value: MapViewMode
  onChange: (value: MapViewMode) => void
  top: number
  left: number
}

const OPTIONS: { value: MapViewMode; label: string }[] = [
  { value: "map", label: "Map" },
  { value: "list", label: "List" },
]

export function MapListToggle({ value, onChange, top, left }: MapListToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Map or list view"
      style={{
        position: "absolute",
        top,
        left,
        zIndex: 1001,
        width: 206,
        height: 40,
        display: "flex",
        alignItems: "center",
        padding: 4,
        backgroundColor: "#111",
        border: "1px solid #333",
        borderRadius: 4,
        boxSizing: "border-box",
        fontFamily: "Geist, sans-serif",
        transition: "left 300ms ease",
      }}
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 12px",
              borderRadius: 2,
              border: isActive ? "1px solid #333" : "1px solid transparent",
              backgroundColor: isActive ? "#282828" : "transparent",
              boxShadow: isActive ? "0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px rgba(0,0,0,0.1)" : "none",
              fontSize: 14,
              lineHeight: "20px",
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "#E5E5E5" : "#A3A3A3",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
