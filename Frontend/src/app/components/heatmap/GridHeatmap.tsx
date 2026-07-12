import { useState, type ReactNode } from "react";
import { FloatingTooltip, type TooltipState } from "../RegionTooltip";
import { cn } from "../ui/utils";

export interface GridCell {
  row: number;
  col: number;
  value: number;
}

interface GridHeatmapProps {
  rows: number;
  cols: number;
  cells: GridCell[];
  /** Resolve a value to a CSS color. */
  color: (value: number) => string;
  rowLabels?: string[];
  colLabels?: string[];
  tooltip?: (cell: GridCell) => ReactNode;
  onCellClick?: (cell: GridCell) => void;
  isSelected?: (cell: GridCell) => boolean;
  /** Fixed cell height in px; width is responsive via grid. */
  cellHeight?: number;
  /** Gap between cells. */
  gap?: number;
  rounded?: boolean;
  className?: string;
  /** When true, rows expand to fill the parent height (no scroll). */
  fillHeight?: boolean;
}

export function GridHeatmap({
  rows,
  cols,
  cells,
  color,
  rowLabels,
  colLabels,
  tooltip,
  onCellClick,
  isSelected,
  cellHeight = 22,
  gap = 2,
  rounded = false,
  className,
  fillHeight = false,
}: GridHeatmapProps) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  // Index cells by row/col for stable lookup.
  const byKey = new Map<string, GridCell>();
  cells.forEach((c) => byKey.set(`${c.row}:${c.col}`, c));

  return (
    <div className={cn("w-full", fillHeight && "h-full", className)}>
      <div className={cn("flex", fillHeight && "h-full")}>
        {rowLabels ? (
          <div
            className={cn("flex shrink-0 flex-col pr-2 text-right", fillHeight && "h-full")}
            style={{ gap }}
          >
            {colLabels ? <div style={{ height: 16 }} /> : null}
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="text-muted-foreground flex min-h-0 flex-1 items-center justify-end text-[10px] leading-none"
                style={fillHeight ? undefined : { height: cellHeight }}
                title={rowLabels[r]}
              >
                <span className="max-w-[120px] truncate">{rowLabels[r]}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className={cn("min-w-0 flex-1", fillHeight && "h-full")}>
          {colLabels ? (
            <div
              className="text-muted-foreground grid text-[10px]"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap,
                height: 16,
                marginBottom: gap,
              }}
            >
              {colLabels.map((label, c) => (
                <div key={c} className="overflow-hidden text-center leading-none">
                  <span className="block truncate">{label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: fillHeight ? `calc(${100 / rows}% - ${gap}px)` : `${cellHeight}px`,
              height: fillHeight ? "100%" : undefined,
              gap,
            }}
            onMouseLeave={() => setTip(null)}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const cell = byKey.get(`${r}:${c}`) ?? { row: r, col: c, value: 0 };
                const selected = isSelected?.(cell) ?? false;
                return (
                  <div
                    key={`${r}:${c}`}
                    className={cn(
                      "transition-[outline] duration-100",
                      rounded ? "rounded-sm" : "rounded-[2px]",
                      onCellClick ? "cursor-pointer" : "",
                    )}
                    style={{
                      background: color(cell.value),
                      outline: selected ? "2px solid var(--ring)" : "none",
                      outlineOffset: selected ? -1 : 0,
                      boxShadow: selected ? "0 0 0 1px var(--ring)" : undefined,
                    }}
                    onClick={() => onCellClick?.(cell)}
                    onMouseEnter={(e) => {
                      if (tooltip) setTip({ x: e.clientX, y: e.clientY, content: tooltip(cell) });
                    }}
                    onMouseMove={(e) => {
                      if (tooltip) setTip({ x: e.clientX, y: e.clientY, content: tooltip(cell) });
                    }}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
      <FloatingTooltip tooltip={tip} />
    </div>
  );
}
