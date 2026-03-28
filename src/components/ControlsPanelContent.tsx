import { type CSSProperties, useMemo } from "react";
import type { AppOptions, NumberRange, PointDisplayMode } from "../app/types";
import { maxAvailableValue, minAvailableStart } from "../lib/appOptions";
import type { LanguageSeries } from "../lib/chartData";
import {
  getAvailableRangeFromEndInput,
  getAvailableRangeFromStartInput,
  getLanguageOptions,
  getLanguageRemovalLabel,
  getLanguageVisibilityLabel,
  removeSelectedLanguage,
} from "../lib/controlsPanel";
import { type LanguageId } from "../numberLanguages";
import { MultiSelectCombobox } from "./ui/MultiSelectCombobox";

type ControlsPanelContentProps = {
  controlsBodyId: string;
  floatingRef: (node: HTMLElement | null) => void;
  floatingStyle: CSSProperties;
  languageSeries: LanguageSeries[];
  options: AppOptions;
  panelAlignment: "left" | "right";
  selectedLanguageColorById: Map<LanguageId, string>;
  setPointDisplayMode: (pointDisplayMode: PointDisplayMode) => void;
  setSelectedLanguageIds: (selectedLanguageIds: LanguageId[]) => void;
  toggleHiddenLanguageId: (languageId: LanguageId) => void;
  updateAvailableRange: (availableRange: NumberRange) => void;
};

export function ControlsPanelContent({
  controlsBodyId,
  floatingRef,
  floatingStyle,
  languageSeries,
  options,
  panelAlignment,
  selectedLanguageColorById,
  setPointDisplayMode,
  setSelectedLanguageIds,
  toggleHiddenLanguageId,
  updateAvailableRange,
}: ControlsPanelContentProps) {
  const languageOptions = useMemo(
    () => getLanguageOptions(selectedLanguageColorById),
    [selectedLanguageColorById],
  );
  const hiddenLanguageIdSet = useMemo(
    () => new Set(options.hiddenLanguageIds),
    [options.hiddenLanguageIds],
  );
  const hiddenLanguageCount = options.hiddenLanguageIds.length;
  const selectedLanguageCount = languageSeries.length;
  const summary = `${selectedLanguageCount} language${selectedLanguageCount === 1 ? "" : "s"} selected`;
  const rangeSummary = `${options.availableRange.start} to ${options.availableRange.end}`;

  return (
    <section
      className={
        panelAlignment === "right"
          ? "controls-shell controls-shell--floating controls-shell--align-right"
          : "controls-shell controls-shell--floating controls-shell--align-left"
      }
      id={controlsBodyId}
      ref={floatingRef}
      style={floatingStyle}
    >
      <div className="controls-shell__header">
        <div className="controls-shell__copy">
          <span className="controls-shell__eyebrow">Controls</span>
          <div className="controls-shell__summary">
            <span>{summary}</span>
            <span>{rangeSummary}</span>
            {hiddenLanguageCount > 0 ? <span>{hiddenLanguageCount} hidden</span> : null}
          </div>
        </div>
      </div>

      <div className="controls-shell__body">
        <div className="control-toolbar">
          <div className="number-group number-group--language">
            <span>Language</span>
            <MultiSelectCombobox
              emptyText="No languages match your search."
              onValueChange={(nextValues) => {
                setSelectedLanguageIds(nextValues as LanguageId[]);
              }}
              options={languageOptions}
              placeholder="Choose one or more languages"
              searchPlaceholder="Search languages..."
              selectAllLabel="Select all languages"
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
            const isHidden = hiddenLanguageIdSet.has(series.languageId);

            return (
              <div
                className={
                  isHidden
                    ? "language-legend__item language-legend__item--hidden"
                    : "language-legend__item"
                }
                key={series.languageId}
                style={{ "--language-color": series.color } as CSSProperties}
              >
                <button
                  aria-label={getLanguageVisibilityLabel(
                    isHidden,
                    series.languageLabel,
                  )}
                  aria-pressed={!isHidden}
                  className="language-legend__toggle"
                  onClick={() => {
                    toggleHiddenLanguageId(series.languageId);
                  }}
                  type="button"
                >
                  <span aria-hidden="true" className="language-legend__swatch" />
                  <span className="language-legend__label">
                    {series.languageLabel}
                  </span>
                </button>
                <button
                  aria-label={getLanguageRemovalLabel(series.languageLabel)}
                  className="language-legend__remove"
                  onClick={() => {
                    setSelectedLanguageIds(
                      removeSelectedLanguage(
                        options.selectedLanguageIds,
                        series.languageId,
                      ),
                    );
                  }}
                  type="button"
                >
                  x
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
