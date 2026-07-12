
import { Sun, CloudRain, Waves, Minus } from "lucide-react";
import { useFilters } from "../context/FilterContext";
import { useData } from "../context/DataProvider";
import { YEARS, PHASES } from "../data/constants";
import type { Phase } from "../data/types";
import { phaseColor } from "../lib/colorScale";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const PHASE_ICON: Record<Phase, typeof Sun> = {
  "El Niño": Sun,
  "La Niña": CloudRain,
  Neutral: Minus,
};

/** Tiny colored dot used inside dropdown items to signal the ENSO phase. */
function PhaseDot({ phase }: { phase: Phase }) {
  return (
    <span
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ background: phaseColor(phase) }}
    />
  );
}

export function DashboardHeader() {
  const { state, setYear, setCompareYear, toggleCompareMode, reset } = useFilters();
  const { getYearPhase } = useData();

  const yearPhase = getYearPhase(state.year);
  const PhaseIcon = PHASE_ICON[yearPhase];
  const comparePhase = getYearPhase(state.compareYear);
  const CompareIcon = PHASE_ICON[comparePhase];

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2">
      <div className="flex items-center gap-2">
        <Waves className="text-chart-1 size-5" />
        <h1 className="text-base font-semibold tracking-tight">Visualizing the Impact of ENSO Phases on Indian Monsoon</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Year A */}
        <div className="flex items-center gap-1.5">
          <Select value={String(state.year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger size="sm" className="w-[90px]">
              <span className="flex items-center gap-1.5">
                <PhaseDot phase={yearPhase} />
                <span>{state.year}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => {
                const phase = getYearPhase(y);
                return (
                  <SelectItem key={y} value={String(y)}>
                    <span className="flex items-center gap-2">
                      <PhaseDot phase={phase} />
                      <span>{y}</span>
                      <span className="text-muted-foreground text-xs">· {phase}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="gap-1"
                style={{ borderColor: phaseColor(yearPhase), color: phaseColor(yearPhase) }}
              >
                <PhaseIcon className="size-3" />
                {yearPhase}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>ENSO phase for {state.year}</TooltipContent>
          </Tooltip>
        </div>

        {/* Compare toggle */}
        <div className="flex items-center gap-1.5">
          <Switch
            id="compare-toggle"
            checked={state.compareMode}
            onCheckedChange={toggleCompareMode}
          />
          <label htmlFor="compare-toggle" className="text-muted-foreground text-xs select-none">
            Compare
          </label>
        </div>

        {/* Year B (compare) */}
        {state.compareMode && (
          <div className="flex items-center gap-1.5">
            <Select
              value={String(state.compareYear)}
              onValueChange={(v) => setCompareYear(Number(v))}
            >
              <SelectTrigger size="sm" className="w-[90px]">
                <span className="flex items-center gap-1.5">
                  <PhaseDot phase={comparePhase} />
                  <span>{state.compareYear}</span>
                </span>
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => {
                  const phase = getYearPhase(y);
                  return (
                    <SelectItem key={y} value={String(y)}>
                      <span className="flex items-center gap-2">
                        <PhaseDot phase={phase} />
                        <span>{y}</span>
                        <span className="text-muted-foreground text-xs">· {phase}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Badge
              variant="outline"
              className="gap-1"
              style={{ borderColor: phaseColor(comparePhase), color: phaseColor(comparePhase) }}
            >
              <CompareIcon className="size-3" />
              {comparePhase}
            </Badge>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={reset}>
          Reset
        </Button>
      </div>
    </header>
  );
}
