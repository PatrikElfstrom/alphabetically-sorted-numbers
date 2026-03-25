import { useEffect, useRef, useState } from 'react'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'
import './App.css'

type NumberPoint = {
  alphabeticalRank: number
  name: string
  value: number
}

type RawNumberEntry = {
  name: string
  value: number
}

type GridCell = {
  alphabeticalRank: number
  value: number
}

type ChartData = {
  data: NumberPoint[]
  gridCells: GridCell[]
  xValues: number[]
  xTicks: number[]
  yValues: number[]
  yTicks: number[]
}

const units: Record<number, string> = {
  0: 'noll',
  1: 'ett',
  2: 'två',
  3: 'tre',
  4: 'fyra',
  5: 'fem',
  6: 'sex',
  7: 'sju',
  8: 'åtta',
  9: 'nio',
}

const teens: Record<number, string> = {
  10: 'tio',
  11: 'elva',
  12: 'tolv',
  13: 'tretton',
  14: 'fjorton',
  15: 'femton',
  16: 'sexton',
  17: 'sjutton',
  18: 'arton',
  19: 'nitton',
}

const tens: Record<number, string> = {
  20: 'tjugo',
  30: 'trettio',
  40: 'fyrtio',
  50: 'femtio',
  60: 'sextio',
  70: 'sjuttio',
  80: 'åttio',
  90: 'nittio',
}

const collator = new Intl.Collator('sv-SE')
const minChartValue = 100
const maxChartValue = 500

function toSwedishNumber(value: number): string {
  if (value < 0) {
    return `minus${toSwedishNumber(Math.abs(value))}`
  }

  if (value in units) {
    return units[value]
  }

  if (value in teens) {
    return teens[value]
  }

  if (value < 100) {
    const tenValue = Math.floor(value / 10) * 10
    const unitValue = value % 10

    if (unitValue === 0) {
      return tens[tenValue]
    }

    return `${tens[tenValue]}${units[unitValue]}`
  }

  if (value < 1000) {
    const hundredValue = Math.floor(value / 100)
    const remainder = value % 100
    const hundredWord = hundredValue === 1 ? 'hundra' : `${units[hundredValue]}hundra`

    if (remainder === 0) {
      return hundredWord
    }

    return `${hundredWord}${toSwedishNumber(remainder)}`
  }

  const thousandValue = Math.floor(value / 1000)
  const remainder = value % 1000
  const thousandWord =
    thousandValue === 1 ? 'ettusen' : `${toSwedishNumber(thousandValue)}tusen`

  if (remainder === 0) {
    return thousandWord
  }

  return `${thousandWord}${toSwedishNumber(remainder)}`
}

const cellSize = 9

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getTickStep(maxValue: number): number {
  const roughStep = Math.max(1, Math.ceil(maxValue / 10))
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))

  if (roughStep <= magnitude) {
    return magnitude
  }

  if (roughStep <= magnitude * 2) {
    return magnitude * 2
  }

  if (roughStep <= magnitude * 5) {
    return magnitude * 5
  }

  return magnitude * 10
}

function buildChartData(maxValue: number): ChartData {
  const xValues = d3.range(0, maxValue + 1)
  const yValues = d3.range(0, maxValue + 1)
  const rawData: RawNumberEntry[] = xValues.map(
    (value: number): RawNumberEntry => ({
      name: toSwedishNumber(value),
      value,
    }),
  )

  const data: NumberPoint[] = d3
    .sort(rawData, (a: RawNumberEntry, b: RawNumberEntry) =>
      collator.compare(a.name, b.name),
    )
    .map((entry: RawNumberEntry, index: number) => ({
      alphabeticalRank: index,
      name: entry.name,
      value: entry.value,
    }))

  const gridCells: GridCell[] = d3.cross(
    xValues,
    yValues,
    (value: number, alphabeticalRank: number): GridCell => ({
      alphabeticalRank,
      value,
    }),
  )

  const tickStep = getTickStep(maxValue)
  const xTicks = d3.range(0, maxValue + 1, tickStep)
  const yTicks = d3.range(0, maxValue + 1, tickStep)

  if (xTicks[xTicks.length - 1] !== maxValue) {
    xTicks.push(maxValue)
  }

  if (yTicks[yTicks.length - 1] !== maxValue) {
    yTicks.push(maxValue)
  }

  return { data, gridCells, xTicks, xValues, yTicks, yValues }
}

function App() {
  const plotRef = useRef<HTMLDivElement | null>(null)
  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(100)
  const [chartMax, setChartMax] = useState(minChartValue)

  const { data, gridCells, xTicks, xValues, yTicks, yValues } = buildChartData(chartMax)
  const frameWidth = cellSize * (chartMax + 1)
  const frameHeight = cellSize * (chartMax + 1)
  const visibleData = data.filter(
    (entry) => entry.value >= rangeStart && entry.value <= rangeEnd,
  )

  useEffect(() => {
    if (!plotRef.current) {
      return
    }

    const plot = Plot.plot({
      width: frameWidth + 114,
      height: frameHeight + 102,
      marginTop: 32,
      marginRight: 32,
      marginBottom: 68,
      marginLeft: 82,
      style: {
        background: 'transparent',
        color: '#1e2430',
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        overflow: 'visible',
      },
      x: {
        type: 'band',
        label: 'Vilket nummer',
        domain: xValues,
        padding: 0,
        tickSize: 0,
        ticks: xTicks,
      },
      y: {
        type: 'band',
        label: 'Alfabetisk position',
        domain: yValues,
        padding: 0,
        reverse: true,
        tickSize: 0,
        ticks: yTicks,
      },
      marks: [
        Plot.cell(gridCells, {
          x: 'value',
          y: 'alphabeticalRank',
          fill: '#eef2fb',
          inset: 0.9,
        }),
        Plot.frame({
          inset: 0,
          stroke: '#d4dbeb',
          strokeWidth: 1,
        }),
        Plot.cell(visibleData, {
          x: 'value',
          y: 'alphabeticalRank',
          fill: '#6c63ff',
          inset: 0.9,
          title: (entry: NumberPoint) => `${entry.name} (${entry.value})`,
        }),
      ],
    })

    plotRef.current.append(plot)

    return () => {
      plot.remove()
    }
  }, [gridCells, frameHeight, frameWidth, visibleData, xTicks, xValues, yTicks, yValues])

  const visibleCount = visibleData.length

  return (
    <main className="app-shell">
      <section className="controls-shell">
        <div className="control-row">
          <label className="number-group">
            <span>From</span>
            <input
              className="number-input"
              type="number"
              min="0"
              value={rangeStart}
              onChange={(event) => {
                const nextStart = clamp(Number(event.target.value || 0), 0, maxChartValue)
                setChartMax((currentMax) => Math.max(currentMax, nextStart, minChartValue))
                setRangeStart(nextStart)
                if (nextStart > rangeEnd) {
                  setRangeEnd(nextStart)
                }
              }}
            />
          </label>

          <div className="slider-group">
            <span>Visible range</span>
            <div className="range-slider" aria-label="Visible range">
              <div
                className="range-slider__track"
                style={{
                  left: `${(rangeStart / chartMax) * 100}%`,
                  right: `${100 - (rangeEnd / chartMax) * 100}%`,
                }}
              />
              <input
                className="range-slider__input"
                type="range"
                min="0"
                max={chartMax}
                value={rangeStart}
                onChange={(event) => {
                  const nextStart = Math.min(Number(event.target.value), rangeEnd)
                  setRangeStart(nextStart)
                }}
              />
              <input
                className="range-slider__input"
                type="range"
                min="0"
                max={chartMax}
                value={rangeEnd}
                onChange={(event) => {
                  const nextEnd = Math.max(Number(event.target.value), rangeStart)
                  setRangeEnd(nextEnd)
                }}
              />
            </div>
          </div>

          <label className="number-group">
            <span>To</span>
            <input
              className="number-input"
              type="number"
              min="0"
              value={rangeEnd}
              onChange={(event) => {
                const nextEnd = clamp(Number(event.target.value || 0), 0, maxChartValue)
                setChartMax((currentMax) => Math.max(currentMax, nextEnd, minChartValue))
                setRangeEnd(nextEnd)
                if (nextEnd < rangeStart) {
                  setRangeStart(nextEnd)
                }
              }}
            />
          </label>
        </div>

        <p className="control-note">
          {visibleCount} point{visibleCount === 1 ? '' : 's'} visible. Supported range: 0 to {maxChartValue}.
        </p>
      </section>

      <div className="plot-shell" ref={plotRef} />
    </main>
  )
}

export default App
