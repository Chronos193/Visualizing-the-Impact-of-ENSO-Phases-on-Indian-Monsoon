import { legendStops } from "../lib/colorScale";
import { cn } from "./ui/utils";

interface ColorLegendProps {
  kind: "diverging" | "rainfall" | "sst" | "correlation" | "sst-anomaly";
  /** Labels at the two ends (and optional middle). */
  minLabel: string;
  maxLabel: string;
  midLabel?: string;
  domain?: number;
  sstRange?: [number, number];
  className?: string;
}

export function ColorLegend({
  kind,
  minLabel,
  maxLabel,
  midLabel,
  domain = 1,
  sstRange = [22, 31],
  className,
}: ColorLegendProps) {
  const stops = legendStops(kind, domain, sstRange);
  const gradient = `linear-gradient(to right, ${stops
    .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
    .join(", ")})`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className="h-2.5 w-full rounded-full border border-border/60"
        style={{ background: gradient }}
      />
      <div className="text-muted-foreground flex justify-between text-[11px]">
        <span>{minLabel}</span>
        {midLabel ? <span>{midLabel}</span> : null}
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
