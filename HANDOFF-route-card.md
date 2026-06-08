# Dev Handoff — Route Card (Collapsed) Changes (RB-1.4)

**Branch:** `feat/improve-truck-selection`
**Repo:** `hrisikesh-fp/route-builder`
**Figma:** file `92PXGoRAv1nhR8GuMpspIU` — node `4084-100663` (Default / Hover / Expanded states)
**File:** `components/lasso-workspace-sheet.tsx` — component `RouteCardCollapsed` (starts ~line 320)
**Companion handoffs:** `HANDOFF-truck-dropdown.md`, `HANDOFF-validation-framework.md`

> Excludes the collapsed-card `borderRadius` tweak — that was a prototype-only fix, not for handoff.

---

## What changed

The collapsed route card now shows the **L1 capacity delta inline** on the truck specs row (Row 2), instead of relying on the orange Zone-B banner below the card. Hovering the delta shows a tooltip. The truck selector itself is now a dropdown (see `HANDOFF-truck-dropdown.md`); this doc is just the **collapsed card surface**.

---

## 1. L1 capacity delta — inline on the specs row

Row 2 (the `4,500 gal · 4 Compartments · 2 Products` line) now has a right-aligned delta: an arrow (↑ exceeds / ↓ below) + `{|diff|} gal`, in orange `#fb923c`, with a **dotted underline** treatment, and a tooltip on hover.

Anchor: `{/* Right: L1 capacity delta — dotted underline + hover tooltip */}` (~line 576).

```tsx
{validation && validation.l1.status !== "ok" && validation.l1.diff !== 0 && (
  <div style={{ position: "relative", flexShrink: 0, marginLeft: 8 }}
    onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect();
                           setDeltaTooltipPos({ x: r.left + r.width / 2, y: r.bottom }) }}
    onMouseLeave={() => setDeltaTooltipPos(null)}>
    <div style={{ display: "flex", alignItems: "center", gap: 4, cursor: "default" }}>
      {validation.l1.status === "exceeding"
        ? <ArrowUp size={16} color="#fb923c" />
        : <ArrowDown size={16} color="#fb923c" />}
      <span style={{
        fontSize: 14, fontWeight: 400, color: "#fb923c", lineHeight: "20px",
        textDecoration: "underline dotted", textDecorationColor: "#fb923c",
        textUnderlinePosition: "from-font", textDecorationSkipInk: "none",
        whiteSpace: "nowrap",
      }}>
        {Math.abs(validation.l1.diff).toLocaleString()} gal
      </span>
    </div>
    {/* tooltip — see §2 */}
  </div>
)}
```

**Critical detail:** the condition reads `validation.l1.diff` / `validation.l1.status` **directly** — NOT `collapsedBannerType === "orange"`. When L3 is also firing, `collapsedBannerType` becomes `"amber"`, but the L1 delta must still show. Likewise the delta text uses `Math.abs(validation.l1.diff)` directly, not `validation.collapsedBannerDelta` (which is `""` unless the banner type is orange). See `HANDOFF-validation-framework.md` §co-occurrence.

The "dotted line" is a native CSS `text-decoration: underline dotted` (not a border-bottom), color matched to the text, `text-decoration-skip-ink: none` so dots stay continuous.

---

## 2. The delta tooltip — fixed-position, escapes overflow

State (top of `RouteCardCollapsed`, ~line 389):
```ts
const [deltaTooltipPos, setDeltaTooltipPos] = useState<{ x: number; y: number } | null>(null)
```

The card has `overflow: hidden`, so the tooltip is rendered with **`position: fixed`** using the coordinates captured on hover. Anchor: `{deltaTooltipPos && (...)}` (~line 595). It uses the same **FAB tooltip component** (`#E5E5E5` bg, `#111` text, 12px, caret) but pointing **upward** (caret on top) since it sits below the delta:

```tsx
{deltaTooltipPos && (
  <div style={{ position: "fixed", top: deltaTooltipPos.y + 8, left: deltaTooltipPos.x,
                transform: "translateX(-50%)", display: "flex", flexDirection: "column",
                alignItems: "center", pointerEvents: "none", zIndex: 9999 }}>
    <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent", borderBottom: "6px solid #E5E5E5" }} />  {/* upward caret */}
    <div style={{ backgroundColor: "#E5E5E5", color: "#111", fontSize: 12, padding: "6px 12px",
                  borderRadius: 4, whiteSpace: "nowrap", fontFamily: "Geist, sans-serif" }}>
      {validation.l1.status === "exceeding" ? "Exceeds Truck Capacity" : "Below Truck Capacity"}
    </div>
  </div>
)}
```

> We tried the shadcn Radix `Tooltip` here first — it didn't fire reliably inside this DOM context. The plain hover-state + fixed-position div is the working approach and matches the rest of the app's custom tooltips.

---

## 3. Where the truck selector went

`RouteCardCollapsed` still renders the equipment pill (Config A–E, truck-only / truck+trailer(s) / no-truck), which on click opens the **dropdown** documented in `HANDOFF-truck-dropdown.md`. The old in-card `TruckHubCard` selector inside the **expanded** route view was removed — the expanded view now starts at the hub row + order list.

---

## Design tokens

```
L1 delta text/arrow:  #fb923c
Dotted underline:     text-decoration: underline dotted; color #fb923c; skip-ink none
Tooltip:              bg #E5E5E5, text #111, 12px Geist, caret triangle
Specs text:           14px #a3a3a3, 4px dot separators
```
