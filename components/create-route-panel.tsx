"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ArrowRight, Truck, ChevronDown, Plus, Search } from "lucide-react"

// ─── Mock data ────────────────────────────────────────────────────────────────

type TruckItem = { id: string; name: string; badge: string; capacity: string; compartments: string }
type TrailerItem = { id: string; name: string; capacity: string; compartments: string }

const TRUCKS: TruckItem[] = [
  { id: "H-109", name: "H-109 - 2018 Lube Box Truck",           badge: "Box truck",  capacity: "5,000 gal", compartments: "4 Compartments" },
  { id: "H-118", name: "H-118 - 2019 Kenworth Tank Wagon",       badge: "Tank Wagon", capacity: "4,500 gal", compartments: "4 Compartments" },
  { id: "H-107", name: "H-107 - 2017 Chevrolet Silverado 2500",  badge: "Truck",      capacity: "5,000 gal", compartments: "4 Compartments" },
  { id: "H-215", name: "H-215 - 2022 Freightliner Cascadia",     badge: "Truck",      capacity: "5,500 gal", compartments: "5 Compartments" },
  { id: "H-133", name: "H-133 - 2016 International ProStar",     badge: "Box truck",  capacity: "4,000 gal", compartments: "3 Compartments" },
  { id: "H-177", name: "H-177 - 2015 Mack Pinnacle Tank Wagon",  badge: "Tank Wagon", capacity: "3,500 gal", compartments: "4 Compartments" },
  { id: "H-162", name: "H-162 - 2019 Peterbilt 389 Flatbed",    badge: "Truck",      capacity: "4,500 gal", compartments: "4 Compartments" },
  { id: "H-301", name: "H-301 - 2021 Peterbilt 389 Tanker",     badge: "Tank Wagon", capacity: "5,200 gal", compartments: "5 Compartments" },
]

const TRAILERS: TrailerItem[] = [
  { id: "H-138", name: "H-138 - 2019 Polar Transport Trailer 9,500 gal", capacity: "4,500 gal", compartments: "11 Compartments" },
  { id: "H-146", name: "H-146 - 2005 Van Trailer",                        capacity: "5,000 gal", compartments: "5 Compartments"  },
  { id: "H-147", name: "H-147 - 2018 Van Trailer",                        capacity: "5,000 gal", compartments: "4 Compartments"  },
  { id: "H-149", name: "H-149 - 2019 Van Trailer",                        capacity: "4,500 gal", compartments: "4 Compartments"  },
  { id: "H-152", name: "H-152 - 2017 Van Trailer",                        capacity: "5,000 gal", compartments: "4 Compartments"  },
  { id: "H-201", name: "H-201 - 2020 Peterbilt 579 Tanker Trailer",       capacity: "6,000 gal", compartments: "6 Compartments"  },
  { id: "H-244", name: "H-244 - 2023 Volvo VNL 760 Trailer",              capacity: "6,500 gal", compartments: "7 Compartments"  },
  { id: "H-298", name: "H-298 - 2021 Kenworth T680 Tanker Trailer",       capacity: "7,500 gal", compartments: "8 Compartments"  },
  { id: "H-256", name: "H-256 - 2020 Kenworth W990 Tanker Trailer",       capacity: "8,000 gal", compartments: "9 Compartments"  },
]

// ─── Shared sub-components ────────────────────────────────────────────────────

const HubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14V4L8 2L14 4V14H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 7H11M5 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

function TypeBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 500, color: "#E5E5E5",
      backgroundColor: "#262626", borderRadius: 4,
      padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function SpecsDot() {
  return (
    <div style={{
      width: 4, height: 4, borderRadius: "50%",
      backgroundColor: "#4A4A4A", flexShrink: 0, margin: "0 6px",
    }} />
  )
}

function SearchInput({
  value, onChange, placeholder, inputRef,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  inputRef?: React.RefObject<HTMLInputElement>
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 12px", borderBottom: "1px solid #333",
    }}>
      <Search size={16} color="#737373" style={{ flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, background: "transparent", border: "none", outline: "none",
          fontSize: 14, color: "#E5E5E5", fontFamily: "Geist, sans-serif",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#737373", padding: 0, lineHeight: 1 }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateRoutePanelProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateRoutePanel({ isOpen, onClose }: CreateRoutePanelProps) {
  const [truck, setTruck] = useState<TruckItem | null>(null)
  const [trailer1, setTrailer1] = useState<TrailerItem | null>(null)
  const [trailer2, setTrailer2] = useState<TrailerItem | null>(null)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [truckSearch, setTruckSearch] = useState(false)
  const [truckQuery, setTruckQuery] = useState("")

  // 0 = no picker open, 1 = slot 1 picker, 2 = slot 2 picker
  const [trailerSlot, setTrailerSlot] = useState<0 | 1 | 2>(0)
  const [trailerQuery, setTrailerQuery] = useState("")

  const dropdownRef = useRef<HTMLDivElement>(null)
  const truckSearchRef = useRef<HTMLInputElement>(null)
  const trailerSearchRef = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click (keep selections)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setTruckSearch(false)
        setTrailerSlot(0)
        setTruckQuery("")
        setTrailerQuery("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Auto-focus search inputs
  useEffect(() => {
    if (truckSearch) {
      setTimeout(() => truckSearchRef.current?.focus(), 30)
    }
  }, [truckSearch])

  useEffect(() => {
    if (trailerSlot > 0) {
      setTimeout(() => trailerSearchRef.current?.focus(), 30)
    }
  }, [trailerSlot])

  const filteredTrucks = TRUCKS.filter((t) =>
    t.name.toLowerCase().includes(truckQuery.toLowerCase())
  )

  const filteredTrailers = TRAILERS.filter((t) =>
    t.name.toLowerCase().includes(trailerQuery.toLowerCase())
  )

  const handleTriggerClick = () => {
    if (dropdownOpen) {
      setDropdownOpen(false)
      setTruckSearch(false)
      setTrailerSlot(0)
      setTruckQuery("")
      setTrailerQuery("")
    } else {
      setDropdownOpen(true)
      setTruckSearch(false)
    }
  }

  const handleSelectTruck = (item: TruckItem) => {
    setTruck(item)
    setTruckSearch(false)
    setTruckQuery("")
    // reset trailers when truck changes
    setTrailer1(null)
    setTrailer2(null)
    setTrailerSlot(0)
  }

  const handleRemoveTruck = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTruck(null)
    setTrailer1(null)
    setTrailer2(null)
    setTrailerSlot(0)
    setTruckSearch(false)
    setTruckQuery("")
    setTrailerQuery("")
  }

  const handleAddTrailer = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTrailerQuery("")
    if (!trailer1) {
      setTrailerSlot(1)
    } else if (!trailer2) {
      setTrailerSlot(2)
    }
  }

  const handleSelectTrailer = (item: TrailerItem) => {
    if (trailerSlot === 1) {
      setTrailer1(item)
    } else {
      setTrailer2(item)
    }
    setTrailerSlot(0)
    setTrailerQuery("")
  }

  const handleRemoveTrailer1 = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTrailer1(null)
    setTrailerSlot(0)
  }

  const handleRemoveTrailer2 = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTrailer2(null)
    setTrailerSlot(0)
  }

  return (
    <div
      className={`fixed right-0 z-[999] bg-[#171717] flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ top: "54px", height: "calc(100vh - 54px)", width: "450px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.1)]">
        <h2 style={{ flex: "1 0 0", color: "#FFF", fontSize: "20px", fontWeight: 600, lineHeight: "100%" }}>
          Create New Route
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Route Name */}
        <div className="space-y-2">
          <Label htmlFor="route-name" className="text-white text-sm font-medium">Route Name</Label>
          <Input
            id="route-name"
            placeholder="Enter Route Name"
            className="h-9 bg-[#0A0A0A] border-[rgba(255,255,255,0.15)] text-white placeholder:text-[#737373] rounded-lg"
          />
        </div>

        {/* Zone */}
        <div className="space-y-2">
          <Label htmlFor="hub-select" className="text-white text-sm font-medium">Select a Zone</Label>
          <Select>
            <SelectTrigger
              id="hub-select"
              className="w-full h-9 bg-[#0A0A0A] border-[rgba(255,255,255,0.15)] text-white rounded-lg gap-2 justify-between"
            >
              <div className="flex items-center gap-2">
                <HubIcon />
                <SelectValue placeholder="Select" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buffalo-west">Buffalo West</SelectItem>
              <SelectItem value="buffalo-east">Buffalo East</SelectItem>
              <SelectItem value="buffalo-north">Buffalo North</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Truck + Trailer combobox ── */}
        <div className="space-y-2">
          <Label className="text-white text-sm font-medium">Select Truck</Label>

          {/* Trigger + dropdown wrapper */}
          <div ref={dropdownRef} style={{ position: "relative" }}>

            {/* Trigger field */}
            <button
              onClick={handleTriggerClick}
              style={{
                width: "100%", height: 36,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 12px", gap: 8,
                background: "#0A0A0A",
                border: `1px solid ${dropdownOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: 8, cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <Truck size={16} color="#737373" style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: 14, color: truck ? "#E5E5E5" : "#737373",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {truck ? truck.name : "Select Truck"}
                </span>
              </div>
              <ChevronDown
                size={16}
                color="#737373"
                style={{
                  flexShrink: 0,
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                }}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                backgroundColor: (truckSearch || trailerSlot > 0) ? "#111" : "#1B1B1B",
                border: "1px solid #333",
                borderRadius: 4, zIndex: 50,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}>

                {/* ── STATE 1 / 2: No truck selected ── */}
                {!truck && (
                  <>
                    {/* "No truck selected" row container — always #1B1B1B so it floats above #111 panel */}
                    <div style={{ padding: 4, backgroundColor: "#1B1B1B", borderBottom: "1px solid #333" }}>
                      <div
                        onClick={() => setTruckSearch((s) => !s)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 8px", borderRadius: 2, cursor: "pointer",
                          backgroundColor: truckSearch ? "#282828" : "transparent",
                          justifyContent: "space-between",
                        }}
                        onMouseEnter={(e) => { if (!truckSearch) (e.currentTarget as HTMLElement).style.backgroundColor = "#282828" }}
                        onMouseLeave={(e) => { if (!truckSearch) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 16, color: "#E5E5E5" }}>No truck selected</span>
                          <span style={{ fontSize: 14, color: "#A3A3A3" }}>Last used: Truck #347</span>
                        </div>
                        <Plus size={20} color="#A3A3A3" style={{ flexShrink: 0 }} />
                      </div>
                    </div>

                    {/* Truck search + list */}
                    {truckSearch && (
                      <>
                        <SearchInput
                          value={truckQuery}
                          onChange={setTruckQuery}
                          placeholder="Search Truck"
                          inputRef={truckSearchRef}
                        />
                        <div style={{ padding: 4, borderBottom: "1px solid #333", maxHeight: 220, overflowY: "auto" }}>
                          {filteredTrucks.length === 0 ? (
                            <div style={{ padding: "12px 8px", fontSize: 13, color: "#737373" }}>No trucks found</div>
                          ) : (
                            filteredTrucks.map((t) => (
                              <div
                                key={t.id}
                                onClick={() => handleSelectTruck(t)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 8,
                                  padding: "6px 8px", borderRadius: 2, cursor: "pointer",
                                  backgroundColor: "transparent",
                                }}
                                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"}
                                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                              >
                                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                  <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {t.name}
                                  </span>
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span>
                                    <SpecsDot />
                                    <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                  </div>
                                </div>
                                <TypeBadge label={t.badge} />
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}

                    {/* Trailer hint */}
                    {!truckSearch && (
                      <div style={{ padding: "8px 12px 10px" }}>
                        <span style={{ fontSize: 14, color: "#737373" }}>
                          Trailers can be added only after adding a Truck
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* ── STATE 3: Truck selected ── */}
                {truck && (
                  <>
                    {/* Selected truck row */}
                    <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                      <div
                        onClick={() => { setTruckSearch((s) => !s); setTruckQuery("") }}
                        style={{
                          display: "flex", alignItems: "center", gap: 16,
                          padding: "6px 8px", borderRadius: 2,
                          backgroundColor: "#1B1B1B", cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                      >
                        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {truck.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ fontSize: 14, color: "#A3A3A3" }}>{truck.capacity}</span>
                            <SpecsDot />
                            <span style={{ fontSize: 14, color: "#A3A3A3" }}>{truck.compartments}</span>
                          </div>
                        </div>
                        <TypeBadge label={truck.badge} />
                        <ChevronDown size={16} color="#737373" style={{ flexShrink: 0 }} />
                      </div>
                    </div>

                    {/* Truck search (change truck) — bg #111 to separate from selected row above */}
                    {truckSearch && (
                      <>
                        <SearchInput
                          value={truckQuery}
                          onChange={setTruckQuery}
                          placeholder="Search Truck"
                          inputRef={truckSearchRef}
                        />
                        <div style={{ padding: 4, borderBottom: "1px solid #333", maxHeight: 200, overflowY: "auto", backgroundColor: "#111" }}>
                          {filteredTrucks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => handleSelectTruck(t)}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "6px 8px", borderRadius: 2, cursor: "pointer",
                                backgroundColor: t.id === truck.id ? "rgba(255,255,255,0.06)" : "transparent",
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = t.id === truck.id ? "rgba(255,255,255,0.06)" : "transparent"}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {t.name}
                                </span>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span>
                                  <SpecsDot />
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                </div>
                              </div>
                              <TypeBadge label={t.badge} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* ── Trailer section ── */}
                    {!truckSearch && (
                      <>
                        {/* Trailer slot 1 — selected row */}
                        {trailer1 && (
                          <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                            <div
                              onClick={() => { setTrailerSlot(trailerSlot === 1 ? 0 : 1); setTrailerQuery("") }}
                              style={{
                                display: "flex", alignItems: "center", gap: 16,
                                padding: "6px 8px", borderRadius: 2,
                                backgroundColor: "#1B1B1B", cursor: "pointer",
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {trailer1.name}
                                </span>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer1.capacity}</span>
                                  <SpecsDot />
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer1.compartments}</span>
                                </div>
                              </div>
                              <TypeBadge label="Trailer" />
                              <ChevronDown size={16} color="#737373" style={{ flexShrink: 0 }} />
                            </div>
                          </div>
                        )}

                        {/* Trailer slot 1 — picker */}
                        {trailerSlot === 1 && (
                          <div style={{ borderBottom: "1px solid #333" }}>
                            <SearchInput
                              value={trailerQuery}
                              onChange={setTrailerQuery}
                              placeholder="Search Trailer"
                              inputRef={trailerSearchRef}
                            />
                            <div style={{ padding: 4, maxHeight: 180, overflowY: "auto", backgroundColor: "#111" }}>
                              {filteredTrailers.map((t) => (
                                <div
                                  key={t.id}
                                  onClick={() => handleSelectTrailer(t)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "6px 8px", borderRadius: 2, cursor: "pointer",
                                    backgroundColor: "transparent",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"}
                                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                                >
                                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {t.name}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span>
                                      <SpecsDot />
                                      <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trailer slot 2 — selected row */}
                        {trailer2 && (
                          <div style={{ padding: 4, borderBottom: "1px solid #333" }}>
                            <div
                              onClick={() => { setTrailerSlot(trailerSlot === 2 ? 0 : 2); setTrailerQuery("") }}
                              style={{
                                display: "flex", alignItems: "center", gap: 16,
                                padding: "6px 8px", borderRadius: 2,
                                backgroundColor: "#1B1B1B", cursor: "pointer",
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#242424"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1B1B1B"}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {trailer2.name}
                                </span>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer2.capacity}</span>
                                  <SpecsDot />
                                  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{trailer2.compartments}</span>
                                </div>
                              </div>
                              <TypeBadge label="Trailer" />
                              <ChevronDown size={16} color="#737373" style={{ flexShrink: 0 }} />
                            </div>
                          </div>
                        )}

                        {/* Trailer slot 2 — picker */}
                        {trailerSlot === 2 && (
                          <div style={{ borderBottom: "1px solid #333" }}>
                            <SearchInput
                              value={trailerQuery}
                              onChange={setTrailerQuery}
                              placeholder="Search Trailer"
                              inputRef={trailerSearchRef}
                            />
                            <div style={{ padding: 4, maxHeight: 180, overflowY: "auto", backgroundColor: "#111" }}>
                              {filteredTrailers.map((t) => (
                                <div
                                  key={t.id}
                                  onClick={() => handleSelectTrailer(t)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "6px 8px", borderRadius: 2, cursor: "pointer",
                                    backgroundColor: "transparent",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"}
                                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                                >
                                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                                    <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {t.name}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.capacity}</span>
                                      <SpecsDot />
                                      <span style={{ fontSize: 14, color: "#A3A3A3" }}>{t.compartments}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add Trailer button — hidden when both slots filled */}
                        {!(trailer1 && trailer2) && trailerSlot === 0 && (
                          <div style={{ padding: 4 }}>
                            <button
                              onClick={handleAddTrailer}
                              style={{
                                width: "100%", height: 32,
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "0 12px",
                                background: "transparent",
                                border: "none", borderRadius: 4,
                                cursor: "pointer", color: "#FAFAFA",
                                fontSize: 14, fontWeight: 500,
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                            >
                              <Plus size={16} style={{ flexShrink: 0 }} />
                              Add Trailer
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[rgba(255,255,255,0.1)]">
        <Button className="w-full h-12 bg-[#A3A3A3] hover:bg-[#8C8C8C] text-[#171717] rounded-lg font-medium gap-2">
          Start Creating a Route
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
