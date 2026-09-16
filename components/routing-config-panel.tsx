"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, ChevronDown, Info, X } from "lucide-react"
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

function Switch({ on }: { on: boolean }) {
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
      }}
    >
      <i
        style={{
          display: "block",
          width: 16,
          height: 16,
          borderRadius: 9999,
          backgroundColor: "#0A0A0A",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)",
        }}
      />
    </span>
  )
}

function AlertNote({ children, title }: { children: ReactNode; title?: string }) {
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
        marginBottom: 24,
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
  label: string
  help?: string
  children: ReactNode
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500, color: "#A3A3A3" }}>{label}</label>
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
}: {
  label: string
  desc: string
  on: boolean
  onToggle: () => void
  dim?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 16px",
        background: "none",
        border: "none",
        fontFamily: "inherit",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, opacity: dim ? 0.5 : 1 }}>
        <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#E5E5E5" }}>{label}</div>
        <div style={{ fontSize: 14, lineHeight: "20px", color: "#737373" }}>{desc}</div>
      </div>
      <Switch on={on} />
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
            border: "1px solid #282828",
            borderTop: "none",
            borderBottom: last ? "none" : "1px solid #282828",
            borderRadius: last ? "0 0 4px 4px" : 0,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 24,
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
          border: "1px solid #282828",
          borderTop: "none",
          borderBottom: last ? "none" : "1px solid #282828",
          borderRadius: last ? "0 0 4px 4px" : 0,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 24,
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
              <PanelChrome title="Truck" desc="What a truck can carry, and where it is allowed to load.">
                <Grid>
                  <SwitchRow
                    label="Compartment capacity"
                    desc="Orders are only assigned to a truck if they fit its compartments."
                    on={config.compartmentCapacity}
                    onToggle={() => patch("compartmentCapacity", !config.compartmentCapacity)}
                    dim={!config.compartmentCapacity}
                  />
                  <Divider />
                  <SwitchRow
                    label="Product compatibility"
                    desc="Only load products that can share a compartment, using your comparable and downgradable groups."
                    on={config.productCompatibility}
                    onToggle={() => patch("productCompatibility", !config.productCompatibility)}
                    dim={!config.productCompatibility}
                  />
                  <Divider />
                  <SwitchRow
                    label="Compartment product approvals"
                    desc="Skip compartments that are not approved for the product being loaded."
                    on={config.compartmentProductApprovals}
                    onToggle={() => patch("compartmentProductApprovals", !config.compartmentProductApprovals)}
                    dim={!config.compartmentProductApprovals}
                  />
                  <Divider />
                  <SwitchRow
                    label="Terminal authorization"
                    desc="Trucks only load at terminals they are approved for."
                    on={config.terminalAuthorization}
                    onToggle={() => patch("terminalAuthorization", !config.terminalAuthorization)}
                    dim={!config.terminalAuthorization}
                  />
                </Grid>
                <AlertNote>Compartments, approved products and authorized terminals are set on the Asset page.</AlertNote>
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
                    label="Product qualifications"
                    desc="Drivers are only given products they are qualified to handle."
                    on={config.productQualifications}
                    onToggle={() => patch("productQualifications", !config.productQualifications)}
                    dim={!config.productQualifications}
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
                  Cards, qualifications and working hours are set on the Driver page. Expired cards are skipped for the
                  date being planned.
                </AlertNote>
              </PanelChrome>
            )}

            {panel === "orders" && (
              <PanelChrome title="Order and Customer" desc="When deliveries happen, and which orders come first.">
                <Grid>
                  <SwitchRow
                    label="Delivery windows"
                    desc="Deliveries are planned to arrive inside the window set on the order."
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
              <PanelChrome title="Terminal and Supply" desc="Where trucks can load.">
                <Grid>
                  <SwitchRow
                    label="Terminal product availability"
                    desc="Trucks are only sent to terminals that carry the product."
                    on={config.terminalProductAvailability}
                    onToggle={() => patch("terminalProductAvailability", !config.terminalProductAvailability)}
                    dim={!config.terminalProductAvailability}
                  />
                </Grid>
                <AlertNote>
                  Terminals are commercial entities and hence treated as having unlimited supply.
                </AlertNote>
              </PanelChrome>
            )}

            {panel === "route" && (
              <PanelChrome title="Route" desc="How a route is built, and which roads it can use.">
                <Grid>
                  <Acc
                    label="Shift length"
                    desc="Routes are planned to finish within the shift."
                    on={config.shiftLength}
                    onToggle={() => patch("shiftLength", !config.shiftLength)}
                  >
                    <Field label="Longest Route">
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
                  </Acc>
                  <SwitchRow
                    label="Product continuity"
                    desc="Keep a compartment on the same product between loads, so it does not need flushing."
                    on={config.productContinuity}
                    onToggle={() => patch("productContinuity", !config.productContinuity)}
                    dim={!config.productContinuity}
                  />
                  <Divider />
                  <Acc
                    label="Minimum deliveries per route"
                    desc="Avoid running a truck out for only a couple of drops."
                    on={config.minDeliveries}
                    onToggle={() => patch("minDeliveries", !config.minDeliveries)}
                  >
                    <Field
                      label="Fewest deliveries"
                      help="A route can still go below this if it is the only way to serve an order."
                    >
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
                    <div style={{ marginBottom: 0 }}>
                      <AlertNote>
                        A 1,000 gal drop at 50 gal/min is planned as 20 minutes. Anything that works out shorter than 5
                        min is given 5 min.
                      </AlertNote>
                    </div>
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
                  <StaticAcc last label="Optimize for" desc="These two run together on every plan. They are the only objectives live in UAT today.">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {LIVE_OBJECTIVES.map((o) => (
                        <div
                          key={o.engine}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: "#1B1B1B",
                            border: "1px solid #282828",
                            borderRadius: 4,
                            padding: 8,
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
                          <div
                            style={{
                              flex: 1.1,
                              minWidth: 0,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              padding: "0 12px",
                              border: "1px solid #333",
                              borderRadius: 4,
                              fontSize: 14,
                              lineHeight: "20px",
                              color: "#E5E5E5",
                            }}
                          >
                            {o.typeLabel}
                          </div>
                          <div
                            style={{
                              flex: 1.35,
                              minWidth: 0,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              padding: "0 12px",
                              border: "1px solid #333",
                              borderRadius: 4,
                              fontSize: 14,
                              lineHeight: "20px",
                              color: "#E5E5E5",
                            }}
                          >
                            {o.valueLabel}
                          </div>
                        </div>
                      ))}
                    </div>
                  </StaticAcc>
                </Grid>
                <AlertNote title="How do goals work?">
                  Both run on every plan and the engine weighs them equally. Fewer trucks usually means a later finish.
                  There is no Add — UAT only has these two. Ranking and extra objectives are later.
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
