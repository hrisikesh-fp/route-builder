"use client"

import { Calendar, ChevronDown, SquarePen, Key, Shield, LogOut, Settings } from "lucide-react"
import Image from "next/image"
import { useMemo, useState, useRef, useEffect } from "react"

interface MapHeaderProps {
  onFilterClick: () => void
  onSettingsClick: () => void
}

export function MapHeader({ onFilterClick, onSettingsClick }: MapHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Calculate tomorrow's date dynamically
  const tomorrowDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    return `Tomorrow: ${tomorrow.toLocaleDateString("en-US", options)}`
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header
      className="absolute top-0 left-0 right-0 w-full z-[1001] flex justify-between items-center self-stretch"
      style={{
        height: "68px",
        padding: "8px 24px 8px 16px",
        backgroundColor: "#111",
        borderBottom: "1px solid #282828",
      }}
    >
      {/* Left side - Logo and Route Builder */}
      <a
        href="#"
        className="flex items-center rounded-lg transition-colors hover:bg-white/5"
        style={{
          padding: "6px 12px",
          gap: "8px",
        }}
      >
        <Image src="/logo.svg" alt="Route Builder" width={36} height={36} className="w-9 h-9" />
        <div className="flex flex-col">
          <span style={{ color: "#FFF", fontSize: "16px", fontWeight: 500, lineHeight: "24px" }}>
            Route Builder
          </span>
          <span 
            style={{ 
              color: "#A3A3A3", 
              fontSize: "12px", 
              fontWeight: 400, 
              lineHeight: "16px",
              textDecoration: "underline",
            }}
          >
            Back to Dispatch
          </span>
        </div>
      </a>

      {/* Right side - Date and Profile */}
      <div className="flex items-center gap-3">
        {/* Date Selector */}
        <div
          className="flex items-center gap-2 px-3 h-9 text-white"
          style={{
            backgroundColor: "transparent",
            border: "1px solid #282828",
            borderRadius: "4px",
          }}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">{tomorrowDate}</span>
        </div>

        {/* Profile with Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 h-9 px-3 transition-colors hover:bg-white/5"
            style={{ borderRadius: "4px" }}
          >
            {/* Initials Avatar */}
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: "#404040" }}
            >
              HM
            </div>
            <ChevronDown className={`w-4 h-4 text-white transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-lg overflow-hidden"
              style={{
                backgroundColor: "#1A1A1A",
                border: "1px solid #282828",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* User Info Header */}
              <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid #282828" }}>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: "#404040" }}
                >
                  HM
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Hrisikesh Medhi</span>
                  <span style={{ color: "#A3A3A3", fontSize: "14px" }}>Fuel Panda</span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors">
                  <SquarePen className="w-5 h-5" />
                  <span>Edit Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors">
                  <Key className="w-5 h-5" />
                  <span>Change Password</span>
                </button>
                <button 
                  onClick={() => {
                    setIsProfileOpen(false)
                    onSettingsClick()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors">
                  <Shield className="w-5 h-5" />
                  <span>2FA Authentication</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
