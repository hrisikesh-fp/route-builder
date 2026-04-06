# Plan: Merge Modal — 2-Screen Flow (Separate Branch)

## Context

When 2+ routes are checked in the workspace FAB, clicking "Merge" opens a 2-screen modal. This is a new feature built on a **separate branch** (`feat/merge-modal`). Screen 1 = mode selection (Auto vs Manual). Screen 2 = Auto mode with truck selection.

## Branch

Create `feat/merge-modal` from current `main`.

## File to Create

`/components/merge-modal.tsx` — self-contained modal with both screens.

## Screen 1: Mode Selection

**Figma:** `213:48442` (default), `213:48024` (manual selected)

**Modal container:**
- Width: 640px, bg: `#1B1B1B`, borderRadius: 8px, padding: 24px, gap: 20px
- Shadow: `0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)`
- Overlay: fixed fullscreen, bg `rgba(0,0,0,0.6)`, backdrop-filter blur

**Header:**
- "Merge" — 18px, Geist medium, `#E5E5E5` + X button (24px, top-right)
- Subtext: "Choose how you'd like your routes to be merged and created." — 14px, `#A3A3A3`

**Cards (side by side, gap 12px):**
- Each card: flex:1, bg `#282828`, borderRadius 4px, padding `12px 16px`, gap 2px, overflow clip
- Title: 16px, `#FFFFFF`, normal weight, nowrap ellipsis
- Description: 14px, `#A3A3A3`, normal weight
- **Selected state:** bg `#1B1B1B`, border `2px solid #737373`
- **Default state:** bg `#282828`, no border
- **Auto card:** title "Auto", desc "Let the system build and optimise routes based on your truck selection"
- **Manual card:** title "Manual", desc "Manually merge selected routes and orders into one route"

**Footer:**
- Cancel button: opacity 0 initially (hidden until card selected), outline style, border `#333`, 36px height, padding `8px 16px`
- Continue button: bg `#E5E5E5`, color `#171717`, 36px height — disabled (opacity 0.5) until card selected

**State:** `selectedMode: "auto" | "manual" | null`

## Screen 2: Auto Mode — Truck Selection

**Figma:** `211:45299`

**Same modal shell, wider (approx 900–960px), content replaces Screen 1.**

**Header:**
- "Merge" + "Auto" pill badge (small, bg `#262626`, 12px)
- Subtext: "Select atleast one truck to create optimised routes automatically."

**Two-panel layout (gap 24px):**

### Left Panel: Selection Summary
- Label: "Selection Summary" — 14px, `#A3A3A3`
- Tabs: "Routes (N)" / "Orders (N)" — styled tabs with active underline
- Table (Routes tab):
  - Header row: "Truck (& Trailer)", "Driver", "Planned Qty & Orders" — 12px, `#737373`
  - Data rows: truck name (truncated) + trailer name below, driver name, planned qty + order count
  - Use data from `checkedRouteIds` → `mockRoutes` for each row

### Right Panel: Truck (& Trailer) Selector
- Label: "Truck (& Trailer)" — 14px, `#A3A3A3`
- **Empty state:** Truck icon + "Select from N available trucks" centered
- **With selection:** "X Added" label + chip per truck (name + X remove button), wrapping
- Search input: border `#333`, bg transparent, 14px, placeholder "Search Trucks"
- Truck list: scrollable, each row = checkbox + name + capacity + compartments + products + TypeBadge
  - Already-in-use trucks: pre-checked, muted, not removable
  - Available trucks: normal checkbox, clickable

**Footer:**
- Cancel button (left): outline, border `#333`
- Merge button (right): bg `#E5E5E5`, color `#171717`, disabled until 1+ truck selected

## Wiring in page.tsx / lasso-workspace-sheet.tsx

1. Add `isMergeModalOpen` state in `lasso-workspace-sheet.tsx`
2. FAB "Merge" button → `setIsMergeModalOpen(true)`
3. Render `<MergeModal>` at bottom of component, passing `checkedRouteIds`, `selectedOrders`, `onClose`

## Props

```ts
interface MergeModalProps {
  isOpen: boolean
  onClose: () => void
  checkedRouteIds: string[]
  selectedOrders: ExtractionOrder[]
}
```

## Mock Data for Screen 2

Reuse existing `TRUCKS` array from lasso-workspace-sheet.tsx (export it or duplicate top entries). Selection summary table populated from `mockRoutes` matched by `checkedRouteIds`.

## Verification

1. Check 2+ routes → FAB appears with Merge button
2. Click Merge → Screen 1 modal opens with blurred overlay
3. Select Auto-Route → card highlights with border, Continue enables
4. Click Continue → Screen 2 shows selection summary + truck selector
5. Select Manual → card highlights, Continue enables, clicking shows placeholder
6. Select trucks in Screen 2 → Merge button enables
7. X or Cancel closes modal at any screen
