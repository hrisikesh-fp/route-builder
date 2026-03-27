"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Simple settings object
const DEFAULT_ROUTE_LINE_DISPLAY = "grayscale" as const
const DEFAULT_SHOW_BADGES = false
const DEFAULT_REDUCED_OPACITY = true
const DEFAULT_ORDER_CARD_VIEW = "condensed" as const

type RouteLineDisplayType = "grayscale" | "colored"
type OrderCardViewType = "condensed" | "detailed"

interface SettingsContextType {
  routeLineDisplayValue: RouteLineDisplayType
  showBadgesValue: boolean
  reducedOpacityValue: boolean
  orderCardView: OrderCardViewType
  updateRouteLineDisplay: (v: RouteLineDisplayType) => void
  updateShowBadges: (v: boolean) => void
  updateReducedOpacity: (v: boolean) => void
  updateOrderCardView: (v: OrderCardViewType) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [routeLineDisplayValue, setRouteLineDisplayValue] = useState<RouteLineDisplayType>(DEFAULT_ROUTE_LINE_DISPLAY)
  const [showBadgesValue, setShowBadgesValue] = useState<boolean>(DEFAULT_SHOW_BADGES)
  const [reducedOpacityValue, setReducedOpacityValue] = useState<boolean>(DEFAULT_REDUCED_OPACITY)
  const [orderCardView, setOrderCardView] = useState<OrderCardViewType>(DEFAULT_ORDER_CARD_VIEW)

  // Load orderCardView from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("orderCardView")
    if (stored === "condensed" || stored === "detailed") {
      setOrderCardView(stored)
    }
  }, [])

  const updateRouteLineDisplay = (v: RouteLineDisplayType) => setRouteLineDisplayValue(v)
  const updateShowBadges = (v: boolean) => setShowBadgesValue(v)
  const updateReducedOpacity = (v: boolean) => setReducedOpacityValue(v)
  const updateOrderCardView = (v: OrderCardViewType) => {
    setOrderCardView(v)
    localStorage.setItem("orderCardView", v)
  }

  return (
    <SettingsContext.Provider
      value={{
        routeLineDisplayValue,
        showBadgesValue,
        reducedOpacityValue,
        orderCardView,
        updateRouteLineDisplay,
        updateShowBadges,
        updateReducedOpacity,
        updateOrderCardView,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext)
  if (ctx === null) {
    return {
      routeLineDisplayValue: DEFAULT_ROUTE_LINE_DISPLAY,
      showBadgesValue: DEFAULT_SHOW_BADGES,
      reducedOpacityValue: DEFAULT_REDUCED_OPACITY,
      orderCardView: DEFAULT_ORDER_CARD_VIEW,
      updateRouteLineDisplay: () => {},
      updateShowBadges: () => {},
      updateReducedOpacity: () => {},
      updateOrderCardView: () => {},
    }
  }
  return ctx
}
