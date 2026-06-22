# Dev Handoff — Driver Conflict Banner + Review & Assign Modal

**Repo:** `hrisikesh-fp/route-builder`
**Files:** `components/conflict-assignment-banner.tsx`, `components/conflict-resolution-modal.tsx`, `app/page.tsx`, `contexts/settings-context.tsx`
**Live:** https://route-builder-navy.vercel.app

---

## What this is

When a driver has been assigned to multiple routes on the same day, a banner appears at the top of the screen prompting the dispatcher to decide where each conflicting order goes. Orders are dragged from a "limbo" pool into one of the driver's routes. The banner tracks how many orders are still unresolved and disappears only when all are handled.

---

## Banner — `components/conflict-assignment-banner.tsx`

Sits at `top: 68` (below the nav), full width, `zIndex: 1100`.

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠  5 orders need route assignment                            │
│    2 drivers each have multiple routes, decide where each    │
│    order goes.                              Review & Assign → │
└──────────────────────────────────────────────────────────────┘
```

- Background: `#111`, inner card: `rgba(184,157,20,0.1)` with `1px solid rgba(234,179,8,0.5)` border
- Count is live — prop `orderCount: number` driven by `conflictOrdersRemaining` in `page.tsx`
- CTA opens the conflict resolution modal

**Props:**
```tsx
interface ConflictAssignmentBannerProps {
  orderCount: number
  onReviewAndAssign: () => void
}
```

---

## Modal — `components/conflict-resolution-modal.tsx`

Full-screen overlay modal, `width: 960`, `maxHeight: "min(720px, calc(100vh - 80px))"`.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Review & Assign Orders                                      ×  │
│  2 of 5 orders assigned — drag orders into a route to assign.   │
├──────────────────────────────────────────────────────────────── │
│                                                                  │
│  Mark Ruffalo  ·  2/3 Assigned                                   │
│  ┌────────────────────┐  ┌────────────────────────────────────┐  │
│  │ Orders to be       │  │ Routes                             │  │
│  │ Assigned           │  │                                    │  │
│  │ ┌────────────────┐ │  │ ┌──────────────────────────────┐  │  │
│  │ │ Elgin Concrete │ │  │ │ ▌ H-118 2019 Kenworth   6 Ord│  │  │
│  │ └────────────────┘ │  │ │   Mueller Construction       │  │  │
│  └────────────────────┘  │ └──────────────────────────────┘  │  │
│                           │ ┌──────────────────────────────┐  │  │
│                           │ │ ▌ H-218 Freightliner   7 Ord│  │  │
│                           │ │   Drop orders here           │  │  │
│                           │ └──────────────────────────────┘  │  │
│                           └────────────────────────────────────┘  │
│                                                                  │
│  Kyle Reese  ·  0/2 Assigned                                     │
│  [ same two-column pattern ]                                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Cancel                            Confirm & Assign 2 Orders →  │
└─────────────────────────────────────────────────────────────────┘
```

### Drag and drop

- Native HTML5 drag — `draggable`, `onDragStart`, `onDrop`
- `draggingIdRef` (useRef) stores the dragging order ID so `onDrop` can read it synchronously
- Drop targets: each `RouteDropZone` + the limbo drop zone per driver
- Dragging back to limbo: `onDrop` receives `"limbo"` as targetId → sets assignment to `null`
- `handleDragLeave` checks `relatedTarget` is outside the zone to avoid flicker

### CTA behaviour

- Disabled (opacity 0.4) when `assignedCount === 0`
- Label: `"Confirm & Assign"` (0 assigned) → `"Confirm & Assign 1 Order"` → `"Confirm & Assign 3 Orders"`
- On confirm: calls `onConfirm(totalOrders - assignedCount)` — passes back how many are still unassigned
- Banner stays visible if `unassignedCount > 0`; disappears only when all resolved

### Scroll

- Modal body: `flex: 1, overflowY: auto, minHeight: 0` — single scroll layer
- Driver sections grow freely; 720px modal cap means body scrolls between sections when tall

---

## State wiring — `app/page.tsx`

```tsx
const { showDriverConflict } = useSettings()
const [conflictOrdersRemaining, setConflictOrdersRemaining] = useState(5)
const [isConflictModalOpen, setIsConflictModalOpen] = useState(false)

// Re-arm when feature flag is toggled on
useEffect(() => {
  if (showDriverConflict) setConflictOrdersRemaining(5)
}, [showDriverConflict])

const isConflictBannerVisible = showDriverConflict && conflictOrdersRemaining > 0
const BANNER_HEIGHT = 95
const topOffset = isConflictBannerVisible ? BANNER_HEIGHT : 0
```

**Banner:**
```tsx
{isConflictBannerVisible && (
  <ConflictAssignmentBanner
    orderCount={conflictOrdersRemaining}
    onReviewAndAssign={() => setIsConflictModalOpen(true)}
  />
)}
```

**Modal:**
```tsx
<ConflictResolutionModal
  isOpen={isConflictModalOpen}
  onClose={() => setIsConflictModalOpen(false)}
  onConfirm={(unassignedCount) => {
    setIsConflictModalOpen(false)
    setConflictOrdersRemaining(unassignedCount)
  }}
/>
```

`topOffset` is passed to map, filter panel, workspace sheet, and map controls so they all shift down by `BANNER_HEIGHT` (95px) when the banner is visible.

---

## Feature flag — Settings modal

Toggle: **Settings → Driver Multi-Route Conflict** (switch)

```tsx
// contexts/settings-context.tsx
const DEFAULT_SHOW_DRIVER_CONFLICT = true

// Persisted in localStorage("showDriverConflict")
```

Turning it off hides the banner immediately. Turning it back on re-arms `conflictOrdersRemaining` to 5 so the scenario can be re-demoed.

---

## Mock data

```
// lib/mock-data.ts
Route 2 → driverId: "driver-1", driverName: "Mark Ruffalo"
Route 5 → driverId: "driver-4", driverName: "Kyle Reese"
```

Both drivers have 2 routes each — this triggers the conflict. The modal's `CONFLICT_GROUPS` constant is self-contained in the component (5 orders across 2 drivers, 4 routes total).

---

## Colors

| Element | Value |
|---|---|
| Banner bg (inner) | `rgba(184,157,20,0.1)` |
| Banner border | `rgba(234,179,8,0.5)` |
| Banner icon + text | `#eab308` |
| Modal bg | `#1b1b1b` |
| Route accent — purple | `#d8b4fe` |
| Route accent — blue | `#93c5fd` |
| Order card bg | `#282828` |
| Drop zone bg | `#111` |
