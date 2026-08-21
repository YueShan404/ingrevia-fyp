import React from "react";

/**
 * Ingrevia brand logo — stylized "i" leaf with scan frame + 3 dots.
 * Matches the official brand identity. The icon keeps the green gradient
 * (logo identity); the wordmark uses deep forest green #003632.
 */
export function LogoIcon({ size = 40, className = "", rounded = true }) {
  const r = rounded ? Math.round(size * 0.28) : 0;
  return (
    <span
      style={{ width: size, height: size, borderRadius: r }}
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden shadow-md ${className}`}
      aria-label="Ingrevia logo"
      role="img"
    >
      <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="ingrevia-bg" x1="0" y1="1" x2="0.7" y2="0">
            <stop offset="0%" stopColor="#003632" />
            <stop offset="55%" stopColor="#39b54a" />
            <stop offset="100%" stopColor="#8dc63f" />
          </linearGradient>
          <linearGradient id="ingrevia-leaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e3f29b" />
            <stop offset="100%" stopColor="#a5d653" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#ingrevia-bg)" />
        {/* Leaf (forms the dot of "i") */}
        <path d="M32 9 C 44 12 44 25 32 28 C 20 25 20 12 32 9 Z" fill="url(#ingrevia-leaf)" />
        {/* Scanning-frame body (stem of "i") */}
        <path
          d="M22 30 L 42 30 L 42 49 C 42 52 39 54 36 54 L 28 54 C 25 54 22 52 22 49 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        {/* Scan-frame corners */}
        <path d="M22 36 L 22 31 L 27 31" fill="none" stroke="#a5d653" strokeWidth="2" strokeLinecap="round" />
        <path d="M42 36 L 42 31 L 37 31" fill="none" stroke="#a5d653" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 48 L 22 53 L 27 53" fill="none" stroke="#a5d653" strokeWidth="2" strokeLinecap="round" />
        <path d="M42 48 L 42 53 L 37 53" fill="none" stroke="#a5d653" strokeWidth="2" strokeLinecap="round" />
        {/* Three dots inside (communication/learning) */}
        <circle cx="29" cy="39" r="2.1" fill="#ffffff" />
        <circle cx="38" cy="39" r="2.1" fill="#ffffff" />
        <circle cx="33.5" cy="47" r="2.3" fill="#ffffff" />
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
            style={{ color: "#003632", fontSize: Math.round(size * 0.6) }}
          >
            ingrevia
          </span>
          {showTagline && (
            <span
              className="block font-semibold tracking-[0.28em] mt-1"
              style={{ color: "#003632", opacity: 0.7, fontSize: Math.max(8, Math.round(size * 0.18)) }}
            >
              {TAGLINES[lang] || TAGLINES.en}
            </span>
          )}
        </span>
      )}
    </span>
  );
}