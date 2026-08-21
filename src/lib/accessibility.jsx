import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem("ingrevia_tts") === "true");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("ingrevia_contrast") === "true");
  const [largeFont, setLargeFont] = useState(() => localStorage.getItem("ingrevia_large") === "true");
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

  const speak = useCallback((text, lang) => {
    if (!text) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langMap = { en: "en-US", bm: "ms-MY", zh: "zh-CN", ta: "ta-IN" };
    utter.lang = langMap[lang] || "en-US";
    utter.rate = 0.95;
    utter.onstart = () => { speakingRef.current = true; };
    utter.onend = () => { speakingRef.current = false; };
    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
  }, []);

  const value = {
    ttsEnabled, setTtsEnabled,
    highContrast, setHighContrast,
    largeFont, setLargeFont,
    speak, stopSpeaking,
  };
  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}