import { fetchCorrelationHeatmap, type ApiCorrelationHeatmap } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { correlationScale } from "../../lib/colorScale";
import { getIdByStateName } from "../../data/constants";
import { GridHeatmap } from "../heatmap/GridHeatmap";
import { LoadingState, ErrorState } from "../ui/ErrorState";

interface StateEntry {
  name: string;
  regionId: string;
  r: number;
  n: number;
}

interface StateSensitivityHeatmapProps {
  selectedRegionId: string | null;
  onSelect: (regionId: string) => void;
}

/** Single-column states × Pearson-r heatmap of ONI→rainfall sensitivity. */
export function StateSensitivityHeatmap({ selectedRegionId, onSelect }: StateSensitivityHeatmapProps) {
  const { data, loading, error, refetch } = useApiData<ApiCorrelationHeatmap, StateEntry[]>({
    apiFn: () => fetchCorrelationHeatmap(),
    transform: (api) =>
      api.pearson_r.map((entry) => ({
        name: entry.state,
        regionId: getIdByStateName(entry.state),
        r: entry.r,
        n: 0, // not available from API
      })),
    deps: [],
  });

  if (loading) return <LoadingState />;
  if (error || !data || data.length === 0) return <ErrorState message={error ?? "No correlation data."} onRetry={refetch} />;

  const cells = data.map((d, i) => ({ row: i, col: 0, value: d.r }));

  return (
    <div className="h-full overflow-auto">
      <GridHeatmap
        rows={data.length}
        cols={1}
        cells={cells}
        rowLabels={data.map((d) => d.name)}
        color={(v) => correlationScale(v)}
        cellHeight={16}
        onCellClick={(cell) => onSelect(data[cell.row].regionId)}
        isSelected={(cell) => data[cell.row]?.regionId === selectedRegionId}
        tooltip={(cell) => {
          const d = data[cell.row];
          if (!d) return null;
          return (
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-muted-foreground">r = {d.r}</div>
            </div>
          );
        }}
      />
    </div>
  );
}
