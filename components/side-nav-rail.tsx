"use client"

import { Bell, ChartColumn, ClipboardList, History, MapPinned, Route, Truck, UserCheck, type LucideIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Left icon rail — Figma RB - Routing v2, node 9130:45476. Names show on hover.
// Map, Orders, Routes and Analytics are built; Trucks, Drivers, Inbox and Run history are empty pages for now.

export type SideNavPage = "map" | "orders" | "routes" | "trucks" | "drivers" | "inbox" | "history" | "analytics"

const ITEMS: { id: SideNavPage; label: string; icon: LucideIcon }[] = [
  { id: "map", label: "Map", icon: MapPinned },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "routes", label: "Routes", icon: Route },
  { id: "trucks", label: "Trucks", icon: Truck },
  { id: "drivers", label: "Drivers", icon: UserCheck },
  { id: "inbox", label: "Inbox", icon: Bell },
  { id: "history", label: "Run history", icon: History },
  { id: "analytics", label: "Analytics & reporting", icon: ChartColumn },
]

export const SIDE_NAV_WIDTH = 52

interface SideNavRailProps {
  active: SideNavPage
  onSelect?: (page: SideNavPage) => void
  topOffset?: number
}

export function SideNavRail({ active, onSelect, topOffset = 0 }: SideNavRailProps) {
  return (
    <TooltipProvider>
      <nav
        aria-label="Route Builder pages"
        style={{
          position: "fixed",
          left: 0,
          top: 68 + topOffset,
          bottom: 0,
          zIndex: 999,
          width: SIDE_NAV_WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 10,
          padding: "8px 8px 24px",
          backgroundColor: "#111",
          borderRight: "1px solid #282828",
          boxSizing: "border-box",
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
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelect?.(id)}
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
                    backgroundColor: isActive ? "#282828" : "transparent",
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
