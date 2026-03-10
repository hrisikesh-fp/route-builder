interface MapPinTooltipProps {
  customerName: string
  address: string
  city: string
  state: string
  zip: string
  scheduledDate: string
  driverId?: string
  currentLevel: number
  volume: number
  tankSize: number
  orderType?: "delivery" | "load" | "transfer" | "extraction"
  orderCount?: number
  assetCount?: number
  topOffAssets?: number
  thresholdCounts?: {
    red: number
    yellow: number
    green: number
    blue: number
  }
}

const driverNames: Record<string, string> = {
  "driver-1": "Mark Ruffalo",
  "driver-2": "Dwayne Johnson",
  "driver-3": "Jessica Harper",
  "driver-4": "Kyle Reese",
  "driver-5": "Forrest Gump",
}

function getDriverName(driverId?: string): string {
  if (!driverId) return "Unassigned"
  return driverNames[driverId] || `Driver ${driverId.split("-")[1]}`
}

function getOrderTypeBadge(orderType?: string): { letter: string; bg: string } {
  switch (orderType) {
    case "delivery":
      return { letter: "D", bg: "#E5E5E5" }
    case "load":
      return { letter: "L", bg: "#3B82F6" }
    case "transfer":
      return { letter: "T", bg: "#8B5CF6" }
    case "extraction":
      return { letter: "E", bg: "#F97316" }
    default:
      return { letter: "D", bg: "#E5E5E5" }
  }
}

export function renderMapPinTooltip(props: MapPinTooltipProps): string {
  const { 
    customerName, 
    address, 
    city, 
    state, 
    zip, 
    scheduledDate, 
    driverId, 
    volume, 
    orderType = "delivery",
    orderCount = 1,
    assetCount = 1,
    topOffAssets = 0,
    thresholdCounts = { red: 0, yellow: 0, green: 0, blue: 0 }
  } = props

  // Format time from scheduledDate
  const time = new Date(scheduledDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  const badge = getOrderTypeBadge(orderType)
  const headerTitle = orderCount > 1 
    ? `${orderCount} Orders in this ${customerName}` 
    : customerName

  return `
    <div style="
      display: flex;
      width: 420px;
      flex-direction: column;
      align-items: center;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <!-- Header -->
      <div style="
        display: flex;
        padding: 16px 16px 12px 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        align-self: stretch;
        border-radius: 8px 8px 0 0;
        border-bottom: 1px solid rgba(115, 115, 115, 0.20);
        background: #171717;
      ">
        <h3 style="
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        ">${headerTitle}</h3>
        
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" stroke-width="2" style="flex-shrink: 0;">
            <circle cx="12" cy="10" r="3"></circle>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
          </svg>
          <p style="
            color: #A3A3A3;
            font-size: 14px;
            margin: 0;
            line-height: 1.4;
          ">${address} ${city}, ${state} ${zip}</p>
        </div>
      </div>

      <!-- Body -->
      <div style="
        display: flex;
        padding: 12px 16px 16px 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        align-self: stretch;
        border-radius: 0 0 8px 8px;
        background: #171717;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      ">
        <!-- Inner Card -->
        <div style="
          display: flex;
          padding: 16px;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          align-self: stretch;
          border-radius: 8px;
          background: #262626;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10);
        ">
          <!-- Planned at row -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" stroke-width="2" style="flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span style="color: #A3A3A3; font-size: 14px;">Planned at:</span>
              <span style="color: white; font-size: 14px; font-weight: 600;">${time}</span>
            </div>
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 6px;
              background: ${badge.bg};
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${badge.bg === "#E5E5E5" ? "#18181B" : "white"};
              font-size: 14px;
              font-weight: 600;
            ">${badge.letter}</div>
          </div>

          <!-- Stats row -->
          <div style="
            display: flex;
            align-items: flex-end;
            width: 100%;
            gap: 16px;
          ">
            <!-- Assets & Ordered Gals -->
            <div style="display: flex; gap: 24px; flex: 1;">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: white; font-size: 24px; font-weight: 700;">${assetCount}</span>
                <span style="color: #A3A3A3; font-size: 12px;">Assets</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: white; font-size: 24px; font-weight: 700;">${volume}</span>
                <span style="color: #A3A3A3; font-size: 12px;">Ordered Gals</span>
              </div>
            </div>
            
            <!-- Divider -->
            <div style="width: 1px; height: 48px; background: #404040;"></div>
            
            <!-- Top Off Assets & Threshold counts -->
            <div style="display: flex; gap: 12px; align-items: flex-end;">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: white; font-size: 24px; font-weight: 700;">${topOffAssets}</span>
                <span style="color: #A3A3A3; font-size: 12px;">Top Off Assets</span>
              </div>
              
              <!-- Threshold indicators -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  padding: 4px 8px;
                  background: #3F3F46;
                  border-radius: 4px;
                ">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #EF4444;"></div>
                  <span style="color: white; font-size: 12px; font-weight: 500;">${thresholdCounts.red}</span>
                </div>
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  padding: 4px 8px;
                  background: #3F3F46;
                  border-radius: 4px;
                ">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #F59E0B;"></div>
                  <span style="color: white; font-size: 12px; font-weight: 500;">${thresholdCounts.yellow}</span>
                </div>
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  padding: 4px 8px;
                  background: #3F3F46;
                  border-radius: 4px;
                ">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #22C55E;"></div>
                  <span style="color: white; font-size: 12px; font-weight: 500;">${thresholdCounts.green}</span>
                </div>
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  padding: 4px 8px;
                  background: #3F3F46;
                  border-radius: 4px;
                ">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #3B82F6;"></div>
                  <span style="color: white; font-size: 12px; font-weight: 500;">${thresholdCounts.blue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
