# Plan: Route Builder - Truck Capacity Validation (Update)

---

## Context for Claude Code

You have already built the Route Builder prototype to a certain extent. This plan introduces the **real dataset, validation rules, and capacity logic** that should now be applied across all 5 routes. 

**What you need to do:**
1. Ingest the data and rules below.
2. Cross-check your existing implementation against these rules. If something you've already built contradicts what's specified here, **flag the discrepancy** so we can resolve it.
3. Where a design or visual treatment is described but you don't have a Figma reference or screenshot for it, **flag it as "Needs design input"** so I can provide the missing assets in the next prompt.
4. Where you have already implemented something that matches these rules, leave it as-is.

---

## Action Items (Do These First)

1. **Comment out or hide all Transfer-In (T-IN) and Transfer-Out (T-OUT) orders** across all routes. These are not in scope for this phase. Keep the code but disable them so they can be re-enabled later.
2. **Route 6:** Leave it exactly as-is. No changes. It's a separate flow (Add Load Order modal) being handled independently.
3. **Apply the dataset below** to Routes 1-5. Replace any placeholder data with the real data specified here.

---

## Global Rules

### When validation fires
- **No validation before truck selection.** Only show "Planned Qty" and "Truck: Not Selected."
- Validation fires immediately when a truck is assigned.
- Validation recalculates on: truck change, order add/remove, load order add/remove, stop resequencing.

### "No Load Orders added yet" prompt
- Shows whenever a route has only delivery orders and no load order.
- Independent of truck selection. Shows even if no truck is selected.
- Appears between the Hub row and the first delivery order.
- Blue/subtle treatment with "+ Add Load Order" button on the right.

### Collapsed card banner (label system)

Every collapsed route card with a truck assigned shows a banner at the bottom. The structure is always: **Label on the left, delta + ⓘ icon on the right.**

| State | Label (left) | Right side | Background |
|-------|-------------|------------|------------|
| Below capacity, all products fit | Below Truck Capacity | ↓ X gal ⓘ | Dark amber/gold tint |
| Total planned exceeds truck capacity | Exceeding Truck Capacity | ↑ X gal ⓘ | Dark red tint |
| Total is under but 1+ products exceed their available capacity | Exceeding Product Capacity | X gal ⓘ | Dark amber/gold tint |
| Multiple issues (product over + mid-route run-out) | ⚠ [Worst problem summary] + N more | ⓘ | Dark red tint |
| No truck selected | No banner | | |
| Truck selected but no compartment data | Truck details unavailable | | Subtle gray tint |

### Multi-issue collapsed cards (worst-problem-first)
When a route has multiple issues, the collapsed banner shows the most severe problem with a "+N more" suffix:
```
⚠ 87 Regular runs out at Stop 5 + 2 more
```
Severity hierarchy: mid-route run-out (L3) > product exceeding (L2) > total exceeding (L1).

### Expanded banner
When a route card is expanded and has issues, show a red-tinted banner below the route header. Each issue is a bullet point that names the product, the stop, and the customer:

```
⚠ 3 Items need your attention
  - 87 Regular will run out before Stop 5 (Del Valle ISD)
  - Diesel-Onroad Clear will run out before Stop 6 (Austin Bergstrom Fleet)
  - Diesel-Onroad Clear exceeds available truck capacity by 200 gal
```

Order bullets by severity: run-out issues first, then capacity exceedance.

### Inline warnings on order cards
When a product will run out before or at a specific delivery stop:
- That order card gets a red left border accent.
- A warning strip appears below the card content: `⚠ [Product Name] will run out before this stop`
- The warning strip has a red-tinted background.

If multiple products run out at the same stop, show one warning line per product.

### "+ Add Load Order" CTA (mid-route)
When a run-out is detected, show a prompt between the last stop that is still okay and the first stop where a product goes negative:
```
Add load orders          + Add Load Order
```
Blue/purple treatment. Same component style as "No Load Orders added yet" but positioned inline between order cards at the exact breaking point.

### Expanded message under truck selection row
After the truck row (e.g., "H-118 - 2019 Kenworth Tank Wagon"), show a one-line message:

| State | Message | Color |
|-------|---------|-------|
| Below capacity, all good | This truck can accommodate more orders. | Amber/gold |
| Exceeding (any) | Truck capacity is not sufficient for all orders. | Red |
| Multiple issues | Truck capacity is insufficient for 1 or more products. | Red |
| No fuel loaded (truck selected but no load order) | No fuel loaded. Add a load order to supply this route. | Red |

### Tooltip on ⓘ hover
Product-first table:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Product name (with color dot) | Planned qty | Available qty |

Rows where planned > available are highlighted in red text.
Below the table: "See compartment detail" link that expands to show compartment breakdown.

If this tooltip is not yet implemented, **flag it as "Needs implementation"** and skip for now. It can be added after the core flow works.

---

## Product Names

| Short Reference | Display Name (use in UI) | Category |
|----------------|-------------------------|----------|
| Diesel-Offroad Red | 200*DIESEL-OFFROAD RED | diesel |
| Diesel-Onroad Clear | 200*DIESEL-ONROAD CLEAR | diesel |
| 87 Regular | 87 OCT W/ 10% ETH | gas |
| ULSD Clear | ULSD CLEAR DIESEL | diesel |
| DEF Pkd | DEF PACKAGED | def |

---

## Route 1 - Mark Ruffalo

**Scenario:** Full demo flow. No truck initially. No load order initially. User adds load, then truck, then sees issues, adds mid-route load to resolve.

**Truck (user adds):** H-118 - 2019 Kenworth Tank Wagon

| Compartment | 200*DIESEL-OFFROAD RED | 200*DIESEL-ONROAD CLEAR | 87 OCT W/ 10% ETH |
|-------------|----------------------|------------------------|--------------------|
| C1 | 1,500 | 0 | 0 |
| C2 | 0 | 1,000 | 0 |
| C3 | 0 | 0 | 800 |
| C4 | 800 | 800 | 800 |
| C5 | 0 | 0 | 900 |

Product max capacities: Red = 2,300 | Clear = 1,800 | 87 Regular = 1,700

**Delivery Orders (6 total, Planned Qty: 4,600 gal):**

| # | Time | Customer | Red | Clear | 87 Reg | Total |
|---|------|---------|-----|-------|--------|-------|
| 1 | 7:15 AM | Mueller Construction | 100 | 700 | 200 | 1,000 |
| 2 | 8:00 AM | Manor Equipment Rental | 300 | 0 | 500 | 800 |
| 3 | 8:45 AM | Elgin Concrete | 0 | 400 | 600 | 1,000 |
| 4 | 9:30 AM | Bastrop Excavating | 200 | 400 | 0 | 600 |
| 5 | 10:15 AM | Del Valle ISD | 0 | 300 | 500 | 800 |
| 6 | 11:00 AM | Austin Bergstrom Fleet | 100 | 200 | 100 | 400 |

**Load Order (user adds first):** Flint Hills - Johnny Morris
- Time: 5:45 AM
- Red: 700, Clear: 1,800, 87 Reg: 1,700 | Total: 4,200

**Mid-Route Load (user adds after seeing warnings):** Flint Hills - Johnny Morris
- Inserted between Elgin (Stop 4) and Bastrop (becomes Stop 5 in new sequence)
- Red: 0, Clear: 200, 87 Reg: 400 | Total: 600

**Validation (after truck + first load, before mid-route load):**

- L1: 4,600 / 5,000 = Below by 400
- L2: Clear 2,000 / 1,800 = Over by 200. Gas 1,900 / 1,700 = Over by 200.
- L3 (running balance, truck starts at 0):

| # | Stop | Type | Red Bal | Clear Bal | Gas Bal |
|---|------|------|---------|-----------|---------|
| 0 | Start | | 0 | 0 | 0 |
| 1 | Flint Hills | Load | 700 | 1,800 | 1,700 |
| 2 | Mueller | Delivery | 600 | 1,100 | 1,500 |
| 3 | Manor | Delivery | 300 | 1,100 | 1,000 |
| 4 | Elgin | Delivery | 300 | 700 | 400 |
| 5 | Bastrop | Delivery | 100 | 300 | 400 |
| 6 | Del Valle | Delivery | 100 | 0 | **-100** |
| 7 | Bergstrom | Delivery | 0 | **-200** | **-200** |

Gas negative at Stop 6. Clear negative at Stop 7.

Collapsed: `⚠ 87 Regular runs out at Stop 5 + 2 more`

Expanded:
```
⚠ 3 Items need your attention
  - 87 OCT W/ 10% ETH will run out before Stop 6 (Del Valle ISD)
  - 200*DIESEL-ONROAD CLEAR will run out before Stop 7 (Austin Bergstrom Fleet)
  - 200*DIESEL-ONROAD CLEAR exceeds available truck capacity by 200 gal
```

Inline warnings: Del Valle card (Gas), Bergstrom card (Clear).
"+ Add Load Order" CTA: between Elgin and Bastrop (between stops 4 and 5).

**After mid-route load added (L3 balance):**

| # | Stop | Type | Red Bal | Clear Bal | Gas Bal |
|---|------|------|---------|-----------|---------|
| 0 | Start | | 0 | 0 | 0 |
| 1 | Flint Hills | Load | 700 | 1,800 | 1,700 |
| 2 | Mueller | Delivery | 600 | 1,100 | 1,500 |
| 3 | Manor | Delivery | 300 | 1,100 | 1,000 |
| 4 | Elgin | Delivery | 300 | 700 | 400 |
| 5 | Flint Hills | Load (mid) | 300 | 900 | 800 |
| 6 | Bastrop | Delivery | 100 | 500 | 800 |
| 7 | Del Valle | Delivery | 100 | 200 | 300 |
| 8 | Bergstrom | Delivery | 0 | 0 | 200 |

All positive. Gas retains 200 at end. L3 resolved.
Banner updates to: `Exceeding Product Capacity 200 gal ⓘ` (Clear still over at L2).

**Flow states:**

| Step | What happens | Banner state |
|------|-------------|-------------|
| 1 | 6 deliveries, no truck, no load | No banner. "No Load Orders added yet" prompt. |
| 2 | User adds load order (Flint Hills) | No banner (no truck yet). Load card at position 1. 7 Orders shown. |
| 3 | User selects truck (H-118) | ⚠ 87 Regular runs out at Stop 5 + 2 more. Inline warnings on stops 6+7. CTA between stops 4-5. |
| 4 | User adds mid-route load | Toast: "Load Order added to Mark's Route successfully." L3 resolved. Banner: Exceeding Product Capacity 200 gal. |

**Alternate flow (truck first, then load):**

| Step | What happens | Banner state |
|------|-------------|-------------|
| 1 | 6 deliveries, no truck, no load | No banner. "No Load Orders added yet" prompt. |
| 2 | User selects truck (H-118). No load order exists. | Message under truck row: "No fuel loaded. Add a load order to supply this route." Every stop would fail. "No Load Orders added yet" prompt remains visible. |
| 3 | User adds load order | Validation recalculates. Same as Step 3 in primary flow. |

---

## Route 2 - Dwayne Johnson

**Scenario:** Simple exceeding. Single product. Truck and load already assigned.

**Truck:** H-205 - 2021 Peterbilt Tanker

| Compartment | ULSD CLEAR DIESEL |
|-------------|------------------|
| C1 | 1,500 |
| C2 | 1,500 |
| C3 | 1,200 |

Product capacity: ULSD Clear = 4,200

**Load Order (pre-assigned):** Valero Taylor | Time: 5:30 AM | ULSD Clear: 4,200

**Delivery Orders (5 total, Planned Qty: 5,100 gal):**

| # | Time | Customer | ULSD Clear |
|---|------|---------|-----------|
| 1 | 6:30 AM | Georgetown Fuel Depot | 1,200 |
| 2 | 7:15 AM | Round Rock Storage | 900 |
| 3 | 8:00 AM | Cedar Park Warehouse | 1,100 |
| 4 | 8:45 AM | Pflugerville Fleet | 800 |
| 5 | 9:30 AM | Hutto Farms Co-op | 1,100 |

**Validation:**
- L1: 5,100 / 4,200 = Over by 900
- L3: Runs out at Stop 5 (Hutto). Balance: 4,200 > 3,000 > 2,100 > 1,000 > 200 > **-900**

Collapsed: `Exceeding Truck Capacity ↑ 900 gal ⓘ`
Expanded message: "Truck capacity is not sufficient for all orders."
Inline warning on Hutto card: `⚠ ULSD CLEAR DIESEL will run out before this stop`

---

## Route 3 - Jessica Harper

**Scenario:** Product exceeding with retain. Two products. Truck and load already assigned. Retain on board from previous shift.

**Truck:** H-310 - 2020 Freightliner Tanker

| Compartment | 200*DIESEL-OFFROAD RED | 200*DIESEL-ONROAD CLEAR |
|-------------|----------------------|------------------------|
| C1 | 1,200 | 0 |
| C2 | 0 | 1,000 |
| C3 | 800 | 800 |
| C4 | 800 | 0 |

Product capacities: Red = 2,800 | Clear = 1,800

**Retain from previous day:** Red: 300, Clear: 500

**Load Order (pre-assigned):** Flint Hills - Johnny Morris | Time: 5:45 AM | Red: 1,500, Clear: 1,300
After retain + load: Red = 1,800 on truck, Clear = 1,800 on truck.

**Delivery Orders (6 total, Planned Qty: 3,450 gal):**

| # | Time | Customer | Red | Clear | Total |
|---|------|---------|-----|-------|-------|
| 1 | 6:30 AM | Lakeway Fuel Stop | 200 | 350 | 550 |
| 2 | 7:15 AM | Bee Cave Builders Supply | 300 | 400 | 700 |
| 3 | 8:00 AM | Westlake Hills Auto | 0 | 450 | 450 |
| 4 | 8:45 AM | Lost Creek Equipment | 400 | 200 | 600 |
| 5 | 9:30 AM | Barton Creek Ranch | 350 | 0 | 350 |
| 6 | 10:15 AM | Circle C Fuel Co | 200 | 600 | 800 |

**Validation:**
- L1: 3,450 / 4,800 = Below by 1,350
- L2: Red 1,450 / 2,800 = fits. Clear 2,000 / 1,800 = Over by 200.
- L3: Clear goes negative at Stop 6 (Circle C). Red retains 350.

| # | Stop | Type | Red Bal | Clear Bal |
|---|------|------|---------|-----------|
| 0 | Start (retain) | | 300 | 500 |
| 1 | Flint Hills | Load | 1,800 | 1,800 |
| 2 | Lakeway | Delivery | 1,600 | 1,450 |
| 3 | Bee Cave | Delivery | 1,300 | 1,050 |
| 4 | Westlake | Delivery | 1,300 | 600 |
| 5 | Lost Creek | Delivery | 900 | 400 |
| 6 | Barton Creek | Delivery | 550 | 400 |
| 7 | Circle C | Delivery | 350 | **-200** |

Collapsed: `Exceeding Product Capacity 200 gal ⓘ`
Expanded: "200*DIESEL-ONROAD CLEAR exceeds available truck capacity by 200 gal"
Inline warning on Circle C card: `⚠ 200*DIESEL-ONROAD CLEAR will run out before this stop`

---

## Route 4 - Kyle Reese

**Scenario:** L2 + L3 combined. Two products. Both exceed at aggregate. Both run out at last stop.

**Truck:** H-442 - 2018 Mack Tanker

| Compartment | ULSD CLEAR DIESEL | 87 OCT W/ 10% ETH |
|-------------|------------------|-------------------|
| C1 | 800 | 0 |
| C2 | 0 | 700 |
| C3 | 600 | 600 |
| C4 | 0 | 500 |

Product capacities: ULSD = 1,400 | 87 Reg = 1,200

**Load Order (pre-assigned):** Georgetown Fuel Depot | Time: 5:30 AM | ULSD: 1,400, 87 Reg: 1,200

**Delivery Orders (5 total, Planned Qty: 2,850 gal):**

| # | Time | Customer | ULSD Clear | 87 Regular | Total |
|---|------|---------|-----------|-----------|-------|
| 1 | 6:30 AM | Taylor Auto Group | 300 | 150 | 450 |
| 2 | 7:15 AM | Hutto Farms Co-op | 400 | 800 | 1,200 |
| 3 | 8:00 AM | Round Rock Express Stadium | 200 | 100 | 300 |
| 4 | 8:45 AM | Georgetown Municipal | 350 | 0 | 350 |
| 5 | 9:30 AM | Jarrell Equipment | 350 | 200 | 550 |

**Validation:**
- L1: 2,850 / 2,600 = Over by 250
- L2: ULSD 1,600 / 1,400 = Over by 200. Gas 1,250 / 1,200 = Over by 50.
- L3: Both negative at Stop 5 (Jarrell). ULSD: -200. Gas: -50.

| # | Stop | Type | ULSD Bal | Gas Bal |
|---|------|------|----------|---------|
| 0 | Start | | 0 | 0 |
| 1 | Georgetown Fuel | Load | 1,400 | 1,200 |
| 2 | Taylor Auto | Delivery | 1,100 | 1,050 |
| 3 | Hutto Farms | Delivery | 700 | 250 |
| 4 | RR Express | Delivery | 500 | 150 |
| 5 | Georgetown Muni | Delivery | 150 | 150 |
| 6 | Jarrell | Delivery | **-200** | **-50** |

Collapsed: `⚠ 2 Items need your attention`
Expanded:
```
⚠ 2 Items need your attention
  - ULSD CLEAR DIESEL exceeds available truck capacity by 200 gal
  - 87 OCT W/ 10% ETH exceeds available truck capacity by 50 gal
```
Inline warnings on Jarrell card: both products.

---

## Route 5 - Forrest Gump

**Scenario:** Clean state. Everything fits. Single product.

**Truck:** H-556 - 2022 International Tanker

| Compartment | ULSD CLEAR DIESEL |
|-------------|------------------|
| C1 | 2,000 |
| C2 | 1,800 |
| C3 | 1,200 |

Product capacity: ULSD Clear = 5,000

**Load Order (pre-assigned):** Flint Hills - Johnny Morris | Time: 5:45 AM | ULSD Clear: 3,500

**Delivery Orders (4 total, Planned Qty: 3,500 gal):**

| # | Time | Customer | ULSD Clear |
|---|------|---------|-----------|
| 1 | 7:00 AM | Lockhart Propane | 800 |
| 2 | 7:45 AM | San Marcos Fleet Services | 1,000 |
| 3 | 8:30 AM | Kyle Industrial Supply | 900 |
| 4 | 9:15 AM | Buda Equipment Rental | 800 |

**Validation:**
- L1: 3,500 / 5,000 = Below by 1,500
- L2: Single product, same as L1
- L3: All positive. Ends at 0.

| # | Stop | Type | ULSD Bal |
|---|------|------|----------|
| 0 | Start | | 0 |
| 1 | Flint Hills | Load | 3,500 |
| 2 | Lockhart | Delivery | 2,700 |
| 3 | San Marcos | Delivery | 1,700 |
| 4 | Kyle Industrial | Delivery | 800 |
| 5 | Buda Equipment | Delivery | 0 |

Collapsed: `Below Truck Capacity ↓ 1,500 gal ⓘ`
Expanded: "This truck can accommodate more orders."

---

## Route 6
No changes. Leave as-is. This route is part of a separate design flow (Add Load Order modal) being handled independently.

---

## Not in Scope (Do Not Build)
- Transfer orders (T-IN, T-OUT) - comment out existing implementation
- Product incompatibility detection (truck can't carry a product)
- Truck dropdown filtering by product compatibility
- Threshold treatment for small differences (under 10 gal)
- Compartment-level allocation logic
- Add Load Order modal (Route 6 flow)

---

## Flag These If Missing
If any of the following are not yet implemented, flag them as "Needs implementation" or "Needs design input" so I can provide direction:

- Tooltip on ⓘ icon (per-product capacity table)
- "See compartment detail" expansion inside tooltip
- Inline warning strips on order cards (red-tinted, product-specific copy)
- "+ Add Load Order" CTA between stops (mid-route)
- Toast notification after load order is added
- Expanded banner with bullet-pointed issues
- Worst-problem-first collapsed banner variant
- Retain/starting inventory support (Route 3 starts with fuel on truck)
- "No fuel loaded" message when truck is selected but no load order exists
