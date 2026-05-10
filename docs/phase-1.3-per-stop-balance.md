# Phase 1.3 — Per-Stop Balance (Milestone 4: hover interactions + spacing polish)

> Continuation of Phase 1.3. Milestones 1, 2, 3 are complete (data updates, breakdown sheet shell, per-stop dynamic data). This milestone adds **bar hover interactions** (config tooltip + value label) and a small **spacing tweak** between subheader and chart. Applies Emil Kowalski's design-engineering principles for motion polish.

## Context

The breakdown sheet is functionally correct (per-stop dynamic data) but it's silent — no way to see *what each bar means* without referencing the truck config separately. Per Figma:

- **Hover a "By Product" bar** → tooltip listing the truck compartments that can hold that product (e.g., Diesel CLR → `C1, C2, C3, C4, C5`).
- **Hover a "By Compartments" bar** → tooltip listing the products that compartment is configured to hold (e.g., C3 → `Diesel-Offroad CLR`).
- **Hover any bar** → an in-chart value label appears above the bar (e.g., `4600 gal`, `1,500 gal`).
- **No clicks.** Pure hover, like a chart in Recharts/Observable Plot.

Plus a small spacing tweak: the subheader ("By Product" / "By Compartments") and the chart below currently sit at `gap: 8` but read as too tight. Bump to `12`.

This milestone applies Emil Kowalski's design-engineering principles (`/.claude/skills/emil-design-eng/SKILL.md`) — animations are CSS transitions (interruptible), use a strong custom ease-out curve, durations stay 125–200ms (tooltip-class), tooltips skip delay on subsequent hovers, hover gated on `(hover: hover) and (pointer: fine)`, only `transform` + `opacity` are animated.

---

## What's already in place (Milestones 1, 2, 3 shipped)

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
| Per-stop dynamic snapshot in sheet: by-product onTruck + sequential drain | ✅ (M3) |
| Negative bars dip below X-axis when balance < 0 (R3 Stop 6 Gas) | ✅ (M3) |

## What changes this milestone

| Item | Today | After |
|---|---|---|
| **Bar hover** | None | Hovering a bar shows: (a) value label `{n} gal` floating above the bar, (b) tooltip with truck-config context. |
| **Product-bar tooltip** | n/a | Heading `Compartments` + comma-separated list of compartments configured for that product (e.g. R1 Diesel CLR → `C1, C2, C3, C4, C5`). |
| **Compartment-bar tooltip** | n/a | Heading `Products` + comma-separated list of products configured for that compartment, **filtered to products that actually run on this route** (e.g. R1 C3 → `Diesel-Offroad CLR` even though the comp can hold Gas too — Gas isn't on R1). Decided 2026-05-10 (Option A): consistent with the "By Product" chart, which already only shows requested products. Easy to flip to "show all configured" later if it becomes useful. |
| **Subheader → chart spacing** | `gap: 8` | `gap: 12` (visually too tight at 8 even though spec says 8). |
| **Tooltip motion** | n/a | CSS transitions, `transform: scale(0.97) → scale(1)` + `opacity: 0 → 1`, `175ms`, custom curve `cubic-bezier(0.23, 1, 0.32, 1)` (Emil's strong ease-out). `transform-origin` set to the bar's top edge so the tooltip scales out *from* the bar, not from its own center. |
| **Subsequent-hover delay** | n/a | First hover delays ~150ms before tooltip appears. While a tooltip is already open, hovering a sibling bar shows its tooltip **instantly with no animation** (Emil's "tooltip skip-delay" rule). |
| **Hover gating** | n/a | Wrap interactions in `@media (hover: hover) and (pointer: fine)` so touch devices don't trigger sticky tooltips. |
| **Reduced motion** | n/a | `@media (prefers-reduced-motion: reduce)` → opacity-only transition (no scale). |

## Tooltip data derivation

```ts
// Build once from truckProfile + the route's distinct product set
const routeProducts = new Set(distinctProductsOnRoute) // already computed for chart rule

function compartmentsForProduct(p: FuelProduct, truck: TruckCapacityProfile): string[] {
  return truck.compartments
    .filter(c => (c.capacities[p] ?? 0) > 0)
    .map(c => c.id)
}

function productsForCompartment(c: TruckCompartment, routeProducts: Set<string>): string[] {
  return Object.entries(c.capacities)
    .filter(([_, cap]) => (cap ?? 0) > 0)
    .map(([product]) => product)
    .filter(p => routeProducts.has(p)) // only products actually on this route
}
```

Display via `PRODUCT_LABEL` map (already in the sheet) — e.g. `200*DIESEL-ONROAD CLEAR` → `Diesel-Offroad CLR`.

## Visual details

**Tooltip body** (per Figma screenshots):
- Background `#FAFAFA`, text `#171717`.
- Padding `12px`, gap `4px` between heading and list, rounded `6px`.
- Heading: `font-size 14, weight 500, color #171717`.
- List: `font-size 14, weight 400, color #525252`.
- Small downward triangle pointer (8px wide, 4px tall) on the bottom edge, centered on the bar.

**Value label above bar** (per Figma):
- Plain text `{n.toLocaleString()} gal`, `font-size 14, weight 500, color #FAFAFA`.
- Sits centered above the bar's top edge, ~6px gap.
- For negative bars (R3 Stop 6 Gas), the label sits *below* the bar (since the bar is below x-axis) so it doesn't get clipped.

**Layering**:
- Tooltip layered above the chart (`zIndex: 1` within chart) but stays inside the sheet's stacking context.
- Sheet itself is at `zIndex: 10000` (existing) — tooltip inherits this context.

## Files to modify

- `components/breakdown-sheet.tsx` — main work. Add per-bar `onMouseEnter` / `onMouseLeave`. Track `hoveredBarKey` state (string id like `product:200*DIESEL-ONROAD CLEAR` or `comp:C3`). Render value label + tooltip conditionally. Manage "skip-delay-after-first-hover" via a `lastHoverTimeRef`. Bump subheader→chart `gap` from 8 to 12. Add `prefers-reduced-motion` and `hover: hover` media gates.

No other files need changes.

## Reuse

- **`PRODUCT_LABEL`** map already in the sheet for display names.
- **`<BarChart>`** sub-component — extend its bar item to accept `onHover`/`onLeave` callbacks; bar element already has unique key.
- **Existing chart geometry** (`PLOT_H`, `Y_AXIS_W`, `zeroLineTop`) — reuse for tooltip positioning math.

## Implementation steps

1. **Bump spacing**: change `gap: 8` → `gap: 12` on the two `<div>`s wrapping subheader + chart.
2. **Add `hoveredBarKey` state** to `BreakdownSheet`.
3. **Plumb `onHover(key)` and `onLeave()`** through `<BarChart>` to each bar.
4. **Build tooltip data lookup tables** at the top of the sheet body (`compartmentsByProduct`, `productsByCompartment`) — pure derivation from `truckProfile` + `routeProducts`.
5. **Render value label** above each hovered bar (positioned via the same percentage math used for the bar itself).
6. **Render tooltip** below the value label (or above the bar's bottom edge for negative bars). Use `position: absolute` inside the chart with `top` / `left` computed from the bar's index + chart geometry.
7. **Animation**: define CSS-in-JS transitions on tooltip wrapper (`opacity`, `transform: scale`). Use `@starting-style` if supported, otherwise mount-then-set-data-attr pattern.
8. **Skip-delay timer**: `lastHoverTimeRef = useRef<number>(0)`. On hover, if `Date.now() - lastHoverTimeRef.current < 600ms`, skip the entry delay. Update `lastHoverTimeRef` on every leave.
9. **Hover gating** wrap event handlers in a `useMediaQuery("(hover: hover) and (pointer: fine)")` check so touch devices skip the hover system entirely.
10. **Reduced motion**: read `useReducedMotion()` (or matchMedia inline). If true, set transition to `opacity 100ms linear` and remove the scale.

---

## What we're explicitly NOT doing this milestone

- ❌ **Compartment chart for multi-product routes** — R3 stays product-only.
- ❌ **Scenario comparison modal** — R3 Options 2 & 3 still deferred.
- ❌ **Click interactions on bars** — pure hover, no click. Tapping on touch is intentionally no-op.
- ❌ **Keyboard focus on bars** — graphs are visual; arrow-key navigation across bars is out of scope.
- ❌ **Highlighting the hovered bar** (e.g. brightening color) — the value label + tooltip is enough signal. Adding a highlight risks visual noise.
- ❌ **Per-stop "running balance trace" (separate vertical-line viz)** — different feature, separate milestone.
- ❌ **R4/R5** — untouched.
- ❌ **Title that names the stop** — sheet title stays generic.

---

## Verification (manual, in browser at localhost:3000)

**Hover behavior:**

1. Open R1 breakdown sheet on Flint Hills load. Hover the Diesel CLR bar in "By Product":
   - Value label `4,600 gal` appears above the bar.
   - Tooltip below value label: heading `Compartments`, body `C1, C2, C3, C4, C5`.
   - Animation: fades + scales 0.97 → 1 over ~175ms.
2. Move pointer off → tooltip + label disappear (also via fade/scale).
3. Re-hover within ~500ms → tooltip appears **instantly, no animation** (skip-delay rule).
4. Hover the C3 bar in "By Compartments":
   - Value label `1,500 gal`.
   - Tooltip: heading `Products`, body `Diesel-Offroad CLR`.

**R2 (single product ULSD):**

5. Hover the C1 bar in any R2 stop's sheet → tooltip body `ULSD`.
6. Hover the ULSD bar in "By Product" → tooltip body `C1, C2, C3`.

**R3 (multi-product, product-only chart):**

7. Hover Diesel-Offroad CLR bar at any stop → tooltip body `C1, C2, C3, C4` (all four R3 comps hold both Diesel and Gas).
8. Hover Gas bar at any stop → tooltip body `C1, C2, C3, C4`.
9. At R3 Stop 6 Barton Creek (Gas = −100), hover the negative-dipping Gas bar → value label `-100 gal` (with minus sign) appears *below* the bar (since the bar is below the X-axis). Tooltip is offset accordingly so it doesn't overlap the label.

**Spacing check:**

10. Inspect the gap between subheader `By Product` and the chart. Should be **12px** (was 8). Same for `By Compartments`.

**Motion polish:**

11. With macOS "Reduce Motion" turned on, hover a bar → tooltip uses opacity-only transition (no scale). Verify in browser DevTools by toggling `prefers-reduced-motion`.
12. On a touch device (or simulated touch in DevTools), tapping a bar does nothing — no sticky tooltip, no click-to-open behavior.

**Cross-cutting:**

10. Switching between stops (without closing the sheet) updates the bars in place — no flicker.
11. The card whose sheet is open keeps the hover bg `#282828` and the FAB stays hidden.

---

## Future scope — Phase 1.3 follow-ups (next up)

1. **Multi-product compartment view (R3)** — once we lock the allocation rule (e.g. "Diesel fills C1→Cn first, Gas fills the remaining slots"), R3 can show compartments too. Currently R3 is product-only by design.
2. ~~Bar hover tooltips — exact numeric readouts on hover.~~ ✅ Shipped in Milestone 4.
3. **Scenario comparison modal** — R3 has 3 loading options (Diesel-first, Gas-first, Balanced). We hard-pin Option 1 today; the modal that lets the user switch is queued, design pending.
4. **Per-stop running balance trace** — separate viz from this sheet: a vertical line/curve along the route timeline showing balance trends across all stops.
5. **Sheet title naming the stop** — title is generic today. The card hover state already signals which stop is open. Revisit if usability requires it.
6. **Highlight hovered bar** (subtle brightness shift on the bar fill) — deliberately skipped this milestone; revisit if usability calls for it.

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
