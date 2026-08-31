import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAccessibility } from "@/lib/accessibility";
import { Volume2, Square } from "lucide-react";

export default function SpeakButton({ text, className = "" }) {
  const { lang } = useI18n();
  const { setTtsEnabled, ttsSupported, speak, stopSpeaking } = useAccessibility();
  const [speaking, setSpeaking] = useState(false);

  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) return null;

  const handle = () => {
    if (!ttsSupported) {
      alert("Text to speech is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setTtsEnabled(true);
      const started = speak(cleanText, lang);
      if (!started) return;
      setSpeaking(true);
      const check = setInterval(() => {
        if (!window.speechSynthesis?.speaking) {
          setSpeaking(false);
          clearInterval(check);
        }
      }, 300);
    }
  };

  return (
    <button onClick={handle}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(85,54%,51%,0.15)] text-[hsl(128,52%,35%)] hover:bg-[hsl(85,54%,51%,0.25)] transition-colors ${className}`}>
      {speaking ? <><Square className="w-3.5 h-3.5" /> Stop</> : <><Volume2 className="w-3.5 h-3.5" /> Listen</>}
    </button>
  );
}
