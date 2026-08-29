import { useEffect, useState } from "react";
import "@/components/SplashScreen.css";

export default function SplashScreen({ onFinish, minDuration = 2600 }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, minDuration);
    const finishTimer = window.setTimeout(() => {
      onFinish?.();
    }, minDuration + 550);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  return (
    <div className={`splash-container ${isFadingOut ? "fade-out" : ""}`} aria-label="Ingrevia loading">
      <div className="storyboard-wave storyboard-wave-left" />
      <div className="storyboard-wave storyboard-wave-right" />

      <div className="splash-content">
        <div className="logo-stage">
          <div className="seed-dot" />
          <div className="logo-glow" />
          <img src="/ingrevia-logo.png" alt="Ingrevia 食知途" className="splash-logo" />
          <div className="sparkle-mark" aria-hidden="true">✦</div>
        </div>
        <p className="splash-tagline">
          Your Journey from <span>Ingredient</span> to <strong>Insight.</strong>
        </p>
      </div>
    </div>
  );
}
