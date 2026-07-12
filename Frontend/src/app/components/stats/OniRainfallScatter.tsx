import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useFilters } from "../../context/FilterContext";
import { fetchCorrelationScatter, type ApiCorrelationScatter } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { linearRegression, pValue } from "../../data/utils";
import { YEAR_MIN, YEAR_MAX } from "../../data/constants";
import { phaseColor } from "../../lib/colorScale";
import type { Phase } from "../../data/types";
import { ChartBox } from "../single/ChartBox";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
};

function ScatterTip({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <div className="font-semibold mb-0.5">{d.year}</div>
      <div className="text-muted-foreground">ONI : {d.oni.toFixed(2)}</div>
      <div className="text-muted-foreground">Rain anom % : {d.anomaly.toFixed(2)}</div>
    </div>
  );
}

interface ScatterPoint {
  year: number;
  x: number;
  y: number;
  oni: number;
  anomaly: number;
  phase: string;
  z: number; // dot area — encodes year (larger = more recent)
}

/** Map year linearly to a dot area in [minPx, maxPx]. */
function yearToSize(year: number, min = 14, max = 68): number {
  const t = (year - YEAR_MIN) / Math.max(1, YEAR_MAX - YEAR_MIN);
  return Math.round(min + t * (max - min));
}

export function OniRainfallScatter({ stateName }: { stateName: string }) {
  const { state } = useFilters();
  const name = stateName;

  const { data: points, loading, error, refetch } = useApiData<
    ApiCorrelationScatter,
    ScatterPoint[]
  >({
    apiFn: () => fetchCorrelationScatter(name),
    transform: (api) =>
      api.points.map((p) => ({
        year: p.year,
        x: p.oni,
        y: p.anomaly_pct,
        oni: p.oni,
        anomaly: p.anomaly_pct,
        phase: p.phase,
        z: yearToSize(p.year),
      })),
    deps: [stateName],
  });

  if (loading) return <LoadingState />;
  if (error || !points) return <ErrorState message={error ?? "No scatter data."} onRetry={refetch} />;

  const reg = linearRegression(points.map((d) => ({ x: d.x, y: d.y })));
  const r = Math.sqrt(reg.r2) * (reg.slope < 0 ? -1 : 1);
  const p = pValue(r, points.length);
  const xs = points.map((d) => d.x);
  const minX = Math.min(...xs, -0.5);
  const maxX = Math.max(...xs, 0.5);
  const line = [
    { x: minX, y: reg.intercept + reg.slope * minX },
    { x: maxX, y: reg.intercept + reg.slope * maxX },
  ];

  const highlightYears = state.compareMode ? [state.year, state.compareYear] : [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="text-muted-foreground shrink-0 text-xs">
        {name} — r = {r.toFixed(2)}, p = {p < 0.001 ? "<0.001" : p.toFixed(3)} (n = {points.length})
      </div>
      <ChartBox>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 10, bottom: 4, left: -12 }}>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis key="x" type="number" dataKey="x" name="ONI" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
            <YAxis key="y" type="number" dataKey="y" name="Rain anom %" tick={{ fontSize: 9 }} width={38} stroke="var(--muted-foreground)" />
            <ZAxis key="z" dataKey="z" range={[14, 68]} />
            <Tooltip key="tip" content={<ScatterTip />} cursor={{ strokeDasharray: "3 3" }} />
            <ReferenceLine key="vx" x={0} stroke="var(--muted-foreground)" />
            <ReferenceLine key="hy" y={0} stroke="var(--muted-foreground)" />
            <Scatter key="reg" data={line} line={{ stroke: "var(--chart-4)", strokeWidth: 2 }} shape={() => <g />} isAnimationActive={false} />
            <Scatter key="pts" data={points.map((d) => ({ ...d, x: d.oni, y: d.anomaly }))} isAnimationActive={false}>
              {points.map((d) => {
                const hl = highlightYears.includes(d.year);
                return (
                  <Cell
                    key={d.year}
                    fill={phaseColor(d.phase as Phase)}
                    stroke={hl ? "var(--ring)" : "none"}
                    strokeWidth={hl ? 3 : 0}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}
