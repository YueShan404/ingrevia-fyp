import { useEffect, useState } from "react";
import "@/components/SplashScreen.css";

export default function SplashScreen({ onFinish, minDuration = 3800 }) {
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
      <div className="storyboard-wave storyboard-wave-left" />
      <div className="storyboard-wave storyboard-wave-right" />

      <div className="splash-content">
        <div className="logo-wrapper">
          <div className="seed-dot" />
          <div className="logo-glow" />
          <img src="/ingrevia-logo.png" alt="Ingrevia 食知途" className="splash-logo" />
          <span className="spark spark-1" aria-hidden="true">✦</span>
          <span className="spark spark-2" aria-hidden="true">✦</span>
          <span className="spark spark-3" aria-hidden="true">✦</span>
        </div>
        <p className="splash-tagline">
          Your Journey from <span className="ingredient-word">Ingredient</span> to <span className="insight-word">Insight.</span>
        </p>
      </div>
    </div>
  );
}
