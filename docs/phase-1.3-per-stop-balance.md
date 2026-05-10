# Phase 1.3 — Per-Stop Balance

> Part of Phase 1.3. Foregrounds the user-facing outcome (per-stop product/compartment balance) over the internal S1/S2/S3 scenario IDs.
> Frozen plan, copied from `~/.claude/plans/`. Source of truth for this round of work.

## Context

We're extending route-builder to make per-stop product + compartment allocation visible. Today the validator already computes balance internals (`validation.runningBalance`) but nothing renders. Phase 1.3 brings a **Product and Compartment Breakdown sheet** into the UI, triggered from a new package-icon FAB on each order card.

We're also restructuring R1/R2/R3 mock data to demonstrate three scenarios:

- **R1 (Mark Ruffalo) — S1**: simplest. 1 product, fits in 1 load. No issues.
- **R2 (Dwayne Johnson) — S2**: certain shortfall. 1 product, over capacity, mid-route load needed.
- **R3 (Jessica Harper) — S3**: volume split. 2 products, mid-route load needed, multiple loading options.

Starting case for the UI: R1 + first delivery order (Mueller Construction).

---

## What's already in place (no work needed)

| Item | Spec'd | Already in code? |
|---|---|---|
| R1 truck = H-118 Kenworth Tank Wagon | ✅ | ✅ same |
| R1 stops (Mueller → Bergstrom, 05:45–09:30) | ✅ | ✅ same customers + times |
| R2 truck = H-205 Peterbilt Tanker, 4,200 gal, 3 comp ULSD | ✅ | ✅ matches |
| R2 stops (Georgetown → Hutto) + qty totals | ✅ | ✅ matches exactly (5,100 gal) |
| R2 Load 1 = Valero Taylor 4,200 gal ULSD | ✅ | ✅ in route |
| R3 truck = H-310 Freightliner | ✅ | ✅ same truck |
| R3 stops (Lakeway → Circle C) + times | ✅ | ✅ same customers + times |
| `validation.runningBalance` per-stop computation | ✅ | ✅ already produced by `validateRouteCapacity()` |

**R2 data is essentially done.** Real data work is R1 + R3.

## What actually needs to change — DATA

| Item | Change |
|---|---|
| R1 truck capacity | 5,000 → **5,500 gal** |
| R1 compartments | Per-product allocations (Red 2300 / Clear 1800 / 87 1700) → **5 equal-volume compartments holding Diesel CLR or Gas 87** (1000+1000+1500+1000+1000) |
| R1 stop products | Mixed (Red/Clear/87) → **all stops Diesel CLR only** |
| R3 truck capacity | 4,800 → **4,600 gal** |
| R3 compartments | Red 2800 / Clear 1800 → **4 equal-volume compartments holding Diesel CLR or Gas 87** (1200+1200+1200+1000) |
| R3 stop products | Red + Clear → **Diesel-Offroad CLR + Gas 87** |
| R3 stop quantities | Total 3,450 → **5,000** (per spec table) |
| R3 Load 1 | Flint Hills Red 1,500 + Clear 1,300 = 2,800 → **Flint Hills Diesel 3,000 + Gas 1,600 = 4,600** (Option 1 default) |
| R3 retained fuel | Red 300 + Clear 500 → **zero out** for now (decided 2026-05-10). Easy to dial back in later — it's just a number. |
| R2 mid-route Load 2 | Add Valero Taylor 900 gal ULSD at 08:30 AM to `add-load-order-modal.tsx` so user can add via modal between Pflugerville and Hutto |

## What actually needs to change — UI

| Item | Change |
|---|---|
| **Order card FAB** | Add new floating cluster (package icon + ellipsis) at top-right of each order card. Container: bg `#1B1B1B`, border `1px #282828`, rounded 4, padding 4. Two 24×24 buttons. Mirrors route-card FAB pattern. **Visibility:** package icon only enabled after at least one load order is added to the route. |
| **L badge stroke** | Remove stroke. Solid fill `#189ffc`, dark text, rounded 4. |
| **D badge stroke** | Remove stroke. Solid fill `#25b8a7`, dark text, rounded 4. |
| **Product & Compartment Breakdown sheet** | New component. Opens from order-card FAB package icon. Header "Product and Compartment breakdown" + X close (top-right). Bg `#1f1f1f`, padding `16px`, gap `16px`, rounded `8px`. |
| **Sheet rendering rule** | **`products.length === 1`** → render both "By Product" + "By Compartments" charts. **`products.length > 1`** → render "By Product" only; compartment chart structurally omitted (panel shrinks ~168px). |
| **Bar chart spec** | Each chart `523w × 168h`. Bars rounded-xs (2px) top corners only. Y-axis steps: 0/500/1000/1500/2000 (small) or 0/1500/3000/4500/6000 (large) depending on max value. |
| **Per-product bar colors** | Diesel-Offroad RED → `rgba(250, 100, 0, 0.5)` (orange). Diesel-Offroad CLR → `rgba(129, 140, 248, 0.55)` (indigo). Gas / 87 Octane → `rgba(163, 163, 163, 0.65)` (neutral). ULSD → TBD; default to indigo until specified. |
| **Compartment bar color** | Single fill `rgba(129, 140, 248, 0.55)` (indigo) — color encodes "compartment" not product, so all bars same color. |
| **Sheet route mapping** | R1 (1 product) → both charts. R2 (1 product) → both charts. R3 (2 products) → product-only. |

---

## Files to modify

**Data:**
- `lib/truck-data.ts` — restructure compartment definitions for **H-118** (R1) and **H-310** (R3). Existing `TruckCompartment` shape supports interchangeable products per compartment.
- `lib/mock-data.ts` (lines 2871–2929) — replace `productBreakdown` for R1 and R3 stops. Update R3 retained + Load 1 line.
- `components/add-load-order-modal.tsx` (lines 56–111) — verify Valero Taylor 900 gal ULSD 08:30 AM exists; verify Flint Hills options for R3.

**UI:**
- `components/lasso-workspace-sheet.tsx` — add order-card FAB cluster on delivery + load order cards. Wire package icon to open Breakdown sheet. Update L/D badge style (remove stroke).
- `components/breakdown-sheet.tsx` — **NEW**. Product + Compartment bar chart sheet. Props: `orderId`, `routeId`, `truckProfile`, `compartmentAllocation`, `onClose`.
- `app/page.tsx` — top-level state for `breakdownSheetOpenForOrderId: string | null`.

## Reuse, don't reinvent

- **`validateRouteCapacity()`** — already returns `runningBalance` and per-product/per-stop data. Feed compartment allocation logic on top of it for the breakdown chart.
- **Zone A / Zone B rendering** in `lasso-workspace-sheet.tsx` (lines 1185–1199, 3681–3739) — already shows L2/L3 warnings. No change needed.
- **Route-card FAB** pattern (`top: 8, right: 8`, bg `#1B1B1B`, border `#282828`, rounded 4, padding 4, gap 4) — lift the same shell for order-card FAB so they read consistent.

---

## Implementation order

### Milestone 1 — R1 data + breakdown sheet shell (R1 first delivery)
1. Save plan to `1-projects/route-builder/docs/phase-1.3-per-stop-balance.md`; bump `context.md`.
2. **R1 truck (H-118) restructure** — `lib/truck-data.ts`. 5 compartments × {Diesel CLR, Gas 87}, volumes 1000/1000/1500/1000/1000.
3. **R1 stops** — `lib/mock-data.ts` route1Orders. Each stop's `productBreakdown` becomes Diesel-Offroad CLR only. Match qty totals (1000/800/1000/600/800/400 = 4,600).
4. **L & D badge restyle** — remove strokes wherever they're applied (workspace sheet, map pins if applicable, modal previews).
5. **Order card FAB** — add package + ellipsis cluster on delivery and load order cards. Conditional rendering: package icon active only when route has ≥1 load order.
6. **Breakdown sheet shell** — new `breakdown-sheet.tsx` with header, X close, conditional chart rendering (`products.length === 1` → both; else → product-only). Hardcode R1 / Mueller Construction values first.
7. **Wire trigger** — package icon click → open sheet for that order's context.

### Milestone 2 — R2/R3 data + propagation
8. **R3 truck (H-310) restructure** — 4 compartments × {Diesel CLR, Gas 87}, volumes 1200/1200/1200/1000.
9. **R3 stops + Load 1 + retained zero-out** — Diesel CLR + Gas 87 per spec (totals: Diesel 3,000, Gas 2,000). Load 1 = Flint Hills 3,000 + 1,600. Retained = 0. R3 breakdown sheet renders product-only (2 bars, indigo + neutral).
10. **R2 mid-route load** — add Valero Taylor 900 gal ULSD 08:30 AM to load-order modal data. R2 breakdown sheet renders both charts (1 product × 3 compartments).
11. **Generalize breakdown sheet** — pull values from validation + compartment allocation rather than hardcoded R1. Apply per-product color map.

---

## What we're explicitly NOT doing this round

- ❌ **Per-stop running balance trace** (the line/curve showing balance dropping at each stop, separate from the bar-chart sheet) — queued for next.
- ❌ **Compartment-level depletion at each stop** — the breakdown sheet shows route-total compartment allocation, not stop-by-stop compartment deltas.
- ❌ **Compartment chart for multi-product routes** — R3 (and any future multi-product route) renders product-only. Compartment view for multi-product is deliberately deferred — too many allocation scenarios to handle cleanly right now.
- ❌ **Bar hover interactions** — tooltips/expansion on bar hover deferred to next pass.
- ❌ **Scenario comparison modal** — R3 Options 2 & 3 deferred. Default = Option 1 only. Design pending.
- ❌ **R4 (Kyle Reese) and R5 (Forrest Gump)** — untouched.
- ❌ **New banner colors / new modal flows.**

---

## Verification (manual, in browser at localhost:3000)

**Data:**
1. Expand R1 — Zone A: amber `↓ 900 gal Below Truck Capacity`. No red banner.
2. Expand R2 — Zone B: red `1 Issue`, stop chip on **Hutto Farms**. Add Load Order → Valero Taylor 900 gal ULSD 08:30 AM available. After adding, route clears to amber.
3. Expand R3 — Zone B: red `1 Issue` (or 2), stop chips on **Barton Creek** and/or **Circle C** (Gas 87 runout).

**UI:**
4. L and D badges render with no border/stroke; colors `#189ffc` (L) and `#25b8a7` (D).
5. Order card FAB shows package + ellipsis on hover. Package icon disabled/hidden until first load order added.
6. Click package icon on Mueller Construction (R1 first delivery) → Breakdown sheet opens. Title "Product and Compartment breakdown". Two charts. X close dismisses.
7. R1 sheet shows: By Product = single Diesel-Offroad CLR bar; By Compartments = 5 bars C1–C5.

---

## Future scope (queued after this round)

1. **Per-stop running balance trace** — render `validation.runningBalance` as a vertical timeline alongside stops.
2. **Per-stop compartment depletion** — track compartment levels stop-by-stop. New logic in `capacity-validation.ts`.
3. **Scenario comparison modal** — toggle between R3 Options 1/2/3.
4. **Retained fuel re-introduction** — reverse the zero-out if needed; numbers are easy to dial back in.
