import type { ReactNode } from "react";
import { useFilters } from "../../context/FilterContext";
import { MONSOON_ANIM_DAYS } from "../../data/constants";
import { Badge } from "../ui/badge";
import { PanelCard } from "../single/PanelCard";
import { RainfallAnimatedMap } from "../monsoon/RainfallAnimatedMap";
import { SeasonCumulativeChart } from "../monsoon/SeasonCumulativeChart";
import { PlaybackControls } from "../monsoon/PlaybackControls";

/** Helper: compute a human-readable frame label from playback day. */
function frameLabel(day: number): string {
  const date = new Date(2000, 5, 1); // Jun 1
  date.setDate(date.getDate() + day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MonsoonHeroPanel({
  className,
  titleSlot,
}: {
  className?: string;
  titleSlot?: ReactNode;
}) {
  const { state } = useFilters();
  const { compareMode, year, compareYear, playbackDay } = state;

  return (
    <PanelCard
      className={className}
      title={titleSlot ?? "G3 · Monsoon Rainfall Progression"}
      info="Animated choropleth of cumulative monsoon rainfall by state (June–October). Fill colour = seasonal total; dot density = current-period intensity. The line chart below tracks cumulative rainfall vs. the long-term average. Click any state to filter. Use playback to advance by fortnight."
      actions={
        <Badge variant="outline" className="tabular-nums">
          {frameLabel(playbackDay)}
        </Badge>
      }
      bodyClassName="flex flex-col gap-2"
    >
      <div className="grid min-h-0 flex-1 gap-2" style={{ gridTemplateRows: "minmax(0,2fr) minmax(0,0.8fr)" }}>
        <div className="min-h-0">
          {compareMode ? (
            <div className="grid h-full grid-cols-2 gap-2">
              <div className="flex min-h-0 flex-col">
                <div className="text-muted-foreground text-xs">Year A · {year}</div>
                <div className="min-h-0 flex-1">
                  <RainfallAnimatedMap year={year} patternIdPrefix="rainA" compareYear={compareYear} />
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="text-muted-foreground text-xs">Year B · {compareYear}</div>
                <div className="min-h-0 flex-1">
                  <RainfallAnimatedMap year={compareYear} patternIdPrefix="rainB" compareYear={year} />
                </div>
              </div>
            </div>
          ) : (
            <RainfallAnimatedMap year={year} />
          )}
        </div>
        <div className="min-h-0">
          <SeasonCumulativeChart year={year} compareYear={compareMode ? compareYear : undefined} />
        </div>
      </div>
      <div className="shrink-0">
        <PlaybackControls totalDays={MONSOON_ANIM_DAYS} />
      </div>
    </PanelCard>
  );
}
