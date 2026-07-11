# Dashboard Graphs Plan — ENSO × Indian Monsoon (v3)

Full proposal coverage: animated monsoon map, comparison toggle, landscape layout, OISST comparison, ONI detail panels, correlation heatmap.

---

## Your Datasets → Proposal Mapping

| Dataset | What It Covers | Used In Graphs |
|---------|---------------|----------------|
| **State daily rainfall (2009–2024)** | IMD-style state-level daily rain | Graphs 3, 4, 5 |
| **MODIS NDVI (2 km × 2.5 km, 48-day, 2000–2024)** | Vegetation health proxy | Graph 6 |
| **ERSST monthly Pacific SST** | Sea Surface Temperature (2° grid) → ONI | Graphs 1, 2, 5, 6 |
| **OISST daily Pacific SST** *(to download)* | High-res SST (0.25° grid) for comparison | Graph 1 |

---

## The 6 Graphs

### Graph 1 — SST Dataset Comparison: ERSST vs OISST *(Proposal §4.1)*

| Attribute | Detail |
|-----------|--------|
| **Type** | **Side-by-side synchronized heatmaps** |
| **Size** | 🟡 **Small** (supporting context, 25% width) |
| **Data** | ERSST (2° grid) + OISST (0.25° grid), both cropped to Niño 3.4 box (5°N–5°S, 170°W–120°W) |
| **What to plot** | Two heatmaps stacked vertically — ERSST (top, coarse grid) vs OISST (bottom, fine grid). Both use the same **diverging RdBu colorscale** and shared color range. |
| **Interactivity** | Event dropdown: Nov 2015 / Nov 2020 / Nov 2023. Hover tooltip shows exact SST (°C). Synced zoom — pan one map, the other follows. |

> [!NOTE]
> Stacking vertically (not side-by-side) fits the 25%-width column. The visual contrast between ERSST's ~10 grid cells vs OISST's ~640 cells in the same region immediately demonstrates why ERSST is preferred for stable ONI calculation (filters out noise from eddies/upwellings).

---

### Graph 2 — ONI Timeline + Detail-on-Demand Panel *(Proposal §4.2)*

| Attribute | Detail |
|-----------|--------|
| **Type** | **Diverging area chart** (positive = red/El Niño, negative = blue/La Niña) |
| **Size** | 🟠 **Full width** strip (~15% height) — acts as the global time-context anchor |
| **Data** | Derive ONI from ERSST: monthly SST anomaly in Niño 3.4 → 3-month running mean |
| **What to plot** | ONI over full time range; shade ≥ +0.5 red, ≤ −0.5 blue, between = grey |
| **Interactivity** | Brush selector to zoom into time window; hover tooltips with ONI value and phase label |

> [!IMPORTANT]
> This is the **anchor chart**. The brushed time window filters/highlights Graphs 3–6 **and** triggers the detail panel below.

#### 📋 Slide-Out Detail Panel (triggered by brush selection)

When the user brushes a time window on the ONI chart, a **slide-out panel** appears from the right edge of the dashboard (overlays ~30% width) containing 3 sub-charts:

| Sub-chart | Type | What it shows |
|-----------|------|---------------|
| **Phase Distribution Donut** | Donut / pie chart | % of months classified as El Niño / La Niña / Neutral within the brushed window |
| **Seasonal Intensity Heatmap** | Heatmap (month × year) | ONI value colored by intensity for each month-year cell in the selected range. Reveals seasonal patterns (e.g., El Niño peaks in DJF). |
| **ONI Derivation Proof** | Multi-line chart | 4 overlaid lines: (1) Raw SST in Niño 3.4, (2) 30-year base climatology, (3) Monthly anomaly = (1)−(2), (4) 3-month running mean = final ONI. Shows the user *exactly* how ONI is computed. |

> [!TIP]
> The panel slides in/out with a close button (✕). It **overlays** the dashboard rather than rearranging it, so the layout stays stable.

---

### ⭐ Graph 3 — Animated Monsoon Onset Choropleth *(Proposal §4.3)* — **HERO GRAPH**

| Attribute | Detail |
|-----------|--------|
| **Type** | **Animated choropleth map of India** with play/pause controls |
| **Size** | 🔴 **Large** (hero visualization — tallest & widest, central position) |
| **Data** | State daily rainfall → aggregate to bi-weekly or weekly windows for each monsoon season (Jun–Oct) |

#### Encoding Scheme

```
┌──────────────────────────────────────────────────┐
│  Each state on the India map has TWO layers:     │
│                                                  │
│  1. FILL COLOR  → Cumulative rainfall (Jan 1     │
│     to current frame date). Sequential colorscale│
│     light yellow → deep blue.                    │
│     Shows: "How much rain has fallen so far?"    │
│                                                  │
│  2. HATCHING / SHADING OVERLAY → Current-period  │
│     rainfall (this week/fortnight only).          │
│     Density of diagonal lines or dot-pattern     │
│     encodes current rain intensity.              │
│     Light dots = light rain now                  │
│     Dense hatching = heavy rain now              │
│     No shading = dry spell this period           │
│     Shows: "Is it raining RIGHT NOW?"            │
└──────────────────────────────────────────────────┘
```

| Visual Channel | Encodes | Scale |
|----------------|---------|-------|
| **Fill color** (sequential) | Cumulative rainfall to date (mm) | Light yellow → Teal → Deep blue |
| **Hatching/shading density** | Current-period rainfall (mm) | None → Light dots → Dense lines |

#### Animation & Controls

- **▶ Play / ⏸ Pause / ⏪ Rewind** buttons to animate through the monsoon season frame by frame
- **Timeline scrubber** (slider) to jump to any date
- **Speed control** (0.5×, 1×, 2×)
- Frame label shows current date: e.g., `"June 15 – June 30, 2015"`

#### 📈 Embedded Multi-Line Cumulative Chart (below the map)

A small **multi-line chart** sits directly below the animated map within G3's panel:

| Attribute | Detail |
|-----------|--------|
| **What it shows** | Cumulative rainfall (mm) over Jun–Oct for the selected state (clicked/hovered on the map) |
| **Lines** | Current year (solid bold) + LPA baseline (dashed grey). In comparison mode: Year A (solid) + Year B (solid, different hue) + LPA (dashed). |
| **X-axis** | Date (Jun 1 → Oct 31) |
| **Y-axis** | Cumulative rainfall (mm) |
| **Sync** | A vertical marker on this chart moves in sync with the animation frame. The map and the line chart tell the same story simultaneously. |

> [!NOTE]
> This satisfies §4.3's requirement for a "multi-line temporal progression chart" while keeping the animated choropleth as the primary visual.

#### 🔄 Comparison Mode (Toggle Button)

| Mode | Behavior |
|------|----------|
| **Single-year (default)** | One India map, one year selector dropdown |
| **Comparison ON** | Map splits into **two side-by-side India maps** — each with its own year dropdown. Both animate **in sync** (same frame = same date window). A **difference tooltip** on hover shows: `State X: Year A = 320mm, Year B = 180mm, Δ = +140mm (+78%)` |

> [!TIP]
> Typical use: compare an **El Niño year** (e.g., 2015) vs. a **La Niña year** (e.g., 2010) to visually see monsoon delay and deficit in real-time.

---

### Graph 4 — Rainfall Anomaly Choropleth *(Proposal §4.4)*

| Attribute | Detail |
|-----------|--------|
| **Type** | **Static choropleth map of India** (seasonal summary) |
| **Size** | 🟡 **Small-medium** (complements Graph 3 with a seasonal aggregate view) |
| **Data** | State daily rainfall → JJAS total per state per year. `% deviation = (actual − LPA) / LPA × 100` |
| **What to plot** | States colored by % rainfall anomaly, **diverging scale**: brown (deficit) ↔ white (normal) ↔ green (surplus) |
| **Interactivity** | Year dropdown; hover tooltip: state name, actual mm, LPA mm, % deviation |

> [!NOTE]
> This is the **static seasonal summary** complement to Graph 3's animation. Graph 3 shows *how* the monsoon progressed; Graph 4 shows the *final result* for any year.

---

### Graph 5 — ONI vs. Rainfall Correlation *(Proposal §4.5)*

| Attribute | Detail |
|-----------|--------|
| **Type** | **Scatter plot with regression line** + **Correlation heatmap** (tab toggle) |
| **Size** | 🟡 **Small** (analytical/statistical panel, 25% width) |
| **Data** | X = JJAS-average ONI, Y = JJAS rainfall anomaly (%) per state per year |
| **What to plot** | Each dot = one year. Color dots by ENSO phase. OLS regression line. Display Pearson *r* and *p*-value. |
| **Interactivity** | State/region dropdown; hover tooltip: year, ONI, anomaly % |

#### 🔀 Tab Toggle: `[Scatter]` · `[Heatmap]`

Same panel space, two views:

| Tab | Visualization |
|-----|---------------|
| **Scatter** (default) | Scatter plot for one selected state with regression line, Pearson *r*, *p*-value |
| **Heatmap** | Grid of all states showing Pearson *r* as cell color (diverging red–white–blue). Lets the user see *which states* are most ENSO-sensitive at a glance. Clicking a cell switches to Scatter tab for that state. |

> [!TIP]
> The heatmap view satisfies §4.5's requirement for "correlation heatmaps displaying Pearson correlation coefficients" across regions. The scatter view provides the detailed per-state drill-down.

---

### Graph 6 — NDVI vs. ONI (Vegetation Impact) *(Proposal §4.6)*

| Attribute | Detail |
|-----------|--------|
| **Type** | **Dual-axis line chart** |
| **Size** | 🟡 **Small-medium** (supporting impact panel) |
| **Data** | MODIS NDVI regional averages (Kharif: Jun–Oct) + ONI from ERSST |
| **What to plot** | Left axis = NDVI (green line), Right axis = ONI (red/blue shaded). Kharif window highlighted. |
| **Interactivity** | Region dropdown (N/S/E/W/Central); event toggle (2009 drought, 2015 El Niño); hover tooltip |

---

## Landscape Layout (16:9 Widescreen)

The dashboard is designed for **landscape orientation** — wider than tall, optimized for widescreen monitors. All 6 graphs + controls fit in a single viewport without scrolling.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔧 [Year ▼] [Region ▼] [ENSO Phase ▼]           ENSO × INDIAN MONSOON          [⚡ Compare: OFF] │
├────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  G2: ONI Timeline (FULL WIDTH — compact strip, ~15% height)                                       │
│  ▓▓▓▓░░░░░░▓▓▓▓▓▓▓▓░░░░░▓▓▓▓▓▓░░░░░░░▓▓▓▓▓▓▓▓▓▓▓░░░░░░░▓▓▓▓▓▓▓▓░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│  [================brush================]                                                          │
├───────────────────┬────────────────────────────────────────────────────┬───────────────────────────┤
│                   │                                                    │                           │
│  G1: SST Heatmap  │  ⭐ G3: Animated Monsoon Onset Choropleth         │  G4: Rainfall Anomaly     │
│  (Niño 3.4)       │  (HERO — 50% width, ~55% height)                 │  Choropleth               │
│  ~25% width       │                                                    │  ~25% width               │
│  ~30% height      │  ┌────────────┐      ┌────────────┐              │  ~30% height              │
│                   │  │            │      │            │ ← compare    │                           │
│  🟥🟧🟨🟩🟦      │  │   INDIA    │      │   INDIA    │              │  [India Map]              │
│  🟥🟧🟨🟩🟦      │  │   2015     │      │   2010     │              │  Brown ↔ Green            │
│  🟥🟧🟨🟩🟦      │  │            │      │            │              │  (deficit ↔ surplus)      │
│                   │  └────────────┘      └────────────┘              │                           │
│                   │  [▶] [⏸] [⏪] [1×]   ════●══════════             │                           │
│                   │  Jun 15 – Jun 30, 2015    [Legend]               │                           │
├───────────────────┼──────────────────────────┬─────────────────────────┴───────────────────────────┤
│                   │                          │                                                     │
│  G5: ONI vs       │  G6: NDVI vs ONI         │  G6 continued...                                   │
│  Rainfall Scatter │  Dual-axis Line Chart    │  ──── NDVI  ▓▓▓▓ ONI                               │
│  ~25% width       │  (WIDE — 50% width,      │  [Kharif window highlighted]                       │
│  ~25% height      │   ~25% height)           │                                                     │
│  · · ·  /         │                          │                                                     │
│   · · /·          │                          │                                                     │
│    ·/· ·          │                          │                                                     │
│  r = -0.52        │                          │                                                     │
│                   │                          │                                                     │
└───────────────────┴──────────────────────────┴─────────────────────────────────────────────────────┘

 ◄─────────────────────────── 100% viewport width (landscape) ──────────────────────────────────────►
```

### Size Allocation Summary (Landscape)

| Graph | Role | Width | Height | Grid Area |
|-------|------|-------|--------|-----------|
| **G2 — ONI Timeline** | Global anchor | **Full (100%)** | Compact strip (~15%) | Top strip |
| **⭐ G3 — Animated Monsoon** | Hero viz | **50% (center)** | **Tall (~55%)** | Center — dominates the view |
| G1 — SST Heatmap | Supporting | 25% (left) | ~30% | Left of hero (top half) |
| G4 — Rainfall Anomaly | Supporting | 25% (right) | ~30% | Right of hero (top half) |
| G5 — Correlation Scatter | Analytical | 25% (left) | ~25% | Bottom-left |
| **G6 — NDVI vs ONI** | Impact | **75% (wide)** | ~25% | Bottom-right, stretches wide |

> [!TIP]
> The layout follows a **T-shape** hierarchy: ONI strip across the top → Hero monsoon map dominates the center → supporting charts flank left/right → analytical charts line the bottom. The eye naturally flows from global context (top) → core story (center) → evidence (bottom).

---

## Comparison Mode Behavior

When the user clicks **⚡ Compare Mode**:

```
┌─────────────────────────────────────────────┐
│  ⚡ Compare Mode: [ON] 🟢                   │
│  Year A: [2015 ▼]    Year B: [2010 ▼]       │
├─────────────────────────────────────────────┤
│                                             │
│  Affected charts:                           │
│                                             │
│  G3: Splits into two side-by-side maps      │
│      (synced animation)                     │
│                                             │
│  G4: Splits into two mini choropleths       │
│      (Year A vs Year B seasonal totals)     │
│                                             │
│  G3 hover: shows Δ rainfall between years   │
│  G5: Both years highlighted as special dots │
│  G6: Both years' NDVI lines overlaid        │
│                                             │
└─────────────────────────────────────────────┘
```

> [!IMPORTANT]
> In comparison mode, **all 6 graphs react** — maps split, lines overlay, scatter dots highlight. This makes the comparison holistic across ocean → rain → crops.

---

## Shading Detail for Graph 3

Here's exactly how the two visual layers stack on each state:

```
  Normal state rendering:          With current rainfall shading:

  ┌─────────────┐                  ┌─────────────┐
  │             │                  │ / / / / / / │ ← diagonal hatching
  │  Solid fill │                  │/ / / / / / /│   = active rainfall
  │  = cumul.   │                  │ / / / / / / │   this period
  │  rainfall   │                  │/ / / / / / /│
  │             │                  │ / / / / / / │
  └─────────────┘                  └─────────────┘
  Fill: deep teal                  Fill: deep teal (cumulative)
  (high cumul. rain)               Overlay: dense hatching (heavy rain NOW)

  ┌─────────────┐                  ┌─────────────┐
  │             │                  │ ·   ·   ·   │ ← sparse dots
  │  Light fill │                  │   ·   ·   · │   = light drizzle
  │  = low      │                  │ ·   ·   ·   │   this period
  │  cumul.     │                  │   ·   ·   · │
  │             │                  │             │
  └─────────────┘                  └─────────────┘
  Fill: pale yellow                Fill: pale yellow (low cumulative)
  (early monsoon)                  Overlay: sparse dots (light current rain)
```

### Legend for Graph 3

```
┌─ Legend ──────────────────────────────────────┐
│                                                │
│  Cumulative Rainfall (fill color):             │
│  ░░░ 0mm ──── 200mm ──── 500mm ──── 1000mm+  │
│  pale       light       teal       deep blue   │
│  yellow     green                              │
│                                                │
│  Current Rainfall (overlay pattern):           │
│  [   ] No rain   [ · ] Light   [ /// ] Heavy  │
│                                                │
└────────────────────────────────────────────────┘
```
