# Dev handoff: Unassigned orders, Trucks, Drivers

**Repo:** `hrisikesh-fp/route-builder`
**Branch:** `iter/run-history`
**Live:** https://rb-3d-shell-handoff.vercel.app
**Local:** `pnpm exec next dev --port 3041` then http://localhost:3041

This note is the package for the three views. Hrisikesh still has more instructions to add. Do not treat this as the final word until those are in.

Dylan's integration docs, the ones Rodrigo is already reading:

- A1: https://claude.ai/artifact/3HPmc8im4CQtXjP6oRNQqb?sk=NP9lzxLDF7LjSpM73tegAA
- A2: https://claude.ai/artifact/DKi1PXCALvVdkqVbb1HDfU?sk=E_m00dWgZO50yR08zc1pbw

Build against those contracts. The prototype rows are mock.

17 Oct, least effort: the API's severity wins (error = Needs action, warning = Heads-up, info hidden). Three checks Dylan did not build are cut (bad delivery window, short driver day, hub with no terminals). Many hits of the same check are one row with a count. The all-clear toast does not mention drivers. Total Gallons has no category note. Details are in `HANDOFF-a2-welcome-inbox.md`.

## For the implementing agent

**A2 line on an order card.** Do not copy the prototype's red sentence sitting inside the card. Use the message banner the order card already has, on both scheduled cards and unassigned cards. That banner has its own fill. It is not the same fill as the card body. In route-builder-web that is the strip at the bottom of `OrderCard` (`bg-validation-strip-bg`, icon plus one line). Reuse that strip. Put the check's words in it. The kind (needs action, heads-up) can change the icon and the text colour. Do not invent a new banner to match this prototype.

The prototype stamps the seven order checks onto the first seven unassigned orders, because the demo orders are not the same records as the checks. In the product, join the check to the order by id from Dylan's contract.

## The three views

Left rail: Orders, Trucks, Drivers. Each can sit left of the map, above it, or below it.

Use the real rail icons for these three, not stand-in icons. Hover tooltip on each: **Unassigned orders**, **Trucks**, **Drivers**.

Map controls need a tooltip on every button. Zoom in and Zoom out have none. The others in the prototype (expand map, map entities, zoom to fit, save view, lasso, add all to workspace) already have one. Match those, on the left of the button.

The Routes button in the top bar is hidden. That list is not ready for this handoff. The code is still there, behind `false &&` in `components/metrics-bar.tsx`. Do not build a new route view for this pass.

**Unassigned orders.** Cards or table. A check shows on the card and in a What's wrong column. Fix buttons are Edit order, Set gallons, Edit window, Go to ShipTo, Go to Terminal. Dispatch links use the real `/self_customer/...` paths.

**Trucks.** Same card as Create Routes: truck row with the type chip, trailer row with the Trailer chip, driver line under a divider when a driver is mapped. No status chip. Available, In-plan, and Published are not designed yet. Hrisikesh will design that badge. Leave it off. `inPlanTruckIds` and `publishedTruckIds` are still passed in, so the badge can be added without a new data hook.

**Drivers.** Follow the driver row in Dispatch when driver-truck mapping is on (`DriverRow` in `DriverTruckPopover.tsx`): initials circle, name beside it, then a truck icon and truck name, a dot, a trailer icon and trailer name. Email, phone, shift, hub, and terminals sit under that line. Dispatch's row does not have those, so they are extra. Email and phone in the prototype are filled in. They are not from an API. A2 driver lines (Maria Lopez, Jordan Morris, Troy Hall) use the same order-card message rule above when you put them on a real card.

## List and table

When a view opens on the left (the narrow column), it opens as cards. When it opens above the map, below the map, or expanded, it opens as a table. Resizing the window does not switch the view. Moving the panel does not switch it either, unless the panel unmounts and opens again, in which case the default for the new place applies. The list and table buttons still switch it by hand.

A table that is wider than the panel scrolls sideways. Do not squash columns until the headers overlap.

Later, not in this pass: a panel we will call 1/3 (the narrow width) might offer cards only, with no table toggle. Do not build that yet.

## Commented out, put back soon

Filters on Trucks and Drivers, and Group by on the orders table, are commented out with `false &&`. They need work. Add them back as soon as possible. Do not delete the commented blocks.

## Files

| File | What |
|---|---|
| `components/orders-panel.tsx` | Unassigned orders, list or table, check lines |
| `components/list-order-card.tsx` | Card plus the prototype issue line (replace with the real strip) |
| `components/trucks-view.tsx` | Truck and trailer cards, no status badge |
| `components/drivers-view.tsx` | Driver cards and the scrolling table |
| `components/view-panel.tsx` | Dock, and which view is the default when a panel opens |
| `components/data-table.tsx` | Shared table. Narrow panels scroll sideways |
| `components/welcome-checks.ts` | Mock A2 rows |
