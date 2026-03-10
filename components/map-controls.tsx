"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Compass, Minus, Plus, Lasso, Layers } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Entity visibility state type
export interface MapEntityVisibility {
  shipTosWithOrders: boolean
  routeSequence: boolean
  shipTosWithoutOrders: boolean
  hub: boolean
  bulkPlant: boolean
  warehouse: boolean
  terminals: boolean
}

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetNorth: () => void
  onLocate: () => void
  isCreatePanelOpen?: boolean
  isRouteListOpen?: boolean
  isLassoActive?: boolean
  onLassoToggle?: () => void
  isWorkspaceOpen?: boolean
  entityVisibility?: MapEntityVisibility
  onEntityVisibilityChange?: (visibility: MapEntityVisibility) => void
}

// ShipTo pin — exact Figma SVG, viewBox cropped to pin content (24×24 display)
function ShipToIcon() {
  return (
    <svg width="24" height="24" viewBox="29 8 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M41.0001 22.0846C39.464 22.0846 38.2137 20.8343 38.2137 19.2982C38.2137 17.7621 39.464 16.5118 41.0001 16.5118C42.5362 16.5118 43.7855 17.7621 43.7855 19.2982C43.7855 20.8343 42.5362 22.0846 41.0001 22.0846ZM41.0001 11.2531C36.5312 11.2531 32.8945 14.8899 32.8945 19.3598C32.8945 25.0517 39.5519 30.4417 41.0001 30.4417C42.4483 30.4417 49.1058 25.0517 49.1058 19.3598C49.1058 14.8899 45.469 11.2531 41.0001 11.2531Z" fill="#A3A3A3"/>
      <circle cx="41.1001" cy="19.0327" r="3.02977" fill="#262626"/>
    </svg>
  )
}

// Hub — exact Figma SVG, viewBox="38 13 20 20" crops to the 20×20 icon
function HubIconSmall() {
  return (
    <svg width="20" height="20" viewBox="38 13 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="13" width="20" height="20" rx="4" fill="#3B82F6"/>
      <path d="M46.5 28V23H49.5V28M43.5 21.5L48 18L52.5 21.5V27C52.5 27.2652 52.3946 27.5196 52.2071 27.7071C52.0196 27.8946 51.7652 28 51.5 28H44.5C44.2348 28 43.9804 27.8946 43.7929 27.7071C43.6054 27.5196 43.5 27.2652 43.5 27V21.5Z" stroke="#FAFAFA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Bulk Plant — exact Figma SVG, viewBox="38 13 20 20"
function BulkPlantIconSmall() {
  return (
    <svg width="20" height="20" viewBox="38 13 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="13" width="20" height="20" rx="4" fill="#22D3EE"/>
      <rect x="42" y="17" width="12" height="12" rx="2" fill="#ECFEFF"/>
      <path d="M45.5 23.0003H49.25C49.692 23.0003 50.116 23.1759 50.4285 23.4885C50.7411 23.801 50.9167 24.225 50.9167 24.667C50.9167 25.109 50.7411 25.5329 50.4285 25.8455C50.116 26.1581 49.692 26.3337 49.25 26.3337H45.9167C45.8062 26.3337 45.7002 26.2898 45.622 26.2116C45.5439 26.1335 45.5 26.0275 45.5 25.917V20.0837C45.5 19.9732 45.5439 19.8672 45.622 19.789C45.7002 19.7109 45.8062 19.667 45.9167 19.667H48.8333C49.2754 19.667 49.6993 19.8426 50.0118 20.1551C50.3244 20.4677 50.5 20.8916 50.5 21.3337C50.5 21.7757 50.3244 22.1996 50.0118 22.5122C49.6993 22.8247 49.2754 23.0003 48.8333 23.0003" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Warehouse — exact Figma SVG, viewBox="38 13 20 20"
function WarehouseIconSmall() {
  return (
    <svg width="20" height="20" viewBox="38 13 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="13" width="20" height="20" rx="4" fill="#854D0E"/>
      <path d="M45 26.0001H51M45 24.0001H51M53 21.1751V27.0001C53 27.2653 52.8946 27.5196 52.7071 27.7072C52.5196 27.8947 52.2652 28.0001 52 28.0001H44C43.7348 28.0001 43.4804 27.8947 43.2929 27.7072C43.1054 27.5196 43 27.2653 43 27.0001V21.1751C43.0008 20.9756 43.0612 20.781 43.1735 20.6162C43.2857 20.4514 43.4447 20.3239 43.63 20.2501L47.63 18.6501C47.8676 18.5554 48.1324 18.5554 48.37 18.6501L52.37 20.2501C52.5553 20.3239 52.7143 20.4514 52.8265 20.6162C52.9388 20.781 52.9992 20.9756 53 21.1751ZM45 22.0001H51V28.0001H45V22.0001Z" stroke="#FAFAFA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Terminal — exact Figma SVG, viewBox="38 13 20 20"
function TerminalIconSmall() {
  return (
    <svg width="20" height="20" viewBox="38 13 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="38" y="13" width="20" height="20" rx="4" fill="#EC4899"/>
      <path d="M50.4717 27.4266V19.9705C50.4717 18.935 49.7996 18.2031 48.7199 18.2031H45.6302C44.5536 18.2031 43.8789 18.935 43.8789 19.9705V27.4266" stroke="white" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M43.2031 27.4258H51.1431" stroke="white" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M51.816 20.0703L52.8027 21.0176V24.877C52.8027 25.1961 52.5337 25.4544 52.2013 25.4544C51.8695 25.4544 51.5999 25.1961 51.5999 24.877V24.1431C51.5999 23.8245 51.3304 23.5658 50.9985 23.5658H50.4688" stroke="white" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M46.5156 25.6328H47.8358" stroke="white" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M46.0794 19.9766H48.268C48.7287 19.9766 49.0154 20.2887 49.0154 20.7304V21.923C49.0154 22.3647 48.7287 22.6768 48.268 22.6768H46.0794C45.6187 22.6768 45.332 22.3647 45.332 21.923V20.7304C45.332 20.2887 45.6203 19.9766 46.0794 19.9766Z" stroke="white" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M47.4927 21.3828L47.0273 22.6796" stroke="white" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Custom toggle — matches Figma Switch component (36×20px track, 16×16px thumb)
function EntityToggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
      style={{
        width: 36,
        height: 20,
        backgroundColor: checked ? "#E5E5E5" : "#404040",
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        padding: "0 2px",
      }}
    >
      <span
        className="rounded-full transition-all duration-200 ease-in-out"
        style={{
          width: 16,
          height: 16,
          backgroundColor: checked ? "#0A0A0A" : "#737373",
          boxShadow: "0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)",
        }}
      />
    </button>
  )
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onLocate,
  isCreatePanelOpen = false,
  isRouteListOpen = false,
  isLassoActive = false,
  onLassoToggle,
  isWorkspaceOpen = false,
  entityVisibility = {
    shipTosWithOrders: true,
    routeSequence: true,
    shipTosWithoutOrders: true,
    hub: true,
    bulkPlant: true,
    warehouse: true,
    terminals: true,
  },
  onEntityVisibilityChange,
}: MapControlsProps) {
  const [isLayersOpen, setIsLayersOpen] = useState(false)
  const layersRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (layersRef.current && !layersRef.current.contains(event.target as Node)) {
        setIsLayersOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggle = (key: keyof MapEntityVisibility) => {
    if (onEntityVisibilityChange) {
      onEntityVisibilityChange({
        ...entityVisibility,
        [key]: !entityVisibility[key],
      })
    }
  }
  const getRightPosition = () => {
    if (isWorkspaceOpen) {
      return "572px" // 560px workspace width + 12px gap
    }
    if (isCreatePanelOpen || isRouteListOpen) {
      return "462px" // 450px sheet width + 12px gap
    }
    return "56px" // 44px collapsed sheet + 12px gap
  }

  return (
    <div
      className="absolute z-[1000] flex flex-col gap-2 transition-all duration-300 ease-in-out"
      style={{
        top: "78px",
        right: getRightPosition(),
      }}
    >
      {/* Map Layers Button with Dropdown */}
      <div className="relative" ref={layersRef}>
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-10 w-10 rounded-lg flex items-center justify-center transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-[#52525B]"
                style={{
                  backgroundColor: isLayersOpen ? "#27272A" : "#18181B",
                  border: isLayersOpen ? "1px solid #52525B" : "1px solid #27272A",
                }}
                onClick={() => setIsLayersOpen(!isLayersOpen)}
                onMouseEnter={(e) => {
                  if (!isLayersOpen) {
                    e.currentTarget.style.backgroundColor = "#27272A"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLayersOpen) {
                    e.currentTarget.style.backgroundColor = "#18181B"
                  }
                }}
              >
                <Layers className="h-4 w-4 text-white" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="z-[1001]">
              <p>Map entities</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Map Entities Dropdown — matches Figma node 2631:15784 */}
        {isLayersOpen && (
          <div
            className="absolute right-12 top-0 rounded-lg flex flex-col"
            style={{
              width: 240,
              backgroundColor: "#111111",
              boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)",
              zIndex: 1002,
              gap: 16,
              padding: 16,
            }}
          >
            {/* Title */}
            <span style={{ fontFamily: "Geist, sans-serif", fontWeight: 300, fontSize: 16, color: "#E5E5E5", lineHeight: "1.5" }}>
              Map entities
            </span>

            {/* All items */}
            <div className="flex flex-col" style={{ gap: 16 }}>

              {/* Group 1: ShipTos */}
              <div className="flex flex-col">
                {/* ShipTos With Orders */}
                <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
                  <div className="flex items-center" style={{ gap: 4, flex: 1 }}>
                    <ShipToIcon />
                    <div className="flex flex-col" style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>ShipTos</span>
                      <span style={{ fontSize: 12, fontWeight: 400, color: "#A3A3A3" }}>With Orders</span>
                    </div>
                  </div>
                  <EntityToggle checked={entityVisibility.shipTosWithOrders} onChange={() => handleToggle("shipTosWithOrders")} />
                </div>

                {/* Route sequence — child of ShipTos With Orders; hidden when parent is off */}
                {entityVisibility.shipTosWithOrders && (
                  <div className="flex items-center justify-between" style={{ padding: "6px 0 6px 28px" }}>
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5", flex: 1 }}>Route sequence</span>
                    <EntityToggle checked={entityVisibility.routeSequence} onChange={() => handleToggle("routeSequence")} />
                  </div>
                )}

                {/* ShipTos Without Orders */}
                <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
                  <div className="flex items-center" style={{ gap: 4, flex: 1 }}>
                    <ShipToIcon />
                    <div className="flex flex-col" style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>ShipTos</span>
                      <span style={{ fontSize: 12, fontWeight: 400, color: "#A3A3A3" }}>Without Orders</span>
                    </div>
                  </div>
                  <EntityToggle checked={entityVisibility.shipTosWithoutOrders} onChange={() => handleToggle("shipTosWithoutOrders")} />
                </div>
              </div>

              {/* Group 2: Hub / Bulk Plant / Warehouse */}
              <div className="flex flex-col">
                {/* Hub */}
                <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
                  <div className="flex items-center" style={{ gap: 8, flex: 1 }}>
                    <HubIconSmall />
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>Hub</span>
                  </div>
                  <EntityToggle checked={entityVisibility.hub} onChange={() => handleToggle("hub")} />
                </div>

                {/* Bulk Plant */}
                <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
                  <div className="flex items-center" style={{ gap: 8, flex: 1 }}>
                    <BulkPlantIconSmall />
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>Bulk Plant</span>
                  </div>
                  <EntityToggle checked={entityVisibility.bulkPlant} onChange={() => handleToggle("bulkPlant")} />
                </div>

                {/* Warehouse */}
                <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
                  <div className="flex items-center" style={{ gap: 8, flex: 1 }}>
                    <WarehouseIconSmall />
                    <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>Warehouse</span>
                  </div>
                  <EntityToggle checked={entityVisibility.warehouse} onChange={() => handleToggle("warehouse")} />
                </div>
              </div>

              {/* Standalone: Terminals */}
              <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
                <div className="flex items-center" style={{ gap: 8, flex: 1 }}>
                  <TerminalIconSmall />
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>Terminals</span>
                </div>
                <EntityToggle checked={entityVisibility.terminals} onChange={() => handleToggle("terminals")} />
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-card/95 backdrop-blur-sm rounded-lg border border-border overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-none border-b border-border"
          onClick={onZoomIn}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none" onClick={onZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Compass/North */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 bg-card/95 backdrop-blur-sm rounded-lg border border-border"
        onClick={onResetNorth}
      >
        <Compass className="h-4 w-4" />
      </Button>

      {/* Locate button - commented out for now */}
      {/* <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 bg-card/95 backdrop-blur-sm rounded-lg border border-border"
        onClick={onLocate}
      >
        <Locate className="h-4 w-4" />
      </Button> */}

      {/* Lasso Tool */}
      {onLassoToggle && (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`w-9 h-9 rounded-lg transition-all ${isLassoActive ? "text-[#FA6400]" : "text-white hover:bg-[#C75000]"}`}
                style={
                  isLassoActive
                    ? {
                        border: "2px solid rgba(250, 100, 0, 0.70)",
                        background: "rgba(250, 100, 0, 0.15)",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                      }
                    : {
                        border: "1px solid #FF9752",
                        background: "#FA6400",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                      }
                }
                onClick={onLassoToggle}
              >
                <Lasso className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="z-[1001]">
              <p>{isLassoActive ? "Disable lasso [Esc]" : "Lasso (Shift + L)"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
