import { useMemo } from "react";
import { useFilters } from "../../context/FilterContext";
import { fetchRainfallAnomaly, type ApiRainfallAnomaly } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { rainfallScale } from "../../lib/colorScale";
import { IndiaChoropleth } from "../maps/IndiaChoropleth";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const RAIN_DOMAIN = 40;

export function RainfallChoroplethPanel({ year, height = 360 }: { year: number; height?: number }) {
  const { state, selectRegion, hoverRegion } = useFilters();

  const { data: anomalyMap, loading, error, refetch } = useApiData<
    ApiRainfallAnomaly,
    Record<string, number>
  >({
    apiFn: () => fetchRainfallAnomaly(year),
    transform: (api) => {
      const out: Record<string, number> = {};
      api.states.forEach((s) => {
        const normalizedName = s.state.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, "and").toLowerCase();
        const id = Object.entries(STATE_NAME_BY_ID).find(
          ([, name]) => name.toLowerCase() === normalizedName
        )?.[0] ?? normalizedName.replace(/\s+/g, "_");
        out[id] = s.deviation_pct;
      });
      return out;
    },
    deps: [year],
  });

  if (loading) return <LoadingState />;
  if (error || !anomalyMap) return <ErrorState message={error ?? "No data."} onRetry={refetch} />;

  const colorById: Record<string, string> = {};
  Object.entries(anomalyMap).forEach(([id, v]) => {
    colorById[id] = rainfallScale(v, RAIN_DOMAIN);
  });

  return (
    <IndiaChoropleth
      colorById={colorById}
      selectedRegionId={state.selectedRegionId}
      hoveredRegionId={state.hoveredRegionId}
      onSelect={selectRegion}
      onHover={hoverRegion}
      height={height}
      tooltip={(id, name) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-muted-foreground">
            {year}: {anomalyMap[id] > 0 ? "+" : ""}
            {anomalyMap[id]}%
          </div>
        </div>
      )}
    />
  );
}
