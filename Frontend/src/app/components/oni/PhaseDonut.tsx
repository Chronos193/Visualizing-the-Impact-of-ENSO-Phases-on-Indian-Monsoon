import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useData } from "../../context/DataProvider";
import type { Phase } from "../../data/types";
import { phaseColor } from "../../lib/colorScale";

export function PhaseDonut({ range, fill }: { range: [number, number]; fill?: boolean }) {
  const { oniSeries } = useData();

  const counts = useMemo(() => {
    const c: Record<Phase, number> = { "El Niño": 0, "La Niña": 0, Neutral: 0 };
    oniSeries.slice(range[0], range[1] + 1).forEach((p) => {
      c[p.phase] += 1;
    });
    return (Object.keys(c) as Phase[]).map((phase) => ({
      phase,
      count: c[phase],
      color: phaseColor(phase),
    }));
  }, [oniSeries, range]);

  const total = counts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={fill ? "min-h-0 flex-1" : "h-[180px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={counts}
              dataKey="count"
              nameKey="phase"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              isAnimationActive={false}
            >
              {counts.map((c) => (
                <Cell key={c.phase} fill={c.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex shrink-0 items-center justify-center gap-4 pb-2 text-xs">
        {counts.map((c) => (
          <div key={c.phase} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: c.color }}
            />
            <span className="font-medium">{c.phase}</span>
            <span className="text-muted-foreground">
              {total > 0 ? Math.round((c.count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
