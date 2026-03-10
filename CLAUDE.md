# Route Builder — Full Project Context

> **Note to Claude Code:** This document covers what has been built and the immediate next steps. However, product decisions, design intent, and interaction details beyond what's documented here should be confirmed with the user before implementation. When in doubt, ask.

---

## What this product is

A **fuel logistics route-builder tool** used by dispatchers at a fuel distribution company (Fuel Panda). Dispatchers:
1. View a map showing all delivery orders, existing routes, and infrastructure (hubs, terminals, bulk plants)
2. Filter orders by location, customer, driver, order type/status, tank threshold
3. Select orders manually (lasso tool) or view existing routes
4. Create new routes by assigning a truck + trailer(s) + sequence of delivery stops
5. Publish routes for drivers

---

## Project setup

**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, pnpm
**Map:** MUST USE Mapbox GL JS (v3.15.0, already in package.json) — replace current Leaflet.js implementation
**Mapbox token:** `pk.eyJ1IjoieWFrc2gyMDAwIiwiYSI6ImNtZ3E3eXM5aTA0eGEybHNjNmdzZHVkZjkifQ.-9KlHTGdncbA9JPnxCcQRQ` (hardcoded in `app/api/map-config/route.tsx`)
**Package manager:** pnpm

**To run:**
```bash
cd /Users/hrisikeshmedhi/Projects/route-builder
pnpm install
# Create .env.local with: NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
pnpm dev
```

**Source of the code:** Copied from `/Users/hrisikeshmedhi/Projects/v0/phase-1-2-and-beyond/`
**Prototype reference:** `/Users/hrisikeshmedhi/Projects/figma-mcp-trial/route-builder.html` — single-file HTML/CSS/JS with the working truck/trailer combobox UI (V1/V2/V3 variations)

---

## App layout

```
┌─────────────────────────────────────────────────────┐
│  TopNav (MapHeader) — 68px tall, fixed              │
├──────────┬──────────────────────────┬───────────────┤
│  Filter  │                          │  Route List   │
│  Sheet   │        Map               │  Sheet        │
│  (left)  │     (full screen)        │  (right)      │
│  320px   │                          │  450px        │
│          │   [Map Controls]         │               │
│          │   floating right side    │               │
└──────────┴──────────────────────────┴───────────────┘
```

When "Create Route" is clicked, the Route List Sheet slides away and the **Create Route Panel** slides in from the right (also 450px).

The **Lasso Workspace Sheet** (400px) appears on the right when lasso selection is active, replacing other right panels.

---

## Components — what each does

### `components/map-header.tsx` — Top navigation bar
- **Left:** Logo + "Route Builder" title + "Back to Dispatch" link
- **Right:** Date selector (shows tomorrow's date) + Profile avatar (HM initials) with dropdown
- Profile dropdown: Edit Profile, Change Password, Settings (opens SettingsModal), 2FA, Logout
- Height: 68px. `z-index: 1001`

### `components/filter-side-sheet.tsx` — Left filter panel
- Width: 320px. Slides in from left (`translate-x-0` / `-translate-x-full`)
- **Header:** "Filters" title + active filter count badge + "Clear All" button
- **Collapse trigger:** A small tab button on the RIGHT edge of the sheet (not inside it), pointing left `←`. When sheet is open, this tab is visible. Clicking it closes the sheet.
- **Content sections:**
  - **Location** → City dropdown (multi-select with search, grouped by state, shows hub count per city, Apply/Cancel footer)
  - **Customer & ShipTo** → Customer dropdown + ShipTo dropdown (not yet functional)
  - **Driver Details** → Driver Group & Drivers dropdown (not yet functional)
  - **Order Type & Status** → Checkboxes: Delivery(34), Load(5), Transfer(7), Extraction(0) + Scheduled(37), Unassigned(9)
  - **Assets** → Tank Threshold checkboxes: High (red), Medium (yellow), Low (green), NA (blue) with counts
- **Footer:** Shows total routes count + total orders count
- Active filter count is tracked and shown as a blue badge

### `components/filter-sheet-collapsed.tsx` — Collapsed state of filter sheet
- A small collapsed tab shown on the left edge when filter sheet is closed
- Shows applied filter count, clicking it re-opens the filter sheet

### `components/route-list-sheet.tsx` — Right route list panel
- Width: 450px. Slides in from right.
- **Header:** "Showing N Routes from Map area" + X close button
- **Filter tabs:** All / Scheduled / Incomplete (with counts)
- **Route cards:** Each shows route name, driver name, status badge (Scheduled=white, Incomplete=orange), start hub → N orders → end hub progress bar, arrow button
- **Footer CTA:** "Create Route" button (white, full width) → opens CreateRoutePanel
- **Collapse trigger:** A small tab on the LEFT edge of the sheet, pointing right `→`, positioned at vertical center

### `components/route-sheet-collapsed.tsx` — Collapsed state of route list
- Small tab on the right edge when route list is closed, clicking re-opens it

### `components/create-route-panel.tsx` — Create new route (RIGHT SIDE PANEL)
- Width: 450px. Slides in from right, replaces route list sheet.
- **Currently incomplete** — only has: Route Name input + "Select a Zone" dropdown + "Start Creating a Route" CTA button
- **What needs to be added:** The full truck + trailer combobox (V3 design from prototype)
- **Full intended content:** Route Name → Zone → Truck + Trailer selection → Order list with sequence → Time estimates

### `components/route-map.tsx` — The map (full screen, behind everything)
- Uses Leaflet.js as the map renderer
- Shows ship-to location pins (clustered), infrastructure markers (hubs/terminals/bulk plants/warehouses), and route polylines
- Entity visibility controlled by `MapEntityVisibility` state from `MapControls`
- Exposes `window.__mapControls` for zoom/pan, `window.__zoomToCity`, `window.__zoomToRoute`
- `isLassoActive` prop disables map dragging when lasso tool is on

### `components/map-controls.tsx` — Floating map controls (right side)
- Floats on right side of map, adjusts `right` position based on which panels are open:
  - Workspace open: `right: 412px`
  - Create panel or route list open: `right: 462px`
  - Default (collapsed): `right: 56px`
- **Controls:** Map entities toggle (layers icon + dropdown), Zoom in/out, Compass/north reset, Lasso tool button
- **Map entities dropdown:** Toggles visibility of ShipTos (with/without orders), Hub, Bulk Plant, Warehouse, Terminals
- **Lasso button:** Orange when inactive, outlined orange when active

### `components/lasso-canvas.tsx` — Lasso selection overlay
- Full-screen canvas overlay that captures mouse/touch drag to draw a freehand polygon
- Active only when `isLassoActive=true`
- On completion (`mouseup`/`touchend`), calls `onSelectionComplete(polygon)` with screen coordinates
- Esc key cancels

### `components/lasso-workspace-sheet.tsx` — Lasso selection workspace (right panel)
- Width: 400px. Appears when lasso/route-click selection is active.
- **Empty state:** "Draw around orders on the map to select them" instructions
- **With selection:** Two tabs — "Driver Routes (N)" and "Unassigned Orders (N)"
  - Driver Routes: list of route groups, each with color bar, driver name, order count, checkbox
  - Unassigned Orders: individual order cards with tank level bar
  - Select all checkbox, hover on route highlights it on map
- **Footer:** "Publish Routes" button (indigo)

### `components/settings-modal.tsx` — Settings modal
- Opened from profile dropdown → Settings
- Content: (need to verify — not read yet)

### `components/infrastructure-marker.tsx` — Infrastructure map pins
- Renders Hub (blue square), Bulk Plant (cyan), Warehouse (brown), Terminal (pink) markers
- Used inside the map component

### `components/map-pin.tsx` — Order/ship-to map pins
- Renders delivery order pins with tank level color coding
- `data-order-id` attribute used by lasso selection to identify markers

---

## Development approach

- **Build things one by one**, guided by Figma designs
- **Figma is the source of truth** for UI/component design — NOT the V0 prototype
- V0 prototype code is useful for data/logic reference only
- **Figma MCP is configured** — use `get_figma_data` and `download_figma_images` to read designs directly
- **Figma design links:**
  - https://www.figma.com/design/tbb6l7lTDhlN0jFo7pYeJw/RB-10--Phase-1.3?node-id=2617-349268&t=FUr9DBaQHrRgFfUS-1
  - https://www.figma.com/design/tbb6l7lTDhlN0jFo7pYeJw/RB-10--Phase-1.3?node-id=2618-193536&t=FUr9DBaQHrRgFfUS-1

---

## Critical: Mapbox GL JS migration

The current map uses Leaflet.js with Mapbox raster tiles. This MUST be migrated to native Mapbox GL JS.

**Current Leaflet integration points (in `route-map.tsx`, 1214 lines):**
- `L.map()` initialization, `L.marker()` with `L.divIcon()` for custom HTML markers
- `L.polyline()` for route lines with OSRM-generated geometries
- `L.tileLayer()` for base maps, event handlers (zoomend, mouseover, click)
- Markers stored in refs: `markersRef`, `shipToMarkersRef`, `hubMarkersRef`
- Window globals: `window.__mapControls`, `window.__zoomToCity`, `window.__zoomToRoute`
- Lasso tool uses `data-order-id` attributes on Leaflet divIcon markers + `getBoundingClientRect()`

**Key files affected by Mapbox migration:**
- `components/route-map.tsx` — MAJOR rewrite (Leaflet → Mapbox GL JS)
- `components/lasso-canvas.tsx` — Minor (marker detection may change)
- `app/api/map-config/route.tsx` — Minor (style URL format)
- `components/map-pin.tsx` — Marker rendering approach changes
- `components/infrastructure-marker.tsx` — Marker rendering approach changes

**What stays the same:**
- All panel components (filter, route list, workspace, create route)
- OSRM route fetching logic
- Data models and mock data
- Map controls UI (just rewire to Mapbox API)

---

## Workspace sheet (right panel) — from Figma screenshots

The workspace sheet shows selected orders with two main views:

### Collapsed route cards view (all routes):
- Header: "45 Orders selected" + X close
- Tabs: "Driver Routes (5)" / "Unassigned Orders (9)"
- "Select All Routes" checkbox
- Each route card shows:
  - Driver avatar + name
  - Order count badge (e.g., "9 Orders")
  - Planned Qty (e.g., "4,000 gal")
  - Truck assignment (e.g., "Truck: H-118 · 2019 Kenworth Ta...")
  - Utilization indicator: under-utilized (yellow, e.g., "-1,000 gal") or over-utilized (yellow, e.g., "+900 gal")
  - Expand arrow + 3-dot menu
- Footer: "Publish Routes" blue button

### Expanded route card view (single route):
- Driver info at top (name, orders, planned qty, truck status)
- "Select Truck" dropdown
- Hub dropdown (e.g., "Austin HUB")
- Ordered stop list with:
  - Sequence number badge (1, 2, 3...)
  - Estimated time (5:45 AM, 06:30 AM...)
  - Stop name + type icon (L = Load, D = Delivery)
  - Planned Qty per stop
  - Checkbox + 3-dot menu per stop

---

## What needs to be built next

### Priority 1: Truck + Trailer combobox in `create-route-panel.tsx`
Port the **V3 combobox** from the prototype into a React component.

**V3 interaction model (from prototype at `route-builder.html`):**
Single "Select Truck" button that expands a dropdown panel. State managed via React state (not CSS classes like the prototype).

States:
- Default: "No truck selected" row + "Trailers can only be added after adding a Truck" hint
- Search open: search input + filtered truck list below the no-truck row
- Truck selected: selected truck row (name, specs, type badge, × clear, chevron) + Add Trailer section
- Combined (truck selected + search open): selected row stays at top, search list below
- Trailer slot 1: "Add Trailer" → opens slot 1 picker; after selection shows selected trailer row
- Trailer slot 2: "Add Trailer" again → opens slot 2 picker below the button; after selection shows second row
- "Add Trailer" button hidden when both slots filled

**Mock data for trucks:**
```
H-109 - 2018 Lube Box Truck | Box truck | 5,000 gal | 4 Compartments
H-118 - 2019 Kenworth Tank Wagon | Tank Wagon | 4,500 gal | 4 Compartments
H-107 - 2017 Chevrolet Silverado 2500 | Truck | 5,000 gal | 4 Compartments
H-215 - 2022 Freightliner Cascadia | Truck | 5,500 gal | 5 Compartments
H-133 - 2016 International ProStar | Box truck | 4,000 gal | 3 Compartments
H-177 - 2015 Mack Pinnacle Tank Wagon | Tank Wagon | 3,500 gal | 4 Compartments
H-162 - 2019 Peterbilt 389 Flatbed | Truck | 4,500 gal | 4 Compartments
H-301 - 2021 Peterbilt 389 Tanker | Tank Wagon | 5,200 gal | 5 Compartments
```

**Mock data for trailers:**
```
H-138 - 2019 Polar Transport Trailer 9,500 gal | 4,500 gal | 11 Compartments
H-146 - 2005 Van Trailer | 5,000 gal | 5 Compartments
H-147 - 2018 Van Trailer | 5,000 gal | 4 Compartments
H-149 - 2019 Van Trailer | 4,500 gal | 4 Compartments
H-152 - 2017 Van Trailer | 5,000 gal | 4 Compartments
H-201 - 2020 Peterbilt 579 Tanker Trailer | 6,000 gal | 6 Compartments
H-244 - 2023 Volvo VNL 760 Trailer | 6,500 gal | 7 Compartments
H-298 - 2021 Kenworth T680 Tanker Trailer | 7,500 gal | 8 Compartments
H-256 - 2020 Kenworth W990 Tanker Trailer | 8,000 gal | 9 Compartments
```

For the full working HTML/CSS/JS reference implementation, read:
`/Users/hrisikeshmedhi/Projects/figma-mcp-trial/route-builder.html`
- CSS around lines 875–995
- HTML around lines 1608–1755
- JS around lines 1899–2038

---

## Design tokens

```
Background:     #141414 / #111 / #171717
Panel bg:       #1B1B1B / #1A1A1A / #1F1F1F
Border:         #282828 / rgba(115,115,115,0.20)
Hover:          rgba(255,255,255,0.04–0.10)
Text primary:   #E5E5E5 / #FAFAFA / #FFF
Text secondary: #A3A3A3
Text muted:     #737373
Badge bg:       #262626
Active/accent:  #FA6400 (lasso orange), #3B82F6 (filter count blue)
Status colors:  Scheduled = white bg, Incomplete = #FF931E
Tank levels:    High = #EF4444 (red), Medium = #FBBF24 (yellow), Low = #10B981 (green), NA = #3B82F6
```

---

## Key files

```
app/
  page.tsx                     ← Main page, all state, wires everything together
  layout.tsx                   ← Root layout
  globals.css                  ← Global styles
components/
  map-header.tsx               ← Top nav
  filter-side-sheet.tsx        ← Left filter panel (expanded)
  filter-sheet-collapsed.tsx   ← Left filter panel (collapsed tab)
  route-list-sheet.tsx         ← Right route list (expanded)
  route-sheet-collapsed.tsx    ← Right route list (collapsed tab)
  create-route-panel.tsx       ← Create route panel — NEEDS TRUCK/TRAILER COMBOBOX
  route-map.tsx                ← Full-screen map (MIGRATE from Leaflet to Mapbox GL JS)
  map-controls.tsx             ← Floating zoom/compass/lasso/layers controls
  lasso-canvas.tsx             ← Freehand selection overlay
  lasso-workspace-sheet.tsx    ← Lasso results workspace (right panel)
  settings-modal.tsx           ← Settings modal
  infrastructure-marker.tsx    ← Map pins for hubs/terminals/etc
  map-pin.tsx                  ← Map pins for delivery orders
  map-pin-tooltip.tsx          ← Tooltip on hover of order pins
  route-line-tooltip.tsx       ← Tooltip on hover of route lines
  ui/                          ← shadcn/ui component library
lib/
  mock-data.ts                 ← ExtractionOrder, ShipTo, mockRoutes, mockHubs data
  routes-data.ts               ← Route polyline data, TankThreshold types
  infrastructure-data.ts       ← Hub/terminal/bulk plant coordinates
  utils.ts                     ← cn() utility
contexts/
  settings-context.tsx         ← App settings (map style, etc.)
hooks/
  use-mobile.ts
  use-toast.ts
```
