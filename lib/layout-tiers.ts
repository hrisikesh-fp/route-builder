// 3D shell layout rules (spec: route-builder/docs/interactions/panel-layout-spec.md).
// One source for breakpoints and panel sizes, so devs implement the same numbers and
// analytics can tag the tier name (e.g. Mixpanel `layout_tier`).

export type LayoutTier = "compact" | "laptop" | "desk" | "wide"

/** Viewport width (px) where each tier starts */
export const BREAKPOINTS = { laptop: 1280, desk: 1580, wide: 2100 } as const

export function getLayoutTier(width: number): LayoutTier {
  if (width >= BREAKPOINTS.wide) return "wide"
  if (width >= BREAKPOINTS.desk) return "desk"
  if (width >= BREAKPOINTS.laptop) return "laptop"
  return "compact"
}

export const TIER_LABELS: Record<LayoutTier, string> = { compact: "Compact", laptop: "Laptop", desk: "Desk", wide: "Wide" }

/** Left views (Orders, Trucks, Drivers): open at the minimum, the user can drag wider */
export const LEFT_MIN = 480
export const LEFT_MAX = 720

/** Right panel (Routes / Workspace): never below the minimum, grows to the tier's max when the map can spare it */
export const RIGHT_MIN = 560
export const RIGHT_MAX: Record<LayoutTier, number> = { compact: 560, laptop: 560, desk: 640, wide: 720 }

/** The map is the anchor: panels dock only while the map keeps at least this much */
export const MAP_MIN_WIDTH = 480
export const MAP_MIN_HEIGHT = 360 // to revisit after playing with it

/** A view stacked in the left column never gets shorter than this */
export const STACK_MIN_HEIGHT = 240

/** Two left columns side by side only on the wide tier */
export const MAX_LEFT_COLUMNS: Record<LayoutTier, number> = { compact: 1, laptop: 1, desk: 1, wide: 2 }
