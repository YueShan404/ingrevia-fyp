import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAccessibility } from "@/lib/accessibility";
import { useToast } from "@/components/ui/use-toast";
import { Volume2, Square } from "lucide-react";

export default function SpeakButton({ text, className = "" }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { setTtsEnabled, ttsSupported, speak, stopSpeaking } = useAccessibility();
  const [speaking, setSpeaking] = useState(false);
  const [starting, setStarting] = useState(false);

  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) return null;

  const handle = async () => {
    if (!ttsSupported) {
      toast({
        title: t("tts.unsupported"),
        description: t("tts.unsupported_body"),
        variant: "destructive",
      });
      return;
    }

    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setTtsEnabled(true);
      setStarting(true);
      try {
        const started = await speak(cleanText, lang);
        if (!started) {
          toast({
            title: t("tts.failed"),
            description: t("tts.failed_body"),
            variant: "destructive",
          });
          return;
        }
        setSpeaking(true);
        const check = setInterval(() => {
          if (!window.speechSynthesis?.speaking) {
            setSpeaking(false);
            clearInterval(check);
          }
        }, 300);
      } catch (error) {
        toast({
          title: t("tts.failed"),
          description: error?.message || t("tts.failed_body"),
          variant: "destructive",
        });
      } finally {
        setStarting(false);
      }
    }
  };

  return (
    <button onClick={handle}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[hsl(85,54%,51%,0.15)] text-[hsl(128,52%,35%)] hover:bg-[hsl(85,54%,51%,0.25)] transition-colors ${className}`}>
      {speaking ? <><Square className="w-3.5 h-3.5" /> {t("tts.stop")}</> : <><Volume2 className="w-3.5 h-3.5" /> {starting ? t("tts.starting") : t("tts.listen")}</>}
    </button>
  );
}
