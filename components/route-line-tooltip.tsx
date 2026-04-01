import type { ExtractionOrder } from "@/lib/mock-data"
import { mockRoutes } from "@/lib/mock-data"
import { allRoutes } from "@/lib/routes-data"

interface RouteLineTooltipProps {
  routeId: string
  orders: ExtractionOrder[]
}

export function renderRouteLineTooltip({ routeId, orders }: RouteLineTooltipProps): string {
  const routeData = allRoutes.find(r => r.id === routeId)
  const mockRoute = mockRoutes.find(r => r.id === routeId)

  const totalOrderCount = routeData
    ? routeData.stops.filter(s => s.type !== "Hub").length
    : orders.length

  const truckName = mockRoute?.truckName || "No Truck"
  const driverName = mockRoute?.driverName || orders[0]?.driverId?.replace("driver-", "Driver ") || "Unassigned"

  // Inline SVG truck icon (16×16, stroke #FAFAFA)
  const truckIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`

  return `
    <div style="
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: #171717;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      font-family: Geist, sans-serif;
      min-width: 220px;
    ">
      <div style="display: flex; align-items: center; gap: 10px;">
        ${truckIcon}
        <span style="color: #FAFAFA; font-size: 16px; font-weight: 500; line-height: 24px; white-space: nowrap;">${truckName}</span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="color: #A3A3A3; font-size: 14px; font-weight: 400; line-height: 1;">${driverName}</span>
        <span style="
          color: #FAFAFA;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          background: #262626;
          border-radius: 4px;
          padding: 2px 8px;
          white-space: nowrap;
        ">${totalOrderCount} Orders</span>
      </div>
    </div>
  `
}
