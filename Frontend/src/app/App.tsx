import { ThemeProvider } from "next-themes";
import { FilterProvider } from "./context/FilterContext";
import { DataProvider } from "./context/DataProvider";
import { TooltipProvider } from "./components/ui/tooltip";
import { DashboardHeader } from "./components/DashboardHeader";
import { OniStripPanel } from "./components/graphs/OniStripPanel";
import { PhaseDistributionPanel } from "./components/graphs/PhaseDistributionPanel";
import { SstComparePanel } from "./components/graphs/SstComparePanel";
import { CenterPanel } from "./components/graphs/CenterPanel";
import { SeasonalIntensityPanel } from "./components/graphs/SeasonalIntensityPanel";
import { OniRainfallStatsPanel } from "./components/graphs/OniRainfallStatsPanel";
import { NdviOniPanel } from "./components/graphs/NdviOniPanel";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <DataProvider>
        <FilterProvider>
          <TooltipProvider delayDuration={150}>
            <div className="flex h-screen min-w-0 flex-col overflow-hidden">
              <DashboardHeader />
              {/* Single viewport:
                    Row 1     → G2 ONI strip (full width)
                    Rows 2-3  → G1 SST / G5 stats (left) | G3 Monsoon hero (center, full height) | G4 anomaly / G6 NDVI (right) */}
              <div className="grid min-h-0 flex-1 auto-rows-[minmax(260px,auto)] grid-cols-12 gap-2 overflow-auto p-2 lg:auto-rows-auto lg:grid-rows-[0.8fr_2.07fr_1.75fr] lg:overflow-hidden">
                <OniStripPanel className="col-span-12 lg:col-span-9" />

                <SstComparePanel className="col-span-12 md:col-span-6 lg:col-span-3 lg:col-start-1 lg:row-start-2" />
                <CenterPanel className="col-span-12 md:col-span-6 lg:col-span-6 lg:col-start-4 lg:row-start-2 lg:row-span-2" />

                {/* Right column (widened): Phase donut grows to fill, Seasonal intensity sits below at content height. */}
                <div className="col-span-12 grid min-h-0 gap-2 md:col-span-6 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:row-span-2 lg:grid-rows-[1fr_auto]">
                  <PhaseDistributionPanel className="min-h-0" />
                  <SeasonalIntensityPanel className="min-h-0" />
                </div>

                <OniRainfallStatsPanel className="col-span-12 md:col-span-6 lg:col-span-3 lg:col-start-1 lg:row-start-3" />
                <NdviOniPanel className="col-span-12 md:col-span-6 lg:col-span-3 lg:col-start-10 lg:row-start-3" />
              </div>
            </div>
          </TooltipProvider>
        </FilterProvider>
      </DataProvider>
    </ThemeProvider>
  );
}
