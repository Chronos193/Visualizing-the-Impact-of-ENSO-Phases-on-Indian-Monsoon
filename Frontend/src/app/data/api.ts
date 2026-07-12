/**
 * API service layer — typed fetch wrappers for every backend endpoint.
 *
 * During development, requests to `/api/*` are proxied to the FastAPI
 * backend via the Vite dev proxy (see vite.config.ts).
 *
 * Every function returns `null` when the API is unreachable so that
 * callers can show an error state via the useApiData hook.
 */

const API_BASE = "/api";

// ---------------------------------------------------------------------------
// Generic helper
// ---------------------------------------------------------------------------

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// SST (G1)
// ---------------------------------------------------------------------------

export interface ApiSstGrid {
  dataset: string;
  date: string;
  grid: {
    lat_range: [number, number];
    lon_range: [number, number];
    lat_step: number;
    lon_step: number;
    values: { lat: number; lon: number; sst: number }[];
  };
}

export function fetchSstGrid(
  dataset: string = "ersst",
  event: string = "nov_2015",
): Promise<ApiSstGrid | null> {
  return fetchJson<ApiSstGrid>(`/sst/grid?dataset=${dataset}&event=${event}`);
}

export function fetchSstGridYear(year: number): Promise<ApiSstGrid | null> {
  return fetchJson<ApiSstGrid>(`/sst/grid-year?year=${year}`);
}

// ---------------------------------------------------------------------------
// ONI (G2)
// ---------------------------------------------------------------------------

export interface ApiOniTimeseriesItem {
  year_month: string;
  oni: number;
  phase: string;
}

export interface ApiOniTimeseries {
  data: ApiOniTimeseriesItem[];
}

export function fetchOniTimeseries(): Promise<ApiOniTimeseries | null> {
  return fetchJson<ApiOniTimeseries>("/oni/timeseries");
}

export interface ApiOniDetail {
  year_month: string;
  sst_raw: number;
  climatology: number;
  anomaly: number;
  oni: number;
  phase: string;
}

export function fetchOniDetails(
  start: string,
  end: string,
): Promise<{ data: ApiOniDetail[] } | null> {
  return fetchJson(`/oni/details?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
}

export interface ApiPhaseSummaryItem {
  phase: string;
  count: number;
}

export function fetchOniPhaseSummary(
  start: string,
  end: string,
): Promise<{ phases: ApiPhaseSummaryItem[] } | null> {
  return fetchJson(`/oni/phase-summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
}

// ---------------------------------------------------------------------------
// Rainfall (G3 / G4)
// ---------------------------------------------------------------------------

export interface ApiRainfallAnomalyState {
  state: string;
  actual_mm: number;
  lpa_mm: number;
  deviation_pct: number;
}

export interface ApiRainfallAnomaly {
  year: number;
  season: string;
  states: ApiRainfallAnomalyState[];
}

export function fetchRainfallAnomaly(
  year: number,
): Promise<ApiRainfallAnomaly | null> {
  return fetchJson<ApiRainfallAnomaly>(`/rainfall/anomaly?year=${year}`);
}

export interface ApiCumulativeDay {
  date: string;
  daily_mm: number;
  cumulative_mm: number;
}

export interface ApiRainfallCumulative {
  state: string;
  year: number;
  daily: ApiCumulativeDay[];
}

export function fetchRainfallCumulative(
  state: string,
  year: number,
): Promise<ApiRainfallCumulative | null> {
  return fetchJson<ApiRainfallCumulative>(
    `/rainfall/cumulative?state=${encodeURIComponent(state)}&year=${year}`,
  );
}

export interface ApiAnimationFrameState {
  state: string;
  current_rain: number;
  cumulative_rain: number;
}

export function fetchRainfallAnimationFrame(
  year: number,
  startDate: string,
  endDate: string,
): Promise<{ frame: ApiAnimationFrameState[] } | null> {
  return fetchJson(
    `/rainfall/animation-frame?year=${year}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`,
  );
}

export interface ApiAnimationWeek {
  week: number;
  currentMm: number;
  cumMm: number;
}

export type ApiAnimation = Record<string, ApiAnimationWeek[]>;

export function fetchRainfallAnimation(year: number): Promise<ApiAnimation | null> {
  return fetchJson<ApiAnimation>(`/rainfall/animation?year=${year}`);
}

export interface ApiSeasonalHeatmap {
  year: number;
  rows: string[];
  cols: string[];
  cells: { row: number; col: number; value: number }[];
}

export function fetchSeasonalHeatmap(year: number): Promise<ApiSeasonalHeatmap | null> {
  return fetchJson<ApiSeasonalHeatmap>(`/rainfall/seasonal-heatmap?year=${year}`);
}

export interface ApiCalendarHeatmap {
  state: string;
  year: number;
  weeks: number;
  cells: { day: number; weekIndex: number; weekday: number; date: string; rainfallMm: number }[];
}

export function fetchCalendarHeatmap(
  state: string,
  year: number,
): Promise<ApiCalendarHeatmap | null> {
  return fetchJson<ApiCalendarHeatmap>(
    `/rainfall/calendar?state=${encodeURIComponent(state)}&year=${year}`,
  );
}

export interface ApiOnsetDatum {
  regionId: string;
  regionName: string;
  onsetDay: number;
}

export interface ApiOnsetData {
  year: number;
  data: ApiOnsetDatum[];
}

export function fetchMonsoonOnset(year: number): Promise<ApiOnsetData | null> {
  return fetchJson<ApiOnsetData>(`/rainfall/onset?year=${year}`);
}

// ---------------------------------------------------------------------------
// Correlation (G5)
// ---------------------------------------------------------------------------

export interface ApiCorrelationHeatmapEntry {
  state: string;
  r: number;
  p_value: number;
}

export interface ApiCorrelationHeatmap {
  states: string[];
  pearson_r: ApiCorrelationHeatmapEntry[];
}

export function fetchCorrelationHeatmap(): Promise<ApiCorrelationHeatmap | null> {
  return fetchJson<ApiCorrelationHeatmap>("/correlation/heatmap");
}

export interface ApiScatterPoint {
  year: number;
  oni: number;
  anomaly_pct: number;
  phase: string;
}

export interface ApiCorrelationScatter {
  state: string;
  pearson_r: number;
  p_value: number;
  regression: { slope: number; intercept: number };
  points: ApiScatterPoint[];
}

export function fetchCorrelationScatter(
  state: string,
): Promise<ApiCorrelationScatter | null> {
  return fetchJson<ApiCorrelationScatter>(
    `/correlation/scatter?state=${encodeURIComponent(state)}`,
  );
}

export interface ApiLagFeatureCorrelation {
  features: { id: string; label: string }[];
  cells: { xFeature: string; yFeature: string; row: number; col: number; r: number }[];
  series: Record<string, { year: number; value: number }[]>;
  years: number[];
}

export function fetchLagFeatureCorrelation(): Promise<ApiLagFeatureCorrelation | null> {
  return fetchJson<ApiLagFeatureCorrelation>("/correlation/lag-features");
}

// ---------------------------------------------------------------------------
// NDVI (G6)
// ---------------------------------------------------------------------------

export interface ApiNdviRegionalPoint {
  composite_start: string;
  mean_ndvi: number;
  ndvi_anomaly: number;
  oni: number;
}

export interface ApiNdviRegional {
  region: string;
  season_filter: string;
  data: ApiNdviRegionalPoint[];
}

export function fetchNdviRegional(
  region: string = "south",
): Promise<ApiNdviRegional | null> {
  return fetchJson<ApiNdviRegional>(
    `/ndvi/regional?region=${encodeURIComponent(region)}`,
  );
}

export interface ApiNdviNational {
  region: string;
  data: ApiNdviRegionalPoint[];
}

export function fetchNdviNational(): Promise<ApiNdviNational | null> {
  return fetchJson<ApiNdviNational>("/ndvi/national");
}
