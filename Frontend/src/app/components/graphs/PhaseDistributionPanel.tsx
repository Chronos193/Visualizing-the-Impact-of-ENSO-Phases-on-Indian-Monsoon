import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { PhaseDonut } from "../oni/PhaseDonut";
import { ChartBox } from "../single/ChartBox";
import { PanelCard } from "../single/PanelCard";
import { LoadingState, ErrorState } from "../ui/ErrorState";

/** Phase-distribution donut, promoted from the ONI detail drawer to sit beside G2. */
export function PhaseDistributionPanel({ className }: { className?: string }) {
  const { state } = useFilters();
  const { oniSeries, loading, error } = useData();
  const range: [number, number] = state.brushRange ?? [
    Math.max(0, oniSeries.length - 120),
    oniSeries.length - 1,
  ];

  return (
    <PanelCard
      className={className}
      title="ENSO Phase Distribution"
      info="Donut chart showing the share of months classified as El Niño (ONI ≥ +0.5), La Niña (ONI ≤ −0.5), or Neutral within the G2 brush window."
      bodyClassName="flex flex-col overflow-hidden"
    >
      {loading ? (
        <LoadingState />
      ) : error || oniSeries.length === 0 ? (
        <ErrorState message={error ?? "No ONI data available."} />
      ) : (
        <ChartBox>
          <PhaseDonut range={range} fill />
        </ChartBox>
      )}
    </PanelCard>
  );
}
