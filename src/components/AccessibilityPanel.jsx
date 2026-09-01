import React from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import { useAccessibility } from "@/lib/accessibility";
import { Accessibility, Volume2, Contrast, Type, X } from "lucide-react";

export default function AccessibilityPanel({ open, setOpen }) {
  const { t, lang } = useI18n();
  const { ttsEnabled, setTtsEnabled, highContrast, setHighContrast, largeFont, setLargeFont, ttsSupported, speak, stopSpeaking } = useAccessibility();

  const readPage = async () => {
    const pageText = document.querySelector("main")?.innerText || document.body.innerText;
    const cleanText = pageText.replace(/\s+/g, " ").trim();
    if (!cleanText || !ttsSupported) return;
    setTtsEnabled(true);
    await speak(cleanText, lang);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/70 transition-colors"
        aria-label={t("accessibility.title")}>
        <Accessibility className="w-4 h-4 text-[hsl(128,52%,47%)]" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[hsl(17,37%,19%,0.75)] backdrop-blur-md animate-float-up" onClick={() => setOpen(false)} role="presentation">
          <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border/60 p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-[hsl(128,52%,47%)]" />
                {t("accessibility.panel")}
              </h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              {/* TTS */}
              <ToggleRow icon={Volume2} label={t("accessibility.tts")} desc={t("accessibility.tts_hint")}
                on={ttsEnabled} onToggle={() => setTtsEnabled(!ttsEnabled)} onLabel={t("accessibility.tts_on")} offLabel={t("accessibility.tts_off")} />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={readPage}
                  disabled={!ttsSupported}
                  className="rounded-2xl bg-[hsl(85,54%,51%,0.18)] px-3 py-2.5 text-sm font-semibold text-[hsl(128,52%,35%)] transition-colors hover:bg-[hsl(85,54%,51%,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("tts.listen")}
                </button>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  disabled={!ttsSupported}
                  className="rounded-2xl bg-secondary px-3 py-2.5 text-sm font-semibold text-foreground/75 transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("tts.stop")}
                </button>
              </div>
              {/* High contrast */}
              <ToggleRow icon={Contrast} label={t("accessibility.contrast")}
                on={highContrast} onToggle={() => setHighContrast(!highContrast)} onLabel={t("accessibility.contrast_on")} offLabel={t("accessibility.contrast_off")} />
              {/* Large font */}
              <ToggleRow icon={Type} label={t("accessibility.large_font")}
                on={largeFont} onToggle={() => setLargeFont(!largeFont)} onLabel={t("accessibility.large_on")} offLabel={t("accessibility.large_off")} />
            </div>
          </div>
        </div>, document.body)}
    </>
  );
}

function ToggleRow({ icon: Icon, label, desc, on, onToggle, onLabel, offLabel }) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/50 border border-border/40">
      <div className="flex items-start gap-3 flex-1">
        <Icon className="w-5 h-5 text-[hsl(128,52%,47%)] mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-sm">{label}</p>
          {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      </div>
      <button onClick={onToggle}
        className={`shrink-0 relative w-12 h-7 rounded-full transition-colors ${on ? "bg-[hsl(85,54%,51%)]" : "bg-muted-foreground/30"}`}
        aria-pressed={on}>
        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${on ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}
