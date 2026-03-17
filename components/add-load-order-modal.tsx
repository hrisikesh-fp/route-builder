"use client"

import { useState, useEffect } from "react"
import { X, Search, Link } from "lucide-react"
import { base1Infrastructure } from "@/lib/infrastructure-data"

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoadOrderInfo = {
  terminalId: string
  terminalName: string
  terminalLat: number
  terminalLng: number
  terminalAddress: string
  time: string
  gal: number
  products: number
}

type ModalLoadOrder = {
  id: string
  terminalId: string
  time: string
  volumeGal: number
  products: string[]
  linkedDeliveryCount: number
  hasProductDetails: boolean
}

type OrderDetailRow = { product: string; plannedQty: number }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LOAD_ORDERS: ModalLoadOrder[] = [
  { id: "lo-1", terminalId: "inf-1", time: "05:45 AM", volumeGal: 4500, products: ["Unleaded", "Premium"], linkedDeliveryCount: 3, hasProductDetails: true },
  { id: "lo-2", terminalId: "inf-1", time: "07:15 AM", volumeGal: 3000, products: ["Diesel"], linkedDeliveryCount: 2, hasProductDetails: true },
  { id: "lo-3", terminalId: "inf-1", time: "09:00 AM", volumeGal: 5000, products: ["Unleaded"], linkedDeliveryCount: 4, hasProductDetails: false },
  { id: "lo-4", terminalId: "inf-1", time: "11:30 AM", volumeGal: 2800, products: ["Diesel", "Premium"], linkedDeliveryCount: 1, hasProductDetails: false },
  { id: "lo-5", terminalId: "inf-2", time: "06:00 AM", volumeGal: 4000, products: ["Premium", "Diesel"], linkedDeliveryCount: 2, hasProductDetails: true },
  { id: "lo-6", terminalId: "inf-2", time: "08:30 AM", volumeGal: 3500, products: ["Unleaded", "Premium"], linkedDeliveryCount: 3, hasProductDetails: false },
  { id: "lo-7", terminalId: "inf-2", time: "10:00 AM", volumeGal: 4200, products: ["Unleaded"], linkedDeliveryCount: 2, hasProductDetails: true },
  { id: "lo-8", terminalId: "inf-3", time: "06:45 AM", volumeGal: 5500, products: ["Diesel"], linkedDeliveryCount: 5, hasProductDetails: true },
  { id: "lo-9", terminalId: "inf-3", time: "09:15 AM", volumeGal: 2500, products: ["Unleaded"], linkedDeliveryCount: 1, hasProductDetails: false },
  { id: "lo-10", terminalId: "inf-3", time: "11:00 AM", volumeGal: 3800, products: ["Premium", "Diesel"], linkedDeliveryCount: 2, hasProductDetails: false },
  { id: "lo-11", terminalId: "inf-4", time: "07:00 AM", volumeGal: 6000, products: ["Unleaded", "Diesel"], linkedDeliveryCount: 4, hasProductDetails: true },
  { id: "lo-12", terminalId: "inf-4", time: "10:30 AM", volumeGal: 4800, products: ["Premium"], linkedDeliveryCount: 2, hasProductDetails: false },
]

const ORDER_DETAILS: Record<string, OrderDetailRow[]> = {
  "lo-1": [{ product: "Unleaded", plannedQty: 2500 }, { product: "Premium", plannedQty: 2000 }],
  "lo-2": [{ product: "Diesel", plannedQty: 3000 }],
  "lo-5": [{ product: "Premium", plannedQty: 2000 }, { product: "Diesel", plannedQty: 2000 }],
  "lo-7": [{ product: "Unleaded", plannedQty: 4200 }],
  "lo-8": [{ product: "Diesel", plannedQty: 5500 }],
  "lo-11": [{ product: "Unleaded", plannedQty: 3500 }, { product: "Diesel", plannedQty: 2500 }],
}

// Supplier metadata per terminal
const TERMINAL_META: Record<string, { supplierCount: number; warning: string | null }> = {
  "inf-1": { supplierCount: 3, warning: "4 suppliers available" },
  "inf-2": { supplierCount: 2, warning: null },
  "inf-3": { supplierCount: 2, warning: null },
  "inf-4": { supplierCount: 5, warning: "High demand — 5 suppliers" },
}

const terminals = base1Infrastructure.filter((i) => i.type === "Terminal")

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddLoadOrderModalProps {
  isOpen: boolean
  driverName: string
  onClose: () => void
  onConfirm: (info: LoadOrderInfo) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddLoadOrderModal({ isOpen, driverName, onClose, onConfirm }: AddLoadOrderModalProps) {
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null)
  const [selectedLoadOrderId, setSelectedLoadOrderId] = useState<string | null>(null)
  const [terminalSearch, setTerminalSearch] = useState("")

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTerminalId(null)
      setSelectedLoadOrderId(null)
      setTerminalSearch("")
    }
  }, [isOpen])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  const filteredTerminals = terminals.filter((t) =>
    t.name.toLowerCase().includes(terminalSearch.toLowerCase())
  )

  const loadOrdersForTerminal = selectedTerminalId
    ? MOCK_LOAD_ORDERS.filter((o) => o.terminalId === selectedTerminalId)
    : []

  const selectedLoadOrder = selectedLoadOrderId
    ? MOCK_LOAD_ORDERS.find((o) => o.id === selectedLoadOrderId) ?? null
    : null

  const selectedTerminal = selectedTerminalId
    ? terminals.find((t) => t.id === selectedTerminalId) ?? null
    : null

  const orderDetails = selectedLoadOrderId ? ORDER_DETAILS[selectedLoadOrderId] ?? null : null

  // Computed modal width
  const modalWidth = selectedLoadOrderId
    ? 1024
    : selectedTerminalId
    ? 704
    : 320

  // Go Back
  const handleGoBack = () => {
    if (selectedLoadOrderId) {
      setSelectedLoadOrderId(null)
    } else {
      setSelectedTerminalId(null)
    }
  }

  // Confirm
  const handleConfirm = () => {
    if (!selectedLoadOrder || !selectedTerminal) return
    onConfirm({
      terminalId: selectedTerminal.id,
      terminalName: selectedTerminal.name,
      terminalLat: selectedTerminal.latitude,
      terminalLng: selectedTerminal.longitude,
      terminalAddress: selectedTerminal.address,
      time: selectedLoadOrder.time,
      gal: selectedLoadOrder.volumeGal,
      products: selectedLoadOrder.products.length,
    })
    onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Geist, system-ui, sans-serif",
      }}
    >
      {/* Modal box */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          overflow: "hidden",
          width: modalWidth,
          maxHeight: "80vh",
          transition: "width 250ms ease",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #282828",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5" }}>Add Load Order</span>
            <span
              style={{
                backgroundColor: "#FFFFFF",
                color: "#111111",
                borderRadius: 9999,
                padding: "2px 10px",
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {driverName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#737373",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: 4,
              padding: 0,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#737373")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — columns */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Column 1 — Terminals */}
          <div
            style={{
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid #282828",
              overflow: "hidden",
            }}
          >
            {/* Column header + search */}
            <div style={{ padding: "16px 16px 12px", flexShrink: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#737373",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                Terminals
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 36,
                  backgroundColor: "#111",
                  border: "1px solid #282828",
                  borderRadius: 4,
                  padding: "0 10px",
                }}
              >
                <Search size={14} color="#737373" style={{ flexShrink: 0 }} />
                <input
                  autoFocus
                  value={terminalSearch}
                  onChange={(e) => setTerminalSearch(e.target.value)}
                  placeholder="Search terminals..."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#E5E5E5",
                    fontFamily: "Geist, system-ui, sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Terminal list — scrollable */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
              {filteredTerminals.length === 0 ? (
                <p style={{ fontSize: 14, color: "#737373", padding: "12px 8px" }}>No terminals found</p>
              ) : (
                filteredTerminals.map((terminal) => {
                  const isSelected = selectedTerminalId === terminal.id
                  const meta = TERMINAL_META[terminal.id]
                  return (
                    <TerminalCard
                      key={terminal.id}
                      name={terminal.name}
                      address={terminal.address}
                      supplierCount={meta?.supplierCount ?? 0}
                      warning={meta?.warning ?? null}
                      isSelected={isSelected}
                      onClick={() => {
                        setSelectedTerminalId(terminal.id)
                        setSelectedLoadOrderId(null)
                      }}
                    />
                  )
                })
              )}
            </div>
          </div>

          {/* Column 2 — Load Orders (slides in when terminal selected) */}
          <div
            style={{
              width: selectedTerminalId ? 384 : 0,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              borderRight: selectedTerminalId ? "1px solid #282828" : "none",
              overflow: "hidden",
              transition: "width 250ms ease",
            }}
          >
            {selectedTerminalId && (
              <>
                <div style={{ padding: "16px 16px 12px", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#737373",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Load Orders
                  </span>
                </div>

                {/* Load orders list — scrollable */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
                  {loadOrdersForTerminal.length === 0 ? (
                    <p style={{ fontSize: 14, color: "#737373", padding: "12px 8px" }}>No load orders available</p>
                  ) : (
                    loadOrdersForTerminal.map((order) => {
                      const isSelected = selectedLoadOrderId === order.id
                      return (
                        <LoadOrderCard
                          key={order.id}
                          order={order}
                          isSelected={isSelected}
                          onClick={() => setSelectedLoadOrderId(order.id)}
                        />
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Column 3 — Order Details (slides in when load order selected) */}
          <div
            style={{
              flex: selectedLoadOrderId ? 1 : 0,
              minWidth: selectedLoadOrderId ? 320 : 0,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#111",
              overflow: "hidden",
              transition: "flex 250ms ease, min-width 250ms ease",
            }}
          >
            {selectedLoadOrderId ? (
              <>
                <div style={{ padding: "16px 16px 12px", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#737373",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Order Details
                  </span>
                </div>

                {orderDetails ? (
                  <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 12px" }}>
                    {/* Table header */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #282828",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Product</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Planned Qty</span>
                    </div>

                    {/* Table rows */}
                    {orderDetails.map((row, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: "1px solid #282828",
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>{row.product}</span>
                        <span style={{ fontSize: 14, fontWeight: 400, color: "#E5E5E5" }}>
                          {row.plannedQty.toLocaleString()} gal
                        </span>
                      </div>
                    ))}

                    {/* Total row */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        padding: "10px 0",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>Total</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                        {orderDetails.reduce((s, r) => s + r.plannedQty, 0).toLocaleString()} gal
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 24px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#737373" }}>No product details available for this order</span>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 16px",
            borderTop: "1px solid #282828",
            flexShrink: 0,
          }}
        >
          {selectedTerminalId && (
            <button
              onClick={handleGoBack}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 400,
                color: "#A3A3A3",
                backgroundColor: "transparent",
                border: "1px solid #333333",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
            >
              Go Back
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!selectedLoadOrderId}
            style={{
              height: 36,
              padding: "0 20px",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
              color: "#171717",
              backgroundColor: "#E5E5E5",
              border: "none",
              cursor: selectedLoadOrderId ? "pointer" : "not-allowed",
              opacity: selectedLoadOrderId ? 1 : 0.5,
              transition: "opacity 150ms ease",
            }}
          >
            Add Load Order
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TerminalCard({
  name,
  address,
  supplierCount,
  warning,
  isSelected,
  onClick,
}: {
  name: string
  address: string
  supplierCount: number
  warning: string | null
  isSelected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: isSelected ? "#1F1F1F" : hovered ? "#333333" : "#282828",
        border: isSelected ? "2px solid #737373" : "2px solid transparent",
        borderRadius: 4,
        padding: "12px 8px",
        cursor: "pointer",
        marginBottom: 6,
        transition: "background-color 100ms ease",
      }}
    >
      <span style={{ display: "block", fontSize: 14, fontWeight: 400, color: "#FFFFFF", marginBottom: 4 }}>
        {name}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#A3A3A3" }}>{supplierCount} suppliers</span>
        <span style={{ color: "#404040", fontSize: 12 }}>·</span>
        <span
          style={{
            fontSize: 13,
            color: "#A3A3A3",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 160,
          }}
        >
          {address.split(",")[0]}
        </span>
      </div>
      {warning && (
        <span
          style={{
            display: "inline-block",
            marginTop: 6,
            fontSize: 12,
            color: "#EAB308",
          }}
        >
          {warning}
        </span>
      )}
    </div>
  )
}

function LoadOrderCard({
  order,
  isSelected,
  onClick,
}: {
  order: ModalLoadOrder
  isSelected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: isSelected ? "#1F1F1F" : hovered ? "#333333" : "#282828",
        border: isSelected ? "2px solid #737373" : "2px solid transparent",
        borderRadius: 4,
        padding: 12,
        cursor: "pointer",
        marginBottom: 6,
        transition: "background-color 100ms ease",
      }}
    >
      {order.hasProductDetails ? (
        <>
          {/* Time + volume row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>{order.time}</span>
            <span style={{ fontSize: 14, color: "#A3A3A3" }}>{order.volumeGal.toLocaleString()} gal</span>
          </div>

          {/* Product tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {order.products.map((p) => (
              <span
                key={p}
                style={{
                  backgroundColor: "#1F1F1F",
                  border: "1px solid #333333",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 12,
                  color: "#E5E5E5",
                }}
              >
                {p}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #333333", margin: "8px 0" }} />

          {/* Linked deliveries */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link size={12} color="#A3A3A3" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#A3A3A3" }}>
              Linked to {order.linkedDeliveryCount} Delivery Order{order.linkedDeliveryCount !== 1 ? "s" : ""}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Time + volume row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>{order.time}</span>
            <span style={{ fontSize: 14, color: "#A3A3A3" }}>{order.volumeGal.toLocaleString()} gal</span>
          </div>

          {/* No product details card */}
          <div
            style={{
              border: "1px dashed #333333",
              borderRadius: 4,
              padding: "8px 12px",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: "#737373" }}>No product details</span>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #333333", margin: "8px 0" }} />

          {/* Linked deliveries */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link size={12} color="#A3A3A3" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#A3A3A3" }}>
              Linked to {order.linkedDeliveryCount} Delivery Order{order.linkedDeliveryCount !== 1 ? "s" : ""}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
