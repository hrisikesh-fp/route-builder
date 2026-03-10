"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface MapStatsProps {
  extractionOrdersCount: number
  routesCount: number
  onAddRoute: () => void
  isCreateDisabled?: boolean
}

export function MapStats({ extractionOrdersCount, routesCount, onAddRoute, isCreateDisabled = false }: MapStatsProps) {
  return (
    <div className="absolute bottom-6 left-6 z-[1000] flex items-center gap-4 pointer-events-auto">
      <div
        className="flex items-center gap-8 rounded-2xl border overflow-hidden"
        style={{
          padding: "16px 24px",
          height: "90px",
          borderColor: "rgba(255, 255, 255, 0.15)",
          backgroundColor: "#0A0A0A",
          boxShadow: "0 25px 25px 0 rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Routes metric */}
        <div className="flex flex-col items-start">
          <div className="text-2xl font-bold leading-8" style={{ color: "#FAFAFA" }}>
            {routesCount}
          </div>
          <p className="text-xs font-medium leading-4" style={{ color: "#A3A3A3" }}>
            Routes
          </p>
        </div>

        <div className="w-px self-stretch" style={{ backgroundColor: "#262626" }} />

        {/* Orders metric */}
        <div className="flex flex-col items-start">
          <div className="text-2xl font-bold leading-8" style={{ color: "#FAFAFA" }}>
            {extractionOrdersCount}
          </div>
          <p className="text-xs font-medium leading-4" style={{ color: "#A3A3A3" }}>
            Orders
          </p>
        </div>
      </div>

      <Button
        className="rounded-2xl border-0 p-0 flex items-center justify-center transition-opacity"
        onClick={onAddRoute}
        disabled={isCreateDisabled}
        style={{
          width: "86px",
          height: "86px",
          backgroundColor: "#E5E5E5",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          opacity: isCreateDisabled ? 0.5 : 1,
          cursor: isCreateDisabled ? "not-allowed" : "pointer",
        }}
      >
        <Plus
          className="flex-shrink-0"
          style={{
            width: "36px",
            height: "36px",
            strokeWidth: "2",
            color: "#171717",
          }}
        />
      </Button>
    </div>
  )
}
