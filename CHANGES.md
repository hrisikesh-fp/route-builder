# Route Builder — Daily Changes

> Running log of user-visible changes shipped each day. End-of-day: copy the latest dated section into your stakeholder update. Keep entries short and outcome-focused ("did X so users can now Y") — engineering notes belong in commit messages, not here.

---

## 2026-05-22

- **Map polish — arrows + draw animation + smoother zoom**:
  - Direction arrows now stay permanently visible on any route that's in the workspace (they used to disappear or fall out of sync when a stop was added). They re-render in the route's own color every time the polyline rebuilds.
  - When a new stop is added to a route, the polyline now "draws in" with a 1.4s ease-out animation (line-dasharray growing from start to end). Previously the new polyline snapped into place silently.
  - Map zoom-out after submit is now 1.8s with a cubic ease-out, replacing the previous abrupt 800ms snap. Camera glides; pairs nicely with the draw-in animation.

- **Route line highlight + zoom after adding a stop** *(planned, implementing next)*:
  - Route polyline now immediately shows in full color after a new stop is created (was staying grey until close/reopen)
  - Map zooms out to fit the full route (all stops including the new one) after submit — 500ms after workspace pan settles
  - New order card flickers green (same as load orders) and the workspace scrolls to reveal it

- **Create Order — trigger memory**: the system now remembers which route you're working on (the route card you last expanded or clicked "+" on). Creating an order from the map-pin tooltip or top-nav "+ Create Order" now drops the order into that route as the next stop, instead of always going to Unassigned. With no active route → still Unassigned.
- **Create Order — new orders now show up on the map**: previously, orders created in-session were invisible to the map (no pin, no route-line update). Now the map merges in newly-added orders so the new pin appears immediately with its sequence badge and the route polyline redraws including the new stop.
- **Create Order — toast wording fixed**: now reads "Order added to [Driver]'s route as stop N" when an order lands on a route. The old "added to Unassigned, move it from there" only fires when the order actually goes to Unassigned.
- **Truck Details sheet**: redesigned to match Figma — added 1-Truck / Truck+1-Trailer / Truck+2-Trailers states with CAB connector for trucks and hook+gripper for trailers, new compartment grid (Cn header + value + product dots), per-vehicle footer ("N Compartments • Products …"), and a Total Capacity row that only renders when 2+ vehicles. Added expand-to-modal toggle in the header to morph the anchored sheet into a centered modal.
- **Map-pin tooltip Create Order button**: restyled to shadcn secondary variant (`#262626` bg, `#FAFAFA` text, hover `#333333`).
- **Create Order drawer width**: bumped 480 → 560 so "Assets & Products" + Delivery/Extraction toggle + Refresh all sit on one line; map controls right-offset now 624px to keep the 12px gap.

## 2026-05-21

- **Top nav — "+ Create Order" button**: 3rd entry point added to the top nav (matches the existing date selector outlined style, 36px). Hover: bg `rgba(255,255,255,0.04)` + border `#404040`. Disabled (`opacity: 0.4`) while any Create Order modal/drawer is already open.
- **Create Order modal redesign**: Modal 1 width 960 → 800. "Mark Order As Urgent" checkbox moved into the header (renamed from "Mark As Urgent"). Delivery/Extraction toggle moved out of the header into the Assets & Products section header. Renamed "Delivery Order" section → "Assets & Products". "+ Add Asset" button removed; only Refresh remains.
- **Create Order — removed map zoom on "+ FAB"**: previously, clicking the "+" FAB on a route card zoomed the map into the route. Removed. The only zoom in the create-order flow now is when you select a ShipTo in the modal dropdown.
- **Create Order — fixed dropdown positioning**: Customer / ShipTo / DatePicker / TimePicker dropdowns were opening in the wrong place and needed 2-3 clicks. Root cause was `will-change: transform` on the modal panel creating a containing block for `position: fixed` children. Removed.
- **Modal 3 — Create Order side sheet**: new drawer variant pinned to the right of the collapsed workspace tab. Workspace auto-collapses when the drawer opens. Header has an expand/collapse button to morph between drawer and centered modal.
- **Settings**: added Modal 3 as a 3rd radio option alongside Modal 1 / Modal 2; persisted to localStorage.
- **Emil-style entrance/exit animations**: drawer slides in 320ms / out 200ms from right; centered modal scales 0.96 → 1 with backdrop fade; map controls glide between right-offsets; expand/collapse arrow on the collapsed tab fades out instead of vanishing. Easing: `cubic-bezier(0.32, 0.72, 0, 1)`.
- **ShipTo selection in modal**: zooms map to that ShipTo + flashes the hover tooltip for 2s then fades.
