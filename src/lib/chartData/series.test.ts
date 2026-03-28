import { describe, expect, it } from "vitest";
import { resolveLanguageId } from "../../numberLanguages";
import {
  buildChartData,
  buildLanguageSeries,
  selectVisibleLanguageSeries,
} from "./series";

describe("buildChartData", () => {
  it("keeps the final tick and equality point for a single-value range", () => {
    expect(
      buildChartData({
        start: 5,
        end: 5,
      }),
    ).toEqual({
      equalityPoints: [
        {
          alphabeticalRank: 1,
          value: 5,
        },
      ],
      xValues: [5],
      xTicks: [5],
      yValues: [1],
      yTicks: [1],
    });
  });

  it("includes the final boundary in both axes for larger ranges", () => {
    const chartData = buildChartData({
      start: 0,
      end: 100,
    });

    expect(chartData.xTicks.at(-1)).toBe(100);
    expect(chartData.yTicks.at(-1)).toBe(101);
    expect(chartData.equalityPoints).toHaveLength(101);
  });
});

describe("selectVisibleLanguageSeries", () => {
  it("filters visible points by both value and alphabetical rank", () => {
    const languageId = resolveLanguageId("en-US");
    const languageSeries = buildLanguageSeries(
      {
        start: 0,
        end: 20,
      },
      [languageId ?? "en-US"],
    );
    const visibleLanguageSeries = selectVisibleLanguageSeries(
      languageSeries,
      {
        start: 0,
        end: 10,
      },
      {
        start: 1,
        end: 5,
      },
    );

    expect(visibleLanguageSeries).toHaveLength(1);
    expect(visibleLanguageSeries[0].visiblePoints.length).toBeGreaterThan(0);
    expect(
      visibleLanguageSeries[0].visiblePoints.every(
        (point) =>
          point.value >= 0 &&
          point.value <= 10 &&
          point.alphabeticalRank >= 1 &&
          point.alphabeticalRank <= 5,
      ),
    ).toBe(true);
  });
});
