# Dev Handoff — Truck Dropdown

**Repo:** `hrisikesh-fp/route-builder`
**File:** `components/lasso-workspace-sheet.tsx`
**Live:** https://route-builder-navy.vercel.app

All dropdown logic lives in one IIFE rendered when `truckDropdownRouteId === routeId` (~line 4097).

---

## All states, left to right

### State 1 — No truck selected (empty)

What the user sees when they click the truck pill and no truck is assigned yet.

```
┌─────────────────────────────────────────────┐
│  Select Truck                             + │  ← title #a3a3a3 16px, Plus icon 20px #a3a3a3
│  No truck selected                          │  ← subtitle #737373 14px
└─────────────────────────────────────────────┘
Trailers can be added only after adding a Truck  ← helper text #737373 14px, outside the card
```

```tsx
// Title
<span style={{ fontSize: 16, color: "#a3a3a3" }}>Select Truck</span>

// Subtitle
<span style={{ fontSize: 14, color: "#737373" }}>No truck selected</span>

// Right icon (Plus, not ChevronDown)
<Plus size={20} color="#a3a3a3" />

// Helper text below the card
{!currentTruck && (
  <span style={{ fontSize: 14, color: "#737373", lineHeight: "20px" }}>
    Trailers can be added only after adding a Truck
  </span>
)}
```

---

### State 2 — Truck selected, no trailers

```
┌─────────────────────────────────────────────┐
│  H-118 · 2019 Kenworth Tank Wagon  [Tank ▾] │  ← name #e5e5e5 16px, TypeBadge + ChevronDown
│  4,500 gal · 4 Compartments · 2 Products   │  ← specs #a3a3a3 14px
└─────────────────────────────────────────────┘
+ Add Trailer                                    ← ghost button, only shows when truck is set
```

On row hover: TypeBadge fades out (opacity 0), Info button fades in (opacity 1) — same slot, no layout shift. Row bg goes transparent → `#282828`.

```tsx
// Title + specs
<span style={{ fontSize: 16, color: "#e5e5e5" }}>{currentTruck.name}</span>
<span style={{ fontSize: 14, color: "#a3a3a3" }}>{capacity} · {compartments} · {N} Products</span>

// Right: ChevronDown rotates 180° when truck search is open
<ChevronDown size={16} color="#A3A3A3"
  style={{ transform: truckSearchExpanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />

// Add Trailer button — only when truck set and not both trailer slots filled
{currentTruck && !(t1 && t2) && (
  <button style={{ display: "inline-flex", alignSelf: "flex-start", gap: 8,
                   background: trailerSearchSlot !== null ? "#282828" : "transparent",
                   border: "none", borderRadius: 4, height: 32, padding: "8px 12px" }}>
    <Plus size={16} color="#e5e5e5" />
    <span style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5" }}>Add Trailer</span>
  </button>
)}
```

---

### State 3 — Truck + 1 trailer

```
┌─────────────────────────────────────────────┐
│  H-118 · 2019 Kenworth Tank Wagon  [Tank ▾] │
│  4,500 gal · 4 Compartments · 2 Products   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  TT-22 · 2020 Transport Trailer  [Trail ▾] │
│  2,000 gal · 2 Compartments                │
└─────────────────────────────────────────────┘
+ Add Trailer
```

Trailer row is identical in structure to the truck row. Clicking a trailer row opens the trailer search for that slot (slot 1).

---

### State 4 — Truck + 2 trailers

Same as State 3 but with a second trailer row. "Add Trailer" button is hidden — both slots full.

```tsx
{currentTruck && !(currentTrailers.t1 && currentTrailers.t2) && <AddTrailerButton />}
// When both t1 and t2 are set → button disappears entirely
```

---

### State 5 — Truck search open

A `position: fixed` panel drops below the truck card row, layered on top of everything (`zIndex: 1100`). The primary dropdown stays visible underneath.

```
┌─────────────────────────────────────────────┐
│ 🔍  Search Truck                        [×] │  ← X only shows when search has input
├─────────────────────────────────────────────┤
│  H-138 · 2019 Polar Transport Trailer  [Trailer] │
│  9,500 gal · 5 Compartments · 2 Products        │
│  H-146 · 2005 Van Trailer              [Trailer] │
│  ...                                            │
└─────────────────────────────────────────────────┘
```

```tsx
// Container
position: "fixed",
top: truckSearchAnchorRect.bottom + 4,
left: truckSearchAnchorRect.left,
width: truckSearchAnchorRect.width,   // matches the truck card width
backgroundColor: "#111",              // darker than the primary dropdown (#1b1b1b)
border: "1px solid #333", borderRadius: 4,
zIndex: 1100

// Search input
<Search size={16} color="#737373" />
<input placeholder="Search Truck" autoFocus
  style={{ fontSize: 14, color: "#E5E5E5", background: "none", border: "none", outline: "none" }} />

// Each truck row
padding: "6px 8px", borderRadius: 2
default bg: transparent
hover bg: rgba(255,255,255,0.08)
selected bg: rgba(255,255,255,0.06)
// Right: <TypeBadge label={truck.badge} />
```

Badge values in the list: `"Trailer"`, `"Truck"`, `"Tank Wagon"`, `"Box truck"`, `"Tractor"`

---

### State 6 — Trailer search open

Same structure as truck search. Opens anchored below the Add Trailer button (or below the trailer row if swapping). Width is always 480px (matches the dropdown, not the button).

```tsx
position: "fixed",
top: trailerSearchAnchorRect.bottom + 4,
left: trailerSearchAnchorRect.left,
width: 480,   // fixed — do NOT use the Add Trailer button's width
backgroundColor: "#111", zIndex: 1100

// Placeholder: "Search Trailer"
// Each row: same two-line name + specs pattern, TypeBadge label="Trailer"
```

Selecting a trailer writes to `selectedTrailers[routeId].t1` or `.t2` depending on `trailerSearchSlot` (1 or 2).

---

### State 7 — Capacity warning banner

Shows at the top of the dropdown when a truck is selected and the route's total demand exceeds or falls below truck capacity. **L1 only, always orange** — never amber or red.

```
┌─────────────────────────────────────────────┐
│  Exceeds Truck Capacity          ↑ 420 gal │  ← orange strip
└─────────────────────────────────────────────┘
┌─── truck card ─────────────────────────────┐
```

```tsx
const showWarning = !!currentTruck && !!validation && validation.l1.status !== "ok"
// Note: always gate on !!validation first — undefined !== "ok" is true and will show falsely

// Strip
backgroundColor: "rgba(251,146,60,0.05)", borderRadius: 4, padding: "6px 12px"
// Text + arrow icon
color: "#fb923c", fontSize: 14
// Copy: "Exceeds Truck Capacity" or "Below Truck Capacity" + ArrowUp/ArrowDown + "{diff} gal"
```

---

### State 8 — Info button / View Details tooltip

On hover of the Info button (appears when row is hovered), a small tooltip shows above it.

```
       ┌──────────────┐
       │ View Details │
       └──────┬───────┘
              ▼
         [Info btn]
```

Rendered with `position: fixed` to escape `overflow: hidden`. Hidden once the details sheet is open.

```tsx
// Tooltip
position: "fixed", top: infoTooltipTarget.y - 42, left: infoTooltipTarget.x,
transform: "translateX(-50%)"
// Bubble: bg #E5E5E5, color #111, fontSize 12, padding "6px 12px", borderRadius 4
// Caret: borderLeft/Right 6px transparent, borderTop 6px solid #E5E5E5

// Info button states
rest (row hovered):  bg transparent, outline none
hover:               bg #404040, outline none
focused (open):      bg #404040, outline "1px solid #737373"
```

---

## Interaction rules

| Action | Result |
|---|---|
| Click truck card row | Opens truck search (or closes if already open) |
| Click truck search result | Selects truck, closes search |
| Click Info button | Opens Truck Details sheet — dropdown stays open |
| Click X on Truck Details | Closes details — dropdown stays open |
| Click trailer row | Opens trailer search for that slot |
| Click Add Trailer | Opens trailer search for the next empty slot |
| Click Add Trailer again (search open) | Closes trailer search (toggle) |
| Click anywhere in dropdown | Closes trailer search if open |
| Click outside dropdown | Closes entire dropdown |
| Opening truck search | Closes details sheet + trailer search |
| Opening info/details | Closes truck search + trailer search |

---

## Dropdown container

```tsx
position: "absolute",
// Normal: drops down below the truck pill
top: 44, right: 0, width: 480, zIndex: 999
// Dropup: flips when window.innerHeight - rect.bottom < 350
bottom: "calc(100% - 44px)", top: "auto"

backgroundColor: "#1b1b1b"   // primary panel
border: "1px solid #333", borderRadius: 4
boxShadow: "0 8px 24px rgba(0,0,0,0.6)"
```

The search layers (`#111`) are darker than the primary panel (`#1b1b1b`) — intentional contrast.

---

## Tokens

```
Panel bg:            #1b1b1b
Search layer bg:     #111
Row hover bg:        #282828
Info btn hover:      #404040
Info btn focused:    #404040 + outline 1px #737373
Border:              #333
Text primary:        #e5e5e5
Text secondary:      #a3a3a3
Text muted:          #737373  (empty state subtitle, helper text)
Warning bg:          rgba(251,146,60,0.05)
Warning text/icon:   #fb923c
Tooltip bg:          #E5E5E5
Tooltip text:        #111
```
