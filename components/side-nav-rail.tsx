"use client"

import { ClipboardList, Truck, UserCheck, type LucideIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// 3D shell left rail — Figma RB - Routing v2, node 9175:89003 ("Filter List").
// Opens the left input panels (Orders, Trucks, Drivers). Names show on hover. More items later.

export type LeftPanel = "orders" | "trucks" | "drivers"

const ITEMS: { id: LeftPanel; label: string; icon: LucideIcon }[] = [
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "trucks", label: "Trucks", icon: Truck },
  { id: "drivers", label: "Drivers", icon: UserCheck },
]

export const SIDE_NAV_WIDTH = 52

interface SideNavRailProps {
  active: LeftPanel | null
  onSelect: (panel: LeftPanel) => void
  style?: React.CSSProperties
}

export function SideNavRail({ active, onSelect, style }: SideNavRailProps) {
  return (
    <TooltipProvider>
      <nav
        aria-label="Planning panels"
        style={{
          position: "absolute",
          width: SIDE_NAV_WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 10,
          padding: "8px 8px 24px",
          backgroundColor: "#111",
          boxSizing: "border-box",
          zIndex: 999,
          ...style,
        }}
      >
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active
          return (
            <Tooltip key={id} delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={label}
                  aria-pressed={isActive}
                  onClick={() => onSelect(id)}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "#1F1F1F" }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent" }}
                  style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: 4,
                    backgroundColor: isActive ? "#333" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={16} color={isActive ? "#FAFAFA" : "#E5E5E5"} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="z-[1300]">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </TooltipProvider>
  )
}
