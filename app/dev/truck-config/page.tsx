import { TruckConfigEditor } from "@/components/truck-config-editor"
import { MOCK_TRUCK_CONFIG } from "@/lib/truck-config-data"

/** Dev-only preview — open /dev/truck-config to inspect the new Truck Config screen */
export default function DevTruckConfigPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#141414" }}>
      <TruckConfigEditor initial={MOCK_TRUCK_CONFIG} />
    </div>
  )
}
