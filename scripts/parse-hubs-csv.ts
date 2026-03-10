// Script to fetch, parse, and geocode the Hubs CSV data
const csvUrl =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PILOT%20DATASHEET%20-%20Buffalo%20Biodiesel%20-%20Hubs-UZOAt3HZzIEEU2e8rOEj3C2lWjTZEs.csv"

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`, {
      headers: {
        "User-Agent": "RouteBuilderApp/1.0",
      },
    })
    const data = await response.json()

    if (data && data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      }
    }
    return null
  } catch (error) {
    console.error(`[v0] Error geocoding address "${address}":`, error)
    return null
  }
}

async function parseHubsCSV() {
  console.log("[v0] Fetching Hubs CSV data...")

  try {
    const response = await fetch(csvUrl)
    const csvText = await response.text()

    console.log("[v0] CSV Data received")

    // Parse CSV
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",")

    console.log("[v0] Headers:", headers)
    console.log("[v0] Total rows:", lines.length - 1)

    const hubsData = lines.slice(1).map((line) => {
      const values = line.split(",")
      return {
        name: values[0]?.trim() || "",
        erpId: Number.parseInt(values[1]?.trim() || "0"),
        address: values[2]?.trim() || "",
      }
    })

    console.log("[v0] Parsed", hubsData.length, "hubs from CSV")

    console.log("[v0] Starting geocoding process...")
    const hubs = []

    for (let i = 0; i < hubsData.length; i++) {
      const hub = hubsData[i]
      console.log(`[v0] Geocoding ${i + 1}/${hubsData.length}: ${hub.name} - ${hub.address}`)

      const coords = await geocodeAddress(hub.address)

      if (coords) {
        hubs.push({
          id: `hub-${hub.erpId}`,
          name: hub.name,
          erpId: hub.erpId,
          address: hub.address,
          latitude: coords.lat,
          longitude: coords.lng,
          zoneId: "zone-1", // Default zone, can be updated later
        })
        console.log(`[v0] ✓ Geocoded: ${coords.lat}, ${coords.lng}`)
      } else {
        console.log(`[v0] ✗ Failed to geocode: ${hub.address}`)
      }

      // Add delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log("[v0] Successfully geocoded", hubs.length, "out of", hubsData.length, "hubs")
    console.log("[v0] Final Hub Data:")
    console.log(JSON.stringify(hubs, null, 2))

    return hubs
  } catch (error) {
    console.error("[v0] Error processing CSV:", error)
    return []
  }
}

parseHubsCSV()
