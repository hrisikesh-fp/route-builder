"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Simple settings object
const DEFAULT_ROUTE_LINE_DISPLAY = "grayscale" as const
const DEFAULT_SHOW_BADGES = false
const DEFAULT_REDUCED_OPACITY = true
const DEFAULT_ORDER_CARD_VIEW = "condensed" as const
const DEFAULT_CREATE_ORDER_MODAL_VIEW = "modal1" as const
const DEFAULT_SHOW_EDIT_IN_FAB = true

type RouteLineDisplayType = "grayscale" | "colored"
type OrderCardViewType = "condensed" | "detailed"
export type CreateOrderModalViewType = "modal1" | "modal2" | "modal3"

interface SettingsContextType {
  routeLineDisplayValue: RouteLineDisplayType
  showBadgesValue: boolean
  reducedOpacityValue: boolean
  orderCardView: OrderCardViewType
  createOrderModalView: CreateOrderModalViewType
  showEditInFab: boolean
  updateRouteLineDisplay: (v: RouteLineDisplayType) => void
  updateShowBadges: (v: boolean) => void
  updateReducedOpacity: (v: boolean) => void
  updateOrderCardView: (v: OrderCardViewType) => void
  updateCreateOrderModalView: (v: CreateOrderModalViewType) => void
  updateShowEditInFab: (v: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [routeLineDisplayValue, setRouteLineDisplayValue] = useState<RouteLineDisplayType>(DEFAULT_ROUTE_LINE_DISPLAY)
  const [showBadgesValue, setShowBadgesValue] = useState<boolean>(DEFAULT_SHOW_BADGES)
  const [reducedOpacityValue, setReducedOpacityValue] = useState<boolean>(DEFAULT_REDUCED_OPACITY)
  const [orderCardView, setOrderCardView] = useState<OrderCardViewType>(DEFAULT_ORDER_CARD_VIEW)
  const [createOrderModalView, setCreateOrderModalView] = useState<CreateOrderModalViewType>(DEFAULT_CREATE_ORDER_MODAL_VIEW)
  const [showEditInFab, setShowEditInFab] = useState<boolean>(DEFAULT_SHOW_EDIT_IN_FAB)

  // Load persisted settings from localStorage on mount
  useEffect(() => {
    const storedCardView = localStorage.getItem("orderCardView")
    if (storedCardView === "condensed" || storedCardView === "detailed") {
      setOrderCardView(storedCardView)
    }
    const storedModalView = localStorage.getItem("createOrderModalView")
    if (storedModalView === "modal1" || storedModalView === "modal2" || storedModalView === "modal3") {
      setCreateOrderModalView(storedModalView)
    }
    const storedEditInFab = localStorage.getItem("showEditInFab")
    if (storedEditInFab !== null) setShowEditInFab(storedEditInFab === "true")
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
  const updateShowEditInFab = (v: boolean) => {
    setShowEditInFab(v)
    localStorage.setItem("showEditInFab", String(v))
  }

  return (
    <SettingsContext.Provider
      value={{
        routeLineDisplayValue,
        showBadgesValue,
        reducedOpacityValue,
        orderCardView,
        createOrderModalView,
        showEditInFab,
        updateRouteLineDisplay,
        updateShowBadges,
        updateReducedOpacity,
        updateOrderCardView,
        updateCreateOrderModalView,
        updateShowEditInFab,
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
      showEditInFab: DEFAULT_SHOW_EDIT_IN_FAB,
      updateRouteLineDisplay: () => {},
      updateShowBadges: () => {},
      updateReducedOpacity: () => {},
      updateOrderCardView: () => {},
      updateCreateOrderModalView: () => {},
      updateShowEditInFab: () => {},
    }
  }
  return ctx
}
