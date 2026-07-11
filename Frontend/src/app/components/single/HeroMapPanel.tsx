import { useMemo, useState } from "react";
import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { fetchRainfallAnomaly, type ApiRainfallAnomaly } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { rainfallScale } from "../../lib/colorScale";
import { ColorLegend } from "../ColorLegend";
import { IndiaChoropleth } from "../maps/IndiaChoropleth";
import { LoadingState, ErrorState } from "../ui/ErrorState";
import { OnsetMap } from "../monsoon/OnsetMap";
import { PlaybackControls } from "../monsoon/PlaybackControls";
import { PanelCard } from "./PanelCard";
import { ViewSelect } from "./ViewSelect";

const RAIN_DOMAIN = 40;

const VIEWS = [
  { value: "rainfall", label: "Rainfall anomaly" },
  { value: "onset", label: "Monsoon onset" },
];

export function HeroMapPanel() {
  const { state, selectRegion, hoverRegion } = useFilters();
  const { getYearPhase } = useData();
  const { year, selectedRegionId, hoveredRegionId } = state;
  const [view, setView] = useState("rainfall");

  const { data: anomalyMap, loading, error } = useApiData<ApiRainfallAnomaly, Record<string, number>>({
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

  const colorById = useMemo(() => {
    if (!anomalyMap) return {};
    const out: Record<string, string> = {};
    Object.entries(anomalyMap).forEach(([id, v]) => {
      out[id] = rainfallScale(v, RAIN_DOMAIN);
    });
    return out;
  }, [anomalyMap]);

  return (
    <PanelCard
      className="col-span-12 row-span-6 lg:col-span-3"
      title={view === "rainfall" ? `Rainfall anomaly — ${year}` : `Monsoon onset — ${year}`}
      info={
        view === "rainfall"
          ? "Departure of monsoon-season rainfall from the long-period average. Green = wetter, brown = drier. Click a state to coordinate every panel."
          : "States shade in as the monsoon arrives. Press play to sweep the season day-by-day."
      }
      actions={<ViewSelect value={view} onChange={setView} options={VIEWS} />}
      bodyClassName="flex flex-col gap-2"
    >
      <div className="min-h-0 flex-1">
        {view === "rainfall" ? (
          loading ? (
            <LoadingState className="h-full" />
          ) : error || !anomalyMap ? (
            <ErrorState message={error ?? "No rainfall data."} />
          ) : (
            <IndiaChoropleth
              colorById={colorById}
              selectedRegionId={selectedRegionId}
              hoveredRegionId={hoveredRegionId}
              onSelect={selectRegion}
              onHover={hoverRegion}
              height="100%"
              tooltip={(id, name) => (
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-muted-foreground">
                    Rainfall anomaly: {anomalyMap[id] > 0 ? "+" : ""}
                    {anomalyMap[id]}%
                  </div>
                </div>
              )}
            />
          )
        ) : (
          <OnsetMap year={year} height="100%" />
        )}
      </div>

      {view === "rainfall" ? (
        <ColorLegend kind="rainfall" domain={RAIN_DOMAIN} minLabel="−40%" midLabel="normal" maxLabel="+40%" />
      ) : (
        <div className="flex flex-col gap-2">
          <PlaybackControls />
          <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
            <span className="size-3 rounded-sm" style={{ background: "var(--muted)" }} /> awaiting
            <span className="ml-2 size-3 rounded-sm" style={{ background: "rgb(120,140,90)" }} /> just arrived
            <span className="ml-2 size-3 rounded-sm" style={{ background: "rgb(40,200,90)" }} /> established
          </div>
        </div>
      )}
      <p className="text-muted-foreground text-[11px]">
        {getYearPhase(year)} year · click a state to lock it across all panels.
      </p>
    </PanelCard>
  );
}
