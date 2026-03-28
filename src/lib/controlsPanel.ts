import type { NumberRange } from "../app/types";
import {
  clampNumber,
  maxAvailableValue,
  minAvailableStart,
} from "./appOptions";
import { numberLanguages, type LanguageId } from "../numberLanguages";

type LanguageOption = {
  color?: string;
  label: string;
  value: LanguageId;
};

export function getLanguageOptions(
  selectedLanguageColorById: Map<LanguageId, string>,
): LanguageOption[] {
  return numberLanguages.map((language) => ({
    color: selectedLanguageColorById.get(language.id),
    label: language.label,
    value: language.id,
  }));
}

export function getAvailableRangeFromStartInput(
  inputValue: string,
  currentEnd: number,
): NumberRange {
  const start = clampNumber(
    Number(inputValue || 0),
    minAvailableStart,
    maxAvailableValue,
  );

  return {
    start,
    end: Math.max(start, currentEnd),
  };
}

export function getAvailableRangeFromEndInput(
  inputValue: string,
  currentStart: number,
): NumberRange {
  const end = clampNumber(
    Number(inputValue || 0),
    minAvailableStart,
    maxAvailableValue,
  );

  return {
    start: Math.min(currentStart, end),
    end,
  };
}

export function getLanguageRemovalState(
  selectedLanguageCount: number,
  languageLabel: string,
): {
  ariaLabel: string;
  canRemove: boolean;
  removeText: string;
} {
  const canRemove = selectedLanguageCount > 1;

  return {
    ariaLabel: canRemove
      ? `Remove ${languageLabel}`
      : `${languageLabel} is required`,
    canRemove,
    removeText: canRemove ? "x" : "",
  };
}

export function removeSelectedLanguage(
  selectedLanguageIds: LanguageId[],
  languageIdToRemove: LanguageId,
): LanguageId[] {
  return selectedLanguageIds.filter(
    (languageId) => languageId !== languageIdToRemove,
  );
}
