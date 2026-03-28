import { LOCALES } from "to-words";

const preferredRepresentativeLocaleIds = [
  "ar-SA",
  "de-DE",
  "en-US",
  "es-ES",
  "fr-FR",
  "ja-JP",
  "ko-KR",
  "nl-NL",
  "pt-BR",
  "ru-RU",
  "sv-SE",
  "sw-KE",
  "zh-CN",
  "zh-TW",
];

function stableSerialize(value: unknown): string {
  if (typeof value === "bigint") {
    return `${value}n`;
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );

    return `{${entries
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${stableSerialize(entryValue)}`,
      )
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function getLocaleSignature(localeId: string): string {
  const Locale = LOCALES[localeId];
  const localeConfig = new Locale().config;
  const {
    currency,
    ordinalExactWordsMapping,
    ordinalWordsMapping,
    ...spelloutConfig
  } = localeConfig;
  void currency;
  void ordinalExactWordsMapping;
  void ordinalWordsMapping;

  return stableSerialize(spelloutConfig);
}

function getRepresentativeLocaleId(groupedLocaleIds: string[]): string {
  const preferredLocaleScores = new Map(
    preferredRepresentativeLocaleIds.map((localeId, index) => [localeId, index]),
  );

  return [...groupedLocaleIds].sort((left, right) => {
    const leftScore = preferredLocaleScores.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightScore = preferredLocaleScores.get(right) ?? Number.MAX_SAFE_INTEGER;

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    return left.localeCompare(right);
  })[0];
}

const localeIds = Object.keys(LOCALES);
const localeIdsBySignature = localeIds.reduce<Map<string, string[]>>(
  (groups, localeId) => {
    const signature = getLocaleSignature(localeId);
    const matchingLocales = groups.get(signature);

    if (matchingLocales) {
      matchingLocales.push(localeId);
      return groups;
    }

    groups.set(signature, [localeId]);
    return groups;
  },
  new Map<string, string[]>(),
);

export const canonicalLanguageIdByLocaleId = Array.from(
  localeIdsBySignature.values(),
).reduce<Record<string, string>>((canonicalByLocaleId, groupedLocaleIds) => {
  const representativeLocaleId = getRepresentativeLocaleId(groupedLocaleIds);

  for (const localeId of groupedLocaleIds) {
    canonicalByLocaleId[localeId] = representativeLocaleId;
  }

  return canonicalByLocaleId;
}, {});

export const representativeLocaleIds = Array.from(
  new Set(Object.values(canonicalLanguageIdByLocaleId)),
);
