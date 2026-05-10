# Phase 1.3 — Per-Stop Balance (Milestone 3: dynamic per-stop sheet)

> Continuation of Phase 1.3. Milestones 1 & 2 are complete (data updates + breakdown sheet shell). This milestone makes the sheet **per-stop dynamic** — clicking the package icon on each order card shows that specific stop's snapshot, not the route-total view.

## Context

The current sheet shows the same chart for every stop on a route — wrong. The user spec defines a deterministic per-stop snapshot:

- **R1 Stop 2 (Mueller, after delivering 1,000 gal Diesel CLR)**: on-truck = 3,600. Compartments: `C1=0, C2=1000, C3=1500, C4=1000, C5=100`.
- **R1 Stop 3 (Manor, after −800)**: on-truck = 2,800. Compartments: `C1=0, C2=200, C3=1500, C4=1000, C5=100`.
- ...and so on for every stop in R1, R2, R3.

The validator already has the per-stop product totals; what's missing is (a) the sheet using them and (b) compartment-level snapshots via sequential drain.

---

## What's already in place (Milestones 1 & 2, shipped)

| Item | Status |
|---|---|
| Plan saved to `1-projects/route-builder/docs/phase-1.3-per-stop-balance.md` | ✅ |
| R1 truck (H-118): 5 comp × Diesel CLR/Gas 87, 5,500 gal | ✅ |
| R1 stops single-product Diesel CLR, 4,600 total | ✅ |
| R3 truck (H-310): 4 comp × Diesel CLR/Gas 87, 4,600 gal | ✅ |
| R3 stops (Diesel + Gas, 5,000 total) + retained zeroed | ✅ |
| R3 Load 1 = Flint Hills Diesel 3,000 + Gas 1,600 | ✅ |
| R2 mid-route load (Valero Taylor 900 ULSD 08:30) in modal | ✅ |
| R1 load order in modal: Flint Hills 4,600 Diesel CLR single-product | ✅ |
| L/D badges: solid fills, no stroke | ✅ |
| Order-card FAB (package + ellipsis), package only when route has ≥1 load | ✅ |
| Breakdown sheet: header, X close, dropdown-style anchoring (4px left of card, flips right if no room, vertical clamp) | ✅ |
| Sheet hides FAB + keeps card hover bg while open | ✅ |
| Per-product bar colors per Figma (RED orange / CLR indigo / Gas neutral) | ✅ |
| Multi-product rule: hide compartment chart for `products.length > 1` | ✅ |
| `validation.runningBalance` already produces post-transaction per-product balances per stop | ✅ |

## What changes this milestone (per-stop dynamic)

| Item | Today | After |
|---|---|---|
| **By Product chart at stop K** | Sums all delivery orders' products → route-total demand | Shows **on-truck balance per product AFTER stop K's transaction** (post-load if K is a load, post-delivery if K is a delivery). |
| **By Compartments chart at stop K** | Distributes total loaded volume across compartments → route-total fill | Shows **compartment fills AFTER stop K's transaction** via sequential drain (single-product routes only — R1, R2). |
| **Sheet input** | `orders[]`, `truckProfile`, `anchor*` | Adds `selectedOrderId` so the sheet knows which stop to render. |
| **Y-axis range** | Picked from data max | Should reflect truck capacity ceiling so stops with low fill don't appear "huge" relative to the chart. Use truck `productCapacities` per product and `compartments[i].capacities` per compartment. |
| **Empty-state bar** | Bar at 0 hidden | Bar with value 0 still shown (bar is invisible / opacity 0) so the X-axis label appears, matching Figma's "C5 ~10%" pattern where empty compartments still occupy slots. |
| **Negative balance bar** | n/a | When a product runs short (e.g. R3 Gas at Stop 6 = −100), the bar **dips below the X-axis** by the shortfall amount. Y-axis extends just enough below 0 to show the negative slice (e.g. one extra step at −500). Same product color, no red tint. |

## Sequential drain algorithm (single-product)

Used for R1 (5 comps × Diesel CLR) and R2 (3 comps × ULSD). Multi-product (R3) skips compartment chart per the existing rule.

```
state: comps[i].fill = 0 for all i
For each order in route order:
  if order.type === "L":
    remaining = order.productBreakdown[product].volume
    for each comp in order: fill room = comp.capacity - comp.fill;
                            add = min(room, remaining); comp.fill += add; remaining -= add
  if order.type === "D":
    remaining = order.productBreakdown[product].volume
    for each comp in order (C1 → Cn):
      draw = min(comp.fill, remaining); comp.fill -= draw; remaining -= draw
  Push snapshot of comps state, keyed by order.id
```

Verified against R1 spec table:
- After Load Flint Hills (+4,600): C1=1000, C2=1000, C3=1500, C4=1000, C5=100. ✓
- After Stop 2 Mueller (−1000): C1=0, C2=1000, C3=1500, C4=1000, C5=100. ✓
- After Stop 4 Elgin (−1000): drains C2 (200→0) then C3 (1500→700). ✓
- ...all subsequent stops match the spec.

Verified against R2 spec table:
- After Load Valero (+4,200): C1=1500, C2=1500, C3=1200. ✓
- After Stop 2 Georgetown (−1200): C1=300, C2=1500, C3=1200. ✓
- ...all subsequent stops match.

---

## Files to modify

- `components/breakdown-sheet.tsx` — main work. Add `selectedOrderId` prop. Replace route-total computation with per-stop snapshot. Add inline sequential-drain timeline computation (single-product). Replace By-Product source with timeline's product totals.
- `components/lasso-workspace-sheet.tsx` — pass `selectedOrderId={breakdownOrderId}` to `<BreakdownSheet>`. The state already exists.

No changes needed to `lib/capacity-validation.ts` — its `runningBalance` already produces post-transaction product totals, but to keep the sheet self-contained (independent of the validator) we'll compute fresh inside the sheet from `orders + truckProfile`.

## Reuse, don't reinvent

- **`runningBalance: BalanceRow[]`** in `lib/capacity-validation.ts:27–32, 175–198` — already produces post-transaction per-product totals per stop. Keyed by `stopName` + `stopIndex`. We'll match by stop sequence rather than calling validator from the sheet (cleaner separation).
- **`TruckCompartment.capacities: Partial<Record<FuelProduct, number>>`** in `lib/truck-data.ts:11–14` — gives per-compartment per-product capacity for the drain algorithm.
- **`PRODUCT_BAR_COLOR` map + `chooseYAxis()` + `<BarChart>` sub-component** already in `components/breakdown-sheet.tsx` — keep, just feed them the new per-stop data.
- **Anchoring + flip + viewport-clamp** already in the sheet — no change.

---

## Implementation steps (this milestone)

1. **Add `selectedOrderId: string | null` prop to `BreakdownSheet`.** Pass it from `lasso-workspace-sheet.tsx` (the state exists as `breakdownOrderId`).
2. **Compute timeline in the sheet** (memoized over `orders + truckProfile`):
   - For every product appearing on the route, walk orders in `routeSequence` order, accumulate per-product `onTruck` balances. Push one snapshot per order keyed by `order.id`.
   - For single-product routes, additionally walk compartments per `TruckCapacityProfile`. On `L`: fill C1→Cn until volume exhausted. On `D`: drain C1→Cn. Push compartment snapshot per order.
3. **Pick the snapshot** for `selectedOrderId`. If not found, default to the last order's snapshot (defensive).
4. **By Product bars** = the snapshot's `onTruck[product]` values. One bar per product that appears on the route. Y-axis ceiling = `max(truckProfile.productCapacities[product], routeMaxLoaded)`.
5. **By Compartments bars** = the snapshot's compartment fills. Only render when route's distinct products = 1 (existing rule). Y-axis ceiling = `max(comp.capacity)` across the truck.
6. **Empty bars (value = 0)** still render with axis label so the snapshot looks consistent (matches Figma's "C1 not yet allocated" variant).

---

## What we're explicitly NOT doing this milestone

- ❌ **Compartment chart for multi-product routes** — R3 stays product-only. Multi-product compartment allocation has too many valid arrangements to commit to one without designs.
- ❌ **Bar hover tooltips** — deferred. The static snapshot is enough for this pass.
- ❌ **Scenario comparison modal** — R3 Options 2 & 3 still deferred. Default = Option 1 only.
- ❌ **Per-stop "running balance trace" (separate vertical-line viz)** — different feature, separate milestone.
- ❌ **R4/R5** — untouched.
- ❌ **Title that names the stop** — sheet title stays generic ("Product and Compartment breakdown"). Card hover state already signals which order's sheet is open.

---

## Verification (manual, in browser at localhost:3000)

**R1 (single-product, 5 comps) — sequential drain check:**

1. Expand R1, hover **Flint Hills - Johnny Morris** (load), click package icon. Sheet shows:
   - By Product: Diesel CLR bar at **4,600**.
   - By Compartments: C1=1000, C2=1000, C3=1500, C4=1000, **C5=100** (the small bar matches Figma).
2. Click package on **Mueller Construction** (Stop 2). Sheet shows:
   - By Product: Diesel CLR at **3,600**.
   - By Compartments: **C1=0**, C2=1000, C3=1500, C4=1000, C5=100.
3. Click package on **Elgin Concrete** (Stop 4). By Compartments: C1=0, C2=0, C3=700, C4=1000, C5=100.
4. Click package on **Austin Bergstrom Fleet** (last stop). All compartments at 0; By Product at 0.

**R2 (single-product, 3 comps) — same check after user adds Load 2:**

5. Expand R2, click package on **Georgetown Fuel Depot** (Stop 2). By Compartments: C1=300, C2=1500, C3=1200. By Product: 3,000.
6. Click package on **Pflugerville Fleet** (Stop 5). By Compartments: C1=0, C2=0, C3=200. By Product: 200.

**R3 (multi-product) — product-only check:**

7. Expand R3, click package on **Lakeway Fuel Stop** (Stop 2). Sheet shows two product bars: Diesel CLR ≈ 2,400, Gas ≈ 1,300. **No compartment chart**.
8. Click package on **Lost Creek Equipment** (Stop 5). Diesel ≈ 900, Gas ≈ 200.
9. Click package on **Barton Creek Ranch** (Stop 6, the break point). Diesel ≈ 400 (positive), Gas ≈ −100 — Gas bar dips **below the X-axis** by ~100. Same product color, no red tint.

**Cross-cutting:**

10. Switching between stops (without closing the sheet) updates the bars in place — no flicker.
11. The card whose sheet is open keeps the hover bg `#282828` and the FAB stays hidden.

---

## Future scope — Phase 1.3 follow-ups (next up)

1. **Multi-product compartment view (R3)** — once we lock the allocation rule (e.g. "Diesel fills C1→Cn first, Gas fills the remaining slots"), R3 can show compartments too. Currently R3 is product-only by design.
2. **Bar hover tooltips** — exact numeric readouts on hover (e.g. "C3: 700 / 1,500 gal · 47%"). Designs not yet provided.
3. **Scenario comparison modal** — R3 has 3 loading options (Diesel-first, Gas-first, Balanced). We hard-pin Option 1 today; the modal that lets the user switch is queued, design pending.
4. **Per-stop running balance trace** — separate viz from this sheet: a vertical line/curve along the route timeline showing balance trends across all stops.
5. **Sheet title naming the stop** — title is generic today ("Product and Compartment breakdown"). The card hover state already signals which stop is open. Revisit if usability requires it.

## Queued from master to-do (parked, not started)

6. **R4 + R5 scenario assignment + data** — both use legacy mock data today; need scenarios and product/compartment definitions.
7. **R3 compartment breakdown with sequential drain (one option as proof)** — overlaps with #1 above, framed as a smaller proof.
8. **Incompatibility variant** — add kerosene to one R3 stop to exercise product-mismatch handling.
9. **Approach 1 depletion view iterations** — visual graph alternative, separate from bar charts.
10. **Path 2a scenario comparison modal** — same as #3 above.
11. **Retain input integration** — R3 retained is zeroed today; flip back on when needed (number change + UX for editing).

## Parked further out

- Config modeling (9+ scenarios, unequal capacity)
- Path 2b configurator / simulator
- Talk track + presentation update
- FigJam validation framework update
- S/M template skill
- Product category vs product in UI
- Unified product balance modal from route card
- Driver-truck-trailer mapping (Yogesh)
- Per-stop manual override (out of scope)
