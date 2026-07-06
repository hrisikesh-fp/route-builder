# Multi-Route Modal Logic v1 — Plan & Dev Handoff

**Date:** 2026-07-06  
**Owner:** Hrisikesh  
**Repo:** `1-projects/route-builder`  
**Branch:** `feat/multi-route-modal-logic-v1` (create from `main`)  
**ClickUp context:** `86exxr570` (driver multi-route conflict), Eli go-live `86ey47h16`  
**Status:** Handoff → [`handoffs/multi-route-modal-logic-v1.md`](../handoffs/multi-route-modal-logic-v1.md)

---

## Goal

Update Route Builder multi-route conflict behavior so truck + driver assignment matches product rules, without hard-locking the dispatcher. Prototype on a branch, verify acceptance criteria, then hand to eng or continue Eli Shift Planner work.

**In scope (this branch):** Modal 1 / 2 / 3 trigger rules, truck pre-fill + nudge, shared truck sync prompt, Modal 2 UI updates, Modal 3 label updates.

**Parked (Phase 2 — club with Eli):** Active shift read-only route in RB (map + workspace), drag-out-of-group warning, "Shift is active" treatment. Ani asked for this; not blocking v1 modal logic.

---

## Modal numbering (frozen)

| # | Name | Component(s) | Trigger |
|---|---|---|---|
| **Modal 1** | Confirm Truck Selection | `truck-conflict-modal.tsx` | Same **truck** on another route, **different drivers** |
| **Modal 2** | Set Start Time | `route-sequence-modal.tsx`, `route-start-time-modal.tsx` (⋮ menu) | Same **driver** on another route |
| **Modal 3** | Review & Assign | `conflict-resolution-modal.tsx` + banner | Orders for driver with 2+ routes, can't auto-assign |

Note: older `updates/2026-06-04.md` calls the ⋮ menu "Modal 3" — that is **Modal 2 (single-route entry)** in this doc.

---

## Product rules (frozen for v1)

### R0 — Multi-route OFF: one driver, one route

When multi-route FF is **off**, a driver already assigned to any route is **excluded from all other driver dropdowns** in RB (route cards, create order, publish, everywhere). See handoff § R0.

### R1 — Same driver ⇒ same truck (default, not prison)

When a driver is assigned to 2+ routes the same day:

- **Default:** Route 2 **pre-fills** the truck from the driver's other route.
- **Not a hard lock:** dispatcher can change truck, clear truck (None), or leave truck empty and assign later.
- **Nudge when diverging:** if Route 2 truck ≠ sibling route truck while same driver → inline warning + optional sync prompt (see R4).
- **Publish guard (soft):** warn if publishing same-driver routes with different trucks; do not silently allow without acknowledgment.

### R2 — Modal 1 only for different drivers, same truck

- Same truck + **same driver** on both routes → **never Modal 1** (expected reuse).
- Same truck + **different drivers** → **Modal 1** soft block (Confirm / Cancel), existing pattern.

### R3 — Modal 2 is the driver-multi-route gate

- Same driver selected on Route 2 → **Modal 2** (set start times, Route 1 / Route 2 sequence).
- Modal 2 **pre-fills truck** on the route being edited (info callout, not disabled field).
- Confirm disabled until all same-driver routes have start times (unchanged).

### R4 — Changing truck when driver is shared

When user changes truck on one route and that driver has another route today:

```
┌─────────────────────────────────────────────────────────┐
│  Apply truck to both routes?                            │
│  Mark Ruffalo also has Route 1 (purple) on H-118.       │
│                                                         │
│  [ Apply to both routes ]  [ This route only ]  [Cancel]│
└─────────────────────────────────────────────────────────┘
```

- **Apply to both:** update truck on all routes for that driver.
- **This route only:** allow with persistent amber nudge on both cards: "Same driver, different trucks."
- **Cancel:** revert truck selection.

Use existing modal shell or a small new `TruckSyncModal` — keep visual language consistent with Modal 1.

### R5 — None / clear truck

- **None** remains available on truck dropdown.
- Clearing truck on a route that shares a driver → allowed; show subtle hint: "Truck required before publish."
- Do not auto re-fill until driver select or Modal 2 flow runs again.

### R6 — Inform, don't surprise

When auto pre-fill happens (driver select or Modal 2 open):

- **In Modal 2:** dismissible info strip under header: "Same driver — truck pre-filled from Route 1 (H-118). You can change it after."
- **After Modal 2 confirm:** toast: "Truck set to H-118 for both routes" OR "Mark assigned — set truck when ready" if still empty.

### R7 — Modal 3

- Drop zones labeled **Route 1 / Route 2** (from start time order), not only truck name.
- Show same truck name on both zones (always true for same driver; if R1 exception, show warning icon).
- Banner copy unchanged structurally; counts stay dynamic.

### R8 — Active route in RB (Phase 2 — NOT this branch)

From Ani + Eli: when shift is active, route is read-only in RB (map + workspace). Label "Shift is active", strip actions. **Do not implement in v1 branch** — document only in `plans/multi-route-active-route-phase2.md` stub.

---

## When each modal fires (frozen table)

| Route 2 action | Route 1 state | Same driver? | Same truck after action? | Modal 1 | Modal 2 | Other |
|---|---|---|---|---|---|---|
| Pick **driver** Mark | Mark + H-118 | Yes | Pre-fill H-118 | No | **Yes** | Info strip in modal |
| Pick **truck** H-118 | Mark + H-118, Jessica on R2 | No | Yes | **Yes** (soft) | No | — |
| Pick **truck** H-118 | Mark + H-118, Mark on R2 | Yes | Yes | **No** | No | Silent assign or toast |
| Pick **driver** Mark | Mark + H-118, Jessica + H-118 | Yes (after truck share) | Pre-fill | No | **Yes** | — |
| Change truck on R2 | Mark on both | Yes | User picks different | No | No | **R4 sync prompt** |
| Clear truck (None) | Mark on both | Yes | Empty | No | No | Nudge only |
| Ambiguous orders | Mark 2 routes | Yes | — | No | No | **Modal 3** |

---

## Path A — Driver first (primary)

```
User picks DRIVER on Route 2
         │
         ▼
   Already on another route today?
         │
    NO ──┴── YES
    │         │
    │         ├── Pre-fill TRUCK from sibling route (editable after)
    │         ├── Open MODAL 2 + info strip
    │         └── On confirm → toast
    │
    └── Normal flow
```

---

## Path B — Truck first (still happens)

```
User picks TRUCK on Route 2
         │
         ▼
   Truck on another route today?
         │
    NO ──┴── YES
    │         │
    │         ├── Same DRIVER on both?
    │         │     YES → assign truck, NO Modal 1
    │         │           (if driver not set yet, assign truck only;
    │         │            nudge: "Assign driver to match Route 1")
    │         │     NO  → MODAL 1 (soft)
    │         │
    └── Normal assign
```

---

## Example from screenshot (acceptance narrative)

**Start:** Route 1 = Mark + H-118. Route 2 = Jessica + no truck.

| Step | Action | Expected |
|---|---|---|
| A1 | R2 pick H-118, keep Jessica | Modal 1 → Confirm → Jessica + H-118 |
| A2 | R2 pick Mark (after A1 or clean) | Modal 2 only; H-118 pre-filled in modal + on card; info strip |
| B1 | R2 pick Mark first | Modal 2; H-118 pre-filled; no Modal 1 |
| B2 | After B1, user opens truck dropdown | H-118 selected; can change → R4 prompt if different |
| B3 | R2 pick H-118 while Jessica | Modal 1 only (different drivers) |

---

## Implementation plan (Claude Code)

### Step 0 — Branch

```bash
cd 1-projects/route-builder
git checkout main && git pull
git checkout -b feat/multi-route-modal-logic-v1
```

### Step 1 — Conflict detection refactor

**File:** `components/lasso-workspace-sheet.tsx`

- Add helper: `getSiblingRoutesForDriver(driverId, excludeRouteId)` → route ids + trucks.
- Add helper: `shouldShowTruckConflictModal(routeId, truckId)` → true only if truck on other route **and** drivers differ (compare `selectedDrivers` or route assignment).
- Update `handleTruckSelect`: use new helper; skip Modal 1 when same driver.
- Update `handleDriverSelect`: on conflict, pre-fill truck from sibling before opening Modal 2.

### Step 2 — Modal 2 pre-fill + info strip

**Files:** `route-sequence-modal.tsx`, `route-start-time-modal.tsx`

- Accept `prefilledTruck` + `showTruckHint` props.
- Render dismissible info strip when truck was auto-filled.
- Both route cards in modal show truck line (not "No truck selected" when pre-filled).

### Step 3 — R4 Truck sync prompt

**New file (optional):** `components/truck-sync-modal.tsx`  
Or extend `truck-conflict-modal.tsx` with mode `sync | conflict`.

- Trigger from truck dropdown change when `getDriverConflicts` > 0 and new truck ≠ sibling truck.

### Step 4 — Toasts / nudges

- After Modal 2 confirm: toast via simple state or existing pattern.
- Card-level amber nudge when same driver + different trucks (R4 "this route only").

### Step 5 — Modal 3 labels

**File:** `conflict-resolution-modal.tsx`

- Derive Route 1 / Route 2 labels from `routeStartTimes` order (earlier = Route 1).
- Pass start times into modal from `lasso-workspace-sheet` / `page.tsx`.

### Step 6 — Settings flag

Keep `showDriverConflict` toggle; extend demo seed so Mark + Jessica scenario is testable (Route 1 Mark/H-118, Route 2 Jessica/empty).

### Step 7 — Manual QA against acceptance criteria below

### Step 8 — Update handoff

- Append summary to `HANDOFF-driver-conflict-banner.md` or new `HANDOFF-multi-route-modal-logic-v1.md`
- Do not rename Modal 3 drag-drop doc to avoid confusion.

---

## Acceptance criteria (must pass before merge)

- [ ] **AC0:** FF off — assigned driver hidden from all other driver dropdowns (R0).
- [ ] **AC1:** Same driver on R2 → Modal 2 opens; Modal 1 does **not** open.
- [ ] **AC2:** Modal 2 shows pre-filled truck from sibling route + dismissible info strip.
- [ ] **AC3:** Same truck, different drivers (Mark/Jessica) → Modal 1 only; no Modal 2 unless driver changed.
- [ ] **AC4:** Same truck + same driver via truck picker → no Modal 1; truck assigns silently.
- [ ] **AC5:** User can clear truck (None) after pre-fill; nudge shown, no crash.
- [ ] **AC6:** User changes truck on one of two same-driver routes → sync prompt (both / this route only / cancel).
- [ ] **AC7:** "This route only" shows amber nudge on affected route cards.
- [ ] **AC8:** Modal 2 confirm still blocked until all start times set.
- [ ] **AC9:** Modal 3 drop zones show Route 1 / Route 2 labels when start times exist.
- [ ] **AC10:** Toast or equivalent after Modal 2 confirm when truck pre-filled.
- [ ] **AC11:** Feature flag toggle still demos full flow.
- [ ] **AC12:** No active-route read-only UI in this branch (Phase 2).

---

## Open points — CLOSED

| Question | Decision |
|---|---|
| Pre-fill vs lock truck? | **Pre-fill + nudge**, editable, None allowed |
| Change truck for both routes? | **R4 sync prompt** |
| Same truck + different driver? | **Modal 1 soft block** (not hard) |
| Active route green/gray in RB? | **Phase 2** with Eli (Ani request); not from current prototype |
| Modal 2 with empty truck? | **Pre-fill in modal** + info strip; never leave blank silently |
| Modal 3 impact? | **Route 1/2 labels** on drop zones; same truck displayed |
| Truck as separate section? | **Out of v1** — keep truck on route card; revisit if dropdown UX fails QA |

---

## Phase 2 stub (do not build now)

**File to create later:** `plans/multi-route-active-route-phase2.md`

- Read-only route card when shift active
- Map: dimmed route line + badge "Active"
- Strip: truck/driver edit, reorder, add load, publish (define which stay)
- CTA: "Add Route 2 for [driver]" when applicable
- Link to Shift Planner for reorder (Eli drag-drop)

---

## Handoff

**[`handoffs/multi-route-modal-logic-v1.md`](../handoffs/multi-route-modal-logic-v1.md)** — send to eng with this plan as reference.

---

## Reference

- Problem brief: `2-areas/product-discovery/syntheses/2026-07-01_shift-planner-x-route-builder_problem-brief.md`
- Existing prototype: `HANDOFF-driver-conflict-banner.md`, `updates/2026-06-04.md`
- Jul 2 Granola: Option A multi-route in one shift; mobile + Shift Planner v1 done separately

---

## Claude Code prompt (copy-paste)

```
Implement feat/multi-route-modal-logic-v1 in 1-projects/route-builder per:
  plans/multi-route-modal-logic-v1.md

Follow acceptance criteria AC1–AC12 exactly.
Do NOT implement Phase 2 active-route read-only UI.
Match existing inline-style patterns in lasso-workspace-sheet.tsx.
When done: list which AC pass/fail and note any demo steps.
```
