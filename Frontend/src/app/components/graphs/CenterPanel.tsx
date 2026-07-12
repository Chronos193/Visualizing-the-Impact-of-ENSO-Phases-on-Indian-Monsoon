import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MonsoonHeroPanel } from "./MonsoonHeroPanel";
import { RainfallAnomalyPanel } from "./RainfallAnomalyPanel";

type CenterView = "g3" | "g4";

const OPTIONS: {value: CenterView; label: string }[] = [
  { value: "g3", label: "Monsoon onset & accumulation" },
  { value: "g4", label: "Seasonal rainfall anomaly" },
];

export function CenterPanel({ className }: { className?: string }) {
  const [view, setView] = useState<CenterView>("g3");

  const titleSlot = (
    <Select value={view} onValueChange={(v) => setView(v as CenterView)}>
      <SelectTrigger size="sm" className="w-[255px] font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return view === "g3" ? (
    <MonsoonHeroPanel className={className} titleSlot={titleSlot} />
  ) : (
    <RainfallAnomalyPanel className={className} titleSlot={titleSlot} />
  );
}
