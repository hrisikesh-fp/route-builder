// Node.js script to fetch and parse the Hub CSV data
// Run this with: node scripts/generate-hub-data.js

const https = require("https")

const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PILOT%20DATASHEET%20-%20Buffalo%20Biodiesel%20-%20Hubs-UZOAt3HZzIEEU2e8rOEj3C2lWjTZEs.csv"

// Fetch the CSV
https
  .get(CSV_URL, (res) => {
    let data = ""

    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      console.log("CSV Data:")
      console.log(data)
      console.log("\n\nParsed Hubs:")

      // Parse CSV
      const lines = data.trim().split("\n")
      const headers = lines[0].split(",")

      const hubs = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",")
        const hub = {
          name: values[0]?.trim(),
          erpId: values[1]?.trim(),
          address: values[2]?.trim(),
        }
        hubs.push(hub)
        console.log(`${i}. ${hub.name} (ERP: ${hub.erpId}) - ${hub.address}`)
      }

      console.log(`\n\nTotal Hubs: ${hubs.length}`)
    })
  })
  .on("error", (err) => {
    console.error("Error fetching CSV:", err)
  })
