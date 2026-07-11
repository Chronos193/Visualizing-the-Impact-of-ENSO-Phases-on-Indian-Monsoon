import { useState } from "react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFilters } from "../../context/FilterContext";
import { REGION_GROUPS } from "../../data/constants";
import { fetchNdviRegional, type ApiNdviRegional } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { PanelCard } from "../single/PanelCard";
import { ChartBox } from "../single/ChartBox";
import { ViewSelect } from "../single/ViewSelect";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

interface NdviChartPoint {
  date: string;
  ndviA: number;
  oni: number;
}

export function NdviOniPanel({ className }: { className?: string }) {
  const { state } = useFilters();
  const { compareMode, year, compareYear } = state;
  const [groupId, setGroupId] = useState("C");

  let regionLabel =
    REGION_GROUPS.find((g) => g.id === groupId)?.label?.toLowerCase() ?? "central";
  if (regionLabel === "east & ne") {
    regionLabel = "east";
  }

  const { data, loading, error, refetch } = useApiData<
    ApiNdviRegional,
    NdviChartPoint[]
  >({
    apiFn: () => fetchNdviRegional(regionLabel),
    transform: (api) =>
      api.data.map((d) => ({
        date: d.composite_start,
        ndviA: d.mean_ndvi,
        oni: d.oni,
      })),
    deps: [groupId],
  });

  const kharifStart = data?.[4]?.date;
  const kharifEnd = data?.[15]?.date;

  return (
    <PanelCard
      className={className}
      title="G6 · NDVI vs ONI"
      info="Vegetation greenness (NDVI, left axis, green) against the ocean signal (ONI, right axis, shaded). El Niño years tend to depress NDVI through the Kharif window."
      actions={
        <ViewSelect
          value={groupId}
          onChange={setGroupId}
          width={140}
          options={REGION_GROUPS.map((g) => ({ value: g.id, label: g.label }))}
        />
      }
      bodyClassName="flex flex-col"
    >
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message={error ?? "No NDVI data."} onRetry={refetch} />
      ) : (
        <ChartBox>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs key="defs">
                <linearGradient id="oniFill6" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.28} />
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                key="x"
                dataKey="date"
                tick={{ fontSize: 9 }}
                minTickGap={28}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                key="yNdvi"
                yAxisId="ndvi"
                tick={{ fontSize: 9 }}
                stroke="var(--chart-3)"
                width={40}
                domain={[0.2, 0.8]}
              />
              <YAxis
                key="yOni"
                yAxisId="oni"
                orientation="right"
                tick={{ fontSize: 9 }}
                stroke="var(--muted-foreground)"
                width={30}
                domain={[-2.5, 2.5]}
              />
              <Tooltip key="tip" contentStyle={tooltipStyle} />
              {kharifStart && kharifEnd && (
                <ReferenceArea
                  key="kharif"
                  yAxisId="ndvi"
                  x1={kharifStart}
                  x2={kharifEnd}
                  fill="var(--chart-3)"
                  fillOpacity={0.06}
                />
              )}
              <Area
                yAxisId="oni"
                type="monotone"
                dataKey="oni"
                name="ONI (°C)"
                stroke="var(--muted-foreground)"
                strokeWidth={1}
                fill="url(#oniFill6)"
                isAnimationActive={false}
              />
              <Line
                yAxisId="ndvi"
                type="monotone"
                dataKey="ndviA"
                name="NDVI"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Brush 
                dataKey="date" 
                height={24} 
                stroke="var(--muted-foreground)" 
                fill="var(--background)"
                tickFormatter={(v: string) => v.slice(0, 4)} 
                startIndex={data.length > 40 ? data.length - 40 : 0}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartBox>
      )}
    </PanelCard>
  );
}
