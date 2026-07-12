import { useMemo, useState } from "react";
import { useFilters } from "../../context/FilterContext";
import { MONTHS } from "../../data/constants";
import { fetchSstGrid, type ApiSstGrid } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { sstAnomalyScale } from "../../lib/colorScale";
import { ColorLegend } from "../ColorLegend";
import { GridHeatmap } from "../heatmap/GridHeatmap";
import { PanelCard } from "../single/PanelCard";
import { Slider } from "../ui/slider";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const DOMAIN = 3;

interface SstCell {
  row: number;
  col: number;
  value: number;
  lat: number;
  lon: number;
  sst: number;
  anom: number;
}

interface SstGridLocal {
  rows: number;
  cols: number;
  cells: SstCell[];
}

function apiToGrid(api: ApiSstGrid): SstGridLocal {
  const lats = new Set(api.grid.values.map((v) => v.lat));
  const lons = new Set(api.grid.values.map((v) => v.lon));
  const sortedLats = Array.from(lats).sort((a, b) => b - a);
  const sortedLons = Array.from(lons).sort((a, b) => {
    const a360 = a < 0 ? a + 360 : a;
    const b360 = b < 0 ? b + 360 : b;
    return a360 - b360;
  });
  const latIdx = new Map(sortedLats.map((l, i) => [l, i]));
  const lonIdx = new Map(sortedLons.map((l, i) => [l, i]));
  const cells: SstCell[] = api.grid.values.map((v) => ({
    row: latIdx.get(v.lat) ?? 0,
    col: lonIdx.get(v.lon) ?? 0,
    value: +(v.sst - 26.8).toFixed(2),
    lat: v.lat,
    lon: v.lon,
    sst: v.sst,
    anom: +(v.sst - 26.8).toFixed(2),
  }));
  return { rows: sortedLats.length, cols: sortedLons.length, cells };
}

const lonLabel = (lon: number) => (lon <= 180 ? `${lon}°E` : `${360 - lon}°W`);

function SstGrid({ grid, label }: { grid: SstGridLocal; label?: string }) {
  const byKey = useMemo(() => {
    const m = new Map<string, SstCell>();
    grid.cells.forEach((cc) => m.set(`${cc.row}:${cc.col}`, cc));
    return m;
  }, [grid]);

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label ? (
        <div className="text-muted-foreground text-xs font-medium">{label}</div>
      ) : null}
      <GridHeatmap
        rows={grid.rows}
        cols={grid.cols}
        cells={grid.cells.map((c) => ({ row: c.row, col: c.col, value: c.value }))}
        color={(v) => sstAnomalyScale(v, DOMAIN)}
        cellHeight={4}
        gap={0}
        tooltip={(cell) => {
          const full = byKey.get(`${cell.row}:${cell.col}`);
          if (!full) return null;
          return (
            <div>
              <div className="text-label-sm">
                {Math.abs(full.lat)}°{full.lat >= 0 ? "N" : "S"} · {lonLabel(full.lon)}
              </div>
              <div className="text-text-secondary text-xs">
                SST {full.sst}°C · anom {full.anom > 0 ? "+" : ""}
                {full.anom}°C
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

export function SstComparePanel({ className }: { className?: string }) {
  const { state } = useFilters();
  const { compareMode, year, compareYear } = state;
  const [selMonth, setSelMonth] = useState(10); // Nov default

  const eventNameA = `${MONTHS[selMonth].toLowerCase()}_${year}`;
  const eventNameB = `${MONTHS[selMonth].toLowerCase()}_${compareYear}`;

  // Always fetch per-month grids for both years (used in both modes)
  const gridAResult = useApiData<ApiSstGrid, SstGridLocal>({
    apiFn: () => fetchSstGrid("ersst", eventNameA),
    transform: apiToGrid,
    deps: [eventNameA],
  });
  const gridBResult = useApiData<ApiSstGrid, SstGridLocal>({
    apiFn: () => fetchSstGrid("ersst", eventNameB),
    transform: apiToGrid,
    deps: [eventNameB],
  });

  const loading = compareMode
    ? gridAResult.loading || gridBResult.loading
    : gridAResult.loading;
  const error = compareMode
    ? gridAResult.error || gridBResult.error
    : gridAResult.error;

  const monthSlider = (
    <div className="shrink-0 pt-2 flex flex-col gap-2 border-t border-border">
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Jan</span>
        <span className="font-medium text-foreground">{MONTHS[selMonth]}</span>
        <span>Dec</span>
      </div>
      <Slider
        min={0}
        max={11}
        step={1}
        value={[selMonth]}
        onValueChange={(vals) => setSelMonth(vals[0])}
      />
    </div>
  );

  return (
    <PanelCard
      className={className}
      title="SST Grid (ERSST Niño 3.4)"
      info="ERSST (2° resolution) sea-surface temperature anomaly heatmap across the Niño 3.4 region (66°N–60°S, 100°E–77°W). Warmer colours indicate positive SST anomalies associated with El Niño conditions."
      actions={
        <ColorLegend
          kind="sst-anomaly"
          domain={DOMAIN}
          minLabel="−3°C"
          midLabel="0"
          maxLabel="+3°C"
          className="w-48"
        />
      }
      bodyClassName="flex flex-col h-full min-h-0 gap-2"
    >
      {/* Grid area — scrollable if needed, takes all remaining height */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={compareMode ? gridAResult.refetch : gridBResult.refetch}
          />
        ) : compareMode ? (
          /* Side-by-side in compare mode */
          <div className="grid grid-cols-2 gap-3 h-full">
            <div className="min-w-0 flex flex-col gap-1">
              <div className="text-muted-foreground text-xs font-medium">
                Year A · {year}
              </div>
              {gridAResult.data && <SstGrid grid={gridAResult.data} />}
            </div>
            <div className="min-w-0 flex flex-col gap-1">
              <div className="text-muted-foreground text-xs font-medium">
                Year B · {compareYear}
              </div>
              {gridBResult.data && <SstGrid grid={gridBResult.data} />}
            </div>
          </div>
        ) : (
          gridAResult.data && <SstGrid grid={gridAResult.data} />
        )}
      </div>

      {/* Month slider — always pinned at bottom */}
      {monthSlider}
    </PanelCard>
  );
}
