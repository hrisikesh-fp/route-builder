# Multi-Route — Active Shift in RB (Phase 2)

**Status:** Parked — implement with Eli Roberts Shift Planner drag-drop work  
**Requested by:** Ani  
**Depends on:** `plans/multi-route-modal-logic-v1.md` (Modal 1/2/3 logic)

---

## Problem

When a dispatcher opens Route Builder while a driver's **shift is already active**, they need to see that state without editing the live route. Today RB looks the same as planning mode — this contributed to Eli confusion (editing vs adding Route 2).

---

## Scope (when picked up)

### Workspace route card

- Label: **"Shift active"** (not "Route 1 green locked" — that's mobile/Shift Planner language)
- Visual: distinct rail/border treatment (e.g. muted card, lock icon)
- **Strip actions:** truck, driver, trailer, reorder, add load, delete stops, publish (confirm list with PM)
- **Allow:** view route summary, view on map, **Add Route 2 for [driver]** CTA

### Map

- Active route polyline: distinct opacity/style vs planned routes
- Optional badge on route label

### Modal / warning (Eli scenario)

- When user attempts drag/reorder on active route group → explain: edit in Shift Planner OR add Route 2
- Link/copy TBD with Shift Planner v1 designs

---

## Out of scope

- Replacing Shift Planner reorder (Eli P2 drag-drop within batch)
- Green/gray semantics copied from mobile — use RB-native "Shift active" language

---

## Acceptance criteria (draft)

- [ ] Active shift detected (mock flag or API field TBD)
- [ ] Active route card read-only per action list
- [ ] Map visually distinguishes active vs planned
- [ ] Add Route 2 CTA visible when driver has active route
- [ ] No regression to Modal 1/2/3 v1 logic
