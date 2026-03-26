# Plan: FAB (hover action buttons) on route card + tooltips

## Context

Replace the always-visible 3-dot button with a FAB (Floating Action Bar) that appears only on route card hover. Contains 3 icon buttons with tooltips. Typical SaaS kanban pattern.

## FAB specs (from Figma `6416:159897`)

- **Container**: `bg: #1B1B1B`, `border: 1px solid #282828`, `padding: 6px`, `gap: 4px`, `rounded: 4px`
- **Position**: `absolute`, `top: 16px`, `right: 16px` inside the card (overlays top-right)
- **Visibility**: hidden by default, shown on card hover OR when menu is open
- **3 buttons** (each 24x24 ghost):
  1. **X** — remove route from workspace (deselect)
  2. **ExternalLink** — view route (opens new tab, non-functional for now)
  3. **MoreVertical** — 3-dot menu (existing dropdown)
- Button hover: `bg: #404040`, `rounded: 4px`
- Button focus (menu open): `box-shadow: 0px 0px 0px 3px rgba(115,115,115,0.5)`

## Tooltip specs (from Figma `6417:160056`)

- `bg: #E5E5E5`, `color: #111`, `font: 12px`, `padding: 6px 12px`, `rounded: 4px`
- Arrow: centered bottom, pointing down (rotated 45deg square)
- Position: above the button, centered horizontally
- Tooltip labels:
  - X → "Remove Route from Workspace"
  - ExternalLink → "View Route"
  - MoreVertical → "More Actions"

## Changes to `components/lasso-workspace-sheet.tsx`

### 1. Add `ExternalLink` to lucide imports

### 2. Restructure `RouteCardCollapsed` — remove standalone 3-dot, add FAB

Replace the current 3-dot button (sibling of Inner) with a FAB container that's `position: absolute` inside the card. The card outer div becomes the positioning context (`position: relative`). Inner takes full width (no gap for buttons).

**Card structure change:**
```
Card (flex-col → position: relative)
├── Inner (flex: 1, full width)
└── FAB (absolute, top: 16px, right: 16px) ← hidden, shown on hover
    ├── X button
    ├── ExternalLink button
    └── MoreVertical button (existing menu logic)
```

### 3. Show/hide FAB based on `isHovered` or `isMenuOpen`

- `opacity: 0` / `pointer-events: none` by default
- `opacity: 1` / `pointer-events: auto` when `isHovered || isMenuOpen`
- Smooth transition: `transition: opacity 150ms ease`

### 4. Add tooltip component (inline, CSS-only)

Each button gets a wrapper with a tooltip that appears on hover using CSS `:hover` + child visibility. Tooltip is `position: absolute`, above the button, with the arrow.

Implementation: wrap each icon button in a `<div style={{ position: "relative" }}>`, with a tooltip `<div>` that's hidden by default and shown via parent `onMouseEnter/onMouseLeave`.

### 5. Move 3-dot menu dropdown into FAB context

The existing menu dropdown (View Route, Driver >, Unassign Route) stays attached to the MoreVertical button but now lives inside the FAB's absolute positioning.

## Branch

Create `feat/route-card-fab` from `main`. Push to remote for a separate Vercel preview URL — do NOT merge to main.

## File to modify

- `components/lasso-workspace-sheet.tsx`

## Verification

1. Default: no FAB visible, truck name uses full width
2. Card hover: FAB appears top-right with 3 buttons
3. Hover each button: tooltip appears above ("Remove Route from Workspace", "View Route", "More Actions")
4. Click 3-dot: menu dropdown opens, FAB stays visible
5. Click outside: menu closes, FAB hides when mouse leaves card
6. Driver button dropdown still works independently
