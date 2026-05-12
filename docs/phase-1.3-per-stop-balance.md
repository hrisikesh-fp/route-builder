# Phase 1.3 — Route Builder (Milestone 5: route-level Product & Truck Summary sheet)

> Continuation of Phase 1.3. Milestones 1–4 are complete (data updates, breakdown sheet shell, per-stop dynamic data, hover interactions). This milestone adds a **route-level summary sheet** with two tabs — Products and Truck & Compartments — triggered from a new "scan-eye" icon button on each route-card FAB.

## Context

The breakdown sheet shows per-stop balances per ORDER (one stop at a time). Dispatchers also need a route-wide summary: what does this route demand in total? What's the truck's capability? Today there's no such view.

Per Figma (`Product & Truck Summary` sheet, RB-1.3 file):
- Sheet is **640 × ~280–400 px**, two-tab content area.
- Tab 1: **Products (N)** — a table listing each product on the route, its planned qty (sum of all deliveries), and the compartments configured for it. Total row at the bottom.
- Tab 2: **Truck & Compartments** — truck name, specs line (gal · compartments · products), and a horizontal row of compartment cards (C1, C2…) each showing its max capacity. A caption under each card lists all products that compartment is configured to hold.
- Triggered from a NEW **scan-eye / "View Product & Truck Summary"** icon button on the route-card FAB cluster, positioned BEFORE the Sparkles (optimise) icon.

The user notes: "we'll demo only the Products tab; truck tab is built but not focal yet." Both tabs are in scope this milestone.

Animation cohesion: tabs swap content with no fancy entry animation. Sheet open mirrors the breakdown sheet's appearance pattern (instant, with Emil's standard motion treatment if added later).

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
| Bar hover tooltips: value label + config tooltip + skip-delay | ✅ (M4) |
| Subheader→chart spacing 12px; CSS-keyframe entry animation | ✅ (M4) |

## What changes this milestone

| Item | Spec |
|---|---|
| **New FAB icon on route card** | Add a fourth icon button to the route-card FAB cluster, positioned **first** (before Sparkles). Lucide icon: **`ScanEye`** (square frame with eye), 16px. Same 24×24 button shell as the others. Hover bg `#333`, transparent default. |
| **Hover tooltip on icon** | "View Product & Truck Summary" — same light tooltip style as the bar hover (bg `#FAFAFA`, dark text), positioned below the FAB. Same Emil-style entry animation. |
| **Sheet trigger** | Click → opens new Route Summary sheet. Same dropdown-style anchoring as the breakdown sheet (4px LEFT of route card, flip RIGHT if no room, vertical clamp 16px gutter). |
| **Sheet container** | `640px` wide × variable height. BG `#1f1f1f`, padding `16px`, gap `16px`, radius `8px`, `position: fixed`, `zIndex: 10000`. |
| **Header** | "Product & Truck Summary" (`#e5e5e5`, 18px Geist Medium) + N-Orders badge (bg `#111`, color `#fafafa`, 14px, rounded 4) + X close (top-right). |
| **Tab bar** | 40px tall, bottom border `#333` 1px. Active tab: bg `#282828`, top corners rounded 4, bottom border `#6366f1` (indigo-500) 1px, text `#e5e5e5` Geist Medium 14px. Inactive: transparent bg, text `#a3a3a3` Geist Regular 14px. Padding `12px 4px`. Tab labels: **"Products (N)"** where N = distinct product count on the route, and **"Truck & Compartments"**. |
| **Products tab table** | Container border `1px #282828` rounded 4. 3 columns: **Product / Planned Qty / Compartments**. Header row 40px bg `#333` text `#a3a3a3`. Data rows 64px no bg, border-bottom `1px #282828`, text `#e5e5e5`. Total row 40px bg `#1b1b1b` text `#e5e5e5` Geist Medium. Column padding `12px`. |
| **Truck tab content** | Truck-info section (truck icon + name + specs line "{gal} gal · {N} Compartments · {N} Products" in `#a3a3a3`) + "Compartment breakdown" label (16px Geist Light `#a3a3a3`) + horizontal grid of compartment cards. |
| **Compartment cards** | Each card: bg `#1b1b1b`, border `1px #333`, rounded 4, padding `8px 24px`, flex column items-center gap 4. Line 1: comp id (`#e5e5e5` 14px Geist Medium). Line 2: max capacity (`#a3a3a3` 12px Geist Regular, e.g. "1,000 gal max."). Caption UNDER each card: comma-separated list of ALL configured products (`#737373` 12px, e.g. "Diesel-Offroad CLR, Gas"). |
| **Compartment caption rule** | Show **all configured products** for each compartment (not filtered to route). Different from the breakdown-sheet rule because this tab is about the TRUCK's capability, not the route's contents. |

## Data derivation

| What | Source |
|---|---|
| Order count badge | **Total orders on the route** including loads (`orders.length`). Decided 2026-05-11: matches the route-card header badge for consistency. R1 with load = "7 Orders". Without load = "6 Orders". |
| Products table rows | For each distinct product in route's delivery orders: `{ product, plannedQty: sum of all D-order volumes for this product, compartments: compartmentsForProduct(product, truckProfile).join(", ") }` |
| Total row | "Total" / sum of all plannedQty across products / "-" |
| Truck specs line | `{truckProfile.totalCapacity} gal · {truckProfile.compartments.length} Compartments · {distinctProductsConfigured.size} Products` |
| Compartment card capacity | The MAX value across `c.capacities` (since multi-product compartments have the same max for each product) |
| Compartment caption | `Object.keys(c.capacities).map(p => PRODUCT_LABEL[p]).join(", ")` — every product the compartment can hold, friendly-labeled |

## Files to modify

- `components/lasso-workspace-sheet.tsx`:
  - Import `ScanEye` from lucide.
  - Add the new icon button at the start of the route-card FAB cluster (the existing FAB at line ~541 area).
  - Wire its `onClick` → new state `routeSummaryOpenForRouteId: string | null` + anchor coords (cardLeft/cardRight/fabTop, same pattern as breakdown sheet).
  - Hover tooltip uses a small reusable wrapper or styled-jsx; same light bg `#FAFAFA` look.
  - Render `<RouteSummarySheet ... />` near the other modal mounts (alongside `<BreakdownSheet>` block).
  - While sheet is open: hide route-card FAB, keep the route card in hovered state (`#282828` bg) — same pattern as breakdown-sheet's order-card behavior.

- `components/route-summary-sheet.tsx` (**NEW**):
  - Props: `isOpen`, `onClose`, `orders`, `truckProfile`, `truckName`, `anchorLeft`, `anchorRight`, `anchorY`.
  - Internal state: `activeTab: "products" | "truck"`, default `"products"`.
  - Two tab panels rendered conditionally based on `activeTab`.
  - Reuses `PRODUCT_LABEL` and `compartmentsForProduct` from `breakdown-sheet.tsx` (export them from a small shared util OR re-declare locally — keep simple, re-declare locally for now).

## Reuse, don't reinvent

- **Anchoring math** in `breakdown-sheet.tsx` — copy the 4px-left-with-right-flip + vertical-clamp logic.
- **`PRODUCT_LABEL`** display-name map — duplicate locally (so the file is self-contained; we'll DRY this up only if a third user appears).
- **Truck icon + grip + caret pattern** already in `lasso-workspace-sheet.tsx` route-card header — match that styling for the truck-info row.
- **FAB icon button shell** already in route-card FAB (Sparkles button). Same hover behavior — copy/extend.
- **Tooltip "View Product & Truck Summary"** can reuse the same light-bg pattern as the bar-hover tooltip from `breakdown-sheet.tsx`.

## Implementation steps

1. **New FAB button (workspace sheet)**:
   - Import `ScanEye` from lucide-react.
   - In the route-card FAB cluster, prepend a new 24×24 button before the Sparkles button. Same hover bg `#333`, transparent default.
   - Wrap in a hover-tooltip ("View Product & Truck Summary") using the same light-bg styling as bar tooltips.

2. **State plumbing (workspace sheet)**:
   - Add `routeSummaryOpenForRouteId`, `routeSummaryAnchorLeft`, `routeSummaryAnchorRight`, `routeSummaryAnchorY` state.
   - On ScanEye click: capture `cardRect.left/right` and FAB rect top, set state.
   - Hide route-card FAB while sheet is open (existing FAB opacity pattern + add `isRouteSummaryOpen` to the visibility check).
   - Keep route-card in hover state while sheet is open (same pattern as order-card → breakdown).

3. **New `route-summary-sheet.tsx`**:
   - Sheet shell with header, tab bar, tab content area.
   - Anchoring logic copied from breakdown-sheet.
   - Active-tab state, default Products.

4. **Products tab body**:
   - Compute product rows from `orders` (delivery only, group by product, sum volumes).
   - Render 3-column table per Figma spec.
   - Total row computed inline.

5. **Truck tab body**:
   - Truck-info row from `truckName` + `truckProfile`.
   - Compartment grid from `truckProfile.compartments`.

6. **Anchor + reuse** — verify dropdown-style positioning works at 640px width (might need slightly different right-flip math vs 600px breakdown sheet).

---

## What we're explicitly NOT doing this milestone

- ❌ **Tab content entry animation** — content swaps instantly when switching tabs. Add motion polish later if needed.
- ❌ **Keyboard focus on tabs** — arrow-key tab navigation deferred. Mouse only for now.
- ❌ **Editable products / qty / compartments** — read-only summary. Click on a row does nothing.
- ❌ **R4/R5 visual updates** — untouched (the summary will still render for them using their existing mock data).
- ❌ **Demo of Truck tab** — user explicitly said they'll demo only Products tab to the team. Truck tab is BUILT (not hidden), just not the focus of the talk-track.
- ❌ **Multi-product compartment view in BreakdownSheet** — still deferred (separate milestone).
- ❌ **Scenario comparison modal** — R3 Options 2 & 3 still deferred.

---

## Verification (manual, in browser at localhost:3000)

**FAB icon button:**

1. Expand R1. Hover the route card → FAB cluster appears with 4 icons in order: **ScanEye → Sparkles → (ExternalLink if published) → MoreVertical**.
2. Hover the ScanEye icon → small light-bg tooltip "View Product & Truck Summary" appears beneath it.
3. Click ScanEye → Route Summary sheet opens, anchored 4px to the LEFT of the route card (flips right if no room). Vertical clamped to viewport.

**While sheet is open:**

4. The route-card FAB stays hidden; the route card keeps its hover bg (`#282828`).
5. Click X to close → sheet dismisses; FAB returns on hover.

**Products tab (default):**

6. R1: table has header row "Product | Planned Qty | Compartments" and ONE data row "Diesel-Offroad CLR | 4,600 gal | C1, C2, C3, C4, C5". Total row "Total | 4,600 gal | -".
7. R2: ONE data row "ULSD | 5,100 gal | C1, C2, C3". Total row "Total | 5,100 gal | -".
8. R3: TWO data rows — "Diesel-Offroad CLR | 3,000 gal | C1, C2, C3, C4" and "Gas | 2,000 gal | C1, C2, C3, C4". Total row "Total | 5,000 gal | -".
9. Header badge: shows TOTAL order count incl. loads. R1 without load = "6"; with load added = "7". R2 = "6" (5 deliveries + 1 load). R3 = "7" (6 deliveries + 1 load).

**Truck & Compartments tab:**

10. Click "Truck & Compartments" tab → active indicator (indigo underline) moves; content swaps.
11. R1: truck row "🚚 H-118 · 2019 Kenworth Tank Wagon" with specs "5,500 gal · 5 Compartments · 2 Products". Below that, 5 compartment cards: C1 1,000 gal max., C2 1,000 gal max., C3 1,500 gal max., C4 1,000 gal max., C5 1,000 gal max. Each card's caption: "Diesel-Offroad CLR, Gas".
12. R2: truck "H-205 · 2021 Peterbilt Tanker", specs "4,200 gal · 3 Compartments · 1 Product". Cards C1 1,500, C2 1,500, C3 1,200. Caption per card: "ULSD".
13. R3: truck "H-310 · 2020 Freightliner Tanker", specs "4,600 gal · 4 Compartments · 2 Products". Cards C1 1,200, C2 1,200, C3 1,200, C4 1,000. Caption per card: "Diesel-Offroad CLR, Gas".

**Cross-cutting:**

14. Resize window narrow enough that left placement no longer fits → sheet flips to right of card.
15. Tab switching is instant; no janky reflow.
16. Clicking outside the sheet does NOT close it (only X does). Confirm consistent with breakdown sheet behavior.

---

## Future scope — Phase 1.3 follow-ups (next up)

1. **Multi-product compartment view (R3)** — once we lock the allocation rule.
2. ~~Bar hover tooltips — exact numeric readouts on hover.~~ ✅ Shipped in Milestone 4.
3. **Scenario comparison modal** — R3 has 3 loading options. We hard-pin Option 1 today.
4. **Per-stop running balance trace** — separate viz: vertical line/curve along the route timeline showing balance trends.
5. **Sheet title naming the stop** — generic today.
6. **Highlight hovered bar** — deliberately skipped.
7. **Sheet entry animation** — route summary opens instantly today; Emil-style scale+fade entry can be added.
8. **Tab content entry animation** — instant swap today.
9. **Keyboard navigation for tabs** — mouse only today.

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
