"use client"

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface RouteSheetCollapsedProps {
  onExpand: () => void
}

export function RouteSheetCollapsed({ onExpand }: RouteSheetCollapsedProps) {
  return (
    <TooltipProvider>
      <div
        className="fixed right-0 z-[999] flex items-center"
        style={{
          top: "54px",
          height: "calc(100vh - 54px)",
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onExpand}
              className="expand-trigger-button flex items-center justify-center gap-2"
              style={{
                width: "36px",
                height: "36px",
                padding: "8px 12px 8px 16px",
                borderRadius: "8px 0 0 8px",
                borderTop: "1px solid rgba(115, 115, 115, 0.20)",
                borderBottom: "1px solid rgba(115, 115, 115, 0.20)",
                borderLeft: "1px solid rgba(115, 115, 115, 0.20)",
                borderRight: "none",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                color: "white",
                cursor: "pointer",
              }}
            >
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
                  d="M2 12.6693V3.33594M8.66667 4.0026L4.66667 8.0026M4.66667 8.0026L8.66667 12.0026M4.66667 8.0026H14"
                  stroke="#FAFAFA"
                  strokeWidth="1.33"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            <p>Open Route List</p>
          </TooltipContent>
        </Tooltip>

        {/* Collapsed vertical bar - 44px wide with route icon, centered vertically */}
        <div className="h-full w-[44px] flex items-center justify-center" style={{ backgroundColor: "#111", borderLeft: "1px solid #282828" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>
        </div>

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
