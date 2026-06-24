# Dev Handoff — Order assignment when a driver has multiple routes

**Feature:** Flag-and-resolve flow for orders that can't be auto-assigned because their driver has more than one active route.
**Prototype repo:** `route-builder` (Next.js 15 / React 19 / TS, all inline styles). This doc describes the **prototype** built here as the reference spec; the production build happens in the real app.
**Status:** 📋 Prototype complete for the banner + **Modal 4 (drag-and-drop)** in two iterations (initial + redesign) + a demo feature-flag toggle.
**Date:** 2026-06-16
**ClickUp:** task `86exxr570` — "Scenario: order assignment when drivers have multiple routes"

> **Design approaches explored (Figma).** The "which route does this order go to?" problem has been explored as four separate modal designs:
> | # | Approach | Status |
> |---|---|---|
> | **Modal 1** | Truck conflict | designed in Figma (not built in code) |
> | **Modal 2** | Driver conflict | **still being designed — out of scope** |
> | **Modal 3** | Route stop time | designed in Figma (not built in code) |
> | **Modal 4** | **Drag and drop** | ✅ **built in code — this handoff** (initial + redesign iterations) |
>
> This document covers **Modal 4 (drag-and-drop)** — the approach taken to code — plus the shared banner and feature flag. Modals 1 and 3 are separate Figma frames; if you want them folded into this handoff, share the frame links and I'll add them.

---

## TL;DR

When a dispatcher creates an order for a driver, and that driver already has **two or more routes** that day, the system can't know which route the order belongs to. Auto-assigning would be a guess. So instead we **flag** the conflict and let the dispatcher decide.

The flow has three pieces:

1. **Banner** — a persistent amber bar below the top nav saying "N orders need route assignment." Pushes the app content down (doesn't overlap). CTA: **Review & Assign**.
2. **Review & Assign modal** — drag-and-drop, grouped per driver. Unassigned orders sit in a bucket on the left; the driver's routes are drop targets on the right. Drag each order onto a route. **Confirm** unlocks only when every order is placed.
3. **Feature-flag toggle** — a Settings switch (`Driver Multi-Route Conflict`) that turns the whole scenario on/off. In the prototype it's a demo switch; in production it's a real feature flag.

---

## Where it lives in the prototype

| Piece | File | Branch |
|---|---|---|
| Banner | `components/conflict-assignment-banner.tsx` | both branches |
| **Modal 4** — initial iteration | `components/conflict-resolution-modal.tsx` | `feat/driver-conflict-banner` |
| **Modal 4** — redesign (current) | `components/conflict-resolution-modal.tsx` | `iter/conflict-modal-redesign` |
| Feature-flag toggle | `contexts/settings-context.tsx` + `components/settings-modal.tsx` | `iter/conflict-modal-redesign` |
| Wiring / layout shift | `app/page.tsx`, `app/layout.tsx` | `iter/conflict-modal-redesign` |
| Driver assignments for demo | `lib/routes-data.ts` | both |

Run the two iterations side-by-side:
- `route-builder/` on `feat/driver-conflict-banner` → **Modal 4, initial** (`pnpm dev`, :3002)
- `route-builder-redesign/` (git worktree) on `iter/conflict-modal-redesign` → **Modal 4, redesign** (`PORT=3010 pnpm dev`)

To see the flow: open Settings (profile avatar → Settings) → turn on **Driver Multi-Route Conflict** → banner appears → **Review & Assign**.

---

## The scenario / demo data

The prototype seeds **2 drivers with 2 routes each** and **5 orders** needing assignment (`lib/routes-data.ts` sets the driver names; the modal carries its own order mock):

- **Mark Ruffalo** — Route 1 + Route 2. 3 orders to place: Mueller Construction (2 products, 1,000 gal), Manor Equipment Rental (1 product, 800 gal), Elgin Concrete (2 products, 1,100 gal).
- **Kyle Reese** — Route 3 + Route 4. 2 orders to place: Lost Creek Country Store (1 product, 600 gal), Barton Creek Fuel Stop (1 product, 900 gal).

Order mock data lives at the top of `conflict-resolution-modal.tsx` as `CONFLICT_GROUPS`. Each group = `{ driverName, orders[], routes[] }`.

---

## Piece 1 — The banner

**File:** `components/conflict-assignment-banner.tsx`. Locked to Figma node `4137:81900`.

- Position: `absolute`, `top: 68` (directly under the 68px TopNav), full width, `zIndex: 1100`.
- Outer wrapper: bg `#111`, `borderBottom: 1px solid #282828`, `padding: 8`.
- Alert card: bg `rgba(184,157,20,0.1)`, border `1px solid rgba(234,179,8,0.5)`, radius 4, `padding: 16`, flex row, gap 12, items center.
- Icon: lucide `TriangleAlert`, size 20, color `#eab308`, `paddingTop: 2`.
- Copy (color `#eab308` throughout):
  - **Title** (14px / 500): `5 orders need route assignment`
  - **Sub** (14px / 400): `2 drivers each have multiple routes, decide where each order goes.`
  - *(Counts should be dynamic in production — see below.)*
- CTA button: text `Review & Assign` (14/500, `#fafafa`) + lucide `ArrowRight` 16, border `1px solid #333`, radius 4, `padding: 8px 12px`, transparent bg, `flexShrink: 0`.
- **Persistent** — no dismiss/close. It only goes away when the conflict is resolved (modal confirm) or the feature flag is turned off. (Earlier a "Later" action was removed by request — when persistence/snooze is wanted, it needs a home outside the banner.)

**Layout shift (important):** the banner does NOT overlap the map. `app/page.tsx` computes `topOffset = isConflictBannerVisible ? BANNER_HEIGHT : 0` (`BANNER_HEIGHT = 95`) and threads it into every fixed/absolute panel so they start *below* the banner:
- `FilterSideSheet`, `FilterSheetCollapsed`, `RouteSheetCollapsed`, `LassoWorkspaceSheet`, `MapControls` each take a `topOffset` prop and add it to their `top`/`height` calc.
- Pattern per component: `top: BASE + topOffset`, `height: calc(100vh - ${BASE + topOffset}px)`.

---

## Piece 2 — The modal (Modal 4, drag-and-drop)

Modal 4 was built in **two iterations** — an initial pass and a redesign. Both share the **same drag-and-drop logic and data model** (below) and differ only in visual treatment. The drag-drop is native HTML5 DnD — **no library** (no dnd-kit / react-dnd).

### Shared interaction logic (identical in both iterations)

State in `ConflictResolutionModal`:
- `assignments: Record<orderId, routeId | null>` — every order starts `null` (in the limbo bucket).
- `draggingId` (for opacity feedback) + `draggingIdRef` (read synchronously inside `onDrop`).
- `dropTarget` (which zone is hovered, for highlight).
- Drop targets: each route zone has id = `route.id`; each driver's limbo bucket has a sentinel id. Dropping on a route sets `assignments[id] = routeId`; dropping back on the bucket sets it to `null`.
- `assignedCount = count(v !== null)`; `allAssigned = assignedCount === totalOrders`.
- **Confirm is disabled until `allAssigned`.** On confirm → close modal + mark the banner resolved.
- Resets all assignments to `null` on every open (`useEffect` on `isOpen`).

> A route zone renders the **same OrderCard** when an order is dropped into it — so an assigned order looks identical whether it's in the bucket or nested under a route header.

### Modal 4 — initial iteration (`feat/driver-conflict-banner`)

The first pass, built from the FigJam sketch. Visual treatment:
- Modal: 960px, bg `#1B1B1B`, border `1px solid #282828`, radius 8, `maxHeight calc(100vh - 80px)`.
- Header: title `Review & Assign Orders` (18/600, `#FAFAFA`) + subtitle + **a thin progress bar** (`#4D55F8` fill, turns green when complete) + header/footer divider lines.
- Driver label: **avatar circle with initials** (e.g. "MR") + name + "N of M assigned".
- Column labels: small **uppercase** `UNASSIGNED` / `ROUTES` (11px, letter-spaced).
- Order card: bg `#1F1F1F`, radius 6; translucent teal badge (`rgba(37,184,167,0.15)` bg, teal `D`); subtitle is plain `product · gal` text.
- Route zone: bg `#171717`, header with a thin colored **left-border** accent (route's own color), `N Orders` badge bg `#262626`.
- Footer: left status text ("N orders still unassigned"), then `Cancel` + `Confirm & Assign`.

### Modal 4 — redesign, CURRENT (`iter/conflict-modal-redesign`)

Matched to Figma node `4144:93363`. This is the one to build from unless told otherwise. Differences from the initial iteration:
- **No progress bar; no header/footer divider lines.** Modal: bg `#1b1b1b`, radius 8, `padding 24`, `gap 20`, no border.
- Header: title `Review & Assign Orders` (18/500, `#e5e5e5`) + X (24, `#e5e5e5`) + subtitle `N of 5 orders assigned, drag each order into a route.` (14/400, `#a3a3a3`).
- Driver label: **no avatar** — just `Name` (16/500, white) · 4px dot `#737373` · `N/M Assigned` (14/400, `#a3a3a3`).
- Column labels: `Orders to be Assigned` / `Routes` — **16px Light (300)**, `#a3a3a3` (not uppercase caps).
- **Order card** (`#282828`, radius 4, `padding 16px 16px 12px`, gap 12, items-start):
  - lucide `GripVertical` 20, `#737373`.
  - **Solid** teal badge: 20×20, radius 4, bg `#25b8a7`, `D` glyph 14/500 in **dark** `#171717`.
  - Customer name 16/500 white (ellipsis).
  - Second row, space-between: `[Droplet 16 + "N Products"]` at **60% opacity** (`#fafafa`) on the left; `N,NNN gal` (14/400, `#e5e5e5`) on the right. Product count derives from the order's product list (1 → "Product", 2+ → "Products").
- **Route zone** (`#111` outer box, border `#282828`, radius 4, padding 8, gap 8; empty zones are `minHeight 112`):
  - Header bar: bg `#1f1f1f`, radius 4, `padding 8px 8px 8px 16px`, overflow hidden, with a **6px pastel accent bar** absolutely positioned on the left (`#d8b4fe` purple for route 1, `#93c5fd` blue for route 2).
  - Inside header: lucide `Truck` 16 `#fafafa` + truck name (16/500 white) + `N Orders` badge (bg `#111`, transparent border, 14/500 `#fafafa`).
  - Empty state: centered `Drop orders here` (14/400, `#737373`).
- Footer (space-between, no top border): `Cancel` (bordered `#333`, `#fafafa`, subtle shadow) on the left; **`Confirm & Proceed`** on the right — bg `#e5e5e5`, dark text `#171717`, `opacity 0.5` + `not-allowed` until `allAssigned`, then full opacity + clickable.

### Other approaches — NOT in this handoff

- **Modal 1 (Truck conflict)** and **Modal 3 (Route stop time)** are separate design directions for the same problem, designed in Figma but not built in code here. Share the frame links to fold them in.
- **Modal 2 (Driver conflict)** is still being designed — out of scope.

Whichever approach ships, it can reuse the same conflict-detection + persistence plumbing described under "Building it for real"; only the presentation changes.

---

## Piece 3 — The feature flag (prototype demo switch)

In the prototype this is a Settings toggle so the scenario can be shown on demand. In production, replace it with your real feature-flag system.

- **`contexts/settings-context.tsx`** — `showDriverConflict: boolean`, default **`false`**, persisted to `localStorage` under `"showDriverConflict"`. Follows the exact pattern of the existing `showEditInFab` toggle (state + loader in the mount `useEffect` + `update…` setter that also writes localStorage + context value + fallback object).
- **`components/settings-modal.tsx`** — a `<Switch>` row labelled **"Driver Multi-Route Conflict"** (GitBranch icon, indigo `#6366F1` checked color), in the Preferences section alongside the other prototype toggles.
- **`app/page.tsx`** gating:
  - `const { showDriverConflict } = useSettings()`
  - Local `isConflictBannerResolved` (set true on modal confirm).
  - `isConflictBannerVisible = showDriverConflict && !isConflictBannerResolved`.
  - `useEffect` re-arms a fresh banner whenever the flag flips on (`if (showDriverConflict) setIsConflictBannerResolved(false)`) — lets you re-demo without a reload.
  - Banner + modal only render when the flag is on; `topOffset` is 0 when off so the app sits normally.
- **`app/layout.tsx`** — `SettingsProvider` was lifted here (it used to be inside `page.tsx`). Required so `Home` itself can read the flag reactively; otherwise toggling wouldn't update the banner live. No behavior change for the other toggles.

---

## Building it for real — what changes from the prototype

The prototype is all mock data + a demo switch. For production:

1. **Trigger / detection.** Compute the conflict server- or store-side: an order whose `driver_id` matches a driver that has **>1 route** for the target day, and which isn't yet tied to a specific route. The banner count = number of such orders; the driver count = distinct drivers among them. Group the modal by driver.
2. **Feature flag.** Swap the Settings toggle for your real flag (LaunchDarkly / config / env). The toggle here is purely a demo affordance.
3. **Real data in the modal.** Replace `CONFLICT_GROUPS` with the live conflict set. Order card needs: customer name, product count (or list), planned volume. Route needs: truck/route label, route id, current order count, an accent color.
4. **Persist the resolution.** On **Confirm**, write each order's chosen route. This is the one real mutation — route it through whatever the production app uses for "assign order to route" (the same path a normal route-assignment uses), per route, for every order in `assignments`. Then clear/refresh the conflict set so the banner reflects reality.
5. **Partial save?** Prototype gates Confirm on *all* orders placed. Decide if production should allow saving a partial resolution and leaving the rest flagged. (Open question below.)
6. **Empty/edge states.** One driver vs many; a driver with 3+ routes (layout currently assumes 2 columns of routes but the right column is a vertical list, so it scales); zero remaining conflicts → banner should disappear.
7. **Accessibility.** Native HTML5 DnD has no keyboard path. Add a non-drag fallback (e.g. a per-order route dropdown / "Assign to ▾") for keyboard + screen-reader users before shipping.

---

## Design tokens used

```
Banner:    alert bg rgba(184,157,20,0.1) · border rgba(234,179,8,0.5) · text/icon #eab308
Modal bg:  #1b1b1b (redesign) / #1B1B1B + #282828 border (v1)
Order card: #282828 (redesign) / #1F1F1F (v1) · radius 4 / 6
Badge D:   solid #25b8a7 + #171717 glyph (redesign) / translucent teal (v1)
Route box: #111 outer, #1f1f1f header bar, #282828 border
Accents:   route 1 #d8b4fe (purple-300), route 2 #93c5fd (blue-300)
Text:      #fff / #e5e5e5 / #a3a3a3 / #737373
Confirm:   #e5e5e5 bg + #171717 text, opacity 0.5 when disabled
Font:      Geist (Regular 400 / Medium 500 / Light 300 / SemiBold 600)
```

---

## Open questions (product, not code)

1. **Partial resolution** — must the dispatcher place *all* flagged orders at once, or can they resolve some and leave the rest flagged? (Prototype requires all.)
2. **Persistence of "Later"** — if a snooze/dismiss is wanted, where does the deferred state live? The banner is currently all-or-nothing.
3. **Banner copy** — counts are hardcoded in the prototype; confirm the dynamic phrasing ("N orders need route assignment" / "M drivers each have multiple routes…").
4. **3+ routes per driver** — confirm the layout/UX when a driver has more than two routes.
5. **Other approaches** — Modal 1 (truck conflict) and Modal 3 (route stop time) exist as separate Figma directions; Modal 2 (driver conflict) is still to be designed. This handoff covers the **Modal 4 (drag-and-drop)** build only.
