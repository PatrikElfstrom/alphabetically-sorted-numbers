import type { NumberPoint } from "./types";

export function getGuideFormulaLabel(availableStart: number): string {
  if (availableStart === 0) {
    return "Guide y=x+1";
  }

  if (availableStart === 1) {
    return "Guide y=x";
  }

  return `Guide y=x-${availableStart - 1}`;
}

export function getPointTitle(entry: NumberPoint): string {
  return `${entry.languageLabel}: ${entry.name}\nValue: ${entry.value}\nPosition: ${entry.alphabeticalRank}`;
}
