"use client"

import { Truck as TruckIcon } from "lucide-react"
import type { TruckCapacityProfile, FuelProduct } from "@/lib/truck-data"

const PRODUCT_LABEL: Record<string, string> = {
  "200*DIESEL-OFFROAD RED": "Diesel-Offroad RED",
  "200*DIESEL-ONROAD CLEAR": "Diesel-Offroad CLR",
  "87 OCT W/ 10% ETH": "Gas",
  "ULSD CLEAR DIESEL": "ULSD",
  "DEF PACKAGED": "DEF",
}

function Dot() {
  return (
    <span
      style={{
        width: 4,
        height: 4,
        borderRadius: 999,
        backgroundColor: "#737373",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  )
}

export function TruckInfoCard({
  truckName,
  truckProfile,
}: {
  truckName: string
  truckProfile: TruckCapacityProfile
}) {
  const productsOnTruck = Object.keys(truckProfile.productCapacities) as FuelProduct[]
  const compartmentCount = truckProfile.compartments.length
  const truckProductsText = productsOnTruck.map((p) => PRODUCT_LABEL[p] ?? p).join(", ")

  return (
    <div
      style={{
        backgroundColor: "#282828",
        borderRadius: 4,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <TruckIcon size={16} color="#FFFFFF" />
        <span style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 500, lineHeight: "24px" }}>
          {truckName}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          fontSize: 14,
          lineHeight: "20px",
        }}
      >
        <span style={{ color: "#A3A3A3" }}>{truckProfile.totalCapacity.toLocaleString()} gal</span>
        <Dot />
        <span style={{ color: "#A3A3A3" }}>{compartmentCount} Compartments</span>
        <Dot />
        <span>
          <span style={{ color: "#737373" }}>{productsOnTruck.length} Products: </span>
          <span style={{ color: "#A3A3A3" }}>{truckProductsText}</span>
        </span>
      </div>
    </div>
  )
}
