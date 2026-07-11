import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { STATE_NAME_BY_ID, getIdByStateName } from "../../data/constants";
import { fetchRainfallAnomaly, fetchRainfallCumulative, type ApiRainfallAnomaly, type ApiRainfallCumulative } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { rainfallScale } from "../../lib/colorScale";
import { ChartCard } from "../ChartCard";
import { ColorLegend } from "../ColorLegend";
import { IndiaChoropleth } from "../maps/IndiaChoropleth";
import { Card, CardContent } from "../ui/card";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const RAIN_DOMAIN = 40;
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export function OverviewModule() {
  const { state, selectRegion, hoverRegion } = useFilters();
  const { oniSeries, getYearPhase } = useData();
  const { year, selectedRegionId, hoveredRegionId } = state;

  const { data: anomalyMap, loading: loadAnomaly, error: errAnomaly } = useApiData<ApiRainfallAnomaly, Record<string, number>>({
    apiFn: () => fetchRainfallAnomaly(year),
    transform: (api) => {
      const out: Record<string, number> = {};
      api.states.forEach((s) => {
        out[getIdByStateName(s.state)] = s.deviation_pct;
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

  const regionId = selectedRegionId ?? "kl";
  const regionName = STATE_NAME_BY_ID[regionId] ?? regionId;

  const { data: cumulative, loading: loadCum } = useApiData<ApiRainfallCumulative, { date: string; cumMm: number; normalCumMm: number }[]>({
    apiFn: () => fetchRainfallCumulative(regionName, year),
    transform: (api) => api.daily.map((d, i) => ({ date: d.date, cumMm: d.cumulative_mm, normalCumMm: d.daily_mm })),
    deps: [year, regionId],
  });

  const oniMonthly = useMemo(
    () => oniSeries.filter((p) => p.year === year),
    [oniSeries, year],
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="text-muted-foreground py-3 text-sm">
          Click any state on the map to lock it as the active region — the rainfall profile and ONI
          panels below, plus the Agriculture view, all follow your selection. The map is colored by{" "}
          <strong>{year}</strong> seasonal rainfall anomaly ({getYearPhase(year)} year).
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard
          title={`Rainfall anomaly — ${year}`}
          description="Click a state to coordinate all views"
          info="Departure of monsoon-season rainfall from the long-period average. Green = wetter than normal, brown = drier. Modulated by the year's dominant ENSO phase."
          className="lg:col-span-3"
        >
          <IndiaChoropleth
            colorById={colorById}
            selectedRegionId={selectedRegionId}
            hoveredRegionId={hoveredRegionId}
            onSelect={selectRegion}
            onHover={hoverRegion}
            height={460}
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
          <ColorLegend
            kind="rainfall"
            domain={RAIN_DOMAIN}
            minLabel="−40% (drier)"
            midLabel="normal"
            maxLabel="+40% (wetter)"
            className="mt-2"
          />
        </ChartCard>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <ChartCard
            title={`Cumulative rainfall — ${regionName}`}
            description="Actual vs. long-period normal"
            info="Running total of monsoon rainfall through the Jun–Sep season for the selected region, compared with the climatological normal."
          >
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulative} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis key="x"
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval={20}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="normalCumMm"
                    name="Normal (mm)"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumMm"
                    name="Actual (mm)"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title={`ONI through ${year}`}
            description="Monthly Oceanic Niño Index"
            info="Positive ONI (warm) indicates El Niño conditions; negative (cool) indicates La Niña. ±0.5°C are the conventional thresholds."
          >
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={oniMonthly} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis key="x"
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 10 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine key="elnino" y={0.5} stroke="var(--chart-3)" strokeDasharray="3 3" />
                  <ReferenceLine key="lanina" y={-0.5} stroke="var(--chart-2)" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="oni"
                    name="ONI (°C)"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
