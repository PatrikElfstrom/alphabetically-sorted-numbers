import * as d3 from "d3";
import type { NumberRange, PointDisplayMode } from "../../app/types";
import { clampNumber } from "../rangeUtils";
import type {
  BandGridLayout,
  PlotLayout,
  PointRendering,
  TrackOffsets,
} from "./types";

const compactPointMinSize = 1;
const compactPointMaxSize = 4.8;

export function getRangeTrackOffsets(
  selectionRange: NumberRange,
  domainRange: NumberRange,
): TrackOffsets {
  if (domainRange.end <= domainRange.start) {
    return {
      startOffset: 0,
      endOffset: 0,
    };
  }

  const span = domainRange.end - domainRange.start;

  return {
    startOffset: ((selectionRange.start - domainRange.start) / span) * 100,
    endOffset: 100 - ((selectionRange.end - domainRange.start) / span) * 100,
  };
}

export function getPlotLayout(plotSize: number): PlotLayout {
  const marginPad = Math.max(12, Math.round(plotSize * 0.018));
  const axisPad = Math.max(38, Math.round(plotSize * 0.055));
  const plotAreaSize = Math.max(0, plotSize - axisPad - marginPad);

  return { axisPad, marginPad, plotAreaSize };
}

export function getBandGridLayout(
  cellCount: number,
  plotAreaSize: number,
): BandGridLayout {
  if (cellCount <= 0 || plotAreaSize <= 0) {
    return {
      bandwidth: 0,
      boundaries: [],
    };
  }

  const scale = d3
    .scaleBand<number>()
    .domain(d3.range(cellCount))
    .range([0, plotAreaSize])
    .paddingInner(0)
    .paddingOuter(0);
  const firstBoundary = scale(0) ?? 0;
  const step = scale.step();
  const boundaries = Array.from({ length: cellCount + 1 }, (_, index) =>
    firstBoundary + step * index,
  );

  return {
    bandwidth: scale.bandwidth(),
    boundaries,
  };
}

export function getPointRendering(
  plotSize: number,
  gridCellSize: number,
  pointDisplayMode: PointDisplayMode,
): PointRendering {
  const useCompactSquares =
    pointDisplayMode === "squares" ||
    (pointDisplayMode === "auto" && gridCellSize < 6);
  const radius = clampNumber(
    Math.max(gridCellSize * 0.95, plotSize * 0.0036),
    compactPointMinSize,
    compactPointMaxSize,
  );

  return {
    radius,
    useCompactSquares,
  };
}

export function buildPlotGridPath(
  boundaries: number[],
  plotAreaSize: number,
): string {
  if (boundaries.length === 0 || plotAreaSize <= 0) {
    return "";
  }

  const commands: string[] = [];

  for (const boundary of boundaries) {
    const offset = Number(boundary.toFixed(4));

    commands.push(`M${offset} 0V${plotAreaSize}`);
    commands.push(`M0 ${offset}H${plotAreaSize}`);
  }

  return commands.join("");
}
