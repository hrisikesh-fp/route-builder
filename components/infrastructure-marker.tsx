"use client"

import type { InfrastructureType, InfrastructureCluster } from "@/lib/infrastructure-data"
import { getInfrastructureColor } from "@/lib/infrastructure-data"

// Hub icon - Home
function HubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 10.25V20C3 20.5523 3.44772 21 4 21H9V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21H20C20.5523 21 21 20.5523 21 20V10.25"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 11L12.866 3.36786C12.3807 2.93445 11.6193 2.93445 11.134 3.36786L2.5 11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Bulk Plant icon - "B" letter with inner white background
function BulkPlantIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Inner white rounded rectangle */}
      <rect x="3" y="3" width="18" height="18" rx="4" fill="white" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fill="#18181B"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="14"
        fontWeight="700"
      >
        B
      </text>
    </svg>
  )
}

// Warehouse icon
function WarehouseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 21V8L12 3L21 8V21"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V13H15V21"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 17H15"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 21H21"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Terminal icon - Gas pump
function TerminalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 22V6C4 4.89543 4.89543 4 6 4H13C14.1046 4 15 4.89543 15 6V22"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 22H15"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 8H12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 10L18 7V16C18 17.1046 18.8954 18 20 18V18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getIconForType(type: InfrastructureType) {
  switch (type) {
    case "Hub":
      return <HubIcon />
    case "Bulk Plant (Fuel)":
    case "Bulk Plant (Lube)":
      return <BulkPlantIcon />
    case "Warehouse":
      return <WarehouseIcon />
    case "Terminal":
      return <TerminalIcon />
    default:
      return <HubIcon />
  }
}

interface InfrastructureMarkerProps {
  cluster: InfrastructureCluster
  isHovered?: boolean
}

export function InfrastructureMarker({ cluster, isHovered = false }: InfrastructureMarkerProps) {
  const { primaryItem, items } = cluster
  const color = getInfrastructureColor(primaryItem.type)
  const hasMultiple = items.length > 1

  return (
    <div
      className="infrastructure-marker"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        transform: isHovered ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.2s",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          backgroundColor: color,
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          cursor: "pointer",
        }}
      >
        {getIconForType(primaryItem.type)}
      </div>
      <div
        style={{
          background: "#262626",
          color: "#E5E5E5",
          height: "16px",
          padding: "0 6px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: 500,
          whiteSpace: "nowrap",
          border: "1px solid rgba(115, 115, 115, 0.2)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {primaryItem.name}
        {hasMultiple && ` + ${items.length - 1} more`}
      </div>
    </div>
  )
}

export interface TerminalLoadInfo {
  orderCount: number
}

export interface TerminalTooltipInfo {
  address: string
  supplierCount: number
  suppliers: string
}

const MAP_PIN_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#A3A3A3"/></svg>`

// HTML version for Mapbox GL JS markers
// Pass `loadInfo` for terminals with load orders (shows order count badge).
// Pass `tooltipInfo` for terminals with hover tooltip.
export function renderInfrastructureMarkerHTML(
  cluster: InfrastructureCluster,
  loadInfo?: TerminalLoadInfo,
  tooltipInfo?: TerminalTooltipInfo
): string {
  const { primaryItem, items } = cluster
  const color = getInfrastructureColor(primaryItem.type)
  const hasMultiple = items.length > 1

  const iconSvg = getIconSvgForType(primaryItem.type)

  const label = hasMultiple
    ? `${primaryItem.name} + ${items.length - 1} more`
    : primaryItem.name

  // Badge — always visible, top-right of icon
  const badgeHtml = loadInfo
    ? `<div class="terminal-order-badge" style="
        display: flex;
        align-items: center;
        position: absolute;
        top: -8px;
        left: 20px;
        background: #E5E5E5;
        color: #171717;
        font-family: Geist, sans-serif;
        font-size: 10px;
        font-weight: 600;
        line-height: 1.6em;
        padding: 0 4px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 99999;
      ">${loadInfo.orderCount} Order${loadInfo.orderCount !== 1 ? "s" : ""}</div>`
    : ""

  return `
    <div class="infrastructure-marker" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
      <div class="infra-icon-square" style="position: relative; width: 28px; height: 28px; background-color: ${color}; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); cursor: pointer; transition: background-color 0.15s; overflow: visible;">
        ${iconSvg}
        ${badgeHtml}
      </div>
      <div class="terminal-pill" style="background: #262626; color: #E5E5E5; height: 16px; padding: 0 6px; border-radius: 4px; font-size: 10px; font-weight: 500; white-space: nowrap; border: 1px solid rgba(115, 115, 115, 0.2); display: flex; align-items: center;">
        ${label}
      </div>
    </div>
  `
}

export function buildTerminalTooltipHTML(tooltipInfo: TerminalTooltipInfo, terminalName: string): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-family: Geist, sans-serif; font-size: 16px; font-weight: 500; color: #E5E5E5; line-height: 1.5em;">${terminalName}</span>
        <div style="display: flex; align-items: center; gap: 4px;">
          ${MAP_PIN_ICON}
          <span style="font-family: Geist, sans-serif; font-size: 14px; font-weight: 400; color: #A3A3A3;">${tooltipInfo.address}</span>
        </div>
      </div>
      <div style="border-top: 1px dashed #333333;"></div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font-family: Geist, sans-serif; font-size: 14px; font-weight: 400; color: #A3A3A3;">${tooltipInfo.supplierCount} Suppliers</span>
        <span style="font-family: Geist, sans-serif; font-size: 12px; font-weight: 400; color: #737373; line-height: 1.33em;">${tooltipInfo.suppliers}</span>
      </div>
    </div>
  `
}

function getIconSvgForType(type: InfrastructureType): string {
  switch (type) {
    case "Hub":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10.25V20C3 20.5523 3.44772 21 4 21H9V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21H20C20.5523 21 21 20.5523 21 20V10.25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21.5 11L12.866 3.36786C12.3807 2.93445 11.6193 2.93445 11.134 3.36786L2.5 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    case "Bulk Plant (Fuel)":
    case "Bulk Plant (Lube)":
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="white"/>
        <text x="12" y="17" text-anchor="middle" fill="#18181B" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700">B</text>
      </svg>`
    case "Warehouse":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 21V8L12 3L21 8V21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 21V13H15V21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 17H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 21H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    case "Terminal":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 22V6C4 4.89543 4.89543 4 6 4H13C14.1046 4 15 4.89543 15 6V22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 22H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 8H12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 10L18 7V16C18 17.1046 18.8954 18 20 18V18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    default:
      return ""
  }
}
