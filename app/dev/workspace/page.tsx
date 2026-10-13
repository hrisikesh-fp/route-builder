"use client"

import { useMemo, useState } from "react"
import { RUNS, TRUCKS, dayOrders, formatGallons } from "@/lib/run-history-data"
import type { ReasonGroup, UnassignedOrderRef } from "@/lib/run-types"
import { WorkspaceSummaryBefore, WorkspaceSummaryAfter } from "@/components/run/workspace-summary"
import { RunBanner } from "@/components/run/run-banner"
import { IssueLine, IssueStrip, type IssueKind } from "@/components/run/issue-kinds"
import { RunRouteList } from "@/components/run/run-route-list"
import { RunDetailsDrawer } from "@/components/run/run-details-drawer"
import { TrucksPanel, type TruckRow } from "@/components/run/trucks-panel"
import { CreateRoutes3Pane } from "@/components/run/create-routes-3pane"
import { RunSnapshotMap } from "@/components/run/run-snapshot-map"
import { RUN } from "@/components/run/run-ui"

// Demo: the Workspace journey before and after a run (workspace-journey.md, 13 Oct).
// Layers top to bottom: A summary (live) · B run banner (frozen) · C tabs with issue strip ·
// D footer · E trucks panel below the map. Open at /dev/workspace.

const run = RUNS[1] // Run #6: 27 of 31 placed, 5 routes

// Pre-run issues on orders (A2 kinds). Illustrative rows from the frozen check list.
const PRE_ISSUES: Record<string, { kind: IssueKind; text: string; fix: string }> = {
  "x-liberty": { kind: "action", text: "The ship-to has no location on the map.", fix: "Go to ShipTo" },
  "x-buda": { kind: "headsup", text: "Its delivery window closes before any truck can get there.", fix: "Edit window" },
  "x-hutto": { kind: "suggestion", text: "New since you last planned.", fix: "Dismiss" },
}

const CAPS = [4500, 5000, 4000, 4200, 4800]
const ALL_TRUCKS: (TruckRow & { blocked?: string })[] = [
  ...TRUCKS.map((name, i) => ({ name, capacity: CAPS[i], driver: ["Mark Ruffalo", "Mark Ruffalo", "Kyle Reese", "Kyle Reese", "Forrest Gump"][i] })),
  { name: "T-150 Volvo", capacity: 4600 },
  { name: "T-161 Western Star", capacity: 5200, driver: "Dana Ortiz" },
  { name: "FP Test TW", capacity: 0, blocked: "0 gal capacity: can't take orders" },
]

const LATE_ORDERS: UnassignedOrderRef[] = [
  { id: "late-1", name: "Round Rock Paving", latitude: 30.5083, longitude: -97.6489, gallons: 800 },
  { id: "late-2", name: "Manor ISD Bus Yard", latitude: 30.3407, longitude: -97.5569, gallons: 1500 },
  { id: "late-3", name: "Kyle Ready Mix", latitude: 29.9891, longitude: -97.8772, gallons: 1100 },
]

const kindOf = (g: ReasonGroup): IssueKind => (g.tier === "fits_now" ? "suggestion" : "action")

export default function WorkspaceJourneyDemo() {
  const [stage, setStage] = useState<"before" | "after">("before")
  const [edits, setEdits] = useState(false)
  const [excluded, setExcluded] = useState<string[]>([])
  const [tab, setTab] = useState<"routes" | "unassigned">("unassigned")
  const [dialog, setDialog] = useState(false)
  const [running, setRunning] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [trucksOpen, setTrucksOpen] = useState(false)
  const [trucksFlash, setTrucksFlash] = useState(false)

  // Orders with an issue come first, so the strip and the cards line up.
  const orders = useMemo(() => {
    const all = dayOrders()
    return [...all.filter((o) => PRE_ISSUES[o.id]), ...all.filter((o) => !PRE_ISSUES[o.id])]
  }, [])
  const r = run.result!

  // Live Workspace numbers after the run (+ late orders when "edits" is on).
  const lateGal = edits ? LATE_ORDERS.reduce((s, o) => s + o.gallons, 0) : 0
  const unplannedOrders = r.unassigned.flatMap((g) => g.orders)
  const driveMin = Math.round(r.routes.reduce((s, x) => s + (x.miles / 38) * 60, 0))

  const trucksForPanel: TruckRow[] = ALL_TRUCKS.map((t) => {
    const route = r.routes.find((x) => x.truck === t.name)
    if (stage === "after" && route) return { ...t, routeColor: route.color, orders: route.orderCount, miles: route.miles }
    if (stage === "after") return { ...t, unusedReason: t.capacity === 0 ? "0 gal capacity" : !t.driver ? "No driver on shift" : "Not authorized at Flint Hills, the only terminal with Dyed" }
    return { ...t, unusedReason: "Not planned yet" }
  })

  const openTrucks = () => {
    setTrucksOpen(true)
    setTrucksFlash(true)
    setTimeout(() => setTrucksFlash(false), 900)
  }

  const optimize = () => {
    setDialog(false)
    setRunning(true)
    setTimeout(() => {
      setRunning(false)
      setStage("after")
      setTab("unassigned")
      setTrucksOpen(true)
    }, 1400)
  }

  const preCounts = { action: 0, headsup: 0, suggestion: 0 } as Record<IssueKind, number>
  Object.entries(PRE_ISSUES).forEach(([id, i]) => { if (!excluded.includes(id)) preCounts[i.kind]++ })
  const postCounts = { action: 0, headsup: 0, suggestion: 0 } as Record<IssueKind, number>
  r.unassigned.forEach((g) => (postCounts[kindOf(g)] += g.orders.length))

  const tabBtn = (id: "routes" | "unassigned", label: string) => (
    <button type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === id ? RUN.t2 : "transparent"}`, padding: "8px 0", marginBottom: -1, fontSize: 14, color: tab === id ? RUN.t1 : RUN.t3, fontWeight: tab === id ? 500 : 400, fontFamily: "inherit", cursor: "pointer" }}>
      {label}
    </button>
  )

  const orderCard = (o: UnassignedOrderRef, line?: React.ReactNode, dim?: boolean) => (
    <div key={o.id} style={{ backgroundColor: RUN.card, borderRadius: 6, padding: "10px 12px", marginTop: 8, opacity: dim ? 0.55 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ color: RUN.t2, fontSize: 14 }}>{o.name}</span>
        <span style={{ color: RUN.t4, fontSize: 12 }}>{dim ? "Excluded" : `${formatGallons(o.gallons)} gal`}</span>
      </div>
      {line}
    </div>
  )

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", backgroundColor: "#111", color: RUN.t2, fontFamily: "Geist, sans-serif" }}>
      {/* App header (stand-in) */}
      <header style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: 16, padding: "0 16px", borderBottom: `1px solid ${RUN.border}` }}>
        <span style={{ fontWeight: 500, color: RUN.t1 }}>Route Builder</span>
        <span style={{ fontSize: 12, color: RUN.t4 }}>Planning · Tomorrow</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: RUN.t4 }}>
          Demo:
          {(["before", "after"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={stage === s} onClick={() => { setStage(s); setTab(s === "before" ? "unassigned" : "routes"); setDrawer(false) }} style={{ height: 26, padding: "0 10px", borderRadius: 13, border: `1px solid ${stage === s ? RUN.t3 : RUN.border2}`, background: stage === s ? RUN.hover : "transparent", color: stage === s ? RUN.t1 : RUN.t3, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
              {s === "before" ? "Before a run" : "After a run"}
            </button>
          ))}
          {stage === "after" && (
            <button type="button" aria-pressed={edits} onClick={() => setEdits((v) => !v)} style={{ height: 26, padding: "0 10px", borderRadius: 13, border: `1px solid ${edits ? RUN.t3 : RUN.border2}`, background: edits ? RUN.hover : "transparent", color: edits ? RUN.t1 : RUN.t3, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
              {edits ? "✓ " : ""}3 orders added after the run
            </button>
          )}
        </span>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* Map + Trucks panel (E) */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <RunSnapshotMap
              routes={stage === "after" ? r.routes : []}
              unassigned={stage === "after" ? [...unplannedOrders, ...(edits ? LATE_ORDERS : [])] : orders.filter((o) => !excluded.includes(o.id))}
              label={stage === "after" ? `Workspace after Run #${run.number}` : `${orders.length - excluded.length} orders in the Workspace, not planned yet`}
            />
          </div>
          {trucksOpen && (
            <div style={{ height: 230, flexShrink: 0 }}>
              <TrucksPanel trucks={trucksForPanel} highlight={trucksFlash} onClose={() => setTrucksOpen(false)} />
            </div>
          )}
        </div>

        {/* Workspace */}
        <section aria-label="Workspace" style={{ width: 560, flexShrink: 0, position: "relative", display: "flex", flexDirection: "column", minHeight: 0, borderLeft: `1px solid ${RUN.border}`, backgroundColor: RUN.panel }}>
          <div style={{ padding: "14px 16px 0", flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: RUN.t1, marginBottom: 10 }}>Workspace</div>
            {/* A. summary (live) */}
            {stage === "before" ? (
              <WorkspaceSummaryBefore
                orders={orders.length - excluded.length}
                gallons={orders.filter((o) => !excluded.includes(o.id)).reduce((s, o) => s + o.gallons, 0)}
                products={run.inputs.products}
                trucks={{ count: 5, capacity: CAPS.reduce((a, b) => a + b, 0) }}
              />
            ) : (
              <WorkspaceSummaryAfter
                gallons={r.gallons}
                miles={r.miles}
                driveMin={driveMin}
                routes={r.routes.length}
                planned={r.placed}
                unassigned={unplannedOrders.length + (edits ? LATE_ORDERS.length : 0)}
                trucksUsed={r.trucksUsed}
                trucksAvailable={ALL_TRUCKS.length}
                onUnassigned={() => setTab("unassigned")}
                onRoutes={() => setTab("routes")}
                onTrucks={openTrucks}
              />
            )}
            {/* B. run banner (frozen) */}
            {stage === "after" && (
              <div style={{ marginTop: 8 }}>
                <RunBanner run={run} notInRun={edits ? { routes: 0, orders: LATE_ORDERS.length } : undefined} onDetails={() => setDrawer(true)} />
              </div>
            )}
            {/* C. tabs */}
            <div role="tablist" style={{ display: "flex", gap: 20, marginTop: 12, borderBottom: `1px solid ${RUN.border}` }}>
              {tabBtn("routes", `Routes ${stage === "after" ? r.routes.length : 0}`)}
              {tabBtn("unassigned", `Unassigned ${stage === "after" ? unplannedOrders.length + (edits ? LATE_ORDERS.length : 0) : orders.length - excluded.length}`)}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 16px 16px" }}>
            {stage === "before" && tab === "routes" && <div style={{ fontSize: 13, color: RUN.t4, padding: "24px 4px" }}>No routes yet. Create Routes builds them from the Unassigned orders.</div>}

            {stage === "before" && tab === "unassigned" && (
              <>
                <IssueStrip counts={preCounts} scope="in this Workspace" />
                {orders.map((o) => {
                  const issue = PRE_ISSUES[o.id]
                  const isEx = excluded.includes(o.id)
                  return orderCard(
                    o,
                    issue && !isEx ? (
                      <IssueLine kind={issue.kind} text={issue.text} fix={issue.fix} exclude={issue.kind !== "suggestion"} onExclude={() => setExcluded((p) => [...p, o.id])} />
                    ) : isEx ? (
                      <div style={{ fontSize: 12, color: RUN.t4, marginTop: 6 }}>Left out of every run until you add it back. <button type="button" onClick={() => setExcluded((p) => p.filter((x) => x !== o.id))} style={{ background: "none", border: "none", color: RUN.t2, textDecoration: "underline", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Add back</button></div>
                    ) : undefined,
                    isEx,
                  )
                })}
              </>
            )}

            {stage === "after" && tab === "routes" && (
              <>
                <IssueStrip counts={{ headsup: r.warnings }} scope="on these routes" />
                <div style={{ marginTop: 8 }}>
                  <RunRouteList routes={r.routes} />
                </div>
              </>
            )}

            {stage === "after" && tab === "unassigned" && (
              <>
                <IssueStrip counts={postCounts} scope={`from Run #${run.number}`} />
                {r.unassigned.flatMap((g) =>
                  g.orders.map((o) => orderCard(o, <IssueLine kind={kindOf(g)} text={g.message + "."} fix={g.tier === "fits_now" ? "Show route" : g.hint ? "To fix" : undefined} meta={`Run #${run.number}`} />)),
                )}
                {edits && LATE_ORDERS.map((o) => orderCard(o, <div style={{ fontSize: 12, color: RUN.t4, marginTop: 6 }}>Added after Run #{run.number}. Not in a run yet.</div>))}
              </>
            )}
          </div>

          {/* D. footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderTop: `1px solid ${RUN.border}`, flexShrink: 0 }}>
            {stage === "before" ? (
              <button type="button" onClick={() => setDialog(true)} style={{ height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#4D55F8", color: "#fff", fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>Create Routes</button>
            ) : (
              <button type="button" style={{ height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#4D55F8", color: "#fff", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", flex: 1 }}>Publish Routes</button>
            )}
          </div>

          {drawer && <RunDetailsDrawer run={run} onClose={() => setDrawer(false)} />}
        </section>
      </div>

      {dialog && (
        <CreateRoutes3Pane orders={orders} excludedIds={excluded} trucks={ALL_TRUCKS} onClose={() => setDialog(false)} onOptimize={optimize} />
      )}

      {running && (
        <div role="status" style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center" }}>
          <div style={{ backgroundColor: RUN.panel, border: `1px solid ${RUN.border2}`, borderRadius: 10, padding: "24px 32px", textAlign: "center" }}>
            <div style={{ color: RUN.t1, fontWeight: 500 }}>Optimizing routes</div>
            <div style={{ color: RUN.t3, fontSize: 13, marginTop: 4 }}>The screen is blocked while it solves (non-blocking is cut for 17 Oct)</div>
          </div>
        </div>
      )}
    </div>
  )
}

