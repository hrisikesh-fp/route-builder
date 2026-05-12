"use client"

import { useState, useEffect } from "react"
import { X, Link, ArrowUpDown } from "lucide-react"

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
  productBreakdown?: { product: string; volume: number }[]
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
  groupId?: string  // orders with same groupId render as one grouped card
}

type OrderDetailRow = { product: string; plannedQty: number }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TERMINALS: ModalTerminal[] = [
  { id: "t-1", name: "Flint Hills - Johnny Morris", loadOrderCount: 12, miles: 3,   warning: null,                              lat: 30.3271, lng: -97.6198, address: "7501 Johnny Morris Road, Austin, TX" },
  { id: "t-2", name: "Valero Taylor",               loadOrderCount: 7,  miles: 1.5, warning: null,  lat: 30.5912, lng: -97.4092, address: "3100 N Main Street, Taylor, TX" },
  { id: "t-3", name: "BP San Fransisco",            loadOrderCount: 3,  miles: 5,   warning: null,                              lat: 30.5234, lng: -97.6789, address: "1500 Gattis School Road, Round Rock, TX" },
  { id: "t-4", name: "Kinder Morgan San Jose Terminal", loadOrderCount: 4, miles: 1.5, warning: null, lat: 30.4011, lng: -97.8395, address: "4801 Kinder Morgan Dr, Cedar Park, TX" },
  { id: "t-5", name: "NUSTAR SF",                   loadOrderCount: 5,  miles: 5,   warning: null,                              lat: 30.3515, lng: -97.5312, address: "9200 NuStar Pkwy, Austin, TX" },
  { id: "t-6", name: "ZENITH San Jose",             loadOrderCount: 4,  miles: 5,   warning: null,                              lat: 30.2701, lng: -97.7423, address: "1100 Zenith Way, Austin, TX" },
  { id: "t-7", name: "BP TACOMA",                   loadOrderCount: 3,  miles: 5,   warning: null,                              lat: 30.2910, lng: -97.6901, address: "800 BP Terminal Rd, Austin, TX" },
  { id: "t-8", name: "Georgetown Fuel Depot",       loadOrderCount: 2,  miles: 4,   warning: null,                              lat: 30.6328, lng: -97.6780, address: "200 Depot Rd, Georgetown, TX" },
]

const LOAD_ORDERS: ModalLoadOrder[] = [
  // ── Flint Hills - Johnny Morris (t-1) — 10 orders: 3 linked, 7 unlinked ──
  // Grouped pair — both linked to same 1 Delivery Order
  { id: "lo-1", terminalId: "t-1", time: "06:45 AM", volumeGal: 3200, products: ["ULSD #2", "ULSD CLEAR DIESEL"],                                         linkedDeliveryCount: 1, groupId: "g-1" },
  { id: "lo-2", terminalId: "t-1", time: "06:45 AM", volumeGal: 2800, products: ["87 OCT W/ 10% ETH", "87 UNLEDED"],                                      linkedDeliveryCount: 1, groupId: "g-1" },
  // Individual linked
  { id: "lo-5", terminalId: "t-1", time: "11:00 AM", volumeGal: 2800, products: ["100*DIESEL-ONROAD CLEAR", "87 UNLEDED"],                                linkedDeliveryCount: 1 },
  // Unlinked
  { id: "lo-35", terminalId: "t-1", time: "05:00 AM", volumeGal: 2800, products: ["100*DIESEL-ONROAD CLEAR", "87 UNLEDED"],                               linkedDeliveryCount: null },
  { id: "lo-3", terminalId: "t-1", time: "08:45 AM", volumeGal: 7200, products: ["100*DIESEL-ONROAD CLEAR", "200*DIESEL-OFFROAD RED", "300*DIESEL-OFFROAD RED", "400*DIESEL-OFFROAD RED"], linkedDeliveryCount: null },
  { id: "lo-4", terminalId: "t-1", time: "07:00 AM", volumeGal: 3400, products: ["ULSD CLEAR DIESEL", "87 OCT W/ 10% ETH"],                               linkedDeliveryCount: null },
  { id: "lo-6", terminalId: "t-1", time: "12:45 PM", volumeGal: 2600, products: ["87 UNLEDED", "ULSD #2"],                                                linkedDeliveryCount: null },
  { id: "lo-7", terminalId: "t-1", time: "01:45 PM", volumeGal: 2800, products: ["100*DIESEL-ONROAD CLEAR", "87 UNLEDED"],                                linkedDeliveryCount: null },
  { id: "lo-8", terminalId: "t-1", time: "02:45 PM", volumeGal: 2800, products: ["87 UNLEDED", "100*DIESEL-ONROAD CLEAR"],                                linkedDeliveryCount: null },
  { id: "lo-9", terminalId: "t-1", time: "04:45 AM", volumeGal: 2800, products: ["100*DIESEL-ONROAD CLEAR", "87 UNLEDED"],                                linkedDeliveryCount: null },
  // Mid-route fix load orders
  { id: "lo-r1-initial", terminalId: "t-1", time: "05:30 AM", volumeGal: 4200, products: ["200*DIESEL-OFFROAD RED", "200*DIESEL-ONROAD CLEAR", "87 OCT W/ 10% ETH"], linkedDeliveryCount: null },
  { id: "lo-r1-mid", terminalId: "t-1", time: "09:00 AM", volumeGal: 600, products: ["200*DIESEL-ONROAD CLEAR", "87 OCT W/ 10% ETH"],                              linkedDeliveryCount: null },
  { id: "lo-r3-mid", terminalId: "t-1", time: "09:30 AM", volumeGal: 200, products: ["200*DIESEL-ONROAD CLEAR"],                                                     linkedDeliveryCount: null },
  // ── Valero Taylor (t-2) — 7 orders ──
  { id: "lo-10", terminalId: "t-2", time: "05:30 AM", volumeGal: 4000, products: ["ULSD #2", "87 UNLEDED"],                                               linkedDeliveryCount: 2 },
  { id: "lo-11", terminalId: "t-2", time: "08:00 AM", volumeGal: 3500, products: ["87 OCT W/ 10% ETH"],                                                   linkedDeliveryCount: 1 },
  { id: "lo-12", terminalId: "t-2", time: "10:00 AM", volumeGal: 3200, products: ["ULSD CLEAR DIESEL"],                                                    linkedDeliveryCount: null },
  { id: "lo-22", terminalId: "t-2", time: "06:15 AM", volumeGal: 3800, products: ["ULSD CLEAR DIESEL", "87 UNLEDED"],                                     linkedDeliveryCount: 1 },
  { id: "lo-23", terminalId: "t-2", time: "09:45 AM", volumeGal: 2800, products: ["87 OCT W/ 10% ETH", "ULSD #2"],                                        linkedDeliveryCount: null },
  { id: "lo-24", terminalId: "t-2", time: "01:00 PM", volumeGal: 2600, products: ["ULSD #2"],                                                             linkedDeliveryCount: null },
  // Mid-route fix
  { id: "lo-r2-mid", terminalId: "t-2", time: "10:30 AM", volumeGal: 900, products: ["ULSD CLEAR DIESEL"],                                                          linkedDeliveryCount: null },
  // ── BP San Fransisco (t-3) — 3 orders ──
  { id: "lo-13", terminalId: "t-3", time: "06:00 AM", volumeGal: 5500, products: ["100*DIESEL-ONROAD CLEAR", "ULSD #2"],                                  linkedDeliveryCount: 3 },
  { id: "lo-14", terminalId: "t-3", time: "09:30 AM", volumeGal: 3000, products: ["87 UNLEDED"],                                                           linkedDeliveryCount: 1 },
  { id: "lo-15", terminalId: "t-3", time: "02:00 PM", volumeGal: 4200, products: ["ULSD #2", "87 UNLEDED"],                                                linkedDeliveryCount: null },
  // ── Kinder Morgan (t-4) — 4 orders ──
  { id: "lo-16", terminalId: "t-4", time: "07:15 AM", volumeGal: 4500, products: ["ULSD CLEAR DIESEL", "87 OCT W/ 10% ETH"],                             linkedDeliveryCount: 2 },
  { id: "lo-17", terminalId: "t-4", time: "11:30 AM", volumeGal: 3600, products: ["ULSD CLEAR DIESEL", "87 OCT W/ 10% ETH"],                              linkedDeliveryCount: null },
  { id: "lo-25", terminalId: "t-4", time: "08:45 AM", volumeGal: 3200, products: ["ULSD #2", "87 UNLEDED"],                                               linkedDeliveryCount: 1 },
  { id: "lo-26", terminalId: "t-4", time: "02:30 PM", volumeGal: 2900, products: ["87 UNLEDED"],                                                           linkedDeliveryCount: null },
  // ── NUSTAR SF (t-5) — 5 orders ──
  { id: "lo-18", terminalId: "t-5", time: "06:30 AM", volumeGal: 6000, products: ["100*DIESEL-ONROAD CLEAR", "200*DIESEL-OFFROAD RED"],                   linkedDeliveryCount: 4 },
  { id: "lo-19", terminalId: "t-5", time: "10:00 AM", volumeGal: 2500, products: ["87 UNLEDED"],                                                           linkedDeliveryCount: 1 },
  { id: "lo-27", terminalId: "t-5", time: "07:45 AM", volumeGal: 3800, products: ["ULSD #2", "87 OCT W/ 10% ETH"],                                       linkedDeliveryCount: null },
  { id: "lo-28", terminalId: "t-5", time: "01:15 PM", volumeGal: 3100, products: ["100*DIESEL-ONROAD CLEAR"],                                              linkedDeliveryCount: null },
  { id: "lo-29", terminalId: "t-5", time: "03:00 PM", volumeGal: 2200, products: ["87 UNLEDED"],                                                           linkedDeliveryCount: null },
  // ── ZENITH San Jose (t-6) — 4 orders ──
  { id: "lo-20", terminalId: "t-6", time: "07:00 AM", volumeGal: 3800, products: ["ULSD #2"],                                                             linkedDeliveryCount: 2 },
  { id: "lo-30", terminalId: "t-6", time: "09:30 AM", volumeGal: 4200, products: ["87 OCT W/ 10% ETH", "ULSD CLEAR DIESEL"],                             linkedDeliveryCount: 1 },
  { id: "lo-31", terminalId: "t-6", time: "12:00 PM", volumeGal: 3500, products: ["ULSD #2", "87 OCT W/ 10% ETH"],                                        linkedDeliveryCount: null },
  { id: "lo-32", terminalId: "t-6", time: "02:45 PM", volumeGal: 2800, products: ["87 UNLEDED"],                                                           linkedDeliveryCount: null },
  // ── BP TACOMA (t-7) — 3 orders ──
  { id: "lo-21", terminalId: "t-7", time: "05:45 AM", volumeGal: 4200, products: ["87 OCT W/ 10% ETH", "87 UNLEDED"],                                    linkedDeliveryCount: 2 },
  { id: "lo-33", terminalId: "t-7", time: "08:30 AM", volumeGal: 3600, products: ["ULSD #2", "100*DIESEL-ONROAD CLEAR"],                                  linkedDeliveryCount: null },
  { id: "lo-34", terminalId: "t-7", time: "01:00 PM", volumeGal: 2400, products: ["87 OCT W/ 10% ETH", "87 UNLEDED"],                                     linkedDeliveryCount: null },
  // ── Georgetown Fuel Depot (t-8) — 2 orders ──
  { id: "lo-r4-mid", terminalId: "t-8", time: "08:00 AM", volumeGal: 400, products: ["ULSD CLEAR DIESEL", "87 OCT W/ 10% ETH"],                                    linkedDeliveryCount: null },
  { id: "lo-40", terminalId: "t-8", time: "10:00 AM", volumeGal: 3200, products: ["ULSD CLEAR DIESEL", "87 OCT W/ 10% ETH", "200*DIESEL-OFFROAD RED"],             linkedDeliveryCount: 1 },
]

const ORDER_DETAILS: Record<string, OrderDetailRow[]> = {
  // Flint Hills - Johnny Morris (t-1)
  "lo-1":  [{ product: "ULSD #2", plannedQty: 1600 }, { product: "ULSD CLEAR DIESEL", plannedQty: 1600 }],
  "lo-2":  [{ product: "87 OCT W/ 10% ETH", plannedQty: 1400 }, { product: "87 UNLEDED", plannedQty: 1400 }],
  "lo-35": [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1400 }, { product: "87 UNLEDED", plannedQty: 1400 }],
  "lo-3":  [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1800 }, { product: "200*DIESEL-OFFROAD RED", plannedQty: 1800 }, { product: "300*DIESEL-OFFROAD RED", plannedQty: 1800 }, { product: "400*DIESEL-OFFROAD RED", plannedQty: 1800 }],
  "lo-4":  [{ product: "ULSD CLEAR DIESEL", plannedQty: 1700 }, { product: "87 OCT W/ 10% ETH", plannedQty: 1700 }],
  "lo-5":  [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1400 }, { product: "87 UNLEDED", plannedQty: 1400 }],
  "lo-6":  [{ product: "87 UNLEDED", plannedQty: 1300 }, { product: "ULSD #2", plannedQty: 1300 }],
  "lo-7":  [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1400 }, { product: "87 UNLEDED", plannedQty: 1400 }],
  "lo-8":  [{ product: "87 UNLEDED", plannedQty: 1400 }, { product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1400 }],
  "lo-9":  [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1400 }, { product: "87 UNLEDED", plannedQty: 1400 }],
  // Mid-route fix load orders (Flint Hills)
  "lo-r1-initial": [{ product: "200*DIESEL-OFFROAD RED", plannedQty: 700 }, { product: "200*DIESEL-ONROAD CLEAR", plannedQty: 1800 }, { product: "87 OCT W/ 10% ETH", plannedQty: 1700 }],
  "lo-r1-mid": [{ product: "200*DIESEL-ONROAD CLEAR", plannedQty: 200 }, { product: "87 OCT W/ 10% ETH", plannedQty: 400 }],
  "lo-r3-mid": [{ product: "200*DIESEL-ONROAD CLEAR", plannedQty: 200 }],
  // Valero Taylor (t-2)
  "lo-10": [{ product: "ULSD #2", plannedQty: 2000 }, { product: "87 UNLEDED", plannedQty: 2000 }],
  "lo-11": [{ product: "87 OCT W/ 10% ETH", plannedQty: 3500 }],
  "lo-12": [{ product: "ULSD CLEAR DIESEL", plannedQty: 3200 }],
  "lo-22": [{ product: "ULSD CLEAR DIESEL", plannedQty: 1900 }, { product: "87 UNLEDED", plannedQty: 1900 }],
  "lo-23": [{ product: "87 OCT W/ 10% ETH", plannedQty: 1400 }, { product: "ULSD #2", plannedQty: 1400 }],
  "lo-24": [{ product: "ULSD #2", plannedQty: 2600 }],
  // Mid-route fix (Valero)
  "lo-r2-mid": [{ product: "ULSD CLEAR DIESEL", plannedQty: 900 }],
  // BP San Fransisco (t-3)
  "lo-13": [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 2750 }, { product: "ULSD #2", plannedQty: 2750 }],
  "lo-14": [{ product: "87 UNLEDED", plannedQty: 3000 }],
  "lo-15": [{ product: "ULSD #2", plannedQty: 2100 }, { product: "87 UNLEDED", plannedQty: 2100 }],
  // Kinder Morgan (t-4)
  "lo-16": [{ product: "ULSD CLEAR DIESEL", plannedQty: 2250 }, { product: "87 OCT W/ 10% ETH", plannedQty: 2250 }],
  "lo-17": [{ product: "ULSD CLEAR DIESEL", plannedQty: 1800 }, { product: "87 OCT W/ 10% ETH", plannedQty: 1800 }],
  "lo-25": [{ product: "ULSD #2", plannedQty: 1600 }, { product: "87 UNLEDED", plannedQty: 1600 }],
  "lo-26": [{ product: "87 UNLEDED", plannedQty: 2900 }],
  // NUSTAR SF (t-5)
  "lo-18": [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 3000 }, { product: "200*DIESEL-OFFROAD RED", plannedQty: 3000 }],
  "lo-19": [{ product: "87 UNLEDED", plannedQty: 2500 }],
  "lo-27": [{ product: "ULSD #2", plannedQty: 1900 }, { product: "87 OCT W/ 10% ETH", plannedQty: 1900 }],
  "lo-28": [{ product: "100*DIESEL-ONROAD CLEAR", plannedQty: 3100 }],
  "lo-29": [{ product: "87 UNLEDED", plannedQty: 2200 }],
  // ZENITH San Jose (t-6)
  "lo-20": [{ product: "ULSD #2", plannedQty: 3800 }],
  "lo-30": [{ product: "87 OCT W/ 10% ETH", plannedQty: 2100 }, { product: "ULSD CLEAR DIESEL", plannedQty: 2100 }],
  "lo-31": [{ product: "ULSD #2", plannedQty: 1750 }, { product: "87 OCT W/ 10% ETH", plannedQty: 1750 }],
  "lo-32": [{ product: "87 UNLEDED", plannedQty: 2800 }],
  // BP TACOMA (t-7)
  "lo-21": [{ product: "87 OCT W/ 10% ETH", plannedQty: 2100 }, { product: "87 UNLEDED", plannedQty: 2100 }],
  "lo-33": [{ product: "ULSD #2", plannedQty: 1800 }, { product: "100*DIESEL-ONROAD CLEAR", plannedQty: 1800 }],
  "lo-34": [{ product: "87 OCT W/ 10% ETH", plannedQty: 1200 }, { product: "87 UNLEDED", plannedQty: 1200 }],
  // Georgetown Fuel Depot (t-8)
  "lo-r4-mid": [{ product: "ULSD CLEAR DIESEL", plannedQty: 200 }, { product: "87 OCT W/ 10% ETH", plannedQty: 200 }],
  "lo-40": [{ product: "ULSD CLEAR DIESEL", plannedQty: 1200 }, { product: "87 OCT W/ 10% ETH", plannedQty: 1000 }, { product: "200*DIESEL-OFFROAD RED", plannedQty: 1000 }],
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddLoadOrderModalProps {
  isOpen: boolean
  driverName: string
  onClose: () => void
  onConfirm: (info: LoadOrderInfo) => void
  routeProducts?: string[]
  productShortfalls?: { product: string; shortfall: number }[]
}

// ─── DisplayItem type + helper ────────────────────────────────────────────────

type DisplayItem =
  | { type: "single"; order: ModalLoadOrder }
  | { type: "grouped"; groupId: string; orders: ModalLoadOrder[]; linkedDeliveryCount: number }

function timeToMins(t: string): number {
  const m = t.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!m) return 0
  let h = parseInt(m[1]), min = parseInt(m[2])
  const period = m[3].toUpperCase()
  if (period === "PM" && h !== 12) h += 12
  if (period === "AM" && h === 12) h = 0
  return h * 60 + min
}

function buildDisplayItems(orders: ModalLoadOrder[]): DisplayItem[] {
  // Sort by time (earliest first)
  const sorted = [...orders].sort((a, b) => timeToMins(a.time) - timeToMins(b.time))
  const items: DisplayItem[] = []
  const seenGroups = new Set<string>()
  for (const order of sorted) {
    if (order.groupId) {
      if (!seenGroups.has(order.groupId)) {
        seenGroups.add(order.groupId)
        const grouped = sorted.filter((o) => o.groupId === order.groupId)
        items.push({ type: "grouped", groupId: order.groupId, orders: grouped, linkedDeliveryCount: grouped[0].linkedDeliveryCount ?? 1 })
      }
    } else {
      items.push({ type: "single", order })
    }
  }
  return items
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AddLoadOrderModal({ isOpen, driverName, onClose, onConfirm, routeProducts, productShortfalls }: AddLoadOrderModalProps) {
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null)
  const [selectedLoadOrderId, setSelectedLoadOrderId] = useState<string | null>(null)
  const [loadOrderTab, setLoadOrderTab] = useState<"all" | "unlinked" | "linked">("all")

  useEffect(() => {
    if (isOpen) {
      setSelectedTerminalId(null)
      setSelectedLoadOrderId(null)
      setLoadOrderTab("all")
    }
  }, [isOpen])

  if (!isOpen) return null

  // Change 8: Compute dynamic terminal warnings based on route products
  const terminalWarnings: Record<string, string | null> = {}
  if (routeProducts && routeProducts.length > 0) {
    for (const terminal of TERMINALS) {
      // Collect unique products available at this terminal from its load orders
      const terminalOrders = LOAD_ORDERS.filter((o) => o.terminalId === terminal.id)
      const availableProducts = new Set<string>()
      for (const order of terminalOrders) {
        // Check ORDER_DETAILS for actual product data
        const details = ORDER_DETAILS[order.id]
        if (details) {
          for (const d of details) availableProducts.add(d.product)
        }
        // Also check the products array on the load order
        for (const p of order.products) availableProducts.add(p)
      }
      const unavailableCount = routeProducts.filter((p) => !availableProducts.has(p)).length
      if (unavailableCount > 0) {
        terminalWarnings[terminal.id] = `${unavailableCount} out of ${routeProducts.length} products unavailable`
      } else {
        terminalWarnings[terminal.id] = null
      }
    }
  }

  const loadOrdersForTerminal = selectedTerminalId
    ? LOAD_ORDERS.filter((o) => o.terminalId === selectedTerminalId)
    : []

  const allCount = loadOrdersForTerminal.length
  const unlinkedCount = loadOrdersForTerminal.filter((o) => o.linkedDeliveryCount === null).length
  const linkedCount = loadOrdersForTerminal.filter((o) => o.linkedDeliveryCount !== null).length

  const filteredLoadOrders = loadOrdersForTerminal.filter((o) => {
    if (loadOrderTab === "unlinked") return o.linkedDeliveryCount === null
    if (loadOrderTab === "linked") return o.linkedDeliveryCount !== null
    return true
  })

  const displayItems = buildDisplayItems(filteredLoadOrders)

  const selectedTerminal = selectedTerminalId ? TERMINALS.find((t) => t.id === selectedTerminalId) ?? null : null
  const selectedLoadOrder = selectedLoadOrderId ? LOAD_ORDERS.find((o) => o.id === selectedLoadOrderId) ?? null : null

  const handleConfirm = () => {
    if (!selectedTerminal) return
    // Handle group selection
    const groupOrders = LOAD_ORDERS.filter((o) => o.groupId === selectedLoadOrderId)
    const order = groupOrders.length > 0 ? groupOrders[0] : selectedLoadOrder
    if (!order) return
    // Collect product breakdown from ORDER_DETAILS
    const orderIds = groupOrders.length > 0 ? groupOrders.map((o) => o.id) : [order.id]
    const breakdown: { product: string; volume: number }[] = []
    for (const oid of orderIds) {
      const details = ORDER_DETAILS[oid]
      if (details) {
        for (const d of details) {
          breakdown.push({ product: d.product, volume: d.plannedQty })
        }
      }
    }

    onConfirm({
      terminalId: selectedTerminal.id,
      terminalName: selectedTerminal.name,
      terminalLat: selectedTerminal.lat,
      terminalLng: selectedTerminal.lng,
      terminalAddress: selectedTerminal.address,
      time: order.time,
      gal: order.volumeGal ?? 0,
      products: order.products.length,
      productBreakdown: breakdown.length > 0 ? breakdown : undefined,
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
          height: 580,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            {/* Product context — chips + shortfall info (Bug 9) */}
            {(routeProducts && routeProducts.length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {routeProducts.map((p) => (
                    <span key={p} style={{ backgroundColor: "#262626", border: "1px solid #333", borderRadius: 4, padding: "1px 6px", fontSize: 12, fontWeight: 400, color: "#A3A3A3", whiteSpace: "nowrap" }}>
                      {p}
                    </span>
                  ))}
                </div>
                {productShortfalls && productShortfalls.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#eab308" }}>
                    Shortfall: {productShortfalls.map((s) => `${s.product} needs ${s.shortfall.toLocaleString()} gal more`).join(", ")}
                  </span>
                )}
              </div>
            )}
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

        {/* Body — Modal row */}
        <div style={{ display: "flex", flexDirection: "row", flex: 1, overflow: "hidden" }}>

          {/* Group_Terminal — left column, no footer, standalone */}
          <div
            style={{
              width: 368,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              borderRight: "1px solid #282828",
              overflow: "hidden",
              paddingTop: 20,
              paddingBottom: 24,
              paddingLeft: 24,
              paddingRight: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3" }}>Terminals</span>
              <SortButton />
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {TERMINALS.map((terminal) => {
                const isSelected = selectedTerminalId === terminal.id
                // Use dynamic warning if route products provided, else fall back to hardcoded
                const dynamicWarning = routeProducts && routeProducts.length > 0
                  ? terminalWarnings[terminal.id] ?? null
                  : terminal.warning
                return (
                  <TerminalCard
                    key={terminal.id}
                    terminal={{ ...terminal, warning: dynamicWarning }}
                    isSelected={isSelected}
                    onClick={() => {
                      setSelectedTerminalId(terminal.id)
                      setSelectedLoadOrderId(null)
                      setLoadOrderTab("all")
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Alert Dialog — right pane, flex-col: [content flex:1] + [footer] */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              paddingTop: 20,
              paddingLeft: 24,
              paddingRight: 24,
              paddingBottom: 24,
              gap: 24,
              minWidth: 0,
            }}
          >
            {/* Load Orders + Order Details (flex: 1) */}
            <div style={{ flex: 1, display: "flex", flexDirection: "row", overflow: "hidden", gap: 32, minWidth: 0 }}>
              {!selectedTerminalId ? (
                /* Empty state */
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111111", borderRadius: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#737373" }}>Select a Terminal to see Load Orders</span>
                </div>
              ) : (
                <>
                  {/* Load Orders column */}
                  <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", overflow: "hidden", gap: 16, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3" }}>Load Orders</span>
                      <SortButton />
                    </div>
                    {/* Tabs */}
                    <div style={{ borderBottom: "1px solid #333333", display: "flex", flexShrink: 0 }}>
                      {(["all", "unlinked", "linked"] as const).map((tab) => {
                        const label = tab === "all" ? `All (${allCount})` : tab === "unlinked" ? `Unlinked (${unlinkedCount})` : `Linked (${linkedCount})`
                        const isActive = loadOrderTab === tab
                        return (
                          <button
                            key={tab}
                            onClick={() => setLoadOrderTab(tab)}
                            style={{
                              background: isActive ? "#282828" : "transparent",
                              border: "none",
                              borderBottom: isActive ? "1px solid #6366f1" : "1px solid transparent",
                              borderRadius: "4px 4px 0 0",
                              padding: "8px 16px",
                              fontSize: 14,
                              fontWeight: isActive ? 500 : 400,
                              color: isActive ? "#E5E5E5" : "#A3A3A3",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              marginBottom: -1,
                            }}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                      {displayItems.map((item) =>
                        item.type === "grouped" ? (
                          <GroupedLoadOrderCard
                            key={item.groupId}
                            item={item}
                            isSelected={selectedLoadOrderId === item.groupId}
                            onClick={() => setSelectedLoadOrderId(item.groupId)}
                          />
                        ) : (
                          <LoadOrderCard
                            key={item.order.id}
                            order={item.order}
                            isSelected={selectedLoadOrderId === item.order.id}
                            onClick={() => setSelectedLoadOrderId(item.order.id)}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* Order Details column */}
                  <div style={{ flex: "1 1 0%", display: "flex", flexDirection: "column", overflow: "hidden", gap: 16, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 300, color: "#A3A3A3" }}>Order Details</span>
                      <div style={{ opacity: 0 }}><SortButton /></div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: "#111111", borderRadius: 4, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                      {!selectedLoadOrderId ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 14, color: "#737373", textAlign: "center", padding: "0 24px" }}>Select a Load Order to see details</span>
                        </div>
                      ) : (() => {
                        // Check if it's a group selection
                        const groupOrders = LOAD_ORDERS.filter((o) => o.groupId === selectedLoadOrderId)
                        if (groupOrders.length > 0) {
                          // Grouped: render two tables with subheaders
                          return (
                            <div style={{ padding: "16px", overflowY: "auto" }}>
                              {groupOrders.map((groupOrder, idx) => {
                                const details = ORDER_DETAILS[groupOrder.id]
                                return (
                                  <div key={groupOrder.id} style={{ marginBottom: idx < groupOrders.length - 1 ? 24 : 0 }}>
                                    {/* Subheader */}
                                    <div style={{ fontSize: 12, fontWeight: 500, color: "#737373", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #282828", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                      {groupOrder.time} · {groupOrder.volumeGal?.toLocaleString()} gal
                                    </div>
                                    {details ? (
                                      <>
                                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #282828" }}>
                                          <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Product</span>
                                          <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Planned Qty</span>
                                        </div>
                                        {details.map((row, i) => (
                                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #282828" }}>
                                            <span style={{ fontSize: 14, color: "#E5E5E5" }}>{row.product}</span>
                                            <span style={{ fontSize: 14, color: "#E5E5E5" }}>{row.plannedQty.toLocaleString()} gal</span>
                                          </div>
                                        ))}
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                                          <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>Total</span>
                                          <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>{details.reduce((s, r) => s + r.plannedQty, 0).toLocaleString()} gal</span>
                                        </div>
                                      </>
                                    ) : (
                                      <div style={{ padding: "12px 0", color: "#737373", fontSize: 14 }}>No product details</div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        }
                        // Single order
                        const details = ORDER_DETAILS[selectedLoadOrderId]
                        if (details) {
                          return (
                            <div style={{ padding: 16, overflowY: "auto" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid #282828" }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Product</span>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#A3A3A3" }}>Planned Qty</span>
                              </div>
                              {details.map((row, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #282828" }}>
                                  <span style={{ fontSize: 14, color: "#E5E5E5" }}>{row.product}</span>
                                  <span style={{ fontSize: 14, color: "#E5E5E5" }}>{row.plannedQty.toLocaleString()} gal</span>
                                </div>
                              ))}
                              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>Total</span>
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#E5E5E5" }}>{details.reduce((s, r) => s + r.plannedQty, 0).toLocaleString()} gal</span>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 14, color: "#737373", textAlign: "center", padding: "0 24px" }}>No product details available</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* _AlertDialogFooter — inside right pane, only when terminal selected */}
            {selectedTerminalId && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
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
      </div>
    </div>
  )
}

// ─── Sort Button ──────────────────────────────────────────────────────────────

function SortButton() {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 32,
        padding: "0 12px",
        border: "1px solid #333333",
        borderRadius: 4,
        background: "transparent",
        cursor: "pointer",
        color: "#A3A3A3",
        fontSize: 14,
        fontWeight: 500,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555555")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333333")}
    >
      <ArrowUpDown size={16} />
      Sort
    </button>
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
        backgroundColor: isSelected ? "#1F1F1F" : hovered ? "#333333" : "#282828",
        border: isSelected ? "2px solid #737373" : isDashed ? "1px dashed #333333" : "2px solid transparent",
        borderRadius: 4,
        padding: 12,
        cursor: "pointer",
        flexShrink: 0,
        transition: "background-color 100ms ease",
      }}
    >
      {isDashed ? (
        <>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", margin: 0, marginBottom: 4 }}>{order.time}</p>
          <p style={{ fontSize: 12, fontWeight: 400, color: "#737373", margin: 0 }}>No product details</p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF" }}>{order.time}</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3" }}>{order.volumeGal?.toLocaleString()} gal</span>
          </div>
          {order.products.length > 0 && (
            <div style={{ display: "flex", gap: 4, overflowX: "auto", flexWrap: "nowrap", marginBottom: order.linkedDeliveryCount !== null ? 8 : 0, paddingBottom: 2 }}>
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
                    flexShrink: 0,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          {order.linkedDeliveryCount !== null && (
            <>
              <div style={{ borderTop: "1px solid #333333", marginBottom: 8 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Link size={12} color="#A3A3A3" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 400, color: "#A3A3A3" }}>
                  Linked to {order.linkedDeliveryCount} Delivery Order{order.linkedDeliveryCount !== 1 ? "s" : ""}
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─── Grouped Load Order Card ──────────────────────────────────────────────────

function GroupedLoadOrderCard({
  item,
  isSelected,
  onClick,
}: {
  item: { type: "grouped"; groupId: string; orders: ModalLoadOrder[]; linkedDeliveryCount: number }
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
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        flexShrink: 0,
        border: isSelected ? "2px solid #737373" : "2px solid transparent",
        borderRadius: 4,
        overflow: "hidden",
        transition: "border-color 100ms ease",
      }}
    >
      {/* Top section — multiple sub-cards */}
      <div
        style={{
          backgroundColor: hovered && !isSelected ? "#333333" : "#282828",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          transition: "background-color 100ms ease",
        }}
      >
        {item.orders.map((order) => (
          <div
            key={order.id}
            style={{
              backgroundColor: "#1B1B1B",
              padding: 12,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#FFFFFF", whiteSpace: "nowrap" }}>{order.time}</span>
              <span style={{ fontSize: 14, fontWeight: 400, color: "#A3A3A3", whiteSpace: "nowrap" }}>{order.volumeGal?.toLocaleString()} gal</span>
            </div>
            {order.products.length > 0 && (
              <div style={{ display: "flex", gap: 4, overflowX: "auto", flexWrap: "nowrap", paddingBottom: 2 }}>
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
                      flexShrink: 0,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Footer row */}
      <div
        style={{
          backgroundColor: hovered && !isSelected ? "#333333" : "#282828",
          borderTop: "1px solid #333333",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "background-color 100ms ease",
        }}
      >
        <Link size={12} color="#A3A3A3" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 400, color: "#A3A3A3" }}>
          Linked to {item.linkedDeliveryCount} Delivery Order{item.linkedDeliveryCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}
