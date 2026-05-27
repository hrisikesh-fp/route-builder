# Route Builder — Daily Changes

> Running log of user-visible changes shipped each day. End-of-day: copy the latest dated section into your stakeholder update. Keep entries short and outcome-focused ("did X so users can now Y") — engineering notes belong in commit messages, not here.
>
> Individual day files live in `changes/` folder.

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
