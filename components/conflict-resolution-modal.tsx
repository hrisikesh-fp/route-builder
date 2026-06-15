"use client"

import { useState, useEffect, useRef } from "react"
import { X, GripVertical, Truck } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConflictOrder {
  id: string
  customer: string
  product: string
  volume: number
  driverName: string
}

interface ConflictRoute {
  id: string
  name: string
  truck: string
  color: string
  existingOrders: number
  driverName: string
}

interface DriverConflictGroup {
  driverName: string
  orders: ConflictOrder[]
  routes: ConflictRoute[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CONFLICT_GROUPS: DriverConflictGroup[] = [
  {
    driverName: "Mark Ruffalo",
    orders: [
      { id: "co-1", customer: "Mueller Construction", product: "Clear, Dyed", volume: 1000, driverName: "Mark Ruffalo" },
      { id: "co-2", customer: "Manor Equipment Rental", product: "Clear", volume: 800, driverName: "Mark Ruffalo" },
      { id: "co-3", customer: "Elgin Concrete", product: "Clear, Dyed", volume: 1100, driverName: "Mark Ruffalo" },
    ],
    routes: [
      { id: "route-1", name: "Route 1", truck: "H-118 · 2019 Kenworth Tank Wagon", color: "#9A7BC7", existingOrders: 6, driverName: "Mark Ruffalo" },
      { id: "route-2", name: "Route 2", truck: "H-218 · 2021 Freightliner Cascadia", color: "#C4956A", existingOrders: 9, driverName: "Mark Ruffalo" },
    ],
  },
  {
    driverName: "Kyle Reese",
    orders: [
      { id: "co-4", customer: "Lost Creek Country Store", product: "Dyed", volume: 600, driverName: "Kyle Reese" },
      { id: "co-5", customer: "Barton Creek Fuel Stop", product: "Clear", volume: 900, driverName: "Kyle Reese" },
    ],
    routes: [
      { id: "route-3", name: "Route 3", truck: "H-206 · 2021 Peterbilt Tanker", color: "#6B9DCF", existingOrders: 4, driverName: "Kyle Reese" },
      { id: "route-4", name: "Route 4", truck: "H-305 · 2019 Mack Pinnacle", color: "#B87DA3", existingOrders: 5, driverName: "Kyle Reese" },
    ],
  },
]

const ALL_ORDERS: ConflictOrder[] = CONFLICT_GROUPS.flatMap(g => g.orders)

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrderCard({
  order,
  isDragging,
  onDragStart,
  onDragEnd,
  compact = false,
}: {
  order: ConflictOrder
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  compact?: boolean
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: compact ? "8px 10px" : "10px 12px",
        backgroundColor: "#1F1F1F",
        border: "1px solid #282828",
        borderRadius: 6,
        cursor: "grab",
        opacity: isDragging ? 0.35 : 1,
        transition: "opacity 150ms ease",
        userSelect: "none",
      }}
    >
      <GripVertical size={14} color="#525252" style={{ flexShrink: 0 }} />
      {/* Type badge */}
      <div style={{
        width: 20, height: 20, borderRadius: 4,
        backgroundColor: "rgba(37,184,167,0.15)",
        border: "1px solid rgba(37,184,167,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#25B8A7", lineHeight: 1 }}>D</span>
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: compact ? 12 : 13, fontWeight: 500, color: "#E5E5E5", lineHeight: "18px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.customer}
        </p>
        {!compact && (
          <p style={{ margin: 0, fontSize: 12, color: "#737373", lineHeight: "16px", marginTop: 2 }}>
            {order.product} · {order.volume.toLocaleString()} gal
          </p>
        )}
      </div>
      {compact && (
        <span style={{ fontSize: 11, color: "#737373", flexShrink: 0 }}>{order.volume.toLocaleString()} gal</span>
      )}
    </div>
  )
}

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
        borderRadius: 6,
        border: `1px solid ${isOver ? "#404040" : "#282828"}`,
        backgroundColor: isOver ? "rgba(255,255,255,0.04)" : "#171717",
        overflow: "hidden",
        transition: "border-color 120ms ease, background-color 120ms ease",
      }}
    >
      {/* Route header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderLeft: `3px solid ${route.color}`,
        borderBottom: assignedOrders.length > 0 || isOver ? "1px solid #282828" : "none",
      }}>
        <Truck size={14} color="#737373" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "#E5E5E5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {route.truck}
        </span>
        <div style={{
          padding: "2px 8px",
          backgroundColor: "#262626",
          borderRadius: 4,
          fontSize: 11,
          color: "#A3A3A3",
          fontWeight: 500,
          flexShrink: 0,
        }}>
          {route.existingOrders} Orders
        </div>
      </div>

      {/* Drop area */}
      <div style={{ padding: isEmpty ? 0 : "8px", display: "flex", flexDirection: "column", gap: 6 }}>
        {assignedOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            isDragging={draggingId === order.id}
            onDragStart={() => onOrderDragStart(order.id)}
            onDragEnd={onDragEnd}
            compact
          />
        ))}
        {/* Empty state drop hint */}
        {isEmpty && (
          <div style={{
            padding: "14px 12px",
            textAlign: "center",
            fontSize: 12,
            color: isOver ? "#737373" : "#404040",
            transition: "color 120ms ease",
          }}>
            Drop orders here
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface ConflictResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConflictResolutionModal({ isOpen, onClose, onConfirm }: ConflictResolutionModalProps) {
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(ALL_ORDERS.map(o => [o.id, null]))
  )
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const draggingIdRef = useRef<string | null>(null)

  // Reset state on open
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
    // Only clear if leaving to outside the drop zone (not into a child)
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as HTMLElement)) {
      setDropTarget(null)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 2000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 960, maxWidth: "calc(100vw - 48px)",
          maxHeight: "calc(100vh - 80px)",
          backgroundColor: "#1B1B1B",
          border: "1px solid #282828",
          borderRadius: 8,
          zIndex: 2001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #282828",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#FAFAFA", lineHeight: "24px" }}>
                Review &amp; Assign Orders
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#A3A3A3", lineHeight: "18px" }}>
                {assignedCount} of {totalOrders} orders assigned — drag each order into a route.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none",
                color: "#737373", cursor: "pointer",
                padding: 4, display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 4, flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 14, height: 2, backgroundColor: "#282828", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(assignedCount / totalOrders) * 100}%`,
              backgroundColor: allAssigned ? "#22c55e" : "#4D55F8",
              borderRadius: 2,
              transition: "width 300ms ease, background-color 300ms ease",
            }} />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
          {CONFLICT_GROUPS.map((group, groupIdx) => {
            const limboOrders = group.orders.filter(o => assignments[o.id] === null)
            const limboTargetId = `limbo-${group.driverName}`

            return (
              <div key={group.driverName}>
                {/* Driver section divider */}
                {groupIdx > 0 && (
                  <div style={{ borderTop: "1px solid #282828", marginBottom: 0 }} />
                )}

                <div style={{ paddingTop: 20, paddingBottom: 24 }}>
                  {/* Driver label */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      backgroundColor: "#262626", border: "1px solid #333",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 600, color: "#A3A3A3",
                      flexShrink: 0,
                    }}>
                      {group.driverName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#FAFAFA" }}>
                      {group.driverName}
                    </span>
                    <span style={{ fontSize: 12, color: "#525252" }}>
                      · {group.orders.filter(o => assignments[o.id] !== null).length} of {group.orders.length} assigned
                    </span>
                  </div>

                  {/* Two-column layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Left: limbo bucket */}
                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 500, color: "#525252", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Unassigned
                      </p>
                      <div
                        onDragOver={e => handleDragOver(e, limboTargetId)}
                        onDrop={e => handleDrop(e, "limbo")}
                        onDragLeave={handleDragLeave}
                        style={{
                          minHeight: 120,
                          borderRadius: 6,
                          border: `1px dashed ${dropTarget === limboTargetId ? "#404040" : "#282828"}`,
                          backgroundColor: dropTarget === limboTargetId ? "rgba(255,255,255,0.03)" : "transparent",
                          padding: limboOrders.length > 0 ? 8 : 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          transition: "border-color 120ms ease, background-color 120ms ease",
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
                          <div style={{
                            flex: 1, minHeight: 120,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: "#404040",
                          }}>
                            All orders assigned
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: routes */}
                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 500, color: "#525252", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Routes
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid #282828",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          backgroundColor: "#1B1B1B",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "#525252" }}>
            {allAssigned ? "All orders assigned — ready to confirm." : `${totalOrders - assignedCount} order${totalOrders - assignedCount !== 1 ? "s" : ""} still unassigned.`}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "transparent",
                border: "1px solid #333",
                borderRadius: 6,
                color: "#A3A3A3",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={allAssigned ? onConfirm : undefined}
              style={{
                padding: "8px 16px",
                backgroundColor: allAssigned ? "#4D55F8" : "#1F1F1F",
                border: `1px solid ${allAssigned ? "#4D55F8" : "#282828"}`,
                borderRadius: 6,
                color: allAssigned ? "#fff" : "#525252",
                fontSize: 14,
                fontWeight: 500,
                cursor: allAssigned ? "pointer" : "not-allowed",
                transition: "all 200ms ease",
              }}
            >
              Confirm &amp; Assign
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
