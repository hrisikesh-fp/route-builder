# Dev Handoff: Route Builder page shell (3D shell)

**Repo:** `hrisikesh-fp/route-builder` (design prototype, mock data)
**Branch:** `handoff/3d-shell`. It holds the latest prototype: the frozen page shell (`103dc4c`) plus Run history, the run components and the Workspace journey demo (`b70fdc4`, `4415f1e`, `d2b441b`, merged 14 Oct).
**ClickUp:** [Route Builder page shell: map in its own box, metrics bar, docked views (z97h2mpp3f)](https://app.clickup.com/t/8447923/z97h2mpp3f)
**Target:** `route-builder-web`, re-implemented in its own conventions. Do not copy prototype files across; read them for behaviour and numbers.

**Why this first:** this is the foundation the other FE tasks sit on. The Orders view (Select all + list view), the A2 pre-run flags, Routes next to Workspace and Reconciliation all assume the map lives in its own box with panels docked beside it. Until the shell exists, each of those would have to be built twice.

**Run it:**

```bash
git clone git@github.com:hrisikesh-fp/route-builder.git
cd route-builder
git checkout handoff/3d-shell
pnpm install
pnpm dev
```

Open http://localhost:3000. Mock data only; no backend needed. A deployed link will follow.

**What to open:**

| URL | What | Part of this task? |
|---|---|---|
| `/` → Planning | The page shell: header, metrics bar, rail views, bounded map, Routes / Workspace | **Yes, this is the task** |
| `/` → Reconciliation → Run history | Runs of the day, read-only workspace per run, map snapshot | No, separate task; shown so the shell leaves room for it |
| `/dev/workspace` | Workspace journey: before a run (live summary, issue strip, issue lines, Exclude), 3-pane Create Routes, after a run (summary, run banner, reasons by kind, Run details drawer, Trucks panel) | No, separate tasks; shows what will sit inside the shell |
| `/dev/run-components` | The run components in their Planning states | No, separate tasks |

---

## 0. Agreed in the FE sync (13 Oct)

- **The shell is one task.** Header with Planning / Reconciliation, metrics bar, and the pane framework (left, right, above and below the map, views) are hard to split, so they ship together. Create subtasks if useful. Empty states are fine for views that have no data yet.
- **Planning and Reconciliation become real app routes**, not in-memory state. Today's Planning screen moves under Planning. The existing Routing Config navigation stays as it is.
- **Branching:** one long-lived branch off `dev` for this rework. Every PR for it merges into that branch; when it's done, one PR to `dev`, then UAT, then production. **No feature flag:** it would mean shipping two versions of the app. Test on alpha or a preview app first.
- **Meanwhile, keep UI changes going straight to UAT to a minimum**, since each would need building twice (old UI and new). Fleet Fuels fixes this week carry on as normal.
- **Before branching,** make sure the merged run-transparency work (run summary, unassigned reasons, objective comparison) is in `dev`, so the new branch has it.
- **Design tweaks:** design branches off this rework branch for small fixes, rather than building in parallel.
- **Who does what:** the shell and the heavier parts here; lighter, separate tasks (Trucks and Drivers views, Inbox, route locking, Run history, the pre-run welcome modal) go to other FE engineers once the shell exists.
- **Not for 17 Oct:** Save view (leave the control as a stub).
- **Open, from the sync:** what a run's status means when only part of its routes are published (a run is a snapshot of what the solver returned; the dispatcher may change it before publishing). To be settled with the run-history work, not in the shell.

---

## 1. The one big change

**Today (route-builder-web):** the map is full screen (`absolute inset-0`). The filter sheet (left, 320) and the workspace (right, 560) sit **on top** of it. Mapbox padding plus a 300ms `easeTo` keeps pins visible, and the map controls move by a hand-set offset (`right = panelWidth + 10`).

**Proposed:** the map sits **in its own box**. Panels sit **beside** it and push it aside. The map resizes itself; the controls are pinned inside the map box, so they never need offsets.

```
┌ App header 68: logo · Planning | Reconciliation · date · bell · profile ┐
├ Metrics bar 56: Total Gallons · Routes · Unassigned   Create Order | Routes  Workspace ┤
│ rail │ Orders view │                         │ Routes or Workspace    │
│  52  │ 480 to 720  │      MAP (own box)      │ 560 to 640/720         │
│      │ Trucks      │   controls top right    │ one at a time          │
│      │ Drivers     │                         │                        │
└──────┴─────────────┴─────────────────────────┴────────────────────────┘
```

**How the prototype does it:**
- `components/route-map.tsx`: the map container fills its box, and a `ResizeObserver` on that box calls `map.resize()` whenever panels open, close or are dragged. No padding, no `easeTo` shift.
- `app/page.tsx`: computes `mapLeft`, `mapTop`, `mapWidth` from the open views and the right panel, then places everything absolutely around it.
- The page root carries `data-layout-tier`, so analytics can read the tier as is.

Most of what follows is a consequence of this.

---

## 2. Every number lives in one file

**`lib/layout-tiers.ts`.** Copy it (or its values) first; the rest of the layout follows from it.

### Tiers (by window width)

| Tier | Width | Left views | Right panel |
|---|---|---|---|
| `compact` | under 1280 | always float over the map | 560 |
| `laptop` | 1280 to 1579 | one column, docked | 560 |
| `desk` | 1580 to 2099 | one column, docked, beside the right panel | 560, grows to 640 |
| `wide` | 2100 and up | two columns side by side | 560, grows to 720 |

### Sizes

| Thing | Min | Default | Max |
|---|---|---|---|
| Map width | 480 | | |
| Map height | 360 | | |
| Left view (Orders, Trucks, Drivers) | 480 | 480 | 720, user drag only |
| Second left column (wide tier) | 480 | 480 | 480 |
| Right panel (Routes / Workspace) | 560 | tier max if room | 640 desk, 720 wide |
| Stacked left view height | 240 | split evenly | |
| View docked above or below the map | 140 | 280 / 320 | until the map hits 360 tall |
| Create Order side sheet | 400 | 560 | 560 |
| Rail | 52 | | |
| Header / metrics bar height | 68 / 56 | | |
| Gap between panels | 4 | | |

### Formulas

- **Right panel width** = `clamp(560, space left once the map keeps 480, tier max)`.
- **Left views** shrink back toward 480 before they float.
- **Filters button** becomes icon-only when the free map width (map width minus the Create Order sheet, if open) is under 640.

---

## 3. Behaviours

1. **On load:** Orders is open in cards view, 480 wide. Trucks and Drivers stack under it. Each view's dock menu can move it above or below the map.
2. **Right panel opens and the left views no longer fit:**
   - The left views collapse to the rail.
   - A rail click reopens them **floating** over the map.
   - Closing the right panel docks them again.
   - At 1440: Orders plus Workspace would leave the map at 340, so Orders collapses. Workspace alone leaves the map at 820.
3. **Floating views and the Filters panel share one spot** on the map; opening one closes the other.
4. **Table view at 480** scrolls sideways. The user can drag the panel wider.
5. **Create Order:**
   - Button in the metrics bar: `Create Order | Routes  Workspace`.
   - The side sheet floats **inside the map box**, on the right, never over the bar or the panels.
   - The map controls move to the sheet's left. Routes and Workspace stay as they were.
6. **Expand (diagonal arrows):** every view has it in its header; the map has it at the top of its controls.
   - Expanding hides everything else in Planning: metrics bar, rail, other views, right panel. Only the app header stays.
   - Expanded Orders switches to table view.
   - Nothing is closed, only hidden. **Esc** or the collapse icon restores the exact layout.
7. **Move a view by dragging its header** (the title area, not its buttons).
   - Drop on another view: before or after it, same dock. An indigo line shows where.
   - Drop on the map's left fifth: dock left. Top third: above the map. Bottom third: below. A dashed zone shows where.
   - A label follows the pointer, e.g. "Trucks → above map". The dock menu does the same moves.
8. **Resize handles** (between views and the map, and on the left column's edge) are invisible until the pointer is near.
9. **Map controls, top to bottom,** all 32px wide, 4px corners:
   - Expand map, then a divider.
   - Map entities (layers).
   - Zoom + and − in one box.
   - **Zoom to fit all** (new): fits every order and route.
   - Save view (needs design; leave as a stub).
   - **Lasso + Add all to workspace** together in one orange box, set apart from the view tools. "Add all to workspace" was called Select All.
10. **Right panel:** Routes (read-only, new) or Workspace, one at a time, opened from the metrics bar. **Closing only hides it; what is in it stays.** Today closing the workspace clears the selection.

---

## 4. Area by area: today vs proposed

| Area | Today (route-builder-web) | Proposed (prototype file) |
|---|---|---|
| Screen sizes | One layout at every width | Four tiers (`lib/layout-tiers.ts`) |
| Header | ~57px: logo, Back to Dispatch, Create Order, date, tenant switcher, profile | 68px: logo, Back to Dispatch, **Planning / Reconciliation** tabs centred, date, **bell with inbox dropdown**, profile. Create Order moves out (`components/app-header.tsx`) |
| Metrics bar | None | New, 56px, Planning only. Left: Total Gallons, Routes, Unassigned Orders. Right: `Create Order \| Routes  Workspace` (`components/metrics-bar.tsx`) |
| Left side | Filter sheet 320, open by default, collapses to a 44px rail | 52px **rail of views** (Orders, Trucks, Drivers) (`components/side-nav-rail.tsx`) |
| Views | None | One shell for every view: header with title, dock menu, expand, close; drag by header (`components/view-panel.tsx`) |
| Orders list | None; orders only appear as workspace cards | Orders view: cards or table, search, Group By (table only), Add to workspace (`components/orders-panel.tsx`, `components/data-table.tsx`) |
| Trucks, Drivers | None | Views with empty states for now |
| Filters | The left sheet | A Filters button on the map's top left opens a floating panel; icon-only under 640 free map width (`components/filter-side-sheet.tsx`, floating variant) |
| Right side | Workspace only, 560; closing clears the selection | Routes (read-only, `components/routes-panel.tsx`) or Workspace (`components/lasso-workspace-sheet.tsx`), one at a time, widths per tier, close keeps contents |
| Map | Full screen, padded | Own box, `ResizeObserver` + `map.resize()` (`components/route-map.tsx`) |
| Map controls | Layers, zoom, reset north, lasso | See behaviour 9 (`components/map-controls.tsx`) |
| Create Order | Header button, centred 800px modal | Metrics bar button; side sheet inside the map box (`components/create-order-modal.tsx`) |
| Reconciliation | None | Header tab with Run history and Analytics & reporting (`components/reconciliation-view.tsx`, `components/rb-pages.tsx`). Placeholder content only |
| Analytics | Clarity tags (tenant, email), Sentry | Add a Clarity tag `layout_tier` from `data-layout-tier` |

**Files most likely touched in route-builder-web:** `FilterMapLayout.tsx` (about 4,000 lines), `DashboardLayoutShell.tsx`, `MapCanvas.tsx` (padding, `easeTo` shift, control offsets), `applicationStore.ts`, `configs.ts` (`RIGHT_SIDEBAR_WIDTH`, `FILTER_SIDEBAR_WIDTH`, `SIDEBAR_RAIL_WIDTH`), `AppHeader.*`, `FilterSheet.client.tsx`, `RightSidebar.tsx` and the two edge-rail toggles.

---

## 5. Phases (each ships on its own)

| # | Phase | What | Prototype commits to read |
|---|---|---|---|
| 1 | **Prep, no visual change** | Move panel placement and open/close logic out of `FilterMapLayout.tsx` into the layout shell and a layout store | n/a (refactor) |
| 2 | **Bounded map** | Map in its own box, panels push instead of overlay, controls pinned inside the map, one constants file replacing the `configs.ts` widths, Clarity tier tag. Today's filter sheet and workspace stay as they are | `2c0be79`, `dd2265f`, `7e61ed5` |
| 3 | **Header and metrics bar** | Planning tab, counts, `Create Order \| Routes  Workspace`. Reconciliation tab hidden until phase 6 | `2c0be79`, `0f7e587` |
| 4 | **Left views** | Rail, Orders view (cards and table), Filters onto the map, Trucks and Drivers as empty states | `2c0be79`, `e591207`, `7e61ed5` |
| 5 | **Right panel** | Routes (read-only) next to Workspace, widths per tier, collapse-to-rail rule, close keeps contents | `7e61ed5` |
| 6 | **Power layout and Reconciliation** | Dock menu, drag to move, expand, two left columns on wide, Reconciliation tab | `e591207`, `0f7e587`, `a78e2a5`, `1faa0f5`, `103dc4c` |

**Suggested start:** phases 1 and 2 (or, as agreed on 13 Oct, the whole Planning frame as one task with subtasks). They change nothing a dispatcher sees except the map no longer sitting under the panels, and they unblock everything after.

---

## 6. Firm, still moving, never build

**Firm enough to build on:**
- The map gets its own box and stays protected (min 480 x 360).
- There is a metrics bar with routes, gallons and unassigned orders.
- Orders sit on the left (input), routes on the right (output).
- "Add all to workspace" sits with the lasso.

**Still moving (build so these are easy to change):**
- Every number is a working value: 480, 560, 640, 720, the 360 map height, and the tier edges 1280 / 1580 / 2100. Keep them in the constants file.
- Right panel width: fluid 560 to tier max (as built) vs a hard switch to 640 at 1720.
- When Orders doesn't fit: it floats for now; swapping places with the right panel is the alternative.
- Where Create Order finally lives (metrics bar today; possibly the right panel later).
- Save view (control is a stub).
- What Run history and Analytics show.

**Never build (prototype only):**
- Prototype Settings, "Unassigned orders only" toggle (on by default so every order starts unassigned).
- The tier and width readout at the bottom left of the map.
- The mock inbox items in the bell dropdown.

---

## 7. Test checklist (per phase)

**Phase 2, bounded map**
- [ ] Opening or closing the workspace resizes the map; no pins jump, no `easeTo` shift.
- [ ] Map controls stay in the map's top right whatever is open.
- [ ] The map is never narrower than 480 or shorter than 360.
- [ ] `data-layout-tier` is on the page root and changes at 1280, 1580, 2100.

**Phase 3, header and metrics bar**
- [ ] Planning tab active; Reconciliation hidden.
- [ ] Counts match the loaded data.
- [ ] Create Order opens the sheet inside the map box; controls move to its left.

**Phase 4, left views**
- [ ] Orders opens at 480 in cards view; drag widens it to 720 and no further.
- [ ] Table view scrolls sideways at 480.
- [ ] Filters is a button on the map; icon-only when free map width is under 640.
- [ ] Floating view and Filters panel never show together.

**Phase 5, right panel**
- [ ] Routes and Workspace never open together.
- [ ] At 1440 with Orders open, opening Workspace collapses Orders to the rail; a rail click reopens it floating; closing Workspace docks it again.
- [ ] Closing Workspace keeps its contents.
- [ ] Right panel grows to 640 (desk) and 720 (wide) only when the map keeps 480.

**Phase 6, power layout**
- [ ] Drag a view by its header: indigo line between views, dashed zone on the map, pointer label.
- [ ] Expand hides everything but the app header; Esc restores the exact layout.
- [ ] Wide tier shows two left columns.

---

## 8. Questions for FE

1. A rough effort per phase. Is phase 1 worth doing first?
2. Was the overlay model chosen for a reason this would break? For example performance, the print view, or the driver conflict banner.
3. Is a Clarity custom tag the right place for `layout_tier`?

---

## Changelog

- **14 Oct 2026:** merged the latest prototype (Run history, run components, Workspace journey demo); added "What to open" and the decisions from the 13 Oct FE sync.
- **14 Oct 2026:** first version, from `103dc4c`.
