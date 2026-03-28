import * as d3 from "d3";
import type { NumberRange } from "../../app/types";
import {
  getLanguageCollator,
  getNumberName,
  getSortableNumberName,
  numberLanguageById,
  type LanguageId,
} from "../../numberLanguages";
import { getRangeCount } from "../rangeUtils";
import type {
  ChartData,
  LanguageChartData,
  LanguageSeries,
  NumberPoint,
  VisibleLanguageSeries,
} from "./types";

type RawNumberEntry = {
  name: string;
  sortName: string;
  value: number;
};

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

function getLanguageColor(index: number): string {
  return languageColorPalette[index % languageColorPalette.length];
}

export function buildChartData(availableRange: NumberRange): ChartData {
  const xValues = d3.range(availableRange.start, availableRange.end + 1);
  const count = getRangeCount(availableRange);
  const yValues = d3.range(1, count + 1);
  const tickStep = getTickStep(Math.max(1, availableRange.end - availableRange.start));
  const xTicks = d3.range(availableRange.start, availableRange.end + 1, tickStep);
  const yTicks = d3.range(1, count + 1, tickStep);

  if (xTicks[xTicks.length - 1] !== availableRange.end) {
    xTicks.push(availableRange.end);
  }

  if (yTicks.length === 0 || yTicks[yTicks.length - 1] !== count) {
    yTicks.push(count);
  }

  return {
    equalityPoints: xValues.map((value) => ({
      alphabeticalRank: value - availableRange.start + 1,
      value,
    })),
    xValues,
    xTicks,
    yValues,
    yTicks,
  };
}

export function buildLanguageChartData(
  availableRange: NumberRange,
  languageId: LanguageId,
): LanguageChartData {
  const values = d3.range(availableRange.start, availableRange.end + 1);
  const language = numberLanguageById[languageId];
  const collator = getLanguageCollator(languageId);
  const rawData: RawNumberEntry[] = values.map((value) => ({
    name: getNumberName(value, languageId),
    sortName: getSortableNumberName(value, languageId),
    value,
  }));
  const data = d3
    .sort(rawData, (left, right) => collator.compare(left.sortName, right.sortName))
    .map(
      (entry, index): NumberPoint => ({
        alphabeticalRank: index + 1,
        languageId,
        languageLabel: language.label,
        name: entry.name,
        value: entry.value,
      }),
    );
  const pointsByValue = new Map<number, NumberPoint>();

  for (const point of data) {
    pointsByValue.set(point.value, point);
  }

  return {
    pointsByValue,
  };
}

export function buildLanguageSeries(
  availableRange: NumberRange,
  selectedLanguageIds: LanguageId[],
): LanguageSeries[] {
  return selectedLanguageIds.map((languageId, index) => ({
    chartData: buildLanguageChartData(availableRange, languageId),
    color: getLanguageColor(index),
    languageId,
    languageLabel: numberLanguageById[languageId].label,
  }));
}

export function selectVisibleLanguageSeries(
  languageSeries: LanguageSeries[],
  visibleValueRange: NumberRange,
  visibleRankRange: NumberRange,
): VisibleLanguageSeries[] {
  return languageSeries.map((series) => {
    const visiblePoints: NumberPoint[] = [];

    for (let value = visibleValueRange.start; value <= visibleValueRange.end; value += 1) {
      const point = series.chartData.pointsByValue.get(value);

      if (
        point &&
        point.alphabeticalRank >= visibleRankRange.start &&
        point.alphabeticalRank <= visibleRankRange.end
      ) {
        visiblePoints.push(point);
      }
    }

    return {
      ...series,
      visiblePoints,
    };
  });
}

export function getSelectedLanguageSummary(
  languageSeries: LanguageSeries[],
): string {
  return languageListFormatter.format(
    languageSeries.map((series) => series.languageLabel.toLowerCase()),
  );
}

export function getSelectedLanguageColorById(
  languageSeries: LanguageSeries[],
): Map<LanguageId, string> {
  return new Map(
    languageSeries.map((series) => [series.languageId, series.color] as const),
  );
}
