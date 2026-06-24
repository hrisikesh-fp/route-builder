"use client"

import { useState, useEffect, useRef } from "react"
import { X, GripVertical, Truck, Droplet } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConflictOrder {
  id: string
  customer: string
  products: number
  volume: number
}

interface ConflictRoute {
  id: string
  truck: string
  color: string // pastel accent
  existingOrders: number
}

interface DriverConflictGroup {
  driverName: string
  orders: ConflictOrder[]
  routes: ConflictRoute[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ROUTE_PURPLE = "#d8b4fe"
const ROUTE_BLUE = "#93c5fd"

const CONFLICT_GROUPS: DriverConflictGroup[] = [
  {
    driverName: "Mark Ruffalo",
    orders: [
      { id: "co-1", customer: "Mueller Construction", products: 2, volume: 1000 },
      { id: "co-2", customer: "Manor Equipment Rental", products: 1, volume: 800 },
      { id: "co-3", customer: "Elgin Concrete", products: 2, volume: 1100 },
    ],
    routes: [
      { id: "route-1", truck: "H-118 2019 Kenworth Tank Wagon", color: ROUTE_PURPLE, existingOrders: 6 },
      { id: "route-2", truck: "H-218 2021 Freightliner Cascadia", color: ROUTE_BLUE, existingOrders: 7 },
    ],
  },
  {
    driverName: "Kyle Reese",
    orders: [
      { id: "co-4", customer: "Lost Creek Country Store", products: 1, volume: 600 },
      { id: "co-5", customer: "Barton Creek Fuel Stop", products: 1, volume: 900 },
    ],
    routes: [
      { id: "route-3", truck: "H-206 2021 Peterbilt Tanker", color: ROUTE_PURPLE, existingOrders: 6 },
      { id: "route-4", truck: "H-305 2019 Mack Pinnacle", color: ROUTE_BLUE, existingOrders: 7 },
    ],
  },
]

const ALL_ORDERS: ConflictOrder[] = CONFLICT_GROUPS.flatMap(g => g.orders)

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  order: ConflictOrder
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "16px 16px 12px",
        backgroundColor: "#282828",
        borderRadius: 4,
        overflow: "hidden",
        cursor: "grab",
        opacity: isDragging ? 0.35 : 1,
        transition: "opacity 150ms ease",
        userSelect: "none",
      }}
    >
      <GripVertical size={20} color="#737373" style={{ flexShrink: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        {/* Row 1: badge + customer */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            backgroundColor: "#25b8a7",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#171717", lineHeight: "20px" }}>D</span>
          </div>
          <span style={{
            fontSize: 16, fontWeight: 500, color: "#fff", flex: 1, minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {order.customer}
          </span>
        </div>

        {/* Row 2: product count + volume */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.6 }}>
            <Droplet size={16} color="#fafafa" />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa", lineHeight: "20px" }}>
              {order.products} {order.products === 1 ? "Product" : "Products"}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 400, color: "#e5e5e5", lineHeight: "20px" }}>
            {order.volume.toLocaleString()} gal
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Route Drop Zone ──────────────────────────────────────────────────────────

function RouteDropZone({
  route,
  assignedOrders,
  isOver,
  draggingId,
  onDragOver,
  onDrop,
  onDragLeave,
  onOrderDragStart,
  onDragEnd,
}: {
  route: ConflictRoute
  assignedOrders: ConflictOrder[]
  isOver: boolean
  draggingId: string | null
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragLeave: () => void
  onOrderDragStart: (id: string) => void
  onDragEnd: () => void
}) {
  const isEmpty = assignedOrders.length === 0

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 8,
        backgroundColor: "#111",
        border: `1px solid ${isOver ? "#404040" : "#282828"}`,
        borderRadius: 4,
        minHeight: isEmpty ? 112 : undefined,
        width: "100%",
        transition: "border-color 120ms ease",
      }}
    >
      {/* Route header bar */}
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "8px 8px 8px 16px",
        backgroundColor: "#1f1f1f",
        borderRadius: 4,
        overflow: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* Accent bar */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: route.color }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <Truck size={16} color="#fafafa" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: 16, fontWeight: 500, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {route.truck}
            </span>
          </div>
          <div style={{
            padding: "2px 8px",
            backgroundColor: "#111",
            border: "1px solid transparent",
            borderRadius: 4,
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#fafafa", lineHeight: "20px", whiteSpace: "nowrap" }}>
              {route.existingOrders} Orders
            </span>
          </div>
        </div>
      </div>

      {/* Assigned cards OR drop hint */}
      {assignedOrders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          isDragging={draggingId === order.id}
          onDragStart={() => onOrderDragStart(order.id)}
          onDragEnd={onDragEnd}
        />
      ))}
      {isEmpty && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 400, color: "#737373" }}>Drop orders here</span>
        </div>
      )}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface ConflictResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (unassignedCount: number) => void
}

export function ConflictResolutionModal({ isOpen, onClose, onConfirm }: ConflictResolutionModalProps) {
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(ALL_ORDERS.map(o => [o.id, null]))
  )
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const draggingIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setAssignments(Object.fromEntries(ALL_ORDERS.map(o => [o.id, null])))
      setDraggingId(null)
      setDropTarget(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const totalOrders = ALL_ORDERS.length
  const assignedCount = Object.values(assignments).filter(v => v !== null).length
  const allAssigned = assignedCount === totalOrders

  const handleDragStart = (orderId: string) => {
    draggingIdRef.current = orderId
    setDraggingId(orderId)
  }
  const handleDragEnd = () => {
    draggingIdRef.current = null
    setDraggingId(null)
    setDropTarget(null)
  }
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    setDropTarget(targetId)
  }
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const id = draggingIdRef.current
    if (!id) return
    setAssignments(prev => ({ ...prev, [id]: targetId === "limbo" ? null : targetId }))
    setDraggingId(null)
    draggingIdRef.current = null
    setDropTarget(null)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as HTMLElement)) {
      setDropTarget(null)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000 }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 960, maxWidth: "calc(100vw - 48px)",
          maxHeight: "min(720px, calc(100vh - 80px))",
          backgroundColor: "#1b1b1b",
          borderRadius: 8,
          zIndex: 2001,
          display: "flex",
          flexDirection: "column",
          padding: 24,
          gap: 20,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "#e5e5e5", lineHeight: "28px" }}>
              Review &amp; Assign Orders
            </p>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}
            >
              <X size={24} color="#e5e5e5" />
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px" }}>
            {assignedCount} of {totalOrders} orders assigned, drag each order into a route.
          </p>
        </div>

        {/* Body — driver groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1, overflowY: "auto", minHeight: 0 }}>
          {CONFLICT_GROUPS.map(group => {
            const limboOrders = group.orders.filter(o => assignments[o.id] === null)
            const limboTargetId = `limbo-${group.driverName}`
            const groupAssigned = group.orders.filter(o => assignments[o.id] !== null).length

            return (
              <div key={group.driverName} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Driver label */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#fff", lineHeight: "24px", whiteSpace: "nowrap" }}>
                    {group.driverName}
                  </span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#737373", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#a3a3a3", lineHeight: "20px", whiteSpace: "nowrap" }}>
                    {groupAssigned}/{group.orders.length} Assigned
                  </span>
                </div>

                {/* Two columns */}
                <div style={{ display: "flex", gap: 24, alignItems: "flex-start", width: "100%" }}>
                  {/* Left: orders to be assigned */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 300, color: "#a3a3a3", lineHeight: "24px" }}>
                      Orders to be Assigned
                    </p>
                    <div
                      onDragOver={e => handleDragOver(e, limboTargetId)}
                      onDrop={e => handleDrop(e, "limbo")}
                      onDragLeave={handleDragLeave}
                      style={{
                        display: "flex", flexDirection: "column", gap: 8,
                        padding: 8,
                        border: `1px dashed ${dropTarget === limboTargetId ? "#404040" : "#282828"}`,
                        borderRadius: 4,
                        width: "100%",
                        minHeight: limboOrders.length === 0 ? 80 : undefined,
                        transition: "border-color 120ms ease",
                      }}
                    >
                      {limboOrders.length > 0 ? (
                        limboOrders.map(order => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            isDragging={draggingId === order.id}
                            onDragStart={() => handleDragStart(order.id)}
                            onDragEnd={handleDragEnd}
                          />
                        ))
                      ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 80 }}>
                          <span style={{ fontSize: 14, color: "#525252" }}>All orders assigned</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: routes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 300, color: "#a3a3a3", lineHeight: "24px" }}>
                      Routes
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                      {group.routes.map(route => {
                        const assignedToRoute = group.orders.filter(o => assignments[o.id] === route.id)
                        return (
                          <RouteDropZone
                            key={route.id}
                            route={route}
                            assignedOrders={assignedToRoute}
                            isOver={dropTarget === route.id}
                            draggingId={draggingId}
                            onDragOver={e => handleDragOver(e, route.id)}
                            onDrop={e => handleDrop(e, route.id)}
                            onDragLeave={handleDragLeave}
                            onOrderDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              height: 36,
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #333",
              borderRadius: 4,
              boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
              color: "#fafafa",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={allAssigned ? onConfirm : undefined}
            disabled={!allAssigned}
            style={{
              height: 36,
              padding: "8px 16px",
              backgroundColor: "#e5e5e5",
              border: "none",
              borderRadius: 4,
              color: "#171717",
              fontSize: 14,
              fontWeight: 500,
              opacity: allAssigned ? 1 : 0.5,
              cursor: allAssigned ? "pointer" : "not-allowed",
              transition: "opacity 200ms ease",
            }}
          >
            Confirm &amp; Proceed
          </button>
        </div>
      </div>
    </>
  )
}
