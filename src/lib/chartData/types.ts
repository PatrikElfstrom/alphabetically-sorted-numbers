import type { LanguageId } from "../../numberLanguages";

export type NumberPoint = {
  alphabeticalRank: number;
  languageId: LanguageId;
  languageLabel: string;
  name: string;
  value: number;
};

export type EqualityPoint = {
  alphabeticalRank: number;
  value: number;
};

export type ChartData = {
  equalityPoints: EqualityPoint[];
  xValues: number[];
  xTicks: number[];
  yValues: number[];
  yTicks: number[];
};

export type LanguageChartData = {
  pointsByValue: Map<number, NumberPoint>;
};

export type LanguageSeries = {
  chartData: LanguageChartData;
  color: string;
  languageId: LanguageId;
  languageLabel: string;
};

export type VisibleLanguageSeries = LanguageSeries & {
  visiblePoints: NumberPoint[];
};

export type PlotLayout = {
  axisPad: number;
  marginPad: number;
  plotAreaSize: number;
};

export type TrackOffsets = {
  startOffset: number;
  endOffset: number;
};

export type BandGridLayout = {
  bandwidth: number;
  boundaries: number[];
};

export type PointRendering = {
  radius: number;
  useCompactSquares: boolean;
};
