# Route Builder — Design Spec

> Extracted from Figma file: tbb6l7lTDhlN0jFo7pYeJw
> Nodes: 2618-193536 (Screen 1 — Filter Sheet view), 2624-133579 (Screen 2 — Workspace Sheet view)
> Date: 2026-03-09

---

## Screen 1: Filter Sheet View (node 2618-193536)

### Overview
Full app layout showing the Filter Side Sheet expanded on the left (320px wide), the map in the center, and the Route List Sheet collapsed on the right (44px). Total canvas width: 1440px, height: 828px.

### Component hierarchy
```
RB (FRAME, 1440px)
  Top Nav (FRAME)
    Tenant selector dropdown (logo + "Route Builder" / "Back to Dispatch")
    Frame 2147227320 (date button + profile avatar)
  Map + R side sheet (ROW)
    Filter Side Sheet Container (320px)
      Filter Sheet (expanded)
        Header
        Body (filter sections)
        Footer
      Button (collapse tab, positioned at x:320 y:396)
    Map Container (fills remaining width)
    Route List Sheet (collapsed, 44px wide)
    Button (expand tab, positioned at x:-36 y:396 relative to sheet)
```

---

## Screen 2: Workspace Sheet View (node 2624-133579)

### Overview
Full app layout with Filter List collapsed to a thin strip on the left, map in center, and Workspace Side Sheet expanded on the right (560px wide). Total canvas width: 1440px.

### Component hierarchy
```
RB (FRAME, 1440px)
  Top Nav (FRAME)
    Tenant selector dropdown
    Frame 2147227320 (date button + profile avatar)
  Map + R side sheet (ROW)
    Filter List (collapsed, thin strip with settings icon + badge)
    Filter Side Sheet Container (44px)
      Filter List Sheet
      Button (expand tab)
    Map Container (fills remaining width, 828px tall)
    Workspace Side Sheet (560px x 828px)
      Top (header area)
      Top (tabs area)
      Body (route cards)
      Top (footer with Publish Routes button)
```

---

## Color Tokens (consolidated)

### Background colors
| Token | Hex | Usage |
|-------|-----|-------|
| `fill_68IBOC` / `fill_ZLLAIH` | `#111111` | App background, Top Nav, Filter Sheet bg |
| `fill_NDGIJ2` | `#1B1B1B` | Filter footer background |
| `fill_FSXMEQ` | `#1F1F1F` | Route Card background |
| `fill_KRLI0K` / `fill_O50UHW` | `rgba(255,255,255,0)` | Transparent (ghost elements) |
| `fill_EZNCRA` / `fill_DWMYND` | `rgba(255,255,255,0.05)` | Subtle hover/selected bg, Location select bg |
| `fill_QX8ZNP` / `fill_3WLB01` | `rgba(0,0,0,0)` | Transparent checkbox bg (unchecked state) |

### Text colors
| Token | Hex | Usage |
|-------|-----|-------|
| `fill_TKY456` / `fill_FVSC1X` | `#FFFFFF` | Primary text (white) |
| `fill_K7O5YA` / `fill_BJK02E` | `#FAFAFA` | Near-white text (buttons, badges) |
| `fill_RU2J7U` / `fill_PZE9SX` | `#E5E5E5` | Secondary text, checkbox labels |
| `fill_1GNE0N` / `fill_DB510W` | `#A3A3A3` | Muted text (placeholders, counts) |
| `fill_PXJOUC` | `#171717` | Dark text (badge on light bg) |

### Status / accent colors
| Token | Hex | Usage |
|-------|-----|-------|
| `Primary` | `#FA6400` | Orange accent (lasso, logo element) |
| `fill_KX2S7N` / `fill_JEHFCN` | `#3B82F6` | Blue (NA tank level, filter badge) |
| `fill_6CLJ1L` | `#4D55F8` | Indigo (Publish Routes button) |
| `fill_X9FQAC` / `fill_F5N8KK` | `#EC4899` | Pink (Terminal marker) |
| `fill_CSLOQC` / `fill_L94M45` | `#22D3EE` | Cyan (Bulk Plant marker) |
| `fill_7UOOYO` / `fill_UAUQME` | `#854D0E` | Brown/amber (Warehouse marker) |
| `fill_8YWLYD` / `fill_I2RBY9` | `#71717A` | Gray (map pin base) |
| `fill_1YXXBE` / `fill_BMCQPX` | `#262626` | Dark badge bg (route pill bg) |

### Tank level colors
| Token | Hex | Level | Usage |
|-------|-----|-------|-------|
| `fill_YI2SXX` | `#E15252` | High (Red) | Tank threshold dot |
| `fill_TKTW20` | `#FDE68A` | Medium (Yellow) | Tank threshold dot |
| `fill_2BDL95` | `#69BF88` | Low (Green) | Tank threshold dot |
| `fill_EU7PYN` | `#60A5FA` | NA (Blue) | Tank threshold dot |

### Route card color bar colors (left 6px strip on each card)
| Token | Hex | Usage |
|-------|-----|-------|
| `fill_D58HMG` | `#D8B4FE` | Route card color bar (purple) |
| `fill_489TRK` | `#FDBA74` | Route card color bar (orange) |
| `fill_4MZN43` | `#93C5FD` | Route card color bar (blue) |
| `fill_PCZO6K` | `#FBCFE8` | Route card color bar (pink) |
| `fill_UHV5P5` | `#FCA5A5` | Route card color bar (red/pink) |

### Map pin badge colors
| Token | Hex | Usage |
|-------|-----|-------|
| `fill_YO7TEA` | `#AA3C3C` | High tank badge bg |
| `fill_VHRB43` | `#3759A3` | Low(?) tank badge bg (blue) |
| `fill_84JJPH` | `#71B78A` | Green tank badge bg |
| `fill_L2QKVC` | `#CEA655` | Medium/yellow tank badge bg |

### Alert / utilization colors
| Token | Hex | Usage |
|-------|-----|-------|
| `fill_USJ3A4` | `rgba(234,179,8,0.09)` | Alert bar background (yellow tint) |
| `fill_DAC8RY` | `#EAB308` | Alert text color (yellow) |

### Badge variant fills
| Token | Hex | Usage |
|-------|-----|-------|
| `fill_G3XH95` | `rgba(248,113,113,0.6)` | Destructive badge bg (filter count) |

---

## Border / Stroke Tokens

| Token | Color | Weight | Usage |
|-------|-------|--------|-------|
| `stroke_65MQJB` / `stroke_V81U6V` | `#282828` | `0px 0px 1px` | Top Nav bottom border |
| `stroke_GSFJU6` | `#282828` | `0px 1px 0px 0px` | Filter Sheet right border |
| `stroke_5D6VXI` | `rgba(115,115,115,0.2)` | `0px 0px 1px` | Filter header bottom border |
| `stroke_TIYJB2` | `#282828` | `1px` | Select dropdown border |
| `stroke_UPP4R6` / `stroke_DSRDNQ` | `#333333` | `1px` | Button/Checkbox border |
| `stroke_W6M2G2` | `#282828` | `1px 0px 0px` | Filter footer top border |
| `stroke_Z9G147` / `stroke_7VX7OS` | `rgba(115,115,115,0.2)` | `1px` | Route pill border, driver avatar border |
| `stroke_SS9NPP` | `#333333` | `0px 0px 1px` | Workspace tabs bottom border |
| `stroke_L6MGPV` | `#FFFFFF` | `0px 0px 1px` | Active tab indicator |
| `stroke_DNAMJY` | `rgba(115,115,115,0.2)` | `1px 0px 0px` | Workspace footer top border |
| `stroke_471B2P` | `rgba(115,115,115,0.2)` | `1px 0px 1px 1px` | Expand tab border |
| `stroke_SLIOHC` | `rgba(115,115,115,0.2)` | `0px 1px 0px 0px` | Collapsed filter strip border |
| `stroke_6IIE0J` | `rgba(255,255,255,0)` | `1px` | Invisible stroke on badges |
| `stroke_ROE2JB` / `stroke_ZZCQYR` | `#FF9752` | `1px` | Orange lasso button stroke |
| `stroke_CDN7Q2` / `stroke_U53NG6` | `#E5E5E5` | `1.8px` | Map control compass icon |

---

## Shadow / Effect Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `shadow/xs` | `0px 1px 2px 0px rgba(0,0,0,0.05)` | Buttons, checkboxes |
| `shadow/sm` | `0px 1px 2px -1px rgba(0,0,0,0.1), 0px 1px 3px 0px rgba(0,0,0,0.1)` | Route pills |
| `shadow/md` | `0px 2px 4px -2px rgba(0,0,0,0.1), 0px 4px 6px -1px rgba(0,0,0,0.1)` | Route cards |
| `shadow/2xl` | `0px 25px 50px -12px rgba(0,0,0,0.25)` | Filter Sheet, Infrastructure markers |
| `effect_GHQRNH` | `0px 25px 50px -12px rgba(0,0,0,0.25)` | Map pins (same as shadow/2xl) |

---

## Typography Scale

All text uses **Geist** font family.

| Style name | Weight | Size | Line height | Alignment |
|------------|--------|------|-------------|-----------|
| `text-xs/Web/underlined` | 400 | 12px | 1.333em (16px) | CENTER |
| `text-xs/leading-normal/semibold` | 600 | 12px | 1.333em (16px) | LEFT |
| `text-sm/Web/normal` | 400 | 14px | 1.429em (20px) | LEFT |
| `text-sm/Web/medium` | 500 | 14px | 1.429em (20px) | LEFT/CENTER |
| `text-base/Web/light` | 300 | 16px | 1.5em (24px) | LEFT |
| `text-base/Web/normal` | 400 | 16px | 1.5em (24px) | LEFT |
| `text-base/Web/medium` | 500 | 16px | 1.5em (24px) | LEFT/CENTER |
| `text-lg/Web/medium` | 500 | 18px | 1.556em (28px) | LEFT/CENTER |
| `style_98QBK8` (route pill label) | 500 | 10px | 1.4em (14px) | RIGHT/CENTER |
| `style_PBF8X3` | 500 | 10px | — | — |

---

## Component Specs

### Top Navigation Bar

**Layout:** `layout_FR2BII` / `layout_8UPOXL`
- Direction: row, `justify-content: space-between`, `align-items: center`
- Padding: `8px 24px 8px 16px`
- Gap: 717px (space-between effect)
- Height: hug (tall enough for 68px with content)
- Background: `#111111`
- Bottom border: `1px solid #282828`

**Left side — Tenant selector dropdown:**
- Layout: row, `align-items: center`, gap: 8px, padding: `6px 12px`
- Logo: 36×36px IMAGE-SVG
- Toggle (column layout):
  - "Route Builder": `text-base/Web/medium`, color `#FFFFFF`
  - "Back to Dispatch": `text-xs/Web/underlined`, color `#A3A3A3`

**Right side:**
- Date button: Variant=Outline, Size=lg, height=40px, border-radius=4px, padding=`8px 16px`, border=`1px solid #333333`, shadow/xs
  - Left icon: Calendar (16×16px), text: "Tomorrow: Feb 05, 2026", style=`text-sm/Web/medium`
- Profile avatar: 36×36px, layout row with gap 6px

---

### Filter Side Sheet (expanded, Screen 1)

**Container:** `layout_REB549`
- Position: absolute, x:0, y:0
- Width: 320px, height: 828px

**Sheet panel:** `layout_DUL7PS`
- Direction: column
- Width: 320px, height: 828px
- Background: `#111111`
- Right border: `1px solid #282828`
- Shadow: `shadow/2xl`

**Header:** `layout_VTZPZH`
- Direction: column, `align-items: stretch`, gap: 4px
- Padding: `20px 20px 12px`
- Width: 320px (fill)
- Bottom border: `1px solid rgba(115,115,115,0.2)`
- Content row (`layout_12BCVA`): row, `align-items: center`, gap: 8px, fill width
  - Settings2 icon: 24×24px
  - Title row (`layout_JS907E`): row, `align-items: center`, gap: 8px, fill width
    - "Filters" text: `text-lg/Web/medium`, color `#FFFFFF`
    - Badge "1": bg=`#E5E5E5`, color=`#171717`, padding=`2px 8px`, border-radius=4px, `text-sm/Web/medium`
  - "Clear All" button: Ghost/sm variant, padding=`8px 12px`, height=28px, text color `#FAFAFA`

**Body:** `layout_DLHP1X`
- Direction: column, `align-items: stretch`, gap: 20px
- Padding: `16px 20px 20px`
- Fill remaining height

**Inner container:** `layout_SP5510`
- Direction: column, gap: 20px

**Filter sections** (each uses `layout_36QIGI` = column, fill width, gap: 16px):

1. **Location section:**
   - Section title: `text-base/Web/medium`, `#FFFFFF`
   - Select field (`layout_6KWPMG`): column, gap: 8px, width: 280px
     - Select dropdown (`layout_O6RCMQ`): row, `align-items: center`, gap: 8px, padding: `8px 12px`, fill width, bg: `rgba(255,255,255,0.05)`, border-radius: 4px
       - MapPinned icon: 16×16px
       - Inner row (`layout_SJK1AD`): row, gap: 12px, fill width
         - "City" placeholder: `text-base/Web/normal`, `#A3A3A3`
         - Separator: 0×20px
         - "Austin" value: `text-base/Web/medium`, `#FA6400` (Primary)
       - ChevronDown icon: 16×16px

2. **Customer & ShipTo section:**
   - Section title: `text-base/Web/medium`, `#FFFFFF`
   - Inner column (`layout_EOK1Y6`): column, `align-items: stretch`, gap: 8px, fill width
   - Two Select fields (vertical orientation):
     - Customer: placeholder "Customer", icon: Users, border: `1px solid #282828`, border-radius: 4px, padding: `8px 12px`
     - ShipTo: placeholder "ShipTo", icon: MapPin

3. **Driver Details section:**
   - Section title: `text-base/Web/medium`, `#FFFFFF`
   - Select field: placeholder "Driver Group & Drivers", icon: UserCheck

4. **Order Type & Status section (`layout_4VRZ74`, column, gap: 16px, fill width):**

   **Order Type group (`layout_B76DRG`, column, gap: 12px):**
   - Header row: ClipboardType icon (16×16px) + "Order Type" label (`text-sm/Web/medium`, `#A3A3A3`)
   - Checkbox list (`layout_RAKLTE`, column, gap: 4px, fill width):
     - Each row (`layout_LV3IZD`): row, `justify-content: space-between`, gap: 8px, fill width
       - Checkbox + label: `text-base/Web/light`, `#E5E5E5`
       - Count: `text-sm/Web/normal`, `#A3A3A3`
     - Delivery (34), Load (5), Transfer (7), Extraction (0)
   - Checkbox unchecked bg: `rgba(0,0,0,0)`, border: `1px solid #333333`, shadow/xs, border-radius: 4px

   **Order Status group:**
   - Header row: ClipboardList icon + "Order Status" label
   - Scheduled (37), Unassigned (9)

5. **Assets section (`layout_TW09I2`, column, gap: 16px):**
   - Section title: `text-base/Web/medium`, `#FFFFFF`
   - Tank level group (`layout_KBGSUE`, column, gap: 12px, width: 280px):
     - Header row: Fuel icon + "Tank Threshold" label (`text-sm/Web/medium`, `#A3A3A3`)
     - Checkbox list:
       - High (30): `#E15252` dot
       - Medium (24): `#FDE68A` dot
       - Low (14): `#69BF88` dot
       - NA (10): `#60A5FA` dot
     - Each dot: 8×8px ellipse, each row is `layout_1DXUEO` (row, gap: 6px)
     - Label text: `text-base/Web/light`, `#E5E5E5`

**Footer:** `layout_PUCK5U`
- Direction: column, `align-items: stretch`, gap: 12px
- Padding: 20px
- Width: 320px
- Background: `#1B1B1B`
- Top border: `1px solid #282828` (stroke_W6M2G2: `1px 0px 0px`)
- Border-radius: `0px 0px 8px 0px`
- Content row: row, `justify-content: space-between`
  - "5 Routes" with Route icon (20×20px): `text-base/Web/normal`, `#E5E5E5`
  - "78 Orders" with MapPin icon (20×20px): `text-base/Web/normal`, `#E5E5E5`

**Collapse/Expand tab button:**
- Position: absolute, x:320, y:396
- Width: 36px, height: 36px
- Background: `#171717`
- Border-radius: `0px 8px 8px 0px`
- Padding: `8px 12px 8px 16px`
- Contains: left-arrow icon (chevron pointing left)

---

### Filter Sheet Collapsed State (Screen 2)

**Collapsed strip (`layout_V54K3I`):**
- Direction: row, `align-items: center`, gap: 10px
- Padding: `392px 12px` (centers content vertically)
- Width: hug, height: 828px (fixed)
- Background: `#111111`
- Right border: `1px solid rgba(115,115,115,0.2)`
- Contents:
  - Settings2 icon: 20×20px
  - Badge "1": bg=`rgba(248,113,113,0.6)` (Destructive variant), border-radius: 4px, padding: `2px 8px`, 16×16px fixed size, positioned absolute at x:24, y:390

**Expand tab button (`layout_ECQ6QZ`):**
- Position: absolute, x:44, y:396
- Width: 36px, height: 36px
- Background: `rgba(255,255,255,0.05)`
- Border: `1px solid rgba(115,115,115,0.2)` (sides and bottom only: `1px 0px 1px 1px`)
- Border-radius: `0px 8px 8px 0px`
- Padding: `8px 12px 8px 16px`
- Shadow: `shadow/xs`

---

### Workspace Side Sheet (Screen 2)

**Container:** `layout_AP117G`
- Direction: column, `justify-content: space-between`, `align-items: stretch`
- Width: **560px**, height: 828px (fixed)
- Background: `#111111`

---

#### Workspace Header (Top section)

**Layout (`layout_2686P7`):**
- Direction: column, `justify-content: center`, `align-items: stretch`
- Gap: 16px
- Padding: `20px 24px 12px`
- Fill width

**Header row (`layout_DV92LG`):**
- Direction: row, `justify-content: space-between`, `align-items: center`, gap: 16px
- Contents:
  - "45 Orders selected" text: `text-lg/Web/medium`, `#FFFFFF`, fill width (`layout_ID9JPK`)
  - X close button: 24×24px image (icon)

---

#### Workspace Tabs (second Top section)

**Layout (`layout_BGKHCS`):**
- Direction: row, `align-items: center`, gap: 4px
- Padding: `0px 24px`
- Fill width
- Bottom border: `1px solid #333333` (stroke_SS9NPP)

**Active Tab (`layout_OS2PPM`):**
- Direction: row, `align-items: center`, gap: 8px
- Padding: 12px
- Height: 56px (fixed)
- Bottom border: `1px solid #FFFFFF` (stroke_L6MGPV)
- Text: `text-base/Web/medium`, `#FFFFFF`
- Example: "Driver Routes (5)"

**Inactive Tab (`layout_OS2PPM` same dimensions):**
- No bottom border indicator
- Border-radius: 8px
- Text: `text-base/Web/normal`, `#A3A3A3`
- Example: "Unassigned Orders (9)"

---

#### Workspace Body

**Layout (`layout_UXX2Y0`):**
- Direction: column, `align-items: stretch`, gap: 20px
- Padding: `20px 24px`
- Fill width, fill height

**Inner container (`layout_AGKQ54`):**
- Direction: column, `align-items: stretch`, gap: 28px
- Fill width, hug height

**Route Block (`layout_YBLRXI`):**
- Direction: column, gap: 20px
- Fill width, hug height

**"Select All Routes" checkbox row:**
- Uses standard checkbox instance (Checked=No, Show Label=true)
- Label: `text-base/Web/light`, `#E5E5E5`

---

#### Route Group (each route)

**Container (`layout_R0P56H`):**
- Direction: column, `align-items: flex-end`, gap: 12px
- Fill width

**Route row (`layout_81ZXVU`):**
- Direction: row, `align-items: center`, gap: 8px
- Width: 512px (fixed)

**Left side — Checkbox + Chevron (`layout_QGMK0A`):**
- Direction: row, `align-items: center`, gap: 4px
- Checkbox: 16×16px, unchecked (transparent bg, `#333333` border)
- Chevron icon: 24×24px button frame, padding: 6px

**Route card container (`layout_DTFWDC`):**
- Direction: column, `align-items: flex-end`

**Route Card (`layout_6JKE93`):**
- Direction: row, gap: 12px
- Padding: `16px 16px 12px 20px`
- Width: **460px** (fixed)
- Background: `#1F1F1F`
- Shadow: `shadow/md`
- Border-radius: `4px 4px 0px 4px` (flat bottom-left, rounded other corners)
- Height: hug

**Route Card top content row (`layout_6JBTE0`):**
- Direction: column, `align-items: stretch`, gap: 8px, fill width

**Row 1 — Driver + Orders badge (`layout_K48XQG`):**
- Direction: row, `justify-content: space-between`, `align-items: center`, gap: 12px, fill width

  **Left group (`layout_93F1RX`):** row, gap: 12px
    - Avatar circle (`layout_N7JJRZ`): 24×24px, border-radius: 9999px, image fill, border: `1px solid rgba(115,115,115,0.2)`
    - Driver name: `text-base/Web/medium`, `#FFFFFF`

  **Right — Orders badge (`layout_QDZR7D`):**
    - Direction: row, `justify-content: center`, `align-items: center`, gap: 4px
    - Padding: `2px 8px`
    - Background: `#111111`
    - Border-radius: 4px
    - Invisible border (transparent)
    - Badge text: `text-sm/Web/medium`, `#FAFAFA`
    - Examples: "9 Orders", "8 Orders", "6 Orders"

**Row 2 — Planned Qty + Truck (`layout_OKP6D2` or `layout_HJEJLP`):**
- Direction: row, `align-items: center`, gap: 20px, fill width (or hug)

  **Planned Qty group (`layout_QGMK0A`):** row, gap: 4px
    - "Planned Qty:" label: `text-sm/Web/normal`, `#A3A3A3`
    - Value "4,000 gal": `text-sm/Web/medium`, `#E5E5E5`

  **Truck group (`layout_XMVUMZ` or `layout_Q0ZABY`):**
    - Width: 217px fixed (or fill width)
    - "Truck:" label: `text-sm/Web/normal`, `#A3A3A3`
    - Value "H-118 · 2019 Kenworth Tank Wagon": `text-sm/Web/medium`, `#E5E5E5`, fill width

**3-dot menu button (`layout_5NB3UT`):**
- 24×24px fixed
- Padding: `8px 16px`
- Background: transparent (`rgba(255,255,255,0)`)
- Border-radius: 8px
- Ghost variant icon button (3 dots = "more" icon)

---

#### Alert Bar (utilization indicator, attaches below route card)

**Layout (`layout_6I0G9B`):**
- Direction: row, `align-items: center`, gap: 12px
- Padding: `6px 16px 6px 20px`
- Fill width
- Background: `rgba(234,179,8,0.09)` — yellow tint
- Border-radius: `0px 0px 4px 4px` (rounds only bottom corners)

**Content row (`layout_IT3WUL`):** row, `justify-content: space-between`, gap: 8px, fill width
- Utilization delta: `text-sm/Web/normal`, `#EAB308` (yellow)
  - Under-utilized: "-1,000 gal"
  - Over-utilized: "+900 gal"
- Status label: `text-sm/Web/normal`, `#EAB308`
  - "Route under-utilized"
  - "Route over-utilized"

---

#### Color Bar (left edge strip, absolute positioned on route card)

**Layout (`layout_6I63JS`):**
- Position: **absolute**, x:0, y:0
- Width: **6px** (fixed)
- Height: varies by number of stops (112px, 80px, etc.)
- No padding, no border-radius

**Color bar fills per route (5 routes in design):**
1. Route 1 (Mark Ruffalo, 9 orders): `#D8B4FE` (purple)
2. Route 2 (Dwayne Johnson, 8 orders): `#FDBA74` (orange)
3. Route 3 (Jessica Harper, 8 orders): n/a (no alert shown)
4. Route 4 (Kyle Reese, 6 orders): `#FBCFE8` (pink)
5. Route 5 (Forrest Gump, 6 orders): `#FCA5A5` (red-pink)

---

#### Workspace Footer

**Layout (`layout_7GVBVD`):**
- Direction: row, `justify-content: stretch`, `align-items: center`, gap: 10px
- Padding: `20px 24px`
- Fill width, hug height
- Background: `#111111`
- Top border: `1px solid rgba(115,115,115,0.2)` (stroke_DNAMJY, `1px 0px 0px`)

**Publish Routes button (`layout_BB871D`):**
- Direction: row, `justify-content: center`, `align-items: center`, gap: 8px
- Padding: `8px 24px`
- Fill width
- Height: 40px (fixed)
- Background: `#4D55F8` (indigo)
- Border-radius: 4px
- Text: `text-sm/Web/medium`, `#FAFAFA` — "Publish Routes"
- Variant=Default, Size=lg

---

## Map Pin Component Specs (from Screen 2 map pins)

Map pins use component `2417:130671` with these variant properties:
- `Version`: v3
- `Unassigned?`: Yes/No
- `Added to Route?`: Yes/No
- `Mode?`: Default-View / Lasso-Edit
- `Current Route?`: Yes/No
- `Type`: High - Red / Medium - Yellow / Low - Green / NA - Blue
- `Lasso Selected?`: Yes/No
- `State`: Default / Hover
- `TM data present?`: Yes/No
- `Multiple Assets?`: Yes/No
- `Size`: S / M / L
- `ShipTo`: Yes/No

**Pin structure:**
- Vector shape: fill `#71717A` (gray base)
- Ellipse 75 (inner circle): fill `#262626` (dark)
- Badge Number (top-right): 9999px border-radius, colored by tank type
  - High: bg `#AA3C3C` (dark red)
  - Low/Green: bg `#71B78A` (green)
  - Medium: bg `#CEA655` (amber)
  - NA/Blue: bg `#3759A3` (dark blue)
  - text: `text-xs/leading-normal/semibold`, `#262626`

---

## Infrastructure Markers (from Screen 1 map entities)

| Type | Letter | Fill color | Hex |
|------|--------|-----------|-----|
| Terminal | T | `fill_X9FQAC` | `#EC4899` (pink) |
| Bulk Plant | B | `fill_CSLOQC` | `#22D3EE` (cyan) |
| Warehouse | W | `fill_7UOOYO` | `#854D0E` (brown) |
| Hub | H | (Blue) | `#3B82F6` (inferred from CLAUDE.md) |

**Marker base (`layout_ZFBU81` / `layout_2LBH2J`):**
- Padding: 6px
- Width/height: 28px (centered icon)
- Border-radius: 4px
- Shadow: `shadow/2xl`

**Route pill (hover tooltip on markers):**
- Layout: row, `justify-content: center`, gap: 8px, padding: `1px 4px`
- Background: `#262626`
- Border: `1px solid rgba(115,115,115,0.2)`
- Shadow: `shadow/sm`
- Border-radius: 4px
- Text: `style_98QBK8` (Geist 500 10px), `#E5E5E5`
- Route Status=Scheduled, Property 1=Hover

---

## Map Controls (floating panel, Screen 1)

**Container (`layout_7X1ZD9`):**
- Position: absolute, x:1028, y:12 (relative to map container)
- Direction: column, `align-items: flex-end`, gap: 20px
- Width: 36px
- Height: hug

**Control buttons:**
- Standard: 32×32px (`layout_AF78VS`) or 36×36px (`layout_43DEMQ`)
- Padding: `8px 16px`

**Zoom controls group (`layout_K7P4LA`):**
- Width: 32px, height: 96px (3 buttons stacked)

---

## Checkbox Component Spec (across both screens)

**Unchecked state:**
- Box: 16×16px, border-radius: 4px
- Background: `rgba(0,0,0,0)` (transparent)
- Border: `1px solid #333333`
- Shadow: `shadow/xs`

**Layout (`layout_6DP3NU` / `layout_0ZB80S`):**
- Direction: row, `align-items: center`, gap: 10px
- Padding: `4px 0px 0px`

**Label:** `text-base/Web/light`, `#E5E5E5`

---

## Select / Dropdown Component Spec

**Layout (`layout_O6RCMQ`):**
- Direction: row, `align-items: center`, gap: 8px
- Padding: `8px 12px`
- Fill width or fixed width
- Border: `1px solid #282828`
- Border-radius: 4px

**Contents:**
- Left icon: 16×16px
- Placeholder text: `text-base/Web/normal`, `#A3A3A3`
- ChevronDown icon: 16×16px

---

## Global Design Tokens (consolidated)

### Colors
```
Background:
  App/Nav:       #111111
  Panel/Footer:  #1B1B1B
  Card:          #1F1F1F
  Dark badge:    #171717

Border:
  Standard:      #282828
  Subtle:        rgba(115, 115, 115, 0.2)
  Button:        #333333

Text:
  Primary:       #FFFFFF
  Near-white:    #FAFAFA
  Secondary:     #E5E5E5
  Muted:         #A3A3A3
  Disabled:      #737373 (inferred)

Accent:
  Orange/Primary: #FA6400
  Indigo:         #4D55F8
  Blue:           #3B82F6

Status:
  Alert/Yellow:  #EAB308 (text), rgba(234,179,8,0.09) (bg)

Tank levels:
  High (Red):    #E15252 (dot), #AA3C3C (badge bg)
  Medium (Yellow): #FDE68A (dot), #CEA655 (badge bg)
  Low (Green):   #69BF88 (dot), #71B78A (badge bg)
  NA (Blue):     #60A5FA (dot), #3759A3 (badge bg)

Infrastructure:
  Terminal:      #EC4899
  Bulk Plant:    #22D3EE
  Warehouse:     #854D0E

Route bar colors (left strip):
  Purple:   #D8B4FE
  Orange:   #FDBA74
  Blue:     #93C5FD
  Pink:     #FBCFE8
  Red-Pink: #FCA5A5
```

### Typography scale
```
Font family: Geist (all)

xs:   12px, normal(400) or semibold(600)
sm:   14px, normal(400) or medium(500)
base: 16px, light(300), normal(400), or medium(500)
lg:   18px, medium(500)
```

### Spacing scale (from layouts)
```
Panel padding:     20px / 24px
Section gap:       16px / 20px / 28px
Row gap (tight):   4px / 6px / 8px
Row gap (loose):   12px
Card padding:      16px 16px 12px 20px
Footer padding:    20px / 20px 24px
```

### Border radius values
```
4px     — Standard (buttons, badges, inputs, cards)
8px     — Rounded (profile dropdown, tab inactive)
9999px  — Pill/circle (driver avatar, map pin badge)

Route card: 4px 4px 0px 4px (flat bottom-left corner)
Alert bar:  0px 0px 4px 4px (rounded only bottom)
Expand tab: 0px 8px 8px 0px
```

### Component dimensions
```
Top Nav height:              ~52px (8+8px padding + 36px content = 52px, effectively 68px with line heights)
Top Nav padding:             8px 24px 8px 16px
Filter Sheet width:          320px
Filter Sheet collapsed:      ~44px
Workspace Sheet width:       560px
Workspace Route Card width:  460px
Map Controls width:          36px
Color bar width:             6px
Tab height:                  56px
Checkbox size:               16×16px
Avatar size:                 24×24px
Icon standard:               16×16px
Icon large:                  20×20px, 24×24px
Logo:                        36×36px
Button height (lg):          40px
Badge height (sm):           ~22px (2px padding + 18px content)
```

---

## Route Data Shown in Design

**5 driver routes displayed in Workspace Sheet:**

| Driver | Orders | Planned Qty | Truck | Utilization | Bar Color |
|--------|--------|-------------|-------|-------------|-----------|
| Mark Ruffalo | 9 | 4,000 gal | H-118 · 2019 Kenworth Tank Wagon | -1,000 gal (under) | #D8B4FE purple |
| Dwayne Johnson | 8 | 5,100 gal | H-205 · 2021 Peterbilt Tanker | +900 gal (over) | #FDBA74 orange |
| Jessica Harper | 8 | 4,800 gal | H-310 · 2020 Freightliner Tanker | none | — |
| Kyle Reese | 6 | 5,100 gal | H-442 · 2018 Mack Tanker | -1,500 gal (under) | #FBCFE8 pink |
| Forrest Gump | 6 | 3,500 gal | — | -200 gal (under) | #FCA5A5 red |

**Workspace header:** "45 Orders selected"
**Tab 1:** "Driver Routes (5)" — active (white, underlined)
**Tab 2:** "Unassigned Orders (9)" — inactive (gray)
**Footer button:** "Publish Routes" — indigo (#4D55F8), full width

---

## Notes on Interactive States

### Tabs (Active vs Inactive)
- **Active:** `text-base/Web/medium` (500), `#FFFFFF`, bottom border `1px solid #FFFFFF`, height 56px
- **Inactive:** `text-base/Web/normal` (400), `#A3A3A3`, no underline, border-radius 8px

### Checkbox states
- **Unchecked (No):** Transparent bg, `1px solid #333333` border
- **Checked (Yes):** Filled bg (implied, not shown in Figma data — would be `#FA6400` or `#3B82F6` based on context)

### Route card
- Background: `#1F1F1F` (default)
- Shadow: `shadow/md`
- Border-radius: `4px 4px 0px 4px` (specific — flat bottom-left for color bar connection)

### Select/Dropdown placeholder vs selected
- **Placeholder:** `text-base/Web/normal`, `#A3A3A3`
- **Selected value:** `text-base/Web/medium`, `#FA6400` (Primary orange) or `#FFFFFF`

---

*This spec was extracted from Figma JSON output. Raw JSON files have been processed and can be discarded.*
