# Route Builder — Daily Updates

> Running log of user-visible updates shipped each day. End-of-day: copy the latest dated section into your stakeholder update. Keep entries short and outcome-focused ("did X so users can now Y") — engineering notes belong in commit messages, not here.
>
> Individual day files live in `updates/` folder.

---

## 2026-06-05

> Product-discovery / research-ops (not app code).

- **Fleet Fuels RB demo through the pipeline**: pulled the June 2 demo call from Granola, compared vs Avoma (Avoma wins on speaker labels), cleaned it (script + review), and saved a "why cleaning matters" evidence doc. Raws kept as `_granola` / `_avoma`.
- **New `/customer-call-analyzer` skill**: a whole-customer analysis skill (sibling to the frozen route-builder-12 analyzer) — same rigor, broader lens (stakeholder map, JTBD, account-health first-class, cross-call tags). New `CUSTOMER_UNDERSTANDING_METHODOLOGY.md` + command, registered in README.
- **First Fleet Fuels analysis**: verified, quote-anchored. Headline insight — FleetPanda assumed "come back full"; Fleet Fuels actually wants the inverse (end dry → reload at terminal → continue → return empty). Reload automation is their #1 unmet need; caught a tank-monitor auto-order regression too.
- **Pipeline tracking**: `pipeline-state.md` updated (demo logged as Fleet Fuels call #4; reframed as prospect-in-onboarding; new skill registered).

---

## 2026-06-04

- **Multi-route conflict — Modal 1 (Truck)**: same truck selected for two routes now fires a read-only caution modal. Shows the conflicting route card. Confirm proceeds; Cancel reverts.
- **Multi-route conflict — Modal 2 (Driver sequence)**: same driver on two routes fires a hard-block modal. Confirm stays disabled until both routes have a start time. Sequence badges (1, 2) derive from start time live — earlier start = Route 1. Already-taken times are blocked in the picker.
- **Multi-route conflict — Modal 3 (Route Start Time)**: ⋮ menu on any route card shows "Route Start Time" when that driver has a conflict. Opens a single-time-input modal; same-driver routes shown read-only for context.
- **Save Map View**: new MapPinned button in the floating map controls. Click to save camera position (center, zoom, bearing, pitch) to localStorage; click again to fly back. Persists across refreshes.
- **Lasso icon updated** to `LassoSelect` (cursor variant). Compass button removed. All map control buttons standardised to 32px.

---

>>>>>>> Stashed changes
## 2026-06-03

- **Edit Order — customer card redesign**: the read-only customer/ship-to card at the top of the Edit Order modal now matches Figma — `#282828` bg, 4px radius, no border, customer name and ship-to on one row separated by a grey dot, map pin icon at 16px.
- **Pencil (edit) button on order card hover**: hovering an order card in the workspace now shows a pencil icon before the 3-dot menu. One click opens Edit Order directly — no menu required. Works on both condensed and detailed card views.
- **Settings toggle — Edit Button on Order Card**: new toggle in Settings → Preferences (indigo switch, default ON, persisted). When ON, pencil shows in FAB and Edit is removed from 3-dot. When OFF, the reverse.
- **Settings modal — fixed height + scroll**: 720px max-height, header fixed, content scrollable.
- **Date change warning (create from route)**: changing the planned date while creating an order from a route now shows a confirmation — "Change Planned Date? / ...will move this order out from the route." Cancel reverts; "Yes, Proceed Anyway" applies.
- **Empty order warning**: clicking "Create Order" with all quantities at 0 now shows a confirmation before submitting.
- **Route Summary — Totals block**: totals block below the balance table shows Total Load Qty and Total Delivery Qty — grand total + per-product columns, aligned with the table above.
- **Route map dasharray fix**: fixed console error from sub-millisecond timer jitter in the route draw-in animation.

---

## 2026-05-29

- **L1/L2 colors — orange**: capacity warning banners and per-product Zone A text now use orange `#fb923c`. Previously amber for banners and purple for per-product lines.
- **L3 colors — amber**: stop-runout warnings moved from red to amber. Red is now reserved for product incompatibility only.
- **Stop warning strip redesign**: red bordered card + red strip replaced by a standalone dark strip below the card in amber. New copy: "will run out before this stop" (first fail) / "already ran out" (downstream).
- **Truck section Figma alignment**: capacity message and View Truck Details button left-indented to match Figma spec; below-truck message now mirrors the collapsed banner (arrow + delta, right-aligned).
- **Zone B banner fires without loads**: collapsed banner now shows capacity state even before load orders are added.
- **MidRouteAddLoadCTA redesign**: ⊗ XCircle break icon in seq column, dashed amber horizontal arm, centered amber badge ("N deliveries can't be fulfilled"), indigo CTA row below — aligned with order cards.
- **Amber dashed connector line**: sequence line turns amber dashed from the break point (⊗) through all failing stops.
- **R3 (Jessica Harper) demo reset**: removed pre-seeded load order and pre-assigned truck. Demo now starts from truck selection → validation fires → add loads step by step.
- **Add Load Order modal — R3 demo orders**: Flint Hills now has two dedicated demo entries — Load 1 (D2,500 + G1,500 at 05:30 AM) and Load 2 (D500 + G500 at 09:15 AM).

---

## 2026-05-26

- **Validation banner - View to navigate (2+ issues)**: banner on expanded route cards with 2 or more failing stops now shows a ghost "View" button instead of auto-scrolling on expand. Click View to jump to the first issue and reveal the 1/N counter with up/down chevrons. Collapsing and re-expanding the card resets to "View" again.
- **Validation banner - scroll fix**: chevron navigation now works correctly regardless of how far the user has manually scrolled within the route card before clicking a chevron.
- **Route Summary - removed Assumed Starting Load**: the "Assumed starting load" row is gone from both the display and the balance calculation. Stops now show real negative balances when no load order exists.
- **Route Summary - no-load-order banner**: when a route has no load order, an indigo info banner appears above the table — "No Load Order added yet. Add one to see product depletion per stop."
- **Drag reorder syncs to map**: dragging stops to reorder in the workspace now updates the sequence badges on map pins in real time. Previously the map always showed the original order.
- **New orders survive drag reorder**: orders created after a drag now appear correctly at the end of the route in the workspace. Previously they vanished from the card.
- **Add Load Order - new Flint Hills entries**: two new `200*DIESEL-ONROAD CLEAR` load orders added to the Flint Hills - Johnny Morris terminal — 5,500 gal at 05:30 AM and 1,500 gal at 09:30 AM.

---

## 2026-05-25

- **Validation banner - smarter runout copy**: banners on route cards now say "X will run out at this stop" at the exact stop where the product first goes negative, and "X already ran out before this stop" for any downstream stops carrying that shortfall. Previously all failing stops said the same thing.
- **Validation banner - stop navigator**: when a route has 2 or more failing stops, up/down chevron buttons appear in the banner so you can step through each issue without scrolling the card manually.

---

## 2026-05-22

- **Map polish — arrows + draw animation + smoother zoom**:
  - Direction arrows now stay permanently visible on any route in the workspace. They re-render in the route's own color every time the polyline rebuilds.
  - When a new stop is added, the polyline draws in over 1.4s with ease-out. Previously it snapped into place silently.
  - Map zoom-out after submit is now 1.8s with cubic ease-out (was abrupt 800ms snap). Pairs with the draw-in animation.
- **Route line contrast**: idle workspace routes now sit at 0.25 opacity (was 0.8) and highlighted ones (hover / expanded / checked) pop at 1.0 with a thicker 5px stroke. Hover is now unmistakable.
- **Expanded routes always highlighted**: the route polyline becomes fully colored whenever its card is expanded, not just on hover.
- **InsertOrderOverlay "+" tooltip fixed**: the black browser tooltip is gone; now uses the shadcn Tooltip component.
- **Top-nav Create Order button**: redesigned to icon-only (40x40), matches the map-entities button style.
- **ShipTo dropdown sorted properly**: sorts by customer name first, then ship-to address - matches how the labels read.
- **2-sec auto-dismiss tooltip without Create Order CTA**: the tooltip that flashes after ShipTo selection no longer shows a "Create Order" button - that action is already in progress.
- **Route zoom-out 5-10% looser**: extra padding around route bounds so stops have breathing room instead of being squished to edges.
- **Route line highlight + zoom after adding a stop**: polyline immediately shows full color; map zooms to fit the full route 500ms after submit; new order card flickers green.
- **Create Order — trigger memory**: the system remembers which route you last expanded or clicked "+" on. Orders created from the map-pin tooltip or top-nav button land on that route as the next stop. No active route - goes to Unassigned.
- **Create Order — new orders appear on the map**: previously, orders created in-session were invisible to the map. Now the new pin appears immediately with its sequence badge and the route polyline redraws.
- **Create Order — toast wording fixed**: now reads "Order added to [Driver]'s route as stop N" when landing on a route. The old fallback wording only fires when the order actually goes to Unassigned.
- **Truck Details sheet redesigned**: 1-Truck / Truck+1-Trailer / Truck+2-Trailers states with CAB connector and hook/gripper for trailers. New compartment grid (Cn header + max gal + product dots). Per-vehicle footer. Total Capacity row when 2+ vehicles. Expand-to-modal toggle in the header.
- **Map-pin tooltip Create Order button**: restyled to dark secondary variant.
- **Create Order drawer width**: bumped 480 - 560 so "Assets & Products" + toggle + Refresh all fit on one line.

---

## 2026-05-21

- **Top nav — "+ Create Order" button**: 3rd entry point added to the top nav (36px, outlined style matching the date selector). Disabled while any Create Order modal/drawer is already open.
- **Create Order modal redesign**: Modal 1 width 960 - 800. "Mark Order As Urgent" moved into the header. Delivery/Extraction toggle moved into the Assets & Products section header. Renamed "Delivery Order" - "Assets & Products". "+ Add Asset" button removed; only Refresh remains.
- **Create Order — removed map zoom on "+ FAB"**: clicking the "+" FAB on a route card no longer zooms the map. The only zoom in the create-order flow is when you select a ShipTo.
- **Create Order — fixed dropdown positioning**: Customer / ShipTo / DatePicker / TimePicker dropdowns were opening in the wrong place and needed 2-3 clicks. Fixed.
- **Modal 3 — Create Order side sheet**: new drawer variant pinned to the right of the collapsed workspace tab. Workspace auto-collapses when the drawer opens. Header button morphs between drawer and centered modal.
- **Settings**: Modal 3 added as a 3rd radio option alongside Modal 1 / Modal 2; persisted to localStorage.
- **Emil-style entrance/exit animations**: drawer slides in 320ms / out 200ms from right; centered modal scales 0.96 - 1 with backdrop fade; map controls glide between right-offsets on open/close.
- **ShipTo selection in modal**: zooms map to that ShipTo and flashes the hover tooltip for 2s then fades.
