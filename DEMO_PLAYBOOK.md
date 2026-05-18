# Route Builder — Demo Playbook

Step-by-step scenarios for showing Route Builder live. Each scenario describes the **starting state** (what's seeded in `lib/mock-data.ts`) and the **live actions** (what you add on stage via the Create Order modal) to reach the full picture.

Append new scenarios at the bottom. Keep older ones intact — they double as regression checks.

---

## Conventions

- **Customer** = the parent account (e.g., "Mueller Construction Group", "Walmart"). 1 customer → many shiptos.
- **ShipTo** = the specific delivery location for that customer (e.g., "Mueller - Mueller Blvd Yard"). Shown prominently on each order card.
- Order cards display `shipToName ?? customerName` — so what you see on the card is the shipto, not the parent.
- In the Create Order modal, the Customer dropdown shows the parent; the ShipTo dropdown is filtered to that customer's locations once chosen (or shows all shiptos prefixed by their customer when no customer is picked yet).
- Times in this playbook use the mock-data display times (`MOCK_STOP_TIMES`): 5:45 / 06:30 / 7:15 / 8:00 / 8:45 / 9:30 AM.

The Planned Date field can be left at the browser default — only the time-of-day matters for sequencing.

---

## Scenario 1 — Mark Ruffalo's route (route-1)

**Why this scenario:** simplest case. One product (Diesel CLR), one truck, no capacity drama. Start with 2 deliveries, build out to 6 to demonstrate inserting in the middle as well as appending.

### Starting state (seeded)

| Seq | ShipTo | Customer | Time | Qty |
|---|---|---|---|---|
| 1 | Mueller - Mueller Blvd Yard | Mueller Construction Group | 5:45 AM | 1,000 |
| 3 | Elgin Concrete - US-290 Plant | Elgin Concrete Industries | 7:15 AM | 1,000 |

The gap between seq 1 and seq 3 is intentional — it sets up the "insert into the middle" demo.

### Live actions — add these one by one

| Step | Click `+` below… | Customer (pick first) | ShipTo (then pick) | Planned Time | Quantity |
|---|---|---|---|---|---|
| 1 | Mueller (the first card) | Manor Equipment Group | Manor Equipment - US-290 Yard | **06:30 AM** | 800 |
| 2 | Elgin (last card) | Bastrop Earthworks | Bastrop Earthworks - Hwy 71 Yard | **08:00 AM** | 600 |
| 3 | The newly-added Bastrop card | Del Valle ISD | DVISD - Transportation Depot | **08:45 AM** | 800 |
| 4 | The newly-added Del Valle card | ABIA Fleet Services | ABIA - Presidential Hangar | **09:30 AM** | 400 |

**Talking points:**
- Step 1 shows the *insert into the middle* power — Manor's 06:30 AM lands between Mueller (5:45) and Elgin (7:15) automatically, just from the picked time.
- Steps 2-4 show how the same flow handles "append to end" — the dispatcher doesn't have to think about position, they think about time.

---

## Scenario 2 — Dwayne Johnson's route (route-2): load-first

**Why this scenario:** real dispatcher flow when the truck has a fixed pickup terminal. Start with only the load order seeded — every delivery is added live.

### Starting state (seeded)

| Seq | ShipTo | Customer | Type | Time | Qty |
|---|---|---|---|---|---|
| 1 | Valero - Taylor Terminal | Valero Energy | **L (Load)** | — | 4,200 (ULSD) |

### Live actions — add 5 deliveries

| Step | Customer | ShipTo | Planned Time | Quantity |
|---|---|---|---|---|
| 1 | Georgetown Fuel Holdings | GFH - Industrial Depot | **06:30 AM** | 1,200 |
| 2 | Round Rock Storage Co. | RRS - Palm Valley Warehouse | **07:15 AM** | 900 |
| 3 | Cedar Park Logistics | CPL - Whitestone DC | **08:00 AM** | 1,100 |
| 4 | Pflugerville Fleet Services | PFS - FM 685 Depot | **08:45 AM** | 800 |
| 5 | Hutto Agricultural Cooperative | Hutto Farms - Ed Schmidt | **09:30 AM** | 1,100 |

**Talking points:**
- Start by pointing out that this route has only a load order — no deliveries yet. This is what a dispatcher sees in the morning after the supply side is locked in.
- When you reach the Hutto step, hit the Customer dropdown — you'll see "Hutto Agricultural Cooperative" has **3 shiptos** (Ed Schmidt, North Field, Equipment Yard). That's the real 1-many customer→shipto relationship. Pick Ed Schmidt for this step.

---

## 1-many examples you can show in the modal

These customers have multiple shiptos in the parked-shiptos list — open the modal on any route and use them to demonstrate the parent → location structure:

- **Mueller Construction Group** → Mueller - Mueller Blvd Yard (on Route 1) · Mueller - Northeast Project Site (parked)
- **Hutto Agricultural Cooperative** → Hutto Farms - Ed Schmidt · Hutto Farms - North Field · Hutto Farms - Equipment Yard

---

## Known limitations of the current prototype (don't get blindsided)

- The tank table inside the modal is mock — 3 fixed rows (Tank 115 / Tank Def / Tank 115). Quantities are real (sum becomes the order's `volume`), but the tank metadata (TM Inventory, Capacity, Ullage) is decorative for now.
- "Mark as Urgent / Recurrence / Same Day" checkboxes don't persist anything yet.
- "Add Asset" and the refresh button next to it are visual only.
- New orders show on the workspace sheet but don't yet render as pins on the map (the map only reads the load-order additions for now).
- Routes 3-6 still use the old single-name pattern (customerName is the shipto-style name; no `shipToName` field). We can roll the parent/shipto split into the rest of the data when needed.
- Asset-level modelling not in scope yet — a shipto can have multiple orders/day, an order can have 1..N assets, and assets can overlap between same-day orders (e.g., agricultural / construction sites that consume fast enough to need morning + evening drops). Captured for future modelling.

---

## How to use this file

1. Before a demo, skim the scenario(s) you want to walk. Note the customer + shipto names so you don't fumble in the dropdown search.
2. Mid-demo, keep this open in a side window if your memory needs a nudge.
3. After a demo, if you discovered a new scenario worth practicing, **append it as Scenario N below** — don't edit older ones.
