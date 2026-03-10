"use client"

import { X, ArrowRight } from "lucide-react"
import { useState } from "react"

interface Route {
  id: string
  name: string
  driver: string
  status: "scheduled" | "incomplete"
  startHub: string
  endHub: string | null
  orderCount: number
}

interface RouteListSheetProps {
  isOpen: boolean
  onClose: () => void
  onCreateClick: () => void
}

export function RouteListSheet({ isOpen, onClose, onCreateClick }: RouteListSheetProps) {
  const [activeTab, setActiveTab] = useState<"all" | "scheduled" | "incomplete">("all")

  // Mock data - replace with actual data later
  const routes: Route[] = [
    {
      id: "01",
      name: "Route 01",
      driver: "Mark Ruffalo",
      status: "scheduled",
      startHub: "4-Central",
      endHub: "4-Central",
      orderCount: 11,
    },
    {
      id: "02",
      name: "Route 02",
      driver: "Driver 1",
      status: "scheduled",
      startHub: "4-Central",
      endHub: "4-Central",
      orderCount: 8,
    },
    {
      id: "03",
      name: "Route 03",
      driver: "Driver 3",
      status: "incomplete",
      startHub: "4-Central",
      endHub: null,
      orderCount: 1,
    },
  ]

  const filteredRoutes = routes.filter((route) => {
    if (activeTab === "all") return true
    return route.status === activeTab
  })

  const allCount = routes.length
  const scheduledCount = routes.filter((r) => r.status === "scheduled").length
  const incompleteCount = routes.filter((r) => r.status === "incomplete").length

  return (
    <>
      {/* Collapse button on the left edge */}
      <button
        onClick={onClose}
        className="fixed z-[998] flex items-center justify-center gap-2 transition-all duration-300"
        style={{
          top: "calc(50vh - 18px)",
          right: isOpen ? "450px" : "-100px",
          width: "36px",
          height: "36px",
          padding: "8px 12px 8px 16px",
          borderRadius: "8px 0 0 8px",
          borderTop: "1px solid rgba(115, 115, 115, 0.20)",
          borderBottom: "1px solid rgba(115, 115, 115, 0.20)",
          borderLeft: "1px solid rgba(115, 115, 115, 0.20)",
          background: "rgba(255, 255, 255, 0.05)",
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
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
            d="M14 3.33594V12.6693M5.33333 12.0026L9.33333 8.0026M9.33333 8.0026L5.33333 4.0026M9.33333 8.0026H2"
            stroke="#FAFAFA"
            strokeWidth="1.33"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Main sheet */}
      <div
        className="fixed z-[999] transition-all duration-300 overflow-hidden flex flex-col"
        style={{
          top: "54px",
          right: isOpen ? "0" : "-450px",
          width: "450px",
          height: "calc(100vh - 54px)",
          borderLeft: "1px solid #282828",
          backgroundColor: "#111",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-[rgba(115,115,115,0.20)]">
          <div className="flex items-center justify-between mb-6">
            <h2
              style={{
                flex: "1 0 0",
                color: "#FFF",
                fontSize: "20px",
                fontWeight: 600,
                lineHeight: "100%",
              }}
            >
              Showing {filteredRoutes.length} Routes from Map area
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-[rgba(255,255,255,0.10)] text-white"
                  : "bg-transparent text-[#a3a3a3] hover:text-white"
              }`}
            >
              All ({allCount})
            </button>
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "scheduled"
                  ? "bg-[rgba(255,255,255,0.10)] text-white"
                  : "bg-transparent text-[#a3a3a3] hover:text-white"
              }`}
            >
              Scheduled({scheduledCount})
            </button>
            <button
              onClick={() => setActiveTab("incomplete")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "incomplete"
                  ? "bg-[rgba(255,255,255,0.10)] text-white"
                  : "bg-transparent text-[#a3a3a3] hover:text-white"
              }`}
            >
              Incomplete ({incompleteCount})
            </button>
          </div>
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {filteredRoutes.map((route) => (
            <div
              key={route.id}
              className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6 border border-[rgba(115,115,115,0.20)]"
            >
              {/* Route header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{route.name}</h3>
                  <span className="text-base text-[#a3a3a3]">{route.driver}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      route.status === "scheduled" ? "bg-white text-black" : "bg-[#ff931e] text-white"
                    }`}
                  >
                    {route.status === "scheduled" ? "Scheduled" : "Incomplete"}
                  </span>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Route progress */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium text-white mb-1">{route.startHub}</span>
                  <span className="text-sm text-[#737373]">Start Hub</span>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-sm shrink-0" />
                  <div className="flex-1 h-[1px] bg-[rgba(115,115,115,0.40)]" />
                  <span className="text-sm font-medium text-white shrink-0">
                    {route.orderCount} {route.orderCount === 1 ? "Order" : "Orders"}
                  </span>
                  <div className="flex-1 h-[1px] bg-[rgba(115,115,115,0.40)]" />
                  <div className="w-2 h-2 bg-white rounded-sm shrink-0" />
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-base font-medium text-white mb-1">{route.endHub || "NA"}</span>
                  <span className="text-sm text-[#737373]">End Hub</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[rgba(115,115,115,0.20)]">
          <button
            onClick={onCreateClick}
            className="w-full py-4 bg-[#fafafa] text-black text-base font-semibold rounded-lg hover:bg-[#e5e5e5] transition-colors"
          >
            Create Route
          </button>
        </div>
      </div>
    </>
  )
}
