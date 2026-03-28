import type { LanguageId, NumberLanguage } from "./types";

type NumberLanguageHelpers = {
  getLanguageCollator: (languageId: LanguageId) => Intl.Collator;
  getNumberName: (value: number, languageId: LanguageId) => string;
  getSortableNumberName: (value: number, languageId: LanguageId) => string;
  numberLanguageById: Record<LanguageId, NumberLanguage>;
};

function normalizeSortName(name: string): string {
  return name.replace(/[\p{White_Space}\p{Punctuation}]/gu, "");
}

export function createNumberLanguageHelpers(
  numberLanguages: NumberLanguage[],
): NumberLanguageHelpers {
  const numberLanguageById = Object.fromEntries(
    numberLanguages.map((language) => [language.id, language]),
  ) as Record<LanguageId, NumberLanguage>;
  const collators = Object.fromEntries(
    numberLanguages.map((language) => [
      language.id,
      new Intl.Collator(language.locale, {
        ignorePunctuation: true,
        sensitivity: "base",
      }),
    ]),
  ) as Record<LanguageId, Intl.Collator>;
  const numberNameCaches = Object.fromEntries(
    numberLanguages.map((language) => [language.id, new Map<number, string>()]),
  ) as Record<LanguageId, Map<number, string>>;
  const getNumberName = (value: number, languageId: LanguageId): string => {
    const cache = numberNameCaches[languageId];
    const cachedName = cache.get(value);

    if (cachedName) {
      return cachedName;
    }

    const name = numberLanguageById[languageId].toWords(value);
    cache.set(value, name);
    return name;
  };

  return {
    numberLanguageById,
    getLanguageCollator(languageId) {
      return collators[languageId];
    },
    getNumberName,
    getSortableNumberName(value, languageId) {
      return normalizeSortName(getNumberName(value, languageId));
    },
  };
}
