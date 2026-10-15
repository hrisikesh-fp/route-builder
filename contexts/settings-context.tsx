"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Simple settings object
const DEFAULT_ROUTE_LINE_DISPLAY = "grayscale" as const
const DEFAULT_SHOW_BADGES = false
const DEFAULT_REDUCED_OPACITY = true
const DEFAULT_ORDER_CARD_VIEW = "condensed" as const
const DEFAULT_CREATE_ORDER_MODAL_VIEW = "modal1" as const
const DEFAULT_SHOW_EDIT_IN_FAB = true
const DEFAULT_SHOW_DRIVER_CONFLICT = false
const DEFAULT_OPTIMIZATION_INPUT_LAYOUT = "orders_only" as const
// Prototype data: start the day with every order unassigned (no routes created yet)
const DEFAULT_UNASSIGNED_ONLY = true
// 17 Oct scope (14 Oct): no objective comparison, no review stage before the Workspace.
// Both stay as prototype switches so they can be shown later.
const DEFAULT_SHOW_OBJECTIVE_COMPARISON = false
const DEFAULT_SHOW_REVIEW_STAGE = false

type RouteLineDisplayType = "grayscale" | "colored"
type OrderCardViewType = "condensed" | "detailed"
export type CreateOrderModalViewType = "modal1" | "modal2" | "modal3"
export type OptimizationInputLayout = "orders_only" | "fleet_info"

interface SettingsContextType {
  routeLineDisplayValue: RouteLineDisplayType
  showBadgesValue: boolean
  reducedOpacityValue: boolean
  orderCardView: OrderCardViewType
  createOrderModalView: CreateOrderModalViewType
  showEditInFab: boolean
  showDriverConflict: boolean
  optimizationInputLayout: OptimizationInputLayout
  unassignedOnly: boolean
  showObjectiveComparison: boolean
  showReviewStage: boolean
  updateRouteLineDisplay: (v: RouteLineDisplayType) => void
  updateShowBadges: (v: boolean) => void
  updateReducedOpacity: (v: boolean) => void
  updateOrderCardView: (v: OrderCardViewType) => void
  updateCreateOrderModalView: (v: CreateOrderModalViewType) => void
  updateShowEditInFab: (v: boolean) => void
  updateShowDriverConflict: (v: boolean) => void
  updateOptimizationInputLayout: (v: OptimizationInputLayout) => void
  updateUnassignedOnly: (v: boolean) => void
  updateShowObjectiveComparison: (v: boolean) => void
  updateShowReviewStage: (v: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [routeLineDisplayValue, setRouteLineDisplayValue] = useState<RouteLineDisplayType>(DEFAULT_ROUTE_LINE_DISPLAY)
  const [showBadgesValue, setShowBadgesValue] = useState<boolean>(DEFAULT_SHOW_BADGES)
  const [reducedOpacityValue, setReducedOpacityValue] = useState<boolean>(DEFAULT_REDUCED_OPACITY)
  const [orderCardView, setOrderCardView] = useState<OrderCardViewType>(DEFAULT_ORDER_CARD_VIEW)
  const [createOrderModalView, setCreateOrderModalView] = useState<CreateOrderModalViewType>(DEFAULT_CREATE_ORDER_MODAL_VIEW)
  const [showEditInFab, setShowEditInFab] = useState<boolean>(DEFAULT_SHOW_EDIT_IN_FAB)
  const [showDriverConflict, setShowDriverConflict] = useState<boolean>(DEFAULT_SHOW_DRIVER_CONFLICT)
  const [optimizationInputLayout, setOptimizationInputLayout] = useState<OptimizationInputLayout>(DEFAULT_OPTIMIZATION_INPUT_LAYOUT)
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(DEFAULT_UNASSIGNED_ONLY)
  const [showObjectiveComparison, setShowObjectiveComparison] = useState<boolean>(DEFAULT_SHOW_OBJECTIVE_COMPARISON)
  const [showReviewStage, setShowReviewStage] = useState<boolean>(DEFAULT_SHOW_REVIEW_STAGE)

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
    const storedDriverConflict = localStorage.getItem("showDriverConflict")
    if (storedDriverConflict !== null) setShowDriverConflict(storedDriverConflict === "true")
    const storedOptLayout = localStorage.getItem("optimizationInputLayout")
    if (storedOptLayout === "orders_only" || storedOptLayout === "fleet_info") {
      setOptimizationInputLayout(storedOptLayout)
    }
    const storedUnassignedOnly = localStorage.getItem("unassignedOnly")
    if (storedUnassignedOnly !== null) setUnassignedOnly(storedUnassignedOnly === "true")
    const storedComparison = localStorage.getItem("showObjectiveComparison")
    if (storedComparison !== null) setShowObjectiveComparison(storedComparison === "true")
    const storedReview = localStorage.getItem("showReviewStage")
    if (storedReview !== null) setShowReviewStage(storedReview === "true")
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
  const updateShowDriverConflict = (v: boolean) => {
    setShowDriverConflict(v)
    localStorage.setItem("showDriverConflict", String(v))
  }
  const updateOptimizationInputLayout = (v: OptimizationInputLayout) => {
    setOptimizationInputLayout(v)
    localStorage.setItem("optimizationInputLayout", v)
  }
  const updateUnassignedOnly = (v: boolean) => {
    setUnassignedOnly(v)
    localStorage.setItem("unassignedOnly", String(v))
  }
  const updateShowObjectiveComparison = (v: boolean) => {
    setShowObjectiveComparison(v)
    localStorage.setItem("showObjectiveComparison", String(v))
  }
  const updateShowReviewStage = (v: boolean) => {
    setShowReviewStage(v)
    localStorage.setItem("showReviewStage", String(v))
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
        showDriverConflict,
        optimizationInputLayout,
        unassignedOnly,
        showObjectiveComparison,
        showReviewStage,
        updateRouteLineDisplay,
        updateShowBadges,
        updateReducedOpacity,
        updateOrderCardView,
        updateCreateOrderModalView,
        updateShowEditInFab,
        updateShowDriverConflict,
        updateOptimizationInputLayout,
        updateUnassignedOnly,
        updateShowObjectiveComparison,
        updateShowReviewStage,
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
      showDriverConflict: DEFAULT_SHOW_DRIVER_CONFLICT,
      optimizationInputLayout: DEFAULT_OPTIMIZATION_INPUT_LAYOUT,
      unassignedOnly: DEFAULT_UNASSIGNED_ONLY,
      showObjectiveComparison: DEFAULT_SHOW_OBJECTIVE_COMPARISON,
      showReviewStage: DEFAULT_SHOW_REVIEW_STAGE,
      updateRouteLineDisplay: () => {},
      updateShowBadges: () => {},
      updateReducedOpacity: () => {},
      updateOrderCardView: () => {},
      updateCreateOrderModalView: () => {},
      updateShowEditInFab: () => {},
      updateShowDriverConflict: () => {},
      updateOptimizationInputLayout: () => {},
      updateUnassignedOnly: () => {},
      updateShowObjectiveComparison: () => {},
      updateShowReviewStage: () => {},
    }
  }
  return ctx
}
