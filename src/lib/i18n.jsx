import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, LANGUAGES, t as translate } from "./translations";

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("ingrevia_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("ingrevia_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLanguage = useCallback((code) => setLang(code), []);
  const t = useCallback((key) => translate(lang, key), [lang]);

  const value = { lang, setLanguage, t, languages: LANGUAGES, translations: translations[lang] };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// Helper to pick a localized field from an entity
export function localized(entity, field, lang) {
  if (!entity) return "";
  const suffix = { en: "", bm: "_bm", zh: "_zh", ta: "_ta" }[lang] || "";
  const localizedValue = entity[`${field}${suffix}`];
  const fallbackValue = entity[field];

  if (Array.isArray(localizedValue)) {
    return localizedValue.length > 0 ? localizedValue : fallbackValue || [];
  }

  if (typeof localizedValue === "string") {
    const trimmed = localizedValue.trim();
    return trimmed ? localizedValue : fallbackValue || "";
  }

  return localizedValue ?? fallbackValue ?? "";
}
