import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAccessibility } from "@/lib/accessibility";
import { Volume2, Square } from "lucide-react";

export default function SpeakButton({ text, className = "" }) {
  const { lang } = useI18n();
  const { ttsEnabled, speak, stopSpeaking } = useAccessibility();
  const [speaking, setSpeaking] = useState(false);

  if (!ttsEnabled) return null;

  const handle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      speak(text, lang);
      setSpeaking(true);
      // poll for end
      const check = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setSpeaking(false);
          clearInterval(check);
        }
      }, 300);
    }
  };

  return (
    <button onClick={handle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(85,54%,51%,0.15)] text-[hsl(128,52%,35%)] hover:bg-[hsl(85,54%,51%,0.25)] transition-colors ${className}`}>
      {speaking ? <><Square className="w-3.5 h-3.5" /> Stop</> : <><Volume2 className="w-3.5 h-3.5" /> Listen</>}
    </button>
  );
}