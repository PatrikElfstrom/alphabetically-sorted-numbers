import { toWords as convertToWords } from "to-words";
import { createLanguageLabelLookup } from "./lib/numberLanguages/localeLabels";
import {
  canonicalLanguageIdByLocaleId,
  representativeLocaleIds,
} from "./lib/numberLanguages/localeGrouping";
import { createNumberLanguageHelpers } from "./lib/numberLanguages/numberNames";
import type { LanguageId, NumberLanguage } from "./lib/numberLanguages/types";

const labelCollator = new Intl.Collator("en", { sensitivity: "base" });
const languageLabelsByLocaleId = createLanguageLabelLookup(representativeLocaleIds);

function createLocalizedConverter(localeId: LanguageId): (value: number) => string {
  return (value: number) =>
    convertToWords(value, { localeCode: localeId }).toLocaleLowerCase(localeId);
}

export const numberLanguages: NumberLanguage[] = representativeLocaleIds
  .map(
    (localeId): NumberLanguage => ({
      id: localeId,
      label: languageLabelsByLocaleId[localeId],
      locale: localeId,
      toWords: createLocalizedConverter(localeId),
    }),
  )
  .sort((left, right) => {
    const labelComparison = labelCollator.compare(left.label, right.label);
    return labelComparison !== 0
      ? labelComparison
      : labelCollator.compare(left.locale, right.locale);
  });

export function resolveLanguageId(localeId: string): LanguageId | null {
  return canonicalLanguageIdByLocaleId[localeId] ?? null;
}

export const {
  numberLanguageById,
  getLanguageCollator,
  getNumberName,
  getSortableNumberName,
} = createNumberLanguageHelpers(numberLanguages);

export type { LanguageId, NumberLanguage };
