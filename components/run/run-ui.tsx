"use client"

import { useState, type CSSProperties, type ReactNode } from "react"
import type { RunFate, RunStatus } from "@/lib/run-types"

// Shared primitives for the run components. Inline styles and the project's dark tokens,
// like the rest of the prototype.

export const RUN = {
  panel: "#1B1B1B",
  card: "#1F1F1F",
  raised: "#232323",
  hover: "#282828",
  border: "#282828",
  border2: "#333",
  t1: "#FAFAFA",
  t2: "#E5E5E5",
  t3: "#A3A3A3",
  t4: "#737373",
  warn: "#FB923C",
  warnBg: "rgba(251,146,60,0.10)",
  bad: "#F87171",
  badBg: "rgba(220,38,38,0.15)",
  ok: "#4ADE80",
  okBg: "rgba(74,222,128,0.10)",
  info: "#A5B4FC",
  infoBg: "rgba(99,102,241,0.14)",
  mono: "Geist Mono, ui-monospace, monospace",
}

export function Kv({ value, label, emphasis }: { value: ReactNode; label: string; emphasis?: boolean }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
      <span style={{ fontSize: emphasis ? 16 : 14, fontWeight: 500, color: RUN.t1, whiteSpace: "nowrap" }}>{value}</span>
      <span style={{ fontSize: 11, color: RUN.t4, whiteSpace: "nowrap" }}>{label}</span>
    </span>
  )
}

type ChipTone = "neutral" | "warn" | "bad" | "ok" | "info"
const TONES: Record<ChipTone, { fg: string; bg: string; bd: string }> = {
  neutral: { fg: RUN.t3, bg: "transparent", bd: RUN.border2 },
  warn: { fg: RUN.warn, bg: RUN.warnBg, bd: "rgba(251,146,60,0.4)" },
  bad: { fg: RUN.bad, bg: RUN.badBg, bd: "rgba(248,113,113,0.4)" },
  ok: { fg: RUN.ok, bg: RUN.okBg, bd: "rgba(74,222,128,0.35)" },
  info: { fg: RUN.info, bg: RUN.infoBg, bd: "rgba(165,180,252,0.4)" },
}

export function Chip({ children, tone = "neutral", onClick, active, title, mono, style }: { children: ReactNode; tone?: ChipTone; onClick?: () => void; active?: boolean; title?: string; mono?: boolean; style?: CSSProperties }) {
  const t = TONES[tone]
  const [hover, setHover] = useState(false)
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 24,
    padding: "0 10px",
    borderRadius: 12,
    border: `1px solid ${active ? t.fg : t.bd}`,
    backgroundColor: active || hover ? (tone === "neutral" ? RUN.hover : t.bg) : t.bg,
    color: tone === "neutral" && (active || hover) ? RUN.t2 : t.fg,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: mono ? RUN.mono : "inherit",
    whiteSpace: "nowrap",
    cursor: onClick ? "pointer" : "default",
    ...style,
  }
  if (!onClick) return <span style={base} title={title}>{children}</span>
  return (
    <button type="button" title={title} aria-pressed={active} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={base}>
      {children}
    </button>
  )
}

export function fateChip(fate: RunFate, status: RunStatus) {
  if (status === "no_answer") return <Chip tone="bad">No answer</Chip>
  if (status === "failed" || fate === "failed") return <Chip tone="bad">Didn&apos;t finish</Chip>
  if (fate === "published") return <Chip tone="ok">Published</Chip>
  if (fate === "used") return <Chip tone="info">Used</Chip>
  return <Chip>Not used</Chip>
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "16px 0 8px" }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: RUN.t4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</span>
      {right}
    </div>
  )
}

export function Chevron({ open, size = 12 }: { open: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden style={{ transition: "transform 150ms", transform: open ? "rotate(90deg)" : "none", flexShrink: 0 }}>
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke={RUN.t4} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
