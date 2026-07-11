import { useMemo, type ReactNode } from "react";
import { useFilters } from "../../context/FilterContext";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { fetchRainfallAnomaly, type ApiRainfallAnomaly } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { rainfallScale } from "../../lib/colorScale";
import { ColorLegend } from "../ColorLegend";
import { IndiaChoropleth } from "../maps/IndiaChoropleth";
import { PanelCard } from "../single/PanelCard";
import { LoadingState, ErrorState } from "../ui/ErrorState";

interface AnomalyDetail {
  pct: number;
  actualMm: number;
  lpaMm: number;
}

function AnomalyMap({ year, prefix }: { year: number; prefix: string }) {
  const { state, selectRegion, hoverRegion } = useFilters();

  const { data: detail, loading, error, refetch } = useApiData<
    ApiRainfallAnomaly,
    Record<string, AnomalyDetail>
  >({
    apiFn: () => fetchRainfallAnomaly(year),
    transform: (api) => {
      const d: Record<string, AnomalyDetail> = {};
      api.states.forEach((s) => {
        // Match by state name to region ID
        const normalizedName = s.state.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, "and").toLowerCase();
        const id = Object.entries(STATE_NAME_BY_ID).find(
          ([, name]) => name.toLowerCase() === normalizedName
        )?.[0] ?? normalizedName.replace(/\s+/g, "_");
        d[id] = { pct: s.deviation_pct, actualMm: s.actual_mm, lpaMm: s.lpa_mm };
      });
      return d;
    },
    deps: [year],
  });

  if (loading) return <LoadingState />;
  if (error || !detail) return <ErrorState message={error ?? "No rainfall data."} onRetry={refetch} />;

  const colorById: Record<string, string> = {};
  Object.entries(detail).forEach(([id, d]) => {
    colorById[id] = rainfallScale(d.pct, 40);
  });

  return (
    <IndiaChoropleth
      colorById={colorById}
      patternIdPrefix={prefix}
      height="100%"
      selectedRegionId={state.selectedRegionId}
      hoveredRegionId={state.hoveredRegionId}
      onSelect={selectRegion}
      onHover={hoverRegion}
      tooltip={(id) => {
        const d = detail[id];
        if (!d) return null;
        return (
          <div>
            <div className="font-medium">{STATE_NAME_BY_ID[id] ?? id}</div>
            <div className="text-muted-foreground">
              {d.actualMm} mm vs {d.lpaMm} mm LPA
            </div>
            <div className="text-muted-foreground">
              {d.pct > 0 ? "+" : ""}
              {d.pct}% deviation
            </div>
          </div>
        );
      }}
    />
  );
}

export function RainfallAnomalyPanel({
  className,
  titleSlot,
}: {
  className?: string;
  titleSlot?: ReactNode;
}) {
  const { state } = useFilters();
  const { compareMode, year, compareYear } = state;

  return (
    <PanelCard
      className={className}
      title={titleSlot ?? "G4 · Seasonal rainfall anomaly"}
      info="Monsoon-season rainfall departure from the Long Period Average (LPA). Brown = deficit, green = surplus."
      bodyClassName="flex flex-col gap-2"
    >
      <div className="min-h-0 flex-1">
        {compareMode ? (
          <div className="grid h-full grid-cols-2 gap-2">
            <div className="flex min-h-0 flex-col">
              <div className="text-muted-foreground text-xs">A · {year}</div>
              <div className="min-h-0 flex-1">
                <AnomalyMap year={year} prefix="anomA" />
              </div>
            </div>
            <div className="flex min-h-0 flex-col">
              <div className="text-muted-foreground text-xs">B · {compareYear}</div>
              <div className="min-h-0 flex-1">
                <AnomalyMap year={compareYear} prefix="anomB" />
              </div>
            </div>
          </div>
        ) : (
          <AnomalyMap year={year} prefix="anom" />
        )}
      </div>
      <ColorLegend
        kind="rainfall"
        domain={40}
        minLabel="drier"
        midLabel="normal"
        maxLabel="wetter"
        className="shrink-0"
      />
    </PanelCard>
  );
}
