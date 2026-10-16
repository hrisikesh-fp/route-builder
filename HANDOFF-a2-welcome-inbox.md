# Dev handoff: Before you plan (welcome modal and inbox)

**Repo:** `hrisikesh-fp/route-builder`
**Branch:** `iter/run-history`
**This doc:** https://github.com/hrisikesh-fp/route-builder/blob/iter/run-history/HANDOFF-a2-welcome-inbox.md
**Local:** `pnpm exec next dev --port 3041` then http://localhost:3041
**Not deployed.** Do not use the old 3D shell Vercel URL for this piece.

ClickUp parent: [A2. Flag stops the plan can't serve](https://app.clickup.com/t/z97h2mpm1n) (Dylan)
Welcome modal: [z97h2mppj2](https://app.clickup.com/t/z97h2mppj2) (Rodrigo)
Inbox: [z97h2mppj3](https://app.clickup.com/t/z97h2mppj3) (Rodrigo)

This is a prototype with mock rows. Some fix links 404 here because Dispatch is not this app. The paths are the real ones. Wire them so Dylan can fill the rows from the check API once the UI is in.

---

## What to build

On Planning, before a run, the dispatcher sees the day's checks.

**Welcome modal.** Heading is **Before you plan**. It opens on load when something is flagged. Two groups only:

- **Needs action.** These can't go into a plan as they are. Fix them in Dispatch, or exclude orders to leave them out of the plan.
- **Heads-up.** These can be planned, but may cause trouble on the day. The risk shows on the route after you plan.

There is no Suggestions group. Those rows were not real checks. Do not add them.

The one-liner sits under the selected tab, not above the tabs. The date in the modal is the same planning date as the header. Changing it in either place changes the day for the whole screen. The mock rows do not change with the date. Real rows will.

**Red strip.** Under the metrics bar, only while something needs action. Review opens the inbox panel.

**Inbox.** Not a left-rail item. The bell opens a dropdown. Each row has the same one-liner. Open panel, or click a group, opens the inbox docked at the bottom and scrolls to that group.

The panel has the same list and table switch as Orders and Trucks. List is cards. Table uses the modal columns: Name, Category, Details, What's wrong, How to fix. The group title and the one-liner sit above that group's table. They are not a row inside the table.

## Fixes

| Button | Where it goes |
|---|---|
| Edit order, Set gallons, Edit window | Route Builder Create Order modal |
| Go to ShipTo | `/self_customer/customer_branches` |
| Go to Truck, Map terminals | `/self_customer/assets` |
| Go to Driver | `/self_customer/drivers` |
| Go to Terminal | `/self_customer/terminals` |
| Go to Bulk plant | `/self_customer/warehouses` |

Dispatch links open in a new tab. Same paths as Routing config. In this proto they 404. In the product they land on the entity page.

Exclude leaves an order out of the plan. It stays in the list, marked Excluded, until Undo.

## Not in this handoff

**Inbox panel positions.** Rodrigo's preview can park a panel on the left, top, or bottom, float it, and open it in a new window. This inbox does not do that. It opens docked at the bottom, with the move menu the other views already have. Do the position pass with the view panels. Do not special-case the inbox.

**Issue lines on Trucks, Orders, and Drivers.** Not here. Those views will be built on this later. ClickUp [z97h2mppj4](https://app.clickup.com/t/z97h2mppj4).

**Checks inside the Workspace.** Waits on the run card. Do not put a second checker there yet.

**Create Route side sheet.** Not part of this. Checks do not open it. It is off in this build.

**Left out of the mock, still with Dylan:** snap-to-road, unroutable, invalid retain, unsupported order type, shift starts at a ship-to, top-off sized from history.

## Decisions, 17 Oct (Rodrigo's four calls)

Use what the API already returns. Do not ask Dylan to change a severity or to build a check he does not have.

- error maps to Needs action. warning maps to Heads-up. info is hidden. The API decides. TWIC expired is a warning, so it is Heads-up. Licence expires mid-shift is an error, so it is Needs action.
- Cut from the design, parked for later: delivery window ends before it starts, driver available for less time than usual, hub with no terminals. Dylan did not build these.
- The same check repeated many times is one row with the count. Example: "45 terminals have no products." Not 45 rows, and not "and 40 more", for now.
- All-clear toast counts orders and trucks only. No driver count. Drop the "(across N product categories)" note on Total Gallons. Both have no data behind them yet.

Parked: those three checks, the info severity, one row per terminal, a driver count in the toast, gallons by category on the tile.

## For Dylan

The UI is mock so the shape is visible before the API is in. Two kinds only, Needs action and Heads-up. When the check API is ready, these rows are what it fills. A date change should load that day's checks. An empty list is all clear only when every source ran. If trucks or drivers failed to load, say so. Do not treat that as all clear.

Parent task is yours: [A2. Flag stops the plan can't serve](https://app.clickup.com/t/z97h2mpm1n).

## Files

| File | What |
|---|---|
| `components/welcome-checks.ts` | Mock rows, the two one-liners, scenario switch |
| `components/welcome-modal.tsx` | Before you plan modal, and the red strip |
| `components/inbox-panel.tsx` | List and table |
| `components/app-header.tsx` | Bell dropdown |
| `components/view-panel.tsx` | Inbox as a docked view |
| `components/side-nav-rail.tsx` | Orders, Trucks, Drivers. No inbox |
| `app/page.tsx` | Opens the modal, the strip, and the panel |
| `contexts/settings-context.tsx` | `welcomeScenario` in localStorage |
| `components/settings-modal.tsx` | HM, Prototype Settings, Welcome checks |

Prototype Settings scenarios: both kinds, heads-up only, syncing, a source failed, all clear.
