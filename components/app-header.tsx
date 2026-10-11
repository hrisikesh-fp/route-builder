"use client"

import { Bell, Calendar, ChevronDown, Key, LogOut, Maximize2, Settings, Shield, SquarePen } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

// 3D shell top nav — Figma RB - Routing v2, node 9175:88967.
// Logo + title | Planning / Reconciliation tabs | date, bell (Inbox dropdown), profile.

export type AppMode = "planning" | "reconciliation"
export const APP_HEADER_HEIGHT = 68

interface AppHeaderProps {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  onSettingsClick: () => void
}

const INBOX_ITEMS = [
  { title: "Run finished", detail: "5 routes, 1 unassigned", time: "6:12 AM" },
  { title: "Missing location", detail: "Bear Construction", time: "5:40 AM" },
  { title: "Gallons changed", detail: "Oak Hollow, 4,200 → 3,600 gal", time: "4:12 AM" },
]

const outlineButton: React.CSSProperties = {
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "1px solid #333",
  borderRadius: 4,
  backgroundColor: "transparent",
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
  color: "#FFFFFF",
  fontFamily: "inherit",
  cursor: "pointer",
}

function useOutsideClose(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [ref, onClose])
}

export function AppHeader({ mode, onModeChange, onSettingsClick }: AppHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const inboxRef = useRef<HTMLDivElement>(null)
  useOutsideClose(profileRef, () => setIsProfileOpen(false))
  useOutsideClose(inboxRef, () => setIsInboxOpen(false))

  const tomorrowDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `Tomorrow: ${tomorrow.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }, [])

  const tab = (value: AppMode, label: string) => {
    const isActive = mode === value
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => onModeChange(value)}
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2px 12px",
          borderRadius: 2,
          border: isActive ? "1px solid #282828" : "1px solid transparent",
          backgroundColor: isActive ? "#282828" : "transparent",
          boxShadow: isActive ? "0px 1px 1.5px rgba(0,0,0,0.1), 0px 1px 1px rgba(0,0,0,0.1)" : "none",
          fontSize: 14,
          lineHeight: "20px",
          fontWeight: isActive ? 500 : 400,
          color: isActive ? "#E5E5E5" : "#737373",
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: APP_HEADER_HEIGHT,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 24px 8px 16px",
        backgroundColor: "#111",
        borderBottom: "1px solid #282828",
        boxSizing: "border-box",
        fontFamily: "Geist, sans-serif",
      }}
    >
      {/* Logo + title */}
      <a href="#" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, textDecoration: "none" }}>
        <Image src="/logo.svg" alt="Route Builder" width={36} height={36} style={{ width: 36, height: 36 }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#FFF", fontSize: 16, fontWeight: 500, lineHeight: "24px" }}>Route Builder</span>
          <span style={{ color: "#A3A3A3", fontSize: 12, lineHeight: "16px", textDecoration: "underline" }}>Back to Dispatch</span>
        </div>
      </a>

      {/* Mode tabs — centred in the bar */}
      <div
        role="tablist"
        aria-label="Mode"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 36,
          display: "flex",
          alignItems: "center",
          padding: 4,
          backgroundColor: "#111",
          border: "1px solid #1F1F1F",
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      >
        {tab("planning", "Planning")}
        {tab("reconciliation", "Reconciliation")}
      </div>

      {/* Date, bell, profile */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ ...outlineButton, padding: "0 16px", cursor: "default" }}>
          <Calendar size={16} />
          <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "20px" }}>{tomorrowDate}</span>
        </div>

        {/* Bell → Inbox as a floating dropdown (ClickUp style), above every panel */}
        <div ref={inboxRef} style={{ position: "relative" }}>
          <button
            type="button"
            aria-label="Inbox"
            aria-expanded={isInboxOpen}
            onClick={() => setIsInboxOpen((v) => !v)}
            style={{ ...outlineButton, width: 36, position: "relative", backgroundColor: isInboxOpen ? "#282828" : "transparent" }}
          >
            <Bell size={16} />
            <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: "50%", backgroundColor: "#EF4444" }} />
          </button>
          {isInboxOpen && (
            <div
              style={{
                position: "absolute",
                top: 44,
                right: 0,
                width: 360,
                zIndex: 1400,
                backgroundColor: "#1A1A1A",
                border: "1px solid #282828",
                borderRadius: 8,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #282828" }}>
                <span style={{ fontSize: 16, fontWeight: 500, color: "#FAFAFA" }}>Inbox</span>
                <span title="Full page not wired in the prototype" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#A3A3A3", cursor: "default" }}>
                  <Maximize2 size={14} /> Open full page
                </span>
              </div>
              <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {INBOX_ITEMS.map((item) => (
                  <div key={item.title} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 6, backgroundColor: "#1F1F1F" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#FAFAFA" }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "#A3A3A3" }}>{item.detail}</div>
                    </div>
                    <span style={{ fontSize: 12, color: "#737373", whiteSpace: "nowrap" }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#404040", color: "#FFF", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>HM</span>
            <ChevronDown size={16} color="#FFF" style={{ transform: isProfileOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
          </button>
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-lg overflow-hidden z-[1300]"
              style={{ backgroundColor: "#1A1A1A", border: "1px solid #282828", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
            >
              <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid #282828" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ backgroundColor: "#404040" }}>HM</div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Hrisikesh Medhi</span>
                  <span style={{ color: "#A3A3A3", fontSize: "14px" }}>Fuel Panda</span>
                </div>
              </div>
              <div className="py-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors"><SquarePen className="w-5 h-5" /><span>Edit Profile</span></button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors"><Key className="w-5 h-5" /><span>Change Password</span></button>
                <button
                  onClick={() => { setIsProfileOpen(false); onSettingsClick() }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-5 h-5" /><span>Routing Configuration</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors"><Shield className="w-5 h-5" /><span>2FA Authentication</span></button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors"><LogOut className="w-5 h-5" /><span>Logout</span></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
