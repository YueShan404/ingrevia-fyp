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
      <div className="splash-content">
        <div className="logo-wrapper">
          <img src="/ingrevia-brand-transparent.png" alt="Ingrevia 食知途" className="splash-logo" />
        </div>
      </div>
    </div>
  );
}
