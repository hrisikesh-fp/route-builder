# Dev Handoff — Compare objectives

**Repo:** `hrisikesh-fp/route-builder`
**Branch:** `feat/objective-comparison-modal` (worktree, off `routing-proto-v1`, not `main`)
**This ticket is the new modal only.** Optimized Routes (routes + unassigned) stays as it already is in the repo.

**Play the modal (Compare objectives only — Optimized Routes is unchanged in the product):**
- This doc: https://github.com/hrisikesh-fp/route-builder/blob/feat/objective-comparison-modal/HANDOFF-objective-comparison.md
- Static mock (rendered): https://htmlpreview.github.io/?https://github.com/hrisikesh-fp/route-builder/blob/feat/objective-comparison-modal/public/mocks/objective-comparison.html
- Static mock (source): https://github.com/hrisikesh-fp/route-builder/blob/feat/objective-comparison-modal/public/mocks/objective-comparison.html
- Local React: http://localhost:3005/dev/objective-comparison
- Local static: http://localhost:3005/mocks/objective-comparison.html

---

## Flow (where this modal sits)

Nothing else in the create/optimise chrome changes. Insert **one screen** after loading, before the existing Optimized Routes drawer.

```
Create Routes
  → Optimise (loading)
  → Compare objectives     ← NEW — pick a goal
  → Optimized Routes       ← EXISTING — routes / unassigned, unchanged
  → Proceed & Add to Workspace
```

**Insertion:** `components/create-routes-modal-v2.tsx` — when loading finishes, render `ObjectiveComparisonModal`. `onContinue(objectiveId)` then opens the **existing** `OptimizationRoutesDrawer`. Do not restyle that drawer.

Portal the new modal to `document.body` at `zIndex: 2000` so it sits above the nav (`z-[1200]`).

---

## The new modal — Compare objectives

**Files:**
- `components/objective-comparison-modal.tsx`
- `lib/objective-comparison-data.ts`

Reuse Create Routes shell: `#1B1B1B`, radius `8`, **`height: min(720px, calc(100vh - 80px))`**, width `1240`, Geist. Title `18/500`, subtitle `14/400`, X 24px. Footer 36px Cancel + `#E5E5E5` primary. Do **not** use lasso orange `#FA6400`.

```
┌ Compare objectives                                              × ┐
│ Pick a goal, then review the routes.                              │
│ ┌ Inputs │ 29 Orders │ 20,900 gal │ 3 Trucks │ Sep 12         ┐  │
│ Rank hint…                                    [ Show raw values ] │
│ MEASURED ON   ○ Least driving time  ● Earliest finish  ○ …        │
│ Gallons per mile      1                   4                …      │
│ …                                                                 │
│ What “Earliest finish” costs you · 3 routes · 19/29 · 10 unassigned│
│ Cancel                              Use Earliest finish →         │
└───────────────────────────────────────────────────────────────────┘
```

**Inputs card** — same `MetricCol` as a route card (`optimization-route-card.tsx`, exported). Label **Inputs**. Not “Same input every column”. No constraints ticker.

**Columns** = objectives (hide anything the engine cannot produce):

| UI label | Engine |
|---|---|
| Least driving time | `min transport_time` |
| Earliest finish | `min-max completion_time_last_stop` (Default chip — in today’s live blend) |
| Least paid hours | `min route_duration` |
| Fewest trucks | `min vehicles` |
| Balanced day | `min-max route_duration` |

Hide Shortest distance (`min distance`). Hide Compartment fill. Do not grey them; do not show n/a.

**Rows** = KPIs: gal/mile, gal/truck-hour, total distance, time to complete, trucks used, feasibility. Cell default = **rank** (`1` green, `2=` = 1% tie). “Show raw values” swaps in the number.

**Use {label}** → existing Optimized Routes with that plan. That screen is already built (`optimization-routes-drawer.tsx`). Leave it.

Prod today only blends Fewest trucks + Earliest finish. The scorecard still lists the five live engine objectives so the dispatcher can pick. Gallons is not a row — Inputs already shows it.

---

## Test

- [ ] After loading, only this modal is new
- [ ] Sits above the top nav, height 720
- [ ] Inputs card present
- [ ] Five columns, no Distance objective, no compartment n/a
- [ ] Use {label} opens the **existing** Optimized Routes (Routes / Unassigned cards as today)
