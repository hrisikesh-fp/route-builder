# Plan: Route Card 3-Dot Dropdown Menu Redesign

## Context

The current 3-dot menu on route cards has: Driver (submenu) → Unassign Route. The Figma designs show a more complete menu with conditional items, proper separator, hover tooltip, and updated styling. The menu background should be `#282828` (not `#1A1A1A`), width `180px` (not `200px`), and items need updated spacing.

## Figma Specs

### Full menu (published route) — node `198:9039`
```
┌──────────────────┐  bg: #282828, border: 1px solid #333
│  View Route  ↗   │  borderRadius: 4px, padding: 4px, width: 180px
│  Driver      >   │  shadow: 0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)
│  Remove          │
│ ──────────────── │  separator: 6px height (line centered)
│  Unassign Route  │
└──────────────────┘
```

### Unpublished route menu (route-6) — node `198:9004`
```
┌──────────────────┐  Same specs, NO "View Route" row
│  Driver      >   │
│  Remove          │
│ ──────────────── │
│  Unassign Route  │
└──────────────────┘
```

### Item specs (all items)
- Padding: `6px 8px`, gap: `8px`, borderRadius: `4px`
- Font: Geist, 14px, weight 400, color `#E5E5E5`, lineHeight ~20px
- Hover: bg `#333`, borderRadius `2px`

### "View Route" item
- Text "View Route" + ExternalLink icon (16px, right-aligned, stroke `#A3A3A3`)
- Only shows when route is published (all routes except route-6)
- Present in BOTH the FAB icon AND as a dropdown item

### "Remove" item
- Text "Remove" (plain item, no icon)
- On hover: shows tooltip to the LEFT — "Remove Route from Workspace"
- Tooltip: bg `#E5E5E5`, color `#111111`, 12px font, padding `6px 12px`, borderRadius `4px`, with right-pointing arrow

### Separator
- 6px height div with a centered 1px line (horizontal rule)
- Separates "Remove" from "Unassign Route"

### "Unassign Route"
- Below separator — destructive action (dismantles the route)
- Visually separated because of its severity

## Implementation

### File: `components/lasso-workspace-sheet.tsx`

#### Step 1: Add `isPublished` prop to RouteCardCollapsed
```ts
isPublished?: boolean  // default true
```
Pass from call site: `isPublished={routeId !== "route-6"}`

#### Step 2: Add `onRemoveRoute` and `onViewRoute` props
```ts
onViewRoute?: () => void
onRemoveRoute?: () => void
```

#### Step 3: Rewrite menu dropdown (lines ~569-654)

**Container changes:**
- `backgroundColor: "#1A1A1A"` (keep existing — Figma shows #282828 but will be updated in design)
- `width: 180` (was `200`)
- `border: "1px solid #333"` (keep)
- `boxShadow: "0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)"` (Figma shadow/md)

**Menu items order:**
1. **View Route** (conditional: only if `isPublished`) — text + ExternalLink icon (16px, #A3A3A3)
2. **Driver** (submenu trigger with ChevronRight) — unchanged logic
3. **Remove** — plain item + hover tooltip (position: absolute, left, "Remove Route from Workspace")
4. **Separator** — 6px height div with centered 1px line (#333)
5. **Unassign Route** — below separator

**Remove tooltip implementation:**
- State: `removeHovered` boolean (local to the IIFE or via onMouseEnter/Leave)
- Tooltip div: `position: absolute`, `right: calc(100% + 8px)`, `top: 50%`, `transform: translateY(-50%)`
- Style: bg `#E5E5E5`, color `#111`, fontSize 12, padding `6px 12px`, borderRadius 4, whiteSpace nowrap
- Arrow: 6px CSS triangle pointing right (border trick), color `#E5E5E5`

#### Step 4: Update item hover style
- Hover: `backgroundColor: "#333"`, `borderRadius: "2px"` (currently uses `"#333"` and `"2px"` — keep)
- Default: `borderRadius: 4` (keep)

#### Step 5: Wire at call site
```tsx
isPublished={routeId !== "route-6"}
onViewRoute={() => { /* future: open route detail view */ }}
onRemoveRoute={() => {
  // Remove this route's orders from selectedOrders
  // Remove routeId from selectedRouteIds
  setMenuRouteId(null)
}}
```

## Verification

1. Hover a published route card (routes 1-5) → FAB shows ExternalLink + MoreVertical
2. Click 3-dot → menu shows: View Route, Driver >, Remove, separator, Unassign Route
3. Hover "Remove" → tooltip appears to the left: "Remove Route from Workspace"
4. Route 6 card → FAB shows only MoreVertical (no ExternalLink), menu has no "View Route"
5. Menu bg is `#282828`, width 180px, proper separator height
