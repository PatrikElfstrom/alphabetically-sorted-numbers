import type { CSSProperties } from "react";
import type { AppOptions } from "../app/types";
import {
  buildPlotGridPath,
  getBandGridLayout,
  getGuideFormulaLabel,
  getPlotLayout,
  getPointRendering,
  getRangeTrackOffsets,
  type BandGridLayout,
  type PlotLayout,
  type PointRendering,
  type TrackOffsets,
} from "./chartData";
import { getRangeCount } from "./appOptions";

export type PlotPanelViewModel = {
  availableCount: number;
  guideFormulaLabel: string;
  layout: PlotLayout;
  pointRendering: PointRendering;
  plotFrameStyle: CSSProperties;
  plotGridPath: string;
  plotGridStyle: CSSProperties;
  plotRangeShellStyle: CSSProperties;
  plotRangeStyle: CSSProperties;
  valueTrackStyle: CSSProperties;
  visibleCount: number;
  visibleRankCount: number;
  yRailStyle: CSSProperties;
  yTrackStyle: CSSProperties;
};

function getYTrackStyle(trackOffsets: TrackOffsets): CSSProperties {
  return {
    top: `${trackOffsets.endOffset}%`,
    bottom: `${trackOffsets.startOffset}%`,
  };
}

function getValueTrackStyle(trackOffsets: TrackOffsets): CSSProperties {
  return {
    left: `${trackOffsets.startOffset}%`,
    right: `${trackOffsets.endOffset}%`,
  };
}

function getPlotGridStyle(layout: PlotLayout): CSSProperties {
  return {
    top: `${layout.marginPad}px`,
    left: `${layout.axisPad}px`,
    width: `${layout.plotAreaSize}px`,
    height: `${layout.plotAreaSize}px`,
  };
}

function getPlotFrameStyle(plotSize: number): CSSProperties {
  return {
    height: `${plotSize}px`,
    width: `${plotSize}px`,
  };
}

function getPlotRangeStyle(plotSize: number): CSSProperties {
  return {
    width: `${plotSize}px`,
  };
}

function getPlotRangeShellStyle(layout: PlotLayout): CSSProperties {
  return {
    marginLeft: `${layout.axisPad}px`,
    width: `${layout.plotAreaSize}px`,
  };
}

function getYRailStyle(layout: PlotLayout): CSSProperties {
  return {
    marginTop: `${layout.marginPad}px`,
    height: `${layout.plotAreaSize}px`,
  };
}

function getPlotGridLayout(
  availableCount: number,
  layout: PlotLayout,
): BandGridLayout {
  return getBandGridLayout(availableCount, layout.plotAreaSize);
}

export function getPlotPanelViewModel(
  options: AppOptions,
  plotSize: number,
): PlotPanelViewModel {
  const availableCount = getRangeCount(options.availableRange);
  const visibleCount = getRangeCount(options.visibleValueRange);
  const visibleRankCount = getRangeCount(options.visibleRankRange);
  const layout = getPlotLayout(plotSize);
  const xTrackOffsets = getRangeTrackOffsets(
    options.visibleValueRange,
    options.availableRange,
  );
  const yTrackOffsets = getRangeTrackOffsets(options.visibleRankRange, {
    start: 1,
    end: availableCount,
  });
  const bandGridLayout = getPlotGridLayout(availableCount, layout);
  const pointRendering = getPointRendering(
    plotSize,
    bandGridLayout.bandwidth,
    options.pointDisplayMode,
  );

  return {
    availableCount,
    guideFormulaLabel: getGuideFormulaLabel(options.availableRange.start),
    layout,
    pointRendering,
    plotFrameStyle: getPlotFrameStyle(plotSize),
    plotGridPath: buildPlotGridPath(
      bandGridLayout.boundaries,
      layout.plotAreaSize,
    ),
    plotGridStyle: getPlotGridStyle(layout),
    plotRangeShellStyle: getPlotRangeShellStyle(layout),
    plotRangeStyle: getPlotRangeStyle(plotSize),
    valueTrackStyle: getValueTrackStyle(xTrackOffsets),
    visibleCount,
    visibleRankCount,
    yRailStyle: getYRailStyle(layout),
    yTrackStyle: getYTrackStyle(yTrackOffsets),
  };
}
