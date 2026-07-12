import { INDIA_LOCATIONS } from "./india-map";
import type { Phase } from "./types";

// Data range: NOAA ONI (1950–present), IMD rainfall (–2015), ERSST v6 (2000–2025).
// We restrict the dashboard to 2000–2024 for consistency across all datasets.
export const YEAR_MIN = 2000;
export const YEAR_MAX = 2024;
export const YEARS: number[] = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, i) => YEAR_MIN + i,
);

export const PHASES: Phase[] = ["El Niño", "La Niña", "Neutral"];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Indian Summer Monsoon season: June 1 – September 30 = 122 days. */
export const MONSOON_START_MONTH = 5; // June (0-indexed)
export const MONSOON_DAYS = 122;
export const MONSOON_WEEKS = Math.ceil(MONSOON_DAYS / 7);

export interface RegionMeta {
  id: string;
  name: string;
}

/** All mappable states / UTs, sourced from the bundled India map. */
export const STATES: RegionMeta[] = INDIA_LOCATIONS.map((l) => ({
  id: l.id,
  name: l.name,
}));

export const STATE_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  STATES.map((s) => [s.id, s.name]),
);

export function getIdByStateName(name: string): string {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "and").trim();
  const target = norm(name);
  const found = STATES.find((s) => norm(s.name) === target);
  return found ? found.id : name;
}

/**
 * IMD-style meteorological subdivisions mapped to their parent state id.
 * A representative subset large enough to feel real while staying maintainable.
 */
export interface Subdivision {
  id: string;
  name: string;
  stateId: string;
}

export const SUBDIVISIONS: Subdivision[] = [
  { id: "sd-coastal-ap", name: "Coastal Andhra Pradesh", stateId: "ap" },
  { id: "sd-rayalaseema", name: "Rayalaseema", stateId: "ap" },
  { id: "sd-telangana", name: "Telangana", stateId: "tg" },
  { id: "sd-tn", name: "Tamil Nadu & Puducherry", stateId: "tn" },
  { id: "sd-coastal-ka", name: "Coastal Karnataka", stateId: "ka" },
  { id: "sd-ni-ka", name: "North Interior Karnataka", stateId: "ka" },
  { id: "sd-si-ka", name: "South Interior Karnataka", stateId: "ka" },
  { id: "sd-kerala", name: "Kerala", stateId: "kl" },
  { id: "sd-konkan-goa", name: "Konkan & Goa", stateId: "ga" },
  { id: "sd-madhya-mh", name: "Madhya Maharashtra", stateId: "mh" },
  { id: "sd-marathwada", name: "Marathwada", stateId: "mh" },
  { id: "sd-vidarbha", name: "Vidarbha", stateId: "mh" },
  { id: "sd-guj-region", name: "Gujarat Region", stateId: "gj" },
  { id: "sd-saurashtra", name: "Saurashtra & Kutch", stateId: "gj" },
  { id: "sd-west-mp", name: "West Madhya Pradesh", stateId: "mp" },
  { id: "sd-east-mp", name: "East Madhya Pradesh", stateId: "mp" },
  { id: "sd-chhattisgarh", name: "Chhattisgarh", stateId: "ct" },
  { id: "sd-east-rj", name: "East Rajasthan", stateId: "rj" },
  { id: "sd-west-rj", name: "West Rajasthan", stateId: "rj" },
  { id: "sd-west-up", name: "West Uttar Pradesh", stateId: "up" },
  { id: "sd-east-up", name: "East Uttar Pradesh", stateId: "up" },
  { id: "sd-uttarakhand", name: "Uttarakhand", stateId: "ut" },
  { id: "sd-har-del", name: "Haryana, Chandigarh & Delhi", stateId: "hr" },
  { id: "sd-punjab", name: "Punjab", stateId: "pb" },
  { id: "sd-hp", name: "Himachal Pradesh", stateId: "hp" },
  { id: "sd-jk", name: "Jammu & Kashmir", stateId: "jk" },
  { id: "sd-bihar", name: "Bihar", stateId: "br" },
  { id: "sd-jharkhand", name: "Jharkhand", stateId: "jh" },
  { id: "sd-gangetic-wb", name: "Gangetic West Bengal", stateId: "wb" },
  { id: "sd-sub-him-wb", name: "Sub-Himalayan W. Bengal & Sikkim", stateId: "wb" },
  { id: "sd-odisha", name: "Odisha", stateId: "or" },
  { id: "sd-assam-megh", name: "Assam & Meghalaya", stateId: "as" },
  { id: "sd-naga", name: "Nagaland, Manipur, Mizoram & Tripura", stateId: "nl" },
  { id: "sd-arunachal", name: "Arunachal Pradesh", stateId: "ar" },
];

export const SUBDIVISIONS_BY_STATE: Record<string, Subdivision[]> = SUBDIVISIONS.reduce(
  (acc, sd) => {
    (acc[sd.stateId] ??= []).push(sd);
    return acc;
  },
  {} as Record<string, Subdivision[]>,
);

/** Climate / lag features used by the statistics module. */
export const LAG_FEATURES = [
  { id: "oni", label: "ONI (SST anomaly)" },
  { id: "soi", label: "SOI (pressure)" },
  { id: "iod", label: "IOD (dipole)" },
  { id: "rainfall", label: "Monsoon Rainfall" },
  { id: "onset", label: "Onset Date" },
  { id: "ndvi", label: "NDVI (vegetation)" },
] as const;

export type LagFeatureId = (typeof LAG_FEATURES)[number]["id"];

/** Kharif crop cycle — roughly June (sowing) through October (harvest). */
export const KHARIF_WEEKS = 20;
export const KHARIF_START_MONTH = 5; // June

export const ALL = "All" as const;

// ---------------------------------------------------------------------------
// v3 dashboard additions
// ---------------------------------------------------------------------------

/**
 * Monsoon *animation* window: June 1 – October 31 (Kharif season) = 153 days.
 * Wider than the Jun–Sep `MONSOON_DAYS` so the hero map can play the full crop
 * cycle including the withdrawal tail.
 */
export const MONSOON_ANIM_MONTHS = [5, 6, 7, 8, 9]; // Jun … Oct
export const MONSOON_ANIM_MONTH_DAYS = [30, 31, 31, 30, 31];
export const MONSOON_ANIM_DAYS = MONSOON_ANIM_MONTH_DAYS.reduce((a, b) => a + b, 0); // 153

/** Macro regions grouping states into N / S / E / W / Central for the NDVI panel. */
export interface RegionGroup {
  id: "N" | "S" | "E" | "W" | "C";
  label: string;
  stateIds: string[];
}

export const REGION_GROUPS: RegionGroup[] = [
  { id: "N", label: "North", stateIds: ["jk", "hp", "pb", "hr", "dl", "ch", "ut", "up", "rj"] },
  { id: "S", label: "South", stateIds: ["kl", "tn", "ka", "ap", "tg", "py", "an", "ld"] },
  { id: "E", label: "East & NE", stateIds: ["br", "jh", "wb", "or", "sk", "as", "ml", "ar", "nl", "mn", "mz", "tr"] },
  { id: "W", label: "West", stateIds: ["gj", "mh", "ga", "dn", "dd"] },
  { id: "C", label: "Central", stateIds: ["mp", "ct"] },
];

export const REGION_GROUP_BY_ID: Record<string, RegionGroup> = Object.fromEntries(
  REGION_GROUPS.map((g) => [g.id, g]),
);

/** Named ENSO events for the SST dataset-comparison panel (G1). */
export interface SstEvent {
  id: string;
  label: string;
  /** Peak Niño-3.4 SST anomaly (°C) that seeds the modeled snapshot. */
  oniAnom: number;
}

export const SST_EVENTS: SstEvent[] = [
  { id: "2015", label: "Nov 2015 · El Niño", oniAnom: 2.4 },
  { id: "2020", label: "Nov 2020 · La Niña", oniAnom: -1.2 },
  { id: "2023", label: "Nov 2023 · El Niño", oniAnom: 1.9 },
];
