import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import "./App.css";
import { MultiSelectCombobox } from "./components/ui/MultiSelectCombobox";
import {
  getLanguageCollator,
  getNumberName,
  getSortableNumberName,
  numberLanguageById,
  numberLanguages,
  resolveLanguageId,
  type LanguageId,
} from "./numberLanguages";

type NumberPoint = {
  alphabeticalRank: number;
  languageId: LanguageId;
  languageLabel: string;
  name: string;
  value: number;
};

type RawNumberEntry = {
  name: string;
  sortName: string;
  value: number;
};

type EqualityPoint = {
  alphabeticalRank: number;
  value: number;
};

type ChartData = {
  equalityPoints: EqualityPoint[];
  xValues: number[];
  xTicks: number[];
  yValues: number[];
  yTicks: number[];
};

type LanguageChartData = {
  data: NumberPoint[];
  pointsByValue: Map<number, NumberPoint>;
};

type LanguageSeries = {
  chartData: LanguageChartData;
  color: string;
  languageId: LanguageId;
  languageLabel: string;
};

type VisibleLanguageSeries = LanguageSeries & {
  visiblePoints: NumberPoint[];
};

type PointDisplayMode = "auto" | "cells" | "squares";

const minAvailableStart = 0;
const maxAvailableValue = 5000;
const defaultAvailableStart = 0;
const defaultAvailableEnd = 100;
const defaultLanguageId = resolveLanguageId("sv-SE") ?? numberLanguages[0].id;
const userOptionsStorageKey = "alphabetical-numbers:user-options";
const compactPointMinSize = 1;
const compactPointMaxSize = 4.8;
const defaultAvailableCount = defaultAvailableEnd - defaultAvailableStart + 1;
const languageColorPalette = [
  "#67e8f9",
  "#fbbf24",
  "#fb7185",
  "#86efac",
  "#a78bfa",
  "#fdba74",
  "#7dd3fc",
  "#f9a8d4",
];
const languageListFormatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});
const legacyLanguageIds: Record<string, LanguageId> = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  sv: "sv-SE",
};

type StoredUserOptions = {
  selectedLanguageIds: LanguageId[];
  availableStart: number;
  availableEnd: number;
  visibleStart: number;
  visibleEnd: number;
  visibleRankStart: number;
  visibleRankEnd: number;
  pointDisplayMode: PointDisplayMode;
  showEqualityLine: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && Object.hasOwn(numberLanguageById, value);
}

function normalizeStoredLanguageId(value: unknown): LanguageId | null {
  if (isLanguageId(value)) {
    return value;
  }

  if (typeof value === "string") {
    const resolvedLanguageId = resolveLanguageId(value);

    if (resolvedLanguageId) {
      return resolvedLanguageId;
    }
  }

  if (typeof value === "string" && Object.hasOwn(legacyLanguageIds, value)) {
    return resolveLanguageId(legacyLanguageIds[value]);
  }

  return null;
}

function getStoredLanguageId(value: unknown): LanguageId {
  return normalizeStoredLanguageId(value) ?? defaultLanguageId;
}

function getStoredLanguageIds(value: unknown): LanguageId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => normalizeStoredLanguageId(entry))
        .filter((entry): entry is LanguageId => entry !== null),
    ),
  );
}

function getLanguageColor(index: number): string {
  return languageColorPalette[index % languageColorPalette.length];
}

function isPointDisplayMode(value: unknown): value is PointDisplayMode {
  return value === "auto" || value === "cells" || value === "squares";
}

function getStoredNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : fallback;
}

function getRangeTrackOffsets(
  selectionStart: number,
  selectionEnd: number,
  domainStart: number,
  domainEnd: number,
) {
  if (domainEnd <= domainStart) {
    return {
      startOffset: 0,
      endOffset: 0,
    };
  }

  const span = domainEnd - domainStart;

  return {
    startOffset: ((selectionStart - domainStart) / span) * 100,
    endOffset: 100 - ((selectionEnd - domainStart) / span) * 100,
  };
}

function getStoredUserOptions(): StoredUserOptions | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(userOptionsStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== "object") {
      return null;
    }

    const parsedOptions = parsedValue as Record<string, unknown>;
    const selectedLanguageIds = getStoredLanguageIds(parsedOptions.selectedLanguageIds);
    const preferredLanguageIds =
      selectedLanguageIds.length > 0
        ? selectedLanguageIds
        : [getStoredLanguageId(parsedOptions.selectedLanguageId)];
    const availableStart = clamp(
      getStoredNumber(parsedOptions.availableStart, defaultAvailableStart),
      minAvailableStart,
      maxAvailableValue,
    );
    const availableEnd = clamp(
      getStoredNumber(parsedOptions.availableEnd, defaultAvailableEnd),
      availableStart,
      maxAvailableValue,
    );
    const visibleStart = clamp(
      getStoredNumber(parsedOptions.visibleStart, availableStart),
      availableStart,
      availableEnd,
    );
    const visibleEnd = clamp(
      getStoredNumber(parsedOptions.visibleEnd, availableEnd),
      visibleStart,
      availableEnd,
    );
    const availableCount = availableEnd - availableStart + 1;
    const visibleRankStart = clamp(
      getStoredNumber(parsedOptions.visibleRankStart, 1),
      1,
      availableCount,
    );
    const visibleRankEnd = clamp(
      getStoredNumber(parsedOptions.visibleRankEnd, availableCount),
      visibleRankStart,
      availableCount,
    );
    const pointDisplayMode = isPointDisplayMode(parsedOptions.pointDisplayMode)
      ? parsedOptions.pointDisplayMode
      : "auto";

    return {
      selectedLanguageIds: preferredLanguageIds,
      availableStart,
      availableEnd,
      visibleStart,
      visibleEnd,
      visibleRankStart,
      visibleRankEnd,
      pointDisplayMode,
      showEqualityLine: parsedOptions.showEqualityLine === true,
    };
  } catch {
    return null;
  }
}

function getTickStep(maxValue: number): number {
  const roughStep = Math.max(1, Math.ceil(maxValue / 10));
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));

  if (roughStep <= magnitude) {
    return magnitude;
  }

  if (roughStep <= magnitude * 2) {
    return magnitude * 2;
  }

  if (roughStep <= magnitude * 5) {
    return magnitude * 5;
  }

  return magnitude * 10;
}

function getPlotLayout(plotSize: number) {
  const marginPad = Math.max(12, Math.round(plotSize * 0.018));
  const axisPad = Math.max(38, Math.round(plotSize * 0.055));
  const plotAreaSize = Math.max(0, plotSize - axisPad - marginPad);

  return { axisPad, marginPad, plotAreaSize };
}

function getBandGridLayout(cellCount: number, plotAreaSize: number) {
  if (cellCount <= 0 || plotAreaSize <= 0) {
    return {
      bandwidth: 0,
      boundaries: [] as number[],
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

function buildChartData(
  rangeStart: number,
  rangeEnd: number,
): ChartData {
  const xValues = d3.range(rangeStart, rangeEnd + 1);
  const count = xValues.length;
  const yValues = d3.range(1, count + 1);

  const tickStep = getTickStep(Math.max(1, rangeEnd - rangeStart));
  const xTicks = d3.range(rangeStart, rangeEnd + 1, tickStep);
  const yTicks = d3.range(1, count + 1, tickStep);

  if (xTicks[xTicks.length - 1] !== rangeEnd) {
    xTicks.push(rangeEnd);
  }

  if (yTicks.length === 0 || yTicks[yTicks.length - 1] !== count) {
    yTicks.push(count);
  }

  const equalityStart = rangeStart;
  const equalityEnd = rangeEnd;
  const equalityPoints =
    equalityStart <= equalityEnd
      ? d3.range(equalityStart, equalityEnd + 1).map((value: number) => ({
          alphabeticalRank: value - rangeStart + 1,
          value,
        }))
      : [];

  return {
    equalityPoints,
    xTicks,
    xValues,
    yTicks,
    yValues,
  };
}

function buildLanguageChartData(
  rangeStart: number,
  rangeEnd: number,
  languageId: LanguageId,
): LanguageChartData {
  const xValues = d3.range(rangeStart, rangeEnd + 1);
  const language = numberLanguageById[languageId];
  const collator = getLanguageCollator(languageId);
  const rawData: RawNumberEntry[] = xValues.map(
    (value: number): RawNumberEntry => ({
      name: getNumberName(value, languageId),
      sortName: getSortableNumberName(value, languageId),
      value,
    }),
  );

  const data: NumberPoint[] = d3
    .sort(rawData, (a: RawNumberEntry, b: RawNumberEntry) =>
      collator.compare(a.sortName, b.sortName),
    )
    .map((entry: RawNumberEntry, index: number) => ({
      alphabeticalRank: index + 1,
      languageId,
      languageLabel: language.label,
      name: entry.name,
      value: entry.value,
    }));

  const pointsByValue = new Map<number, NumberPoint>();

  for (const point of data) {
    pointsByValue.set(point.value, point);
  }

  return {
    data,
    pointsByValue,
  };
}

function getPointTitle(entry: NumberPoint): string {
  return `${entry.languageLabel}: ${entry.name}\nValue: ${entry.value}\nPosition: ${entry.alphabeticalRank}`;
}

function App() {
  const controlsRef = useRef<HTMLElement | null>(null);
  const plotRangeRef = useRef<HTMLDivElement | null>(null);
  const basePlotRef = useRef<HTMLDivElement | null>(null);
  const overlayPlotRef = useRef<HTMLDivElement | null>(null);
  const initialUserOptions = useMemo(() => getStoredUserOptions(), []);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<LanguageId[]>(
    initialUserOptions?.selectedLanguageIds ?? [defaultLanguageId],
  );
  const [availableStart, setAvailableStart] = useState(
    initialUserOptions?.availableStart ?? defaultAvailableStart,
  );
  const [availableEnd, setAvailableEnd] = useState(
    initialUserOptions?.availableEnd ?? defaultAvailableEnd,
  );
  const [visibleStart, setVisibleStart] = useState(
    initialUserOptions?.visibleStart ?? defaultAvailableStart,
  );
  const [visibleEnd, setVisibleEnd] = useState(
    initialUserOptions?.visibleEnd ?? defaultAvailableEnd,
  );
  const [visibleRankStart, setVisibleRankStart] = useState(
    initialUserOptions?.visibleRankStart ?? 1,
  );
  const [visibleRankEnd, setVisibleRankEnd] = useState(
    initialUserOptions?.visibleRankEnd ?? defaultAvailableCount,
  );
  const [plotSize, setPlotSize] = useState(720);
  const [pointDisplayMode, setPointDisplayMode] = useState<PointDisplayMode>(
    initialUserOptions?.pointDisplayMode ?? "auto",
  );
  const [showEqualityLine, setShowEqualityLine] = useState(
    initialUserOptions?.showEqualityLine ?? false,
  );
  const guideFormulaLabel =
    availableStart === 0
      ? "Guide y=x+1"
      : availableStart === 1
        ? "Guide y=x"
        : `Guide y=x-${availableStart - 1}`;

  const chartData = useMemo(
    () => buildChartData(availableStart, availableEnd),
    [availableEnd, availableStart],
  );
  const languageSeries = useMemo<LanguageSeries[]>(
    () =>
      selectedLanguageIds.map((languageId, index) => ({
        chartData: buildLanguageChartData(availableStart, availableEnd, languageId),
        color: getLanguageColor(index),
        languageId,
        languageLabel: numberLanguageById[languageId].label,
      })),
    [availableEnd, availableStart, selectedLanguageIds],
  );
  const selectedLanguageSummary = useMemo(
    () =>
      languageListFormatter.format(
        languageSeries.map((series) => series.languageLabel.toLowerCase()),
      ),
    [languageSeries],
  );
  const selectedLanguageColorById = useMemo(
    () =>
      new Map(
        languageSeries.map((series) => [series.languageId, series.color] as const),
      ),
    [languageSeries],
  );
  const deferredVisibleStart = useDeferredValue(visibleStart);
  const deferredVisibleEnd = useDeferredValue(visibleEnd);
  const deferredVisibleRankStart = useDeferredValue(visibleRankStart);
  const deferredVisibleRankEnd = useDeferredValue(visibleRankEnd);

  const visibleLanguageSeries = useMemo<VisibleLanguageSeries[]>(() => {
    return languageSeries.map((series) => {
      const visiblePoints: NumberPoint[] = [];

      for (
        let value = deferredVisibleStart;
        value <= deferredVisibleEnd;
        value += 1
      ) {
        const point = series.chartData.pointsByValue.get(value);

        if (
          point &&
          point.alphabeticalRank >= deferredVisibleRankStart &&
          point.alphabeticalRank <= deferredVisibleRankEnd
        ) {
          visiblePoints.push(point);
        }
      }

      return {
        ...series,
        visiblePoints,
      };
    });
  }, [
    deferredVisibleEnd,
    deferredVisibleRankEnd,
    deferredVisibleRankStart,
    deferredVisibleStart,
    languageSeries,
  ]);
  const visibleCount = Math.max(0, visibleEnd - visibleStart + 1);
  const availableCount = Math.max(0, availableEnd - availableStart + 1);
  const visibleRankCount = Math.max(0, visibleRankEnd - visibleRankStart + 1);
  const { axisPad, marginPad, plotAreaSize } = getPlotLayout(plotSize);
  const xTrackOffsets = getRangeTrackOffsets(
    visibleStart,
    visibleEnd,
    availableStart,
    availableEnd,
  );
  const yTrackOffsets = getRangeTrackOffsets(
    visibleRankStart,
    visibleRankEnd,
    1,
    availableCount,
  );
  const yTrackStyle = {
    top: `${yTrackOffsets.endOffset}%`,
    bottom: `${yTrackOffsets.startOffset}%`,
  };
  const bandGridLayout = useMemo(
    () => getBandGridLayout(availableCount, plotAreaSize),
    [availableCount, plotAreaSize],
  );
  const gridCellSize = bandGridLayout.bandwidth;
  const useCompactPointSquares =
    pointDisplayMode === "squares" ||
    (pointDisplayMode === "auto" && gridCellSize < 6);
  const compactPointRadius = clamp(
    Math.max(gridCellSize * 0.95, plotSize * 0.0036),
    compactPointMinSize,
    compactPointMaxSize,
  );
  const plotGridPath = useMemo(() => {
    if (availableCount <= 0 || plotAreaSize <= 0) {
      return "";
    }

    const commands: string[] = [];

    for (const boundary of bandGridLayout.boundaries) {
      const offset = Number(boundary.toFixed(4));

      commands.push(`M${offset} 0V${plotAreaSize}`);
      commands.push(`M0 ${offset}H${plotAreaSize}`);
    }

    return commands.join("");
  }, [availableCount, bandGridLayout.boundaries, plotAreaSize]);

  useEffect(() => {
    const updatePlotSize = () => {
      const controlsHeight =
        controlsRef.current?.getBoundingClientRect().height ?? 0;
      const plotRangeHeight =
        plotRangeRef.current?.getBoundingClientRect().height ?? 0;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const outerPadding = viewportWidth <= 720 ? 18 : 28;
      const controlsGap = viewportWidth <= 720 ? 8 : 10;
      const plotShellChrome = viewportWidth <= 720 ? 26 : 34;
      const yRangeWidth = viewportWidth <= 720 ? 66 : 82;
      const plotMatrixGap = viewportWidth <= 720 ? 8 : 12;
      const availableWidth =
        viewportWidth - outerPadding * 2 - yRangeWidth - plotMatrixGap;
      const availableHeight =
        viewportHeight -
        controlsHeight -
        plotRangeHeight -
        plotShellChrome -
        controlsGap -
        outerPadding * 2;
      const nextSize = Math.max(
        280,
        Math.floor(Math.min(availableWidth, availableHeight, 1480)),
      );

      if (nextSize > 0) {
        setPlotSize((currentSize) =>
          currentSize === nextSize ? currentSize : nextSize,
        );
      }
    };

    updatePlotSize();

    const observer = new ResizeObserver(() => {
      updatePlotSize();
    });

    if (controlsRef.current) {
      observer.observe(controlsRef.current);
    }

    if (plotRangeRef.current) {
      observer.observe(plotRangeRef.current);
    }

    window.addEventListener("resize", updatePlotSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePlotSize);
    };
  }, []);

  const updateAvailableRange = (nextStart: number, nextEnd: number) => {
    const nextCount = nextEnd - nextStart + 1;

    setAvailableStart(nextStart);
    setAvailableEnd(nextEnd);
    setVisibleStart(nextStart);
    setVisibleEnd(nextEnd);
    setVisibleRankStart(1);
    setVisibleRankEnd(nextCount);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        userOptionsStorageKey,
        JSON.stringify({
          selectedLanguageIds,
          availableStart,
          availableEnd,
          visibleStart,
          visibleEnd,
          visibleRankStart,
          visibleRankEnd,
          pointDisplayMode,
          showEqualityLine,
        } satisfies StoredUserOptions),
      );
    } catch {
      // Ignore storage write failures so the app stays usable in restricted contexts.
    }
  }, [
    availableEnd,
    availableStart,
    pointDisplayMode,
    selectedLanguageIds,
    showEqualityLine,
    visibleEnd,
    visibleRankEnd,
    visibleRankStart,
    visibleStart,
  ]);

  useEffect(() => {
    if (!basePlotRef.current) {
      return;
    }

    const { axisPad, marginPad } = getPlotLayout(plotSize);

    const basePlot = Plot.plot({
      width: plotSize,
      height: plotSize,
      marginTop: marginPad,
      marginRight: marginPad,
      marginBottom: axisPad,
      marginLeft: axisPad,
      style: {
        background: "transparent",
        color: "#f2f4ff",
        fontFamily: "var(--font-body)",
        fontSize: `${Math.max(10, Math.round(plotSize * 0.011))}px`,
        overflow: "visible",
      },
      x: {
        type: "band",
        label: "Number value",
        domain: chartData.xValues,
        padding: 0,
        round: false,
        tickSize: 0,
        ticks: chartData.xTicks,
      },
      y: {
        type: "band",
        label: "Alphabetical position",
        domain: chartData.yValues,
        padding: 0,
        round: false,
        reverse: true,
        tickSize: 0,
        ticks: chartData.yTicks,
      },
      marks: [
        Plot.frame({
          inset: 0,
          stroke: "rgba(200, 212, 255, 0.22)",
          strokeWidth: 1,
        }),
      ],
    });

    basePlotRef.current.replaceChildren(basePlot);

    return () => {
      basePlot.remove();
    };
  }, [
    chartData.xTicks,
    chartData.xValues,
    chartData.yTicks,
    chartData.yValues,
    plotSize,
  ]);

  useEffect(() => {
    if (!overlayPlotRef.current) {
      return;
    }

    const { axisPad, marginPad } = getPlotLayout(plotSize);
    const visiblePointMark = useCompactPointSquares
      ? visibleLanguageSeries.map((series) =>
          Plot.dot(series.visiblePoints, {
            x: "value",
            y: "alphabeticalRank",
            fill: series.color,
            fillOpacity: 0.82,
            symbol: "square",
            stroke: "rgba(235, 240, 255, 0.52)",
            strokeWidth: 0.7,
            r: compactPointRadius,
            title: getPointTitle,
          }),
        )
      : visibleLanguageSeries.map((series) =>
          Plot.cell(series.visiblePoints, {
            x: "value",
            y: "alphabeticalRank",
            fill: series.color,
            fillOpacity: 0.44,
            inset: 0.8,
            stroke: series.color,
            strokeOpacity: 0.9,
            strokeWidth: 0.45,
            title: getPointTitle,
          }),
        );

    const overlayPlot = Plot.plot({
      width: plotSize,
      height: plotSize,
      marginTop: marginPad,
      marginRight: marginPad,
      marginBottom: axisPad,
      marginLeft: axisPad,
      style: {
        background: "transparent",
        fontFamily: "var(--font-body)",
        overflow: "visible",
      },
      x: {
        type: "band",
        axis: null,
        domain: chartData.xValues,
        padding: 0,
        round: false,
      },
      y: {
        type: "band",
        axis: null,
        domain: chartData.yValues,
        padding: 0,
        round: false,
        reverse: true,
      },
      marks: [
        ...(showEqualityLine && chartData.equalityPoints.length > 1
          ? [
              Plot.line(chartData.equalityPoints, {
                x: "value",
                y: "alphabeticalRank",
                stroke: "#ffd27a",
                strokeWidth: Math.max(2, plotSize * 0.0032),
                strokeOpacity: 0.92,
                strokeDasharray: "8 6",
              }),
            ]
          : []),
        ...(showEqualityLine && chartData.equalityPoints.length === 1
          ? [
              Plot.dot(chartData.equalityPoints, {
                x: "value",
                y: "alphabeticalRank",
                fill: "#ffd27a",
                r: Math.max(4, plotSize * 0.0075),
              }),
            ]
          : []),
        ...visiblePointMark,
      ],
    });

    overlayPlotRef.current.replaceChildren(overlayPlot);

    return () => {
      overlayPlot.remove();
    };
  }, [
    chartData.equalityPoints,
    chartData.xValues,
    chartData.yValues,
    compactPointRadius,
    plotSize,
    showEqualityLine,
    useCompactPointSquares,
    visibleLanguageSeries,
  ]);

  return (
    <main className="app-shell">
      <section className="controls-shell" ref={controlsRef}>
        <div className="control-toolbar">
          <div className="number-group number-group--language">
            <span>Language</span>
            <MultiSelectCombobox
              emptyText="No languages match your search."
              minSelected={1}
              onValueChange={(nextValues) => {
                setSelectedLanguageIds(nextValues as LanguageId[]);
              }}
              options={numberLanguages.map((language) => ({
                color: selectedLanguageColorById.get(language.id),
                label: language.label,
                value: language.id,
              }))}
              placeholder="Choose one or more languages"
              searchPlaceholder="Search languages..."
              value={selectedLanguageIds}
            />
          </div>

          <label className="number-group number-group--display">
            <span>Display</span>
            <select
              className="number-input select-input"
              value={pointDisplayMode}
              onChange={(event) => {
                setPointDisplayMode(event.target.value as PointDisplayMode);
              }}
            >
              <option value="auto">Auto</option>
              <option value="cells">Cells</option>
              <option value="squares">Squares</option>
            </select>
          </label>

          <label className="number-group number-group--from">
            <span>From</span>
            <input
              className="number-input"
              type="number"
              min={minAvailableStart}
              max={maxAvailableValue}
              value={availableStart}
              onChange={(event) => {
                const nextStart = clamp(
                  Number(event.target.value || 0),
                  minAvailableStart,
                  maxAvailableValue,
                );
                updateAvailableRange(
                  nextStart,
                  Math.max(nextStart, availableEnd),
                );
              }}
            />
          </label>

          <label className="number-group number-group--to">
            <span>To</span>
            <input
              className="number-input"
              type="number"
              min={minAvailableStart}
              max={maxAvailableValue}
              value={availableEnd}
              onChange={(event) => {
                const nextEnd = clamp(
                  Number(event.target.value || 0),
                  minAvailableStart,
                  maxAvailableValue,
                );
                updateAvailableRange(
                  Math.min(availableStart, nextEnd),
                  nextEnd,
                );
              }}
            />
          </label>

        </div>

        <div className="language-legend" aria-label="Selected language overlays">
          {languageSeries.map((series) => (
            <button
              aria-label={
                selectedLanguageIds.length > 1
                  ? `Remove ${series.languageLabel}`
                  : `${series.languageLabel} is required`
              }
              className="language-legend__item"
              disabled={selectedLanguageIds.length <= 1}
              key={series.languageId}
              onClick={() => {
                if (selectedLanguageIds.length <= 1) {
                  return;
                }

                setSelectedLanguageIds(
                  selectedLanguageIds.filter(
                    (languageId) => languageId !== series.languageId,
                  ),
                );
              }}
              style={
                { "--language-color": series.color } as CSSProperties
              }
              type="button"
            >
              <span className="language-legend__swatch" aria-hidden="true" />
              {series.languageLabel}
              <span className="language-legend__remove" aria-hidden="true">
                {selectedLanguageIds.length > 1 ? "x" : ""}
              </span>
            </button>
          ))}
        </div>

        <p className="control-note">
          Alphabetical positions are recalculated for {selectedLanguageSummary} and
          overlaid on the same grid.
        </p>
      </section>

      <div className="plot-shell">
        <div className="plot-matrix">
          <div className="plot-y-range-shell">
            <div
              className="plot-y-range__rail"
              style={{
                marginTop: `${marginPad}px`,
                height: `${plotAreaSize}px`,
              }}
            >
              <div className="plot-y-range__labels" aria-hidden="true">
                <span>{availableCount}</span>
                <span>
                  {visibleRankCount} / {availableCount}
                </span>
                <span>1</span>
              </div>

              <div
                className="range-slider range-slider--vertical"
                aria-label="Visible rank range"
              >
                <div
                  className="range-slider__track range-slider__track--vertical"
                  style={yTrackStyle}
                />
                <input
                  aria-label="Visible rank start"
                  className="range-slider__input range-slider__input--vertical"
                  type="range"
                  min={1}
                  max={availableCount}
                  value={visibleRankStart}
                  onChange={(event) => {
                    const nextStart = Math.min(
                      Number(event.target.value),
                      visibleRankEnd,
                    );
                    setVisibleRankStart(nextStart);
                  }}
                />
                <input
                  aria-label="Visible rank end"
                  className="range-slider__input range-slider__input--vertical"
                  type="range"
                  min={1}
                  max={availableCount}
                  value={visibleRankEnd}
                  onChange={(event) => {
                    const nextEnd = Math.max(
                      Number(event.target.value),
                      visibleRankStart,
                    );
                    setVisibleRankEnd(nextEnd);
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className="plot-frame"
            style={{ height: `${plotSize}px`, width: `${plotSize}px` }}
          >
            <div className="plot-canvas">
              <div
                className="plot-grid"
                style={{
                  top: `${marginPad}px`,
                  left: `${axisPad}px`,
                  width: `${plotAreaSize}px`,
                  height: `${plotAreaSize}px`,
                }}
              >
                <svg
                  aria-hidden="true"
                  className="plot-grid__svg"
                  viewBox={`0 0 ${plotAreaSize} ${plotAreaSize}`}
                >
                  <path className="plot-grid__path" d={plotGridPath} />
                </svg>
              </div>
              <div className="plot-layer plot-layer--base" ref={basePlotRef} />
              <div
                className="plot-layer plot-layer--overlay"
                ref={overlayPlotRef}
              />
            </div>
          </div>

          <label className="toggle-switch toggle-switch--plot">
            <input
              className="toggle-switch__input"
              type="checkbox"
              checked={showEqualityLine}
              onChange={(event) => {
                setShowEqualityLine(event.target.checked);
              }}
            />
            <span className="toggle-switch__control" aria-hidden="true">
              <span className="toggle-switch__thumb" />
            </span>
            <span className="toggle-switch__copy">
              <strong>{guideFormulaLabel}</strong>
            </span>
          </label>

          <div
            className="plot-range-row"
            ref={plotRangeRef}
            style={{ width: `${plotSize}px` }}
          >
            <div
              className="plot-range-shell"
              style={{
                marginLeft: `${axisPad}px`,
                width: `${plotAreaSize}px`,
              }}
            >
              <div className="range-slider" aria-label="Visible value range">
                <div
                  className="range-slider__track"
                  style={{
                    left: `${xTrackOffsets.startOffset}%`,
                    right: `${xTrackOffsets.endOffset}%`,
                  }}
                />
                <input
                  aria-label="Visible value start"
                  className="range-slider__input"
                  type="range"
                  min={availableStart}
                  max={availableEnd}
                  value={visibleStart}
                  onChange={(event) => {
                    const nextStart = Math.min(
                      Number(event.target.value),
                      visibleEnd,
                    );
                    setVisibleStart(nextStart);
                  }}
                />
                <input
                  aria-label="Visible value end"
                  className="range-slider__input"
                  type="range"
                  min={availableStart}
                  max={availableEnd}
                  value={visibleEnd}
                  onChange={(event) => {
                    const nextEnd = Math.max(
                      Number(event.target.value),
                      visibleStart,
                    );
                    setVisibleEnd(nextEnd);
                  }}
                />
              </div>

              <div className="plot-range__footer">
                <span>{availableStart}</span>
                <span>
                  {visibleCount} / {availableCount} visible
                </span>
                <span>{availableEnd}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
