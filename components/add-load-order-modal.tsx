"use client"

import { useState, useEffect } from "react"
import { X, Link } from "lucide-react"

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

type ModalTerminal = {
  id: string
  name: string
  loadOrderCount: number
  miles: number
  warning: string | null
  lat: number
  lng: number
  address: string
}

type ModalLoadOrder = {
  id: string
  terminalId: string
  time: string
  volumeGal: number | null   // null = "No product details" dashed card
  products: string[]
  linkedDeliveryCount: number | null  // null = no link row
}

type OrderDetailRow = { product: string; plannedQty: number }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TERMINALS: ModalTerminal[] = [
  { id: "t-1", name: "Flint Hills - Johnny Morris", loadOrderCount: 28, miles: 3,   warning: null,                              lat: 30.3271, lng: -97.6198, address: "7501 Johnny Morris Road, Austin, TX" },
  { id: "t-2", name: "Valero Taylor",               loadOrderCount: 15, miles: 1.5, warning: "2 out of 4 products unavailable",  lat: 30.5912, lng: -97.4092, address: "3100 N Main Street, Taylor, TX" },
  { id: "t-3", name: "BP San Fransisco",            loadOrderCount: 32, miles: 5,   warning: null,                              lat: 30.5234, lng: -97.6789, address: "1500 Gattis School Road, Round Rock, TX" },
  { id: "t-4", name: "Kinder Morgan San Jose Terminal", loadOrderCount: 15, miles: 1.5, warning: "1 out of 4 products unavailable", lat: 30.4011, lng: -97.8395, address: "4801 Kinder Morgan Dr, Cedar Park, TX" },
  { id: "t-5", name: "NUSTAR SF",                   loadOrderCount: 32, miles: 5,   warning: null,                              lat: 30.3515, lng: -97.5312, address: "9200 NuStar Pkwy, Austin, TX" },
  { id: "t-6", name: "ZENITH San Jose",             loadOrderCount: 32, miles: 5,   warning: null,                              lat: 30.2701, lng: -97.7423, address: "1100 Zenith Way, Austin, TX" },
  { id: "t-7", name: "BP TACOMA",                   loadOrderCount: 32, miles: 5,   warning: null,                              lat: 30.2910, lng: -97.6901, address: "800 BP Terminal Rd, Austin, TX" },
]

const LOAD_ORDERS: ModalLoadOrder[] = [
  // Flint Hills
  { id: "lo-1",  terminalId: "t-1", time: "06:45 AM", volumeGal: 3200, products: ["ULSD #2", "ULSD CLEAR DIESEL"],                      linkedDeliveryCount: 1 },
  { id: "lo-2",  terminalId: "t-1", time: "06:45 AM", volumeGal: 2800, products: ["87 OCT W/ 10% ETH", "87 UNLEDED"],                   linkedDeliveryCount: 1 },
  { id: "lo-3",  terminalId: "t-1", time: "08:45 AM", volumeGal: 7200, products: ["100*DIESEL-ONROAD CLEAR", "200*DIESEL-OFFROAD RED",
                                                                                    "300*DIESEL-OFFROAD RED",  "400*DIESEL-OFFROAD RED"], linkedDeliveryCount: null },
  { id: "lo-4",  terminalId: "t-1", time: "07:00 AM", volumeGal: null, products: [],                                                    linkedDeliveryCount: null },
  { id: "lo-5",  terminalId: "t-1", time: "11:00 AM", volumeGal: 2800, products: ["100*DIESEL-ONROAD CLEAR", "87 UNLEDED"],              linkedDeliveryCount: 1 },
  { id: "lo-6",  terminalId: "t-1", time: "12:45 PM", volumeGal: null, products: [],                                                    linkedDeliveryCount: null },
  { id: "lo-7",  terminalId: "t-1", time: "01:45 PM", volumeGal: 2800, products: ["100*DIESEL-ONROAD CLEAR", "87 UNLEDED"],              linkedDeliveryCount: null },
  { id: "lo-8",  terminalId: "t-1", time: "02:45 PM", volumeGal: 2800, products: ["87 UNLEDED", "100*DIESEL-ONROAD CLEAR"],              linkedDeliveryCount: null },
  { id: "lo-9",  terminalId: "t-1", time: "04:45 AM", volumeGal: 2800, products: ["100*DIESEL-ONROAD CLEAR", "87 UNLEDED"],              linkedDeliveryCount: null },
  // Valero Taylor
  { id: "lo-10", terminalId: "t-2", time: "05:30 AM", volumeGal: 4000, products: ["ULSD #2", "87 UNLEDED"],                             linkedDeliveryCount: 2 },
  { id: "lo-11", terminalId: "t-2", time: "08:00 AM", volumeGal: 3500, products: ["87 OCT W/ 10% ETH"],                                 linkedDeliveryCount: 1 },
  { id: "lo-12", terminalId: "t-2", time: "10:00 AM", volumeGal: null, products: [],                                                    linkedDeliveryCount: null },
  // BP San Francisco
  { id: "lo-13", terminalId: "t-3", time: "06:00 AM", volumeGal: 5500, products: ["100*DIESEL-ONROAD CLEAR", "ULSD #2"],                linkedDeliveryCount: 3 },
  { id: "lo-14", terminalId: "t-3", time: "09:30 AM", volumeGal: 3000, products: ["87 UNLEDED"],                                        linkedDeliveryCount: 1 },
  { id: "lo-15", terminalId: "t-3", time: "02:00 PM", volumeGal: null, products: [],                                                    linkedDeliveryCount: null },
  // Kinder Morgan
  { id: "lo-16", terminalId: "t-4", time: "07:15 AM", volumeGal: 4500, products: ["ULSD CLEAR DIESEL", "87 OCT W/ 10% ETH"],            linkedDeliveryCount: 2 },
  { id: "lo-17", terminalId: "t-4", time: "11:30 AM", volumeGal: null, products: [],                                                    linkedDeliveryCount: null },
  // NUSTAR SF
  { id: "lo-18", terminalId: "t-5", time: "06:30 AM", volumeGal: 6000, products: ["100*DIESEL-ONROAD CLEAR", "200*DIESEL-OFFROAD RED"], linkedDeliveryCount: 4 },
  { id: "lo-19", terminalId: "t-5", time: "10:00 AM", volumeGal: 2500, products: ["87 UNLEDED"],                                        linkedDeliveryCount: 1 },
  // ZENITH San Jose
  { id: "lo-20", terminalId: "t-6", time: "07:00 AM", volumeGal: 3800, products: ["ULSD #2"],                                           linkedDeliveryCount: 2 },
  // BP TACOMA
  { id: "lo-21", terminalId: "t-7", time: "05:45 AM", volumeGal: 4200, products: ["87 OCT W/ 10% ETH", "87 UNLEDED"],                   linkedDeliveryCount: 2 },
]

const ORDER_DETAILS: Record<string, OrderDetailRow[]> = {
  "lo-1":  [{ product: "ULSD #2", plannedQty: 1600 }, { product: "ULSD CLEAR DIESEL", plannedQty: 1600 }],
  "lo-2":  [{ product: "87 OCT W/ 10% ETH", plannedQty: 1400 }, { product: "87 UNLEDED", plannedQty: 1400 }],
  "lo-3":  [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1800 }, { product: "200*DIESEL-OFFROAD RED", plannedQty: 1800 }, { product: "300*DIESEL-OFFROAD RED", plannedQty: 1800 }, { product: "400*DIESEL-OFFROAD RED", plannedQty: 1800 }],
  "lo-5":  [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1400 }, { product: "87 UNLEDED", plannedQty: 1400 }],
  "lo-10": [{ product: "ULSD #2", plannedQty: 2000 }, { product: "87 UNLEDED", plannedQty: 2000 }],
  "lo-11": [{ product: "87 OCT W/ 10% ETH", plannedQty: 3500 }],
  "lo-13": [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 2750 }, { product: "ULSD #2", plannedQty: 2750 }],
  "lo-16": [{ product: "ULSD CLEAR DIESEL", plannedQty: 2250 }, { product: "87 OCT W/ 10% ETH", plannedQty: 2250 }],
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddLoadOrderModalProps {
  isOpen: boolean
  driverName: string
  onClose: () => void
  onConfirm: (info: LoadOrderInfo) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AddLoadOrderModal({ isOpen, driverName, onClose, onConfirm }: AddLoadOrderModalProps) {
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null)
  const [selectedLoadOrderId, setSelectedLoadOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedTerminalId(null)
      setSelectedLoadOrderId(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const loadOrdersForTerminal = selectedTerminalId
    ? LOAD_ORDERS.filter((o) => o.terminalId === selectedTerminalId)
    : []

  const selectedTerminal = selectedTerminalId ? TERMINALS.find((t) => t.id === selectedTerminalId) ?? null : null
  const selectedLoadOrder = selectedLoadOrderId ? LOAD_ORDERS.find((o) => o.id === selectedLoadOrderId) ?? null : null
  const orderDetails = selectedLoadOrderId ? ORDER_DETAILS[selectedLoadOrderId] ?? null : null

  const handleConfirm = () => {
    if (!selectedLoadOrder || !selectedTerminal) return
    onConfirm({
      terminalId: selectedTerminal.id,
      terminalName: selectedTerminal.name,
      terminalLat: selectedTerminal.lat,
      terminalLng: selectedTerminal.lng,
      terminalAddress: selectedTerminal.address,
      time: selectedLoadOrder.time,
      gal: selectedLoadOrder.volumeGal ?? 0,
      products: selectedLoadOrder.products.length,
    })
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1B1B1B",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
          width: selectedTerminalId ? 1200 : 720,
          transition: "width 250ms ease",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid #282828",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#E5E5E5", whiteSpace: "nowrap" }}>
              Add Load Order
            </span>
            <span
              style={{
                backgroundColor: "transparent",
                border: "1px solid #404040",
                color: "#A3A3A3",
                borderRadius: 9999,
                padding: "2px 10px",
                fontSize: 14,
                fontWeight: 400,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {driverName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", borderRadius: 4, padding: 0, flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E5E5E5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "row", height: 480, overflow: "hidden" }}>

          {/* Column 1 — Terminals */}
          <div
            style={{
              width: 368,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid #282828",
              overflow: "hidden",
              paddingTop: 16,
              paddingBottom: 24,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 400,
                color: "#A3A3A3",
                marginBottom: 16,
                flexShrink: 0,
              }}
            >
              Terminals
            </span>

            {/* Scrollable terminal list */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {TERMINALS.map((terminal) => {
                const isSelected = selectedTerminalId === terminal.id
                return (
                  <TerminalCard
                    key={terminal.id}
                    terminal={terminal}
                    isSelected={isSelected}
                    onClick={() => {
                      setSelectedTerminalId(terminal.id)
                      setSelectedLoadOrderId(null)
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Right pane — changes based on state */}
          {!selectedTerminalId ? (
            /* Empty state */
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#111111",
                margin: 16,
                borderRadius: 4,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 400, color: "#737373", textAlign: "center" }}>
                Select a Terminal to see Load Orders
              </span>
            </div>
          ) : (
            /* Load Orders + Order Details */
            <div style={{ display: "flex", flexDirection: "row", flex: 1, overflow: "hidden" }}>

              {/* Column 2 — Load Orders */}
              <div
                style={{
                  width: 384,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  paddingTop: 20,
                  paddingBottom: 24,
                  paddingLeft: 24,
                  paddingRight: 24,
                  gap: 16,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", flexShrink: 0 }}>
                  Load Orders
                </span>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {loadOrdersForTerminal.map((order) => {
                    const isSelected = selectedLoadOrderId === order.id
                    return (
                      <LoadOrderCard
                        key={order.id}
                        order={order}
                        isSelected={isSelected}
                        onClick={() => setSelectedLoadOrderId(order.id)}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Column 3 — Order Details */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  paddingTop: 20,
                  paddingLeft: 24,
                  paddingRight: 24,
                  paddingBottom: 24,
                  gap: 16,
                  overflow: "hidden",
                  minWidth: 320,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", flexShrink: 0 }}>
                  Order Details
                </span>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#111111",
                    borderRadius: 4,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {!selectedLoadOrderId ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 14, color: "#737373", textAlign: "center", padding: "0 24px" }}>
                        Select a Load Order to see details
                      </span>
                    </div>
                  ) : orderDetails ? (
                    <div style={{ padding: 16, overflowY: "auto" }}>
                      {/* Table header */}
                      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #282828" }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Product</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Planned Qty</span>
                      </div>
                      {orderDetails.map((row, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px 0",
                            borderBottom: "1px solid #282828",
                          }}
                        >
                          <span style={{ fontSize: 14, color: "#E5E5E5" }}>{row.product}</span>
                          <span style={{ fontSize: 14, color: "#E5E5E5" }}>{row.plannedQty.toLocaleString()} gal</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>Total</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>
                          {orderDetails.reduce((s, r) => s + r.plannedQty, 0).toLocaleString()} gal
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 14, color: "#737373", textAlign: "center", padding: "0 24px" }}>
                        No product details available
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only when terminal selected */}
        {selectedTerminalId && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              padding: "12px 24px",
              borderTop: "1px solid #282828",
              flexShrink: 0,
            }}
          >
            {/* Go Back — invisible until load order selected */}
            <button
              onClick={() => setSelectedLoadOrderId(null)}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                color: "#FAFAFA",
                backgroundColor: "#262626",
                border: "none",
                cursor: "pointer",
                opacity: selectedLoadOrderId ? 1 : 0,
                pointerEvents: selectedLoadOrderId ? "auto" : "none",
              }}
            >
              Go Back
            </button>
            {/* Add Load Order */}
            <button
              onClick={handleConfirm}
              disabled={!selectedLoadOrderId}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                color: "#171717",
                backgroundColor: "#E5E5E5",
                border: "none",
                cursor: selectedLoadOrderId ? "pointer" : "default",
                opacity: selectedLoadOrderId ? 1 : 0.5,
                transition: "opacity 150ms ease",
              }}
            >
              Add Load Order
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Terminal Card ────────────────────────────────────────────────────────────

function TerminalCard({
  terminal,
  isSelected,
  onClick,
}: {
  terminal: ModalTerminal
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
        backgroundColor: isSelected ? "#1F1F1F" : "#282828",
        border: isSelected ? "2px solid #737373" : "2px solid transparent",
        borderRadius: 4,
        padding: "8px 12px",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background-color 100ms ease",
        ...(hovered && !isSelected ? { backgroundColor: "#333333" } : {}),
      }}
    >
      {/* Terminal name */}
      <p
        style={{
          fontSize: 16,
          fontWeight: 400,
          color: "#FFFFFF",
          margin: 0,
          marginBottom: terminal.warning ? 6 : 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {terminal.name}
      </p>

      {/* Meta row: X Load Orders • Y miles (from Stop 5) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", whiteSpace: "nowrap" }}>
          {terminal.loadOrderCount} Load Orders
        </span>
        <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#A3A3A3", flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", whiteSpace: "nowrap" }}>
          {terminal.miles} miles{" "}
          <span style={{ color: "#737373" }}>(from Stop 5)</span>
        </span>
      </div>

      {/* Warning */}
      {terminal.warning && (
        <p style={{ fontSize: 12, fontWeight: 400, color: "#EAB308", margin: 0, marginTop: 4 }}>
          {terminal.warning}
        </p>
      )}
    </div>
  )
}

// ─── Load Order Card ──────────────────────────────────────────────────────────

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
  const isDashed = order.volumeGal === null

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: isSelected ? "#1F1F1F" : "#282828",
        border: isSelected
          ? "2px solid #737373"
          : isDashed
          ? "1px dashed #333333"
          : "2px solid transparent",
        borderRadius: 4,
        padding: 12,
        cursor: "pointer",
        flexShrink: 0,
        transition: "background-color 100ms ease",
        ...(hovered && !isSelected ? { backgroundColor: "#333333" } : {}),
      }}
    >
      {isDashed ? (
        /* Dashed card — just time + "No product details" */
        <>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", margin: 0, marginBottom: 4 }}>
            {order.time}
          </p>
          <p style={{ fontSize: 12, fontWeight: 400, color: "#737373", margin: 0 }}>
            No product details
          </p>
        </>
      ) : (
        /* Full card */
        <>
          {/* Time + volume */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>{order.time}</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3" }}>
              {order.volumeGal?.toLocaleString()} gal
            </span>
          </div>

          {/* Product tags */}
          {order.products.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
              {order.products.map((p) => (
                <span
                  key={p}
                  style={{
                    backgroundColor: "#1F1F1F",
                    border: "1px solid #333333",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 14,
                    fontWeight: 400,
                    color: "#E5E5E5",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          {order.linkedDeliveryCount !== null && (
            <div style={{ borderTop: "1px solid #333333", marginBottom: 8 }} />
          )}

          {/* Linked deliveries */}
          {order.linkedDeliveryCount !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link size={12} color="#A3A3A3" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 400, color: "#A3A3A3" }}>
                Linked to {order.linkedDeliveryCount} Delivery Order
                {order.linkedDeliveryCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
