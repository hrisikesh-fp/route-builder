# CSS Accordion + Modal Scroll — What Works and What Breaks

## The bug that kept happening

An accordion card (expand/collapse) with `overflow: hidden` on the outer wrapper was clipping content. Only some rows would show even though `maxHeight: 9999` was set on the animation div. The modal body scroll wasn't working either.

---

## Root cause 1 — `overflow: hidden` on the OUTER card clips content

**Never put `overflow: hidden` on the outer wrapper of an accordion card.**

`overflow: hidden` clips anything that visually extends past the element's computed bounding box. When an animated inner div (using `max-height` or `grid-template-rows`) is still transitioning or has a height that the browser calculates slightly differently than expected, the outer `overflow: hidden` silently eats the bottom content.

**The fix:** Apply `overflow: hidden` ONLY on the direct animation wrapper — the div whose `max-height` transitions from `0` to a large number. The outer card should have NO `overflow: hidden`.

To keep border-radius working without `overflow: hidden` on the outer:
- Give the header `borderRadius: "4px 4px 0 0"` (top corners only when expanded, all corners when collapsed)
- Give the body `borderRadius: "0 0 4px 4px"` (bottom corners)
- Give the accent rail `borderTopLeftRadius: 4, borderBottomLeftRadius: expanded ? 0 : 4`

```jsx
// ✅ CORRECT
<div style={{ position: "relative", borderRadius: 4 }}>  {/* NO overflow: hidden */}
  <div style={{ /* header */ borderRadius: expanded ? "4px 4px 0 0" : 4 }} />
  <div style={{ overflow: "hidden", maxHeight: expanded ? 9999 : 0, transition: "max-height 300ms ..." }}>
    <div style={{ /* body */ borderRadius: "0 0 4px 4px" }} />
  </div>
</div>

// ❌ BROKEN
<div style={{ position: "relative", borderRadius: 4, overflow: "hidden" }}>
  <div style={{ /* header */ }} />
  <div style={{ overflow: "hidden", maxHeight: expanded ? 9999 : 0 }}>
    <div style={{ /* body */ }} />
  </div>
</div>
```

---

## Root cause 2 — `grid-template-rows: 1fr` breaks in auto-sized containers

The grid accordion pattern (`0fr → 1fr`) is commonly shown in tutorials but it only works when the **grid container has a definite height**. In an auto-sized container (no fixed height), `1fr` resolves to **0** because there is no free space to distribute.

This causes content to be clipped or invisible even with `min-height: 0` set correctly.

**The fix:** Use `max-height` transitions instead of `grid-template-rows`.

```jsx
// ✅ CORRECT — max-height transition
<div style={{ overflow: "hidden", maxHeight: expanded ? 9999 : 0, transition: "max-height 300ms ease" }}>
  <div>{/* content */}</div>
</div>

// ❌ BROKEN in auto-sized containers
<div style={{ display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr", transition: "grid-template-rows 300ms ease" }}>
  <div style={{ overflow: "hidden", minHeight: 0 }}>{/* content */}</div>
</div>
```

**Important:** Do NOT use `max-height: 9999`. The easing curve maps to the full 0→9999 range. If content is 300px, the visible animation finishes in ~3% of the duration — the ease-in-out is invisible. Use a realistic value close to the expected content height (e.g. `600` for a card body, `400` for a table).

---

## Root cause 3 — `maxHeight` on a flex modal doesn't enable body scroll

When a flex modal uses `maxHeight` (not `height`), flex children don't have a **definite size** to calculate against. `flex: 1` on the body doesn't know what "1 fraction" of an indefinite space is, so the body grows to fit content and never scrolls.

**The fix:** Use `height` (not `maxHeight`) on the modal outer container to give it a definite size.

```jsx
// ✅ CORRECT — definite height, body scrolls
<div style={{ height: "min(720px, calc(100vh - 80px))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
  <div style={{ flexShrink: 0 }}>{/* header */}</div>
  <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{/* body — scrolls */}</div>
  <div style={{ flexShrink: 0 }}>{/* footer */}</div>
</div>

// ❌ BROKEN — maxHeight alone, body never scrolls
<div style={{ maxHeight: 720, display: "flex", flexDirection: "column", overflow: "hidden" }}>
  <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{/* body — does NOT scroll */}</div>
</div>
```

BUT: `height: 720px` makes the modal always 720px tall even when content is short. To auto-size AND scroll when tall, use the shrink pattern:

```jsx
// ✅ Auto-sizes when short, scrolls when tall
<div style={{ maxHeight: "min(720px, calc(100vh - 80px))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
  <div style={{ flexShrink: 0 }}>{/* header */}</div>
  <div style={{ flexShrink: 1, minHeight: 0, overflowY: "auto" }}>{/* body — shrinks + scrolls */}</div>
  <div style={{ flexShrink: 0 }}>{/* footer */}</div>
</div>
```

`flexShrink: 1` (no `flex: 1`, no `flex-grow`) means: the body grows to its natural height, but when the modal hits `maxHeight`, the body is the only thing that can shrink. It shrinks until the modal fits, and `overflowY: auto` activates on the now-constrained body.

---

## Always `minHeight: 0` on scrollable flex children

Any flex child that needs to scroll MUST have `minHeight: 0`. Without it, the browser's default `min-height: auto` prevents the child from ever shrinking below its content height, breaking scroll.

```jsx
// Required pattern for a scrollable flex child
<div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
```

---

## Summary checklist for accordion + scroll modals

- [ ] Outer accordion card: **no `overflow: hidden`** — border-radius per section instead
- [ ] Animation wrapper: `overflow: hidden` + `max-height: 0 → 9999` transition
- [ ] No `grid-template-rows: 1fr` in auto-sized containers — use `max-height` instead
- [ ] Modal that must scroll: use `height` (definite) not `maxHeight` alone
- [ ] Modal that must auto-size + scroll when tall: `maxHeight` + `flexShrink: 1` + `minHeight: 0` on body (no `flex-grow`)
- [ ] Every scrollable flex child: `minHeight: 0`
