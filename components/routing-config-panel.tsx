"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, ChevronDown, Clock, Info, X } from "lucide-react"
import {
  DEFAULT_ROUTING_CONFIG,
  LIVE_OBJECTIVES,
  PANELS,
  ROAD_PROFILES,
  type PanelId,
  type RoutingConfig,
} from "@/lib/routing-config-data"

const MEASURE = 800
const inputReset: CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#E5E5E5",
  fontFamily: "inherit",
  fontSize: 16,
  lineHeight: "24px",
}

function Switch({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 36,
        height: 20,
        flexShrink: 0,
        borderRadius: 9999,
        backgroundColor: on ? "#E5E5E5" : "#333",
        display: "flex",
        alignItems: "center",
        justifyContent: on ? "flex-end" : "flex-start",
        padding: "0 2px",
        transition: "background .15s",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <i
        style={{
          display: "block",
          width: 16,
          height: 16,
          borderRadius: 9999,
          backgroundColor: on ? "#0A0A0A" : "#737373",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)",
        }}
      />
    </span>
  )
}

function AlwaysOnNote({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        backgroundColor: "#1F1F1F",
        border: "1px solid #282828",
        borderRadius: 4,
        padding: "12px 16px",
        marginBottom: 24,
      }}
    >
      <AlertTriangle size={20} color="#818cf8" style={{ flexShrink: 0 }} />
      <div style={{ fontSize: 14, lineHeight: "20px", color: "#818cf8" }}>{children}</div>
    </div>
  )
}

function AlertLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        color: "inherit",
        fontWeight: 600,
        textUnderlineOffset: 2,
      }}
    >
      {children}
    </a>
  )
}

function AlertNote({
  children,
  title,
  flush,
}: {
  children: ReactNode
  title?: string
  flush?: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        backgroundColor: "#1F1F1F",
        border: "1px solid #282828",
        borderRadius: 4,
        padding: "12px 16px",
        marginBottom: flush ? 0 : 24,
      }}
    >
      <Info size={20} color="#A3A3A3" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {title && (
          <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500, color: "#E5E5E5" }}>{title}</div>
        )}
        <div style={{ fontSize: 14, lineHeight: "20px", color: "#A3A3A3" }}>{children}</div>
      </div>
    </div>
  )
}

function Field({
  label,
  help,
  children,
}: {
  label?: string
  help?: string
  children: ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && (
        <label style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500, color: "#A3A3A3" }}>{label}</label>
      )}
      {children}
      {help && <div style={{ fontSize: 14, lineHeight: "20px", color: "#A3A3A3" }}>{help}</div>}
    </div>
  )
}

function Control({ children, select }: { children: ReactNode; select?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: `1px solid ${select ? "#333" : "#282828"}`,
        borderRadius: 4,
        padding: "8px 12px",
        background: "transparent",
        boxShadow: select ? "none" : "0 1px 2px rgba(0,0,0,.05)",
      }}
    >
      {children}
    </div>
  )
}

function Addon({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        height: 24,
        display: "flex",
        alignItems: "center",
        paddingLeft: 12,
        borderLeft: "1px solid #282828",
        fontSize: 14,
        lineHeight: "20px",
        fontWeight: 500,
        color: "#E5E5E5",
      }}
    >
      {children}
    </span>
  )
}

function SwitchRow({
  label,
  desc,
  on,
  onToggle,
  dim,
  locked,
}: {
  label: string
  desc: string
  on: boolean
  onToggle?: () => void
  dim?: boolean
  locked?: boolean
}) {
  const body = (
    <>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#E5E5E5" }}>{label}</div>
        <div style={{ fontSize: 14, lineHeight: "20px", color: "#737373" }}>{desc}</div>
      </div>
      <Switch on={on} disabled={locked} />
    </>
  )
  const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    fontFamily: "inherit",
    textAlign: "left",
  }
  if (locked) {
    return (
      <div role="group" aria-label={`${label}, always on`} style={{ ...rowStyle, cursor: "default" }}>
        {body}
      </div>
    )
  }
  return (
    <button type="button" onClick={onToggle} style={{ ...rowStyle, cursor: "pointer" }}>
      {body}
    </button>
  )
}

function Acc({
  on,
  onToggle,
  label,
  desc,
  last,
  children,
}: {
  on: boolean
  onToggle: () => void
  label: string
  desc: string
  last?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <SwitchRow label={label} desc={desc} on={on} onToggle={onToggle} dim={!on} />
      {on && (
        <div
          style={{
            backgroundColor: "#111",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function StaticAcc({
  label,
  desc,
  last,
  children,
}: {
  label: string
  desc: string
  last?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#E5E5E5" }}>{label}</div>
          <div style={{ fontSize: 14, lineHeight: "20px", color: "#737373" }}>{desc}</div>
        </div>
      </div>
      <div
        style={{
          backgroundColor: "#111",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#1B1B1B",
        border: "1px solid #282828",
        borderRadius: 4,
        marginBottom: 24,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  )
}

function PanelChrome({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#FFF", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: "20px", color: "#A3A3A3", marginBottom: 24 }}>{desc}</div>
      {children}
    </div>
  )
}

function Divider({ last }: { last?: boolean }) {
  if (last) return null
  return <div style={{ height: 1, backgroundColor: "#282828" }} />
}

export function RoutingConfigPanel({
  initial = DEFAULT_ROUTING_CONFIG,
  onClose,
}: {
  initial?: RoutingConfig
  onClose?: () => void
}) {
  const [config, setConfig] = useState<RoutingConfig>(initial)
  const [snapshot] = useState(() => structuredClone(initial))
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [panel, setPanel] = useState<PanelId>("truck")
  const scrollRef = useRef<HTMLDivElement>(null)

  function patch<K extends keyof RoutingConfig>(key: K, value: RoutingConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  function discard() {
    setConfig(structuredClone(snapshot))
    setDirty(false)
    setSaved(false)
  }

  function save() {
    setDirty(false)
    setSaved(true)
  }

  function selectPanel(id: PanelId) {
    setPanel(id)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }

  const profileHelp =
    config.profilePreference === "hazmat"
      ? "Roads that ban hazardous loads are avoided, along with restricted tunnels."
      : "Hazmat restrictions do not apply on this network. Routes may use roads that ban hazardous loads."

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0A0A0A",
        fontFamily: "Geist, sans-serif",
        color: "#E5E5E5",
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0, borderBottom: "1px solid #282828", backgroundColor: "#0A0A0A" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            width: MEASURE,
            maxWidth: "100%",
            margin: "0 auto",
            padding: "20px 0",
          }}
        >
          <div style={{ flex: 1, fontSize: 18, lineHeight: "28px", fontWeight: 500, color: "#FFF" }}>
            Routing Configuration
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 24,
                height: 24,
                display: "grid",
                placeItems: "center",
                background: "none",
                border: "none",
                color: "#A3A3A3",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "flex-start",
            width: MEASURE,
            maxWidth: "100%",
            margin: "0 auto",
            padding: "24px 0 40px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 200, flexShrink: 0 }}>
            {PANELS.map((p) => {
              const on = panel === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-selected={on}
                  onClick={() => selectPanel(p.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: 4,
                    border: "none",
                    background: on ? "#282828" : "transparent",
                    fontFamily: "inherit",
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: on ? 500 : 400,
                    color: on ? "#E5E5E5" : "#A3A3A3",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: on ? "0 1px 3px rgba(0,0,0,.1), 0 1px 2px -1px rgba(0,0,0,.1)" : "none",
                  }}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {panel === "truck" && (
              <PanelChrome title="Truck" desc="The engine only assigns a truck if the load fits, the products are allowed, and it can load at that terminal.">
                <AlwaysOnNote>
                  These are foundational rules that stay on for creating optimized routes.
                </AlwaysOnNote>
                <Grid>
                  <SwitchRow
                    locked
                    label="Compartment capacity"
                    desc="Orders are only assigned to a truck if they fit its compartments."
                    on
                  />
                  <Divider />
                  <SwitchRow
                    locked
                    label="Product compatibility"
                    desc="Only load products that can share a compartment, using comparable product categories."
                    on
                  />
                  <Divider />
                  <SwitchRow
                    locked
                    label="Compartment product approvals"
                    desc="Skip compartments that are not approved for the product category being loaded."
                    on
                  />
                  <Divider />
                  <SwitchRow
                    locked
                    label="Terminal authorization"
                    desc="Trucks only load at terminals they are approved for."
                    on
                  />
                </Grid>
                <AlertNote>
                  Compartments, approved products, and authorized terminals are set on the truck or trailer in the{" "}
                  <AlertLink href="/self_customer/assets">Assets</AlertLink> page.
                </AlertNote>
              </PanelChrome>
            )}

            {panel === "driver" && (
              <PanelChrome title="Driver" desc="Who can run a route, and what they are allowed to carry.">
                <Grid>
                  <SwitchRow
                    label="Terminal carding"
                    desc="Drivers are only sent to terminals they are currently carded for."
                    on={config.terminalCarding}
                    onToggle={() => patch("terminalCarding", !config.terminalCarding)}
                    dim={!config.terminalCarding}
                  />
                  <Divider />
                  <SwitchRow
                    label="Driver hours"
                    desc="Routes are planned to finish inside the hours a driver has available."
                    on={config.driverHours}
                    onToggle={() => patch("driverHours", !config.driverHours)}
                    dim={!config.driverHours}
                  />
                </Grid>
                <AlertNote>
                  Cards and working hours are set on the{" "}
                  <AlertLink href="/self_customer/drivers">Driver</AlertLink> page. Expired cards are skipped for the
                  date being planned.
                </AlertNote>
              </PanelChrome>
            )}

            {panel === "orders" && (
              <PanelChrome title="Order and Customer" desc="When deliveries happen, and which orders come first.">
                <Grid>
                  <SwitchRow
                    label="Delivery windows"
                    desc="Deliveries are planned to arrive inside the window set on the order, ship-to, or customer."
                    on={config.deliveryWindows}
                    onToggle={() => patch("deliveryWindows", !config.deliveryWindows)}
                    dim={!config.deliveryWindows}
                  />
                  <Divider />
                  <SwitchRow
                    label="Run-out protection"
                    desc="Tanks at risk of running dry are planned first."
                    on={config.runOutProtection}
                    onToggle={() => patch("runOutProtection", !config.runOutProtection)}
                    dim={!config.runOutProtection}
                  />
                  <Divider />
                  <SwitchRow
                    label="Urgent orders"
                    desc="Orders marked urgent are planned first."
                    on={config.urgentOrders}
                    onToggle={() => patch("urgentOrders", !config.urgentOrders)}
                    dim={!config.urgentOrders}
                  />
                  <Divider />
                  <SwitchRow
                    label="Linked deliveries"
                    desc="Deliveries that share a loading order stay on the same route."
                    on={config.linkedDeliveries}
                    onToggle={() => patch("linkedDeliveries", !config.linkedDeliveries)}
                    dim={!config.linkedDeliveries}
                  />
                </Grid>
                <AlertNote>
                  Planning an order first does not guarantee it gets on a route. It can still be left out if no truck can
                  carry it.
                </AlertNote>
              </PanelChrome>
            )}

            {panel === "terminal" && (
              <PanelChrome title="Terminal and Supply" desc="Where trucks can load, and how much product is available there.">
                <Grid>
                  <SwitchRow
                    label="Terminal product availability"
                    desc="Trucks are only sent to terminals that carry the product."
                    on={config.terminalProductAvailability}
                    onToggle={() => patch("terminalProductAvailability", !config.terminalProductAvailability)}
                    dim={!config.terminalProductAvailability}
                  />
                </Grid>
              </PanelChrome>
            )}

            {panel === "route" && (
              <PanelChrome title="Route" desc="How a route is built, and which roads it can use.">
                <Grid>
                  <StaticAcc label="Default start time" desc="Routes start at this time unless the driver has working hours.">
                    <Field>
                      <Control>
                        <Clock size={16} color="#A3A3A3" style={{ flexShrink: 0 }} />
                        <input
                          type="time"
                          value={config.defaultStartTime}
                          onChange={(e) => patch("defaultStartTime", e.target.value)}
                          style={inputReset}
                        />
                      </Control>
                    </Field>
                  </StaticAcc>
                  <Divider />
                  <StaticAcc label="Route length" desc="Routes are planned to finish within this many hours of the start time.">
                    <Field>
                      <Control>
                        <input
                          type="number"
                          value={config.maxRouteDurationHours}
                          onChange={(e) => patch("maxRouteDurationHours", Number(e.target.value))}
                          style={inputReset}
                        />
                        <Addon>hours</Addon>
                      </Control>
                    </Field>
                  </StaticAcc>
                  <Divider />
                  <Acc
                    label="Minimum deliveries per route"
                    desc="Avoid running a truck out for only a couple of drops."
                    on={config.minDeliveries}
                    onToggle={() => patch("minDeliveries", !config.minDeliveries)}
                  >
                    <Field help="A route can still go below this if it is the only way to serve an order.">
                      <Control>
                        <input
                          type="number"
                          value={config.minJobsPerRoute}
                          onChange={(e) => patch("minJobsPerRoute", Number(e.target.value))}
                          style={inputReset}
                        />
                        <Addon>stops</Addon>
                      </Control>
                    </Field>
                  </Acc>
                  <Divider />
                  <StaticAcc last label="Hazmat roads" desc="Which road network routes are planned on">
                    <Field label="Plan routes by" help={profileHelp}>
                      <Control select>
                        <select
                          value={config.profilePreference}
                          onChange={(e) => patch("profilePreference", e.target.value as RoutingConfig["profilePreference"])}
                          style={{ ...inputReset, appearance: "none", cursor: "pointer" }}
                        >
                          {ROAD_PROFILES.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} color="#A3A3A3" />
                      </Control>
                    </Field>
                  </StaticAcc>
                </Grid>
              </PanelChrome>
            )}

            {panel === "timing" && (
              <PanelChrome title="Loading and Delivery" desc="How long the routing engine expects each stop to take.">
                <Grid>
                  <StaticAcc label="Loading" desc="Time spent picking up product at a terminal or bulk plant.">
                    <Field label="Time per load">
                      <Control>
                        <input
                          type="number"
                          value={config.timePerLoadMin}
                          onChange={(e) => patch("timePerLoadMin", Number(e.target.value))}
                          style={inputReset}
                        />
                        <Addon>min</Addon>
                      </Control>
                    </Field>
                  </StaticAcc>
                  <StaticAcc last label="Delivery" desc="Time spent at a customer stop dropping product off.">
                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Field label="Pump rate" help="How fast product pumps off the truck at a stop.">
                          <Control>
                            <input
                              type="number"
                              value={config.pumpRateGalPerMin}
                              onChange={(e) => patch("pumpRateGalPerMin", Number(e.target.value))}
                              style={inputReset}
                            />
                            <Addon>gal/min</Addon>
                          </Control>
                        </Field>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Field
                          label="Shortest delivery"
                          help="No delivery is given less time than this, however small the drop."
                        >
                          <Control>
                            <input
                              type="number"
                              value={config.shortestDeliveryMin}
                              onChange={(e) => patch("shortestDeliveryMin", Number(e.target.value))}
                              style={inputReset}
                            />
                            <Addon>min</Addon>
                          </Control>
                        </Field>
                      </div>
                    </div>
                    <AlertNote flush>
                      A 1,000 gal drop at 50 gal/min is planned as 20 minutes. Anything that works out shorter than 5 min
                      is given 5 min.
                    </AlertNote>
                  </StaticAcc>
                </Grid>
              </PanelChrome>
            )}

            {panel === "goal" && (
              <PanelChrome
                title="Optimization Goal"
                desc="What the routing engine aims for when it has a choice between two workable plans."
              >
                <Grid>
                  <StaticAcc last label="Optimize for" desc="These two run together on every plan.">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {LIVE_OBJECTIVES.map((o) => (
                        <div
                          key={o.engine}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              width: 20,
                              height: 20,
                              flexShrink: 0,
                              borderRadius: 9999,
                              backgroundColor: "#282828",
                              color: "#A3A3A3",
                              fontSize: 12,
                              lineHeight: "20px",
                              textAlign: "center",
                              fontWeight: 500,
                            }}
                          >
                            {o.n}
                          </span>
                          <div style={{ flex: 1.1, minWidth: 0 }}>
                            <Control select>
                              <select
                                value={o.typeLabel}
                                onChange={() => undefined}
                                style={{ ...inputReset, appearance: "none", cursor: "pointer" }}
                              >
                                <option value={o.typeLabel}>{o.typeLabel}</option>
                              </select>
                              <ChevronDown size={16} color="#A3A3A3" />
                            </Control>
                          </div>
                          <div style={{ flex: 1.35, minWidth: 0 }}>
                            <Control select>
                              <select
                                value={o.valueLabel}
                                onChange={() => undefined}
                                style={{ ...inputReset, appearance: "none", cursor: "pointer" }}
                              >
                                <option value={o.valueLabel}>{o.valueLabel}</option>
                              </select>
                              <ChevronDown size={16} color="#A3A3A3" />
                            </Control>
                          </div>
                        </div>
                      ))}
                    </div>
                  </StaticAcc>
                </Grid>
                <AlertNote title="How do goals work?">
                  Goals are applied together and weighed equally. Currently the above two goals pull against each other:
                  fewer trucks means each one runs longer, and finishing earlier usually takes more trucks.
                </AlertNote>
              </PanelChrome>
            )}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: "1px solid #282828", backgroundColor: "#0A0A0A" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: MEASURE,
            maxWidth: "100%",
            margin: "0 auto",
            padding: "20px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              lineHeight: "20px",
              color: "#A3A3A3",
              minHeight: 20,
            }}
          >
            {dirty && (
              <>
                <AlertTriangle size={20} color="#A3A3A3" />
                <span>Unsaved changes</span>
              </>
            )}
            {saved && !dirty && <span style={{ color: "#10B981" }}>Saved</span>}
          </div>
          <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
            <button
              type="button"
              onClick={discard}
              disabled={!dirty}
              style={{
                height: 40,
                padding: "8px 24px",
                borderRadius: 4,
                border: "none",
                fontFamily: "inherit",
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 500,
                cursor: dirty ? "pointer" : "not-allowed",
                opacity: dirty ? 1 : 0.5,
                backgroundColor: "#262626",
                color: "#FAFAFA",
              }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty}
              style={{
                height: 40,
                padding: "8px 24px",
                borderRadius: 4,
                border: "none",
                fontFamily: "inherit",
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 500,
                cursor: dirty ? "pointer" : "not-allowed",
                opacity: dirty ? 1 : 0.5,
                backgroundColor: "#E5E5E5",
                color: "#171717",
              }}
            >
              Confirm and Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RoutingConfigOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!isOpen || !mounted) return null
  return createPortal(<RoutingConfigPanel onClose={onClose} />, document.body)
}
