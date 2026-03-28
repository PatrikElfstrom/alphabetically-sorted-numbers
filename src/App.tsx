import { useDeferredValue, useMemo } from "react";
import "./app/AppShell.css";
import { ControlsPanel } from "./components/ControlsPanel";
import { PlotPanel } from "./components/PlotPanel";
import { useAppPreferences } from "./hooks/useAppPreferences";
import { usePlotSize } from "./hooks/usePlotSize";
import {
  buildChartData,
  buildLanguageSeries,
  getSelectedLanguageColorById,
  getSelectedLanguageSummary,
  selectVisibleLanguageSeries,
} from "./lib/chartData";

function App() {
  const { controlsRef, plotRangeRef, plotSize } = usePlotSize();
  const {
    options,
    setPointDisplayMode,
    setSelectedLanguageIds,
    setShowEqualityLine,
    setVisibleRankRangeEnd,
    setVisibleRankRangeStart,
    setVisibleValueRangeEnd,
    setVisibleValueRangeStart,
    updateAvailableRange,
  } = useAppPreferences();
  const deferredVisibleValueStart = useDeferredValue(options.visibleValueRange.start);
  const deferredVisibleValueEnd = useDeferredValue(options.visibleValueRange.end);
  const deferredVisibleRankStart = useDeferredValue(options.visibleRankRange.start);
  const deferredVisibleRankEnd = useDeferredValue(options.visibleRankRange.end);

  const chartData = useMemo(
    () => buildChartData(options.availableRange),
    [options.availableRange],
  );
  const languageSeries = useMemo(
    () =>
      buildLanguageSeries(options.availableRange, options.selectedLanguageIds),
    [options.availableRange, options.selectedLanguageIds],
  );
  const visibleLanguageSeries = useMemo(
    () =>
      selectVisibleLanguageSeries(
        languageSeries,
        {
          start: deferredVisibleValueStart,
          end: deferredVisibleValueEnd,
        },
        {
          start: deferredVisibleRankStart,
          end: deferredVisibleRankEnd,
        },
      ),
    [
      deferredVisibleRankEnd,
      deferredVisibleRankStart,
      deferredVisibleValueEnd,
      deferredVisibleValueStart,
      languageSeries,
    ],
  );
  const selectedLanguageSummary = useMemo(
    () => getSelectedLanguageSummary(languageSeries),
    [languageSeries],
  );
  const selectedLanguageColorById = useMemo(
    () => getSelectedLanguageColorById(languageSeries),
    [languageSeries],
  );

  return (
    <main className="app-shell">
      <ControlsPanel
        controlsRef={controlsRef}
        languageSeries={languageSeries}
        options={options}
        selectedLanguageColorById={selectedLanguageColorById}
        selectedLanguageSummary={selectedLanguageSummary}
        setPointDisplayMode={setPointDisplayMode}
        setSelectedLanguageIds={setSelectedLanguageIds}
        updateAvailableRange={updateAvailableRange}
      />
      <PlotPanel
        chartData={chartData}
        options={options}
        plotRangeRef={plotRangeRef}
        plotSize={plotSize}
        setShowEqualityLine={setShowEqualityLine}
        setVisibleRankRangeEnd={setVisibleRankRangeEnd}
        setVisibleRankRangeStart={setVisibleRankRangeStart}
        setVisibleValueRangeEnd={setVisibleValueRangeEnd}
        setVisibleValueRangeStart={setVisibleValueRangeStart}
        visibleLanguageSeries={visibleLanguageSeries}
      />
    </main>
  );
}

export default App;
