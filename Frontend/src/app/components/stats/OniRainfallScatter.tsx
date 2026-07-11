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
import { STATE_NAME_BY_ID } from "../../data/constants";
import { phaseColor } from "../../lib/colorScale";
import type { Phase } from "../../data/types";
import { ChartBox } from "../single/ChartBox";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

interface ScatterPoint {
  year: number;
  x: number;
  y: number;
  oni: number;
  anomaly: number;
  phase: string;
}

export function OniRainfallScatter({ regionId }: { regionId: string }) {
  const { state } = useFilters();
  const name = STATE_NAME_BY_ID[regionId] ?? regionId;

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
      })),
    deps: [regionId],
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
            <ZAxis key="z" range={[40, 40]} />
            <Tooltip key="tip" contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} formatter={(v: number, n: string) => [Math.round(v * 100) / 100, n]} />
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
