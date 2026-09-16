# Dev Handoff — Routing Configuration (v1)

**Repo:** `hrisikesh-fp/route-builder`  
**Branch:** `main`  
**Locked:** 16 Sept 2026 (1:1 with Marcos). Build this. Do not add rows from the 11 Sept sheet or older Figma.

**Play (Figma + GitHub, same as prior handoffs):**

- This doc: https://github.com/hrisikesh-fp/route-builder/blob/main/HANDOFF-routing-config.md
- Proto: https://route-builder-routing-proto-v1.vercel.app → HM → **Routing Configuration**
- Isolated screen: https://route-builder-routing-proto-v1.vercel.app/dev/routing-config
- Local: `http://localhost:3005/dev/routing-config`
- Figma: https://www.figma.com/design/3zQcvo51p6v57bYKCOdIee/RB---Routing-v1?node-id=6960-244164
- ClickUp: [86eytv5hn](https://app.clickup.com/t/86eytv5hn) · design D1 [86eyrwxc2](https://app.clickup.com/t/86eyrwxc2)

Figma is the visual. This page + the proto are what to **plug in**. If Figma still shows downgradable copy, drag handles, or extra rows, ignore those — they were cut.

---

## What this is

Tenant-level screen: which dispatch facts routing respects. Hard only. No per-run overrides.

**Replaces Tenant Settings** (`/admin/settings`). Same profile-menu **Settings** gear. Label becomes **Routing Configuration**. Opens as a **full page** over Route Builder (title + close). Do **not** keep the Route Builder Admin chrome — no extra top nav, no “Tenant Settings” pill.

```
HM / profile
  → Routing Configuration   ← same gear icon as today’s Admin/Settings
  → full-page overlay       ← this screen
```

Portal to `document.body` at `zIndex: 2000` (nav is `z-[1200]`).

---

## Files in this proto (port these)

| File | What |
|---|---|
| `components/routing-config-panel.tsx` | The screen. Overlay + all seven sections |
| `lib/routing-config-data.ts` | Defaults, panel ids, road profiles, locked objectives |
| `components/map-header.tsx` | Profile row: **Routing Configuration**, Settings icon |
| `app/page.tsx` | Wires the overlay open from that row |

Wire into the real product’s admin/settings entry. Do not nest this inside `/admin`.

---

## Shell

Reuse existing admin form pieces: switch, input + addon, select, alert. Geist. Do **not** use lasso orange.

| Token | Value |
|---|---|
| Page | `#0A0A0A` |
| Measure | `800px` centered |
| Card / grid | `#1B1B1B`, `1px #282828`, radius `4` |
| Value well (under a switch) | `#111`, padding `16` |
| Title | `18/28/500` white |
| Section title | `16/24/500` `#E5E5E5` |
| Section desc | `14/20/400` `#A3A3A3` |
| Row label | `16/24/300` `#E5E5E5` |
| Row subtext | `14/20` `#737373` |
| Switch on | track `#E5E5E5`, knob `#0A0A0A` |
| Switch off | track `#333`, knob `#737373` |
| Switch **disabled** | `opacity: 0.4` on the track only — **not** the labels |
| Always-on banner | TriangleAlert `20`, text `#818cf8`, bg `#1F1F1F`, border `#282828`, `items-center` (one line) |
| Info alert | Info `20` `#A3A3A3`. One line: `items-center`. Wrap / title: `items-start` + icon `marginTop: 2` |
| Alert links | `/self_customer/assets`, `/self_customer/drivers` — inherit color, `font-weight: 600`, underline |
| Primary | Confirm and Save — `#E5E5E5` on `#171717` |
| Secondary | Discard — `#262626` / `#FAFAFA` |
| Sticky footer | same `#0A0A0A`, top border `#282828` |

```
┌ Routing Configuration                                          × ┐
│ Truck                    │ Truck                                 │
│ Driver                   │ The engine only assigns a truck if…   │
│ Order and Customer       │ ⚠ These are foundational rules…       │
│ Terminal and Supply      │ ┌ Compartment capacity          [on] ┐│
│ Route                    │ │ Product compatibility         [on] ││
│ Loading and Delivery     │ │ … toggles disabled                 ││
│ Optimization Goal        │ └────────────────────────────────────┘│
│                          │ ℹ … set on the Assets page            │
│ Unsaved changes          Discard              Confirm and Save   │
└──────────────────────────────────────────────────────────────────┘
```

Left nav `200px`. Active item: bg `#282828`, weight `500`, color `#E5E5E5`. Inactive: `#A3A3A3`.

---

## How to read a row

- **Constraint** — engine rule, on/off. Four Truck rows are on and **disabled**.
- **User param** — number or picker the tenant sets.
- **Feature** — not a taxonomy constraint. In v1: the road-network picker.

---

## 1. Truck — all four on, disabled

Section desc: *The engine only assigns a truck if the load fits, the products are allowed, and it can load at that terminal.*

Always-on banner: *These are foundational rules that stay on for creating optimized routes.*

| Label | Subtext | Type | Default | Engine |
|---|---|---|---|---|
| Compartment capacity | Orders are only assigned to a truck if they fit its compartments. | Constraint | on, disabled | compartment fit |
| Product compatibility | Only load products that can share a compartment, using comparable product categories. | Constraint | on, disabled | comparable **categories** only — not SKU, not downgradable |
| Compartment product approvals | Skip compartments that are not approved for the product category being loaded. | Constraint | on, disabled | skip unapproved compartments |
| Terminal authorization | Trucks only load at terminals they are approved for. | Constraint | on, disabled | `routing.restrictToAuthorizedTerminals` |

Footer alert: *Compartments, approved products, and authorized terminals are set on the truck or trailer in the **Assets** page.* Link → `/self_customer/assets`.

**Why disabled:** turning any of these off fails optimize. Terminal auth off times out on a large terminal list (every truck × every terminal). Soft / case-by-case off is later. Labels stay full contrast; only the switch is dimmed.

---

## 2. Driver

Section desc: *Who can run a route, and what they are allowed to carry.*

| Label | Subtext | Type | Default |
|---|---|---|---|
| Terminal carding | Drivers are only sent to terminals they are currently carded for. | Constraint | **off** |
| Driver hours | Routes are planned to finish inside the hours a driver has available. | Constraint | on |

Footer alert: *Cards and working hours are set on the **Driver** page. Expired cards are skipped for the date being planned.* Link → `/self_customer/drivers`.

**Out:** Product qualifications.

---

## 3. Order and Customer

Section desc: *When deliveries happen, and which orders come first.*

| Label | Subtext | Type | Default | Engine |
|---|---|---|---|---|
| Delivery windows | Deliveries are planned to arrive inside the window set on the order, ship-to, or customer. | Constraint | **off** | order / ship-to / customer window |
| Run-out protection | Tanks at risk of running dry are planned first. | Constraint | on | priority, not a promise |
| Urgent orders | Orders marked urgent are planned first. | Constraint | on | same |
| Linked deliveries | Deliveries that share a loading order stay on the same route. | Constraint | on | `routing.bindLinkedDeliveriesSameRoute` |

Footer alert: *Planning an order first does not guarantee it gets on a route. It can still be left out if no truck can carry it.*

Delivery windows stay in the UI. Default off — turning them on broke optimize.

---

## 4. Terminal and Supply

Section desc: *Where trucks can load, and how much product is available there.*

| Label | Subtext | Type | Default | Engine |
|---|---|---|---|---|
| Terminal product availability | Trucks are only sent to terminals that carry the product. | Constraint | on | `routing.filterTerminalsByProduct` |

Copy is **terminals only** this pass. Bulk plants use the same product-availability idea later — do not add a second toggle now.

**Out:** Bulk plant inventory.

---

## 5. Route

Section desc: *How a route is built, and which roads it can use.*

| Label | Subtext | Type | Default | Engine |
|---|---|---|---|---|
| Shift length | Routes are planned to finish within the shift. | Constraint + user param | on, **10** hours | `optimization.maxRouteDurationSeconds` (convert hours → seconds at the boundary) |
| Minimum deliveries per route | Avoid running a truck out for only a couple of drops. | Constraint + user param | on, **5** stops | `optimization.minJobsPerRoute` |
| Hazmat roads | Which road network routes are planned on | Feature (picker, not a toggle) | Hazmat approved roads | `routing.profilePreference` |

Min-deliveries help under the field: *A route can still go below this if it is the only way to serve an order.*

Hazmat field label: **Plan routes by**. Options: Hazmat approved roads / Balanced / Fastest / Shortest. Changing the picker **does** change the route. Anything other than Hazmat drops hazmat road rules. Help when Hazmat: *Roads that ban hazardous loads are avoided, along with restricted tunnels.* Help otherwise: *Hazmat restrictions do not apply on this network. Routes may use roads that ban hazardous loads.*

Vehicle type (truck vs small truck) is an **asset** field, not a row here.

**Out:** Product continuity / flush.

---

## 6. Loading and Delivery

Section desc: *How long the routing engine expects each stop to take.* No switches.

| Label | Help | Type | Default | Engine |
|---|---|---|---|---|
| Time per load | (under Loading) | User param | **15** min | duration on the load stop today |
| Pump rate | How fast product pumps off the truck at a stop. | User param | **50** gal/min | intended: volume ÷ rate. **Not inside the engine yet** — keep the field |
| Shortest delivery | No delivery is given less time than this, however small the drop. | User param | **5** min | floor |

Loading header: *Time spent picking up product at a terminal or bulk plant.*  
Delivery header: *Time spent at a customer stop dropping product off.*

Flush alert inside Delivery: *A 1,000 gal drop at 50 gal/min is planned as 20 minutes. Anything that works out shorter than 5 min is given 5 min.*

Do **not** add a preparation-time field this pass.

---

## 7. Optimization Goal

Section desc: *What the routing engine aims for when it has a choice between two workable plans.*

Card: **Optimize for** — *These two run together on every plan.*

Two **locked** rows. Numbered pills `1` / `2`. Two dropdowns each. No Add. No drag. No trash. No `min-max`.

| # | Type | Value | Engine |
|---|---|---|---|
| 1 | Minimize | Trucks used | `min vehicles` |
| 2 | Minimize | Finish time (last stop) | `min completion_time_last_stop` |

Alert title: **How do goals work?**  
Body: *Goals are applied together and weighed equally. Currently the above two goals pull against each other: fewer trucks means each one runs longer, and finishing earlier usually takes more trucks.*

The engine also tries to deliver all selected orders. That is not a row. There is no max-gallons row.

---

## Do not build

These were in the 11 Sept design and are **removed** so v1 matches the engine.

- Product qualifications
- Product continuity / flush
- Downgradable (copy and control)
- Bulk plant inventory
- Driver product / category field
- Add / remove / reorder objectives, drag handle, extra objective values
- Initial-inventory flag / import-from-truck
- Search / filter polish
- Soft vs hard dropdown
- Per-run or per-entity overrides
- Max gallons per shift
- Preparation time as a separate field
- Vehicle-type picker (lives on the asset)

---

## Test

- [ ] Profile gear opens **Routing Configuration**, not Tenant Settings / Admin chrome
- [ ] Full page, title + close only, sits above the map nav
- [ ] Seven nav items, one section at a time
- [ ] Truck: four switches on and disabled; labels not dimmed; always-on banner is one line, icon centered with text
- [ ] Compatibility copy says comparable **categories**, no downgradable
- [ ] Assets / Driver links go to `/self_customer/assets` and `/self_customer/drivers`, semibold underline
- [ ] Terminal carding default off; delivery windows default off
- [ ] No product qualifications, no flush, no bulk-plant inventory
- [ ] Shift 10 hours, min deliveries 5 stops, hazmat picker has four values
- [ ] Loading 15 / 50 / 5; example alert under Delivery
- [ ] Goals: two locked Minimize rows, no Add / drag / trash
- [ ] Discard / Confirm disabled until a change; unsaved row in the footer
