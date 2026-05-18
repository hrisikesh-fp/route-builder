# Route Builder — Design Journal

A running log of the **messy middle** of design decisions on this project. The *why* behind what got built, not the *what* (that's in `plans/`) or the *how to demo it* (that's in `DEMO_PLAYBOOK.md`).

## Why this file exists

Design decisions decay. Three weeks later, "we chose overlay instead of slot for the inline +" looks obvious in the code — but the back-and-forth that got us there (the wrong attempt, the user's correction, the "wait what about the single-card case") is the actual material for a case study or a portfolio essay. This file holds that back-and-forth.

## Cadence

**In-flight, not session-end.** Every time we make a non-obvious call, an entry gets appended immediately. End-of-session dumps compress and lose nuance.

## Entry format

```
### <YYYY-MM-DD HH:MM> · <short title>
Context: <what we were trying to do>
Considered: <2–4 alternatives weighed>
Decision: <what we went with>
Why: <reasoning, including the user's pushback or aha>
Tags: #ux #interaction #data-model #design-process
```

**Common tags** (use these so we can grep later for case-study writing):
- `#ux` — user experience choices
- `#interaction` — micro-interactions, hover states, transitions
- `#data-model` — how data is shaped
- `#information-architecture` — what goes where
- `#domain` — fuel-logistics / dispatcher domain insights
- `#design-process` — meta-notes about how we work
- `#future` — directions to revisit later

---

## 2026-05-15 — Iteration 1 (inline `+` + Create Order modal) + Iteration 2 kickoff

### 2026-05-15 · Inline `+` between order cards: slot vs overlay
Context: Add a quick way to insert a new order between existing cards on an expanded route, without going to the top-of-route "Add Load Order" button.
Considered:
- A reserved **slot** in the layout — a fixed-height row between cards that holds the `+`.
- An **absolute-positioned overlay** that sits above the cards in z-index, partially overlapping the card above and below. No layout shift.
Decision: Overlay.
Why: Hrisikesh pushed back on the slot idea — "we don't need the slot. it's difficult to always determine when to have the action and when not." A slot is a permanent layout commitment, which complicates the "only show on hover" rule and forces edge-case logic for empty routes vs. single-card routes vs. multi-card. The overlay keeps the layout sacred and lets visibility be a pure hover question.
Tags: `#ux #interaction`

### 2026-05-15 · Inline `+`: which adjacent card lights it up?
Context: Each gap between cards has one `+`. Should hovering either of the two cards bracketing the gap reveal it (both reveal the same `+`), or should only one of them?
Considered:
- Both adjacent cards reveal the `+` in the gap. Most reachable.
- Only the card **above** the gap reveals its own bottom-edge `+`. Crisp 1:1 rule.
Decision: Only the card above (the one the `+` is anchored to). One `+` visible at a time.
Why: With "both adjacent cards reveal", hovering any single card lit up TWO `+`s (the one above it AND the one below it). Hrisikesh flagged that: "i should only see one." A single hovered card = single revealed `+` is cleaner; the `+` itself keeps the gap active while you cross it, so reach stays fine.
Tags: `#ux #interaction`

### 2026-05-15 · Insert position: gap-clicked vs time-driven
Context: When the user clicks `+` between order N and order N+1, where does the new order land in the sequence?
Considered:
- Insert at the clicked gap. The visual gesture *is* the positional input.
- Append to end of the route. Simpler.
- Position is driven by the **Planned Time** the user enters in the modal — the clicked gap is just an opener, not a positional input.
Decision: Time-driven.
Why: Hrisikesh: "it will be added basis the planned time. so it can be added at any position." This matches how dispatchers think — they think in terms of *when* a delivery has to happen, and the route auto-orders by time. The clicked gap is then just an affordance for "I want to add an order around here-ish", and the modal does the right thing regardless of which `+` you clicked.
Tags: `#ux #data-model`

### 2026-05-15 · Customer vs ShipTo: 1-to-1 vs 1-to-many
Context: Existing mock data had names like "Mueller Construction", "Manor Equipment Rental" stored as `customerName` with a single address each (effectively 1 customer → 1 shipto). Hrisikesh wanted to model the real-world relationship.
Considered:
- Keep flat 1-to-1; rename only.
- Add `shipToName` to the data shape; treat existing names as shipto-level identifiers and introduce parent customer names. Display shipto name on order cards (that's what the dispatcher cares about — where the truck stops).
Decision: Added `shipToName`. Parent customer = "Walmart"; shipto = "Walmart-E", "Walmart-SF-X Street". Hutto Agricultural Cooperative and Mueller Construction Group each got multiple shiptos as a demo of 1-to-many.
Why: Hrisikesh: "1 customer has many shiptos. ultimately a delivery order is tied to a shipto. customer is just a means." The data model needs to reflect that even if the UI surface (an order card) shows mostly shipto-level info. The new field is optional and backwards-compatible so unrelated existing routes can stay on the old shape until we revisit them.
Tags: `#data-model #domain`

### 2026-05-15 · One shipto, multiple orders per day
Context: Hrisikesh dropped a domain observation: an agricultural or construction site can have *two* orders on the same day — morning and evening — because the assets (tanks) burn through fuel fast enough.
Considered: N/A — captured as domain context for future modelling.
Decision: Order data model already supports this (no constraint that one shipto = one order/day). For the current Create Order tooltip, we only handle shiptos-WITHOUT-orders-today; the "create *another* order for a shipto that already has one" variant is deferred.
Why: Worth knowing so we don't accidentally model away multi-orders-per-day when we touch this area later. Also: assets/tanks can overlap between same-day orders (same tank gets delivered to twice). Order ↔ Asset is many-to-many.
Tags: `#domain #data-model #future`

### 2026-05-15 · Multiple entry points to Create Order
Context: We started with one entry point (inline `+`). The dispatcher mental model isn't "I'm on this route, add an order" — sometimes it's "this shipto needs fuel, where should I route it?"
Considered:
- Single entry point (inline `+` only).
- Multiple entry points, all opening the same modal: inline `+`, shipto map-pin tooltip, filter-sheet shipto row.
- A separate Create Order page.
Decision: Multiple entry points, one modal. Inline `+` exists; shipto map-pin tooltip ships this iteration; filter-sheet row gesture deferred.
Why: Hrisikesh: "multiple entry points to order creation. got it?" Holistic capability — same outcome, multiple paths in based on where the dispatcher's attention happens to be.
Tags: `#ux #information-architecture`

### 2026-05-15 · ShipTo-no-order tooltip with "Create Order" CTA
Context: The existing map tooltip is for shiptos with orders today (shows volume, planned time, etc.). Shiptos without an order today need a different tooltip — one that surfaces "no order yet, want to add one?".
Considered:
- Same tooltip layout, just an empty state.
- A purpose-built compact panel: name + address header, threshold pills (red/yellow/green/blue), Last/Next Order timeline, primary "Create Order" CTA. (Per Figma `6059:153946`.)
Decision: Purpose-built panel.
Why: The shiptos-without-orders state is qualitatively different — there's nothing to summarize about today's delivery, so the panel pivots to "why might you want to order here?" (threshold counts) and "when's the rhythm?" (last/next). The CTA reads as the obvious next step.
Tags: `#ux #information-architecture`

### 2026-05-15 · Route focus while modal is open
Context: With Create Order as a centered modal, the route behind it gets dimmed by the backdrop. The dispatcher loses the context they were working in.
Considered:
- Leave it dimmed (status quo).
- Programmatically expand the route's card so it's at least open behind the modal, and pull the map zoom back one notch so the route is fully visible behind/around the modal.
- (Future direction) Replace modal with a side sheet so the route stays in full focus.
Decision: Expand the card + pull map zoom back (`maxZoom: 12` vs the default 13) this iteration. Side-sheet swap deferred as the next aha-moment iteration.
Why: Hrisikesh: "we gotta bring in the focus to the route. the same when i click on a route and it gets added to the workspace - it zooms in right? the same thing, or maybe we can tweak the zoom % maybe we do 80% of what happens today." The dim-and-forget pattern works for modal forms that don't relate to the canvas, but this one absolutely does. Phase C this iteration is also the foundation for the side-sheet swap later — same plumbing.
Tags: `#ux #interaction`

### 2026-05-15 · Future direction — modal to side sheet
Context: While planning Phase C (route focus during modal), the side-sheet question came up. The reason it's not in this iteration is timing (demo countdown), not conviction.
Considered:
- Keep modal forever.
- Side sheet on the right rail. Route stays fully visible, the new order *appears in the route* as the form is filled (or right when submit fires) — the dispatcher sees cause→effect on one canvas.
Decision: Side sheet is the direction. Not this iteration.
Why: Hrisikesh: "the aha moment the user creating and seeing the order getting included in the route - mama mia." The side-sheet swap is exactly that: form on one side, route on the other, real-time wiring between them. Phase C's route-focus logic is the half of it that already needs to exist for any tooltip-driven flow, so we ship that now and earn the side-sheet swap with less work later.
Tags: `#ux #interaction #future`

### 2026-05-15 · Design Journal as standard practice
Context: This file itself.
Considered:
- No journal — rely on git log + commit messages.
- Session-end dumps (write everything once per session).
- In-flight entries (write each decision as it lands).
Decision: In-flight entries, append-only, dated, tagged. Standardise across all design-engineering projects.
Why: Hrisikesh: "the chronology is imp, fascination — and if we have that we can always work on the storytelling." Decisions don't have to be written *well* in the moment — they just have to be written *down*. Storytelling (case studies, portfolio pieces) can come later from the raw log. Without the log, you can't get there. This is the "design diary" version of a developer's commit history — but where commits answer "what changed," journal entries answer "why I made the call."
Tags: `#design-process #future`

---

<!-- Append new entries below. Newest at the bottom of the current day; new days get a new ## header. -->

### 2026-05-15 · Auto-create route when an order is assigned to a driver with no route
Context: When the dispatcher creates an order from a shipto-pin (no originating route) and the modal lets them pick a driver, we may end up assigning that order to a driver who doesn't yet have a route for today. By the product definition, **any order assigned to a driver = a route**.
Considered: N/A — captured as a domain rule, not a UI decision yet.
Decision: Deferred. When implemented, the submit flow needs to:
1. Detect "no existing route for this driver today"
2. Create the route record server/state-side
3. Fire **two** success toasts in sequence — "Delivery Order created" + "Route created for {driver}"
Tags: `#data-model #domain #future`

### 2026-05-15 · Driver field in Create Order modal — context-dependent
Context: The Create Order modal currently has no Driver field. From the inline `+` (route entry), the driver is implicit. From the map-pin entry, there's no driver yet.
Considered:
- Same field shape both ways.
- **Different shapes per entry point**: from an inline-`+` flow the driver is shown read-only (it's a property of the originating route). From a shipto-pin flow it's a real select field (the dispatcher is committing the order to a specific driver, and that may auto-create a route per the rule above).
Decision: Deferred — go with the context-dependent shape when implemented. Read-only from route, select from shipto-pin.
Why: Same field, two different cognitive jobs: "this is whose route this belongs to" (display) vs. "this is who I'm assigning this order to" (decision).
Tags: `#ux #data-model #future`

### 2026-05-15 · Toast message: distinguish Load Order vs Delivery Order
Context: Toast message was hardcoded as "Load Order added to {driver}'s Route" — which was correct when the only flow firing it was the AddLoadOrderModal. With Create Order now firing the same callback, deliveries got the wrong label.
Considered:
- Keep one callback shape, branch the message string at the callsite.
- Pass the order type to the callback and branch at the toast level.
Decision: Use the existing generic `onShowMessage(string)` callback for Create Order submits with a delivery-specific message. Keep `onShowToast(driverName)` for the legacy "Load Order added" path so we don't regress the original flow.
Why: Quick fix without disturbing the AddLoadOrderModal contract. The longer-term move is to converge on a single toast API with structured arguments (type + driver + action) — flagged for later cleanup.
Tags: `#ux #future`

### 2026-05-15 · ShipTo tooltip: click-to-stick vs hover-with-bridge
Context: First implementation showed the tooltip on hover but closed it on mouseleave — so the cursor couldn't reach the "Create Order" button. To compensate, I added a click-to-stick behavior (click pin → map zooms + tooltip becomes sticky until the user clicks elsewhere).
Considered:
- Click-to-stick: explicit, but adds a mandatory click before any tooltip action.
- Hover-with-bridge: tooltip stays visible while the cursor is on EITHER the pin OR the tooltip; a short delay (~180ms) on mouseleave gives the cursor time to cross the gap. Standard tooltip-bridging pattern.
- Hover with no bridge: simplest but the user can't reach the CTA at all.
Decision: Hover-with-bridge. The click-to-zoom-and-stick variant is parked as an alternate flow to prototype later.
Why: Hrisikesh tried the click-to-stick version and pushed back: "the tooltip for these shiptos should only on hover. and when i hover over the tooltip, it should stay. so that i can click on create order." Two separate gestures (click pin, then click button) is one gesture too many when hover-bridging gets the same outcome in a more discoverable, lower-friction way. Click-to-zoom-on-shipto is a useful idea on its own — but it's a different feature ("focus the map on this shipto") that shouldn't be conflated with "create an order." We can pull it back later as a deliberate alt entry.
Tags: `#ux #interaction`
