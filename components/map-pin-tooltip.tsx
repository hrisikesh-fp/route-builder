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

function getOrderTypeBadge(orderType?: string): { letter: string; bg: string; border: string; color: string } {
  switch (orderType) {
    case "delivery":
      return { letter: "D", bg: "#E5E5E5", border: "#737373", color: "#171717" }
    case "load":
      return { letter: "L", bg: "#3B82F6", border: "#2563EB", color: "#fff" }
    case "transfer":
      return { letter: "T", bg: "#8B5CF6", border: "#7C3AED", color: "#fff" }
    case "extraction":
      return { letter: "E", bg: "#F97316", border: "#EA580C", color: "#fff" }
    default:
      return { letter: "D", bg: "#E5E5E5", border: "#737373", color: "#171717" }
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
    thresholdCounts = { red: 0, yellow: 0, green: 0, blue: 0 },
  } = props

  const time = new Date(scheduledDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  const badge = getOrderTypeBadge(orderType)
  const headerTitle = orderCount > 1 ? `${orderCount} Orders in this ${customerName}` : customerName

  return `
    <div style="
      display: flex;
      width: 420px;
      flex-direction: column;
      align-items: center;
      font-family: 'Geist', system-ui, -apple-system, sans-serif;
      border-radius: 8px;
      overflow: hidden;
    ">
      <!-- Header -->
      <div style="
        display: flex;
        padding: 12px 16px;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        align-self: stretch;
        background: #111111;
        border-bottom: 1px solid #282828;
      ">
        <p style="
          color: #ffffff;
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          line-height: 24px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        ">${headerTitle}</p>

        <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; min-width: 0; width: 100%;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" stroke-width="2" style="flex-shrink: 0;">
            <circle cx="12" cy="10" r="3"></circle>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"></path>
          </svg>
          <p style="
            color: #A3A3A3;
            font-size: 12px;
            font-weight: 400;
            margin: 0;
            line-height: 16px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          ">${address}, ${city}, ${state} ${zip}</p>
        </div>
      </div>

      <!-- Body -->
      <div style="
        display: flex;
        padding: 16px;
        flex-direction: column;
        align-items: flex-start;
        align-self: stretch;
        background: #111111;
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
          border-radius: 4px;
          background: #1F1F1F;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.10), 0 2px 4px -2px rgba(0, 0, 0, 0.10);
        ">
          <!-- Planned at row -->
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          ">
            <div style="display: flex; align-items: center; gap: 4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" stroke-width="2" style="flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span style="color: #A3A3A3; font-size: 14px; font-weight: 400; line-height: 20px;">Planned at:</span>
              <span style="color: #E5E5E5; font-size: 14px; font-weight: 400; line-height: 20px;">${time}</span>
            </div>
            <div style="
              width: 20px;
              height: 20px;
              border-radius: 4px;
              background: ${badge.bg};
              border: 1px solid ${badge.border};
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${badge.color};
              font-size: 14px;
              font-weight: 500;
              line-height: 20px;
              flex-shrink: 0;
            ">${badge.letter}</div>
          </div>

          <!-- Stats section -->
          <div style="
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 12px;
            align-self: stretch;
            background: #282828;
            border-bottom-right-radius: 8px;
          ">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <!-- Left stats -->
              <div style="display: flex; align-items: center; gap: 12px;">
                <!-- Assets -->
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: #E5E5E5; font-size: 18px; font-weight: 700; line-height: 28px;">${assetCount}</span>
                  <span style="color: #A3A3A3; font-size: 12px; font-weight: 500; line-height: 16px;">Assets</span>
                </div>
                <!-- Ordered Gals -->
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: #E5E5E5; font-size: 18px; font-weight: 700; line-height: 28px;">${volume}</span>
                  <span style="color: #A3A3A3; font-size: 12px; font-weight: 500; line-height: 16px;">Ordered Gals</span>
                </div>
                <!-- Vertical divider -->
                <div style="width: 1px; height: 40px; background: #404040; flex-shrink: 0;"></div>
                <!-- Top Off Assets -->
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: #E5E5E5; font-size: 18px; font-weight: 700; line-height: 28px;">${topOffAssets}</span>
                  <span style="color: #A3A3A3; font-size: 12px; font-weight: 500; line-height: 16px;">Top Off Assets</span>
                </div>
              </div>

              <!-- Tank capacity 2x2 grid -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 4px; padding: 4px 6px; background: #333333; border-radius: 4px; width: 32px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #E15252; flex-shrink: 0;"></div>
                  <span style="color: #E5E5E5; font-size: 12px; font-weight: 400; line-height: 1;">${thresholdCounts.red}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; padding: 4px 6px; background: #333333; border-radius: 4px; width: 32px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #FDE68A; flex-shrink: 0;"></div>
                  <span style="color: #E5E5E5; font-size: 12px; font-weight: 400; line-height: 1;">${thresholdCounts.yellow}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; padding: 4px 6px; background: #333333; border-radius: 4px; width: 32px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #69BF88; flex-shrink: 0;"></div>
                  <span style="color: #E5E5E5; font-size: 12px; font-weight: 400; line-height: 1;">${thresholdCounts.green}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; padding: 4px 6px; background: #333333; border-radius: 4px; width: 32px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #60A5FA; flex-shrink: 0;"></div>
                  <span style="color: #E5E5E5; font-size: 12px; font-weight: 400; line-height: 1;">${thresholdCounts.blue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
