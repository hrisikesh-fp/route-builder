# Run history and the run components: plan

**Branch:** `iter/run-history`, from `iter/3d-shell-v2` (103dc4c). Worktree: `1-projects/route-builder-run-history`, port 3041.

**Open:** Reconciliation → Run history (`http://localhost:3041`), and `/dev/run-components` for the Planning states.

## The idea

A run is one thing, shown in two places:
- **Planning workspace:** the live result of the run the dispatcher just did.
- **Reconciliation → Run history:** the frozen snapshot of any past run, as a read-only workspace with a map.

So every piece is built once, in `components/run/`, and takes a `variant` or plain data. It is not tied to Run history.

## Components (`components/run/`)

| File | What it is | Planning workspace | Run history |
|---|---|---|---|
| `run-metrics-strip.tsx` | One slim strip with the same height in every state. Chips open one panel underneath | Top of the workspace: after lasso, optimizing, after a run (`variant="live"`) | Top of the run (`variant="snapshot"`, dashed border) |
| `run-reason-groups.tsx` | Unplanned orders grouped by their one blocking reason, easiest fix first (closest-truck copy) | Behind the "N unassigned" chip | Unassigned tab |
| `run-route-list.tsx` | Read-only route rows (truck, driver, orders, gal, mi, time) that expand to stops | n/a (Planning keeps the editable route cards) | Routes tab |
| `run-goals-table.tsx` | Goals compared, with the 12 Oct rules (orders placed first, "Leaves N unplanned", "Same plan as", "Used") | Could replace the scorecard summary after "Use {goal}" | Goals compared tab |
| `run-inputs-card.tsx` | What the run was given (#298), in dispatcher words | "What was this run given?" | Inputs tab |
| `run-list.tsx` | The day's runs. **One entry per comparison**, with what happened to it (Published, Used, Not used, No answer) | A run picker later | Left column |
| `run-snapshot-map.tsx` | Read-only map of one run: road lines, numbered stops, unplanned pins. Shares the Planning map's OSRM cache | n/a | Right column |
| `run-ui.tsx` | Tokens, Chip, Kv, fate chip | Shared | Shared |
| `run-history-view.tsx` | The page: runs, read-only workspace, map | n/a | Mounted in `reconciliation-view.tsx` |

**Data:** `lib/run-types.ts` (the shape) and `lib/run-history-data.ts` (7 mock runs for tomorrow, built from the real mock routes).

## What Run history answers that the built screens don't

- **What happened to each run:** Published, Used, Not used, No answer. The #433 list has only Finished / Didn't finish.
- **A comparison is one entry,** not one row per goal.
- **How it did against the run before:** "vs Run #5: +0 placed, -18 mi, -13m to complete". Like with like only (full day vs full day).
- **Re-optimize runs say they're a subset:** "This run re-optimized 2 routes (10 orders). The rest of the day wasn't part of it." This is the first answer to the "subset" question.
- **A short run number** (Run #6), with the engine request ID one click away (Copy ID) for support.
- **The map of a past run,** with hover from route rows to lines.

## Next: wiring into the Planning workspace (not done; the A2 chat is in that file)

1. **Mount `RunMetricsStrip` at the top of `lasso-workspace-sheet.tsx`.**
   - After lasso: orders, gallons by product, trucks picked vs capacity; chips for pre-run checks (A2) and the truck and driver picker (Dan Warren).
   - While optimizing: progress with Cancel, without blocking the screen.
   - After a run: placed, routes, gal, mi, time; chips for unassigned, warnings and Run #.
   - This replaces the expanded run summary card (#432), which takes about 300px today.
2. **Run # chip → Reconciliation.** `ReconciliationView` takes an `initialRunId`, and `RunHistoryView` already accepts one. Add a `mode` + `runId` handoff in `app/page.tsx`.
3. **Reason on the unassigned order card:** a one-line reason with "Run #6" from `ReasonGroup`, the latest run's reason only.
4. **Trucks panel:** use the same reason copy for "why this truck wasn't used" (C1, Jyotirmay's framework).

## Open questions

- **Can the API rebuild a past run's routes and map from the stored engine response (#298)?** The snapshot map depends on it.
- What the list should show when the dispatcher edited a run's plan before publishing (Used, but changed).
- Where Run history sits for Route Builder-only customers with no routing (likely hidden).
