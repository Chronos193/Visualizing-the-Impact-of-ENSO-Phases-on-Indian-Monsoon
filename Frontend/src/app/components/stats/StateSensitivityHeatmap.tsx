import { fetchCorrelationHeatmap, type ApiCorrelationHeatmap } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { correlationScale } from "../../lib/colorScale";
import { getIdByStateName } from "../../data/constants";
import { LoadingState, ErrorState } from "../ui/ErrorState";

interface StateEntry {
  name: string;
  regionId: string;
  r: number;
}

interface StateSensitivityHeatmapProps {
  selectedRegionId: string | null;
  onSelect: (regionId: string) => void;
}

function StateColumn({
  states,
  selectedRegionId,
  onSelect,
}: {
  states: StateEntry[];
  selectedRegionId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-px overflow-hidden">
      {states.map((d) => {
        const selected = d.regionId === selectedRegionId;
        const pct = Math.abs(d.r) * 50;
        const isNeg = d.r < 0;
        return (
          <button
            key={d.regionId}
            type="button"
            onClick={() => onSelect(d.regionId)}
            className="flex min-h-0 flex-1 cursor-pointer items-center gap-1 rounded-[2px] px-0.5 text-left transition-colors hover:bg-accent/40"
            style={{
              outline: selected ? "1px solid var(--ring)" : undefined,
              background: selected ? "var(--accent)" : undefined,
            }}
          >
            {/* State label */}
            <span
              className="text-muted-foreground w-[80px] shrink-0 truncate text-right text-[8.5px] leading-none"
              title={d.name}
            >
              {d.name}
            </span>

            {/* Bar track */}
            <div className="relative h-[6px] min-w-0 flex-1 overflow-hidden rounded-[2px] bg-border/40">
              <div className="absolute inset-y-0 left-1/2 w-px bg-border/60" />
              <div
                className="absolute inset-y-0"
                style={{
                  background: correlationScale(d.r),
                  width: `${pct}%`,
                  left: isNeg ? `${50 - pct}%` : "50%",
                }}
              />
            </div>

            {/* r value */}
            <span className="text-muted-foreground w-[24px] shrink-0 text-right text-[8px] leading-none tabular-nums">
              {d.r.toFixed(2)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Two-column sensitivity bar chart so all states fit without scrolling. */
export function StateSensitivityHeatmap({ selectedRegionId, onSelect }: StateSensitivityHeatmapProps) {
  const { data, loading, error, refetch } = useApiData<ApiCorrelationHeatmap, StateEntry[]>({
    apiFn: () => fetchCorrelationHeatmap(),
    transform: (api) =>
      api.pearson_r.map((entry) => ({
        name: entry.state,
        regionId: getIdByStateName(entry.state),
        r: entry.r,
      })),
    deps: [],
  });

  if (loading) return <LoadingState />;
  if (error || !data || data.length === 0)
    return <ErrorState message={error ?? "No correlation data."} onRetry={refetch} />;

  const mid = Math.ceil(data.length / 2);
  const left = data.slice(0, mid);
  const right = data.slice(mid);

  return (
    <div className="flex h-full min-h-0 gap-2">
      <StateColumn states={left} selectedRegionId={selectedRegionId} onSelect={onSelect} />
      <div className="w-px shrink-0 bg-border/40" />
      <StateColumn states={right} selectedRegionId={selectedRegionId} onSelect={onSelect} />
    </div>
  );
}
