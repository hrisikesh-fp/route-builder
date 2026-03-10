export type InfrastructureType = "Hub" | "Bulk Plant (Fuel)" | "Bulk Plant (Lube)" | "Warehouse" | "Terminal"

export interface Infrastructure {
  id: string
  name: string
  type: InfrastructureType
  address: string
  latitude: number
  longitude: number
  lineOfService: string
}

export interface InfrastructureCluster {
  latitude: number
  longitude: number
  items: Infrastructure[]
  primaryItem: Infrastructure // The "main" item shown in the cluster (Hub takes priority)
}

// Base1 Infrastructure - Austin, TX region
export const base1Infrastructure: Infrastructure[] = [
  {
    id: "inf-1",
    name: "Flint Hills - Johnny Morris",
    type: "Terminal",
    address: "7501 Johnny Morris Road, Austin, TX",
    latitude: 30.3271,
    longitude: -97.6198,
    lineOfService: "Fuel",
  },
  {
    id: "inf-2",
    name: "Valero Taylor",
    type: "Terminal",
    address: "3100 N Main Street, Taylor, TX",
    latitude: 30.5912,
    longitude: -97.4092,
    lineOfService: "Fuel",
  },
  {
    id: "inf-3",
    name: "Magellan Round Rock",
    type: "Terminal",
    address: "1500 Gattis School Road, Round Rock, TX",
    latitude: 30.5234,
    longitude: -97.6789,
    lineOfService: "Fuel",
  },
  {
    id: "inf-4",
    name: "Austin Hub",
    type: "Hub",
    address: "4500 S Congress Avenue, Austin, TX",
    latitude: 30.1894,
    longitude: -97.7544,
    lineOfService: "Fuel + Lubes",
  },
  {
    id: "inf-5",
    name: "Austin Fuel Island",
    type: "Bulk Plant (Fuel)",
    address: "4500 S Congress Avenue, Austin, TX",
    latitude: 30.1894,
    longitude: -97.7544,
    lineOfService: "Fuel",
  },
  {
    id: "inf-6",
    name: "Georgetown Fuel Depot",
    type: "Bulk Plant (Fuel)",
    address: "500 Industrial Boulevard, Georgetown, TX",
    latitude: 30.6478,
    longitude: -97.6773,
    lineOfService: "Fuel",
  },
  {
    id: "inf-7",
    name: "Round Rock Storage",
    type: "Bulk Plant (Lube)",
    address: "2200 N Mays Street, Round Rock, TX",
    latitude: 30.5289,
    longitude: -97.6645,
    lineOfService: "Lubes",
  },
  {
    id: "inf-8",
    name: "Cedar Park Warehouse",
    type: "Warehouse",
    address: "1800 E Whitestone Boulevard, Cedar Park, TX",
    latitude: 30.5156,
    longitude: -97.7934,
    lineOfService: "Lubes (Packaged)",
  },
  {
    id: "inf-9",
    name: "Austin Lube Warehouse",
    type: "Warehouse",
    address: "4500 S Congress Avenue, Austin, TX",
    latitude: 30.1894,
    longitude: -97.7544,
    lineOfService: "Lubes (Packaged)",
  },
  {
    id: "inf-10",
    name: "Pflugerville DEF Storage",
    type: "Warehouse",
    address: "1200 W Pecan Street, Pflugerville, TX",
    latitude: 30.4521,
    longitude: -97.6234,
    lineOfService: "Lubes (Packaged)",
  },
]

// Priority order for determining primary item in clusters
const typePriority: Record<InfrastructureType, number> = {
  "Hub": 1,
  "Bulk Plant (Fuel)": 2,
  "Bulk Plant (Lube)": 3,
  "Warehouse": 4,
  "Terminal": 5,
}

// Group infrastructure items by location (same coordinates)
export function clusterInfrastructure(items: Infrastructure[]): InfrastructureCluster[] {
  const locationMap = new Map<string, Infrastructure[]>()

  items.forEach((item) => {
    const key = `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`
    if (!locationMap.has(key)) {
      locationMap.set(key, [])
    }
    locationMap.get(key)!.push(item)
  })

  return Array.from(locationMap.entries()).map(([, clusterItems]) => {
    // Sort by priority to get the primary item
    const sorted = [...clusterItems].sort(
      (a, b) => typePriority[a.type] - typePriority[b.type]
    )
    
    return {
      latitude: clusterItems[0].latitude,
      longitude: clusterItems[0].longitude,
      items: clusterItems,
      primaryItem: sorted[0],
    }
  })
}

// Get infrastructure color by type
export function getInfrastructureColor(type: InfrastructureType): string {
  switch (type) {
    case "Hub":
      return "#3B82F6" // Blue
    case "Bulk Plant (Fuel)":
    case "Bulk Plant (Lube)":
      return "#22D3EE" // Cyan
    case "Warehouse":
      return "#92400E" // Brown
    case "Terminal":
      return "#EC4899" // Pink
    default:
      return "#6B7280" // Gray fallback
  }
}
