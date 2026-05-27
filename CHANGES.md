# Route Builder — Daily Changes

> Running log of user-visible changes shipped each day. End-of-day: copy the latest dated section into your stakeholder update. Keep entries short and outcome-focused ("did X so users can now Y") — engineering notes belong in commit messages, not here.

---

## 2026-05-26

### Create Order flow
- **Top nav — "+ Create Order" button**: 3rd entry point added to the top nav (36px, outlined style matching the date selector). Disabled while any Create Order modal/drawer is already open.
- **Create Order modal redesign**: Modal 1 width 960 - 800. "Mark Order As Urgent" moved into header. Delivery/Extraction toggle moved into the Assets & Products section header. Renamed "Delivery Order" - "Assets & Products". "+ Add Asset" removed, only Refresh remains.
- **Modal 3 — Create Order side sheet**: new drawer variant pinned to the right of the collapsed workspace tab. Auto-collapses the workspace when it opens. Header button morphs between drawer and centered modal.
- **Settings**: Modal 3 added as a 3rd radio option alongside Modal 1 / Modal 2; persisted to localStorage.
- **Emil-style entrance/exit animations**: drawer slides in 320ms / out 200ms from right; centered modal scales 0.96 - 1 with backdrop fade; map controls glide between right-offsets on open/close.
- **Create Order — fixed dropdown positioning**: Customer / ShipTo / DatePicker / TimePicker dropdowns were opening in the wrong place and needed 2-3 clicks. Fixed.
- **Create Order — removed map zoom on "+ FAB"**: clicking the "+" FAB on a route card no longer zooms the map. The only zoom in the create-order flow is when you select a ShipTo.
- **Create Order — trigger memory**: the system remembers which route you last expanded or clicked "+" on. Orders created from the map-pin tooltip or top-nav button land on that route as the next stop. No active route - goes to Unassigned.
- **Create Order — new orders appear on the map**: previously, orders created in-session were invisible to the map. Now the new pin appears immediately with its sequence badge and the route polyline redraws.
- **Create Order — toast wording fixed**: now reads "Order added to [Driver]'s route as stop N" when landing on a route. The old fallback wording only fires when the order actually goes to Unassigned.
- **ShipTo selection in modal**: zooms map to that ShipTo and flashes the hover tooltip for 2s then fades.
- **ShipTo dropdown sorted properly**: sorts by customer name first, then address — matches how the labels read.

### Map polish
- **Direction arrows on route lines**: now stay permanently visible on any route in the workspace. They re-render in the route's own color every time the polyline rebuilds.
- **Route line draw-in animation**: when a new stop is added, the polyline draws in over 1.4s with ease-out. Previously it snapped into place.
- **Smoother zoom after adding a stop**: map zoom-out is now 1.8s cubic ease-out (was abrupt 800ms snap). Pairs with the draw-in animation.
- **Route line contrast**: idle routes sit at 0.25 opacity; highlighted routes (hover / expanded / checked) pop at 1.0 with a 5px stroke.
- **Expanded routes always highlighted**: the route polyline goes full color whenever its card is expanded, not just on hover.
- **Route zoom-out 5-10% looser**: extra padding around the route bounds so stops have breathing room instead of being squished to edges.
- **Route line highlight + zoom after adding a stop**: polyline immediately shows full color; map zooms to fit the full route 500ms after submit; new order card flickers green.
- **Map-pin tooltip Create Order button**: restyled to match the dark secondary button style.
- **InsertOrderOverlay "+" tooltip**: replaced the black browser tooltip with the shadcn Tooltip component.
- **Drag reorder syncs to map**: dragging stops to reorder in the workspace now updates the sequence badges on map pins in real time.
- **New orders survive drag reorder**: orders created after a drag now appear correctly at the end of the route. Previously they vanished from the card.

### Truck Details
- **Truck Details sheet redesigned**: 1-Truck / Truck+1-Trailer / Truck+2-Trailers states with CAB connector and hook/gripper for trailers. New compartment grid (Cn header + max gal + product dots). Per-vehicle footer. Total Capacity row when 2+ vehicles. Expand-to-modal toggle in the header.

### Validation banner
- **Smarter runout copy**: banners now say "X will run out at this stop" at the first failing stop, and "X already ran out before this stop" for downstream stops. Previously all failing stops said the same thing.
- **Stop navigator**: when a route has 2+ failing stops, up/down chevron buttons let you step through each issue without scrolling manually.
- **View to navigate (2+ issues)**: banner now shows a ghost "View" button on expand instead of auto-scrolling. Click View to jump to the first issue and reveal the 1/N counter with chevrons.
- **Scroll fix**: chevron navigation now works regardless of how far the user has manually scrolled before clicking.

### Route Summary modal
- **Removed Assumed Starting Load**: gone from both the display row and the balance calculation. Stops now show real negative balances when no load order exists.
- **No-load-order banner**: indigo info banner above the table when a route has no load order — "No Load Order added yet. Add one to see product depletion per stop."

### Create Order drawer width
- Bumped 480 - 560 so "Assets & Products" + toggle + Refresh all fit on one line.

### Add Load Order modal
- Two new `200*DIESEL-ONROAD CLEAR` entries at Flint Hills - Johnny Morris terminal: 5,500 gal at 05:30 AM and 1,500 gal at 09:30 AM.
