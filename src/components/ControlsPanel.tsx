import { type CSSProperties, type RefObject, useMemo } from "react";
import type { AppOptions, NumberRange, PointDisplayMode } from "../app/types";
import type { LanguageSeries } from "../lib/chartData";
import {
  getAvailableRangeFromEndInput,
  getAvailableRangeFromStartInput,
  getLanguageOptions,
  getLanguageRemovalState,
  removeSelectedLanguage,
} from "../lib/controlsPanel";
import { maxAvailableValue, minAvailableStart } from "../lib/appOptions";
import { type LanguageId } from "../numberLanguages";
import "./ControlsPanel.css";
import { MultiSelectCombobox } from "./ui/MultiSelectCombobox";

type ControlsPanelProps = {
  controlsRef: RefObject<HTMLElement | null>;
  languageSeries: LanguageSeries[];
  options: AppOptions;
  selectedLanguageColorById: Map<LanguageId, string>;
  selectedLanguageSummary: string;
  setPointDisplayMode: (pointDisplayMode: PointDisplayMode) => void;
  setSelectedLanguageIds: (selectedLanguageIds: LanguageId[]) => void;
  updateAvailableRange: (availableRange: NumberRange) => void;
};

export function ControlsPanel({
  controlsRef,
  languageSeries,
  options,
  selectedLanguageColorById,
  selectedLanguageSummary,
  setPointDisplayMode,
  setSelectedLanguageIds,
  updateAvailableRange,
}: ControlsPanelProps) {
  const languageOptions = useMemo(
    () => getLanguageOptions(selectedLanguageColorById),
    [selectedLanguageColorById],
  );

  return (
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
            options={languageOptions}
            placeholder="Choose one or more languages"
            searchPlaceholder="Search languages..."
            value={options.selectedLanguageIds}
          />
        </div>

        <label className="number-group number-group--display">
          <span>Display</span>
          <select
            className="number-input select-input"
            onChange={(event) => {
              setPointDisplayMode(event.target.value as PointDisplayMode);
            }}
            value={options.pointDisplayMode}
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
            max={maxAvailableValue}
            min={minAvailableStart}
            onChange={(event) => {
              updateAvailableRange(
                getAvailableRangeFromStartInput(
                  event.target.value,
                  options.availableRange.end,
                ),
              );
            }}
            type="number"
            value={options.availableRange.start}
          />
        </label>

        <label className="number-group number-group--to">
          <span>To</span>
          <input
            className="number-input"
            max={maxAvailableValue}
            min={minAvailableStart}
            onChange={(event) => {
              updateAvailableRange(
                getAvailableRangeFromEndInput(
                  event.target.value,
                  options.availableRange.start,
                ),
              );
            }}
            type="number"
            value={options.availableRange.end}
          />
        </label>
      </div>

      <div className="language-legend" aria-label="Selected language overlays">
        {languageSeries.map((series) => {
          const removalState = getLanguageRemovalState(
            options.selectedLanguageIds.length,
            series.languageLabel,
          );

          return (
            <button
              aria-label={removalState.ariaLabel}
              className="language-legend__item"
              disabled={!removalState.canRemove}
              key={series.languageId}
              onClick={() => {
                if (!removalState.canRemove) {
                  return;
                }

                setSelectedLanguageIds(
                  removeSelectedLanguage(
                    options.selectedLanguageIds,
                    series.languageId,
                  ),
                );
              }}
              style={{ "--language-color": series.color } as CSSProperties}
              type="button"
            >
              <span aria-hidden="true" className="language-legend__swatch" />
              {series.languageLabel}
              <span className="language-legend__remove" aria-hidden="true">
                {removalState.removeText}
              </span>
            </button>
          );
        })}
      </div>

      <p className="control-note">
        Alphabetical positions are recalculated for {selectedLanguageSummary} and
        overlaid on the same grid.
      </p>
    </section>
  );
}
