# Plan: Inline Loading State for Route Optimisation

## Context
Currently, clicking the optimise icon button (Sparkles) on a route card or "Optimise Route" in the 3-dot dropdown opens the full MergeModal in `optimise` mode. Since the truck is already selected on the card, the modal step is redundant — the user wants the optimisation to run **inline within the route card itself**, with a subtle loading overlay matching Figma node `419-120716`.

Optimise should also be **disabled** for routes without a truck selected (no fallback to modal — just disabled).

## Files to modify
- `components/lasso-workspace-sheet.tsx` (only)

## Trigger scope (all three switch to inline)
1. Sparkles icon button on the route card FAB (~line 569)
2. "Optimise Route" item in the 3-dot dropdown (~line 660)
3. Bottom workspace FAB's "Optimise" CTA when a single route is checked

For all three: when a truck is selected on the route → run inline loading on that card. MergeModal is no longer used for any single-route optimise flow.

## No-truck behavior
The Sparkles icon button **and** the "Optimise Route" dropdown item are **removed entirely** (not dimmed) when the route has no truck. Same rule applies to the FAB CTA — if the single checked route has no truck, the "Optimise" button doesn't render in the FAB.

## Design (per Figma 419-120716)
The overlay replaces the route card's content while keeping the 6px coloured left wedge visible.

- **Card bg:** `#282828`, height `130px` (matches existing collapsed card height)
- **Left wedge:** preserved (6px wide, route colour, e.g. `#D8B4FE`)
- **Centred content** (column, gap 12px, padding `16px 16px 12px 20px`):
  - Row (gap 8px, centred): 40×40 spinner icon + "Optimising Routes…" (16px medium `#FAFAFA`)
  - "Evaluating orders across truck selection…" (14px normal `#A3A3A3`, centred)
  - Cancel button — Outline sm, 32px tall, padding `8px 12px`, border `#333`, text `#FAFAFA`

## Implementation

### 0. Save this plan to the project for future reference
Copy this plan to `docs/plans/optimise-inline-loading-state.md` so it lives alongside the research docs and can be revisited later. (Currently `docs/plans/` does not exist — create it.)

### 1. Add inline-loading state in `LassoWorkspaceSheet` (~line 2588)
```ts
const [optimisingInlineRouteId, setOptimisingInlineRouteId] = useState<string | null>(null)
const [optimisingPhaseIndex, setOptimisingPhaseIndex] = useState(0)
```

Reuse the existing 5-phase array from `merge-modal.tsx:218-224`:
```
2500ms — Evaluating orders across truck selection…
2200ms — Applying compartment constraints…
2000ms — Checking product compatibility…
2500ms — Optimising stop sequences…
2000ms — Finalising routes…   (total 11.2s)
```

A `useEffect` keyed on `optimisingInlineRouteId` chains `setTimeout`s through the phases. On completion: clear state, call `onShowMessage("Route optimised with N orders")`. Cleanup cancels timers if id is cleared (Cancel) or unmounts.

### 2. Update `RouteCardCollapsed` props (~line 224)
Add:
- `isOptimising?: boolean` — drives the overlay
- `onCancelOptimise?: () => void` — wired to Cancel button
- (already has `hasTruck` — reuse for disabling triggers)

### 3. Hide optimise triggers when `!hasTruck`
- **Sparkles icon button wrapper (~line 568):** wrap in `{hasTruck && (...)}` so the entire button (and its tooltip wrapper) is removed from the FAB row when no truck.
- **Dropdown "Optimise Route" item (~line 659):** wrap in `{hasTruck && (...)}` so the row doesn't render. (Driver / separator / View Route / Remove / Unassign Route still render normally.)
- **Bottom workspace FAB "Optimise" CTA (single route checked):** wrap the Optimise button in `{hasTruckForCheckedRoute && (...)}`. Compute `hasTruckForCheckedRoute` from the same `selectedTrucks[routeId]` / route truck data already used to set `hasTruck` on the card.

### 4. Render inline overlay inside the card's relative wrapper (~line 3090)
The card body is already wrapped in `<div style={{ position: "relative" }}>` containing the wedge + `RouteCardCollapsed`. Add a sibling overlay rendered when `isOptimising`:

```jsx
{isOptimising && (
  <div style={{
    position: "absolute", inset: 0, paddingLeft: 6,  /* preserve wedge */
    display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: "#282828", borderRadius: 4,
    opacity: 1, transform: "scale(1)",
    animation: "rb-overlay-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both",
    overflow: "hidden",
  }}>
    {/* shimmer pseudo-layer (subtle) */}
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)",
      backgroundSize: "200% 100%",
      animation: "rb-shimmer 2s linear infinite",
    }} />
    {/* content: spinner + title row, subtitle, cancel */}
  </div>
)}
```

Inject keyframes once at the top of the file (or use a small `<style>` tag in this component):
```css
@keyframes rb-overlay-in {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes rb-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
@keyframes rb-spin {
  to { transform: rotate(360deg); }
}
```

### 5. Phase-text crossfade
Wrap the subtitle in a keyed div so React remounts on phase change. Apply a 180ms ease transition with `opacity` + `filter: blur(2px)` on enter (per Emil's blur principle for crossfades). Keyframe entry: `opacity 0 + blur(2px) → opacity 1 + blur(0)`.

### 6. Spinner
Reuse the existing SVG spinner pattern from `merge-modal.tsx` (~line 689) at 40×40, `#A3A3A3`, `animation: rb-spin 1s linear infinite`. (Per Emil: a faster spinner makes the action feel faster — keep at 1s.)

### 7. Cancel handler
On Cancel click: `setOptimisingInlineRouteId(null)` — the cleanup in the `useEffect` cancels the pending timers. The overlay fades out (apply `data-exiting` attribute and an exit keyframe of 150ms ease-out), then unmounts.

### 8. Wire into existing `onOptimise` handler (~line 3153)
Replace:
```ts
onOptimise={() => {
  setOptimiseRouteId(routeId)
  setMergeModalMode("optimise")
  setIsMergeModalOpen(true)
  setMenuRouteId(null)
}}
```
With:
```ts
onOptimise={() => {
  if (!hasTruck) return  // safety; trigger isn't rendered when !hasTruck
  setOptimisingInlineRouteId(routeId)
  setOptimisingPhaseIndex(0)
  setMenuRouteId(null)
}}
isOptimising={optimisingInlineRouteId === routeId}
onCancelOptimise={() => setOptimisingInlineRouteId(null)}
```

### 9. Wire bottom FAB "Optimise" CTA to inline as well
Find the bottom workspace FAB block (single-route Optimise variant). Its Optimise button currently calls the same modal-opening flow. Change its `onClick` to:
```ts
() => {
  const routeId = checkedRouteIds[0]
  setOptimisingInlineRouteId(routeId)
  setOptimisingPhaseIndex(0)
  onCheckedRoutesChange([])  // clear selection so FAB collapses
}
```
Wrap the Optimise button render in `{hasTruckForCheckedRoute && ...}` so it disappears when the single checked route has no truck.

## Animation principles applied (Emil's skill)
| Decision | Why |
| --- | --- |
| Overlay enters with `scale(0.97) → 1` + opacity, 200ms strong ease-out | Never animate from `scale(0)`; entry should feel responsive |
| Subtle shimmer at 2s linear, ~4% white | Decorative motion — must stay quiet; linear keeps continuous motion natural |
| Phase-text crossfade uses blur(2px) | Bridges visual gap between two text states (Emil's blur-mask principle) |
| Spinner at 1s linear infinite | Faster spinner = perceived speed |
| Exit at 150ms ease-out, faster than 200ms enter | Asymmetric: response is snappier than entry |
| CSS animations (not Framer) | Off main thread, smooth even when JS busy |

## Verification
- Route with truck → click Sparkles or dropdown "Optimise Route" → modal does **not** open; card content is replaced by overlay (spinner + "Optimising Routes…" + subtitle + Cancel) with subtle shimmer
- Phase subtitle text changes through the 5 phases over ~11.2s with smooth blur crossfade
- After phase 5: overlay fades out, success toast "Route optimised with N orders"
- Click Cancel mid-flow → overlay fades out immediately, route returns to normal state, no toast
- Route **without truck** (Config E): Sparkles icon button is **not rendered** in the FAB row; "Optimise Route" item is **not rendered** in the 3-dot dropdown; if that route is the only one checked, the FAB's "Optimise" button is also **not rendered**
- Single-route check → FAB "Optimise" CTA also runs inline on the card (no modal)
- Multi-route check → FAB "Merge" CTA still opens MergeModal (unchanged — merge flow is separate)
- 3-dot dropdown grouping from previous task remains intact
