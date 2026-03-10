export async function GET() {
  const token = 'pk.eyJ1IjoieWFrc2gyMDAwIiwiYSI6ImNtZ3E3eXM5aTA0eGEybHNjNmdzZHVkZjkifQ.-9KlHTGdncbA9JPnxCcQRQ'
  if (token) {
    // Mapbox Dark style
    return Response.json({
      isMapbox: true,
      token,
      tileUrl: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${token}`,
      tileOptions: {
        attribution:
          '© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        tileSize: 512,
        zoomOffset: -1,
      },
    })
  }

  // Fallback to OpenStreetMap when no token is configured
  return Response.json({
    isMapbox: false,
    tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    tileOptions: {
      attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      maxZoom: 19,
    },
  })
}
