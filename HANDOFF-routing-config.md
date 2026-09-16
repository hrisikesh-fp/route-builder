# Routing Configuration v1 — design spec for FE

**Locked 16 Sept** after a 1:1 with Marcos. Build this. Do not re-open the sheet or the 11 Sept Figma for extra rows.

**Repo:** `hrisikesh-fp/route-builder`  
**Play:** `/dev/routing-config` locally, or https://route-builder-routing-proto-v1.vercel.app → HM → **Routing Configuration** (same Settings gear as today)  
**ClickUp:** [86eytv5hn](https://app.clickup.com/t/8447923/86eytv5hn) · design D1 [86eyrwxc2](https://app.clickup.com/t/8447923/86eyrwxc2)  
**Living spec:** `1-projects/route-builder/docs/routing/constraints-v1.md`

**Entry in product.** This replaces **Tenant Settings** (`/admin/settings`). Same profile-menu icon. Opens as a **full page** over Route Builder — header is only “Routing Configuration” + close. Do **not** keep the Route Builder Admin chrome (no extra top nav, no “Tenant Settings” pill).

Portal the screen to `document.body` at `zIndex: 2000`. Shell: `#0A0A0A`, header + sticky footer, measure `800px`, Geist. Primary `#E5E5E5`. Do not use lasso orange.

Facts live in dispatch. This screen is which of those facts routing respects. Tenant-level only. Hard only.

---

## What changed on 16 Sept (Marcos)

| Change | Do this |
|---|---|
| Product compatibility copy | Comparable **product-category** groups only. Drop “downgradable” — flag exists, not deployed, v2 |
| Product qualifications | **Delete** the row. Engine has no support |
| Product continuity / flush | **Delete** the row. Level 2 |
| All four Truck switches | **On and disabled.** Visible so the dispatcher can see the rules; not flippable. Turning any off would fail optimize. Soft / case-by-case off is later |
| Terminal authorization | Always on for the same reason. Off would test every terminal × every truck and times out |
| Delivery windows | Keep the toggle. **Default off.** Dylan turning it on in UAT broke optimize |
| Extra objectives | No Add. No type dropdown. Two read-only `min` rows |
| Loading / delivery numbers | Keep 15 min / 50 gal/min / 5 min floor. Pump rate is not inside the engine yet; do not invent preparation-time fields this pass |
| Hazmat picker | Keep all four. Changing the picker **does** change the route. Balanced / Fastest / Shortest exist on the map server; they just do not apply hazmat |

---

## In v1

### Truck
All four are **constraints**, on, **toggle disabled**. Labels stay full contrast; only the switch is dimmed.

| Control | Type | Kind | Default | Engine / source |
|---|---|---|---|---|
| Compartment capacity | Constraint | on, disabled | on | order volume must fit compartment |
| Product compatibility | Constraint | on, disabled | on | comparable **product-category** groups (not SKU-level; not downgradable) |
| Compartment product approvals | Constraint | on, disabled | on | skip unapproved compartments (categories on the asset) |
| Terminal authorization | Constraint | on, disabled | on | `routing.restrictToAuthorizedTerminals` |

Alert: *Compartments, approved products and authorized terminals are set on the Asset page.*

Bulk-plant authorization is the same list once a plant exists as a warehouse. Do not add a second toggle.

### Driver
| Control | Type | Kind | Default |
|---|---|---|---|
| Terminal carding | Constraint | on/off | **off** |
| Driver hours | Constraint | on/off | on |

**Out:** Product qualifications.

Alert: *Cards and working hours are set on the Driver page. Expired cards are skipped for the date being planned.*

### Order and Customer
| Control | Kind | Default | Engine |
|---|---|---|---|
| Delivery windows | on/off | **off** | order time window. Test on product demo before flipping on |
| Run-out protection | on/off | on | tanks at risk first (soft later; still a toggle) |
| Urgent orders | on/off | on | urgent first |
| Linked deliveries | on/off | on | `routing.bindLinkedDeliveriesSameRoute` |

Alert: *Planning an order first does not guarantee it gets on a route.*

### Terminal and Supply
| Control | Kind | Default | Engine |
|---|---|---|---|
| Terminal product availability | on/off | on | `routing.filterTerminalsByProduct` |

Alert: *Terminals are commercial entities and hence treated as having unlimited supply.*

**Out:** Bulk plant inventory.

### Route
| Control | Kind | Default | Engine |
|---|---|---|---|
| Shift length | on/off + hours | on, 10 hours | `optimization.maxRouteDurationSeconds` (convert at the boundary) |
| Minimum deliveries per route | on/off + stops | on, 5 stops | `optimization.minJobsPerRoute` |
| Hazmat roads | picker, **not** a toggle | Hazmat approved roads | `routing.profilePreference` |

**Out:** Product continuity / keep compartment same between loads / flush time.

Picker values: Hazmat approved roads / Balanced / Fastest / Shortest. Picking anything other than Hazmat drops hazmat road restrictions. Vehicle type (truck vs small truck) is an **asset** field, not a row here. Unset vehicle type falls back to small-truck hazmat.

### Loading and Delivery
Always on. No switches. Same numbers Dylan documented.

| Control | Kind | Default | Engine |
|---|---|---|---|
| Time per load | minutes | 15 | duration sent on the load stop today |
| Pump rate | gal/min | 50 | intended: delivery duration = volume ÷ rate. **Not yet inside the engine** — keep the control; do not promise it changes the run until Marcos/Dylan wire it |
| Shortest delivery | minutes | 5 | floor |

Do **not** add preparation time vs duration this pass. That is a v2 / backend fix (Marcos: terminals currently send duration, should send preparation time once).

### Optimization Goal
Read-only. Matches live UAT / production. **Do not add, remove, reorder, or change type.**

| # | Type | Value | Engine |
|---|---|---|---|
| 1 | Minimize | Trucks used | `min vehicles` |
| 2 | Minimize | Finish time (last stop) | `min completion_time_last_stop` |

No **Add objective**. No type dropdown. No drag handle. No `min-max`.

Both run on every plan. The engine weighs them equally. Fewer trucks usually means a later finish.

---

## Out of v1 (do not build)

- Product qualifications
- Product continuity / flush
- Downgradable groups (copy and control)
- Initial-inventory flag / import-from-truck / pre-optimize retain
- Search / filter polish
- Soft vs hard dropdown (v2 framing — NoCo as reference)
- Per-run overrides
- Per-entity (ship-to) overrides — exist in NoCo routing plans, not this screen
- Bulk plant inventory
- Preparation time as a separate field
- Pump rate actually driving duration (control stays; engine work is v2)
- Add / remove / reorder objectives
- Type `min-max`
- Extra objective values (`completion_time`, `route_duration`, `transport_time`) as picker options
- Max gallons per shift
- Vehicle-type picker (truck / small truck) — lives on the asset

---

## Files in this proto

- `components/routing-config-panel.tsx`
- `lib/routing-config-data.ts`
- `components/map-header.tsx` — **Routing Configuration** replaces Settings (same gear icon)
- `app/page.tsx` — overlay wiring
- `app/dev/routing-config/page.tsx` — isolated preview
