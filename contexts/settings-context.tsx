"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Simple settings object
const DEFAULT_ROUTE_LINE_DISPLAY = "grayscale" as const
const DEFAULT_SHOW_BADGES = false
const DEFAULT_REDUCED_OPACITY = true
const DEFAULT_ORDER_CARD_VIEW = "condensed" as const
const DEFAULT_CREATE_ORDER_MODAL_VIEW = "modal1" as const

type RouteLineDisplayType = "grayscale" | "colored"
type OrderCardViewType = "condensed" | "detailed"
export type CreateOrderModalViewType = "modal1" | "modal2"

interface SettingsContextType {
  routeLineDisplayValue: RouteLineDisplayType
  showBadgesValue: boolean
  reducedOpacityValue: boolean
  orderCardView: OrderCardViewType
  createOrderModalView: CreateOrderModalViewType
  updateRouteLineDisplay: (v: RouteLineDisplayType) => void
  updateShowBadges: (v: boolean) => void
  updateReducedOpacity: (v: boolean) => void
  updateOrderCardView: (v: OrderCardViewType) => void
  updateCreateOrderModalView: (v: CreateOrderModalViewType) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [routeLineDisplayValue, setRouteLineDisplayValue] = useState<RouteLineDisplayType>(DEFAULT_ROUTE_LINE_DISPLAY)
  const [showBadgesValue, setShowBadgesValue] = useState<boolean>(DEFAULT_SHOW_BADGES)
  const [reducedOpacityValue, setReducedOpacityValue] = useState<boolean>(DEFAULT_REDUCED_OPACITY)
  const [orderCardView, setOrderCardView] = useState<OrderCardViewType>(DEFAULT_ORDER_CARD_VIEW)
  const [createOrderModalView, setCreateOrderModalView] = useState<CreateOrderModalViewType>(DEFAULT_CREATE_ORDER_MODAL_VIEW)

  // Load persisted settings from localStorage on mount
  useEffect(() => {
    const storedCardView = localStorage.getItem("orderCardView")
    if (storedCardView === "condensed" || storedCardView === "detailed") {
      setOrderCardView(storedCardView)
    }
    const storedModalView = localStorage.getItem("createOrderModalView")
    if (storedModalView === "modal1" || storedModalView === "modal2") {
      setCreateOrderModalView(storedModalView)
    }
  }, [])

  const updateRouteLineDisplay = (v: RouteLineDisplayType) => setRouteLineDisplayValue(v)
  const updateShowBadges = (v: boolean) => setShowBadgesValue(v)
  const updateReducedOpacity = (v: boolean) => setReducedOpacityValue(v)
  const updateOrderCardView = (v: OrderCardViewType) => {
    setOrderCardView(v)
    localStorage.setItem("orderCardView", v)
  }
  const updateCreateOrderModalView = (v: CreateOrderModalViewType) => {
    setCreateOrderModalView(v)
    localStorage.setItem("createOrderModalView", v)
  }

  return (
    <SettingsContext.Provider
      value={{
        routeLineDisplayValue,
        showBadgesValue,
        reducedOpacityValue,
        orderCardView,
        createOrderModalView,
        updateRouteLineDisplay,
        updateShowBadges,
        updateReducedOpacity,
        updateOrderCardView,
        updateCreateOrderModalView,
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
      createOrderModalView: DEFAULT_CREATE_ORDER_MODAL_VIEW,
      updateRouteLineDisplay: () => {},
      updateShowBadges: () => {},
      updateReducedOpacity: () => {},
      updateOrderCardView: () => {},
      updateCreateOrderModalView: () => {},
    }
  }
  return ctx
}
