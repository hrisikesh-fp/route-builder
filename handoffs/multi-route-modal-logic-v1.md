# Dev Handoff — Route Builder: Multi-Route Modal Logic v1

**Date:** 2026-07-06  
**Owner:** Hrisikesh  
**Repo:** `1-projects/route-builder` (Next.js prototype — production parity target)  
**Branch:** `feat/multi-route-modal-logic-v1`  
**ClickUp:** `86exxr570` · `86ey47h16`  
**Status:** Ready for eng — **prototype + this doc** (no Figma)

**This doc:** https://github.com/hrisikesh-fp/route-builder/blob/feat/multi-route-modal-logic-v1/handoffs/multi-route-modal-logic-v1.md

---

## Where this comes from

| Layer | Doc |
|---|---|
| Why (Eli / RB ⇄ Shift Planner) | [problem-brief](https://github.com/hrisikesh-fp/fleetpanda-workspace/blob/docs/shift-planner-handoff-jul6/2-areas/product-discovery/syntheses/2026-07-01_shift-planner-x-route-builder_problem-brief.md) |
| Multi-route product direction | Jul 2 standup — Option A: multiple routes per shift; same driver ⇒ same truck |
| Plan (decisions) | [multi-route-modal-logic-v1 plan](https://github.com/hrisikesh-fp/route-builder/blob/feat/multi-route-modal-logic-v1/plans/multi-route-modal-logic-v1.md) |
| Existing prototype docs | `HANDOFF-driver-conflict-banner.md`, `updates/2026-06-04.md` (in route-builder repo) |

**This handoff ships:** Modal 1/2/3, R0 driver exclusion, truck pre-fill/sync. **Source:** prototype branch `feat/multi-route-modal-logic-v1`. No Figma.

**Parked:** active shift read-only route in RB → [phase2 plan](https://github.com/hrisikesh-fp/route-builder/blob/feat/multi-route-modal-logic-v1/plans/multi-route-active-route-phase2.md)

---

## TL;DR

**Feature flag OFF (multi-route disabled):** one driver → one route max. Any driver **already on a route** is **hidden from every driver dropdown** in RB (route cards, create order, publish, anywhere else). Simple exclusion — no Modal 2.

**Feature flag ON:** full multi-route behavior below (Modals 1–3, pre-fill, sync prompt).

Settings toggle: `showDriverConflict` / driver multi-route conflict demo flag in prototype.

---

## R0 — Multi-route OFF: driver dropdown exclusion

When multi-route feature flag is **off**:

- If driver **D** is assigned to **any** route in today's workspace, **D does not appear** in driver dropdown options on **any other** route.
- **D still appears** on the route they're already assigned to (current selection).
- Apply **everywhere** a driver can be picked:
  - Route card driver dropdown (`lasso-workspace-sheet.tsx`)
  - Create order modal — driver field (when not read-only from route entry)
  - Publish routes dialog — if driver dropdown present
  - Any other driver picker in RB (merge, edit order, etc.)
- **Truck dropdown:** unchanged by R0 unless truck conflict rules apply when FF on.
- No modal for "driver already used" — they're simply not listed. Modal-over-modal only applies when FF **on** (e.g. Modal 2 over workspace).

**Eng:** single helper e.g. `getAvailableDrivers(routeId, allRoutes, ffMultiRoute)` → filter assigned drivers when `!ffMultiRoute`.

---

## Feature flag ON — Modal numbering

| # | Name | Component | Trigger |
|---|---|---|---|
| **Modal 1** | Confirm Truck Selection | `truck-conflict-modal.tsx` | Same truck, **different** drivers |
| **Modal 2** | Set Start Time | `route-sequence-modal.tsx`, `route-start-time-modal.tsx` | Same **driver**, another route today |
| **Modal 3** | Review & Assign | `conflict-resolution-modal.tsx` + banner | Orders for driver with 2+ routes |

---

## Product rules (FF ON)

### R1 — Same driver ⇒ same truck (default, editable)

- Pre-fill truck from sibling route on driver select / Modal 2.
- **Not locked** — user can change, clear (None), defer.
- Diverging trucks → nudge + R4 sync prompt.

### R2 — Modal 1 only when different drivers, same truck

- Same driver + same truck → **no Modal 1** (silent assign or toast).

### R3 — Modal 2 = driver multi-route gate

- Same driver on Route 2 → Modal 2; pre-fill truck; dismissible info strip in modal.
- Confirm disabled until all same-driver routes have start times.

### R4 — Truck sync when changing truck on shared-driver routes

Prompt: **Apply to both routes** / **This route only** / **Cancel**

### R5 — None / clear truck allowed

### R6 — Inform: info strip in Modal 2; toast after Modal 2 confirm

### R7 — Modal 3: drop zones labeled **Route 1 / Route 2** (by start time order)

---

## When each modal fires (FF ON)

| Action on Route 2 | Same driver? | Same truck? | Modal 1 | Modal 2 | Other |
|---|---|---|---|---|---|
| Pick driver (already on R1) | Yes | Pre-fill | No | **Yes** | Info strip |
| Pick truck H-118, Jessica on R2 | No | Yes | **Yes** | No | — |
| Pick truck, Mark on both | Yes | Yes | No | No | Silent/toast |
| Change truck (Mark both routes) | Yes | Different | No | No | **R4 sync** |
| Clear truck | Yes | Empty | No | No | Nudge |
| Ambiguous orders | 2 routes | — | No | No | **Modal 3** |

---

## Path A — Driver first

Pick driver on R2 → already on another route? → pre-fill truck → **Modal 2** (not Modal 1).

## Path B — Truck first

Pick truck on R2 → on another route? → different drivers → **Modal 1**; same driver → assign, no Modal 1.

---

## Key files (prototype)

| File | Change |
|---|---|
| `components/lasso-workspace-sheet.tsx` | `handleDriverSelect`, `handleTruckSelect`, conflict helpers, **R0 filter** |
| `components/truck-conflict-modal.tsx` | Modal 1 |
| `components/route-sequence-modal.tsx` | Modal 2 |
| `components/route-start-time-modal.tsx` | Modal 2 (⋮ menu) |
| `components/conflict-resolution-modal.tsx` | Modal 3 labels |
| `components/create-order-modal.tsx` | R0 driver filter |
| Publish dialog component | R0 driver filter if applicable |
| `components/truck-sync-modal.tsx` (optional) | R4 |

Helpers to add/refactor:

- `getSiblingRoutesForDriver(driverId, excludeRouteId)`
- `shouldShowTruckConflictModal(routeId, truckId)` — true only if different drivers
- `getAvailableDrivers(routeId)` — **R0** when FF off

---

## Example QA (FF ON)

Route 1: Mark + H-118. Route 2: Jessica, no truck.

| Step | Action | Expected |
|---|---|---|
| A1 | R2 truck H-118, Jessica | Modal 1 → Confirm |
| A2 | R2 driver Mark | Modal 2; H-118 pre-filled; no Modal 1 |
| B1 | R2 driver Mark first | Modal 2 only |

## Example QA (FF OFF)

Route 1: Mark assigned. Route 2 driver dropdown → **Mark not listed**. Greg listed. Assign Greg to R2 only.

---

## Acceptance criteria

**R0 (FF off)**

- [ ] **AC0a:** Driver on Route 1 absent from Route 2 driver dropdown.
- [ ] **AC0b:** Same filter in create order modal driver picker.
- [ ] **AC0c:** Same filter in publish dialog driver picker (if present).
- [ ] **AC0d:** Driver still visible on route they're assigned to.

**Modals (FF on)**

- [ ] **AC1:** Same driver R2 → Modal 2 only; not Modal 1.
- [ ] **AC2:** Modal 2 pre-fill truck + info strip.
- [ ] **AC3:** Same truck, different drivers → Modal 1 only.
- [ ] **AC4:** Same truck + same driver → no Modal 1.
- [ ] **AC5:** Clear truck (None) allowed.
- [ ] **AC6:** Truck change → R4 sync prompt.
- [ ] **AC7:** "This route only" → amber nudge on cards.
- [ ] **AC8:** Modal 2 blocked until start times set.
- [ ] **AC9:** Modal 3 Route 1/2 labels.
- [ ] **AC10:** Toast after Modal 2 confirm.
- [ ] **AC11:** Demo flag toggles scenario.
- [ ] **AC12:** No Phase 2 active-route UI.

---

## Out of scope

- Active shift read-only route in RB (Phase 2)
- Shift Planner override modals (separate handoff)
- "Scheduled" filter label fix

---

## Related (separate PR)

**Shift Planner:** [shift-planner handoff](https://github.com/hrisikesh-fp/fleetpanda-workspace/blob/docs/shift-planner-handoff-jul6/2-areas/product-discovery/handoffs/shift-planner-active-shift-override-modal-v1.md) + Figma. Separate PR.

---

## Eng prompt

```
Route Builder multi-route v1: 1-projects/route-builder/handoffs/multi-route-modal-logic-v1.md

Prototype branch feat/multi-route-modal-logic-v1. No Figma.
R0: FF off → hide assigned drivers from ALL driver dropdowns.
FF on: Modal 1/2/3 + R1–R7. AC0a–AC12.
```
