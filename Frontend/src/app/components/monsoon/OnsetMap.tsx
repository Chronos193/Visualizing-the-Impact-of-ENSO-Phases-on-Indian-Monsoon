import { useMemo } from "react";
import { useFilters } from "../../context/FilterContext";
import { fetchMonsoonOnset, type ApiOnsetData } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { IndiaChoropleth } from "../maps/IndiaChoropleth";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const START = new Date(2000, 5, 1);
function dayLabel(d: number) {
  const date = new Date(START);
  date.setDate(date.getDate() + d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function OnsetMap({ year, height = 420 }: { year: number; height?: number | string }) {
  const { state, selectRegion, hoverRegion } = useFilters();
  const { playbackDay } = state;

  const { data: onset, loading, error, refetch } = useApiData<ApiOnsetData, ApiOnsetData["data"]>({
    apiFn: () => fetchMonsoonOnset(year),
    transform: (api) => api.data,
    deps: [year],
  });

  if (loading) return <LoadingState />;
  if (error || !onset) return <ErrorState message={error ?? "No onset data."} onRetry={refetch} />;

  // Reverse map to get short IDs
  const stateIdByName = Object.fromEntries(Object.entries(STATE_NAME_BY_ID).map(([id, name]) => [name, id]));

  const colorById: Record<string, string> = {};
  onset.forEach((d) => {
    const id = stateIdByName[d.regionId] || d.regionId;
    if (d.onsetDay <= playbackDay) {
      const age = playbackDay - d.onsetDay;
      const t = Math.min(1, age / 30);
      const g = Math.round(120 + t * 80);
      colorById[id] = `rgb(${Math.round(40 + (1 - t) * 80)}, ${g}, ${Math.round(60 + (1 - t) * 30)})`;
    } else {
      colorById[id] = "var(--muted)";
    }
  });

  return (
    <IndiaChoropleth
      colorById={colorById}
      selectedRegionId={state.selectedRegionId}
      hoveredRegionId={state.hoveredRegionId}
      onSelect={selectRegion}
      onHover={hoverRegion}
      height={height}
      tooltip={(id, name) => {
        const d = onset.find((o) => o.regionId === id);
        return (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-muted-foreground">
              {d
                ? d.onsetDay <= playbackDay
                  ? `Monsoon arrived ${dayLabel(d.onsetDay)}`
                  : `Awaiting onset (${dayLabel(d.onsetDay)})`
                : ""}
            </div>
          </div>
        );
      }}
    />
  );
}
