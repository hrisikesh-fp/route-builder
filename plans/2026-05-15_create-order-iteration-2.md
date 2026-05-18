# Create Order — holistic entry points (iteration 2)

## Context

Iteration 1 shipped the inline `+` between order cards + the Create Order modal. This iteration extends Create Order to feel like a coherent capability with multiple entry points, fixes one annoying bug, and brings in a long-overdue piece of polish — the filter sheet dropdowns.

The user is on a demo countdown — this is "bare minimum for the stand-up, but built holistically so it doesn't paint us into a corner." I'm also picking up a meta-track: a running design journal capturing the messy middle of the design process (decisions, alternatives, why we landed where we did). The user wants to write about this long-form eventually; we're going to keep notes.

### Scope of this iteration

1. **Bug fix** — Customer + ShipTo dropdowns can both be open at once inside the Create Order modal. Clicking one should close the other.
2. **Filter Sheet dropdowns** — Customer / ShipTo / Driver currently render as static placeholder rows. Replace with the City-filter pattern (searchable, multi-select, grouped, Apply/Cancel). Same data as the Create Order modal.
3. **ShipTo pin tooltip** — for map pins on shiptos *without an order today*, replace the current tooltip with a Figma-specced compact panel (header + threshold pills + Last/Next Order timeline + "Create Order" CTA). Per Figma node `6059:153946`.
4. **Map-pin → modal flow** — clicking a shipto-without-order pin zooms the map onto the shipto and shows the new tooltip; clicking "Create Order" opens the modal with no originating route. New entry point parallel to the inline `+`.
5. **Route focus while the modal is open** — keep the originating route's card expanded; zoom the map to the route at one-notch-out (`maxZoom: 12` vs current 13) so context isn't lost behind the dim backdrop.
6. **Start a design journal** — `1-projects/route-builder/DESIGN_JOURNAL.md` — append-only log of UX decisions taken across iterations.

### Deferred (acknowledged, not in this PR)

- **Modal → Side Sheet (right rail) for Create Order** — strong direction worth piloting next. As a modal, the route behind it is dimmed; as a side sheet, the route stays in full focus and the user sees the new order appear in the route *while filling the form*. That's the "aha" moment the dispatcher feels. Phase C (route focus + zoom) is the foundation that makes the side-sheet version pay off — that's why it's in this iteration even though the side-sheet swap isn't.
- **Create Order from shiptos that already have an order** — relevant because a shipto can have multiple orders/day (morning + evening for fast-consuming sites). Tooltip variant for these isn't redesigned yet.
- **Create Order trigger from inside the Filter Sheet's ShipTo rows** — useful for "I filtered down to a shipto, now I want to order for it" — but the gesture (per-row `+` on hover vs. context menu vs. something else) isn't settled.
- **Filtering the map/workspace by the applied filter values** — Phase B wires the dropdown UI + committed state, but plumbing those filters through `RouteMap` and `LassoWorkspaceSheet` is its own task.
- **Route picker on submit when no route was passed in** — for this pass, no-route submissions land in Unassigned Orders, and the dispatcher uses the existing "Move" UI to assign.

---

## Phase A — Bug fix: dropdown mutual exclusion

**Where:** `components/create-order-modal.tsx` lines 185–187 (inside the internal `Dropdown` component's click-outside `useEffect`).

**Cause:** The handler uses `target.closest("[data-dropdown-root]")` to decide whether the click is "inside a dropdown". Both Customer and ShipTo dropdowns share that attribute, so a click inside the *other* dropdown's root still counts as "inside" — neither closes.

**Fix:** Attach a `useRef<HTMLDivElement>(null)` to *this* dropdown's root and replace the selector check with `dropdownRef.current.contains(e.target as Node)`. Closes only when the click is genuinely outside *this* dropdown — opening one closes the other naturally.

---

## Phase B — Filter Sheet dropdowns

**Where:** `components/filter-side-sheet.tsx`. Mirror the City dropdown (lines 111–503) for **Customer**, **ShipTo**, and **Driver** (currently static placeholders at lines 511–545).

**Data source** — extract the existing `buildCustomerAndShipToIndex()` from `components/create-order-modal.tsx` into a shared helper in `lib/mock-data.ts` (or a new `lib/customer-shipto-index.ts`) so the modal and filter sheet stay in lockstep. The function already produces `{ customers, shipTosByCustomer }`.

**Per-dropdown shape:**

| Dropdown | Rows show | Grouping | Count badge |
|---|---|---|---|
| Customer | Parent customer name | None (flat alphabetical) | # of orders today across all this customer's shiptos |
| ShipTo | ShipTo name (fallback to address) | **Grouped by parent customer** (showcases 1-many) | # of orders today at this shipto |
| Driver | Driver name | None (flat) | # of routes today |

**State per dropdown** (City pattern verbatim):
- `is{X}DropdownOpen: boolean`
- `tempSelected{X}: Set<string>` (pending)
- `applied{X}: Set<string>` (committed)
- `{x}SearchQuery: string`
- ShipTo only: `expandedCustomersInShipToDropdown: Set<string>` (to collapse customers and show their shiptos as sub-rows)

**Apply / Cancel** behaves exactly like City (line 203–217 reference): Cancel reverts `temp` → `applied`; Apply commits `temp` → `applied` and fires `onChange`. Wire the `onChange` callbacks back to `page.tsx` state for now even if nothing consumes them yet — keeps the data flow honest.

---

## Phase C — Route focus while the modal is open

When the modal opens with a `routeId`:

1. **Programmatic expand**
   - Today, `expandedRouteIds` lives inside `LassoWorkspaceSheet` (`components/lasso-workspace-sheet.tsx:2829`) and `initialExpandedRouteIds` only applies at mount.
   - Add `forceExpandRouteId?: string | null` prop. A `useEffect` inside the sheet adds the ID to `expandedRouteIds` (idempotent — no-op if already expanded) when the prop changes.
   - `page.tsx` passes `createOrderModalState.routeId` to it.

2. **Map zoom to the route at one-notch-out**
   - `window.__zoomToRoute(routeId)` in `components/route-map.tsx:317–327` currently calls `fitBounds` with `maxZoom: 13`.
   - Change the signature to `__zoomToRoute(routeId, opts?: { maxZoom?: number })` and call with `maxZoom: 12` when the modal opens.
   - Triggered from `page.tsx` via a `useEffect` keyed on `createOrderModalState.open && createOrderModalState.routeId`.

3. **No-route case** (entered from a shipto pin): skip steps 1 & 2; the map is already zoomed on the shipto.

---

## Phase D — ShipTo-no-order tooltip + map-pin entry

**Per Figma node `6059:153946`:**

```
┌────────────────────────────────────┐
│ Bastrop Excavating                 │  ← 16px medium, white
│ 📍 274 Bayberry Lane Austin, TX    │  ← 12px, #a3a3a3
├────────────────────────────────────┤
│  ● 3   ● 8   ● 4   ● 2             │  ← red/yellow/green/blue pills, bg #333
│                                     │
│  17/1/2026  ─────────  20/1/2026   │
│  Last Ordered           Next Order  │
│                                     │
│                  [ Create Order ]   │  ← primary button
└────────────────────────────────────┘
```

**Implementation:**
- Add a new render function (or branch) in `components/map-pin-tooltip.tsx` — `renderShipToNoOrderTooltip(props)` — returns the HTML string above. Same colour tokens as the existing tooltip (#111 bg, #282828 divider, #a3a3a3 secondary text).
- The "Create Order" button gets a stable id (e.g., `data-action="create-order"` + `data-shipto-id`); the existing tooltip-insertion code in `route-map.tsx` attaches a click listener after DOM insertion that bubbles up to a new window global `window.__openCreateOrderForShipTo(shipToId)`.
- `page.tsx` registers the global to set `createOrderModalState = { open: true, routeId: null, prefillShipToId: <id> }`.
- `CreateOrderModal` accepts a new optional `prefillShipToId` prop — on mount it pre-selects that shipto (and its parent customer) in the dropdowns.

**Map-pin behavior** (shipto-no-order pins specifically):
- Click pin → call new `window.__zoomToShipTo(lat, lng, zoom?)` (parallel to `__zoomToRoute`) using `flyTo({ center: [lng, lat], zoom: 13, duration: 800 })`.
- After the fly-to settles, show the new tooltip (Mapbox popup) at the pin.
- The "Create Order" button inside is the action.

**Threshold pills (red/yellow/green/blue counts):** for now, source from `ShipTo.tankSize` and a mocked breakdown — keep the same colour ordering as the existing tooltip. We can wire real per-tank threshold data later.

**Last Ordered / Next Order timeline:**
- "Last Ordered" = `ShipTo.lastDelivery` (already in the data).
- "Next Order" = mocked +14 days for now (don't have real next-order data; flag in DESIGN_JOURNAL).

---

## Phase E — Design Journal (running doc)

**File:** `1-projects/route-builder/DESIGN_JOURNAL.md` (new).

**Purpose:** Capture the messy-middle of UX decisions — the alternatives considered, the user's pushback, the rationale we landed on. Append-only. Distinct from the `DEMO_PLAYBOOK.md` (how to run the demo) and from the `plans/` folder (point-in-time iteration plans). This file is the narrative — the *why*.

**Cadence:** In-flight, not session-end. Every time we make a non-obvious call, an entry gets appended immediately — that preserves the back-and-forth, which is the actual material for a case study. Session-end dumps compress and lose nuance.

**Entry format:**
```
### <YYYY-MM-DD HH:MM> · <short title>
Context: <what we were trying to do>
Considered: <2–4 alternatives weighed>
Decision: <what we went with>
Why: <reasoning, including pushback from the user>
Tags: #ux #interaction #data-model #design-process
```

Tags enable filtering for later case-study writing (e.g., grep all `#data-model` entries for one essay, `#ux` for another).

**Initial entries to seed it with** (from this iteration and the previous):
- Inline `+`: slot vs overlay → overlay (no layout shift). `#ux #interaction`
- Inline `+`: hover trigger — only the hovered card's own bottom + lights up (one at a time, not both adjacent). `#ux #interaction`
- Insert position is **time-driven**, not gap-clicked — the gap is a shortcut, planned time decides position. `#ux #data-model`
- Customer/ShipTo split: `customerName` is the parent (Walmart); `shipToName` is the location (Walmart-E). Order card displays the shipto. `#data-model`
- Multiple entry points to Create Order: inline `+` (done), shipto-pin tooltip (this iteration), filter sheet (deferred — gesture TBD). `#ux #information-architecture`
- Tooltip with Create Order: shiptos *without* an order today only; extension to shiptos *with* orders deferred (relevant because a shipto can have multiple orders/day for fast-consuming sites — agricultural / construction). `#ux #domain`
- Route focus when modal opens — expand the card + zoom map at `maxZoom: 12` (one notch out from the click-route zoom of 13). Foundation for the future side-sheet swap. `#ux #interaction`
- **Future direction:** swap Create Order from modal to side sheet so the route stays in focus and the new order is seen joining the route as the form is filled. `#ux #interaction #future`

## Phase F — Save this iteration's plan to the project repo

**File:** `1-projects/route-builder/plans/2026-05-15_create-order-iteration-2.md` (new).

Save a copy of this plan as a point-in-time artifact alongside the journal so the user can come back to it later to understand the *what* of this iteration. (The journal is the *why*; the plan is the *what*; they complement each other.) Future iterations get their own date-prefixed plan file in this folder.

---

## Files to modify

| File | Phase | What changes |
|------|---|--------------|
| `components/create-order-modal.tsx` | A, D | Ref-based click-outside on `Dropdown`; accept `prefillShipToId` prop and pre-select shipto+customer on mount |
| `components/filter-side-sheet.tsx` | B | Replace 3 placeholder rows with City-pattern dropdowns wired to shared customer/shipto/driver data |
| `lib/customer-shipto-index.ts` (new) or `lib/mock-data.ts` | B | Export `buildCustomerAndShipToIndex()` so modal and filter share the source |
| `components/lasso-workspace-sheet.tsx` | C | New `forceExpandRouteId?` prop + sync useEffect into `expandedRouteIds` |
| `app/page.tsx` | C, D | useEffect that calls `__zoomToRoute(routeId, { maxZoom: 12 })` on modal open; new shipto-pin handler; expose `__openCreateOrderForShipTo` window global; pass `forceExpandRouteId` to sheet |
| `components/route-map.tsx` | C, D | `__zoomToRoute(routeId, opts?)`; new `__zoomToShipTo(lat, lng, zoom?)`; shipto-no-order pin click handler that flies to point + shows new tooltip |
| `components/map-pin-tooltip.tsx` | D | New `renderShipToNoOrderTooltip()` per Figma `6059:153946`; export from same module |
| `1-projects/route-builder/DESIGN_JOURNAL.md` | E | **New file** — seeded with the entries above |
| `1-projects/route-builder/plans/2026-05-15_create-order-iteration-2.md` | F | **New file** — copy of this plan, for future reference |

## Files to read (reference only)

- `components/filter-side-sheet.tsx:111–503` — City dropdown pattern to mirror
- `components/create-order-modal.tsx:buildCustomerAndShipToIndex` — extracting to shared helper
- `components/route-map.tsx:317–327` — existing `__zoomToRoute` to extend
- `components/map-pin-tooltip.tsx` — current tooltip HTML structure to mirror styling
- `lib/mock-data.ts` — `mockDrivers`, `mockExtractionOrders`, `shipTosWithoutOrders`

---

## Verification

1. **Dropdown fix**: Open Create Order modal. Click Customer → opens. Click ShipTo → Customer closes, ShipTo opens. Click outside both → both close.
2. **Filter dropdowns**: Open filter sheet. Each of Customer/ShipTo/Driver opens like City — search, multi-select, count badges, Apply/Cancel. In ShipTo, expanding "Hutto Agricultural Cooperative" reveals its 3 shiptos.
3. **Route focus**: Click inline `+` on Mark Ruffalo's route → modal opens, his card expands (if collapsed), the map zooms to fit his route at slightly-pulled-back (maxZoom 12).
4. **ShipTo pin tooltip**: Click a shipto-without-order pin on the map → map flies to the pin → new tooltip appears (per Figma) → click "Create Order" → modal opens with that shipto + its customer pre-selected.
5. **No-route submit**: Submit the order from a shipto-pin flow → new order appears in the Unassigned Orders section of the workspace sheet (existing UI already handles unassigned orders).
6. **Design journal**: `DESIGN_JOURNAL.md` exists with seeded entries.

---

## Things I'm assuming (call out if any are wrong)

- "80% zoom" interpreted as `maxZoom: 12` (one step out from current 13). If you want a softer pull-back, increasing padding is the other option — happy to switch.
- No-route submit → Unassigned. Matches your wording ("then decide which route to go to") and uses existing UI; no new route-picker step in the modal.
- Filter Sheet Create Order trigger (per-row `+` on hover) — deferred for now; not in this PR.
