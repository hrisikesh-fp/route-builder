# Dev Handoff — Validation Framework (RB-1.4 changes)

**Branch:** `feat/improve-truck-selection`
**Repo:** `hrisikesh-fp/route-builder`
**Full reference (unchanged base):** `docs/validation-framework.md` — the complete 4-level / 4-surface spec. **Read that first.** This doc covers only what RB-1.4 *changed*.
**Engine:** `lib/capacity-validation.ts` (logic unchanged). **Surfaces:** `components/lasso-workspace-sheet.tsx`.
**Companion handoffs:** `HANDOFF-truck-dropdown.md`, `HANDOFF-route-card.md`

---

## The 4 severity levels (recap)

| Level | Meaning | Color |
|---|---|---|
| **L0** | Product incompatibility | red `#f87171` |
| **L1** | Total capacity over/under | orange `#fb923c` |
| **L2** | Per-product capacity | orange `#fb923c` |
| **L3** | Stop-by-stop runout | amber `#eab308` |

`validation.collapsedBannerType` resolves to one dominant `"red" | "amber" | "orange" | "none"` (red > amber > orange).

---

## WHAT CHANGED in RB-1.4

### Rule: L1 no longer appears as a route-card banner. Only L3 (amber) and L0 (red) do.

Previously the orange Zone-B banner sat below the collapsed card for L1/L2. Now:

- **L1 surfaces inline** — as the dotted-underline delta on the truck pill specs row (see `HANDOFF-route-card.md` §1) and as the warning strip inside the truck dropdown (see `HANDOFF-truck-dropdown.md` §8).
- **The route-card banner is suppressed for orange.** Only amber (L3) and red (L0) render as banners now.

### Where the change lives (`components/lasso-workspace-sheet.tsx`)

**1. Banner render guard** — added `&& validation.collapsedBannerType !== "orange"`. Anchor: `{/* Zone B: Banner — amber (L3) and red (L0) only ... */}` (~line 4505):
```tsx
{validation && validation.zoneB.visible
  && validation.collapsedBannerType !== "none"
  && validation.collapsedBannerType !== "orange"   // ← L1 no longer banners
  && (() => { /* ...banner... */ })()}
```

**2. `hasBanner` prop** passed to `RouteCardCollapsed` (~line 3840) — also excludes orange, so the card knows whether a banner sits below it:
```tsx
hasBanner={!!(validation && validation.zoneB.visible && validation.collapsedBannerType !== "orange")}
```

**3. Color-wedge radius** (the colored left bar, ~line 3825) uses the same condition so its corners stay in sync with the banner presence.

### Co-occurrence: L1 + L3 together

When a route has both an L1 capacity issue **and** L3 runouts, `collapsedBannerType === "amber"` (L3 wins the banner). The L1 delta must **still** show on the card + in the dropdown. So everywhere L1 surfaces, gate on **`validation.l1.status`** directly, never on `collapsedBannerType === "orange"`:

```tsx
// CORRECT — shows even when amber/red banner is dominant
validation.l1.status !== "ok" && validation.l1.diff !== 0
// WRONG — disappears whenever L3/L0 also present
validation.collapsedBannerType === "orange"
```

Same for the value: use `Math.abs(validation.l1.diff).toLocaleString()` directly — `validation.collapsedBannerDelta` is `""` unless the banner type is orange.

### Dropdown warning is always orange

The capacity strip inside the truck dropdown shows L1 in orange `#fb923c` **regardless** of whether L3/L0 are also firing (it's L1-specific, it does not inherit the dominant amber/red). Null-safe gate:
```tsx
const showWarning = !!currentTruck && !!validation && validation.l1.status !== "ok"
```
> `validation?.l1.status !== "ok"` is `true` when `validation` is `undefined` — always check `!!validation` first or it crashes (`Cannot read properties of null`).

---

## What did NOT change

- The engine `lib/capacity-validation.ts` — levels, diffs, stop indices, `collapsedBannerType` resolution: all the same.
- L3 amber banner + stop strips + Break CTA + connector line: unchanged (see `docs/validation-framework.md` Surfaces C & D).
- L0 red dominance over L3/L1: unchanged.
- Color tokens: unchanged.

---

## Net effect on each surface

| Surface | Before | After (RB-1.4) |
|---|---|---|
| Collapsed card banner | L0 red / L3 amber / **L1 orange** | L0 red / L3 amber only |
| Truck pill specs row | — | **L1 orange delta** (dotted underline + tooltip) |
| Truck dropdown | — | **L1 orange warning strip** (top of dropdown) |
| Order stop strips (L3/L0) | unchanged | unchanged |
