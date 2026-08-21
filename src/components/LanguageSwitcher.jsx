import React, { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Globe, Check } from "lucide-react";

export default function LanguageSwitcher() {
  const { lang, setLanguage, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = languages.find((l) => l.code === lang);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-sm font-medium bg-secondary hover:bg-secondary/70 transition-colors"
        aria-label="Language">
        <Globe className="w-4 h-4 text-[hsl(128,52%,47%)]" />
        <span className="hidden sm:inline">{current?.label}</span>
        <span className="sm:hidden">{current?.short}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 glass-card rounded-2xl shadow-xl border border-border/50 p-1.5 animate-float-up z-50">
          {languages.map((l) => (
            <button key={l.code} onClick={() => { setLanguage(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                lang === l.code ? "bg-secondary font-semibold" : "hover:bg-secondary/60"
              }`}>
              <span className="text-lg">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {lang === l.code && <Check className="w-4 h-4 text-[hsl(128,52%,47%)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}