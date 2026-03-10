# Workspace Sheet — Design Spec & Build Plan

> **Source of truth:** Figma nodes 2631-121564 (collapsed), 2631-115258 (expanded), 2633-225144 (hover state)
> **File:** `components/lasso-workspace-sheet.tsx`
> **Status:** Needs full redesign — current is rough v0 iteration

---

## 1. Overview

The Workspace Sheet is a **560px right-side panel** that appears when:
- User activates lasso and selects orders/routes on the map
- User clicks a route line on the map directly

It has two main views (tabs):
1. **Driver Routes** — list of collapsed/expandable route cards
2. **Unassigned Orders** — individual unassigned order cards

---

## 2. Panel Structure

```
┌─────────────────────────────────────┐
│  HEADER (sticky)                    │
│  "N Orders selected"        [X]     │
├─────────────────────────────────────┤
│  TABS (sticky)                      │
│  [Driver Routes (N)] [Unassigned (N)]│
├─────────────────────────────────────┤
│  SELECT ALL ROW                     │
│  [☐] Select All Routes              │
├─────────────────────────────────────┤
│  ROUTE CARDS (scrollable)           │
│  [☐][›] Route Card 1               │
│  [☐][›] Route Card 2               │
│  ...                                │
├─────────────────────────────────────┤
│  FOOTER (sticky)                    │
│  [Publish Routes ────────────────]  │
└─────────────────────────────────────┘
```

---

## 3. Panel Dimensions & Styles

| Property | Value |
|----------|-------|
| Width | 560px |
| Background | `#111111` |
| Position | fixed right-0, top-[68px], bottom-0 |
| Border left | `1px solid #282828` |
| Z-index | 10000 |

---

## 4. Header

| Property | Value |
|----------|-------|
| Padding | `20px 24px 12px` |
| Layout | row, space-between, align center |
| Title text | "N Orders selected" |
| Title font | Geist 18px, weight 500, `#FFFFFF` |
| Close button | 24×24px X icon, `#737373`, hover `#FFFFFF` |

---

## 5. Tabs

| Property | Value |
|----------|-------|
| Container padding | `0px 24px` |
| Tab bar height | 56px |
| Tab bar border-bottom | `1px solid #333333` |
| Tab gap | 4px |
| Active tab | Geist 16px w500 `#FFFFFF` + 2px solid white underline at bottom |
| Inactive tab | Geist 16px w400 `#A3A3A3`, border-radius 8px |
| Tab padding | 12px |

---

## 6. Select All Row

| Property | Value |
|----------|-------|
| Padding | `4px 0px 0px` (inside scroll area) |
| Layout | row, gap 10px, align center |
| Checkbox | 16×16px, bg transparent, border `1px solid #333333`, radius 4px |
| Label | Geist 16px w300 (light!), `#E5E5E5` |
| Label text | "Select All Routes" |

---

## 7. Route Card Row (Collapsed)

Each route has this outer row structure (512px total width):

```
[Checkbox+Chevron 32px] [Route Card 460px]
```

### 7a. Checkbox + Chevron container
| Property | Value |
|----------|-------|
| Layout | row, gap 4px, align center |
| Checkbox | 16×16px (same as select all) |
| Chevron | 24×24px, filled, points right when collapsed, down when expanded |
| Chevron padding | 6px (so effective hit area 24×24) |

### 7b. Route Card (collapsed)

| Property | Value |
|----------|-------|
| Width | 460px fixed |
| Background | `#1F1F1F` (default), `#333333` on hover |
| Border-radius | `4px 4px 0px 4px` |
| Padding | `16px 16px 12px 20px` |
| Shadow | `0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)` |
| Layout | row, gap 12px |
| Transition | bg color 150ms ease |

**Color bar (absolute):**
| Property | Value |
|----------|-------|
| Position | absolute, left 0, top 0, bottom 0 |
| Width | 6px |
| Color | per-route: purple `#D8B4FE`, orange `#FDBA74`, blue `#93C5FD`, pink `#FBCFE8`, red `#FCA5A5` |
| Border-radius | `4px 0 0 0` (top-left corner) |

**Top row (driver + badge + 3-dot):**
| Element | Value |
|---------|-------|
| Layout | row, space-between, align center, gap 12px |
| Avatar | 24×24px circle, border `1px solid rgba(115,115,115,0.2)`, image fill |
| Driver name | Geist 16px w500 `#FFFFFF` |
| Driver+avatar group | row, gap 12px |
| Badge ("9 Orders") | bg `#111111`, text `#FAFAFA`, padding `2px 8px`, radius 4px, Geist 14px w500 |
| 3-dot button | 24×24px Ghost icon, `EllipsisVertical` icon, transparent bg |

**Info row (Planned Qty + Truck):**
| Element | Value |
|---------|-------|
| Layout | row, align center, gap 20px, fill width |
| Planned Qty label | Geist 14px w400, `#A3A3A3` |
| Planned Qty value | Geist 14px w500, `#E5E5E5` |
| Truck label | Geist 14px w400, `#A3A3A3` |
| Truck value | Geist 14px w500, `#E5E5E5`, truncated, fill width |

**Alert bar (attached below card, when utilization diff ≠ 0):**
| Property | Value |
|----------|-------|
| Background | `rgba(234,179,8,0.09)` |
| Padding | `6px 16px 6px 20px` |
| Border-radius | `0px 0px 4px 4px` |
| Layout | row, space-between, align center, gap 8px, fill width |
| Left text | diff value e.g. "-1,000 gal" — Geist 14px w400, `#EAB308` |
| Right text | "Route under-utilized" or "Route over-utilized" — Geist 14px w400, `#EAB308` |

---

## 8. Route Card (Expanded State)

When chevron is clicked, the card expands to reveal:

### 8a. Expanded card header (same as collapsed top section)
- Driver info row stays visible

### 8b. Truck Selection card
| Property | Value |
|----------|-------|
| Width | 460px |
| Background | transparent |
| Padding | `8px 12px` |
| Gap | 8px |
| Shadow | `0px 1px 2px 0px rgba(0,0,0,0.05)` |
| Truck dropdown | Truck icon + "H-118 - 2019 Kenworth Tank Wagon" placeholder |
| Dropdown text | Geist 16px w400, `#E5E5E5` |
| Hint below | "This truck can accommodate more orders." — Geist 14px w400, `#EAB308`, padding-left 36px |

### 8c. Hub Selection card
| Property | Value |
|----------|-------|
| Background | transparent |
| Padding | `4px 4px 8px` |
| Hub dropdown | Home icon + "Austin HUB" |
| Dropdown text | Geist 16px w400, `#E5E5E5` |
| Padding | `8px 12px` |

### 8d. Order Stop Rows (the sequence timeline)

Each stop has a **left timeline column** and a **stop card**:

**Timeline column (left, 68px wide):**
- Sequence badge: 16×16px circle, bg `#A3A3A3`, text `#171717`, Geist 14px w500
- Time text below badge: Geist 12px w400, `#A3A3A3` (e.g. "5:45 AM")
- Vertical connector line: `1px solid #282828`

**Stop card (right):**
| Property | Value |
|----------|-------|
| Width | 419px |
| Background | `#1F1F1F` |
| Border-radius | 4px |
| Padding | 16px |
| Left color bar | 6px wide, full height, matches route color |
| Layout | row, gap 12px |

**Stop card content:**
| Element | Value |
|---------|-------|
| Checkbox | 16×16px (same style) |
| Grip handle | `GripVertical` 20×20px, opacity 0 (visible on hover) |
| Type badge ("T"/"L"/"D") | Geist 14px w500, `#E5E5E5` bg, `#E5E5E5` text? NO — see below |
| Stop name | Geist 16px w500, `#FFFFFF` |
| 3-dot button | 24×24px, opacity 0 by default (visible on hover) |
| Planned qty | "Planned Qty: 2,200 gal" Geist 14px w500, `#FAFAFA` |

**Delivery type badge colors:**
| Type | Badge text | Color |
|------|-----------|-------|
| T (Transfer) | "T" | — |
| L (Load) | "L" | — |
| D (Delivery) | "D" | — |

**Route start/end hub rows:**
- Start: Hub icon + hub name, before stop #1
- End: Hub icon + hub name, after last stop

---

## 9. Unassigned Orders Tab

Each card:
| Property | Value |
|----------|-------|
| Background | `#1F1F1F` |
| Border | `1px solid #282828` |
| Border-radius | 4px |
| Padding | 12px |
| Layout | row, space-between, align center |
| Left | checkbox + customer name (16px w500 `#FAFAFA`) + address (12px w400 `#737373`) |
| Right | tank level dot (colored) + percentage + 3-dot button |

---

## 10. Footer

| Property | Value |
|----------|-------|
| Padding | `20px 24px` |
| Border-top | `1px solid rgba(115,115,115,0.2)` |
| Button | full width, height 40px, bg `#4D55F8`, text `#FAFAFA`, Geist 14px w500, radius 4px |

---

## 11. Data Issues to Fix

### Route 1 order count
- **Current bug:** `selectedOrders.filter(o => o.routeId === 'route-1')` returns ~15 rows (some at same location)
- **Figma shows:** "9 Orders" — matches `routeSequence` values 1–9
- **Fix:** Count **unique routeSequence values** (stops), not raw order rows
- **OR:** The user confirmed 9 is correct and some orders overlap location — display `orders.length` from the route's unique stop count

### Route 1 planned qty
- **Current:** summing all order volumes gives ~4,900 gal
- **Figma shows:** 4,000 gal
- **Fix:** Only sum volumes for orders where `routeSequence` is assigned (delivery orders), not load/transfer orders at hub

### Display approach
- Group orders by `routeSequence` within a route
- Badge count = number of unique stops (sequences)
- Planned qty = sum of `volume` for delivery-type orders only

---

## 12. Build Order (Incremental)

```
Step 1: Fix data layer
  - Add route metadata helper: getRouteStats(routeId, orders) → { orderCount, plannedQty, utilization }
  - Count orders = distinct routeSequence values
  - Planned qty = sum volumes of assigned delivery orders

Step 2: Collapsed route cards
  - Fix layout to match spec (16px driver name, 14px info row, gap 20px)
  - Fix badge: #111111 bg, #FAFAFA text, 2px 8px padding
  - Fix hover: bg #333333
  - Fix alert bar: two-part text (value + label)
  - Fix checkbox + chevron left column
  - Fix color bar absolute positioning

Step 3: Tab + header
  - "N Orders selected" header (18px w500)
  - Tab height 56px, active white underline
  - Select All row (16px w300 light)

Step 4: Expanded route card
  - Accordion toggle on chevron click
  - Truck selection card (with icon + hint text)
  - Hub selection card
  - Order stop timeline (sequence badge + time + stop card)

Step 5: Unassigned orders tab
  - Individual order cards

Step 6: Footer
  - Sticky publish button
```

---

## 13. Component Structure (Proposed)

```
LassoWorkspaceSheet (main)
├── WorkspaceHeader
├── WorkspaceTabs
├── WorkspaceContent (scrollable)
│   ├── SelectAllRow
│   ├── RouteCard[] (collapsed or expanded)
│   │   ├── CheckboxChevronColumn
│   │   └── RouteCardBody
│   │       ├── CollapsedView
│   │       │   ├── DriverRow (avatar + name + badge + 3-dot)
│   │       │   └── InfoRow (qty + truck)
│   │       ├── AlertBar (conditional)
│   │       └── ExpandedView (accordion)
│   │           ├── TruckSelectionCard
│   │           ├── HubSelectionCard
│   │           └── StopTimeline[]
│   │               ├── SequenceBadge + Time
│   │               └── StopCard
│   └── UnassignedOrderCard[]
└── WorkspaceFooter
```

---

## 14. Key Decisions

| Question | Decision |
|----------|----------|
| Accordion behavior | Single-open? Or multi-open? → **Multi-open** (each card independently expandable) |
| Truck/Hub dropdowns | Figma UI only for now, no data wiring |
| Order count (badge) | Unique routeSequence values |
| Planned qty | Sum of volumes (delivery orders only, or all — confirm with user) |
| Empty state | Skip for now (user providing new design) |
| Hover on collapsed card | bg #333333 |
| Checkbox style | Custom (not shadcn default): transparent bg, #333333 border, 16×16 |
