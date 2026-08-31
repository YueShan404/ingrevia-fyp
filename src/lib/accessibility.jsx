import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem("ingrevia_tts") === "true");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("ingrevia_contrast") === "true");
  const [largeFont, setLargeFont] = useState(() => localStorage.getItem("ingrevia_large") === "true");
  const [voices, setVoices] = useState([]);
  const speakingRef = useRef(false);

  useEffect(() => { localStorage.setItem("ingrevia_tts", ttsEnabled); }, [ttsEnabled]);
  useEffect(() => {
    localStorage.setItem("ingrevia_contrast", highContrast);
    document.documentElement.classList.toggle("contrast-mode", highContrast);
  }, [highContrast]);
  useEffect(() => {
    localStorage.setItem("ingrevia_large", largeFont);
    document.documentElement.classList.toggle("large-font", largeFont);
  }, [largeFont]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  const speak = useCallback((text, lang) => {
    const cleanText = String(text || "").replace(/\s+/g, " ").trim();
    if (!cleanText) return Promise.resolve(false);
    if (!("speechSynthesis" in window)) return Promise.resolve(false);

    window.speechSynthesis.cancel();

    const waitForVoices = () =>
      new Promise((resolve) => {
        const existing = window.speechSynthesis.getVoices();
        if (existing.length) {
          resolve(existing);
          return;
        }

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          window.speechSynthesis.removeEventListener?.("voiceschanged", finish);
          resolve(window.speechSynthesis.getVoices());
        };

        window.speechSynthesis.addEventListener?.("voiceschanged", finish, { once: true });
        setTimeout(finish, 900);
      });

    return waitForVoices().then((loadedVoices) => {
      const langMap = { en: "en-US", bm: "ms-MY", zh: "zh-CN", ta: "ta-IN" };
      const speechLang = langMap[lang] || "en-US";
      const availableVoices = loadedVoices.length ? loadedVoices : voices;
      const matchingVoice =
        availableVoices.find((voice) => voice.lang === speechLang) ||
        availableVoices.find((voice) => voice.lang?.toLowerCase().startsWith(speechLang.slice(0, 2).toLowerCase())) ||
        availableVoices.find((voice) => voice.default);

      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = matchingVoice?.lang || speechLang;
      if (matchingVoice) utter.voice = matchingVoice;
      utter.rate = 0.92;
      utter.pitch = 1;

      return new Promise((resolve, reject) => {
        utter.onstart = () => {
          speakingRef.current = true;
          resolve(true);
        };
        utter.onend = () => {
          speakingRef.current = false;
        };
        utter.onerror = (event) => {
          speakingRef.current = false;
          reject(new Error(event?.error || "Speech failed."));
        };

        window.speechSynthesis.speak(utter);
        setTimeout(() => {
          if (!window.speechSynthesis.speaking && !speakingRef.current) {
            resolve(false);
          }
        }, 1200);
      });
    });
  }, [voices]);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
  }, []);

  const value = {
    ttsEnabled, setTtsEnabled,
    highContrast, setHighContrast,
    largeFont, setLargeFont,
    ttsSupported: typeof window !== "undefined" && "speechSynthesis" in window,
    speak, stopSpeaking,
  };
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
