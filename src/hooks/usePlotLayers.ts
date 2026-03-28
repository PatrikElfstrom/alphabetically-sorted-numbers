import { useEffect, useRef } from "react";
import {
  createBasePlot,
  createOverlayPlot,
  mountPlot,
} from "../lib/plotBuilders";
import type {
  ChartData,
  PlotLayout,
  PointRendering,
  VisibleLanguageSeries,
} from "../lib/chartData";

type UsePlotLayersOptions = {
  chartData: ChartData;
  layout: PlotLayout;
  plotSize: number;
  pointRendering: PointRendering;
  showEqualityLine: boolean;
  visibleLanguageSeries: VisibleLanguageSeries[];
};

export function usePlotLayers({
  chartData,
  layout,
  plotSize,
  pointRendering,
  showEqualityLine,
  visibleLanguageSeries,
}: UsePlotLayersOptions) {
  const basePlotRef = useRef<HTMLDivElement | null>(null);
  const overlayPlotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!basePlotRef.current) {
      return;
    }

    return mountPlot(
      basePlotRef.current,
      createBasePlot({
        chartData,
        layout,
        plotSize,
      }),
    );
  }, [chartData, layout, plotSize]);

  useEffect(() => {
    if (!overlayPlotRef.current) {
      return;
    }

    return mountPlot(
      overlayPlotRef.current,
      createOverlayPlot({
        chartData,
        layout,
        plotSize,
        pointRendering,
        showEqualityLine,
        visibleLanguageSeries,
      }),
    );
  }, [
    chartData,
    layout,
    plotSize,
    pointRendering,
    showEqualityLine,
    visibleLanguageSeries,
  ]);

  return {
    basePlotRef,
    overlayPlotRef,
  };
}
