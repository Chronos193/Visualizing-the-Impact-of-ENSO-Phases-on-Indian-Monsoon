import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFilters } from "../../context/FilterContext";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { fetchRainfallCumulative, type ApiRainfallCumulative } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { LoadingState, ErrorState } from "../ui/ErrorState";

interface CumPoint {
  day: number;
  date: string;
  cumMm: number;
  normalCumMm: number;
}

export function CumulativeLinePlot({ year, regionId }: { year: number; regionId: string }) {
  const { state } = useFilters();
  const stateName = STATE_NAME_BY_ID[regionId] ?? regionId;

  const { data, loading, error, refetch } = useApiData<ApiRainfallCumulative, CumPoint[]>({
    apiFn: () => fetchRainfallCumulative(stateName, year),
    transform: (api) =>
      api.daily.map((d, i) => ({
        day: i,
        date: d.date,
        cumMm: d.cumulative_mm,
        normalCumMm: d.daily_mm, // use daily as proxy if no LPA
      })),
    deps: [year, regionId],
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No cumulative data."} onRetry={refetch} />;

  const current = data[Math.min(data.length - 1, Math.max(0, Math.floor(state.playbackDay / 7)))];

  return (
    <div className="h-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -6 }}>
          <defs key="defs">
            <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis key="x" dataKey="date" tick={{ fontSize: 10 }} interval={13} stroke="var(--muted-foreground)" />
          <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={44} />
          <Tooltip key="tooltip" contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="cumMm" name="Actual (mm)" stroke="var(--chart-1)" strokeWidth={2} fill="url(#cumFill)" isAnimationActive={false} />
          {current ? (
            <ReferenceLine key="ref-playback" x={current.date} stroke="var(--destructive)" strokeWidth={1.5} label={{ value: "▶", position: "top", fill: "var(--destructive)", fontSize: 11 }} />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
