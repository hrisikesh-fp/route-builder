import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes } from "@/lib/mock-data"

// Mirror of MOCK_STOP_TIMES in lasso-workspace-sheet — used to derive display times from routeSequence
const STOP_TIMES = [
  "5:45 AM", "06:30 AM", "7:15 AM", "8:00 AM", "8:45 AM",
  "9:30 AM", "10:15 AM", "11:00 AM", "11:45 AM", "12:30 PM",
]

export function getStopDisplayTime(order: ExtractionOrder): string | undefined {
  // New orders carry an explicit "HH:MM AM/PM" string on scheduledDate
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(order.scheduledDate ?? "")) return order.scheduledDate
  const seq = Math.floor(order.routeSequence ?? 0)
  if (seq > 0 && seq <= STOP_TIMES.length) return STOP_TIMES[seq - 1]
  return undefined
}

// Fallback route colors if route not found in mockRoutes
const ROUTE_COLORS = ["#9A7BC7", "#C4956A", "#6B9DCF", "#B87DA3", "#C07A7A", "#7AB88A"]

export function getRouteColor(routeId: string, fallbackIndex: number): string {
  const route = mockRoutes.find((r) => r.id === routeId)
  return route?.color ?? ROUTE_COLORS[fallbackIndex % ROUTE_COLORS.length]
}

// L/D/T order type badge colours (same as balance-table-modal)
export const ORDER_TYPE_COLORS: Record<"L" | "D" | "T", string> = {
  L: "#189FFC",
  D: "#25B8A7",
  T: "#737373",
}
