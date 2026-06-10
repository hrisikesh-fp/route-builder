# Dev Handoff — Truck Dropdown Overhaul (RB-1.4)

**Branch:** `feat/improve-truck-selection`
**Repo:** `hrisikesh-fp/route-builder`
**Figma:** file `92PXGoRAv1nhR8GuMpspIU` — node `4085-115251` (truck + 1 trailer state), node `4042-44100` (earlier base)
**Companion handoffs:** `HANDOFF-route-card.md`, `HANDOFF-validation-framework.md`

All changes are in **2 files**:
- `components/lasso-workspace-sheet.tsx` (the dropdown + all state)
- `components/truck-details-sheet.tsx` (1 line — a data attribute)

> Line numbers below are from the branch tip. They drift as code moves — grep the quoted anchor strings to relocate.

---

## 0. The big picture — what changed conceptually

**Before:** Truck/trailer selection lived inside the **expanded** route card (the `TruckHubCard` / `TruckHubStartRow` components). The collapsed card just showed a pill.

**After:** Truck/trailer selection lives **entirely in a dropdown off the collapsed route card**. The expanded card no longer has a truck selector — only the hub row remains. `TruckHubStartRow` / `TruckHubCard` were reduced to a **hub-only** card (all the truck/trailer/search/validation JSX was deleted from them).

So the dropdown described here is the single source of truth for equipment selection.

---

## 1. The dropdown container

The whole dropdown is an IIFE rendered when `truckDropdownRouteId === routeId`. Anchor: `{/* Truck dropdown — Figma RB-1.4 design */}` (~line 4096).

```tsx
<div
  data-truck-dropdown
  onClick={() => { if (trailerSearchSlot !== null) { /* close trailer search */ } }}
  style={{
    position: "absolute",
    ...(truckDropupEnabled ? { bottom: "calc(100% - 44px)", top: "auto" } : { top: 44, bottom: "auto" }),
    right: 0, width: 480, zIndex: 999,
    backgroundColor: "#1b1b1b",          // background-2 (the panel)
    border: "1px solid #333", borderRadius: 4,
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)", overflow: "hidden",
  }}
>
```

- **Width 480px, right-aligned** (`right: 0`) to the route card edge.
- **`backgroundColor: #1b1b1b`** = background-2. The *search layers* (below) use **`#111`** = background-1. This contrast is intentional — don't unify them.
- `truckDropupEnabled` flips it upward when `window.innerHeight - rect.bottom < 350`.

---

## 2. State (all on the main `LassoWorkspaceSheet` component, ~lines 3022–3030)

```ts
const [truckDropdownRouteId, setTruckDropdownRouteId] = useState<string | null>(null)
const [cardTruckSearch, setCardTruckSearch] = useState("")
const [truckSearchExpanded, setTruckSearchExpanded] = useState(false)
const [truckSearchAnchorRect, setTruckSearchAnchorRect] = useState<DOMRect | null>(null)
const [truckRowHovered, setTruckRowHovered] = useState(false)
const [trailerRowHovered, setTrailerRowHovered] = useState<0 | 1 | 2>(0)   // 0=none,1=t1,2=t2
const [infoTooltipTarget, setInfoTooltipTarget] = useState<{ x: number; y: number } | null>(null)
const [trailerSearchAnchorRect, setTrailerSearchAnchorRect] = useState<DOMRect | null>(null)
const [trailerSearchSlot, setTrailerSearchSlot] = useState<1 | 2 | null>(null)
// trailer selection store:
const [selectedTrailers, setSelectedTrailers] = useState<Record<string, { t1: TrailerItem | null; t2: TrailerItem | null }>>({})
```

`cardTrailerSlot` (`0 | 1 | 2`) also exists from the old flow but the new trailer search is driven by `trailerSearchSlot` + `trailerSearchAnchorRect`.

---

## 3. Truck row card — bordered card with name+specs and a TypeBadge↔Info swap

Each row is a **bordered card** (`1px #333`, radius 4, padding 4) wrapping a menu-item row. The menu-item gets `#282828` bg on hover. Anchor: the `{(() => { const isDetailsOpen = ... })()}` block (~line 4145).

### Empty state (no truck selected)

When `currentTruck` is null the row renders a different variant:

| Part | Empty state | Truck selected |
|---|---|---|
| Title | `"Select Truck"` in `#a3a3a3` | truck name in `#e5e5e5` |
| Subtitle | `"No truck selected"` in `#737373` | capacity · compartments · products in `#a3a3a3` |
| Right icon | `<Plus size={20} color="#a3a3a3" />` | `<ChevronDown>` (rotates when search open) |
| TypeBadge / Info btn | hidden | fades in/out on hover |
| Inner row bg | transparent → `#282828` on hover (same as truck-selected state) | same |

The **same copy** ("No truck selected") is also used on the **collapsed route card** (Config E), below the Select Truck pill. Do not use "No Truck selected yet." — that was the old string.

```tsx
const isDetailsOpen = truckDetailsRouteId === routeId
const showInfoBtn = truckRowHovered || isDetailsOpen   // badge hidden whenever info is showing

<div style={{ border: "1px solid #333", borderRadius: 4, padding: 4, cursor: "pointer" }}
  onClick={(e) => {
    if ((e.target as HTMLElement).closest("button")) return   // let the info button handle its own click
    setTruckDetailsRouteId(null)                               // opening search closes details
    setTrailerSearchSlot(null); setTrailerSearchAnchorRect(null)
    if (truckSearchExpanded) { /* toggle closed */ }
    else { setTruckSearchAnchorRect(e.currentTarget.getBoundingClientRect()); setTruckSearchExpanded(true); setCardTruckSearch("") }
  }}>
  <div style={{ borderRadius: 2, padding: "6px 8px", display: "flex", alignItems: "center", gap: 8,
                backgroundColor: truckRowHovered ? "#282828" : "transparent", transition: "background-color 0.1s" }}
       onMouseEnter={() => setTruckRowHovered(true)}
       onMouseLeave={() => { setTruckRowHovered(false); setInfoTooltipTarget(null) }}>
    {/* LEFT: name (16px #e5e5e5) + specs (14px #a3a3a3): "4,500 gal · 4 Compartments · 2 Products" */}
    {/* RIGHT: the swap slot + chevron */}
  </div>
</div>
```

### The TypeBadge ↔ Info button swap (no layout shift)

The Info button is **absolutely positioned inside the TypeBadge's wrapper** so the row width never changes when hovering. Right-aligned (`justify-content: flex-end`) so the button sits flush against the chevron.

```tsx
<div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center" }}>
  {/* Badge — fades out */}
  <div style={{ opacity: showInfoBtn ? 0 : 1, transition: "opacity 0.1s", pointerEvents: "none" }}>
    <TypeBadge label={currentTruck.badge} />
  </div>
  {/* Info button — fades in, overlaid in the same slot, right-aligned */}
  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "flex-end", opacity: showInfoBtn ? 1 : 0, transition: "opacity 0.1s" }}>
    <button
      onClick={(e) => {
        e.stopPropagation(); setInfoTooltipTarget(null)
        if (isDetailsOpen) { setTruckDetailsRouteId(null) }      // toggle closed
        else {
          setTruckSearchExpanded(false); setTruckSearchAnchorRect(null); setCardTruckSearch("")  // close search
          const r = e.currentTarget.getBoundingClientRect()
          setTruckDetailsAnchorLeft(r.right + 4)   // see §5 for why r.right+4
          setTruckDetailsAnchorRight(r.right); setTruckDetailsAnchorY(r.bottom)
          setTruckDetailsRouteId(routeId)
        }
      }}
      onMouseEnter={(e) => { if (!isDetailsOpen) { e.currentTarget.style.backgroundColor = "#404040"; /* set infoTooltipTarget from rect */ } }}
      onMouseLeave={(e) => { if (!isDetailsOpen) e.currentTarget.style.backgroundColor = "transparent"; setInfoTooltipTarget(null) }}
      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
               border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0,
               background: isDetailsOpen ? "#404040" : "transparent",
               outline: isDetailsOpen ? "1px solid #737373" : "none" }}   // FOCUSED STATE
    >
      <Info size={16} color="#fafafa" />
    </button>
  </div>
</div>
```

**Three states of the Info button** (Figma: `Zvutylr6lxkxIuKMXEuSX6` node `1904-130064` for the focused state):
| State | bg | outline |
|---|---|---|
| Rest (row hovered) | transparent | none |
| Hover | `#404040` | none |
| **Focused** (details open) | `#404040` | `1px solid #737373` |

The trailer rows (t1, t2) repeat this exact pattern with `trailerRowHovered === 1`/`2` driving the swap.

---

## 4. "View Details" tooltip — matches the FAB tooltip component

Rendered once near the bottom of the IIFE. Anchor: `{/* Info button "View Details" tooltip ... */}` (~line 4323). Uses **`position: fixed`** + `getBoundingClientRect()` to escape the dropdown's `overflow: hidden`.

```tsx
{infoTooltipTarget && truckDetailsRouteId !== routeId && (   // suppressed once details is open
  <div style={{ position: "fixed", top: infoTooltipTarget.y - 42, left: infoTooltipTarget.x,
                transform: "translateX(-50%)", display: "flex", flexDirection: "column",
                alignItems: "center", pointerEvents: "none", zIndex: 9999 }}>
    <div style={{ backgroundColor: "#E5E5E5", color: "#111", fontSize: 12, padding: "6px 12px",
                  borderRadius: 4, whiteSpace: "nowrap", fontFamily: "Geist, sans-serif" }}>View Details</div>
    <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent", borderTop: "6px solid #E5E5E5" }} />   {/* downward caret */}
  </div>
)}
```

This is the **same tooltip component** as the route-card FAB tooltips (`#E5E5E5` bg, `#111` text, 12px, caret triangle). Reuse it verbatim.

---

## 5. Info button → Truck Details drawer (opens without closing the dropdown)

The drawer is the existing `TruckDetailsSheet`. Two behaviors were wired:

**(a) Right-aligned with the info button.** `TruckDetailsSheet` positions itself at `anchorLeft - SHEET_W - 4`. To make its **right edge** line up with the button, we pass `anchorLeft = r.right + 4` (so `sheetLeft = r.right + 4 - SHEET_W - 4 = r.right - SHEET_W`). `anchorY = r.bottom` so it drops below the button.

**(b) Closing the drawer must NOT close the dropdown.** The dropdown has an outside-click handler (`useEffect` on `truckDropdownRouteId`, ~line 3205) that closes it on any `mousedown` outside `[data-truck-dropdown]`. The drawer's X button lives outside that subtree, so we added a second guard:

```ts
// components/lasso-workspace-sheet.tsx, outside-click handler
if (!target.closest("[data-truck-dropdown]") && !target.closest("[data-truck-details-sheet]")) {
  setTruckDropdownRouteId(null); /* ...reset search state... */
}
```

And in **`components/truck-details-sheet.tsx`** the sheet root div got the matching attribute (the only change in that file):
```tsx
<div data-truck-details-sheet style={{ ...containerStyle, ... }}>
```

Trailer info buttons open the same sheet for the trailer vehicle (use `synthesizeTrailerVehicleInfo`).

---

## 6. Search layers — truck + trailer both open as fixed layers on top

Both searches open as **`position: fixed`** panels anchored to a `getBoundingClientRect()`, layered above the main dropdown (`zIndex: 1100`) which stays visible underneath. Background **`#111`** (background-1).

### Truck search (anchor `{/* Truck search — fixed layer ... */}`, ~line 4331)
- Anchored to the truck card's rect (`truckSearchAnchorRect`), `width = anchorRect.width`.
- Search input + filtered `TRUCKS` list. Each row: name + specs + `TypeBadge`. Specs include Products count via `TRUCK_CAPACITIES[truck.id].productCapacities`.
- The **X clear button only renders when `cardTruckSearch` is non-empty**.

### Trailer search (anchor `{/* Trailer search — fixed layer ... */}`, ~line 4390)
- Opened from a trailer row click **or** the Add Trailer button. `trailerSearchSlot` (1|2) records which slot.
- **Anchored below the Add Trailer button**, `width: 480` (fixed, matches the dropdown — do NOT use the button's narrow width).
- The Add Trailer button shows a **focused `#282828` bg** while its search is open, and **toggles closed** on re-click.
- `onClick={(e) => e.stopPropagation()}` on the layer so clicks inside don't bubble to the dropdown's "close trailer search" handler.
- Selecting writes into `selectedTrailers[routeId].t1` or `.t2` based on `trailerSearchSlot`.

### Mutual exclusion rules (the important UX)
- Opening truck search → closes details drawer + trailer search.
- Opening the info/details → closes truck + trailer search.
- Clicking **anywhere in the main dropdown** → closes the trailer search (the container's `onClick`).
- Re-clicking the same trigger → toggles it closed.

---

## 7. No-truck helper text + Add Trailer — ghost button

When no truck is selected, a helper text line appears **below the truck row card** (in place of the Add Trailer button, which only renders once a truck is set):

```tsx
{!currentTruck && (
  <span style={{ fontSize: 14, color: "#737373", lineHeight: "20px",
                 overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
    Trailers can be added only after adding a Truck
  </span>
)}
```

The Add Trailer button is gated on `currentTruck && !(t1 && t2)` so these two never show at the same time.

### Add Trailer — ghost button

Figma: `Zvutylr6lxkxIuKMXEuSX6` node `1895-129996`.

```tsx
<button
  onClick={(e) => { if (trailerSearchSlot !== null) { /* toggle closed */ return }
                    setTrailerSearchAnchorRect(e.currentTarget.getBoundingClientRect());
                    setTrailerSearchSlot(currentTrailers.t1 ? 2 : 1); setCardTrailerSearch("") }}
  style={{ display: "inline-flex", alignItems: "center", alignSelf: "flex-start", gap: 8,
           cursor: "pointer", border: "none", borderRadius: 4, height: 32, padding: "8px 12px",
           fontFamily: "Geist, sans-serif",
           background: trailerSearchSlot !== null ? "#282828" : "transparent" }}   // focused while open
  onMouseEnter={(e) => { if (!trailerSearchSlot) e.currentTarget.style.backgroundColor = "#282828" }}
  onMouseLeave={(e) => { if (!trailerSearchSlot) e.currentTarget.style.backgroundColor = "transparent" }}
>
  <Plus size={16} color="#e5e5e5" /> <span style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5" }}>Add Trailer</span>
</button>
```

Key: **`alignSelf: flex-start`** so it hugs its content inside the flex column (don't let it stretch full-width), no border, transparent → `#282828` on hover only.

---

## 8. Capacity warning banner inside the dropdown

A subtle orange strip at the top of the primary view, **L1 only, always orange** (never inherits L3 amber). See `HANDOFF-validation-framework.md` for the rule.

```tsx
const showWarning = !!currentTruck && !!validation && validation.l1.status !== "ok"   // null-safe!
// bg rgba(251,146,60,0.05), text + arrow #fb923c, copy "Exceeds/Below Truck Capacity" + "{|diff|} gal"
```

> Gotcha that bit us: `validation?.l1.status !== "ok"` is `true` when `validation` is `undefined` (`undefined !== "ok"`). Always gate on `!!validation` first.

---

## Design tokens used here

```
Panel bg (dropdown):     #1b1b1b   (background-2)
Search layer bg:         #111      (background-1)
Row hover bg:            #282828
Info btn hover bg:       #404040
Info btn focused outline:#737373
Border:                  #333
Text primary:            #e5e5e5 / #fafafa
Text secondary:          #a3a3a3
Text muted:              #737373   (empty-state subtitle, helper text)
Text placeholder:        #a3a3a3   (empty-state title "Select Truck")
Tooltip:                 bg #E5E5E5, text #111, 12px, caret triangle
Warning (L1):            text/arrow #fb923c, strip bg rgba(251,146,60,0.05)
Dropdown width:          480px, right-aligned
Empty-state Plus icon:   #a3a3a3, 20px (ChevronDown is 16px — size differs intentionally)
```
