// Route data from base1 CSVs
// Each route has stops with sequence numbers for delivery orders

export type OrderType = "Delivery" | "Delivery (Internal)" | "Extraction" | "Load" | "Transfer In" | "Transfer Out" | "Hub"
export type TankThreshold = "red" | "yellow" | "green" | "blue" // blue = NA (no tank monitor)
export type Product = "Clear" | "Dyed" | "DEF" | "Mixed" | "Clear, Dyed" | "Clear, Dyed, DEF"

export interface RouteStop {
  sequence: number | string // number for deliveries, letter (A, B, C...) for operational stops
  type: OrderType
  name: string
  address: string
  latitude: number
  longitude: number
  volume?: number // gallons, undefined for hub stops
  product?: Product
  notes?: string
  tankThreshold?: TankThreshold // only for delivery/extraction orders
}

export interface Route {
  id: string
  name: string
  color: string // hex color for route line
  driverName?: string
  stops: RouteStop[]
}

// Route colors matching Figma design
export const routeColors = {
  purple: "#C084FC",
  orange: "#FB923C",
  blue: "#3B82F6",
  pink: "#EC4899",
  red: "#EF4444",
}

// Tank threshold badge colors
export const tankThresholdColors: Record<TankThreshold, string> = {
  red: "#AA3C3C",    // High/urgent
  yellow: "#CEA655", // Medium
  green: "#71B78A",  // Low/healthy
  blue: "#3759A3",   // NA (no tank monitor)
}

// Austin Hub - all routes start and end here
const austinHub = {
  name: "Austin Hub",
  address: "5501 Hub Dr, Austin, TX 78724",
  latitude: 30.1894,
  longitude: -97.7544,
}

// Terminals
const terminals = {
  flintHills: { name: "Flint Hills - Johnny Morris", address: "2727 Johnny Morris Rd, Austin, TX 78724", latitude: 30.3106, longitude: -97.6447 },
  valeroTaylor: { name: "Valero Taylor", address: "3100 E 4th St, Taylor, TX 76574", latitude: 30.5732, longitude: -97.4016 },
  magellanRoundRock: { name: "Magellan Round Rock", address: "1150 N IH 35, Round Rock, TX 78664", latitude: 30.5308, longitude: -97.6642 },
}

// Bulk Plants
const bulkPlants = {
  austinFuelIsland: { name: "Austin Fuel Island", address: "5501 Hub Dr, Austin, TX 78724", latitude: 30.1894, longitude: -97.7544 },
  georgetownFuelDepot: { name: "Georgetown Fuel Depot", address: "4200 Williams Dr, Georgetown, TX 78628", latitude: 30.6478, longitude: -97.7228 },
  roundRockStorage: { name: "Round Rock Storage", address: "2100 N Mays St, Round Rock, TX 78664", latitude: 30.5234, longitude: -97.6789 },
}

// Warehouses
const warehouses = {
  cedarParkWarehouse: { name: "Cedar Park Warehouse", address: "850 N Bell Blvd, Cedar Park, TX 78613", latitude: 30.5052, longitude: -97.8203 },
  austinLubeWarehouse: { name: "Austin Lube Warehouse", address: "5501 Hub Dr, Austin, TX 78724", latitude: 30.1894, longitude: -97.7544 },
}

// Route 1 - Purple (9 orders including Hub stops)
export const route1Purple: Route = {
  id: "route-1",
  name: "Route 1",
  color: routeColors.purple,
  driverName: "Mark Ruffalo",
  stops: [
    { sequence: "A", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "Start of day" },
    { sequence: "B", type: "Transfer Out", name: bulkPlants.austinFuelIsland.name, address: bulkPlants.austinFuelIsland.address, latitude: bulkPlants.austinFuelIsland.latitude, longitude: bulkPlants.austinFuelIsland.longitude, volume: 500, product: "DEF", notes: "Transfer DEF to Austin Fuel Island" },
    { sequence: "C", type: "Load", name: terminals.flintHills.name, address: terminals.flintHills.address, latitude: terminals.flintHills.latitude, longitude: terminals.flintHills.longitude, volume: 4000, product: "Clear, Dyed", notes: "Load fuel for deliveries" },
    { sequence: 1, type: "Delivery", name: "QuickFuel Station #1", address: "8900 Research Blvd, Austin, TX 78758", latitude: 30.3876, longitude: -97.7270, volume: 800, product: "Clear", tankThreshold: "red" },
    { sequence: 2, type: "Delivery", name: "FastGas #23", address: "15201 N IH 35, Pflugerville, TX 78660", latitude: 30.4671, longitude: -97.6200, volume: 600, product: "Dyed", tankThreshold: "yellow" },
    { sequence: 3, type: "Delivery", name: "TravelStop North", address: "2001 S IH 35, Round Rock, TX 78681", latitude: 30.5083, longitude: -97.6789, volume: 1200, product: "Clear, Dyed", tankThreshold: "green" },
    { sequence: 4, type: "Delivery", name: "Pilot Station Georgetown", address: "501 N Austin Ave, Georgetown, TX 78626", latitude: 30.6328, longitude: -97.6783, volume: 500, product: "Clear", tankThreshold: "blue" },
    { sequence: 5, type: "Delivery", name: "Ranch Supply Co", address: "3300 Williams Dr, Georgetown, TX 78628", latitude: 30.6578, longitude: -97.7012, volume: 400, product: "Dyed", tankThreshold: "red" },
    { sequence: 6, type: "Delivery", name: "Hill Country Fuel", address: "1100 N Hwy 183, Leander, TX 78641", latitude: 30.5789, longitude: -97.8534, volume: 500, product: "Clear", tankThreshold: "yellow" },
    { sequence: "D", type: "Transfer In", name: bulkPlants.georgetownFuelDepot.name, address: bulkPlants.georgetownFuelDepot.address, latitude: bulkPlants.georgetownFuelDepot.latitude, longitude: bulkPlants.georgetownFuelDepot.longitude, volume: 300, product: "Dyed", notes: "Pick up Dyed from Georgetown" },
    { sequence: "E", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "End of day" },
  ],
}

// Route 2 - Orange (8 orders)
export const route2Orange: Route = {
  id: "route-2",
  name: "Route 2",
  color: routeColors.orange,
  driverName: "Dwayne Johnson",
  stops: [
    { sequence: "A", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "Start of day" },
    { sequence: "B", type: "Load", name: terminals.valeroTaylor.name, address: terminals.valeroTaylor.address, latitude: terminals.valeroTaylor.latitude, longitude: terminals.valeroTaylor.longitude, volume: 5000, product: "Clear, Dyed, DEF", notes: "Full load for route" },
    { sequence: 1, type: "Delivery", name: "Flying J Taylor", address: "3200 N Main St, Taylor, TX 76574", latitude: 30.5832, longitude: -97.4116, volume: 1000, product: "Clear, Dyed", tankThreshold: "red" },
    { sequence: 2, type: "Delivery", name: "Central Texas Fuel", address: "4501 E Hwy 79, Hutto, TX 78634", latitude: 30.5378, longitude: -97.5289, volume: 600, product: "Clear", tankThreshold: "green" },
    { sequence: 3, type: "Delivery", name: "Pflugerville Quick Stop", address: "1200 W Pecan St, Pflugerville, TX 78660", latitude: 30.4412, longitude: -97.6234, volume: 800, product: "Dyed", tankThreshold: "yellow" },
    { sequence: 4, type: "Delivery", name: "Manor Fuel Depot", address: "600 W Main St, Manor, TX 78653", latitude: 30.3412, longitude: -97.5567, volume: 500, product: "Clear", tankThreshold: "blue" },
    { sequence: 5, type: "Delivery", name: "East Austin Gas", address: "7800 E Ben White Blvd, Austin, TX 78741", latitude: 30.2267, longitude: -97.6823, volume: 700, product: "Clear, Dyed", tankThreshold: "red" },
    { sequence: 6, type: "Delivery", name: "Airport Fuel Services", address: "3600 Presidential Blvd, Austin, TX 78719", latitude: 30.1989, longitude: -97.6656, volume: 900, product: "Clear", tankThreshold: "green" },
    { sequence: 7, type: "Delivery", name: "South Congress Fuel", address: "5500 S Congress Ave, Austin, TX 78745", latitude: 30.2189, longitude: -97.7789, volume: 500, product: "DEF", tankThreshold: "yellow" },
    { sequence: "C", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "End of day" },
  ],
}

// Route 3 - Blue (6 orders)
export const route3Blue: Route = {
  id: "route-3",
  name: "Route 3",
  color: routeColors.blue,
  driverName: "Jessica Harper",
  stops: [
    { sequence: "A", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "Start of day" },
    { sequence: "B", type: "Load", name: terminals.magellanRoundRock.name, address: terminals.magellanRoundRock.address, latitude: terminals.magellanRoundRock.latitude, longitude: terminals.magellanRoundRock.longitude, volume: 3500, product: "Clear, Dyed", notes: "Primary load" },
    { sequence: "C", type: "Transfer In", name: bulkPlants.georgetownFuelDepot.name, address: bulkPlants.georgetownFuelDepot.address, latitude: bulkPlants.georgetownFuelDepot.latitude, longitude: bulkPlants.georgetownFuelDepot.longitude, volume: 500, product: "DEF", notes: "Pick up DEF" },
    { sequence: 1, type: "Delivery", name: "Georgetown Express", address: "901 W University Ave, Georgetown, TX 78626", latitude: 30.6328, longitude: -97.6912, volume: 800, product: "Clear", tankThreshold: "green" },
    { sequence: 2, type: "Delivery", name: "Sun City Fuel", address: "1600 Sun City Blvd, Georgetown, TX 78633", latitude: 30.6789, longitude: -97.7234, volume: 600, product: "Dyed", tankThreshold: "yellow" },
    { sequence: "D", type: "Transfer Out", name: bulkPlants.roundRockStorage.name, address: bulkPlants.roundRockStorage.address, latitude: bulkPlants.roundRockStorage.latitude, longitude: bulkPlants.roundRockStorage.longitude, volume: 400, product: "Clear", notes: "Drop excess Clear" },
    { sequence: 3, type: "Delivery", name: "Round Rock Speedway", address: "2800 N Mays St, Round Rock, TX 78665", latitude: 30.5412, longitude: -97.6567, volume: 700, product: "Clear", tankThreshold: "red" },
    { sequence: 4, type: "Delivery", name: "Tech Ridge Fuel", address: "12901 N Lamar Blvd, Austin, TX 78753", latitude: 30.4278, longitude: -97.6823, volume: 500, product: "DEF", tankThreshold: "blue" },
    { sequence: "E", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "End of day" },
  ],
}

// Route 4 - Pink (8 orders)
export const route4Pink: Route = {
  id: "route-4",
  name: "Route 4",
  color: routeColors.pink,
  driverName: "Kyle Reese",
  stops: [
    { sequence: "A", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "Start of day" },
    { sequence: "B", type: "Transfer Out", name: bulkPlants.austinFuelIsland.name, address: bulkPlants.austinFuelIsland.address, latitude: bulkPlants.austinFuelIsland.latitude, longitude: bulkPlants.austinFuelIsland.longitude, volume: 600, product: "Mixed", notes: "Transfer Mixed to Fuel Island" },
    { sequence: 1, type: "Delivery", name: "West Lake Fuel", address: "3500 Bee Caves Rd, West Lake Hills, TX 78746", latitude: 30.3012, longitude: -97.8234, volume: 800, product: "Clear", tankThreshold: "red" },
    { sequence: 2, type: "Delivery", name: "Lakeway Marina", address: "101 Lakeway Dr, Austin, TX 78734", latitude: 30.3656, longitude: -97.9789, volume: 500, product: "Clear", tankThreshold: "yellow" },
    { sequence: 3, type: "Delivery (Internal)", name: warehouses.cedarParkWarehouse.name, address: warehouses.cedarParkWarehouse.address, latitude: warehouses.cedarParkWarehouse.latitude, longitude: warehouses.cedarParkWarehouse.longitude, volume: 400, product: "DEF", notes: "Internal transfer to warehouse", tankThreshold: "green" },
    { sequence: 4, type: "Delivery", name: "Leander Quick Fuel", address: "700 Crystal Falls Pkwy, Leander, TX 78641", latitude: 30.5678, longitude: -97.8523, volume: 600, product: "Dyed", tankThreshold: "blue" },
    { sequence: 5, type: "Delivery", name: "Cedar Park Express", address: "1400 E Whitestone Blvd, Cedar Park, TX 78613", latitude: 30.5123, longitude: -97.7856, volume: 700, product: "Clear", tankThreshold: "red" },
    { sequence: "C", type: "Transfer In", name: bulkPlants.roundRockStorage.name, address: bulkPlants.roundRockStorage.address, latitude: bulkPlants.roundRockStorage.latitude, longitude: bulkPlants.roundRockStorage.longitude, volume: 300, product: "Dyed", notes: "Pick up Dyed from storage" },
    { sequence: "D", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "End of day" },
  ],
}

// Route 5 - Red (5 orders)
export const route5Red: Route = {
  id: "route-5",
  name: "Route 5",
  color: routeColors.red,
  driverName: "Forrest Gump",
  stops: [
    { sequence: "A", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "Start of day - pre-loaded" },
    { sequence: 1, type: "Delivery", name: "Bastrop County Co-op", address: "1200 Hwy 71 W, Bastrop, TX 78602", latitude: 30.1234, longitude: -97.3156, volume: 1000, product: "Dyed", tankThreshold: "red" },
    { sequence: 2, type: "Delivery", name: "Elgin Farm Supply", address: "400 N Main St, Elgin, TX 78621", latitude: 30.3512, longitude: -97.3734, volume: 800, product: "Dyed", tankThreshold: "yellow" },
    { sequence: 3, type: "Delivery", name: "Lockhart Fuel Stop", address: "1500 S Colorado St, Lockhart, TX 78644", latitude: 29.8756, longitude: -97.6712, volume: 600, product: "Clear", tankThreshold: "green" },
    { sequence: 4, type: "Delivery", name: "San Marcos Travel Center", address: "4500 IH 35 S, San Marcos, TX 78666", latitude: 29.8389, longitude: -97.9412, volume: 900, product: "Clear, Dyed", tankThreshold: "blue" },
    { sequence: 5, type: "Delivery", name: "Kyle Fuel Mart", address: "200 N Main St, Kyle, TX 78640", latitude: 30.0012, longitude: -97.8623, volume: 500, product: "Clear", tankThreshold: "red" },
    { sequence: "B", type: "Load", name: terminals.flintHills.name, address: terminals.flintHills.address, latitude: terminals.flintHills.latitude, longitude: terminals.flintHills.longitude, volume: 4500, product: "Clear, Dyed", notes: "Pre-load for tomorrow" },
    { sequence: "C", type: "Hub", name: austinHub.name, address: austinHub.address, latitude: austinHub.latitude, longitude: austinHub.longitude, notes: "End of day" },
  ],
}

// All routes
export const allRoutes: Route[] = [route1Purple, route2Orange, route3Blue, route4Pink, route5Red]

// Helper to get only delivery orders from a route (for map pins)
export function getDeliveryOrders(route: Route) {
  return route.stops.filter(
    (stop) => stop.type === "Delivery" || stop.type === "Delivery (Internal)" || stop.type === "Extraction"
  )
}

// Get all delivery orders across all routes
export function getAllDeliveryOrders() {
  return allRoutes.flatMap((route) =>
    getDeliveryOrders(route).map((stop) => ({
      ...stop,
      routeId: route.id,
      routeColor: route.color,
      driverName: route.driverName,
    }))
  )
}
