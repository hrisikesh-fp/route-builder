"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, ChevronDown, X } from "lucide-react"
import {
  DEFAULT_ROUTING_CONFIG,
  OPTIMIZE_FOR_OPTIONS,
  ROAD_PROFILES,
  type OptimizeFor,
  type RoadProfile,
  type RoutingConfig,
} from "@/lib/routing-config-data"

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

function SwitchRow({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string
  desc: string
  on: boolean
  onToggle: () => void
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
        background: "none",
        border: "none",
        padding: 0,
        fontFamily: "inherit",
        textAlign: "left",
        cursor: "pointer",
        opacity: on ? 1 : 0.5,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 300, color: "#E5E5E5" }}>{label}</div>
        <div style={{ fontSize: 14, lineHeight: "20px", color: "#737373" }}>{desc}</div>
      </div>
      <Switch on={on} />
    </button>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 460 }}>
      <label style={{ fontSize: 14, lineHeight: "20px", color: "#A3A3A3" }}>{label}</label>
      {children}
      {help && <div style={{ fontSize: 14, lineHeight: "20px", color: "#737373" }}>{help}</div>}
    </div>
  )
}

function Control({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid #333",
        borderRadius: 4,
        padding: "8px 12px",
        background: "transparent",
        boxShadow: "0 1px 2px rgba(0,0,0,.05)",
      }}
    >
      {children}
    </div>
  )
}

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

function Addon({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        height: 24,
        display: "flex",
        alignItems: "center",
        paddingLeft: 12,
        borderLeft: "1px solid #333",
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

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#1B1B1B",
        border: "1px solid #333",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  )
}

function Row({ children, last }: { children: ReactNode; last?: boolean }) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: last ? "none" : "1px solid #333" }}>
      {children}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: "12px 16px", backgroundColor: "#1F1F1F", fontSize: 14, lineHeight: "20px", color: "#737373" }}>
      {children}
    </div>
  )
}

function Sub({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 16, lineHeight: "24px", fontWeight: 500, color: "#FFF", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: "20px", color: "#737373", marginBottom: 12 }}>{desc}</div>
      {children}
    </div>
  )
}

export function RoutingConfigPanel({
  initial = DEFAULT_ROUTING_CONFIG,
  onClose,
}: {
  initial?: RoutingConfig
  onClose?: () => void
}) {
  const [config, setConfig] = useState<RoutingConfig>(initial)
  const [snapshot] = useState<RoutingConfig>(initial)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  function patch<K extends keyof RoutingConfig>(key: K, value: RoutingConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  function discard() {
    setConfig(snapshot)
    setDirty(false)
    setSaved(false)
  }

  function save() {
    setDirty(false)
    setSaved(true)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#111",
        fontFamily: "Geist, sans-serif",
        color: "#E5E5E5",
      }}
    >
      <div style={{ flexShrink: 0, borderBottom: "1px solid #333", backgroundColor: "#111" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            width: 800,
            maxWidth: "100%",
            margin: "0 auto",
            padding: "20px 24px",
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
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ width: 800, maxWidth: "100%", margin: "0 auto", padding: "24px 24px 40px" }}>
          <Sub
            title="Restrictions"
            desc="Rules the routing engine follows when it builds routes. Switch one off and the engine stops checking it."
          >
            <Card>
              <Row>
                <SwitchRow
                  label="Terminal authorization"
                  desc="Trucks only load at terminals they are approved for."
                  on={config.restrictToAuthorizedTerminals}
                  onToggle={() => patch("restrictToAuthorizedTerminals", !config.restrictToAuthorizedTerminals)}
                />
              </Row>
              <Row>
                <SwitchRow
                  label="Terminal product availability"
                  desc="Trucks are only sent to terminals that carry the product."
                  on={config.filterTerminalsByProduct}
                  onToggle={() => patch("filterTerminalsByProduct", !config.filterTerminalsByProduct)}
                />
              </Row>
              <Row>
                <SwitchRow
                  label="Linked deliveries"
                  desc="Deliveries that share a loading order stay on the same route."
                  on={config.bindLinkedDeliveriesSameRoute}
                  onToggle={() => patch("bindLinkedDeliveriesSameRoute", !config.bindLinkedDeliveriesSameRoute)}
                />
              </Row>
              <Note>Authorized terminals come from the truck record. Product lists come from the terminal record.</Note>
            </Card>
          </Sub>

          <Sub title="Route" desc="How a route is built, and which roads it can use.">
            <Card>
              <Row>
                <Field label="Longest route" help="Routes are planned to finish within this many hours.">
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
              </Row>
              <Row>
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
              </Row>
              <Row last>
                <Field label="Road profile" help="How the engine weighs speed, distance, and hazmat roads.">
                  <Control>
                    <select
                      value={config.profilePreference}
                      onChange={(e) => patch("profilePreference", e.target.value as RoadProfile)}
                      style={{ ...inputReset, appearance: "none", cursor: "pointer" }}
                    >
                      {ROAD_PROFILES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#A3A3A3" />
                  </Control>
                </Field>
              </Row>
            </Card>
          </Sub>

          <Sub title="Loading" desc="Time spent picking up product at a terminal or bulk plant.">
            <Card>
              <Row last>
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
              </Row>
            </Card>
          </Sub>

          <Sub
            title="Delivery"
            desc="Time spent at a customer stop dropping product off. Worked out from the pump rate and the order volume."
          >
            <Card>
              <Row>
                <Field label="Pump rate">
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
              </Row>
              <Row>
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
              </Row>
              <Note>
                Delivery time is the order&apos;s volume divided by the pump rate, or the shortest delivery above,
                whichever is longer. There is no fixed stop time.
              </Note>
            </Card>
          </Sub>

          <Sub
            title="Optimization Goal"
            desc="What the routing engine aims for when it has a choice between two workable plans."
          >
            <Card>
              <Row last>
                <Field label="Optimize for" help="One goal is used for every run.">
                  <Control>
                    <select
                      value={config.optimizeFor}
                      onChange={(e) => patch("optimizeFor", e.target.value as OptimizeFor)}
                      style={{ ...inputReset, appearance: "none", cursor: "pointer" }}
                    >
                      {OPTIMIZE_FOR_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} color="#A3A3A3" />
                  </Control>
                </Field>
              </Row>
            </Card>
          </Sub>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: "1px solid #333", backgroundColor: "#111" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            width: 800,
            maxWidth: "100%",
            margin: "0 auto",
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, lineHeight: "20px", color: "#A3A3A3", minHeight: 20 }}>
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
