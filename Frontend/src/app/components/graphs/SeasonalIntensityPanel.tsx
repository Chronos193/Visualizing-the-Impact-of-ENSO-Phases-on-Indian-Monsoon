import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { ColorLegend } from "../ColorLegend";
import { OniSeasonalMatrix } from "../oni/OniSeasonalMatrix";
import { PanelCard } from "../single/PanelCard";
import { LoadingState, ErrorState } from "../ui/ErrorState";

/** Month × year ONI intensity heatmap, promoted from the ONI detail drawer. */
export function SeasonalIntensityPanel({ className }: { className?: string }) {
  const { state } = useFilters();
  const { oniSeries, loading, error } = useData();
  const range: [number, number] = state.brushRange ?? [
    Math.max(0, oniSeries.length - 120),
    oniSeries.length - 1,
  ];

  return (
    <PanelCard
      className={className}
      title="ONI Seasonal Intensity (Month × Year)"
      info="Heatmap of monthly ONI values arranged by calendar month (rows) and year (columns). Warm colours = El Niño, cool colours = La Niña. Brush the G2 timeline to narrow the year range."
      bodyClassName="flex flex-col gap-2 overflow-auto"
    >
      {loading ? (
        <LoadingState />
      ) : error || oniSeries.length === 0 ? (
        <ErrorState message={error ?? "No ONI data available."} />
      ) : (
        <>
          <div className="shrink-0">
            <OniSeasonalMatrix range={range} />
          </div>
          <ColorLegend
            kind="diverging"
            domain={2.5}
            minLabel="La Niña"
            midLabel="neutral"
            maxLabel="El Niño"
            className="shrink-0"
          />
        </>
      )}
    </PanelCard>
  );
}
