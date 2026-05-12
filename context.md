# Route Builder — Project Context

_This file tracks the current product/meeting state. It is separate from `CLAUDE.md` (which is code context)._
_Update by running `/granola-yesterday` or `/granola-last-week` and saying "update context for Route Builder"._

---

## Current focus

**Phase 1.3 — Per-Stop Balance** (frozen plan: `docs/phase-1.3-per-stop-balance.md`)

Restructuring R1/R2/R3 mock data to demonstrate S1/S2/S3 scenarios + adding a Product & Compartment Breakdown sheet (triggered from a new order-card FAB). R1 (Mueller Construction first delivery) is the working starting case.

## Open questions / blockers

- [ ] Create Route Panel (`create-route-panel.tsx`) — truck/trailer combobox is built; still missing orders list + time estimates section
- [ ] Confirm exact scope of Phase 1.3 features with team

## Recent decisions

- `2026-05-10 — FAB on route card confirmed at top: 8, right: 8 per Figma (Phase 1.2.1 dev file)`

## Team notes

- Figma is source of truth for all UI — always pull values from Figma, not from memory
- Figma Phase 1.2.1: `KIZz6xXZYrRPHarKEa7wXu`
- Figma Phase 1.3: `tbb6l7lTDhlN0jFo7pYeJw`
- Deployed at: https://route-builder-navy.vercel.app
