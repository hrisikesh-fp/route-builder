# Routing Configuration v1 — design spec for FE

**Repo:** `hrisikesh-fp/route-builder`  
**Branch:** `feat/routing-config-v1-lock`  
**Play:** https://route-builder-routing-proto-v1.vercel.app → HM → **Routing Config**  
**ClickUp:** [86eytv5hn](https://app.clickup.com/t/8447923/86eytv5hn)  
**Figma file:** RB / Routing v1 (`3zQcvo51p6v57bYKCOdIee`)

This is the dispatcher-facing tenant screen. Admin panel layout: side nav left, one section at a time right. Hard constraints only. Tenant-level only.

Portal the screen to `document.body` at `zIndex: 2000`. Shell: `#0A0A0A`, header + sticky footer, measure `800px`, Geist. Primary `#E5E5E5`. Do not use lasso orange.

---

## In v1

### Truck
| Control | Kind | Default | Engine / source |
|---|---|---|---|
| Compartment capacity | on/off | on | order volume must fit compartment |
| Product compatibility | on/off | on | comparable / downgradable groups |
| Compartment product approvals | on/off | on | skip unapproved compartments |
| Terminal authorization | on/off | on | `routing.restrictToAuthorizedTerminals` |

Alert: *Compartments, approved products and authorized terminals are set on the Asset page.*

### Driver
| Control | Kind | Default |
|---|---|---|
| Terminal carding | on/off | on |
| Product qualifications | on/off | on |
| Driver hours | on/off | on |

Alert: *Cards, qualifications and working hours are set on the Driver page. Expired cards are skipped for the date being planned.*

### Order and Customer
| Control | Kind | Default | Engine |
|---|---|---|---|
| Delivery windows | on/off | on | order time window |
| Run-out protection | on/off | on | tanks at risk first |
| Urgent orders | on/off | on | urgent first |
| Linked deliveries | on/off | on | `routing.bindLinkedDeliveriesSameRoute` |

Alert: *Planning an order first does not guarantee it gets on a route.*

### Terminal and Supply
| Control | Kind | Default | Engine |
|---|---|---|---|
| Terminal product availability | on/off | on | `routing.filterTerminalsByProduct` |

Alert: *Terminals are commercial entities and hence treated as having unlimited supply.*

**Out:** Bulk plant inventory. Inventory and allocation are not in this release. Do not show a toggle the engine will not honour.

### Route
| Control | Kind | Default | Engine |
|---|---|---|---|
| Shift length | on/off + hours | on, 10 hours | `optimization.maxRouteDurationSeconds` (convert at the boundary) |
| Product continuity | on/off | on | keep product in a compartment between loads |
| Minimum deliveries per route | on/off + stops | on, 5 stops | `optimization.minJobsPerRoute` |
| Hazmat roads | picker, **not** a toggle | Hazmat approved roads | `routing.profilePreference` |

Picker values: Hazmat approved roads / Balanced / Fastest / Shortest. Picking anything other than Hazmat silently drops hazmat road restrictions.

### Loading and Delivery
Always on. No switches.

| Control | Kind | Default | Engine |
|---|---|---|---|
| Time per load | minutes | 15 | load stop time |
| Pump rate | gal/min | 50 | delivery duration = volume ÷ rate |
| Shortest delivery | minutes | 5 | floor |

Delivery time is volume ÷ pump rate, or 5 min, whichever is longer. There is no fixed stop time.

### Optimization Goal
Read-only. Matches live UAT / production. **Do not add, remove, reorder, or change type.**

| # | Type | Value | Engine |
|---|---|---|---|
| 1 | Minimize | Trucks used | `min vehicles` |
| 2 | Minimize | Finish time at last drop | `min completion_time_last_stop` |

No **Add objective**. No type dropdown. No drag handle.

Both run on every plan. The engine weighs them equally. Fewer trucks usually means a later finish.

---

## Out of v1 (do not build)

- Search / filter
- Soft constraints
- Per-run overrides
- Bulk plant inventory
- Fixed time per delivery
- Add / remove / reorder objectives
- Type `min-max` (“Minimize the maximum”) in this UI — engine has it, production does not use it
- Extra objective values (`completion_time`, `route_duration`, `transport_time`) as picker options
- Max gallons per shift — no `max` type in the engine

---

## Files in this proto

- `components/routing-config-panel.tsx`
- `lib/routing-config-data.ts`
- `components/map-header.tsx` — **Routing Config** in the HM menu
- `app/page.tsx` — overlay wiring
