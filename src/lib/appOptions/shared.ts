import type { AppOptions, NumberRange } from "../../app/types";
import {
  numberLanguageById,
  numberLanguages,
  resolveLanguageId,
  type LanguageId,
} from "../../numberLanguages";
import { clampNumber, getRangeCount } from "../rangeUtils";

export const minAvailableStart = 0;
export const maxAvailableValue = 5000;
export const defaultAvailableRange: NumberRange = {
  start: 0,
  end: 100,
};
export const userOptionsStorageKey = "alphabetical-numbers:user-options";
export const defaultLanguageId =
  resolveLanguageId("sv-SE") ?? numberLanguages[0].id;

function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && Object.hasOwn(numberLanguageById, value);
}

export function normalizeAvailableRange(range: NumberRange): NumberRange {
  const start = clampNumber(range.start, minAvailableStart, maxAvailableValue);
  const end = clampNumber(range.end, start, maxAvailableValue);

  return { start, end };
}

export function ensureSelectedLanguageIds(
  nextSelectedLanguageIds: LanguageId[],
  fallbackSelectedLanguageIds: LanguageId[],
): LanguageId[] {
  const selectedLanguageIds = Array.from(
    new Set(nextSelectedLanguageIds.filter(isLanguageId)),
  );

  if (selectedLanguageIds.length > 0) {
    return selectedLanguageIds;
  }

  if (fallbackSelectedLanguageIds.length > 0) {
    return fallbackSelectedLanguageIds;
  }

  return [defaultLanguageId];
}

export function getDefaultAppOptions(): AppOptions {
  const availableRange = { ...defaultAvailableRange };
  const availableCount = getRangeCount(availableRange);

  return {
    selectedLanguageIds: [defaultLanguageId],
    availableRange,
    visibleValueRange: { ...availableRange },
    visibleRankRange: {
      start: 1,
      end: availableCount,
    },
    pointDisplayMode: "auto",
    showEqualityLine: false,
  };
}

export const defaultAppOptions = getDefaultAppOptions();
