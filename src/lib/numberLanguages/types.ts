export type LanguageId = string;

export type NumberLanguage = {
  id: LanguageId;
  label: string;
  locale: string;
  toWords: (value: number) => string;
};
