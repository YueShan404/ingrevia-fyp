import React, { useState } from "react";

// 3D flip card — front shows icon, back shows message. Tap to flip.
export default function FlipCard({ front, back, flipped: controlledFlipped, onFlip }) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const handleFlip = () => {
    if (onFlip) onFlip();
    else setInternalFlipped((f) => !f);
  };

  return (
    <div className={`flip-card ${flipped ? "flipped" : ""} w-full h-[420px] cursor-pointer`} onClick={handleFlip}>
      <div className="flip-card-inner">
        <div className="flip-face">
          {typeof front === "function" ? front() : front}
        </div>
        <div className="flip-face flip-back">
          {typeof back === "function" ? back() : back}
        </div>
      </div>
    </div>
  );
}