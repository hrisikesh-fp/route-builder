# Color Backup — V1 (as of 2026-03-18)

Current colors used in capacity validation banners and messages.

## Banner colors (from Figma Phase 1.2.1)

| Element | Background | Text | Icons |
|---------|-----------|------|-------|
| Red banner (L3 runout only) | `rgba(220, 38, 38, 0.2)` | `#dc2626` | TriangleAlert + Info |
| Amber banner (all others) | `rgba(234, 179, 8, 0.09)` | `#eab308` | ArrowUp/ArrowDown + Info |

## Banner variants

| State | Text | Delta | Color |
|-------|------|-------|-------|
| L3 runout | "Gas 87 runs out at Stop 6 + 2 more" | — | Red |
| Exceeding Truck Capacity | "Exceeding Truck Capacity" | ↑ 900 gal | Amber |
| Exceeding Product Capacity | "Exceeding Product Capacity" | 200 gal | Amber |
| Below Truck Capacity | "Below Truck Capacity" | ↓ 1,500 gal | Amber |

## Truck message colors

| State | Color |
|-------|-------|
| Error — L3/L2 issues | `#EF4444` |
| Warning — exceeding/below | `#EAB308` |
| OK (green) | `#4ADE80` |

## Previous colors (pre-Figma alignment)

| Element | Background | Text |
|---------|-----------|------|
| Old red banner | `rgba(239, 68, 68, 0.09)` | `#EF4444` |
| Old amber banner | `rgba(234, 179, 8, 0.09)` | `#EAB308` |
