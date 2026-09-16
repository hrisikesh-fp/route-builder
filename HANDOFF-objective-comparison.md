# Dev Handoff — Compare objectives + Optimized Routes

**Repo:** `hrisikesh-fp/route-builder`
**Branch:** `feat/objective-comparison-modal` (worktree of this repo, **off `routing-proto-v1`**, not `main`)
**Play:**
- End-to-end: http://localhost:3005/dev/optimize-flow
- Scorecard only: http://localhost:3005/dev/objective-comparison
- Static GH-pages mock: `/mocks/objective-comparison.html`

Point Claude / yourself at the files below and **reuse what’s already in this repo**. Do not rebuild from the older Prashant concept mock (orange, “Same input every column”, greyed Distance column, n/a compartment fill).

---

## What this is

After **Optimise and Create Routes** finishes loading, the dispatcher gets a **Compare objectives** scorecard (pick a goal), then **Optimized Routes** (review the plan). Same demand day, same trucks — only the objective changes.

```
Create Routes (auto, trucks on the right, driver mapping)
  → loading (last phases: “Solving for each objective…” / “Scoring the results…”)
  → Compare objectives          ← NEW
  → Optimized Routes drawer     ← EXISTING, header/metrics updated
  → Proceed & Add to Workspace
```

**Insertion point in proto:** `components/create-routes-modal-v2.tsx` — when loading finishes, `setScreen("objectives")` renders `ObjectiveComparisonModal`. `onContinue` then calls `onComplete`, which opens `OptimizationRoutesDrawer`.

Portal every overlay to `document.body` at `zIndex: 2000`. Workspace is `z-[1100]`, top nav is `z-[1200]` — if the modal stays inside the workspace it sits under the nav.

---

## Reuse this, don’t invent it

| UI piece | Already in this repo | File | What to copy |
|---|---|---|---|
| Modal shell | Create Routes | `components/create-routes-modal-v2.tsx` | `#1B1B1B`, radius `8`, padding `24`, **`height: min(720px, calc(100vh - 80px))`**, Geist, portal `zIndex: 2000` |
| Title / subtitle / X | Create Routes header | same | Title `18/500 #E5E5E5 lh 28`. Subtitle `14/400 #A3A3A3 lh 20`. Close `X` 24px |
| Segmented toggle | Create Routes Auto / Manual | same (~header) | Height `28`, pad `2`, bg `#1B1B1B`, border `#282828`, active fill `#282828` + border `#333` |
| Metric columns | Route card lower row | `components/optimization-route-card.tsx` → **`MetricCol`** (exported) | Value `14/500`, label `12/400 #A3A3A3`, gap `24`. Strip bg `#282828`, radius `4`, pad `8px 12px 8px 20px` |
| Alert / banner | shadcn Alert **Default** | Figma `3zQcvo51p6v57bYKCOdIee` node `7048:65870`. Proto: `ResultsAlert` in `optimization-routes-drawer.tsx` | bg `#1F1F1F`, border `1px #282828`, radius `4`, pad `12px 16px`, gap `12`, **Info 20 `#A3A3A3`**, copy `14/400 #A3A3A3 lh 20`. No amber, no extra Review button |
| Route cards | Existing | `components/optimization-route-card.tsx` | Unchanged. 6px color rail, pills (Manual Load / Must-go / HOS / efficiency), 4 MetricCols |
| Footer buttons | Create Routes / Merge | 36px. Ghost: transparent + `1px #333` + `#FAFAFA`. Primary: `#E5E5E5` / `#171717` | Cancel left, primary right |
| Rank “best” chip | Route-card efficiency pill | — | `#10b981`, `rgba(16,185,129,0.1)` fill, `rgba(16,185,129,0.24)` border |

**Do not use** `#FA6400` (lasso tool colour) anywhere in these modals.

---

## Screen 1 — Compare objectives

**File:** `components/objective-comparison-modal.tsx`
**Data:** `lib/objective-comparison-data.ts`

Width `1240`. Height `min(720px, calc(100vh - 80px))`.

```
┌ Compare objectives                                              × ┐
│ Pick a goal, then review the routes.                              │
│ ┌ Inputs │ 29 Orders │ 20,900 gal Gallons │ 3 Trucks │ Sep 12 ┐  │
│ Cells show rank…                              [ Show raw values ] │
│ MEASURED ON   ○ Least driving time  ● Earliest finish  ○ …        │
│ Gallons/mile          1                   4                …      │
│ …                                                                 │
│ What “Earliest finish” costs you · 3 routes · 19/29 · 10 unassigned│
│ Cancel                              Use Earliest finish →         │
└───────────────────────────────────────────────────────────────────┘
```

### Inputs card

Same `MetricCol` strip as the route cards. Label **“Inputs”** — not “Same input, every column”. No constraints ticker on the right.

```tsx
// InputsCard in objective-comparison-modal.tsx
<MetricCol value="29" label="Orders" />
<MetricCol value="20,900 gal" label="Gallons" />
<MetricCol value="3" label="Trucks" />
<MetricCol value="Sep 12" label="Date" />
```

### Columns (objectives)

Objectives are **columns**, KPIs are **rows**.

Only render objectives that exist in the engine **and** have a result. Hide unavailable. Today that means **five** columns:

| UI label | Engine term |
|---|---|
| Least driving time | `min transport_time` |
| Earliest finish | `min-max completion_time_last_stop` (**Default** — today’s live blend includes this) |
| Least paid hours | `min route_duration` |
| Fewest trucks | `min vehicles` |
| Balanced day | `min-max route_duration` |

**Hide** `min distance` / “Shortest distance”. No SolutionCostCalculator yet — do not grey it out, do not show n/a.

Column header is a radio + name + one-line descriptor + “Best on N” chip. Selected column: top rail `#D4D4D8`, bg `#282828`.

### Rows (KPIs)

Show only measurable KPIs. **Hide** Compartment fill (blocked) — never render `n/a` / `0`.

Keep: Gallons per mile, Gallons per truck-hour, Total distance, Time to complete, Trucks used, Feasibility.

Default cell = **rank** in the row (`1` is best, green chip). `2=` = tie inside the 1% threshold (`rankColumn` in `lib/objective-comparison-data.ts`). “Show raw values” swaps rank for the formatted number.

### Footer

Tradeoff readout for the selected column (copy comes from `ObjectiveRun.tradeoff`). Primary CTA: `Use {label}`. Then open Optimized Routes for that plan.

`onContinue(objectiveId)` is the only contract the next screen needs.

---

## Screen 2 — Optimized Routes

**Files:** `components/optimization-routes-drawer.tsx`, `components/optimization-route-card.tsx`

Collapsed: 720px-wide right drawer (existing). Expanded: **same 720px-tall centered modal shell as Create Routes** (`width: 1040`, `height: min(720px, calc(100vh - 80px))`, portaled `zIndex: 2000`).

### Header — reuse Auto/Manual toggle

```
Optimized Routes  |  [ Routes (3) | Unassigned (10) ]     expand   ×
Generated from 29 orders across 3 trucks
```

`Unassigned (N)` uses warning amber `#eab308` when `N > 0`. This **replaces** the two giant “Routes 3 / Unassigned 10” tab-cards from the old mock.

### Plan metrics — reuse `MetricCol`

One strip, same as each route card’s lower row:

```
19/29 Orders · 3 Trucks · 28h 20m Estimated Time · 390 mi Estimated Distance
```

Sum `estTimeMins` / `estDistanceMi` from `result.routes`.

### Alert under the metrics

`ResultsAlert` — Default Alert (see reuse table). Copy example:

> 10 of 29 orders weren’t placed · 2 conflicts. Open Unassigned to review before adding to the workspace.

Clicking it switches the segmented toggle to Unassigned. Same Alert (non-clickable) at the top of the Unassigned list.

### Cards below

`OptimizationRouteCard` as-is. Do not restyle.

Footer: Cancel · **Proceed & Add to Workspace**.

---

## Engine / product notes (so FE doesn’t over-build)

- **Production today** only blends **Fewest trucks + Earliest finish**. The scorecard still shows all **five live** engine objectives so the dispatcher can pick. Mark the current default with the Default chip.
- **Gallons are not an objective row.** Volume is protected by the unserved penalty in every run. Inputs card already shows gallons.
- Hide anything you cannot measure. Coming-soon columns stay out of the dispatcher UI.

---

## Files to read (proto)

```
components/create-routes-modal-v2.tsx      # shell + Auto/Manual + flow into scorecard
components/objective-comparison-modal.tsx  # Screen 1
lib/objective-comparison-data.ts           # columns, KPIs, ranks, hide rules
components/optimization-routes-drawer.tsx  # Screen 2 header/toggle/Inputs-style metrics/Alert
components/optimization-route-card.tsx     # MetricCol + route cards
lib/optimization-types.ts
app/dev/optimize-flow/page.tsx             # harness
public/mocks/objective-comparison.html     # static playable mock (scorecard + results)
```

---

## Test plan

- [ ] Create Routes → Optimise → scorecard appears **above** the top nav (not under it)
- [ ] Scorecard height is 720 (or `100vh - 80px` on a short display)
- [ ] Inputs card: Orders / Gallons / Trucks / Date — no “Same input every column”
- [ ] Five objective columns only — no Shortest distance, no Compartment fill n/a
- [ ] Rank ↔ raw toggle works; `1` is green; ties show `=`
- [ ] **Use {label}** opens Optimized Routes
- [ ] Optimized Routes header is Auto/Manual-style Routes / Unassigned, not two dashboard tiles
- [ ] Plan MetricCol row matches the cards below
- [ ] Alert is Default (grey Info), not amber warning
- [ ] Unassigned tab lists reasons; Proceed adds to workspace
- [ ] Expand uses the 720px Create Routes shell
