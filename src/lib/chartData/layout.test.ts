import { describe, expect, it } from "vitest";
import {
  buildPlotGridPath,
  getBandGridLayout,
  getGuideFormulaLabel,
  getPointRendering,
} from "./index";

describe("getBandGridLayout", () => {
  it("returns empty layout when no cells can be rendered", () => {
    expect(getBandGridLayout(0, 240)).toEqual({
      bandwidth: 0,
      boundaries: [],
    });
  });
});

describe("buildPlotGridPath", () => {
  it("creates horizontal and vertical line commands for every boundary", () => {
    expect(buildPlotGridPath([0, 10], 10)).toBe("M0 0V10M0 0H10M10 0V10M0 10H10");
  });
});

describe("getPointRendering", () => {
  it("switches to compact squares automatically for very small cells", () => {
    expect(getPointRendering(400, 5, "auto").useCompactSquares).toBe(true);
  });
});

describe("getGuideFormulaLabel", () => {
  it("adjusts the guide formula to the available range start", () => {
    expect(getGuideFormulaLabel(0)).toBe("Guide y=x+1");
    expect(getGuideFormulaLabel(1)).toBe("Guide y=x");
    expect(getGuideFormulaLabel(4)).toBe("Guide y=x-3");
  });
});
