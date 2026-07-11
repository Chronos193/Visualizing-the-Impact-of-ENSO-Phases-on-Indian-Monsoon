import { useMemo } from "react";
import { useFilters } from "../../context/FilterContext";
import { fetchRainfallAnimation, type ApiAnimation } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { IndiaChoropleth, type PatternDensity } from "../maps/IndiaChoropleth";
import { LoadingState, ErrorState } from "../ui/ErrorState";

function cumColor(v: number, max: number): string {
  // Cap at 1500mm so extreme states like Meghalaya don't wash out the rest of the country
  const cappedMax = Math.min(max, 1500);
  const t = Math.max(0, Math.min(1, v / (cappedMax || 1)));
  const stops: [number, [number, number, number]][] = [
    [0, [248, 250, 252]],   // slate-50 (dry/almost white)
    [0.2, [186, 230, 253]], // sky-200 (light blue)
    [0.5, [56, 189, 248]],  // sky-400 (blue)
    [0.8, [2, 132, 199]],   // sky-600 (dark blue)
    [1, [15, 23, 42]],      // slate-900 (navy)
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * k);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * k);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * k);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return "rgb(15, 23, 42)";
}

function currentDensity(current: number): PatternDensity {
  if (current < 20) return "none";
  if (current < 60) return "light";
  if (current < 120) return "medium";
  return "heavy";
}

interface RainfallAnimatedMapProps {
  year: number;
  height?: number | string;
  patternIdPrefix?: string;
  compareYear?: number;
}

export function RainfallAnimatedMap({
  year,
  height = "100%",
  patternIdPrefix = "rain",
  compareYear,
}: RainfallAnimatedMapProps) {
  const { state, selectRegion, hoverRegion } = useFilters();
  const day = state.playbackDay;

  // Map day (0-153) to week number (22-43)
  const targetWeek = Math.floor(day / 7) + 22;

  const { data: animation, loading, error } = useApiData<
    ApiAnimation,
    ApiAnimation
  >({
    apiFn: () => fetchRainfallAnimation(year),
    transform: (api) => api,
    deps: [year],
  });

  if (loading) return <LoadingState className="h-full" />;
  if (error || !animation) return <ErrorState message={error ?? "No animation data."} />;

  const stateIdByName = Object.fromEntries(Object.entries(STATE_NAME_BY_ID).map(([id, name]) => [name, id]));
  
  // Extract frame for targetWeek
  const frame: Record<string, { cumMm: number; currentMm: number }> = {};
  
  // Find the global maximum cumulative rain across ALL weeks for a stable color scale
  let maxCum = 1;
  
  Object.entries(animation).forEach(([stateName, weeks]) => {
    // Some names from geojson have diacritics (e.g. "Bihār"). Strip them so they match constants.ts
    const normalizedName = stateName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, "and");
    const id = stateIdByName[normalizedName];
    if (!id) return;
    
    // Find global max
    const stateMax = Math.max(...weeks.map(w => w.cumMm));
    if (stateMax > maxCum) maxCum = stateMax;
    
    // Find the specific week
    // If the exact week doesn't exist, we fall back to the closest previous week or zero.
    const currentWeekData = weeks.find(w => w.week === targetWeek) || weeks.find(w => w.week < targetWeek);
    
    if (currentWeekData) {
      frame[id] = { cumMm: currentWeekData.cumMm, currentMm: currentWeekData.currentMm };
    } else {
      frame[id] = { cumMm: 0, currentMm: 0 };
    }
  });

  const colorById: Record<string, string> = {};
  const patternById: Record<string, PatternDensity> = {};
  Object.entries(frame).forEach(([id, cell]) => {
    colorById[id] = cumColor(cell.cumMm, maxCum);
    patternById[id] = currentDensity(cell.currentMm);
  });

  return (
    <IndiaChoropleth
      colorById={colorById}
      patternById={patternById}
      patternIdPrefix={patternIdPrefix}
      height={height}
      selectedRegionId={state.selectedRegionId}
      hoveredRegionId={state.hoveredRegionId}
      onSelect={selectRegion}
      onHover={hoverRegion}
      tooltip={(id) => {
        const cell = frame[id];
        if (!cell) return null;
        return (
          <div>
            <div className="font-medium">{STATE_NAME_BY_ID[id] ?? id}</div>
            <div className="text-muted-foreground">
              Cumulative: {cell.cumMm} mm · now: {cell.currentMm} mm
            </div>
          </div>
        );
      }}
    />
  );
}
