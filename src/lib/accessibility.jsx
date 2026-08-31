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
    if (!cleanText) return false;
    if (!("speechSynthesis" in window)) return false;

    window.speechSynthesis.cancel();
    const langMap = { en: "en-US", bm: "ms-MY", zh: "zh-CN", ta: "ta-IN" };
    const speechLang = langMap[lang] || "en-US";
    const availableVoices = voices.length ? voices : window.speechSynthesis.getVoices();
    const matchingVoice =
      availableVoices.find((voice) => voice.lang === speechLang) ||
      availableVoices.find((voice) => voice.lang?.toLowerCase().startsWith(speechLang.slice(0, 2).toLowerCase()));

    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = matchingVoice?.lang || speechLang;
    if (matchingVoice) utter.voice = matchingVoice;
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.onstart = () => { speakingRef.current = true; };
    utter.onend = () => { speakingRef.current = false; };
    utter.onerror = () => { speakingRef.current = false; };
    window.speechSynthesis.speak(utter);
    return true;
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
