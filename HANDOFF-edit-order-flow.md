# Dev Handoff — Edit Order Flow Updates

**Branch merged to:** `main`
**Repo:** `hrisikesh-fp/route-builder`
**PR:** #4

All changes are in 5 files. Below is exactly what changed and where, so you can point Claude at the right sections to pull into your codebase.

---

## 1. Edit Order Modal — Customer/ShipTo Card Redesign

**File:** `components/create-order-modal.tsx`

The card that shows at the top of the **Edit Order** modal (read-only customer + address) was redesigned to match Figma.

**What changed** (lines ~1151–1195):
- Background: `#1F1F1F` with border → `#282828` with no border
- Border radius: `8` → `4`
- Padding: `16` → `"12px 16px"`
- Customer name and ShipTo name now sit on **one row** separated by a `4px` grey dot (instead of concatenated with a dash)
- MapPin icon: `14px / #737373` → `16px / #A3A3A3`

**Key JSX pattern** — row 1 layout:
```tsx
// customer name · dot · shipto name on same line
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <span style={{ fontSize: 16, fontWeight: 500, color: "#FFFFFF" }}>{customerName}</span>
  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#A3A3A3" }} />
  <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>{shipToName}</span>
</div>
// row 2: map pin + address
<div style={{ display: "flex", alignItems: "center", gap: 4, height: 16 }}>
  <MapPinSVG size={16} color="#A3A3A3" />
  <span style={{ fontSize: 14, color: "#A3A3A3" }}>{address}</span>
</div>
```

---

## 2. Pencil (Edit) Button on Order Card Hover FAB

**Files:**
- `components/lasso-workspace-sheet.tsx`
- `contexts/settings-context.tsx`
- `components/settings-modal.tsx`

When hovering an order card in the workspace, a **pencil icon** now appears before the 3-dot menu, giving one-click access to Edit Order.

### A. The FAB button (both condensed + detailed cards)

Both `OrderStopRowCondensed` (~line 2064) and `OrderStopRowDetailed` (~line 2524) now call:
```tsx
const { showEditInFab } = useSettings()
```

The pencil button is inserted **before** the MoreVertical button inside the `.order-fab` container (lines ~2332–2378 for condensed, ~2865–2941 for detailed):
```tsx
{showEditInFab && (
  <div
    style={{ position: "relative" }}
    onMouseEnter={/* show data-fab-tooltip */}
    onMouseLeave={/* hide data-fab-tooltip */}
  >
    <button onClick={() => onEditOrder?.(order)} style={{ width: 24, height: 24, ... }}>
      <Pencil size={14} />
    </button>
    {/* tooltip — same pattern as all other FAB tooltips */}
    <div data-fab-tooltip style={{ display: "none", position: "absolute", bottom: "calc(100% + 8px)", ... }}>
      <div style={{ backgroundColor: "#E5E5E5", color: "#111", fontSize: 12, padding: "6px 12px", borderRadius: 4 }}>
        Edit Order
      </div>
      <div style={{ /* downward caret triangle */ }} />
    </div>
  </div>
)}
```

**Mutual exclusivity:** The `Edit` item (+ its separator) in the 3-dot dropdown is wrapped with `{!showEditInFab && (...)}` — so it only shows when the pencil is turned off (lines ~2408 condensed, ~2941 detailed).

### B. Settings context — `showEditInFab`

**File:** `contexts/settings-context.tsx`

Added to `SettingsContextType` and `SettingsProvider`:
```ts
// New constant (line 11)
const DEFAULT_SHOW_EDIT_IN_FAB = true

// New state (line 40)
const [showEditInFab, setShowEditInFab] = useState<boolean>(DEFAULT_SHOW_EDIT_IN_FAB)

// localStorage load (line 52)
const storedEditInFab = localStorage.getItem("showEditInFab")
if (storedEditInFab !== null) setShowEditInFab(storedEditInFab === "true")

// Updater (line 67)
const updateShowEditInFab = (v: boolean) => {
  setShowEditInFab(v)
  localStorage.setItem("showEditInFab", String(v))
}
```

Add `showEditInFab` and `updateShowEditInFab` to the context value and the fallback return.

### C. Settings modal toggle

**File:** `components/settings-modal.tsx`

New toggle row inside the **Preferences** section (line ~381), using the existing `Switch` component:
```tsx
<Pencil className="w-5 h-5 text-[#A3A3A3]" />  // icon
// label: "Edit Button on Order Card"
// description: "Show a quick-edit pencil icon on order card hover. Opens the Edit Order modal directly."
<Switch
  checked={showEditInFab}
  onCheckedChange={updateShowEditInFab}
  className="data-[state=checked]:bg-[#6366F1] data-[state=unchecked]:bg-[#404040]"
/>
```

Settings modal also got **720px max-height + scrollable content** (lines 44 + 69):
```tsx
// modal container
style={{ maxHeight: "720px", display: "flex", flexDirection: "column" }}
// content div
style={{ overflowY: "auto", flex: 1 }}
```

---

## 3. Date Change Warning (Create Order from a Route)

**File:** `components/create-order-modal.tsx`

When the modal is opened **from a route** (`prefillDriverName` is set) and the user picks a different planned date, a confirmation dialog appears before applying the change.

### State + handler (lines ~891–901):
```tsx
const [pendingDate, setPendingDate] = useState<string | null>(null)
const isFromRoute = !!prefillDriverName && !isEdit

function handleDateChange(newDate: string) {
  if (isFromRoute && newDate !== plannedDate) {
    setPendingDate(newDate)   // show warning
  } else {
    setPlannedDate(newDate)   // apply directly
  }
}
```

Wire `handleDateChange` to the DatePicker: `<DatePicker value={plannedDate} onChange={handleDateChange} />`

### Dialog JSX (lines ~1464–1530, inside the `<>` fragment):
```tsx
{pendingDate && (
  <div style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "#1B1B1B", border: "1px solid #333", borderRadius: 4, padding: 24, maxWidth: 480, gap: 20, display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5" }}>Change Planned Date?</p>
      <p style={{ fontSize: 14, color: "#A3A3A3" }}>
        Changing the planned date to {formatDateOrdinal(pendingDate)} will move this order out from the route. Are you sure you want to proceed?
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={() => setPendingDate(null)}>Cancel</button>
        <button onClick={() => { setPlannedDate(pendingDate); setPendingDate(null) }}>Yes, Proceed Anyway</button>
      </div>
    </div>
  </div>
)}
```

**Helper** `formatDateOrdinal` (line 192) — formats `"2026-05-17"` → `"17th May 2026"`:
```ts
function ordinalSuffix(d: number) {
  if (d >= 11 && d <= 13) return "th"
  return ["th", "st", "nd", "rd", "th"][Math.min(d % 10, 4)]
}
function formatDateOrdinal(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const monthName = ["January",...][m - 1]
  return `${d}${ordinalSuffix(d)} ${monthName} ${y}`
}
```

---

## 4. Empty Order Warning (Create Order with No Quantities)

**File:** `components/create-order-modal.tsx`

Clicking "Create Order" with all quantities = 0 now shows a confirmation dialog instead of submitting silently. Edit mode is unaffected.

### Submit split + state (lines ~902, ~1069–1099):
```tsx
const [showEmptyOrderWarning, setShowEmptyOrderWarning] = useState(false)

// doSubmit = the actual submission logic (extracted from old handleSubmit)
const doSubmit = () => { /* ... calls onSubmit() then onClose() */ }

// handleSubmit = the gatekeeper
const handleSubmit = () => {
  if (!canSubmit) return
  if (totalQty === 0 && !isEdit) {
    setShowEmptyOrderWarning(true)  // show warning instead
    return
  }
  doSubmit()
}
```

### Dialog JSX (lines ~1401–1458, same pattern as date warning):
```tsx
{showEmptyOrderWarning && (
  <div style={{ position: "fixed", inset: 0, zIndex: 400, ... }}>
    <div style={{ backgroundColor: "#1B1B1B", border: "1px solid #333", borderRadius: 4, padding: 24, ... }}>
      <p style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5" }}>Create Order?</p>
      <p style={{ fontSize: 14, color: "#A3A3A3" }}>
        Are you sure you want to create an order without adding any asset and product details?
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={() => setShowEmptyOrderWarning(false)}>Cancel</button>
        <button onClick={() => { setShowEmptyOrderWarning(false); doSubmit() }}>Yes, Create</button>
      </div>
    </div>
  </div>
)}
```

---

## 5. Route Map Dasharray Console Error Fix

**File:** `components/route-map.tsx` (lines ~1090–1096)

The draw-in animation for route polylines was throwing a Mapbox console error (`line-dasharray[0] is less than minimum value 0`) due to sub-millisecond `performance.now()` jitter making `t` go slightly negative.

```tsx
// Before
const t = Math.min((now - start) / DRAW_MS, 1)

// After — clamp t ≥ 0, and guard both values
const t = Math.max(0, Math.min((now - start) / DRAW_MS, 1))
const dash = Math.max(0, eased * total)
const gap = Math.max(0, total - dash)
```

---

## Dialog Style Reference (used by both warning dialogs)

Both warning dialogs use the same pattern — just reuse this shell:

```tsx
// Overlay
<div style={{ position: "fixed", inset: 0, zIndex: 400, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Geist, system-ui, sans-serif" }}>
  // Card
  <div style={{ backgroundColor: "#1B1B1B", border: "1px solid #333", borderRadius: 4, padding: 24, display: "flex", flexDirection: "column", gap: 20, maxWidth: 480, width: "100%", margin: "0 24px", boxShadow: "0px 10px 15px rgba(0,0,0,0.1), 0px 4px 6px rgba(0,0,0,0.1)" }}>
    // Title
    <p style={{ margin: 0, fontSize: 18, fontWeight: 500, lineHeight: "28px", color: "#E5E5E5" }}>Title</p>
    // Body
    <p style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#A3A3A3" }}>Body text</p>
    // Footer
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      // Cancel (outline)
      <button style={{ height: 36, padding: "0 16px", background: "transparent", border: "1px solid #333", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#FAFAFA", cursor: "pointer" }}>Cancel</button>
      // Confirm (filled)
      <button style={{ height: 36, padding: "0 16px", background: "#E5E5E5", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 500, color: "#171717", cursor: "pointer" }}>Yes, Action</button>
    </div>
  </div>
</div>
```

---

## 6. Route Summary — Totals Block (Total Load Qty / Total Delivery Qty)

**File:** `components/balance-table-modal.tsx`

A totals block sits **below the balance table** inside the Route Summary modal. It shows two rows — **Total Load Qty** and **Total Delivery Qty** — with a grand total in the first column and per-product totals in each subsequent column. Columns align with the main table above using a shared `<colgroup>`.

**Figma node:** `4493:58735`

### Helper — `computeTypeTotals` (lines 61–78)

Splits orders into load (`orderType === "L"`) and delivery (everything else), sums per product:

```ts
function computeTypeTotals(
  orders: ExtractionOrder[],
  products: string[],
): { load: Record<string, number>; delivery: Record<string, number> } {
  const load: Record<string, number> = {}
  const delivery: Record<string, number> = {}
  for (const p of products) { load[p] = 0; delivery[p] = 0 }
  for (const o of orders) {
    const bucket = o.orderType === "L" ? load : delivery
    for (const pb of o.productBreakdown ?? []) {
      bucket[pb.product] = (bucket[pb.product] ?? 0) + pb.volume
    }
  }
  return { load, delivery }
}
```

### Usage in component (lines 220–222)

```ts
const { load: totalLoad, delivery: totalDelivery } = computeTypeTotals(orders, products)
const sumOf = (rec: Record<string, number>) =>
  products.reduce((acc, p) => acc + (rec[p] ?? 0), 0)
```

### Totals block JSX (lines 522–577)

Rendered immediately after the `</table>` closing tag of the main balance table, only when `products.length > 0`:

```tsx
{products.length > 0 && (
  <div style={{
    backgroundColor: "#282828",  // BG_STRIP
    borderRadius: 4,
    padding: 4,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  }}>
    {([
      { key: "load",     label: "Total Load Qty",     grand: sumOf(totalLoad),     per: totalLoad },
      { key: "delivery", label: "Total Delivery Qty",  grand: sumOf(totalDelivery), per: totalDelivery },
    ] as const).map((row, idx) => (
      <div key={row.key} style={{ width: "100%" }}>
        {/* dashed divider between the two rows */}
        {idx > 0 && <div style={{ borderTop: "1px dashed #333333", width: "100%" }} />}
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>
            <col />
            {products.map((p) => <col key={p} />)}
          </colgroup>
          <tbody>
            <tr>
              {/* First col: grand total (bold) + label (muted) stacked */}
              <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                    {fmtBalance(row.grand)}   {/* e.g. "5,000 gal" */}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#737373" }}>
                    {row.label}
                  </span>
                </div>
              </td>
              {/* Per-product cols */}
              {products.map((p) => (
                <td key={`${row.key}-${p}`}
                  style={{ height: 56, padding: "8px 12px", verticalAlign: "middle",
                           fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>
                  {fmtBalance(row.per[p] ?? 0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    ))}
  </div>
)}
```

### Formatting helper (line 106)

```ts
function fmtBalance(n: number): string {
  return `${n.toLocaleString()} gal`
}
```
