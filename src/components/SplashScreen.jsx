import { useEffect, useState } from "react";
import "@/components/SplashScreen.css";

export default function SplashScreen({ onFinish, minDuration = 2700 }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, minDuration);
    const finishTimer = window.setTimeout(() => {
      onFinish?.();
    }, minDuration + 650);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  return (
    <div
      className={`splash-container ${isFadingOut ? "fade-out" : ""}`}
      aria-label="Ingrevia loading"
      onAnimationEnd={(event) => {
        if (event.animationName === "splashExit") {
          onFinish?.();
        }
      }}
    >
      <div className="splash-content">
        <div className="splash-logo-stage" aria-hidden="true">
          <span className="splash-seed" />
          <svg className="splash-journey" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="splashJourneyGradient" x1="18%" y1="82%" x2="86%" y2="14%">
                <stop offset="0%" stopColor="#6336b4" />
                <stop offset="54%" stopColor="#d63d8c" />
                <stop offset="100%" stopColor="#ff861f" />
              </linearGradient>
            </defs>
            <path className="splash-arc" d="M39 121 C12 75 34 28 89 20 C107 17 122 21 135 27" />
            <path className="splash-path" d="M57 116 C98 111 118 86 84 72 C55 60 65 42 112 38" />
            <path className="splash-leaf splash-leaf-left" d="M48 101 C34 85 35 69 49 64 C61 75 61 90 48 101Z" />
            <path className="splash-leaf splash-leaf-right" d="M58 100 C62 84 74 76 87 78 C84 93 73 102 58 100Z" />
            <circle className="splash-dot" cx="48" cy="113" r="7" />
            <path className="splash-star" d="M124 31 L129 45 L143 50 L129 55 L124 69 L119 55 L105 50 L119 45Z" />
          </svg>
        </div>
        <div className="logo-wrapper">
          <img src="/ingrevia-brand-transparent.png" alt="Ingrevia 食知途" className="splash-logo" />
        </div>
        <p className="splash-tagline">
          Your Journey from <span>Ingredient</span> to <strong>Insight.</strong>
        </p>
      </div>
    </div>
  );
}
