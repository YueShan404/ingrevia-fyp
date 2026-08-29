import React from "react";

export function LogoIcon({ size = 40, className = "", rounded = true }) {
  const r = rounded ? Math.round(size * 0.24) : 0;
  return (
    <span
      style={{ width: size, height: size, borderRadius: r }}
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-md ${className}`}
      aria-label="Ingrevia logo"
      role="img"
    >
      <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="ingrevia-mark" x1="12" y1="56" x2="55" y2="7" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5b2ab2" />
            <stop offset="50%" stopColor="#d83c8c" />
            <stop offset="100%" stopColor="#ff7a1a" />
          </linearGradient>
          <linearGradient id="ingrevia-leaf" x1="13" y1="46" x2="31" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7431b4" />
            <stop offset="100%" stopColor="#ff7040" />
          </linearGradient>
        </defs>
        <path
          d="M23 53 A25 25 0 1 1 50 16"
          fill="none"
          stroke="url(#ingrevia-mark)"
          strokeWidth="4.7"
          strokeLinecap="round"
        />
        <path
          d="M30 52 C38 45 46 40 39 30 C34 22 47 21 45 13"
          fill="none"
          stroke="url(#ingrevia-mark)"
          strokeWidth="7.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M18 43 C9 34 4 39 8 50 C14 52 18 48 18 43 Z" fill="url(#ingrevia-leaf)" />
        <path d="M21 42 C18 31 11 31 11 41 C14 47 19 46 21 42 Z" fill="url(#ingrevia-leaf)" />
        <path d="M23 47 C32 37 39 42 33 51 C28 55 24 52 23 47 Z" fill="url(#ingrevia-leaf)" />
        <circle cx="20" cy="50" r="2.7" fill="#6a34ad" />
        <path
          d="M50 5 C51.2 12.4 54.6 15.8 62 17 C54.6 18.2 51.2 21.6 50 29 C48.8 21.6 45.4 18.2 38 17 C45.4 15.8 48.8 12.4 50 5 Z"
          fill="#ff7a1a"
        />
        <path d="M50 0 V4 M50 30 V34 M33 17 H37 M63 17 H64 M38 5 L41 8 M59 26 L62 29" stroke="#ff7a1a" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
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
  return (
    <span className={`inline-flex items-center gap-2.5 leading-none ${className}`}>
      <LogoIcon size={size} />
      {showWordmark && (
        <span>
          <span
            className="font-display font-extrabold tracking-tight"
            style={{ color: "#241052", fontSize: Math.round(size * 0.6) }}
          >
            ingrevia
          </span>
          {showTagline && (
            <span
              className="block font-semibold tracking-[0.28em] mt-1"
              style={{ color: "#241052", opacity: 0.72, fontSize: Math.max(8, Math.round(size * 0.18)) }}
            >
              {TAGLINES[lang] || TAGLINES.en}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
