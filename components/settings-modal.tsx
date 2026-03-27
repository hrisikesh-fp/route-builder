"use client"

import { X, Settings, Route, Tag, Sun } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { Switch } from "@/components/ui/switch"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    routeLineDisplayValue,
    showBadgesValue,
    reducedOpacityValue,
    orderCardView,
    updateRouteLineDisplay,
    updateShowBadges,
    updateReducedOpacity,
    updateOrderCardView,
  } = useSettings()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000] bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-[2001] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl overflow-hidden"
        style={{
          backgroundColor: "#111",
          border: "1px solid #282828",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #282828" }}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white" />
            <h2 style={{ color: "#FFF", fontSize: "18px", fontWeight: 500, lineHeight: "28px" }}>
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-[#A3A3A3]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── APPEARANCE ── */}
          <div>
            <h3
              className="mb-4"
              style={{ color: "#A3A3A3", fontSize: "12px", fontWeight: 500, lineHeight: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Appearance
            </h3>
            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: "#1A1A1A", border: "1px solid #282828" }}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: "#282828" }}
                  >
                    <Sun className="w-5 h-5 text-[#A3A3A3]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "#FFF", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>
                      Dark mode
                    </span>
                    <span style={{ color: "#A3A3A3", fontSize: "13px", fontWeight: 400, lineHeight: "18px" }}>
                      Application appearance theme. Light mode coming soon.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={true}
                  onCheckedChange={() => {}}
                  className="data-[state=checked]:bg-[#6366F1] data-[state=unchecked]:bg-[#404040]"
                />
              </div>
            </div>
          </div>

          {/* ── ORDER CARD VIEW ── */}
          <div>
            <h3
              className="mb-4"
              style={{ color: "#A3A3A3", fontSize: "12px", fontWeight: 500, lineHeight: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Order Card View
            </h3>
            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: "#1A1A1A", border: "1px solid #282828" }}
            >
              {/* Condensed option */}
              <button
                onClick={() => updateOrderCardView("condensed")}
                className="w-full text-left"
                style={{ borderBottom: "1px solid #282828" }}
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: orderCardView === "condensed" ? "6px solid #6366F1" : "2px solid #404040",
                      backgroundColor: orderCardView === "condensed" ? "#111" : "transparent",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "#FFF", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>
                      Condensed
                    </span>
                    <span style={{ color: "#A3A3A3", fontSize: "13px", fontWeight: 400, lineHeight: "18px" }}>
                      Customer name, planned qty, order type badge. Current default.
                    </span>
                  </div>
                </div>
              </button>

              {/* Detailed option */}
              <button
                onClick={() => updateOrderCardView("detailed")}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: orderCardView === "detailed" ? "6px solid #6366F1" : "2px solid #404040",
                      backgroundColor: orderCardView === "detailed" ? "#111" : "transparent",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "#FFF", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>
                      Detailed
                    </span>
                    <span style={{ color: "#A3A3A3", fontSize: "13px", fontWeight: 400, lineHeight: "18px" }}>
                      Assets, per-product breakdown, top-offs, urgency indicators.
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #282828" }} />

          {/* ── PREFERENCES (existing) ── */}
          <div>
            <h3
              className="mb-4"
              style={{ color: "#A3A3A3", fontSize: "12px", fontWeight: 500, lineHeight: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Preferences
            </h3>

            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: "#1A1A1A", border: "1px solid #282828" }}
            >
              {/* Route Line Display Setting */}
              <div
                className="flex items-center justify-between p-4"
                style={{ borderBottom: "1px solid #282828" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: "#282828" }}
                  >
                    <Route className="w-5 h-5 text-[#A3A3A3]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "#FFF", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>
                      Colored Route Lines
                    </span>
                    <span style={{ color: "#A3A3A3", fontSize: "13px", fontWeight: 400, lineHeight: "18px" }}>
                      Show route lines in their assigned colors when no route is selected. Default is grayscale.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={routeLineDisplayValue === "colored"}
                  onCheckedChange={(checked) => updateRouteLineDisplay(checked ? "colored" : "grayscale")}
                  className="data-[state=checked]:bg-[#F97316] data-[state=unchecked]:bg-[#404040]"
                />
              </div>

              {/* Sub-option: Reduced Opacity for Unselected */}
              {routeLineDisplayValue === "colored" && (
                <div
                  className="flex items-center justify-between p-4 pl-16"
                  style={{ borderBottom: "1px solid #282828", backgroundColor: "#161616" }}
                >
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "#FFF", fontSize: "13px", fontWeight: 500, lineHeight: "18px" }}>
                      Reduced Opacity for Unselected
                    </span>
                    <span style={{ color: "#A3A3A3", fontSize: "12px", fontWeight: 400, lineHeight: "16px" }}>
                      Show unselected routes at 30% opacity. Selected or hovered routes display at full opacity.
                    </span>
                  </div>
                  <Switch
                    checked={reducedOpacityValue}
                    onCheckedChange={updateReducedOpacity}
                    className="data-[state=checked]:bg-[#F97316] data-[state=unchecked]:bg-[#404040]"
                  />
                </div>
              )}

              {/* Show Badges Setting */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: "#282828" }}
                  >
                    <Tag className="w-5 h-5 text-[#A3A3A3]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "#FFF", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>
                      Show Badges in Default View
                    </span>
                    <span style={{ color: "#A3A3A3", fontSize: "13px", fontWeight: 400, lineHeight: "18px" }}>
                      Display sequence numbers and status badges on the map when no route is selected.
                    </span>
                  </div>
                </div>
                <Switch
                  checked={showBadgesValue}
                  onCheckedChange={updateShowBadges}
                  className="data-[state=checked]:bg-[#F97316] data-[state=unchecked]:bg-[#404040]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
