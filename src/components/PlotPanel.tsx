import { useMemo, type RefObject } from "react";
import type { AppOptions } from "../app/types";
import {
  type ChartData,
  type VisibleLanguageSeries,
} from "../lib/chartData";
import { getPlotPanelViewModel } from "../lib/plotPanel";
import { usePlotLayers } from "../hooks/usePlotLayers";
import "./PlotPanel.css";

type PlotPanelProps = {
  chartData: ChartData;
  options: AppOptions;
  plotRangeRef: RefObject<HTMLDivElement | null>;
  plotSize: number;
  setShowEqualityLine: (showEqualityLine: boolean) => void;
  setVisibleRankRangeEnd: (end: number) => void;
  setVisibleRankRangeStart: (start: number) => void;
  setVisibleValueRangeEnd: (end: number) => void;
  setVisibleValueRangeStart: (start: number) => void;
  visibleLanguageSeries: VisibleLanguageSeries[];
};

export function PlotPanel({
  chartData,
  options,
  plotRangeRef,
  plotSize,
  setShowEqualityLine,
  setVisibleRankRangeEnd,
  setVisibleRankRangeStart,
  setVisibleValueRangeEnd,
  setVisibleValueRangeStart,
  visibleLanguageSeries,
}: PlotPanelProps) {
  const viewModel = useMemo(
    () => getPlotPanelViewModel(options, plotSize),
    [options, plotSize],
  );
  const { basePlotRef, overlayPlotRef } = usePlotLayers({
    chartData,
    layout: viewModel.layout,
    plotSize,
    pointRendering: viewModel.pointRendering,
    showEqualityLine: options.showEqualityLine,
    visibleLanguageSeries,
  });

  return (
    <div className="plot-shell">
      <div className="plot-matrix">
        <div className="plot-y-range-shell">
          <div className="plot-y-range__rail" style={viewModel.yRailStyle}>
            <div className="plot-y-range__labels" aria-hidden="true">
              <span>{viewModel.availableCount}</span>
              <span>
                {viewModel.visibleRankCount} / {viewModel.availableCount}
              </span>
              <span>1</span>
            </div>

            <div className="range-slider range-slider--vertical">
              <div
                className="range-slider__track range-slider__track--vertical"
                style={viewModel.yTrackStyle}
              />
              <input
                aria-label="Visible rank start"
                className="range-slider__input range-slider__input--vertical"
                max={viewModel.availableCount}
                min={1}
                onChange={(event) => {
                  setVisibleRankRangeStart(Number(event.target.value));
                }}
                type="range"
                value={options.visibleRankRange.start}
              />
              <input
                aria-label="Visible rank end"
                className="range-slider__input range-slider__input--vertical"
                max={viewModel.availableCount}
                min={1}
                onChange={(event) => {
                  setVisibleRankRangeEnd(Number(event.target.value));
                }}
                type="range"
                value={options.visibleRankRange.end}
              />
            </div>
          </div>
        </div>

        <div className="plot-frame" style={viewModel.plotFrameStyle}>
          <div className="plot-canvas">
            <div className="plot-grid" style={viewModel.plotGridStyle}>
              <svg
                aria-hidden="true"
                className="plot-grid__svg"
                viewBox={`0 0 ${viewModel.layout.plotAreaSize} ${viewModel.layout.plotAreaSize}`}
              >
                <path className="plot-grid__path" d={viewModel.plotGridPath} />
              </svg>
            </div>
            <div className="plot-layer plot-layer--base" ref={basePlotRef} />
            <div className="plot-layer plot-layer--overlay" ref={overlayPlotRef} />
          </div>
        </div>

        <label className="toggle-switch toggle-switch--plot">
          <input
            checked={options.showEqualityLine}
            className="toggle-switch__input"
            onChange={(event) => {
              setShowEqualityLine(event.target.checked);
            }}
            type="checkbox"
          />
          <span className="toggle-switch__control" aria-hidden="true">
            <span className="toggle-switch__thumb" />
          </span>
          <span className="toggle-switch__copy">
            <strong>{viewModel.guideFormulaLabel}</strong>
          </span>
        </label>

        <div className="plot-range-row" ref={plotRangeRef} style={viewModel.plotRangeStyle}>
          <div className="plot-range-shell" style={viewModel.plotRangeShellStyle}>
            <div className="range-slider" aria-label="Visible value range">
              <div className="range-slider__track" style={viewModel.valueTrackStyle} />
              <input
                aria-label="Visible value start"
                className="range-slider__input"
                max={options.availableRange.end}
                min={options.availableRange.start}
                onChange={(event) => {
                  setVisibleValueRangeStart(Number(event.target.value));
                }}
                type="range"
                value={options.visibleValueRange.start}
              />
              <input
                aria-label="Visible value end"
                className="range-slider__input"
                max={options.availableRange.end}
                min={options.availableRange.start}
                onChange={(event) => {
                  setVisibleValueRangeEnd(Number(event.target.value));
                }}
                type="range"
                value={options.visibleValueRange.end}
              />
            </div>

            <div className="plot-range__footer">
              <span>{options.availableRange.start}</span>
              <span>
                {viewModel.visibleCount} / {viewModel.availableCount} visible
              </span>
              <span>{options.availableRange.end}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
