"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSettings } from "@/contexts/settings-context"
import { X, ChevronDown, ChevronLeft, ChevronRight, RotateCw, Search, Package, Calendar, Clock, Maximize2, Minimize2 } from "lucide-react"
import { mockExtractionOrders, shipTosWithoutOrders, mockHubs, mockDrivers } from "@/lib/mock-data"

// ─── Derived customer + shipTo data ──────────────────────────────────────────

type CustomerRef = { id: string; name: string }
type ShipToRef = {
  id: string
  customerId: string
  customerName: string
  shipToName?: string
  shipToAddress: string
  latitude: number
  longitude: number
  city: string
  state: string
  zip: string
  tankSize: number
  zone: string
}

function buildCustomerAndShipToIndex() {
  const customerById = new Map<string, CustomerRef>()
  const shipTosByCustomer = new Map<string, ShipToRef[]>()

  const addShipTo = (s: ShipToRef) => {
    if (!customerById.has(s.customerId)) {
      customerById.set(s.customerId, { id: s.customerId, name: s.customerName })
    }
    const list = shipTosByCustomer.get(s.customerId) ?? []
    if (!list.some((existing) => existing.shipToAddress === s.shipToAddress)) {
      list.push(s)
    }
    shipTosByCustomer.set(s.customerId, list)
  }

  for (const o of mockExtractionOrders) {
    if (o.orderType && o.orderType !== "D") continue
    addShipTo({
      id: `${o.customerId}__${o.shipToAddress}`,
      customerId: o.customerId,
      customerName: o.customerName,
      shipToName: o.shipToName,
      shipToAddress: o.shipToAddress,
      latitude: o.latitude,
      longitude: o.longitude,
      city: o.city,
      state: o.state,
      zip: o.zip,
      tankSize: o.tankSize,
      zone: o.zone,
    })
  }
  for (const s of shipTosWithoutOrders) {
    addShipTo({
      id: s.id,
      customerId: s.customerId,
      customerName: s.customerName,
      shipToName: s.shipToName,
      shipToAddress: s.shipToAddress,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      state: s.state,
      zip: s.zip,
      tankSize: s.tankSize,
      zone: s.zone,
    })
  }

  const customers = Array.from(customerById.values()).sort((a, b) => a.name.localeCompare(b.name))
  return { customers, shipTosByCustomer }
}

// ─── Asset row (dynamic — derived from selected ShipTo's order data) ──────────

type AssetRow = {
  id: string
  name: string        // product name ("Diesel", "DEF") or "Tank"
  tmProvider: string  // "Anova" for now
  tmInventory: number // 0–100
  capacity: number    // gal
  ullage: number      // gal
}

function buildAssetRows(shipToKey: string | null): AssetRow[] {
  if (!shipToKey) return []

  const order = mockExtractionOrders.find(
    (o) => `${o.customerId}__${o.shipToAddress}` === shipToKey,
  )

  if (!order) {
    const st = shipTosWithoutOrders.find((s) => s.id === shipToKey)
    if (!st) return []
    const cap = st.tankSize
    return [{ id: `${shipToKey}__tank`, name: "Tank", tmProvider: "Anova", tmInventory: 0, capacity: cap, ullage: cap }]
  }

  if (order.productBreakdown && order.productBreakdown.length > 0) {
    const inv = order.currentLevel
    const cap = order.tankSize
    return order.productBreakdown.map((pb, i) => ({
      id: `${shipToKey}__${pb.product}__${i}`,
      name: String(pb.product),
      tmProvider: "Anova",
      tmInventory: inv,
      capacity: cap,
      ullage: Math.round(cap * (1 - inv / 100)),
    }))
  }

  const inv = order.currentLevel
  const cap = order.tankSize
  return [{
    id: `${shipToKey}__tank`,
    name: "Tank",
    tmProvider: "Anova",
    tmInventory: inv,
    capacity: cap,
    ullage: Math.round(cap * (1 - inv / 100)),
  }]
}

function inventoryColor(pct: number): string {
  if (pct <= 25) return "#EF4444"
  if (pct <= 50) return "#FBBF24"
  return "#10B981"
}

// ─── Public submit shape ─────────────────────────────────────────────────────

export type CreateOrderSubmit = {
  customerId: string
  customerName: string
  shipToName?: string
  shipToAddress: string
  latitude: number
  longitude: number
  city: string
  state: string
  zip: string
  zone: string
  scheduledDateTimeISO: string
  scheduledTimeLabel: string
  volume: number
  driverId?: string
  driverName?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateOrderSubmit) => void
  prefillShipToId?: string | null
  /** When set (route entry point), Driver field shows as read-only. */
  prefillDriverName?: string | null
  /** Expand icon: modal3 → modal1. Shown only when createOrderModalView === "modal3". */
  onExpandToModal?: () => void
  /** Collapse icon: modal1/2 → modal3. Shown only when createOrderModalView !== "modal3". */
  onCollapseToDrawer?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number) {
  return String(n).padStart(2, "0")
}
function todayDateInputValue() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
function nowTimeInputValue() {
  const d = new Date()
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
function formatTimeLabel(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":")
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? "PM" : "AM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${pad2(h)}:${mStr} ${period}`
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3", lineHeight: "20px" }}>
      {children}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 16, fontWeight: 300, color: "#E5E5E5", lineHeight: "24px" }}>
      {children}
    </span>
  )
}

function Toggle({
  on,
  onChange,
  size = "md",
}: {
  on: boolean
  onChange: () => void
  size?: "sm" | "md"
}) {
  const trackW = size === "md" ? 36 : 28
  const trackH = size === "md" ? 20 : 16
  const thumbSz = size === "md" ? 16 : 12
  const thumbOffset = on ? trackW - thumbSz - 2 : 2
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: trackW,
        height: trackH,
        borderRadius: 9999,
        backgroundColor: on ? "#E5E5E5" : "#333",
        border: "none",
        padding: 0,
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 150ms",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: thumbOffset,
          width: thumbSz,
          height: thumbSz,
          borderRadius: "50%",
          backgroundColor: on ? "#171717" : "#737373",
          transition: "left 150ms",
        }}
      />
    </button>
  )
}

// ─── Searchable dropdown ──────────────────────────────────────────────────────

function Dropdown({
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  value: string | null
  placeholder: string
  options: { id: string; label: string }[]
  disabled?: boolean
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) { setQuery(""); return }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 300) {
        // open upward — anchor to top of trigger
        setPanelStyle({ top: "auto", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width })
      } else {
        setPanelStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width })
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const selectedLabel = useMemo(() => options.find((o) => o.id === value)?.label ?? null, [options, value])
  const filtered = useMemo(
    () => query.trim() ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options,
    [options, query],
  )

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          width: "100%",
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          backgroundColor: "transparent",
          border: "1px solid #333",
          borderRadius: 4,
          color: selectedLabel ? "#E5E5E5" : "#737373",
          fontSize: 14,
          fontWeight: 400,
          textAlign: "left",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          fontFamily: "inherit",
          overflow: "hidden",
          outline: "none",
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            ...panelStyle,
            backgroundColor: "#282828",
            border: "1px solid #333",
            borderRadius: 4,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            zIndex: 9999,
            maxHeight: 240,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid #282828", flexShrink: 0 }}>
            <Search size={14} color="#737373" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "#E5E5E5", fontSize: 14, fontFamily: "inherit" }}
            />
          </div>
          <div style={{ overflowY: "auto", padding: 4 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 8px", fontSize: 13, color: "#737373" }}>No matches</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(o.id); setOpen(false) }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    backgroundColor: o.id === value ? "rgba(255,255,255,0.06)" : "transparent",
                    color: "#E5E5E5",
                    fontSize: 14,
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = o.id === value ? "rgba(255,255,255,0.06)" : "transparent")}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: checked ? "1px solid #E5E5E5" : "1px solid #333",
          backgroundColor: checked ? "#E5E5E5" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path d="M2 7l3.5 3.5L12 4" stroke="#171717" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: 16, fontWeight: 300, color: "#E5E5E5", lineHeight: "24px" }}>{label}</span>
    </button>
  )
}

// ─── Text input (styled to match) ────────────────────────────────────────────

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 12px",
        backgroundColor: "transparent",
        border: "1px solid #333",
        borderRadius: 4,
        color: "#E5E5E5",
        fontSize: 14,
        outline: "none",
        fontFamily: "inherit",
      }}
    />
  )
}

// ─── DatePicker + TimePicker constants ───────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const TP_ITEM_H = 32

// ─── DatePicker ───────────────────────────────────────────────────────────────

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`

  const [viewYear, setViewYear] = useState(() =>
    value ? parseInt(value.split("-")[0], 10) : today.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState(() =>
    value ? parseInt(value.split("-")[1], 10) - 1 : today.getMonth()
  )

  const displayLabel = useMemo(() => {
    if (!value) return "Select Date"
    const [y, mo, d] = value.split("-").map(Number)
    return `${MONTH_NAMES[mo - 1].slice(0, 3)} ${d}, ${y}`
  }, [value])

  useEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      if (window.innerHeight - rect.bottom < 320) {
        setPanelStyle({ bottom: window.innerHeight - rect.top + 4, left: rect.left })
      } else {
        setPanelStyle({ top: rect.bottom + 4, left: rect.left })
      }
    }
    if (value) {
      setViewYear(parseInt(value.split("-")[0], 10))
      setViewMonth(parseInt(value.split("-")[1], 10) - 1)
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const prevDays = new Date(viewYear, viewMonth, 0).getDate()
    const cells: { date: string; day: number; inMonth: boolean }[] = []

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i
      const m = viewMonth === 0 ? 11 : viewMonth - 1
      const y = viewMonth === 0 ? viewYear - 1 : viewYear
      cells.push({ date: `${y}-${pad2(m + 1)}-${pad2(d)}`, day: d, inMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}`, day: d, inMonth: true })
    }
    for (let d = 1; cells.length < 42; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1
      const y = viewMonth === 11 ? viewYear + 1 : viewYear
      cells.push({ date: `${y}-${pad2(m + 1)}-${pad2(d)}`, day: d, inMonth: false })
    }
    return cells
  }, [viewYear, viewMonth])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", backgroundColor: "transparent", border: "1px solid #333",
          borderRadius: 4, color: value ? "#E5E5E5" : "#737373", fontSize: 14,
          textAlign: "left", cursor: "pointer", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
        }}
      >
        <Calendar size={14} color="#A3A3A3" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayLabel}</span>
        <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: "fixed", ...panelStyle,
            backgroundColor: "#282828", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4, padding: 12, zIndex: 9999, width: 252,
          }}
        >
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button type="button" onClick={prevMonth}
              style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#A3A3A3", borderRadius: 2, padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            ><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#E5E5E5" }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth}
              style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#A3A3A3", borderRadius: 2, padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            ><ChevronRight size={14} /></button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 2 }}>
            {DAY_HEADERS.map(h => (
              <div key={h} style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#737373" }}>{h}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {calendarDays.map(cell => {
              const isSelected = cell.date === value
              const isToday = cell.date === todayStr
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => { onChange(cell.date); setOpen(false) }}
                  style={{
                    height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: isSelected ? 500 : 400,
                    color: isSelected ? "#171717" : !cell.inMonth ? "#A3A3A3" : "#FAFAFA",
                    backgroundColor: isSelected ? "#E5E5E5" : "transparent",
                    border: isToday && !isSelected ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                    borderRadius: 4, cursor: "pointer", fontFamily: "inherit", padding: 0,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? "#E5E5E5" : "transparent" }}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const hourScrollRef = useRef<HTMLDivElement>(null)
  const minScrollRef = useRef<HTMLDivElement>(null)

  const [draftH, setDraftH] = useState(() => value ? parseInt(value.split(":")[0], 10) : new Date().getHours())
  const [draftM, setDraftM] = useState(() => value ? parseInt(value.split(":")[1], 10) : new Date().getMinutes())

  const draftStr = `${pad2(draftH)}:${pad2(draftM)}`
  const hasChange = !value || value !== draftStr

  const displayLabel = useMemo(() => {
    if (!value) return "Select Time"
    return formatTimeLabel(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      if (window.innerHeight - rect.bottom < 280) {
        setPanelStyle({ bottom: window.innerHeight - rect.top + 4, left: rect.left })
      } else {
        setPanelStyle({ top: rect.bottom + 4, left: rect.left })
      }
    }
    const h = value ? parseInt(value.split(":")[0], 10) : new Date().getHours()
    const m = value ? parseInt(value.split(":")[1], 10) : new Date().getMinutes()
    setDraftH(h)
    setDraftM(m)
    requestAnimationFrame(() => {
      if (hourScrollRef.current) hourScrollRef.current.scrollTop = h * TP_ITEM_H
      if (minScrollRef.current) minScrollRef.current.scrollTop = m * TP_ITEM_H
    })
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const colScrollStyle: React.CSSProperties = { maxHeight: 160, overflowY: "auto", scrollbarWidth: "none" }

  const colLabelStyle: React.CSSProperties = {
    height: 32, display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 500, color: "#A3A3A3",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  }

  function renderScrollItem(n: number, selected: boolean, onClick: () => void) {
    return (
      <button key={n} type="button" onClick={onClick}
        style={{
          width: "100%", height: TP_ITEM_H, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: selected ? 500 : 400,
          color: selected ? "#E5E5E5" : "#FAFAFA",
          backgroundColor: selected ? "#333" : "transparent",
          border: "none", borderRadius: 2, cursor: "pointer", fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)" }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selected ? "#333" : "transparent" }}
      >
        {pad2(n)}
      </button>
    )
  }

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", backgroundColor: "transparent", border: "1px solid #333",
          borderRadius: 4, color: value ? "#E5E5E5" : "#737373", fontSize: 14,
          textAlign: "left", cursor: "pointer", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
        }}
      >
        <Clock size={14} color="#A3A3A3" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayLabel}</span>
        <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: "fixed", ...panelStyle,
            backgroundColor: "#282828", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4, zIndex: 9999, width: 200, overflow: "hidden",
          }}
        >
          <div style={{ display: "flex" }}>
            {/* Hours */}
            <div style={{ flex: 1 }}>
              <div style={colLabelStyle}>Hours</div>
              <div ref={hourScrollRef} className="tp-col" style={colScrollStyle}>
                {Array.from({ length: 24 }, (_, h) => renderScrollItem(h, h === draftH, () => setDraftH(h)))}
              </div>
            </div>
            <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
            {/* Minutes */}
            <div style={{ flex: 1 }}>
              <div style={colLabelStyle}>Minutes</div>
              <div ref={minScrollRef} className="tp-col" style={colScrollStyle}>
                {Array.from({ length: 60 }, (_, m) => renderScrollItem(m, m === draftM, () => setDraftM(m)))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", gap: 8, padding: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button type="button"
              onClick={() => { onChange(""); setOpen(false) }}
              style={{
                flex: 1, height: 32, fontSize: 13, fontWeight: 500, color: "#E5E5E5",
                backgroundColor: "transparent", border: "1px solid #333", borderRadius: 4,
                cursor: "pointer", fontFamily: "inherit",
                opacity: hasChange ? 1 : 0, pointerEvents: hasChange ? "auto" : "none",
                transition: "opacity 150ms",
              }}
            >Clear</button>
            <button type="button"
              onClick={() => { onChange(draftStr); setOpen(false) }}
              style={{
                flex: 1, height: 32, fontSize: 13, fontWeight: 500, color: "#171717",
                backgroundColor: "#E5E5E5", border: "none", borderRadius: 4,
                cursor: hasChange ? "pointer" : "default", fontFamily: "inherit",
                opacity: hasChange ? 1 : 0.5, transition: "opacity 150ms",
              }}
            >Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Faux checkbox (non-interactive, table header / row) ──────────────────────

function FauxCheckbox() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.15)",
        backgroundColor: "rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}
    />
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

const PO_TYPE_OPTIONS = [
  { id: "standard", label: "Standard" },
  { id: "emergency", label: "Emergency" },
  { id: "spot", label: "Spot" },
]

export function CreateOrderModal({ isOpen, onClose, onSubmit, prefillShipToId, prefillDriverName, onExpandToModal, onCollapseToDrawer }: Props) {
  const { customers, shipTosByCustomer } = useMemo(buildCustomerAndShipToIndex, [])
  const { createOrderModalView } = useSettings()

  // ── Customer / ShipTo
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [shipToKey, setShipToKey] = useState<string | null>(null)

  // ── Schedule
  const [plannedDate, setPlannedDate] = useState<string>(todayDateInputValue())
  const [plannedTime, setPlannedTime] = useState<string>(nowTimeInputValue())
  const [markUrgent, setMarkUrgent] = useState(false)

  // ── Order type toggle
  const [orderType, setOrderType] = useState<"delivery" | "extraction">("delivery")

  // ── Delivery Order
  const [tankQuantities, setTankQuantities] = useState<Record<string, string>>({})
  const [topOffMaster, setTopOffMaster] = useState(false)
  const [topOffRows, setTopOffRows] = useState<Record<string, boolean>>({})

  // ── Delivery Instructions
  const [instructions, setInstructions] = useState("")

  // ── Others (commented out — scope reduced, Others section removed for now)
  // const [poNumber, setPoNumber] = useState("")
  // const [poType, setPoType] = useState<string | null>(null)
  // const [carrierNumber, setCarrierNumber] = useState("")
  // const [hubId, setHubId] = useState<string | null>(null)
  // const [driverId, setDriverId] = useState<string | null>(null)

  // Reset on open
  useEffect(() => {
    if (!isOpen) return
    setPlannedDate(todayDateInputValue())
    setPlannedTime(nowTimeInputValue())
    setMarkUrgent(false)
    setOrderType("delivery")
    setTankQuantities({})
    setTopOffMaster(false)
    setTopOffRows({})
    setInstructions("")
    // setPoNumber("")
    // setPoType(null)
    // setCarrierNumber("")
    // setHubId(null)
    // setDriverId(null)

    if (prefillShipToId) {
      let owningCustomerId: string | null = null
      for (const [cId, list] of shipTosByCustomer.entries()) {
        if (list.some((s) => s.id === prefillShipToId)) {
          owningCustomerId = cId
          break
        }
      }
      setCustomerId(owningCustomerId)
      setShipToKey(owningCustomerId ? prefillShipToId : null)
    } else {
      setCustomerId(null)
      setShipToKey(null)
    }
  }, [isOpen, prefillShipToId, shipTosByCustomer])

  // Reset table state when ShipTo changes
  useEffect(() => {
    setTankQuantities({})
    setTopOffRows({})
    setTopOffMaster(false)
  }, [shipToKey])

  // ── Enter/exit animation state — keeps DOM mounted briefly during exit so the
  // close animation can play before unmount. Emil-style: enter slower (settling),
  // exit snappier (decisive).
  // CRITICAL: `hasEntered` flips ON after entry animation completes. Once true,
  // we remove the `animation` CSS so no residual `transform: scale(1)` sticks
  // around — a non-identity OR identity transform on an ancestor makes it the
  // containing block for `position: fixed` children, breaking dropdown
  // positioning (DatePicker/TimePicker/ShipTo dropdown all use fixed + rects).
  const [isMounted, setIsMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      setIsExiting(false)
      return
    }
    if (isMounted) {
      setIsExiting(true)
      setHasEntered(false)
      const t = window.setTimeout(() => {
        setIsMounted(false)
        setIsExiting(false)
      }, 200)
      return () => window.clearTimeout(t)
    }
  }, [isOpen, isMounted])
  useEffect(() => {
    if (!isMounted || isExiting) return
    const t = window.setTimeout(() => setHasEntered(true), 340)
    return () => window.clearTimeout(t)
  }, [isMounted, isExiting])

  // ── Dropdown options
  const customerOptions = customers.map((c) => ({ id: c.id, label: c.name }))

  const allShipTos = useMemo(() => {
    const flat: ShipToRef[] = []
    for (const list of shipTosByCustomer.values()) flat.push(...list)
    return flat.sort((a, b) => a.shipToAddress.localeCompare(b.shipToAddress))
  }, [shipTosByCustomer])

  const visibleShipTos = customerId ? (shipTosByCustomer.get(customerId) ?? []) : allShipTos
  const shipToOptions = visibleShipTos.map((s) => {
    const stName = s.shipToName ?? s.shipToAddress
    const tail = s.shipToName ? ` · ${s.shipToAddress}` : s.city ? ` - ${s.city}, ${s.state}` : ""
    return {
      id: s.id,
      label: customerId ? `${stName}${tail}` : `${s.customerName} - ${stName}`,
    }
  })

  const shipToCustomerByKey = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of allShipTos) map.set(s.id, s.customerId)
    return map
  }, [allShipTos])

  // const hubOptions = useMemo(() => mockHubs.map((h) => ({ id: h.id, label: h.name })), [])
  // const driverOptions = useMemo(() => mockDrivers.map((d) => ({ id: d.id, label: d.name })), [])

  // ── Asset rows — dynamic from ShipTo data
  const assetRows = useMemo(() => buildAssetRows(shipToKey), [shipToKey])

  // Early return AFTER all hooks (Rules of Hooks: hooks must run in same order every render)
  if (!isMounted) return null

  // ── Submit
  const totalQty = Object.values(tankQuantities).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0)
  const canSubmit = !!customerId && !!shipToKey

  const handleSubmit = () => {
    if (!canSubmit) return
    const customer = customers.find((c) => c.id === customerId)
    const shipTo = allShipTos.find((s) => s.id === shipToKey)
    if (!customer || !shipTo) return
    const iso = new Date(`${plannedDate}T${plannedTime}:00`).toISOString()
    // const selectedDriver = driverId ? mockDrivers.find((d) => d.id === driverId) : undefined
    onSubmit({
      customerId: customer.id,
      customerName: customer.name,
      shipToName: shipTo.shipToName,
      shipToAddress: shipTo.shipToAddress,
      latitude: shipTo.latitude,
      longitude: shipTo.longitude,
      city: shipTo.city,
      state: shipTo.state,
      zip: shipTo.zip,
      zone: shipTo.zone,
      scheduledDateTimeISO: iso,
      scheduledTimeLabel: formatTimeLabel(plannedTime),
      volume: totalQty,
      // driverId: selectedDriver?.id,
      // driverName: selectedDriver?.name,
    })
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (createOrderModalView === "modal3") return
    if (e.target === e.currentTarget) onClose()
  }

  const TABLE_GRID = "44px 1fr 160px 160px"
  const colHeaderStyle = { padding: "0 12px", fontSize: 13, fontWeight: 500, color: "#A3A3A3" }

  // ── Sections extracted so both Modal 1 and Modal 2 layouts can share them
  const customerDetailsSection = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle>Customer Details</SectionTitle>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Customer</FieldLabel>
          <Dropdown
            value={customerId}
            placeholder="Select Customer"
            options={customerOptions}
            onChange={(id) => { setCustomerId(id); setShipToKey(null) }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>ShipTo</FieldLabel>
          <Dropdown
            value={shipToKey}
            placeholder="Select ShipTo"
            options={shipToOptions}
            onChange={(id) => {
              setShipToKey(id)
              const owningCustomerId = shipToCustomerByKey.get(id)
              if (owningCustomerId && owningCustomerId !== customerId) setCustomerId(owningCustomerId)
              // Zoom map to selected ShipTo
              const st = allShipTos.find((s) => s.id === id)
              if (st?.latitude && st?.longitude && typeof window !== "undefined") {
                const fitFn = (window as any).__fitToShipTos as ((coords: {lat:number;lng:number}[]) => void) | undefined
                fitFn?.([{ lat: st.latitude, lng: st.longitude }])
                ;(window as any).__showShipToTooltipFor2Sec?.(id)
              }
            }}
          />
        </div>
      </div>
    </div>
  )

  const scheduleDetailsSection = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle>Schedule Details</SectionTitle>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Planned Date</FieldLabel>
          <DatePicker value={plannedDate} onChange={setPlannedDate} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Planned Time</FieldLabel>
          <TimePicker value={plannedTime} onChange={setPlannedTime} />
        </div>
      </div>
    </div>
  )

  const deliveryOrderSection = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SectionTitle>Assets & Products</SectionTitle>
        <div style={{ width: 1, height: 20, backgroundColor: "#333", flexShrink: 0 }} />
        <div style={{ display: "inline-flex", alignItems: "center", height: 28, padding: 2, borderRadius: 4, backgroundColor: "#1B1B1B", border: "1px solid #282828", boxSizing: "border-box" }}>
          {(["delivery", "extraction"] as const).map((t) => {
            const isActive = orderType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                style={{
                  padding: "0 16px",
                  fontSize: 14,
                  lineHeight: "20px",
                  height: "100%",
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "#E5E5E5" : "#A3A3A3",
                  backgroundColor: isActive ? "#282828" : "transparent",
                  border: isActive ? "1px solid #333" : "1px solid transparent",
                  borderRadius: 2,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  outline: "none",
                  boxShadow: isActive ? "0px 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "background-color 150ms, color 150ms",
                }}
              >
                {t === "delivery" ? "Delivery" : "Extraction"}
              </button>
            )
          })}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", backgroundColor: "transparent", border: "none", borderRadius: 4, color: "#E5E5E5", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <RotateCw size={14} />
          Refresh
        </button>
      </div>
      <div style={{ border: "1px solid #282828", borderRadius: 4, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: TABLE_GRID, backgroundColor: "#222", height: 40, alignItems: "center", borderBottom: "1px solid #282828" }}>
          <div style={{ padding: "0 12px", display: "flex", alignItems: "center" }}><FauxCheckbox /></div>
          <div style={{ padding: "0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#A3A3A3", whiteSpace: "nowrap" }}>{orderType === "extraction" ? "Pump Out" : "Top Off"}</span>
            <Toggle
              on={topOffMaster}
              onChange={() => {
                const next = !topOffMaster
                setTopOffMaster(next)
                const newRows: Record<string, boolean> = {}
                for (const row of assetRows) newRows[row.id] = next
                setTopOffRows(newRows)
              }}
              size="sm"
            />
          </div>
          <div style={colHeaderStyle}>Ullage</div>
          <div style={colHeaderStyle}>Quantity</div>
        </div>
        {/* Empty state */}
        {assetRows.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "32px 24px" }}>
            <Package size={24} color="#737373" />
            <span style={{ fontSize: 14, color: "#737373" }}>Please select a Customer and ShipTo to view available assets</span>
          </div>
        )}
        {/* Data rows */}
        {assetRows.map((row) => {
          const qty = tankQuantities[row.id] ?? "0"
          const isTopOff = topOffRows[row.id] ?? false
          const invColor = inventoryColor(row.tmInventory)
          return (
            <div
              key={row.id}
              style={{ display: "grid", gridTemplateColumns: TABLE_GRID, borderBottom: "1px solid #282828", minHeight: 64, alignItems: "center" }}
            >
              <div style={{ padding: "0 12px", display: "flex", alignItems: "center" }}><FauxCheckbox /></div>
              <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 14, color: "#E5E5E5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</span>
                <span style={{ fontSize: 12, color: "#737373" }}>Product</span>
              </div>
              <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 14, color: "#E5E5E5" }}>{row.ullage.toLocaleString()}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 16, height: 8, borderRadius: 2, backgroundColor: invColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: invColor, fontWeight: 500 }}>{row.tmInventory}%</span>
                </div>
              </div>
              <div style={{ padding: "0 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={qty}
                    onChange={(e) => setTankQuantities((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    style={{ flex: 1, minWidth: 0, padding: "6px 8px", backgroundColor: "transparent", border: "1px solid #333", borderRadius: 4, color: "#E5E5E5", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                  />
                  <span style={{ fontSize: 12, color: "#737373", flexShrink: 0 }}>gal</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const deliveryInstructionsSection = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle>Delivery Instructions</SectionTitle>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Enter any delivery instructions here"
        style={{ width: "100%", minHeight: 64, padding: 12, backgroundColor: "transparent", border: "1px solid #333", borderRadius: 4, color: "#E5E5E5", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
      />
    </div>
  )

  /* Others section — removed from scope, restore when needed
  const othersSection = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SectionTitle>Others</SectionTitle>
      {/* Row 1: PO Number, PO Type, Carrier Number (always 3 cols) * /}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>PO Number</FieldLabel>
          <TextInput value={poNumber} onChange={setPoNumber} placeholder="Enter PO number" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>PO Type</FieldLabel>
          <Dropdown value={poType} placeholder="Select" options={PO_TYPE_OPTIONS} onChange={setPoType} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Carrier Number</FieldLabel>
          <TextInput value={carrierNumber} onChange={setCarrierNumber} placeholder="Enter Carrier number" />
        </div>
      </div>
      {/* Row 2: Hub, Driver * /}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Hub</FieldLabel>
          <Dropdown value={hubId} placeholder="Select" options={hubOptions} onChange={setHubId} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Driver</FieldLabel>
          {prefillDriverName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #333", borderRadius: 4, backgroundColor: "transparent", color: "#E5E5E5", fontSize: 14, opacity: 0.6, cursor: "not-allowed" }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prefillDriverName}</span>
              <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
            </div>
          ) : (
            <Dropdown value={driverId} placeholder="Select Driver" options={driverOptions} onChange={setDriverId} />
          )}
        </div>
      </div>
    </div>
  )
  */
  const othersSection = null

  const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
  // Backdrop can keep `forwards` — it only animates opacity, no transform residue.
  const backdropAnimation = createOrderModalView === "modal3"
    ? undefined
    : isExiting
      ? `rb-co-backdrop-out 180ms ${EASE} forwards`
      : `rb-co-backdrop-in 200ms ${EASE} forwards`
  // Panel: once hasEntered is true, drop the animation entirely so no residual
  // transform sticks. Exit re-enables it.
  const panelAnimation = isExiting
    ? (createOrderModalView === "modal3"
        ? `rb-co-drawer-out 200ms ${EASE} forwards`
        : `rb-co-center-out 180ms ${EASE} forwards`)
    : hasEntered
      ? undefined
      : (createOrderModalView === "modal3"
          ? `rb-co-drawer-in 320ms ${EASE} both`
          : `rb-co-center-in 260ms ${EASE} both`)

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 68,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: createOrderModalView === "modal3" ? "transparent" : "rgba(0,0,0,0.6)",
        zIndex: 200,
        display: createOrderModalView === "modal3" ? "block" : "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: createOrderModalView === "modal3" ? 0 : "24px 24px",
        fontFamily: "Geist, system-ui, sans-serif",
        pointerEvents: createOrderModalView === "modal3" ? "none" : "auto",
        animation: backdropAnimation,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: createOrderModalView === "modal3" ? "#111111" : "#1B1B1B",
          borderRadius: createOrderModalView === "modal3" ? 12 : 8,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
          // NOTE: do NOT set willChange: "transform" here. will-change creates
          // a new containing block for position:fixed children — that breaks
          // dropdown positioning (Customer/ShipTo/DatePicker/TimePicker all
          // use fixed + getBoundingClientRect()).
          animation: panelAnimation,
          ...(createOrderModalView === "modal3" ? {
            position: "absolute",
            top: 8,
            right: 52,
            bottom: 8,
            width: 560,
            pointerEvents: "auto",
            border: "1px solid #282828",
          } : {
            width: createOrderModalView === "modal2" ? 1200 : 800,
            maxWidth: "100%",
            maxHeight: "calc(100vh - 68px - 48px)",
          }),
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 24px",
            flexShrink: 0,
            borderBottom: "1px solid #282828",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500, color: "#E5E5E5" }}>Create Order</span>
          <Checkbox checked={markUrgent} onChange={() => setMarkUrgent((v) => !v)} label="Mark Order As Urgent" />
          <div style={{ flex: 1 }} />
          {createOrderModalView === "modal3" && onExpandToModal && (
            <button
              type="button"
              onClick={onExpandToModal}
              className="rb-icon-btn"
              style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
            >
              <Maximize2 size={18} />
            </button>
          )}
          {createOrderModalView !== "modal3" && onCollapseToDrawer && (
            <button
              type="button"
              onClick={onCollapseToDrawer}
              className="rb-icon-btn"
              style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
            >
              <Minimize2 size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rb-icon-btn"
            style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: 0, outline: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {createOrderModalView === "modal2" ? (
          <div style={{ flex: 1, display: "flex", alignItems: "stretch", overflow: "hidden" }}>
            {/* Left: 480px fixed — Customer, Schedule, Others */}
            <div style={{ width: 480, flexShrink: 0, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", padding: 24 }}>
              {customerDetailsSection}
              {scheduleDetailsSection}
              {othersSection}
            </div>
            {/* Divider */}
            <div style={{ width: 1, flexShrink: 0, backgroundColor: "#282828" }} />
            {/* Right: fills remaining space — Delivery Order, Instructions */}
            <div style={{ flex: "1 0 0", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", padding: 24 }}>
              {deliveryOrderSection}
              {deliveryInstructionsSection}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
            {customerDetailsSection}
            {scheduleDetailsSection}
            {deliveryOrderSection}
            {deliveryInstructionsSection}
            {othersSection}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", flexShrink: 0, borderTop: "1px solid #282828" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ height: 36, padding: "0 16px", backgroundColor: "transparent", border: "1px solid #333", borderRadius: 4, color: "#FAFAFA", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ height: 36, padding: "0 16px", backgroundColor: canSubmit ? "#E5E5E5" : "rgba(229,229,229,0.4)", border: "none", borderRadius: 4, color: "#171717", fontSize: 14, fontWeight: 500, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit" }}
          >
            Create Order
          </button>
        </div>
      </div>
    </div>
  )
}
