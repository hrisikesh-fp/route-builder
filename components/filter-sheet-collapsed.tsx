"use client"

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SlidersHorizontal } from "lucide-react"

interface FilterSheetCollapsedProps {
  onExpand: () => void
  appliedFiltersCount?: number
}

export function FilterSheetCollapsed({ onExpand, appliedFiltersCount = 0 }: FilterSheetCollapsedProps) {
  return (
    <TooltipProvider>
      <div
        className="fixed left-0 z-[999] flex items-center"
        style={{
          top: "54px",
          height: "calc(100vh - 54px)",
        }}
      >
        {/* Collapsed vertical bar - 44px wide with filter icon, centered vertically */}
        <div className="h-full w-[44px] flex flex-col items-center justify-center gap-4 relative" style={{ backgroundColor: "#111", borderRight: "1px solid #282828" }}>
          {/* Applied filters badge */}
          {appliedFiltersCount > 0 && (
            <div
              className="flex items-center justify-center rounded-full bg-[#EF4444] text-white text-xs font-semibold"
              style={{
                width: "20px",
                height: "20px",
                marginBottom: "4px",
              }}
            >
              {appliedFiltersCount}
            </div>
          )}

          <SlidersHorizontal className="w-6 h-6 text-white" />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onExpand}
              className="expand-trigger-button flex items-center justify-center gap-2"
              style={{
                width: "36px",
                height: "36px",
                padding: "8px 16px 8px 12px",
                borderRadius: "0 8px 8px 0",
                borderTop: "1px solid rgba(115, 115, 115, 0.20)",
                borderBottom: "1px solid rgba(115, 115, 115, 0.20)",
                borderRight: "1px solid rgba(115, 115, 115, 0.20)",
                borderLeft: "none",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                color: "white",
                cursor: "pointer",
              }}
            >
              {/* Right arrow icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0"
                style={{ aspectRatio: "1/1" }}
              >
                <path
                  d="M14 3.33594V12.6693M7.33333 12.0026L11.3333 8.0026M11.3333 8.0026L7.33333 4.0026M11.3333 8.0026H2"
                  stroke="#FAFAFA"
                  strokeWidth="1.33"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p>Open Filters</p>
          </TooltipContent>
        </Tooltip>

        <style jsx>{`
          .expand-trigger-button {
            background: rgba(255, 255, 255, 0.05);
            transition: background 0.2s ease;
          }
          .expand-trigger-button:hover {
            background: rgba(255, 255, 255, 0.10);
          }
        `}</style>
      </div>
    </TooltipProvider>
  )
}
