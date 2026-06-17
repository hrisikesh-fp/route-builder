# Dev Handoff — "Set Start Time" Modal (Modal 2 — Driver Conflict)

**Feature:** When a dispatcher assigns a driver to a route and that driver already has another route on the same day, a conflict modal appears. Instead of blocking the action, it lets the dispatcher set start times for each route so they sequence without clashing.
**Prototype repo:** `route-builder-redesign` (Next.js 15 / React 19 / TS, all inline styles). This doc describes the prototype as the reference spec.
**Component:** `components/route-sequence-modal.tsx`
**Branch:** `iter/modal-2-driver-conflict`
**Status:** ✅ Prototype complete
**Date:** 2026-06-18

---

## What problem this solves

A driver can physically only do routes in sequence — they can't be in two places at once. When a dispatcher assigns the same driver to two routes, the system doesn't block it, but it does need the dispatcher to clarify: **which route goes first, and when does each one start?**

This modal surfaces the two (or more) conflicting routes side-by-side and asks the dispatcher to set a start time for each. Once all routes have a start time, they confirm. The start times themselves encode the sequence — no drag-and-drop, no reordering UI needed.

---

## Where it lives

| Piece | File |
|---|---|
| Modal | `components/route-sequence-modal.tsx` |
| TimePicker (reused) | `components/time-picker.tsx` |
| Trigger + wiring | `components/lasso-workspace-sheet.tsx` — `driverConflictModal` state block |
| Demo data | `lib/mock-data.ts` + `lib/routes-data.ts` |

**To trigger the modal in the prototype:**
1. Open the workspace with routes for **Mark Ruffalo** (Route 1 + Route 2).
2. On Route 3 (no driver), click the driver dropdown and select **Mark Ruffalo**.
3. The "Set Start Time" modal appears immediately.

---

## Modal shell

```
width:      540px
maxWidth:   calc(100vw - 48px)
maxHeight:  min(720px, calc(100vh - 80px))   ← caps at 720, also caps at viewport - 80px
bg:         #1B1B1B
border:     1px solid #333
borderRadius: 8
padding:    24px
gap:        20px  (between header / body / footer)
boxSizing:  border-box
overflow:   hidden   ← clips body scroll at modal edges
display:    flex, flexDirection: column
zIndex:     10100
overlay:    rgba(0,0,0,0.55) fixed inset 0
fontFamily: Geist, sans-serif
```

**Auto-size + scroll behaviour:** the modal hugs content when short; once it reaches `maxHeight` (720px or viewport - 80px, whichever is smaller), the body section scrolls. This works via the `flexShrink: 1` + `minHeight: 0` pattern on the body — **not** `flex: 1` or `flex-grow`. See [Scroll pattern](#scroll-pattern) below.

---

## Header

```
flexShrink: 0   ← never squishes even when modal is at max height
gap:        4px
```

- **Title row:** "Set Start Time" (18px / 500 / `#E5E5E5`, `lineHeight: 28px`) + X close button (24×24, `#A3A3A3`, hover `#E5E5E5`).
- **Subtitle:** `<b>Mark Ruffalo</b> is already planned on another route for <b>June 04</b>. Set start times so that the routes sequence correctly.` Driver name and date in `#e5e5e5` 500-weight; rest in `#a3a3a3` 400-weight, 14px.

---

## Body — route card list

```css
display:        flex
flexDirection:  column
gap:            12px
overflowY:      auto         /* scrolls when content exceeds modal maxHeight */
minHeight:      0            /* REQUIRED — without this, flex child never shrinks */
flexShrink:     1            /* shrinks when modal hits maxHeight, NOT flex-grow */
```

Each conflicting route gets one **RouteCard** (see below). Cards render in the order passed via the `routes` prop.

---

## RouteCard — structure

The outer card has **no `overflow: hidden`** — this is intentional. Border-radius is applied per-section instead (header top corners, body bottom corners, accent rail full height). This prevents the accordion animation from being clipped.

```
outer wrapper:
  position: relative
  width:    100%
  borderRadius: 4    ← only sets the bounding shape; NOT overflow:hidden
```

### Accent rail

```
position:              absolute
top/left/bottom:       0
width:                 6px
backgroundColor:       route.color  (e.g. #93c5fd blue / #d8b4fe purple)
zIndex:                3
borderTopLeftRadius:   4
borderBottomLeftRadius: 4   ← ALWAYS 4, even when expanded — rail is the leftmost visual edge
```

**Important:** The rail must always have `borderBottomLeftRadius: 4`. It sits on top of everything at z-index 3 and IS the left edge, so if it has no bottom radius the whole card looks square at the bottom-left even if the body underneath is rounded.

### Header row

The **entire header row** is the expand/collapse toggle — not just the chevron button.

```
display:         flex
alignItems:      center
justifyContent:  space-between
padding:         12px 12px 12px 20px   (20px left to clear the 6px rail + gap)
position:        relative
zIndex:          2
cursor:          pointer
backgroundColor: hovered ? "#333" : "#282828"
transition:      background-color 150ms
borderRadius:    expanded ? "4px 4px 0 0" : 4   (top corners when open, all corners when collapsed)
```

**Left — truck has been selected:**
- Lucide `Truck` icon 16px `#FFFFFF` + truck name (16px / 500 / `#FFFFFF`, ellipsis overflow)
- Second line: specs row — `{gal} gal` · dot · `{n} Compartments` · dot · `{n} Products` (14px / 400 / `#a3a3a3`, gap 6, 4px `#737373` dots)
- Specs line only renders when at least one spec value is present

**Left — no truck selected:**
- Plain text `"No Truck Selected"` (14px / `#737373`)
- No truck icon, no specs line

**Right:**
- `N Orders` badge: bg `#111`, radius 4, `padding: 2px 8px`, 14px / 500 / `#fafafa`
- `ChevronDown` 20px `#a3a3a3` — rotates 180° when expanded via CSS transition (see below)

**Chevron animation:**
```css
transition: transform 280ms cubic-bezier(0.4, 0, 0.2, 1)
transform:  expanded ? "rotate(180deg)" : "rotate(0deg)"
```
This is the same easing curve used on the accordion body — they animate in sync.

### Body — accordion animation

**Animation wrapper** (the element whose `maxHeight` transitions):
```
overflow:     hidden
maxHeight:    expanded ? 600 : 0   ← 600px is the realistic cap; DO NOT use 9999
transition:   max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)
borderRadius: 0 0 4px 4px          ← REQUIRED so overflow:hidden clips to rounded corners
```

**Why `maxHeight: 600` not `maxHeight: 9999`:** The CSS easing curve maps across the FULL 0→max range. At `9999`, the content (say, 300px tall) completes its animation in the first 3% of the duration — the ease-in-out effect is invisible. At `600` (close to the real content height), the easing maps correctly and the animation feels natural.

**Body content** (`#1f1f1f` bg, `borderRadius: "0 0 4px 4px"`, `padding: 16px 16px 16px 20px`, flex column):
1. `TimePicker` input
2. Orders table (if `showTable = true`, animated)
3. "See All Orders" / "See less" toggle button

### Orders table animation

```
overflow:   hidden
maxHeight:  showTable ? 400 : 0    ← 400px cap (realistic for the table)
transition: max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)
```

The table itself (`OrdersTable`) has `border: 1px solid #282828`, `borderRadius: 4`, `overflow: hidden`. Two columns:

| Column | Width | Header | Cell padding | Content |
|---|---|---|---|---|
| Stops | `flex: 1` | `h:40, bg #282828, 14px/500 #a3a3a3` | `12px 12px 12px 8px` | seq num (14px, `#a3a3a3`) + TypeBadge + stop name (16px, `#e5e5e5`, ellipsis) |
| Planned Qty | `120px` fixed | same style | `12px` | `{qty} gal` (16px, `#e5e5e5`) |

**TypeBadge** — 20×20, `borderRadius: 4`:
- `L` → bg `#189FFC`
- `D` → bg `#25B8A7`
- `T` → bg `#737373`
- Glyph: 14px / 500 / `#171717` (dark, not white)

**"See All Orders" button:**
```
alignSelf:  flex-start
height:     32px
padding:    0 12px         ← NOT "8px 12px" — fixed height + vertical padding conflict
display:    flex
alignItems: center         ← centers text vertically within the fixed height
background: none
border:     none
borderRadius: 4
fontSize:   14px / 500 / #fafafa
hover:      backgroundColor rgba(255,255,255,0.04)
```

**Important:** Any button with a fixed `height` must use `padding: 0 Xpx` (no vertical padding) + `display: flex; alignItems: center`. If you set both a fixed height AND vertical padding, the browser calculates `height = padding-top + content + padding-bottom`, which pushes the content down and makes the text look bottom-heavy.

---

## Scroll pattern

The modal uses `maxHeight` (not `height`) so it auto-sizes when content is short but caps at 720px. To get the body to scroll when the modal hits that cap:

```jsx
// Modal outer
<div style={{
  maxHeight: "min(720px, calc(100vh - 80px))",
  display: "flex", flexDirection: "column",
  overflow: "hidden",
}}>
  {/* Header — never shrinks */}
  <div style={{ flexShrink: 0 }}>...</div>

  {/* Body — auto-sizes, shrinks when modal hits maxHeight, then scrolls */}
  <div style={{
    overflowY: "auto",
    minHeight: 0,       /* REQUIRED — default min-height: auto prevents shrinking */
    flexShrink: 1,      /* the ONLY flex child that can shrink */
    /* NO flex: 1, NO flexGrow — that would give it a definite size and break auto-sizing */
  }}>
    {/* route cards */}
  </div>

  {/* Footer — never shrinks */}
  <div style={{ flexShrink: 0 }}>...</div>
</div>
```

**Why `flexShrink: 1` and not `flex: 1`:** `flex: 1` sets `flexGrow: 1` which gives the body a calculated definite size even when content is short — the modal always fills `maxHeight`. `flexShrink: 1` with no grow means the body is its natural content height; it only shrinks (and enables scroll) when the parent hits `maxHeight`. Result: the modal hugs content when short and scrolls when tall.

---

## Footer

```
display:         flex
alignItems:      center
justifyContent:  space-between
flexShrink:      0
```

**Cancel button:**
- `height: 36`, `padding: "0 16px"`, transparent bg, `border: 1px solid #333`, `borderRadius: 4`
- 14px / 500 / `#FAFAFA`
- Hover: `backgroundColor rgba(255,255,255,0.04)`
- Must use `display: flex; alignItems: center` — same button height rule as above

**Confirm & Proceed button:**
- `height: 36`, `padding: "0 16px"`, `backgroundColor: #E5E5E5`, no border, `borderRadius: 4`
- 14px / 500 / `#171717` (dark)
- **Disabled state:** `opacity: 0.5`, `cursor: default` — rendered until every route has a start time
- **Enabled state:** `opacity: 1`, `cursor: pointer`, hover `backgroundColor: #D4D4D4`
- Gate: `allTimesSet = routes.every(r => !!startTimes[r.id])`

---

## TimePicker

Reused from `components/time-picker.tsx` as-is. Key detail: the dropdown panel renders via **React portal** (`createPortal(..., document.body)`) at `zIndex: 10200`. This is required because the modal creates a stacking context — a plain dropdown positioned inside the modal would clip behind sibling route cards even with a high z-index.

Placeholder: `"Set Start Time"` (not "Select Start Time").

**Disabled times:** each route's picker disables the times already chosen by the other routes. This prevents two routes from having the same start time (which would break sequencing).

```ts
function disabledForRoute(routeId: string): string[] {
  return routes
    .filter(r => r.id !== routeId && startTimes[r.id])
    .map(r => startTimes[r.id])
}
```

---

## Props interface

```ts
interface RouteSequenceModalProps {
  isOpen: boolean
  driverName: string        // shown in subtitle, bold
  date: string              // shown in subtitle, bold (e.g. "June 04")
  routes: SequenceRoute[]   // one card per route
  startTimes: Record<string, string>    // routeId → chosen time string
  onTimeChange: (routeId: string, time: string) => void
  onConfirm: () => void
  onCancel: () => void
}

interface SequenceRoute {
  id: string
  truckName: string         // empty string → "No Truck Selected" state
  orderCount: number
  color: string             // hex color for the left accent rail
  specs?: {
    gal?: string            // e.g. "4,500 gal"
    compartments?: string   // e.g. "4 Compartments"
    products?: number       // e.g. 2
  }
  stops?: SequenceStop[]    // if present, "See All Orders" button appears
}

interface SequenceStop {
  seq: number | string      // sequence number shown in the left column
  type: "L" | "D" | "T"    // Load / Delivery / Transfer
  name: string              // stop name (customer / terminal)
  qty: number               // planned gallons
}
```

---

## Wiring in `lasso-workspace-sheet.tsx`

The modal is triggered inside the driver dropdown's `handleDriverSelect`. When the selected driver already has an assigned route (i.e., `existingRoute !== undefined`), the conflict modal opens:

```ts
setDriverConflictModal({
  isOpen: true,
  driverName: driver.name,
  date: "June 04",
  routes: modalRoutes,   // enriched from route data + TRUCK_CAPACITIES
  startTimes: {},
})
```

`modalRoutes` is built from `[existingRoute.id, currentRouteId]` — each enriched with:
- `truckName` from selected truck or `route.truckName`
- `specs` from `TRUCK_CAPACITIES[truck.id]` — `{ gal, compartments, products }`
- `stops` from `selectedOrders` filtered by `routeId`, sorted by `routeSequence`, mapped to `{ seq, type, name, qty }`
- `color` from `route.color` (the route's pastel accent)

---

## Design tokens

```
Modal bg:       #1B1B1B
Modal border:   #333
Card header:    #282828 (rest) / #333 (hovered)
Card body:      #1f1f1f
Accent rail:    route.color (pastel — #93c5fd blue / #d8b4fe purple / etc.)
Text primary:   #FFFFFF / #E5E5E5 / #FAFAFA
Text secondary: #a3a3a3
Text muted:     #737373
Badge bg:       #111
Orders badge:   #111 bg, #fafafa text
Confirm btn:    #E5E5E5 bg / #171717 text
Cancel btn:     transparent / #333 border / #FAFAFA text
Dot separator:  4px circle, #737373
Type badge L:   #189FFC
Type badge D:   #25B8A7
Type badge T:   #737373
Easing:         cubic-bezier(0.4, 0, 0.2, 1) — all animations
Duration:       280ms (accordion / chevron / table) / 150ms (bg hover)
Font:           Geist
```

---

## CSS gotchas — learned the hard way

| Rule | Why |
|---|---|
| No `overflow: hidden` on the outer card | It clips animated children silently — even when `maxHeight` is large |
| `borderRadius` per section (header / body) | Gives rounded corners without `overflow: hidden` on the outer |
| Accent rail always `borderBottomLeftRadius: 4` | It sits at z-index 3 over the card's left edge — if it's square, the card corner looks square regardless of the body |
| Animation wrapper needs `borderRadius: "0 0 4px 4px"` | The `overflow: hidden` on the wrapper clips to its own shape — without this, the body's rounded corners are cut flat |
| `maxHeight: 600` not `maxHeight: 9999` | Easing is computed over the full 0→max range. At 9999, the visible animation finishes in ~3% of the duration — the curve is invisible |
| No `grid-template-rows: 1fr` | In auto-sized containers, `1fr` resolves to 0 (no free space). Always use `max-height` for accordion animations |
| `flexShrink: 1, minHeight: 0` on body (no `flex-grow`) | `maxHeight` alone doesn't give flex children a definite size. `flexShrink` + `minHeight: 0` lets the body shrink and scroll without forcing a fixed height |
| Button: `padding: "0 16px"` + `display: flex; alignItems: center` | Fixed height + vertical padding conflict makes text look bottom-heavy. Zero vertical padding + flex centering is the correct pattern |
| TimePicker dropdown via `createPortal` | Modal creates a stacking context — a portal to `document.body` at z-index 10200 is the only way the dropdown appears above sibling cards |

Full reference doc: `docs/css-accordion-scroll-patterns.md`

---

## Open questions

1. **How many routes?** The modal is designed for 2. If a driver has 3+ routes that day, the card list scrolls — but the copy ("is already planned on **another** route") assumes exactly one existing route. Confirm whether 3+ is a real scenario before shipping.
2. **Start time conflict — same day, different time slots?** The disabled-times logic only prevents identical start times. It does NOT validate that Route 1's end time doesn't overlap Route 2's start. Confirm if overlap detection is needed.
3. **Persisting start times.** Prototype holds `startTimes` in local state (resets on close). In production, these need to be written to the route record and factored into dispatch scheduling.
4. **No truck case.** If a route has no truck assigned, the modal still opens and shows "No Truck Selected." This is valid — the dispatcher can still set a start time. But the production scheduler may want to block dispatch if truck is missing. Confirm.
