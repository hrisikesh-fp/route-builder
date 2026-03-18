# Plan: Truck Capacity Validation — Realistic Data + Validation Engine + UI

## Context
The route builder prototype needs realistic data and a 3-level capacity validation system across Routes 1-5. Each route demonstrates a different scenario (clean, exceeding, product-level issues, mid-route runout). Route 6 (Tom Hanks) stays untouched.

---

## Phase 1: Data Layer

### 1A. New file: `lib/truck-data.ts`
Create shared truck/trailer data with per-product compartment capacities.

- Define `FuelProduct` type: `"200*DIESEL-OFFROAD RED" | "200*DIESEL-ONROAD CLEAR" | "87 OCT W/ 10% ETH" | "ULSD CLEAR DIESEL" | "DEF PACKAGED"`
- Define `TruckCompartment`: `{ id, capacities: Record<FuelProduct, number> }`
- Define `TruckCapacityProfile`: `{ truckId, totalCapacity, compartments[], productCapacities: Record<FuelProduct, number> }`
- Export `TRUCK_CAPACITIES` map for all trucks referenced in Routes 1-5:
  - H-118 (Route 1): 5 compartments, Red/Clear/87Reg, total ~5,000
  - H-205 (Route 2): 3 compartments, ULSD only, total 4,200
  - H-310 (Route 3): 4 compartments, Red/Clear, total 4,600
  - H-442 (Route 4): 4 compartments, ULSD/87Reg, total 2,600
  - H-556 (Route 5): 3 compartments, ULSD only, total 5,000
- **Keep existing TRUCKS and TRAILERS arrays in `lasso-workspace-sheet.tsx` untouched** — they power the dropdown and must not break
- Add new truck entries (H-205, H-310, H-442, H-556) to the existing TRUCKS array alongside the 8 existing trucks
- `truck-data.ts` only adds the capacity profiles (compartment data) — it imports/references truck IDs but doesn't replace the dropdown data

### 1B. Extend `ExtractionOrder` in `lib/mock-data.ts`
- Add optional `productBreakdown?: { product: FuelProduct; volume: number }[]` field
- Existing `volume` stays as total (backward compat for Route 6)

### 1C. Replace mock data for Routes 1-5
- **Route 1 (Mark Ruffalo):** 6 delivery orders with Red/Clear/87Reg breakdowns. No truck, no load order initially. Total: 4,600 gal.
- **Route 2 (Dwayne Johnson):** 5 delivery orders, all ULSD. Pre-assigned truck H-205 + load from Valero Taylor. Total: 5,100 gal.
- **Route 3 (Jessica Harper):** 6 delivery orders, Red/Clear. Pre-assigned truck H-310 + load from Flint Hills. Retain: Red 300, Clear 500. Total: 3,450 gal.
- **Route 4 (Kyle Reese):** 5 delivery orders, ULSD/87Reg. Pre-assigned truck H-442 + load from Georgetown. Total: 2,850 gal.
- **Route 5 (Forrest Gump):** 4 delivery orders, all ULSD. Pre-assigned truck H-556 + load from Flint Hills. Total: 3,500 gal.
- **Comment out all T-IN/T-OUT orders** with `// TRANSFER: commented out for Phase 1` markers
- **Route 6:** No changes whatsoever

### 1D. Update `mockRoutes` entries
- Add `truckId` field to routes 2-5 (for truck profile lookup)
- Add `retainedFuel` to Route 3
- Update driver photos/names if needed to match plan

**Files:** `lib/truck-data.ts` (new), `lib/mock-data.ts` (modify)

---

## Phase 2: Validation Engine

### New file: `lib/capacity-validation.ts`

Pure function, no React dependencies.

**Main function:**
```ts
validateRouteCapacity(
  orders: ExtractionOrder[],
  truckProfile: TruckCapacityProfile | null,
  retainedFuel?: { product: FuelProduct; volume: number }[]
): ValidationResult | null
```

**Returns null if no truck assigned. Otherwise returns:**
```ts
{
  severity: "error" | "warning" | "ok",
  l1: { status, totalPlanned, truckCapacity, diff },
  l2: ProductIssue[],           // products exceeding compartment capacity
  l3: RunoutIssue[],            // products going negative at specific stops
  runningBalance: BalanceRow[], // full stop-by-stop balance table
  collapsedBannerText: string,  // "⚠ 87 Regular runs out at Stop 5 + 2 more"
  collapsedBannerType: "red" | "amber" | "none",
  expandedIssues: string[],     // bullet points for expanded view
  truckMessage: string,         // message under truck row
  truckMessageColor: "red" | "amber" | "green",
  firstFailingStopIndex: number | null,  // for mid-route CTA placement
}
```

**Logic:**
1. L1: Sum delivery `productBreakdown` volumes → compare to `truckProfile.totalCapacity`
2. L2: Group deliveries by product → compare each to `truckProfile.productCapacities[product]`
3. L3: Walk stops in sequence. Start balance from `retainedFuel` (or zeros). Load orders add, deliveries subtract. Track where each product first goes negative.
4. Collapsed text: worst-problem-first with severity hierarchy (L3 runout > L2 product exceed > L1 total exceed)
5. Special case: truck assigned but no load orders → "No fuel loaded. Add a load order to supply this route."

**Files:** `lib/capacity-validation.ts` (new)

---

## Phase 3: UI Changes in `lasso-workspace-sheet.tsx`

### 3A. Wire validation into render loop (~line 1359)
- Import `validateRouteCapacity` and `TRUCK_CAPACITIES`
- Replace inline alert logic with: `const validation = validateRouteCapacity(sortedOrders, truckProfile, routeRetain)`
- Pass validation results down to sub-components

### 3B. Redesign collapsed card banner (~line 1488)
- Use `validation.collapsedBannerType` for color (red tint vs amber tint)
- Use `validation.collapsedBannerText` for text
- Keep info icon (tooltip deferred — add `title` attr as placeholder)
- Show no banner when `validation === null` (no truck)

### 3C. New: Expanded validation banner
- Render below `TruckHubStartRow` when expanded and `validation.expandedIssues.length > 0`
- Red-tinted background, bullet list of issues
- Header: "⚠ N Items need your attention"

### 3D. Inline warnings on `OrderStopRow`
- Add `warnings` prop to `OrderStopRow`
- When present: red left border (4px `#EF4444`) on card + red warning strip(s) below content
- Text per warning: "⚠ [Product Name] will run out before this stop"
- Compute warnings from `validation.l3` by matching stop index

### 3E. Mid-route "+ Add Load Order" CTA
- When `validation.firstFailingStopIndex` is set, insert a CTA row in the timeline between last-OK stop and first-failing stop
- Same visual style as `NoLoadOrderRow` but positioned inline
- Clicking opens the Add Load Order modal

### 3F. Message under truck selection
- In `TruckHubStartRow`, render `validation.truckMessage` below truck selector
- Color from `validation.truckMessageColor`

### 3G. Tooltip on info icon
**Flag: Needs implementation** — defer to next phase. Add `title` attribute for now.

**Files:** `components/lasso-workspace-sheet.tsx` (modify)

---

## Phase 4: Pre-assigned data for Routes 2-5

Routes 2-5 need to load with trucks and load orders already assigned so validation shows immediately.

- In the workspace sheet, initialize `selectedTrucks` state with pre-assigned truck data for routes that have `truckId` in mockRoutes
- Initialize `addedLoadOrders` with pre-assigned load orders for routes 2-5
- Route 1 starts empty (demo flow — user adds truck + load interactively)

**Files:** `components/lasso-workspace-sheet.tsx` (modify initialization logic)

---

## Build Order (sequential)

| Step | What | Depends on |
|------|------|------------|
| 1 | `lib/truck-data.ts` — types + truck capacity profiles | Nothing |
| 2 | `lib/capacity-validation.ts` — validation engine | Step 1 |
| 3 | `lib/mock-data.ts` — realistic order data for Routes 1-5, comment out transfers | Step 1 |
| 4 | `lasso-workspace-sheet.tsx` — wire validation, redesign banners, inline warnings, CTA, truck message | Steps 1-3 |
| 5 | Polish + verify all 5 route scenarios match the plan's expected outputs | Step 4 |

---

## What's NOT in scope
- Transfer orders (T-IN, T-OUT) — comment out, don't build
- Tooltip on info icon — flagged "Needs implementation"
- "See compartment detail" expansion — deferred
- Product incompatibility detection
- Compartment-level allocation logic
- Route 6 changes
- Add Load Order modal changes

## Pre-step: Save reference doc
Save this plan as `/Users/hrisikeshmedhi/Projects/route-builder/docs/capacity-validation-plan.md` so Hrisikesh can reference it while learning.

## Verification
- Load app → workspace empty (default state)
- Click Route 1 on map → workspace opens, no truck, no load, "No Load Orders added yet" shows, no banner
- Click Route 2 on map → truck pre-assigned, load pre-assigned, "Exceeding Truck Capacity ↑ 900 gal" banner, inline warning on Hutto card
- Click Route 3 → "Exceeding Product Capacity 200 gal" banner, warning on Circle C card
- Click Route 4 → "⚠ 2 Items need your attention" banner, warnings on Jarrell card
- Click Route 5 → "Below Truck Capacity ↓ 1,500 gal" banner, no warnings, clean state
- Route 1 demo: add load → add truck → see warnings → add mid-route load → warnings resolve partially
