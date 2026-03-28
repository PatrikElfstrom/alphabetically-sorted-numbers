import { useEffect, useRef, useState } from "react";

const minimumPlotSize = 280;
const maximumPlotSize = 1480;

function getResponsivePlotSize(
  plotRangeHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  const outerPadding = viewportWidth <= 720 ? 18 : 28;
  const plotShellChrome = viewportWidth <= 720 ? 26 : 34;
  const yRangeWidth = viewportWidth <= 720 ? 66 : 82;
  const plotMatrixGap = viewportWidth <= 720 ? 8 : 12;
  const availableWidth =
    viewportWidth - outerPadding * 2 - yRangeWidth - plotMatrixGap;
  const availableHeight =
    viewportHeight -
    plotRangeHeight -
    plotShellChrome -
    outerPadding * 2;

  return Math.max(
    minimumPlotSize,
    Math.floor(Math.min(availableWidth, availableHeight, maximumPlotSize)),
  );
}

export function usePlotSize() {
  const plotRangeRef = useRef<HTMLDivElement | null>(null);
  const [plotSize, setPlotSize] = useState(720);

  useEffect(() => {
    const updatePlotSize = () => {
      const plotRangeHeight =
        plotRangeRef.current?.getBoundingClientRect().height ?? 0;
      const nextPlotSize = getResponsivePlotSize(
        plotRangeHeight,
        window.innerWidth,
        window.innerHeight,
      );

      if (nextPlotSize > 0) {
        setPlotSize((currentPlotSize) =>
          currentPlotSize === nextPlotSize ? currentPlotSize : nextPlotSize,
        );
      }
    };

    updatePlotSize();

    const observer = new ResizeObserver(() => {
      updatePlotSize();
    });

    if (plotRangeRef.current) {
      observer.observe(plotRangeRef.current);
    }

    window.addEventListener("resize", updatePlotSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePlotSize);
    };
  }, []);

  return {
    plotRangeRef,
    plotSize,
  };
}
