export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "bm", label: "Bahasa Malaysia" },
  { code: "zh", label: "中文" },
  { code: "ta", label: "தமிழ்" },
];

export const translations = {
  en: {},
  bm: {},
  zh: {},
  ta: {},
};

export function t(lang, key) {
  return translations[lang]?.[key] || translations.en[key] || key;
}
