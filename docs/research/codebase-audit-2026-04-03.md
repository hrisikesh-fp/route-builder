# Codebase Audit — April 3, 2026

Audit of current route-builder state vs CLAUDE.md. Used to inform CLAUDE.md update.

---

## 1. New Files NOT in CLAUDE.md

### components/
- **`add-load-order-modal.tsx`** (918 lines) — Modal for selecting terminal and load orders. Types: `LoadOrderInfo`, `ModalTerminal`, `ModalLoadOrder`. Mock data: 8 terminals, 40+ load orders. Features: terminal selection, load order listing with product breakdown, linked delivery counts.
- **`map-stats.tsx`** (75 lines) — Bottom-left metrics display. Shows routes count + orders count + "Add Route" button. Positioned `absolute bottom-6 left-6`.

### lib/
- **`capacity-validation.ts`** (355 lines) — 3-level route capacity validation engine. Exports: `ValidationResult`, `L1Result`, `ProductIssue`, `RunoutIssue`, `BalanceRow`, `ZoneA`, `ZoneB`. Main function: `validateRouteCapacity(orders, truckProfile, retainedFuel?)`. Supports Zone A (truck-level) and Zone B (route-level banner).
- **`truck-data.ts`** (119 lines) — Truck capacity profiles for 5 routes. Types: `FuelProduct`, `TruckCompartment`, `TruckCapacityProfile`. Profiles: H-118 (5,000 gal), H-205 (4,200 gal), H-310 (4,600 gal), H-442 (2,600 gal), H-556 (5,000 gal).

---

## 2. Lasso Workspace Sheet Updates

**File:** `components/lasso-workspace-sheet.tsx`

### Mock Data (lines 56–104)
- **TRUCKS[]**: 18 items (12 original + 6 tractors with empty capacity: TR289, TR291, TR298, TR290, TR293, TR297)
- **TRAILERS[]**: 15 items (9 original + 6 zero-capacity transport trailers: TT-13, TT-79, TT-9, TT-108, TT-110, TT-16)
- **DRIVERS[]**: 6 items (unchanged)

### Shared Components (lines 106–120)
- `parseGal(s)`, `parseComp(s)` — parse capacity strings to numbers
- `getCumulativeCapacity(truck, t1, t2)` → `{ totalGal, totalCompartments }`
- `SpecsDot()` — 4px grey dot separator
- `TypeBadge({ label })` — badge with bg #262626, 12px font

### RouteCardCollapsed — 5 Equipment Configs
```
Config A: Truck only → truck pill + capacity line
Config B: Truck + 1 trailer → unified pill with vertical divider
Config C: Truck + 2 trailers → unified pill with 2 dividers
Config D: Zero-capacity truck/tractor → truck pill + "+ Add Trailer" ghost button
Config E: No truck selected → dimmed "Select Truck" pill
```

### FAB (Floating Action Buttons)
- Appears on card hover, top-right
- Container: bg #1B1B1B, border 1px solid #282828, borderRadius 4, padding 4, gap 4
- Two 24×24px icon buttons: ExternalLink (view route) + MoreVertical (3-dot menu)
- Individual hover: bg #333

### Two-Level Truck Dropdown
- Primary view: selected truck row (or "No truck selected") + trailer rows + "Add Trailer" button
- Expanded: search input + truck list
- Trailer rows in dropdown mirror TruckHubCard pattern (click to swap, chevron to expand search)
- `truckDropupEnabled` state: flips dropdown upward when near bottom of panel

### New Props
- `onHoveredOrderChange?: (orderId: string | null) => void`
- `onAddedLoadOrdersChange?: (added: Record<string, ExtractionOrder[]>) => void`
- `onShowToast?: (driverName: string) => void`
- `initialExpandedRouteIds?: string[]`

---

## 3. Route Map Props

**File:** `components/route-map.tsx` (lines 127–148)

New props added to `RouteMapProps`:
```typescript
hoveredWorkspaceRouteId?: string | null
hoveredWorkspaceOrderId?: string | null
isWorkspaceOpen?: boolean
addedLoadOrders?: Record<string, ExtractionOrder[]>
selectedUnassignedOrderIds?: string[]
```

### isActive logic (line 377)
```typescript
const isActive = order.routeId
  ? selectedRouteIds.includes(order.routeId)
  : selectedUnassignedOrderIds.includes(order.id)
```

### Order pin hover effect (useEffect ~line 913)
- Finds pin by `[data-order-id="${hoveredWorkspaceOrderId}"]`
- Applies `translateY(-3px) scale(1.1)` + drop-shadow to inner div
- Changes SVG path fill to `#A1A1AA`

---

## 4. Map Pin — Unassigned Dot Badge

**File:** `components/map-pin.tsx` (lines 117–154)

- `renderMapPinToHTML(tankThreshold, routeSequence?, isUnassigned, isShipToOnly, isHovered, isSelected, isActive)`
- **Unassigned dot**: 8×8px circle, positioned top: 4px, right: -2px, colored by tank level
- **On-route badge**: 16×16px circle with sequence number, positioned top: 2px, right: -4px

---

## 5. Route Line Tooltip — New Format

**File:** `components/route-line-tooltip.tsx` (56 lines)

New design (replaces old avatar-based layout):
- **Container**: bg #171717, borderRadius 8px, padding 12px, gap 8px, min-width 220px
- **Row 1**: Inline truck SVG icon (16px, stroke #A3A3A3) + truck name (#FAFAFA, 16px, weight 500)
- **Row 2**: Driver name (#A3A3A3, 14px) left + "N Orders" badge (#FAFAFA, 14px, bg #262626, 4px radius) right

Data: `mockRoutes.truckName`, `mockRoutes.driverName`, order count from `allRoutes.stops`

---

## 6. Page.tsx New State

**File:** `app/page.tsx`

New state variables:
```typescript
hoveredWorkspaceOrderId    — tracks which order card is hovered in workspace
addedLoadOrders            — Record<routeId, ExtractionOrder[]> for added load orders
selectedUnassignedIds      — useMemo derived from selectedOrders.filter(!routeId)
```

New props wired to RouteMap: `hoveredWorkspaceOrderId`, `selectedUnassignedOrderIds`, `addedLoadOrders`
New props wired to LassoWorkspaceSheet: `onHoveredOrderChange`, `onAddedLoadOrdersChange`, `onShowToast`
Toast: success message "Load Order added to {driver}'s Route successfully" with CheckCircle2 icon
