import type { ExtractionOrder } from "@/lib/mock-data"
import { allRoutes } from "@/lib/routes-data"

interface RouteLineTooltipProps {
  routeId: string
  orders: ExtractionOrder[]
}

export function renderRouteLineTooltip({ routeId, orders }: RouteLineTooltipProps): string {
  // Get the full route data including all stops (Hub, Load, Transfer, Delivery)
  const routeData = allRoutes.find(r => r.id === routeId)
  
  // Count all stops excluding Hub stops (those are just start/end markers)
  // This includes: Transfer Out, Load, all Deliveries, Transfer In
  const totalOrderCount = routeData 
    ? routeData.stops.filter(s => s.type !== "Hub").length
    : orders.length
  
  const getDriverName = () => {
    // Use route data if available
    if (routeData?.driverName) return routeData.driverName
    
    const driverId = orders[0]?.driverId
    if (!driverId) return `Route ${routeId.split("-")[1] || ""}`

    const driverNames: Record<string, string> = {
      "driver-1": "Mark Ruffalo",
      "driver-2": "Dwayne Johnson",
      "driver-3": "Jessica Harper",
      "driver-4": "Kyle Reese",
      "driver-5": "Forrest Gump",
      "driver-6": "Amanda Torres",
      "driver-7": "Chris Parker",
      "driver-8": "Nicole Martinez",
    }

    return driverNames[driverId] || `Driver ${driverId.split("-")[1]}`
  }

  const getDriverAvatar = () => {
    const driverId = orders[0]?.driverId
    // Using placeholder avatars based on driver ID
    const avatarMap: Record<string, string> = {
      "driver-1": "/mark-ruffalo-driver.jpg",
      "driver-2": "dwayne-johnson-driver.jpg",
      "driver-3": "/jessica-harper-driver.jpg",
      "driver-4": "/kyle-reese-driver.jpg",
      "driver-5": "/forrest-gump-driver.jpg",
      "driver-6": "/amanda-torres-driver.jpg",
      "driver-7": "/chris-parker-driver.jpg",
      "driver-8": "/nicole-martinez-driver.jpg",
    }
    return avatarMap[driverId || ""] || "/driver-avatar.jpg"
  }
  
  // Get the route name
  const routeName = routeData?.name || `Route ${routeId.split("-")[1] || ""}`

  return `
    <div style="
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #18181B;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      min-width: 280px;
    ">
      <img 
        src="${getDriverAvatar()}" 
        alt="Driver"
        style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        "
      />
      <span style="
        color: white;
        font-size: 16px;
        font-weight: 500;
        flex: 1;
      ">${routeName}</span>
      <div style="
        width: 1px;
        height: 24px;
        background: #3F3F46;
      "></div>
      <span style="
        color: white;
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
      ">${totalOrderCount} Orders</span>
    </div>
  `
}
