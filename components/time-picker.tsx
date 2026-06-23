"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Clock, ChevronDown } from "lucide-react"

const TP_ITEM_H = 32

export function pad2(n: number) {
  return String(n).padStart(2, "0")
}

export function formatTimeLabel(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":")
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? "PM" : "AM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${pad2(h)}:${mStr} ${period}`
}

interface TimePickerProps {
  value: string
  onChange: (v: string) => void
  disabledTimes?: string[]
}

export function TimePicker({ value, onChange, disabledTimes = [] }: TimePickerProps) {
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
  const isDraftDisabled = disabledTimes.includes(draftStr)

  const displayLabel = useMemo(() => {
    if (!value) return "Set Start Time"
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

  function renderScrollItem(n: number, selected: boolean, onClick: () => void, disabled: boolean) {
    return (
      <button key={n} type="button" onClick={disabled ? undefined : onClick}
        style={{
          width: "100%", height: TP_ITEM_H, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: selected ? 500 : 400,
          color: disabled ? "#404040" : selected ? "#E5E5E5" : "#FAFAFA",
          backgroundColor: selected ? "#333" : "transparent",
          border: "none", borderRadius: 2,
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!selected && !disabled) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)" }}
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
          padding: "8px 12px", backgroundColor: "transparent",
          border: open ? "1px solid #A3A3A3" : "1px solid #333",
          boxShadow: open ? "0px 0px 0px 3px rgba(163,163,163,0.5)" : "none",
          borderRadius: 4, color: value ? "#E5E5E5" : "#737373", fontSize: 16,
          textAlign: "left", cursor: "pointer", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
      >
        <Clock size={16} color="#737373" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayLabel}</span>
        <ChevronDown size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
      </button>

      {open && createPortal(
        <div
          style={{
            position: "fixed", ...panelStyle,
            backgroundColor: "#282828", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4, zIndex: 10200, width: 200, overflow: "hidden",
          }}
        >
          <div style={{ display: "flex" }}>
            {/* Hours */}
            <div style={{ flex: 1 }}>
              <div style={colLabelStyle}>Hours</div>
              <div ref={hourScrollRef} className="tp-col" style={colScrollStyle}>
                {Array.from({ length: 24 }, (_, h) => {
                  return renderScrollItem(h, h === draftH, () => setDraftH(h), false)
                })}
              </div>
            </div>
            <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
            {/* Minutes */}
            <div style={{ flex: 1 }}>
              <div style={colLabelStyle}>Minutes</div>
              <div ref={minScrollRef} className="tp-col" style={colScrollStyle}>
                {Array.from({ length: 60 }, (_, m) => {
                  const candidate = `${pad2(draftH)}:${pad2(m)}`
                  const isDisabled = disabledTimes.includes(candidate)
                  return renderScrollItem(m, m === draftM, () => setDraftM(m), isDisabled)
                })}
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
              onClick={() => { if (!isDraftDisabled) { onChange(draftStr); setOpen(false) } }}
              style={{
                flex: 1, height: 32, fontSize: 13, fontWeight: 500, color: "#171717",
                backgroundColor: "#E5E5E5", border: "none", borderRadius: 4,
                cursor: (hasChange && !isDraftDisabled) ? "pointer" : "default", fontFamily: "inherit",
                opacity: (hasChange && !isDraftDisabled) ? 1 : 0.5, transition: "opacity 150ms",
              }}
            >Apply</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
