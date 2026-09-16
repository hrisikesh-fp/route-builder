"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { ArrowRight, Check, TriangleAlert, X } from "lucide-react"
import {
  KPIS,
  OBJECTIVE_RUNS,
  RANKS,
  SCENARIO,
  formatKpiValue,
  winCount,
  type Kpi,
  type ObjectiveId,
  type ObjectiveRun,
} from "@/lib/objective-comparison-data"
import { MetricCol } from "@/components/optimization-route-card"

/**
 * Objective Comparison Scorecard.
 *
 * Sits between the optimisation loading state and the Optimized Routes drawer:
 * the same demand day solved under every available objective, so the dispatcher
 * chooses the plan rather than being handed one.
 *
 * Objectives run left → right as columns; KPIs run down the left as header rows.
 */

// Repo tokens, not the concept mock's orange. #FA6400 is the lasso tool colour
// here and appears nowhere in modal chrome.
const PRIMARY_BG = "#E5E5E5"   // primary CTA fill — matches merge-modal
const PRIMARY_FG = "#171717"
const RAIL = "#D4D4D8"         // active rail — matches the drawer's tab underline
const SELECT_TINT = "rgba(255,255,255,0.05)"
const WIN = "#10b981"          // matches the route card's efficiency pill
const WARN = "#eab308"

const LABEL_COL = 236
const ROW_H = 54
const HEADER_H = 128

interface ObjectiveComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  /** Fires with the objective the dispatcher committed to. */
  onContinue: (objectiveId: ObjectiveId) => void
}

function RankChip({ rank, tied, emphasis }: { rank: number; tied: boolean; emphasis: boolean }) {
  const isBest = rank === 1
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 28,
        height: 24,
        padding: "0 8px",
        borderRadius: 4,
        fontSize: 14,
        fontWeight: isBest ? 500 : 400,
        lineHeight: "20px",
        fontVariantNumeric: "tabular-nums",
        color: isBest ? WIN : emphasis ? "#E5E5E5" : "#A3A3A3",
        backgroundColor: isBest ? "rgba(16,185,129,0.1)" : "transparent",
        border: isBest ? "1px solid rgba(16,185,129,0.24)" : "1px solid transparent",
        boxSizing: "border-box",
      }}
    >
      {rank}
      {tied ? "=" : ""}
    </span>
  )
}

function RawValue({ text, isBest, emphasis }: { text: string; isBest: boolean; emphasis: boolean }) {
  return (
    <span
      style={{
        fontSize: 14,
        fontWeight: isBest ? 500 : 400,
        lineHeight: "20px",
        fontVariantNumeric: "tabular-nums",
        color: isBest ? WIN : emphasis ? "#E5E5E5" : "#A3A3A3",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  )
}

/** Shared input for every column — same MetricCol row as Optimized Routes / route cards. */
function InputsCard() {
  return (
    <div
      style={{
        backgroundColor: "#282828",
        borderRadius: 4,
        padding: "8px 12px 8px 20px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#A3A3A3",
          lineHeight: "16px",
          flexShrink: 0,
        }}
      >
        Inputs
      </span>
      <div style={{ width: 1, height: 28, backgroundColor: "#333", flexShrink: 0 }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 24, minWidth: 0 }}>
        <MetricCol value={String(SCENARIO.ordersTotal)} label="Orders" />
        <MetricCol value={`${SCENARIO.gallons.toLocaleString()} gal`} label="Gallons" />
        <MetricCol value={String(SCENARIO.trucksAvailable)} label="Trucks" />
        <MetricCol value={SCENARIO.date.replace(/^[A-Za-z]{3} /, "").replace(/, \d{4}$/, "")} label="Date" />
      </div>
    </div>
  )
}

function FeasibilityCell({ run, emphasis }: { run: ObjectiveRun; emphasis: boolean }) {
  if (run.feasibility.ok) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, lineHeight: "20px", color: WIN }}>
        <Check size={14} strokeWidth={2.5} />
        Within limits
      </span>
    )
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 14,
        lineHeight: "20px",
        color: WARN,
        fontWeight: emphasis ? 500 : 400,
      }}
    >
      <TriangleAlert size={14} strokeWidth={2} />
      {run.feasibility.warnings} warning
    </span>
  )
}

function ObjectiveHeader({
  run,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: {
  run: ObjectiveRun
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: (v: boolean) => void
}) {
  const wins = run.unavailable ? 0 : winCount(run.id)
  const disabled = !!run.unavailable

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        height: HEADER_H,
        padding: "12px 12px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 4,
        textAlign: "left",
        boxSizing: "border-box",
        borderRadius: "4px 4px 0 0",
        border: "none",
        borderTop: `2px solid ${isSelected ? RAIL : "transparent"}`,
        backgroundColor: disabled ? "#151515" : isSelected ? "#282828" : isHovered ? "#232323" : "#1F1F1F",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "Geist, sans-serif",
        transition: "background-color 150ms ease",
      }}
    >
      {/* Radio + name */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%" }}>
        <span
          style={{
            width: 14,
            height: 14,
            marginTop: 3,
            borderRadius: "50%",
            flexShrink: 0,
            border: `1px solid ${disabled ? "#333" : isSelected ? PRIMARY_BG : "#525252"}`,
            backgroundColor: isSelected ? PRIMARY_BG : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {isSelected && <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: PRIMARY_FG }} />}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            lineHeight: "20px",
            color: disabled ? "#525252" : "#E5E5E5",
          }}
        >
          {run.label}
        </span>
      </div>

      <span style={{ fontSize: 12, lineHeight: "16px", color: disabled ? "#404040" : "#A3A3A3" }}>
        {run.descriptor}
      </span>

      <div style={{ flex: 1 }} />

      {/* Footer of the header cell: availability / win count / default marker */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {disabled ? (
          <span
            style={{
              fontSize: 11,
              lineHeight: "16px",
              color: "#737373",
              border: "1px dashed #333",
              borderRadius: 4,
              padding: "1px 6px",
            }}
          >
            Not in the engine yet
          </span>
        ) : (
          <>
            <span
              style={{
                fontSize: 11,
                lineHeight: "16px",
                color: wins > 0 ? WIN : "#737373",
                backgroundColor: wins > 0 ? "rgba(16,185,129,0.10)" : "transparent",
                border: `1px solid ${wins > 0 ? "rgba(16,185,129,0.24)" : "#333"}`,
                borderRadius: 4,
                padding: "1px 6px",
                whiteSpace: "nowrap",
              }}
            >
              {wins > 0 ? `Best on ${wins}` : "Best on none"}
            </span>
            {run.isCurrentDefault && (
              <span
                style={{
                  fontSize: 11,
                  lineHeight: "16px",
                  color: "#A3A3A3",
                  border: "1px solid #333",
                  borderRadius: 4,
                  padding: "1px 6px",
                  whiteSpace: "nowrap",
                }}
              >
                Default
              </span>
            )}
          </>
        )}
      </div>
    </button>
  )
}

export function ObjectiveComparisonModal({ isOpen, onClose, onContinue }: ObjectiveComparisonModalProps) {
  const [selected, setSelected] = useState<ObjectiveId>(
    OBJECTIVE_RUNS.find((r) => r.isCurrentDefault)?.id ?? "min_shift_end",
  )
  const [hovered, setHovered] = useState<ObjectiveId | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  if (!isOpen) return null
  if (typeof document === "undefined") return null

  const visibleRuns = OBJECTIVE_RUNS.filter((r) => !r.unavailable)
  const visibleKpis = KPIS.filter((k) => !k.blocked)
  const selectedRun = visibleRuns.find((r) => r.id === selected) ?? visibleRuns[0]
  const gridTemplate = `${LABEL_COL}px repeat(${visibleRuns.length}, minmax(166px, 1fr))`

  const columnBg = (run: ObjectiveRun) => {
    if (run.id === selected) return SELECT_TINT
    if (run.id === hovered) return "rgba(255,255,255,0.02)"
    return "transparent"
  }

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        fontFamily: "Geist, sans-serif",
        padding: 16,
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 1240,
          maxWidth: "100%",
          height: "min(720px, calc(100vh - 80px))",
          maxHeight: "min(720px, calc(100vh - 80px))",
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          boxShadow: "0px 4px 6px -4px rgba(0,0,0,0.1), 0px 10px 15px -3px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header — same as Create Routes: 18/500 title, 14 subtitle, 24 X */}
        <div style={{ padding: "24px 24px 0", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", lineHeight: "28px" }}>
              Compare objectives
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#E5E5E5",
                padding: 0,
              }}
            >
              <X size={24} strokeWidth={2} />
            </button>
          </div>
          <span style={{ fontSize: 14, color: "#A3A3A3", lineHeight: "20px" }}>
            Pick a goal, then review the routes.
          </span>
        </div>

        <div style={{ padding: "16px 24px 12px", display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
          <InputsCard />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#737373", lineHeight: "16px" }}>
              Cells show rank across the row — 1 is best. "=" means the gap is inside the 1% tie threshold.
            </span>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 28,
                padding: "0 10px",
                borderRadius: 4,
                border: "1px solid #333",
                backgroundColor: showRaw ? "#282828" : "transparent",
                color: showRaw ? "#E5E5E5" : "#A3A3A3",
                fontSize: 12,
                lineHeight: "16px",
                cursor: "pointer",
                fontFamily: "Geist, sans-serif",
                transition: "background-color 150ms ease, color 150ms ease",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 14,
                  borderRadius: 999,
                  backgroundColor: showRaw ? PRIMARY_BG : "#333",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background-color 150ms ease",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: showRaw ? 14 : 2,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: showRaw ? PRIMARY_FG : "#FFF",
                    transition: "left 150ms ease, background-color 150ms ease",
                  }}
                />
              </span>
              Show raw values
            </button>
          </div>
        </div>

        {/* ── Scorecard grid ─────────────────────────────────────── */}
        <div style={{ padding: "0 24px", overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0 }}>
          <div style={{ minWidth: 1240 }}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 1, alignItems: "stretch" }}>
              <div
                style={{
                  height: HEADER_H,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  paddingBottom: 12,
                  boxSizing: "border-box",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: "#737373", lineHeight: "16px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Measured on
                </span>
              </div>
              {visibleRuns.map((run) => (
                <ObjectiveHeader
                  key={run.id}
                  run={run}
                  isSelected={run.id === selected}
                  isHovered={run.id === hovered}
                  onSelect={() => setSelected(run.id)}
                  onHover={(v) => setHovered(v ? run.id : null)}
                />
              ))}
            </div>

            {/* KPI rows */}
            {visibleKpis.map((kpi: Kpi, rowIndex) => {
              const ranks = RANKS[kpi.id] ?? {}
              return (
                <div
                  key={kpi.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridTemplate,
                    gap: 1,
                    borderTop: rowIndex === 0 ? "1px solid #282828" : "1px solid #222",
                  }}
                >
                  <div
                    style={{
                      height: ROW_H,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 2,
                      paddingRight: 16,
                      boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", lineHeight: "20px" }}>
                      {kpi.label}
                    </span>
                    <span style={{ fontSize: 12, color: "#737373", lineHeight: "16px" }}>
                      {kpi.definition}
                    </span>
                  </div>

                  {visibleRuns.map((run) => {
                    const emphasis = run.id === selected
                    const cell = ranks[run.id]

                    let content: React.ReactNode
                    if (kpi.id === "feasibility") {
                      content = <FeasibilityCell run={run} emphasis={emphasis} />
                    } else if (showRaw) {
                      content = <RawValue text={formatKpiValue(kpi, run)} isBest={cell?.rank === 1} emphasis={emphasis} />
                    } else if (cell) {
                      content = <RankChip rank={cell.rank} tied={cell.tied} emphasis={emphasis} />
                    } else {
                      content = <span style={{ fontSize: 14, color: "#404040" }}>—</span>
                    }

                    return (
                      <div
                        key={run.id}
                        onMouseEnter={() => setHovered(run.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => setSelected(run.id)}
                        style={{
                          height: ROW_H,
                          display: "flex",
                          alignItems: "center",
                          padding: "0 12px",
                          boxSizing: "border-box",
                          backgroundColor: columnBg(run),
                          cursor: "pointer",
                          transition: "background-color 150ms ease",
                        }}
                      >
                        {content}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Tradeoff readout + footer ──────────────────────────── */}
        <div style={{ padding: "16px 24px 20px", display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: "#1F1F1F",
              border: "1px solid #282828",
              borderLeft: `2px solid ${RAIL}`,
              borderRadius: "0 4px 4px 0",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5", lineHeight: "20px" }}>
                What "{selectedRun.label}" costs you
              </span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#404040" }} />
              <span style={{ fontSize: 12, color: "#737373", lineHeight: "16px" }}>
                {selectedRun.routeCount} routes · {selectedRun.ordersPlaced} of {SCENARIO.ordersTotal} orders placed ·{" "}
                {SCENARIO.unassigned} unassigned
              </span>
            </div>
            <span style={{ fontSize: 13, color: "#A3A3A3", lineHeight: "20px" }}>{selectedRun.tradeoff}</span>
            {!selectedRun.feasibility.ok && selectedRun.feasibility.note && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: WARN, lineHeight: "16px" }}>
                <TriangleAlert size={12} strokeWidth={2} />
                {selectedRun.feasibility.note}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#737373", lineHeight: "16px" }}>
              You can re-run with a different goal from the routes screen.
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={onClose}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 4,
                border: "1px solid #333",
                backgroundColor: "transparent",
                color: "#E5E5E5",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "Geist, sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onContinue(selected)}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 4,
                border: "none",
                backgroundColor: PRIMARY_BG,
                color: PRIMARY_FG,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "Geist, sans-serif",
              }}
            >
              Use {selectedRun.label}
              <ArrowRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
