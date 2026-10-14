"use client"

import { useMemo, useState } from "react"
import { RUNS, TRUCKS, dayOrders, formatGallons } from "@/lib/run-history-data"
import type { ReasonGroup, UnassignedOrderRef } from "@/lib/run-types"
import { WorkspaceBanner, type CategoryGallons } from "@/components/run/workspace-summary"
import { RunBanner } from "@/components/run/run-banner"
import { IssueLine, IssueStrip, type IssueKind } from "@/components/run/issue-kinds"
import { IssuesBanner, IssuesPanel, type IssueRow } from "@/components/run/issues-panel"
import { RunRouteList } from "@/components/run/run-route-list"
import { RunDetailsDrawer } from "@/components/run/run-details-drawer"
import { TrucksPanel, DriversPanel, type TruckRow } from "@/components/run/trucks-panel"
import { CreateRoutes3Pane } from "@/components/run/create-routes-3pane"
import { RunSnapshotMap } from "@/components/run/run-snapshot-map"
import { RUN } from "@/components/run/run-ui"

// Demo: the Workspace before and after a run (workspace-journey.md, decisions of 14 Oct).
//   Line 1  Workspace banner: Total gallons · Routes (when there are any) · Orders · Available trucks (before a run)
//           + "By product category" accordion, top-off asterisk on gallons
//   Line 2  Run block (after a run): Prashant's run summary panel, restyled; changes only on (re-)optimize
//   Tabs    Routes | Unassigned
//   Below the map: Issues, Trucks and Drivers panels
// Pre-run checks come in three versions to compare: clean, inside the Workspace, or as a panel.
// Open at /dev/workspace.

const WORKSPACE_W = 560
const run = RUNS[1] // Run #6: 27 of 31 planned, 5 routes

type ChecksMode = "clean" | "workspace" | "panel"
type PanelId = "issues" | "trucks" | "drivers"

// Pre-run checks (A2 kinds). Illustrative rows from the frozen check list.
const ORDER_ISSUES: Record<string, { kind: IssueKind; text: string; fix: string }> = {
  "x-liberty": { kind: "action", text: "The ship-to has no location on the map.", fix: "Go to ShipTo" },
  "x-buda": { kind: "headsup", text: "Its delivery window closes before any truck can get there.", fix: "Edit window" },
  "x-hutto": { kind: "suggestion", text: "New since you last planned.", fix: "Dismiss" },
}

const TOP_OFF_ORDERS = ["Ranch Supply Co", "Kyle Fuel Mart"]

const CAPS = [4500, 5000, 4000, 4200, 4800]
const ALL_TRUCKS: (TruckRow & { blocked?: string })[] = [
  ...TRUCKS.map((name, i) => ({ name, capacity: CAPS[i], driver: ["Mark Ruffalo", "Lena Ortiz", "Kyle Reese", "Sam Patel", "Forrest Gump"][i] })),
  { name: "T-150 Volvo", capacity: 4600 },
  { name: "T-161 Western Star", capacity: 5200, driver: "Dana Ortiz" },
  { name: "FP Test TW", capacity: 0, blocked: "0 gal capacity: can't take orders" },
]
const DRIVERS = ALL_TRUCKS.filter((t) => t.driver).map((t) => ({ name: t.driver!, truck: t.name, shift: "06:00 to 16:00" }))

const LATE_ORDERS: UnassignedOrderRef[] = [
  { id: "late-1", name: "Round Rock Paving", latitude: 30.5083, longitude: -97.6489, gallons: 800 },
  { id: "late-2", name: "Manor ISD Bus Yard", latitude: 30.3407, longitude: -97.5569, gallons: 1500 },
  { id: "late-3", name: "Kyle Ready Mix", latitude: 29.9891, longitude: -97.8772, gallons: 1100 },
]

const kindOf = (g: ReasonGroup): IssueKind => (g.tier === "fits_now" ? "suggestion" : "action")

// Products roll up into categories: Clear and Dyed are both Diesel.
function categoriesOf(products: { name: string; gallons: number }[], extra = 0): CategoryGallons[] {
  const diesel = products.filter((p) => p.name === "Clear" || p.name === "Dyed").reduce((s, p) => s + p.gallons, 0) + extra
  const def = products.filter((p) => p.name === "DEF").reduce((s, p) => s + p.gallons, 0)
  return [{ name: "Diesel", gallons: diesel }, { name: "DEF", gallons: def }]
}

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <span role="group" aria-label={label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ color: RUN.t4, marginRight: 2 }}>{label}</span>
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} style={{ height: 26, padding: "0 10px", borderRadius: 13, border: `1px solid ${value === v ? RUN.t3 : RUN.border2}`, background: value === v ? RUN.hover : "transparent", color: value === v ? RUN.t1 : RUN.t3, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
          {l}
        </button>
      ))}
    </span>
  )
}

export default function WorkspaceJourneyDemo() {
  const [stage, setStage] = useState<"before" | "after">("before")
  const [checks, setChecks] = useState<ChecksMode>("workspace")
  const [edits, setEdits] = useState(false)
  const [excluded, setExcluded] = useState<string[]>([])
  const [tab, setTab] = useState<"routes" | "unassigned">("unassigned")
  const [dialog, setDialog] = useState(false)
  const [running, setRunning] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [detailsMode, setDetailsMode] = useState<"floating" | "docked">("floating")
  const [panels, setPanels] = useState<PanelId[]>([])
  const [driverFocus, setDriverFocus] = useState<string | null>(null)

  const orders = useMemo(() => {
    const all = dayOrders()
    return [...all.filter((o) => ORDER_ISSUES[o.id]), ...all.filter((o) => !ORDER_ISSUES[o.id])]
  }, [])
  const r = run.result!

  const openPanel = (p: PanelId) => setPanels((cur) => (cur.includes(p) ? cur : [...cur, p]))
  const closePanel = (p: PanelId) => setPanels((cur) => cur.filter((x) => x !== p))

  const inWorkspace = orders.filter((o) => !excluded.includes(o.id))
  const lateGal = edits ? LATE_ORDERS.reduce((s, o) => s + o.gallons, 0) : 0
  const unplanned = r.unassigned.flatMap((g) => g.orders)

  const issueRows: IssueRow[] = [
    ...Object.entries(ORDER_ISSUES)
      .filter(([id]) => !excluded.includes(id))
      .map(([id, i]) => ({ id, kind: i.kind, entity: orders.find((o) => o.id === id)?.name ?? id, text: i.text, fix: i.fix, exclude: i.kind !== "suggestion" })),
    { id: "t-fp", kind: "action", entity: "FP Test TW", text: "0 gal capacity: this truck can't take orders.", fix: "Edit truck" },
  ]

  const trucksForPanel: TruckRow[] = ALL_TRUCKS.map((t) => {
    const route = r.routes.find((x) => x.truck === t.name)
    if (stage === "after" && route) return { ...t, routeColor: route.color, orders: route.orderCount, miles: route.miles }
    if (stage === "after") return { ...t, unusedReason: t.capacity === 0 ? "0 gal capacity" : !t.driver ? "No driver on shift" : "Not authorized at Flint Hills, the only terminal with Dyed" }
    return { ...t }
  })

  const optimize = () => {
    setDialog(false)
    setRunning(true)
    setTimeout(() => {
      setRunning(false)
      setStage("after")
      setTab("unassigned")
      setPanels(["trucks"])
    }, 1400)
  }

  const preCounts = { action: 0, headsup: 0, suggestion: 0 } as Record<IssueKind, number>
  issueRows.filter((i) => !i.id.startsWith("t-")).forEach((i) => preCounts[i.kind]++)
  const postCounts = { action: 0, headsup: 0, suggestion: 0 } as Record<IssueKind, number>
  r.unassigned.forEach((g) => (postCounts[kindOf(g)] += g.orders.length))

  const tabBtn = (id: "routes" | "unassigned", label: string) => (
    <button type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${tab === id ? RUN.t2 : "transparent"}`, padding: "8px 0", marginBottom: -1, fontSize: 14, color: tab === id ? RUN.t1 : RUN.t3, fontWeight: tab === id ? 500 : 400, fontFamily: "inherit", cursor: "pointer" }}>
      {label}
    </button>
  )

  const orderCard = (o: UnassignedOrderRef, line?: React.ReactNode, dim?: boolean) => {
    const topOff = TOP_OFF_ORDERS.includes(o.name)
    return (
      <div key={o.id} style={{ backgroundColor: RUN.card, borderRadius: 6, padding: "10px 12px", marginTop: 8, opacity: dim ? 0.55 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: RUN.t2, fontSize: 14 }}>{o.name}{topOff && <span style={{ marginLeft: 8, fontSize: 11, color: RUN.warn }}>Top-off</span>}</span>
          <span style={{ color: RUN.t4, fontSize: 12 }}>{dim ? "Excluded" : `${formatGallons(o.gallons)} gal${topOff ? " est." : ""}`}</span>
        </div>
        {line}
      </div>
    )
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", backgroundColor: "#111", color: RUN.t2, fontFamily: "Geist, sans-serif" }}>
      <header style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: 16, padding: "0 16px", borderBottom: `1px solid ${RUN.border}`, fontSize: 12 }}>
        <span style={{ fontWeight: 500, color: RUN.t1, fontSize: 14 }}>Route Builder</span>
        <span style={{ color: RUN.t4 }}>Planning · Tomorrow</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <Seg label="Stage" value={stage} options={[["before", "Before a run"], ["after", "After a run"]]} onChange={(v) => { setStage(v); setTab(v === "before" ? "unassigned" : "routes"); setDrawer(false); setPanels(v === "after" ? ["trucks"] : []) }} />
          {stage === "before" && <Seg label="Checks" value={checks} options={[["clean", "Clean"], ["workspace", "In Workspace"], ["panel", "As a panel"]]} onChange={(v) => { setChecks(v); closePanel("issues") }} />}
          {stage === "after" && <Seg label="Edits" value={edits ? "on" : "off"} options={[["off", "None"], ["on", "3 orders added after"]]} onChange={(v) => setEdits(v === "on")} />}
          {stage === "after" && <Seg label="Run details" value={detailsMode} options={[["floating", "Floating"], ["docked", "Docked in Workspace"]]} onChange={setDetailsMode} />}
        </span>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {/* Map + panels below it */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <RunSnapshotMap
              routes={stage === "after" ? r.routes : []}
              unassigned={stage === "after" ? [...unplanned, ...(edits ? LATE_ORDERS : [])] : inWorkspace}
              label={stage === "after" ? `Workspace after Run #${run.number}` : `${inWorkspace.length} orders in the Workspace, not planned yet`}
            />
          </div>
          {panels.length > 0 && (
            <div style={{ height: 240, flexShrink: 0, display: "flex", gap: 1, backgroundColor: RUN.border }}>
              {panels.map((p) => (
                <div key={p} style={{ flex: 1, minWidth: 0 }}>
                  {p === "issues" && <IssuesPanel rows={issueRows} onClose={() => closePanel("issues")} onExclude={(id) => setExcluded((cur) => [...cur, id])} />}
                  {p === "trucks" && <TrucksPanel trucks={trucksForPanel} onClose={() => closePanel("trucks")} onDriver={(name) => { setDriverFocus(name); openPanel("drivers") }} />}
                  {p === "drivers" && <DriversPanel drivers={DRIVERS} highlighted={driverFocus} onClose={() => closePanel("drivers")} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace */}
        <section aria-label="Workspace" style={{ width: WORKSPACE_W, flexShrink: 0, position: "relative", display: "flex", flexDirection: "column", minHeight: 0, borderLeft: `1px solid ${RUN.border}`, backgroundColor: RUN.panel }}>
          <div style={{ padding: "14px 16px 0", flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: RUN.t1, marginBottom: 10 }}>Workspace</div>

            {/* Line 1: the Workspace banner */}
            <WorkspaceBanner
              gallons={stage === "before" ? inWorkspace.reduce((s, o) => s + o.gallons, 0) : r.gallons + unplanned.reduce((s, o) => s + o.gallons, 0) + lateGal}
              categories={categoriesOf(run.inputs.products, lateGal)}
              routes={stage === "after" ? r.routes.length : 0}
              orders={stage === "before" ? inWorkspace.length : r.total + (edits ? LATE_ORDERS.length : 0)}
              topOffOrders={TOP_OFF_ORDERS}
              availableTrucks={stage === "before" ? ALL_TRUCKS.length : undefined}
              onTrucks={() => openPanel("trucks")}
              onRoutes={() => setTab("routes")}
              onOrders={() => setTab("unassigned")}
              compact={stage === "after"}
            />

            {/* Line 2: the run block */}
            {stage === "after" && (
              <div style={{ marginTop: 10 }}>
                <RunBanner
                  run={run}
                  trucksAvailable={ALL_TRUCKS.length}
                  topOffOrders={TOP_OFF_ORDERS}
                  notInRun={edits ? { routes: 0, orders: LATE_ORDERS.length } : undefined}
                  onDetails={() => setDrawer(true)}
                  onUnassigned={() => setTab("unassigned")}
                  onTrucks={() => openPanel("trucks")}
                />
              </div>
            )}

            <div role="tablist" style={{ display: "flex", gap: 20, marginTop: 12, borderBottom: `1px solid ${RUN.border}` }}>
              {tabBtn("routes", `Routes ${stage === "after" ? r.routes.length : 0}`)}
              {tabBtn("unassigned", `Unassigned ${stage === "after" ? unplanned.length + (edits ? LATE_ORDERS.length : 0) : inWorkspace.length}`)}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 16px 16px" }}>
            {stage === "before" && tab === "routes" && <div style={{ fontSize: 13, color: RUN.t4, padding: "24px 4px" }}>No routes yet. Create Routes builds them from the Unassigned orders.</div>}

            {stage === "before" && tab === "unassigned" && (
              <>
                {checks === "workspace" && <IssueStrip counts={preCounts} scope="in this Workspace" onReview={() => openPanel("issues")} />}
                {checks === "panel" && <IssuesBanner rows={issueRows} onOpen={() => openPanel("issues")} />}
                {orders.map((o) => {
                  const issue = ORDER_ISSUES[o.id]
                  const isEx = excluded.includes(o.id)
                  const line = isEx ? (
                    <div style={{ fontSize: 12, color: RUN.t4, marginTop: 6 }}>
                      Left out of every run until you add it back.{" "}
                      <button type="button" onClick={() => setExcluded((p) => p.filter((x) => x !== o.id))} style={{ background: "none", border: "none", color: RUN.t2, textDecoration: "underline", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Add back</button>
                    </div>
                  ) : checks === "workspace" && issue ? (
                    <IssueLine kind={issue.kind} text={issue.text} fix={issue.fix} exclude={issue.kind !== "suggestion"} onExclude={() => setExcluded((p) => [...p, o.id])} />
                  ) : undefined
                  return orderCard(o, line, isEx)
                })}
              </>
            )}

            {stage === "after" && tab === "routes" && (
              <>
                <IssueStrip counts={{ headsup: r.warnings }} scope="on these routes" />
                <div style={{ marginTop: 8 }}><RunRouteList routes={r.routes} /></div>
              </>
            )}

            {stage === "after" && tab === "unassigned" && (
              <>
                <IssueStrip counts={postCounts} scope={`from Run #${run.number}`} />
                {r.unassigned.flatMap((g) => g.orders.map((o) => orderCard(o, <IssueLine kind={kindOf(g)} text={g.message + "."} fix={g.tier === "fits_now" ? "Show route" : g.hint ? "To fix" : undefined} meta={`Run #${run.number}`} />)))}
                {edits && LATE_ORDERS.map((o) => orderCard(o, <div style={{ fontSize: 12, color: RUN.t4, marginTop: 6 }}>Added after Run #{run.number}. Not in a run yet.</div>))}
              </>
            )}
          </div>

          {drawer && detailsMode === "docked" && (
            <div style={{ height: "45%", flexShrink: 0, minHeight: 0 }}>
              <RunDetailsDrawer run={run} docked onClose={() => setDrawer(false)} />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderTop: `1px solid ${RUN.border}`, flexShrink: 0 }}>
            {stage === "before" ? (
              <button type="button" onClick={() => setDialog(true)} style={{ height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#4D55F8", color: "#fff", fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>Create Routes</button>
            ) : (
              <button type="button" style={{ height: 36, padding: "0 16px", borderRadius: 4, border: "none", background: "#4D55F8", color: "#fff", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", flex: 1 }}>Publish Routes</button>
            )}
          </div>
        </section>
      </div>

      {drawer && detailsMode === "floating" && <RunDetailsDrawer run={run} onClose={() => setDrawer(false)} anchorRight={typeof window !== "undefined" ? window.innerWidth - WORKSPACE_W : undefined} />}

      {dialog && <CreateRoutes3Pane orders={orders} excludedIds={excluded} trucks={ALL_TRUCKS} onClose={() => setDialog(false)} onOptimize={optimize} />}

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
