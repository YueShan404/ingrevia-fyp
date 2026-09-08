import React from "react";

export function LogoIcon({ size = 40, className = "", rounded = true }) {
  const r = rounded ? Math.round(size / 2) : 0;
  return (
    <span
      style={{ width: size, height: size, borderRadius: r }}
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-sm ring-1 ring-black/10 ${className}`}
      aria-label="Ingrevia logo"
      role="img"
    >
      <img src="/ingrevia-site-icon.png" alt="" className="h-full w-full object-contain" />
    </span>
  );
}

const TAGLINES = {
  en: "SCAN • LEARN • COOK • SHARE",
  bm: "IMBAS • BELAJAR • MASAK • KONGSI",
  zh: "扫描 • 学习 • 烹饪 • 分享",
  ta: "ஸ்கேன் • கற்றல் • சமையல் • பகிர்வு",
};

export default function Logo({ size = 36, showWordmark = true, showTagline = false, lang = "en", className = "" }) {
  if (showWordmark) {
    return (
      <span className={`inline-flex min-w-0 max-w-full items-center gap-2.5 leading-normal ${className}`}>
        <LogoIcon size={size} />
        <span className="min-w-0 overflow-visible py-0.5">
          <span
            className="block truncate font-display font-extrabold leading-[1.12]"
            style={{ color: "#2d1165", fontSize: Math.round(size * 0.74), letterSpacing: 0 }}
          >
            Ingrevia
          </span>
          {showTagline && (
            <span
              className="block truncate font-semibold tracking-[0.28em] mt-0.5 leading-none"
              style={{ color: "#2d1165", opacity: 0.72, fontSize: Math.max(8, Math.round(size * 0.18)) }}
            >
              {TAGLINES[lang] || TAGLINES.en}
            </span>
          )}
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex shrink-0 leading-none ${className}`}>
      <LogoIcon size={size} />
    </span>
  );
}
