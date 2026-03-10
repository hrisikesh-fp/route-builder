"use client"

import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { useState, useRef, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  SlidersHorizontal,
  MapPin,
  Users,
  ChevronDown,
  Search,
  Package,
  ClipboardList,
  Fuel,
  RouteIcon,
  MapPinIcon,
} from "lucide-react"
import { mockHubs } from "@/lib/mock-data"

interface FilterSideSheetProps {
  isOpen: boolean
  onClose: () => void
  totalRoutes: number
  totalOrders: number
  showAllRoutes: boolean
  onShowAllRoutesChange: (value: boolean) => void
  onCitySelectionChange?: (cityName: string | null) => void
}

interface CityData {
  name: string
  state: string
  hubCount: number
  hubs: Array<{ id: string; name: string; address: string }>
}

function getCitiesFromHubs(): Map<string, CityData[]> {
  const citiesByState = new Map<string, CityData[]>()

  mockHubs.forEach((hub) => {
    const addressParts = hub.address.split(",")
    if (addressParts.length >= 2) {
      const cityPart = addressParts[addressParts.length - 2].trim()
      const statePart = addressParts[addressParts.length - 1].trim()
      const cityWords = cityPart.split(" ")
      const city = cityWords[cityWords.length - 1]
      const state = statePart.split(" ")[0]

      if (!citiesByState.has(state)) {
        citiesByState.set(state, [])
      }

      const cities = citiesByState.get(state)!
      let cityData = cities.find((c) => c.name === city)

      if (!cityData) {
        cityData = { name: city, state, hubCount: 0, hubs: [] }
        cities.push(cityData)
      }

      cityData.hubCount++
      cityData.hubs.push({ id: hub.id, name: hub.name, address: hub.address })
    }
  })

  return citiesByState
}

// Custom icon components for the filter sheet
function UsersGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.884 12.5 10 12.5H5C4.11594 12.5 3.26809 12.8512 2.64298 13.4763C2.01786 14.1014 1.66666 14.9493 1.66666 15.8333V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 9.16667C9.34095 9.16667 10.8333 7.67428 10.8333 5.83333C10.8333 3.99238 9.34095 2.5 7.5 2.5C5.65905 2.5 4.16666 3.99238 4.16666 5.83333C4.16666 7.67428 5.65905 9.16667 7.5 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.3333 17.5V15.8333C18.3328 15.0948 18.087 14.3773 17.6345 13.7936C17.182 13.2099 16.5484 12.793 15.8333 12.6083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.3333 2.60833C14.0503 2.79192 14.6858 3.20892 15.1397 3.79359C15.5935 4.37827 15.8398 5.09736 15.8398 5.8375C15.8398 6.57764 15.5935 7.29673 15.1397 7.88141C14.6858 8.46608 14.0503 8.88308 13.3333 9.06667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function OrderTypeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.6667 6.66667L10 2.5L3.33334 6.66667M16.6667 6.66667L10 10.8333M16.6667 6.66667V13.3333L10 17.5M10 10.8333L3.33334 6.66667M10 10.8333V17.5M3.33334 6.66667V13.3333L10 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3.33334" y="5" width="13.3333" height="11.6667" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.66666 5V3.33333C6.66666 2.8731 7.03976 2.5 7.5 2.5H12.5C12.9602 2.5 13.3333 2.8731 13.3333 3.33333V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3.33334 10H16.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function FilterSideSheet({
  isOpen,
  onClose,
  totalRoutes,
  totalOrders,
  showAllRoutes,
  onShowAllRoutesChange,
  onCitySelectionChange,
}: FilterSideSheetProps) {
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const [tempSelectedCities, setTempSelectedCities] = useState<Set<string>>(new Set())
  const [appliedCities, setAppliedCities] = useState<Set<string>>(new Set())
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  const [citySearchQuery, setCitySearchQuery] = useState("")
  
  // Order Type checkboxes
  const [deliveryChecked, setDeliveryChecked] = useState(false)
  const [loadChecked, setLoadChecked] = useState(false)
  const [transferChecked, setTransferChecked] = useState(false)
  const [extractionChecked, setExtractionChecked] = useState(false)
  
  // Order Status checkboxes
  const [scheduledChecked, setScheduledChecked] = useState(false)
  const [unassignedChecked, setUnassignedChecked] = useState(false)
  
  // Tank Threshold checkboxes
  const [highChecked, setHighChecked] = useState(false)
  const [mediumChecked, setMediumChecked] = useState(false)
  const [lowChecked, setLowChecked] = useState(false)
  const [naChecked, setNaChecked] = useState(false)

  const cityDropdownRef = useRef<HTMLDivElement>(null)

  // Count active filters
  const activeFilterCount = [
    appliedCities.size > 0,
    deliveryChecked, loadChecked, transferChecked, extractionChecked,
    scheduledChecked, unassignedChecked,
    highChecked, mediumChecked, lowChecked, naChecked,
  ].filter(Boolean).length

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        if (isCityDropdownOpen) {
          handleCancel()
        }
      }
    }

    if (isCityDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isCityDropdownOpen])

  const citiesByState = getCitiesFromHubs()

  const filteredCitiesByState = new Map<string, CityData[]>()
  citiesByState.forEach((cities, state) => {
    const filtered = cities.filter((city) => city.name.toLowerCase().includes(citySearchQuery.toLowerCase()))
    if (filtered.length > 0) {
      filteredCitiesByState.set(state, filtered)
    }
  })

  const getSelectedCityText = () => {
    if (appliedCities.size === 0) return null
    if (appliedCities.size === 1) {
      return Array.from(appliedCities)[0]
    }
    return `${appliedCities.size} cities`
  }

  const toggleCity = (cityName: string) => {
    const newSelected = new Set(tempSelectedCities)
    if (newSelected.has(cityName)) {
      newSelected.delete(cityName)
    } else {
      newSelected.add(cityName)
    }
    setTempSelectedCities(newSelected)
  }

  const toggleCityExpansion = (cityName: string) => {
    const newExpanded = new Set(expandedCities)
    if (newExpanded.has(cityName)) {
      newExpanded.delete(cityName)
    } else {
      newExpanded.add(cityName)
    }
    setExpandedCities(newExpanded)
  }

  const clearSelectedCities = () => {
    setTempSelectedCities(new Set())
  }

  const handleApply = () => {
    setAppliedCities(new Set(tempSelectedCities))
    setIsCityDropdownOpen(false)

    if (tempSelectedCities.size === 1) {
      const cityName = Array.from(tempSelectedCities)[0]
      onCitySelectionChange?.(cityName)
    } else if (tempSelectedCities.size === 0) {
      onCitySelectionChange?.(null)
    }
  }

  const handleCancel = () => {
    setTempSelectedCities(new Set(appliedCities))
    setIsCityDropdownOpen(false)
  }

  const handleOpenDropdown = () => {
    setTempSelectedCities(new Set(appliedCities))
    setIsCityDropdownOpen(true)
  }

  const handleToggleDropdown = () => {
    if (isCityDropdownOpen) {
      handleCancel()
    } else {
      handleOpenDropdown()
    }
  }

  const handleClearAll = () => {
    setAppliedCities(new Set())
    setTempSelectedCities(new Set())
    setDeliveryChecked(false)
    setLoadChecked(false)
    setTransferChecked(false)
    setExtractionChecked(false)
    setScheduledChecked(false)
    setUnassignedChecked(false)
    setHighChecked(false)
    setMediumChecked(false)
    setLowChecked(false)
    setNaChecked(false)
    onCitySelectionChange?.(null)
  }

  return (
    <>
      {/* Side Sheet */}
      <div
        className={`fixed left-0 z-[1003] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          top: "64px",
          height: "calc(100vh - 64px)",
          width: "320px",
          backgroundColor: "#111",
          borderRight: "1px solid #282828",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{
              borderBottom: "1px solid #282828",
            }}
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-5 h-5 text-white" />
              <h2 style={{ color: "#FFF", fontSize: "18px", fontWeight: 500, lineHeight: "28px" }}>Filters</h2>
              {activeFilterCount > 0 && (
                <span
                  className="flex items-center justify-center text-xs font-medium text-white rounded"
                  style={{
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 6px",
                    backgroundColor: "#3B82F6",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm font-medium text-white hover:text-white/80 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              {/* Location Section */}
              <div className="space-y-4">
                <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: 500, lineHeight: "24px" }}>Location</h3>

                <div className="relative" ref={cityDropdownRef}>
                  <button
                    onClick={handleToggleDropdown}
                    className="w-full px-4 flex items-center justify-between transition-all duration-200 hover:bg-[#1a1a1a]"
                    style={{
                      height: "40px",
                      borderRadius: "4px",
                      backgroundColor: appliedCities.size > 0 ? "#262626" : "transparent",
                      border: "1px solid #282828",
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Users className="w-5 h-5 flex-shrink-0" style={{ color: appliedCities.size > 0 ? "#FFFFFF" : "#A3A3A3" }} />
                      <span 
                        className="font-normal truncate"
                        style={{ 
                          color: appliedCities.size > 0 ? "#FFFFFF" : "#A3A3A3",
                          fontSize: "16px",
                          lineHeight: "24px",
                        }}
                      >
                        City
                      </span>
                      {appliedCities.size > 0 && (
                        <>
                          <div className="w-px h-4 bg-white/20 flex-shrink-0" />
                          <span className="font-normal truncate" style={{ color: "#FB923C", fontSize: "16px", lineHeight: "24px" }}>
                            {getSelectedCityText()}
                          </span>
                        </>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isCityDropdownOpen ? "rotate-180" : ""}`}
                      style={{ color: "#A3A3A3" }}
                    />
                  </button>

                  {isCityDropdownOpen && (
                    <div
                      className="absolute left-0 right-0 z-[1000] overflow-hidden flex flex-col rounded-lg"
                      style={{
                        top: "calc(100% + 8px)",
                        maxHeight: "400px",
                        backgroundColor: "#1A1A1A",
                        border: "1px solid #282828",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      {/* Search bar */}
                      <div className="p-3 border-b border-white/10 flex-shrink-0">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
                          <Input
                            placeholder="Search Cities"
                            value={citySearchQuery}
                            onChange={(e) => setCitySearchQuery(e.target.value)}
                            className="pl-10 bg-[#171717] border-white/10 text-white placeholder:text-[#A3A3A3] h-9"
                          />
                        </div>
                      </div>

                      {/* Cities list */}
                      <div className="flex-1 overflow-y-auto">
                        {tempSelectedCities.size > 0 && (
                          <div className="border-b border-white/10 pb-2">
                            {Array.from(tempSelectedCities).map((cityName) => {
                              let cityData: CityData | undefined
                              for (const [state, cities] of citiesByState) {
                                const found = cities.find((c) => c.name === cityName)
                                if (found) {
                                  cityData = found
                                  break
                                }
                              }
                              if (!cityData) return null

                              return (
                                <div key={`selected-${cityName}`}>
                                  <div className="flex items-center justify-between px-4 py-2 hover:bg-white/5">
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        checked={true}
                                        onCheckedChange={() => toggleCity(cityName)}
                                        className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                                      />
                                      <span className="text-sm font-medium text-white">{cityData.name}</span>
                                    </div>
                                    {cityData.hubCount > 0 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-[#A3A3A3]">{cityData.hubCount}</span>
                                        <button
                                          onClick={() => toggleCityExpansion(cityName)}
                                          className="text-white hover:bg-white/10 rounded p-1"
                                        >
                                          <ChevronDown
                                            className={`w-4 h-4 transition-transform duration-200 ${
                                              expandedCities.has(cityName) ? "rotate-180" : ""
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {expandedCities.has(cityName) && (
                                    <div className="pl-12 pr-4 pb-2 space-y-1">
                                      {cityData.hubs.map((hub) => (
                                        <div key={hub.id} className="text-xs text-[#A3A3A3] py-1">
                                          {hub.address}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}

                            <div className="px-3 py-2 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={clearSelectedCities}
                                className="text-white border-white/20 hover:bg-white/10 bg-transparent h-8 text-xs"
                              >
                                Clear {tempSelectedCities.size} selected
                              </Button>
                            </div>
                          </div>
                        )}

                        {Array.from(filteredCitiesByState.entries()).map(([state, cities]) => (
                          <div key={state}>
                            <div className="px-4 py-2">
                              <span className="text-sm font-medium text-[#A3A3A3]">{state}</span>
                            </div>

                            {cities.map((city) => (
                              <div key={`${state}-${city.name}`}>
                                <div className="flex items-center justify-between px-4 py-2 hover:bg-white/5">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={tempSelectedCities.has(city.name)}
                                      onCheckedChange={() => toggleCity(city.name)}
                                      className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                                    />
                                    <span className="text-sm font-medium text-white">{city.name}</span>
                                  </div>
                                  {city.hubCount > 0 && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-[#A3A3A3]">{city.hubCount}</span>
                                      <button
                                        onClick={() => toggleCityExpansion(city.name)}
                                        className="text-white hover:bg-white/10 rounded p-1"
                                      >
                                        <ChevronDown
                                          className={`w-4 h-4 transition-transform duration-200 ${
                                            expandedCities.has(city.name) ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {expandedCities.has(city.name) && (
                                  <div className="pl-12 pr-4 pb-2 space-y-1">
                                    {city.hubs.map((hub) => (
                                      <div key={hub.id} className="text-xs text-[#A3A3A3] py-1">
                                        {hub.address}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-end gap-2 p-3 border-t border-white/10 flex-shrink-0">
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          className="text-white border-white/20 hover:bg-white/10 bg-transparent h-9"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApply}
                          className="bg-white text-black hover:bg-white/90 h-9"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer & ShipTo Section */}
              <div className="space-y-4">
                <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: 500, lineHeight: "24px" }}>Customer & ShipTo</h3>

                <div className="space-y-2">
                  {/* Customer dropdown - unselected state */}
                  <button
                    className="w-full px-4 flex items-center justify-between transition-all duration-200 hover:bg-[#1a1a1a]"
                    style={{
                      height: "40px",
                      borderRadius: "4px",
                      backgroundColor: "transparent",
                      border: "1px solid #282828",
                    }}
                  >
                    <div className="flex items-center gap-3 text-[#A3A3A3]">
                      <UsersGroupIcon className="w-5 h-5" />
                      <span className="font-normal" style={{ fontSize: "16px", lineHeight: "24px" }}>Customer</span>
                    </div>
                    <ChevronDown className="w-4 h-4" style={{ color: "#A3A3A3" }} />
                  </button>

                  {/* ShipTo dropdown - unselected state */}
                  <button
                    className="w-full px-4 flex items-center justify-between transition-all duration-200 hover:bg-[#1a1a1a]"
                    style={{
                      height: "40px",
                      borderRadius: "4px",
                      backgroundColor: "transparent",
                      border: "1px solid #282828",
                    }}
                  >
                    <div className="flex items-center gap-3 text-[#A3A3A3]">
                      <MapPin className="w-5 h-5" />
                      <span className="font-normal" style={{ fontSize: "16px", lineHeight: "24px" }}>ShipTo</span>
                    </div>
                    <ChevronDown className="w-4 h-4" style={{ color: "#A3A3A3" }} />
                  </button>
                </div>
              </div>

              {/* Driver Details Section */}
              <div className="space-y-4">
                <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: 500, lineHeight: "24px" }}>Driver Details</h3>

                <button
                  className="w-full px-4 flex items-center justify-between transition-all duration-200 hover:bg-[#1a1a1a]"
                  style={{
                    height: "40px",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    border: "1px solid #282828",
                  }}
                >
                  <div className="flex items-center gap-3 text-[#A3A3A3]">
                    <UsersGroupIcon className="w-5 h-5" />
                    <span className="font-normal" style={{ fontSize: "16px", lineHeight: "24px" }}>Driver Group & Drivers</span>
                  </div>
                  <ChevronDown className="w-4 h-4" style={{ color: "#A3A3A3" }} />
                </button>
              </div>

              {/* Order Type & Status Section */}
              <div className="space-y-4">
                <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: 500, lineHeight: "24px" }}>Order Type & Status</h3>

                {/* Order Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#A3A3A3]">
                    <OrderTypeIcon className="w-5 h-5" />
                    <span style={{ fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>Order Type</span>
                  </div>

                  <div className="space-y-1 pl-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="delivery"
                          checked={deliveryChecked}
                          onCheckedChange={(checked) => setDeliveryChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <label htmlFor="delivery" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                          Delivery
                        </label>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>34</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="load"
                          checked={loadChecked}
                          onCheckedChange={(checked) => setLoadChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <label htmlFor="load" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                          Load
                        </label>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>5</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="transfer"
                          checked={transferChecked}
                          onCheckedChange={(checked) => setTransferChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <label htmlFor="transfer" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                          Transfer
                        </label>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>7</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="extraction"
                          checked={extractionChecked}
                          onCheckedChange={(checked) => setExtractionChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <label htmlFor="extraction" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                          Extraction
                        </label>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>0</span>
                    </div>
                  </div>
                </div>

                {/* Order Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#A3A3A3]">
                    <ClipboardList className="w-5 h-5" />
                    <span style={{ fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>Order Status</span>
                  </div>

                  <div className="space-y-1 pl-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="scheduled"
                          checked={scheduledChecked}
                          onCheckedChange={(checked) => setScheduledChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <label htmlFor="scheduled" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                          Scheduled
                        </label>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>37</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="unassigned"
                          checked={unassignedChecked}
                          onCheckedChange={(checked) => setUnassignedChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <label htmlFor="unassigned" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                          Unassigned
                        </label>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>9</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Section */}
              <div className="space-y-4">
                <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: 500, lineHeight: "24px" }}>Assets</h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#A3A3A3]">
                    <TankIcon className="w-5 h-5" />
                    <span style={{ fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>Tank Threshold</span>
                  </div>

                  <div className="space-y-1 pl-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="high"
                          checked={highChecked}
                          onCheckedChange={(checked) => setHighChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                          <label htmlFor="high" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                            High
                          </label>
                        </div>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>30</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="medium"
                          checked={mediumChecked}
                          onCheckedChange={(checked) => setMediumChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                          <label htmlFor="medium" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                            Medium
                          </label>
                        </div>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>24</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="low"
                          checked={lowChecked}
                          onCheckedChange={(checked) => setLowChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                          <label htmlFor="low" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                            Low
                          </label>
                        </div>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>14</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="na"
                          checked={naChecked}
                          onCheckedChange={(checked) => setNaChecked(checked as boolean)}
                          className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white [&>span>svg]:text-black"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                          <label htmlFor="na" className="text-white cursor-pointer" style={{ fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>
                            NA
                          </label>
                        </div>
                      </div>
                      <span style={{ color: "#A3A3A3", fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}>10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Stats */}
          <div
            className="flex flex-col items-start w-full"
            style={{
              padding: "20px",
              gap: "12px",
              borderTop: "1px solid #282828",
            }}
          >
            <div className="flex items-center justify-between w-full text-[#E5E5E5]">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-5 h-5" />
                <span style={{ fontSize: "16px", fontWeight: 400, lineHeight: "24px" }}>{totalRoutes} Routes</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                <span style={{ fontSize: "16px", fontWeight: 400, lineHeight: "24px" }}>{totalOrders} Orders</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <TooltipProvider>
          <div
            className="fixed z-[1004] flex items-center"
            style={{
              left: "320px",
              top: "64px",
              height: "calc(100vh - 64px)",
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  className="collapse-trigger-button flex items-center justify-center"
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
              <TooltipContent side="right" sideOffset={8}>
                <p>Close Filters</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <style jsx>{`
            .collapse-trigger-button {
              background: rgba(255, 255, 255, 0.05);
              transition: background 0.2s ease;
            }
            .collapse-trigger-button:hover {
              background: rgba(255, 255, 255, 0.1);
            }
          `}</style>
        </TooltipProvider>
      )}
    </>
  )
}
