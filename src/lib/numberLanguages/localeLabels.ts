const languageDisplayNames = new Intl.DisplayNames(["en"], { type: "language" });
const regionDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
const languageNameOverrides: Record<string, string> = {
  ee: "Estonian",
  hbo: "Biblical Hebrew",
  np: "Nepali",
};

function getLocaleParts(localeId: string): {
  languageCode: string;
  regionCode: string | null;
} {
  const [languageCode, regionCode] = localeId.split("-");

  return {
    languageCode,
    regionCode: regionCode ?? null,
  };
}

function getDisplayName(
  displayNames: Intl.DisplayNames,
  code: string,
  fallback: string,
): string {
  const label = displayNames.of(code);
  return !label || label === code ? fallback : label;
}

export function createLanguageLabelLookup(
  representativeLocaleIds: string[],
): Record<string, string> {
  const representativeLanguageCounts = representativeLocaleIds.reduce<Map<string, number>>(
    (counts, localeId) => {
      const { languageCode } = getLocaleParts(localeId);
      counts.set(languageCode, (counts.get(languageCode) ?? 0) + 1);
      return counts;
    },
    new Map<string, number>(),
  );

  return representativeLocaleIds.reduce<Record<string, string>>(
    (labelsByLocaleId, localeId) => {
      const { languageCode, regionCode } = getLocaleParts(localeId);
      const fallbackLanguageLabel =
        languageNameOverrides[languageCode] ?? languageCode;
      const languageLabel = getDisplayName(
        languageDisplayNames,
        languageCode,
        fallbackLanguageLabel,
      );
      const regionLabel = regionCode
        ? getDisplayName(regionDisplayNames, regionCode, regionCode)
        : null;
      const shouldIncludeRegion =
        Boolean(regionLabel) &&
        (representativeLanguageCounts.get(languageCode) ?? 0) > 1;

      labelsByLocaleId[localeId] = shouldIncludeRegion
        ? `${languageLabel} (${regionLabel})`
        : languageLabel;
      return labelsByLocaleId;
    },
    {},
  );
}
