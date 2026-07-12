import type { Phase } from "../data/types";

type RGB = [number, number, number];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function rgbStr([r, g, b]: RGB, alpha = 1): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

// Diverging blue -> neutral -> red. Neutral midpoint is a soft warm-gray that
// reads fine on both light and dark surfaces.
const COOL: RGB = [37, 99, 235]; // blue-600
const COOL_MID: RGB = [147, 197, 253]; // blue-300
const NEUTRAL: RGB = [148, 163, 184]; // slate-400
const WARM_MID: RGB = [252, 165, 165]; // red-300
const WARM: RGB = [220, 38, 38]; // red-600

/**
 * Diverging scale. `value` in [-domain, +domain] maps blue (negative) ->
 * neutral (0) -> red (positive). Useful for anomalies, ONI, NDVI stress.
 */
export function divergingScale(value: number, domain = 1): string {
  const t = clamp01(Math.abs(value) / domain);
  if (value >= 0) {
    return rgbStr(t < 0.5 ? lerpRgb(NEUTRAL, WARM_MID, t * 2) : lerpRgb(WARM_MID, WARM, (t - 0.5) * 2));
  }
  return rgbStr(t < 0.5 ? lerpRgb(NEUTRAL, COOL_MID, t * 2) : lerpRgb(COOL_MID, COOL, (t - 0.5) * 2));
}

/**
 * High-contrast SST anomaly scale for G1.
 * 5-stop RdBu palette: deep navy → sky → WHITE → orange → deep crimson.
 * White neutral makes warm/cool anomalies immediately legible.
 */
const SST_ANOM_STOPS: [number, RGB][] = [
  [0,    [0,   48,  135]], // deep navy
  [0.25, [74, 144,  226]], // sky blue
  [0.5,  [255, 255, 255]], // white (neutral zero)
  [0.75, [230,  97,   1]], // vivid orange
  [1,    [153,   0,  13]], // deep crimson
];

export function sstAnomalyScale(value: number, domain = 3): string {
  // Normalise to [0, 1]: -domain → 0, 0 → 0.5, +domain → 1
  const t = clamp01((value / domain) * 0.5 + 0.5);
  for (let i = 0; i < SST_ANOM_STOPS.length - 1; i++) {
    const [t0, c0] = SST_ANOM_STOPS[i];
    const [t1, c1] = SST_ANOM_STOPS[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      return rgbStr(lerpRgb(c0, c1, k));
    }
  }
  return rgbStr(SST_ANOM_STOPS[SST_ANOM_STOPS.length - 1][1]);
}

/** Diverging scale where wetter (positive rainfall anomaly) is GREEN, drier is BROWN/RED. */
const DRY: RGB = [180, 83, 9]; // amber-700
const DRY_MID: RGB = [253, 230, 138]; // amber-200
const WET_MID: RGB = [134, 239, 172]; // green-300
const WET: RGB = [21, 128, 61]; // green-700
export function rainfallScale(value: number, domain = 40): string {
  const t = clamp01(Math.abs(value) / domain);
  if (value >= 0) {
    return rgbStr(t < 0.5 ? lerpRgb(NEUTRAL, WET_MID, t * 2) : lerpRgb(WET_MID, WET, (t - 0.5) * 2));
  }
  return rgbStr(t < 0.5 ? lerpRgb(NEUTRAL, DRY_MID, t * 2) : lerpRgb(DRY_MID, DRY, (t - 0.5) * 2));
}

// Sequential cool -> warm for SST (absolute temperatures).
const SST_STOPS: RGB[] = [
  [49, 54, 149], // deep blue (cold)
  [69, 117, 180],
  [171, 217, 233],
  [255, 255, 191], // pale yellow (mid)
  [253, 174, 97],
  [244, 109, 67],
  [165, 0, 38], // dark red (hot)
];
export function sequentialScale(value: number, min: number, max: number): string {
  const t = clamp01((value - min) / (max - min || 1));
  const seg = t * (SST_STOPS.length - 1);
  const i = Math.min(SST_STOPS.length - 2, Math.floor(seg));
  return rgbStr(lerpRgb(SST_STOPS[i], SST_STOPS[i + 1], seg - i));
}

/** Correlation scale on [-1, 1]. */
export function correlationScale(r: number): string {
  return divergingScale(r, 1);
}

const PHASE_COLORS: Record<Phase, string> = {
  "El Niño": "rgb(220, 38, 38)", // warm/red
  "La Niña": "rgb(37, 99, 235)", // cool/blue
  Neutral: "rgb(100, 116, 139)", // slate
};
export function phaseColor(phase: Phase): string {
  return PHASE_COLORS[phase];
}

export interface LegendStop {
  offset: number; // 0..1
  color: string;
}

/** Gradient stops for a reusable <ColorLegend> for a given scale type. */
export function legendStops(
  kind: "diverging" | "rainfall" | "sst" | "correlation" | "sst-anomaly",
  domain = 1,
  sstRange: [number, number] = [22, 31],
): LegendStop[] {
  const n = 12;
  const stops: LegendStop[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let color: string;
    if (kind === "sst") {
      color = sequentialScale(sstRange[0] + t * (sstRange[1] - sstRange[0]), sstRange[0], sstRange[1]);
    } else if (kind === "rainfall") {
      color = rainfallScale((t * 2 - 1) * domain, domain);
    } else if (kind === "sst-anomaly") {
      color = sstAnomalyScale((t * 2 - 1) * domain, domain);
    } else {
      color = divergingScale((t * 2 - 1) * domain, domain);
    }
    stops.push({ offset: t, color });
  }
  return stops;
}
