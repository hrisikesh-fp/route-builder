export type FleetTruckItem = {
  id: string
  name: string
  badge: string
  capacity: string
  compartments: string
  productNames: string[]
}

export type FleetTruckGroup = { hub: string; trucks: FleetTruckItem[] }

export const FLEET_TRUCK_GROUPS: FleetTruckGroup[] = [
  {
    hub: "Austin Hub",
    trucks: [
      { id: "H-138", name: "H-138 - 2019 Polar Transport Trailer 9,500 gal", badge: "Truck", capacity: "4,500 gal", compartments: "11 Compartments", productNames: ["Clear Diesel", "Regular Unleaded", "Premium Unleaded"] },
      { id: "H-401", name: "H-401 - 2023 Volvo VNL 860 Tanker", badge: "Tank Wagon", capacity: "6,200 gal", compartments: "6 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
      { id: "H-415", name: "H-415 - 2022 Kenworth W990 Flatbed", badge: "Truck", capacity: "5,800 gal", compartments: "5 Compartments", productNames: ["Regular Unleaded", "Premium Unleaded"] },
      { id: "H-450", name: "H-450 - 2023 International LT Tanker", badge: "Truck", capacity: "5,000 gal", compartments: "4 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Kerosene"] },
    ],
  },
  {
    hub: "Corpus Christi Hub",
    trucks: [
      { id: "H-495", name: "H-495 - 2021 Kenworth T680 Tanker", badge: "Truck", capacity: "5,200 gal", compartments: "5 Compartments", productNames: ["Regular Unleaded", "Premium Unleaded", "Clear Diesel"] },
      { id: "H-502", name: "H-502 - 2020 Volvo VNR 400 Tank Wagon", badge: "Tank Wagon", capacity: "4,000 gal", compartments: "3 Compartments", productNames: ["Dyed Diesel", "Kerosene"] },
      { id: "H-517", name: "H-517 - 2023 Peterbilt 389 Tanker", badge: "Tank Wagon", capacity: "5,600 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Regular Unleaded", "Ethanol"] },
      { id: "H-428", name: "H-428 - 2021 Peterbilt 579 Box Truck", badge: "Box Truck", capacity: "4,800 gal", compartments: "4 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
      { id: "H-538", name: "H-538 - 2022 International HV Tanker", badge: "Truck", capacity: "5,100 gal", compartments: "4 Compartments", productNames: ["Premium Unleaded", "Regular Unleaded", "Kerosene"] },
    ],
  },
  {
    hub: "San Antonio Hub",
    trucks: [
      { id: "H-544", name: "H-544 - 2019 Freightliner Cascadia Tank", badge: "Tank Wagon", capacity: "4,700 gal", compartments: "4 Compartments", productNames: ["Red Diesel", "Clear Diesel"] },
      { id: "H-575", name: "H-575 - 2020 Western Star 5700XE Tank", badge: "Tank Wagon", capacity: "5,300 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
      { id: "H-589", name: "H-589 - 2021 Volvo FH16 Tanker", badge: "Truck", capacity: "6,000 gal", compartments: "6 Compartments", productNames: ["Clear Diesel", "Premium Unleaded", "Ethanol"] },
      { id: "H-602", name: "H-602 - 2022 Peterbilt 567 Flatbed", badge: "Truck", capacity: "4,400 gal", compartments: "4 Compartments", productNames: ["Regular Unleaded", "Red Diesel"] },
    ],
  },
  {
    hub: "Others",
    trucks: [
      { id: "H-433", name: "H-433 - 2020 Mack Anthem Tanker", badge: "Tank Wagon", capacity: "5,400 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Dyed Diesel"] },
      { id: "H-467", name: "H-467 - 2019 Western Star 4900 Tank", badge: "Tank Wagon", capacity: "4,500 gal", compartments: "4 Compartments", productNames: ["Kerosene", "Regular Unleaded"] },
      { id: "H-480", name: "H-480 - 2022 Freightliner M2 Box", badge: "Box Truck", capacity: "3,800 gal", compartments: "3 Compartments", productNames: ["Clear Diesel", "Premium Unleaded"] },
      { id: "H-523", name: "H-523 - 2021 Mack Granite Box Truck", badge: "Box Truck", capacity: "4,200 gal", compartments: "4 Compartments", productNames: ["Dyed Diesel", "Regular Unleaded"] },
      { id: "H-561", name: "H-561 - 2023 Kenworth T880 Box Truck", badge: "Box Truck", capacity: "3,600 gal", compartments: "3 Compartments", productNames: ["Red Diesel", "Clear Diesel"] },
      { id: "H-618", name: "H-618 - 2023 Mack Pinnacle Tank Wagon", badge: "Tank Wagon", capacity: "5,500 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Regular Unleaded", "Ethanol"] },
      { id: "H-625", name: "H-625 - 2020 International LoneStar", badge: "Truck", capacity: "4,900 gal", compartments: "4 Compartments", productNames: ["Premium Unleaded", "Kerosene"] },
      { id: "H-640", name: "H-640 - 2021 Kenworth W900 Tanker", badge: "Tank Wagon", capacity: "5,700 gal", compartments: "5 Compartments", productNames: ["Clear Diesel", "Dyed Diesel", "Regular Unleaded"] },
    ],
  },
]

export function getFleetTruckCount(): number {
  return FLEET_TRUCK_GROUPS.reduce((sum, g) => sum + g.trucks.length, 0)
}

export function getFleetHubCount(): number {
  return FLEET_TRUCK_GROUPS.length
}
