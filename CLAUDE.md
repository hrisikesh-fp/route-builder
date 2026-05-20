# Route Builder — Full Project Context

> **Note to Claude Code:** This document covers what has been built. Product decisions, design intent, and interaction details beyond what's documented here should be confirmed with the user before implementation. When in doubt, ask. **Figma is the source of truth** for UI design — always use exact Figma values for colors, spacing, and sizing.

---

## What this product is

A **fuel logistics route-builder tool** used by dispatchers at FleetPanda. Dispatchers:
1. View a map showing delivery orders, existing routes, and infrastructure (hubs, terminals, bulk plants)
2. Filter orders by location, customer, driver, order type/status, tank threshold
3. Select orders via lasso tool, route click, or terminal click
4. Manage routes: assign truck + trailer(s), reorder stops, validate capacity
5. Publish routes for drivers

---

## Project setup

**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, pnpm
**Map:** Mapbox GL JS v3.15.0 (migration from Leaflet complete — do NOT revert)
**Mapbox token:** Hardcoded in `app/api/map-config/route.tsx`
**Package manager:** pnpm

```bash
cd /Users/hrisikeshmedhi/Projects/fleetpanda/route-builder
pnpm install && pnpm dev
```

**Deployment:** Vercel — auto-deploys on push to `main`
**Production URL:** https://route-builder-navy.vercel.app

---

## App layout

```
┌─────────────────────────────────────────────────────┐
│  TopNav (MapHeader) — 68px tall, z-index 1200       │
├──────────┬──────────────────────────┬───────────────┤
│  Filter  │                          │  Workspace    │
│  Sheet   │        Map               │  Sheet        │
│  (left)  │     (full screen)        │  (right)      │
│  320px   │                          │  560px        │
│          │   [Map Controls]         │               │
│          │   floating right side    │               │
└──────────┴──────────────────────────┴───────────────┘
```

The **Lasso Workspace Sheet** (560px) appears on the right when orders are selected (lasso/route-click/terminal-click) or when the collapsed tab is clicked (empty state).

---

## Components — what each does

### `components/map-header.tsx` — Top navigation bar
- **Left:** Logo + "Route Builder" title + "Back to Dispatch" link
- **Right:** Date selector (tomorrow's date) + Profile avatar (HM) with dropdown
- Profile dropdown: Edit Profile, Change Password, Settings, 2FA, Logout
- Height: 68px, `z-index: 1200`

### `components/filter-side-sheet.tsx` — Left filter panel (320px)
- Slides in from left. Sections: Location (City dropdown), Customer & ShipTo, Driver Details, Order Type & Status, Assets (Tank Threshold)
- Footer: total routes + total orders count
- City dropdown: multi-select with search, grouped by state, Apply/Cancel

### `components/filter-sheet-collapsed.tsx` — Collapsed filter tab (left edge)

### `components/route-sheet-collapsed.tsx` — Collapsed workspace tab (right edge)
- Clicking opens Workspace sheet in empty state

### `components/lasso-workspace-sheet.tsx` — Main workspace (right panel, 560px)
> **Dead code (not yet cleaned up):** `addedRouteInfo`, `onAddSelectedRouteId`, `syntheticRouteIds`, `prefillDriverName` wiring and the driver-creates-route branch in the submit handler were removed from active use but variable declarations remain. The `!routeId` submit path now always creates an Unassigned order — no synthetic route creation.
This is the largest component. Contains collapsed route cards, expanded route cards, truck/trailer/driver selection, capacity validation, and order management.

**Key internals:**

#### Mock data arrays
- `TRUCKS[]` — 18 items: 12 trucks with capacity + 6 zero-capacity tractors (TR289–TR297, badge "Tractor", empty capacity/compartments)
- `TRAILERS[]` — 15 items: 9 trailers with capacity + 6 zero-capacity transport trailers (TT-13, TT-79, etc.)
- `DRIVERS[]` — 6 items with name + orderCount

#### Shared module-level components
- `SpecsDot` — 4px grey dot separator
- `TypeBadge({ label })` — badge with bg #262626, 12px font
- `getCumulativeCapacity(truck, t1, t2)` → `{ totalGal, totalCompartments }`
- `parseGal(s)`, `parseComp(s)` — parse capacity strings

#### RouteCardCollapsed — 5 equipment configs
```
Config A: Truck only → truck pill + capacity/compartments/products line
Config B: Truck + 1 trailer → unified pill with internal vertical divider + cumulative capacity
Config C: Truck + 2 trailers → unified pill with 2 dividers + cumulative capacity
Config D: Zero-capacity truck → truck pill + ghost "+ Add Trailer" button + "Selected truck has no fuel capacity"
Config E: No truck → dimmed "Select Truck" pill (opacity 0.6) + "No Truck selected yet."
```

#### FAB (Floating Action Buttons) on route card
- Appears on card hover, positioned absolute top-right
- Container: bg #1B1B1B, border 1px solid #282828, borderRadius 4px, padding 4px, gap 4px
- Three 24×24px icon buttons (order: Sparkles → ExternalLink → MoreVertical), all borderRadius 2px
- Sparkles (Optimise Route) → opens MergeModal in optimise mode
- ExternalLink (View Route) → only for published routes
- MoreVertical (3-dot menu) → dropdown: Optimise Route, View Route, Driver submenu, Unassign Route
- FAB stays visible when ANY dropdown is open (`isMenuOpen || isTruckDropdownOpen || isTrailerDropdownOpen || isDriverDropdownOpen`)

#### Two-level truck dropdown (on collapsed card)
- **Primary view:** Selected truck row (name + specs + badge + chevron) OR "No truck selected" + trailer rows (if any) + "Add Trailer" button
- **Expanded view:** Search input + filtered truck list
- Trailer rows in primary view mirror TruckHubCard pattern (click to swap, chevron to expand search)
- `truckDropupEnabled` state: flips dropdown upward when `window.innerHeight - rect.bottom < 350`
- Specs line hidden when truck/trailer has empty capacity (zero-capacity tractors/trailers)

#### TruckHubCard (inside expanded route card)
- Full truck + trailer combobox with search, swap, add/remove trailer slots
- Shows selected truck specs, trailer 1/2 rows, "Add Trailer" button
- Each option: name + capacity + compartments + TypeBadge

#### Capacity validation integration
- Imports `validateRouteCapacity` from `@/lib/capacity-validation`
- Zone A: truck-level info displayed on card
- Zone B: route-level banner (e.g., "Below Truck Capacity", "1 Issue")

#### Workspace scroll & tabs
- **Unified scroll**: Driver Routes and Unassigned Orders sections are in one continuous scroll (NOT separate tab content)
- Tabs are scroll anchors — clicking a tab smooth-scrolls to that section
- Active tab indicator updates on scroll via scroll position threshold (33% of container)
- Refs: `routesSectionRef`, `unassignedSectionRef`, `scrollContainerRef`

#### Unified bottom FAB (selection actions)
Single FAB adapts based on what's checked:
- **Scheduled orders only** (individual order checkboxes): Unassign + Move ▾
- **Routes only** (route-level checkbox, 1 route): Remove + Unassign | Optimise
- **Routes only** (2+ routes): Remove + Unassign | Merge
- **Unassigned orders only**: Remove + Move ▾ | Create
- **Routes + Unassigned (mixed)**: Remove | Merge
- Count = `checkedScheduledOrderIds.length + checkedUnassignedOrderIds.length` (no double-counting)

#### Checkbox sync (route ↔ orders)
- Checking a route auto-checks all its orders in `checkedScheduledOrderIds`
- Unchecking a route removes its orders from `checkedScheduledOrderIds`
- Checking all orders in a route auto-checks the parent route via `useEffect`
- Unchecking any order in a checked route unchecks the route
- "Select All Routes" syncs all route orders too
- **Important:** Route→order sync uses `useEffect` on `checkedScheduledOrderIds` to avoid setState-during-render

#### Unassigned order cards
- Two variants: condensed (time + badge + name + planned qty button) and detailed (stats card, urgency dots)
- Controlled by `orderCardView` setting ("condensed" | "detailed") from `useSettings()`
- Condensed: hover shows grip icon + inline 3-dot menu (same pattern as scheduled order cards)
- "Select All Unassigned Orders" header with indeterminate state
- Functional checkboxes tracked via `checkedUnassignedOrderIds`

#### Order hover → map pin correlation
- `onHoveredOrderChange(orderId)` bubbles up through page.tsx to route-map
- Map pin gets `translateY(-3px) scale(1.1)` + SVG fill `#A1A1AA` via DOM manipulation on inner div

### `components/merge-modal.tsx` — Create Routes / Optimise Route modal
- Two modes via `modalMode` prop: `"create"` (with Auto/Manual toggle) and `"optimise"` (no toggle)
- **Left panel:** Orders table (Stops, Planned Qty, Planned Time, Order Type)
- **Right panel:** Truck search with hub tabs, sort dropdown (by capacity or name, asc/desc)
- **Create mode:** title "Create Routes", Auto/Manual toggle, CTA "Optimise and Create Routes"
- **Optimise mode:** title "Optimise Route", no toggle, CTA "Optimize Route"
- Accepts `checkedUnassignedOrderIds` to include unassigned orders in the order list
- Loading screen with spinner + phase text animation
- Mock truck data: 4 hub groups, ~20 trucks with capacity/compartments/products

### `components/add-load-order-modal.tsx` — Load order selection modal
- Terminal selection → load order listing with product breakdown
- Mock data: 8 terminals, 40+ load orders
- Shows linked delivery count per load order

### `components/route-map.tsx` — Full-screen Mapbox map
- **Uses Mapbox GL JS v3** — markers via `new mapboxgl.Marker({ element, anchor: "bottom" })`
- Route polylines: GeoJSON source + line layer per route (OSRM-routed coordinates)
- Entity visibility controlled by `MapEntityVisibility` from MapControls
- Window globals: `__mapControls`, `__zoomToCity`, `__zoomToRoute`, `__zoomToTerminal`
- Infrastructure markers: outer element must NOT have `position: relative` or `zIndex` — breaks Mapbox geo-anchoring
- Terminal tooltip: detached DOM element appended to mapContainer (not inside marker)
- Route `fitBounds` padding: `{ top:80, right:640, bottom:80, left:80 }` for 560px workspace

**Key props:**
- `selectedRouteIds` — which routes are in the workspace
- `selectedUnassignedOrderIds` — unassigned orders in workspace → triggers dot badge display
- `hoveredWorkspaceOrderId` — order card hover → map pin highlight
- `hoveredWorkspaceRouteId` — route card hover → route line highlight
- `isWorkspaceOpen`, `addedLoadOrders`
- `workspaceWidth?: number` (default `560`) — used to compute pan amount when workspace opens/closes

**Workspace pan on open/close:**
- `useEffect` watches `isWorkspaceOpen`, `workspaceWidth`, `mapReady`
- `prevWorkspaceOpenRef` (useRef) skips the initial mount so the map doesn't pan on first load
- On open: `mapRef.current.panBy([workspaceWidth / 2, 0], { duration: 400 })` — camera moves right, so content shifts left into visible area
- On close: `panBy([-workspaceWidth / 2, 0])` — reverses
- Dynamic so it adapts if panel width ever changes — update `workspaceWidth` prop in page.tsx

**Route line opacity:**
- `applyRouteStyle` function controls opacity based on workspace state:
  - Routes in workspace: `opacity: 0.8` (fully visible)
  - Routes outside workspace when panel is open: `opacity: 0.25` (dimmed)
  - All routes when workspace is closed: `opacity: 0.8`

**Unassigned order badges:**
- `isActive` for unassigned orders = `selectedUnassignedOrderIds.includes(order.id)`
- When active: shows 8px colored dot badge (tank level color, no number) on pin

### `components/map-pin.tsx` — Order map pins
- `renderMapPinToHTML(tankThreshold, routeSequence?, isUnassigned, isShipToOnly, isHovered, isSelected, isActive)` → HTML string
- Grey teardrop SVG pin (#71717A) with dark center (#3F3F46)
- **On-route badge:** 16×16px circle with sequence number, colored by tank level
- **Unassigned dot badge:** 8×8px circle, no number, positioned top:4px right:-2px, colored by tank level
- `data-order-id` attribute on markers — used by lasso detection + workspace hover

### `components/map-pin-tooltip.tsx` — Order pin hover tooltip
- Shows customer name, address, planned time, order type, assets, ordered gals, top-off assets, tank level dots

### `components/route-line-tooltip.tsx` — Route line hover tooltip
- **Row 1:** Inline truck SVG icon (16px) + truck name (#FAFAFA, 16px, medium)
- **Row 2:** Driver name (#A3A3A3, 14px) + "N Orders" badge (#FAFAFA, bg #262626, 4px radius)
- Container: bg #171717, borderRadius 8px, padding 12px

### `components/map-controls.tsx` — Floating map controls (right side)
- Adjusts `right` based on panels: workspace open → `412px`, create panel → `462px`, default → `56px`
- Controls: Map entities toggle, Zoom in/out, Compass reset, Lasso button
- Lasso button: orange when inactive, outlined orange when active

### `components/lasso-canvas.tsx` — Lasso selection overlay
- Full-screen canvas for freehand polygon drawing
- `onSelectionComplete(polygon)` with screen coordinates, Esc cancels

### `components/map-stats.tsx` — Bottom-left metrics display
- Shows routes count + orders count + "Add Route" button
- Positioned absolute bottom-6 left-6

### `components/create-route-panel.tsx` — Create route panel (450px, right side)
- Currently incomplete: Route Name input + Zone dropdown + CTA button
- Needs full truck/trailer combobox + order list + time estimates

### `components/settings-modal.tsx` — Settings modal (from profile dropdown)
- **Order Card View** section: "Condensed" / "Detailed" radio buttons — controls unassigned order card style
- **Create Order Modal** section: "Modal 1: Full Scroll" / "Modal 2: 2 Panel" radio buttons — controls create-order-modal layout
- Radio button style: 20×20px custom circles, `6px solid #6366F1` + `#111` bg when selected, `2px solid #404040` unselected
### `components/infrastructure-marker.tsx` — Hub/Terminal/Bulk Plant/Warehouse map markers
### `components/route-list-sheet.tsx` — **UNUSED** — do not re-add

### `components/breakdown-sheet.tsx` — Per-stop product & compartment breakdown sheet
- Opens as a floating sheet anchored to an order card stop row
- **By Product chart:** bar chart of product balances at the selected stop; hover tooltip shows which compartments carry that product
- **By Compartments chart:** only rendered when the route has a single product; shows fill per compartment with hover tooltip listing products
- Bar chart: `168px` tall, custom Y-axis range (`2000 / 6000 / ceil-to-1000`), zero-line, animated tooltips with value label + card + triangle pointer
- `selectedOrderId` drives which stop snapshot is shown; falls back to last stop if null
- Compartment fill simulation: for single-product routes, fill/drain logic runs in sequence order (load orders add to earliest available compartment space, delivery orders drain from earliest filled)

### `components/route-summary-sheet.tsx` — Product & Truck Summary sheet
- Two-tab sheet: **Products (N)** and **Truck & Compartments**
- Products tab: grid table — Product / Planned Qty / Compartments columns, one row per product on delivery orders, total row at bottom
- Truck & Compartments tab: renders `TruckSummaryContent` — truck icon + name + specs, then compartment cards showing max gal per compartment (inline cards with `#1b1b1b` bg + `#333` border)
- Exports `TruckSummaryContent` for use by other components
- Anchored dropdown-style same as `breakdown-sheet.tsx`

### `components/truck-details-sheet.tsx` — Truck Details floating sheet
- Opens from the "View Truck Details" button on a route card (M6)
- Header: "Truck Details" title + X close
- Body: `TruckInfoCard` + `CompartmentBreakdown` grid
- `CompartmentBreakdown`: bordered flex table — one column per compartment, header row (C1/C2...) separated by bottom border from data row (max gal + accepted products). Locked to Figma `YriCTfpkAvXhj0FkU02QLS` node 4254:181452
- Falls back to "No truck selected" state when `truckProfile` is null
- Anchors the same dropdown-style as other floating sheets

### `components/truck-info-card.tsx` — Shared truck info card (reusable)
- Standalone presentational component: `#282828` bg card with truck icon, truck name (white, 16px medium), and specs line (gal · Compartments · N Products: X, Y)
- Used by `truck-details-sheet.tsx` and `initial-inventory-modal.tsx`
- Props: `truckName: string`, `truckProfile: TruckCapacityProfile`

### `components/initial-inventory-modal.tsx` — Initial Inventory modal
- Centered overlay modal (720px wide, max 560px tall)
- Shows `TruckInfoCard` at top, then a scrollable list of compartments — each with a Product dropdown (filtered to route demand ∩ compartment products) and a quantity input with `gal` suffix unit
- `canUpdate` gate: at least one compartment must have product + qty > 0
- Exports `aggregateCompartmentValues()` helper: collapses per-compartment values into per-product totals for callers
- Resets state on every open via `useEffect` on `isOpen + initialValues`

### `components/create-order-modal.tsx` — Create Order modal
- Centered overlay modal; width is **960px (Modal 1)** or **1200px (Modal 2)**, controlled by `createOrderModalView` setting
- Sections: Customer Details, Schedule Details, Delivery Order (product table), Delivery Instructions, Others (commented out — not needed currently)
- **Custom DatePicker and TimePicker** — built in-file, use `position: fixed` + `getBoundingClientRect()` to escape modal's `overflow: hidden` wrapper
- **Orders created are always Unassigned** — no driver/route assignment in this flow; submitted order gets `status: "pending"` and goes to Unassigned section of workspace

**Modal 1 vs Modal 2 layout** — controlled by `const { createOrderModalView } = useSettings()`:
- **Modal 1 (full scroll, 960px):** all sections in a single `overflowY: auto` column
- **Modal 2 (2-panel, 1200px):** left 480px fixed panel (`overflowY: auto`) with Customer Details + Schedule Details; 1px `#282828` vertical divider; right `flex: 1` panel with Delivery Order table + Delivery Instructions. Both panels scroll independently.

**Section extraction pattern** — each section is defined as a `const xyzSection = (...)` JSX variable before `return` so both layouts reference the same JSX without duplication. `othersSection = null` stub keeps layouts compilable while Others is hidden.

**Pump Out / Top Off** — `{orderType === "extraction" ? "Pump Out" : "Top Off"}` — label in the Delivery Order table header changes based on order type.

**Section header style** — `SectionTitle` component: `fontWeight: 300, color: "#E5E5E5"` (matches other modals).

**Side-by-side field rows** — `gap: 12` between paired fields.

### `components/balance-table-modal.tsx` — Route Summary / Balance Table modal
- Centered overlay modal titled "Route Summary"; width adapts: `800px` (1 product) → `1200px` (2+ products)
- Table columns: Stops + one column per product
- Rows in order: **Initial inventory** (with Pencil edit button → calls `onEditInitialInventory`), dashed separator, **Assumed starting load** (hidden when a Load order exists), numbered stop rows with L/D/T type badges, **Expected Retain** footer row
- Negative balances: red `TriangleAlert` icon with fixed-position tooltip ("X will run out at this stop") — uses `position: fixed` so it escapes table `overflow: hidden`
- `buildAssumedStartingLoad`: distributes truck capacity across products by demand proportion; shows helper text in grey (fully covered) or indigo (capacity-limited)
- L/D/T badge colors: L = `#189FFC` (blue), D = `#25B8A7` (teal), T = `#737373` (grey)

---

## Design tokens

```
Background:     #141414 / #111 / #171717
Panel bg:       #1B1B1B / #1A1A1A / #1F1F1F
Card bg:        #1F1F1F (default), #282828 (hovered)
Border:         #282828 / #333 / rgba(115,115,115,0.20)
Hover:          rgba(255,255,255,0.04–0.10)
Text primary:   #E5E5E5 / #FAFAFA / #FFF
Text secondary: #A3A3A3
Text muted:     #737373
Badge bg:       #262626
Active/accent:  #FA6400 (lasso orange), #3B82F6 (filter blue), #4D55F8 (publish indigo)
Status colors:  Scheduled = white bg, Incomplete = #FF931E
Tank levels:    High = #EF4444 (red), Medium = #FBBF24 (yellow), Low = #10B981 (green), NA = #3B82F6
Pill border:    #333 (default), #737373 (active/focused)
Pill shadow:    0px 1px 2px rgba(0,0,0,0.05) (default), 0px 0px 0px 3px rgba(115,115,115,0.5) (focused)
```

---

## Key files

```
app/
  page.tsx                     ← Main page — all state, wires everything together
  layout.tsx                   ← Root layout
  globals.css                  ← Global styles
  api/map-config/route.tsx     ← Mapbox token endpoint

components/
  map-header.tsx               ← Top nav (68px)
  filter-side-sheet.tsx        ← Left filter panel (320px)
  filter-sheet-collapsed.tsx   ← Left filter collapsed tab
  route-sheet-collapsed.tsx    ← Right workspace collapsed tab
  lasso-workspace-sheet.tsx    ← Workspace panel (560px) — route cards, equipment, validation
  lasso-canvas.tsx             ← Freehand lasso selection overlay
  route-map.tsx                ← Full-screen Mapbox map
  map-controls.tsx             ← Floating zoom/compass/lasso/layers controls
  map-pin.tsx                  ← Order pin rendering (renderMapPinToHTML)
  map-pin-tooltip.tsx          ← Order pin hover tooltip
  route-line-tooltip.tsx       ← Route line hover tooltip
  infrastructure-marker.tsx    ← Hub/Terminal/Bulk Plant/Warehouse markers
  merge-modal.tsx              ← Create Routes / Optimise Route modal (truck search, sort, loading)
  add-load-order-modal.tsx     ← Terminal + load order selection modal
  breakdown-sheet.tsx          ← Per-stop product & compartment bar chart sheet
  route-summary-sheet.tsx      ← Products + Truck & Compartments two-tab sheet
  truck-details-sheet.tsx      ← Truck Details floating sheet (TruckInfoCard + CompartmentBreakdown grid)
  truck-info-card.tsx          ← Shared truck info card component (#282828 card, reusable)
  initial-inventory-modal.tsx  ← Initial inventory per-compartment input modal
  balance-table-modal.tsx      ← Route Summary / per-stop running balance table modal
  map-stats.tsx                ← Bottom-left metrics display
  create-route-panel.tsx       ← Create route panel (incomplete)
  create-order-modal.tsx       ← Create Order modal (Modal 1: 960px single scroll / Modal 2: 1200px 2-panel)
  settings-modal.tsx           ← Settings modal (Order Card View + Create Order Modal radio sections)
  route-list-sheet.tsx         ← UNUSED — do not re-add
  ui/                          ← shadcn/ui component library

lib/
  mock-data.ts                 ← ExtractionOrder, ShipTo, mockRoutes, mockHubs
  routes-data.ts               ← Route polyline data (allRoutes), TankThreshold types
  infrastructure-data.ts       ← Hub/terminal/bulk plant coordinates (base1Infrastructure)
  capacity-validation.ts       ← 3-level capacity validation (L1=total, L2=per-product, L3=stop-by-stop)
  truck-data.ts                ← Truck capacity profiles (TRUCK_CAPACITIES) for 5 trucks
  utils.ts                     ← cn() utility

contexts/
  settings-context.tsx         ← App settings: routeLineDisplay, showBadges, reducedOpacity, orderCardView (condensed/detailed), createOrderModalView (modal1/modal2 — extensible for modal3)
```

---

## Development approach

- **Figma is the source of truth** for UI design — always use exact Figma values
- **Figma MCP is configured** — use `get_figma_data` and `get_design_context` to read designs
- Build one thing at a time, guided by Figma designs
- All inline styles (no Tailwind in workspace components) — matches existing pattern
- Do NOT add features/refactors beyond what was asked

**Figma files:**
- Phase 1.2.1: `KIZz6xXZYrRPHarKEa7wXu`
- Phase 1.2.1 Dev file: `Zvutylr6lxkxIuKMXEuSX6`
- Phase 1.3: `tbb6l7lTDhlN0jFo7pYeJw`
- Phase 1.3 (RB-1.3 active file): `YriCTfpkAvXhj0FkU02QLS` ← use this for current 1.3 work

---

## Important implementation notes

- **Mapbox markers:** Outer element must have NO `position: relative` or inline `zIndex` — breaks geo-anchoring
- **Map pin hover:** Apply transforms to inner `> div`, NOT the Mapbox marker container
- **Terminal tooltip:** Detached DOM element appended to mapContainer (not inside marker)
- **Infrastructure markers:** No `position: relative` or `zIndex` on outer element
- **Hot reload cache bug:** Browser sometimes caches stale webpack modules → `__webpack_modules__[moduleId] is not a function`. Fix: clear `.next` + restart dev server + hard refresh (`Cmd+Shift+R`). Prevention: enable "Disable cache" in Chrome DevTools → Network tab.

---

## Current branch / active work

- **Branch:** `iter/create-order-side-sheet`
- **Next:** Modal 3 — Side Sheet variant of the Create Order modal (planned, not started)
- `CreateOrderModalViewType` is already typed as `"modal1" | "modal2"` — add `"modal3"` when ready
- See `3-resources/token-efficiency.md` for guidance on avoiding expensive agent spawns during research steps
