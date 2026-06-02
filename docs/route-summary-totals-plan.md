# Plan — Route Summary modal: add Totals section

## Context

**Why:** Dispatchers need to know, for a given set of delivery orders on a route, the total
gallons required **per product** and overall — so they know exactly what to load to meet demand.
This came from a FleetFuels call (hypothesis that generalizes to Handaband / Eli Roberts based on
Smartlook session signals). User story: *"as a dispatcher I expect the system to sum up total
gallons needed per product so I know exactly what to load."*

**What:** Add a **Totals** block at the bottom of the Route Summary modal
(`components/balance-table-modal.tsx`) with two rows:

1. **Total Load Qty** — sum of all Load (L) order volumes, per product + grand total
2. **Total Delivery Qty** — sum of all Delivery (D/T) order volumes, per product + grand total

The grand total (sum across products) sits in the left column; per-product values fill the
product columns, aligned with the table above. The block updates as load orders are added
(0 → 1 → 2 loads), since load orders flow in via the merged `orders` prop.

Figma source: node `4493:58735` in `YriCTfpkAvXhj0FkU02QLS`.

## Design (from Figma + screenshots)

A standalone filled card below the existing table (the table keeps its bordered/transparent style;
the Totals card is filled `#282828`):

- Card: `backgroundColor #282828`, `borderRadius 4px`, `padding 4px`, two rows with a thin **dashed**
  separator between them.
- **Left column** of each row (aligns with "Stops" column): two stacked lines —
  - grand total — `#E5E5E5`, 14px, weight 500, lineHeight 20px
  - label ("Total Load Qty" / "Total Delivery Qty") — `#737373` (`TEXT_4`), 14px, weight 400, lineHeight 20px
- **Product columns**: single value per product — `#E5E5E5`, 16px, weight 500, lineHeight 24px, cell height 56px, padding `8px 12px`.
- Column widths must line up with the table above → render the Totals block as its own
  `<table>` with `tableLayout: "fixed"`, `width: "100%"`, and the **same `<colgroup>`** (`<col />`
  for Stops + one `<col />` per product). Equal-width columns match the main table exactly.

## Changes — all in `components/balance-table-modal.tsx`

1. **Totals computation helper** (module scope, near `computeDemand`, line ~56):
   Generalize into one function returning both type totals:
   ```ts
   function computeTypeTotals(orders, products): { load: Record<string,number>; delivery: Record<string,number> }
   ```
   - `delivery[p]` = sum of `pb.volume` for orders where `orderType !== "L"` (reuses existing
     `computeDemand` logic — replace the now-redundant `computeDemand` usage with this).
   - `load[p]` = sum of `pb.volume` for orders where `orderType === "L"`.
   Grand totals are `Object.values(...).reduce((a,b)=>a+b,0)` computed inline at render.

2. **Render the Totals card** inside the modal flex column, **after** the closing `</div>` of the
   table wrapper (~line 509), before the modal's outer closing tags. The modal column already has
   `gap: 16`, so spacing is handled. Reuse existing tokens (`BG_STRIP`/`#282828`, `TEXT_2`,
   `TEXT_4`, `fmtBalance`). Format values with the existing `fmtBalance(n)` → `"2,500 gal"`, `"0 gal"`.

3. **Always render** when `products.length > 0` (matches all three screenshot states, including the
   0-load case where Total Load Qty shows `0 gal` across columns).

## Notes / decisions

- **Grand total = sum of the per-product values in that row.** (Screenshots 1 & 2 confirm this;
  screenshot 3's left total `5,000` vs columns `2,500/1,500` is a hand-mocked inconsistency — the
  code computes it correctly from the column sums.)
- **"Total Delivery Qty" includes D and T** (non-L), matching existing `computeDemand` semantics.
- Modal width logic (`800px` / `1200px`) is unchanged — the Totals table inherits the same widths.
- No changes needed in `lasso-workspace-sheet.tsx`; load orders already arrive merged into `orders`.

## Verification

1. `pnpm dev`, open the app, select route R3 (Jessica Harper) and open **Route Summary** (Balance Table modal).
2. **0 loads:** Totals shows Total Load Qty = `0 gal` across all columns; Total Delivery Qty = real per-product sums + grand total.
3. Add **1 load** (Flint Hills Load 1) via Add Load Order modal, reopen Route Summary → Total Load Qty columns populate; grand total = sum of columns.
4. Add **2nd load** (Load 2) → Total Load Qty increases accordingly.
5. Confirm Totals columns line up vertically with the product columns / Stops column in the table above (single-product 800px and multi-product 1200px widths both align).
6. Confirm the dashed separator renders between the two rows and the card bg is `#282828`.
