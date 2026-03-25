# R2 Fix + Layout Alignment Plan

Saved for reference. See the implementation commit for details.

## Changes made

1. **Route 2 (Dwayne Johnson)** — Removed `r2-load` order to make it a pure L1-only scenario (5 deliveries, 5,100 gal vs 4,200 gal truck)
2. **Capacity validation** — L1 banner now shows even when `noFuelLoaded` (truck assigned but no load orders)
3. **Banner inside card** — Moved banner from external div into the card wrapper, within the same container as RouteCardCollapsed
4. **One unified banner** — Removed separate expanded validation banner from ExpandedRouteCard; the card banner now expands to show bullet points when route is expanded
5. **Info icon on all states** — Every banner variant now has the ⓘ icon (previously missing on states without a delta value)
6. **Time formatting** — Load order cards now use MOCK_STOP_TIMES instead of showing raw scheduledDate
7. **Color backup** — Saved current color values to `docs/color-backup-v1.md`
