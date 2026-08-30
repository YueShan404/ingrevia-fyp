import "@/components/IngreviaLoader.css";

export default function IngreviaLoader({ message = "Loading your journey...", fullScreen = false, compact = false }) {
  return (
    <div className={`ingrevia-loader ${fullScreen ? "ingrevia-loader-full" : ""} ${compact ? "ingrevia-loader-compact" : ""}`} role="status">
      <div className="ingrevia-loader-symbol" aria-hidden="true">
        <div className="ingrevia-loader-glow" />
        <img src="/ingrevia-mark-transparent.png" alt="" className="ingrevia-loader-mark" />
        <svg className="ingrevia-loader-path" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="ingreviaLoaderGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7138A8" />
              <stop offset="52%" stopColor="#D84487" />
              <stop offset="100%" stopColor="#FF8A26" />
            </linearGradient>
          </defs>
          <path
            className="ingrevia-loader-progress"
            d="M34 94 C80 92 94 72 66 59 C43 48 52 31 83 25"
          />
        </svg>
        <span className="ingrevia-loader-spark">✦</span>
      </div>

      <div className="ingrevia-loader-text">
        <p>{message}</p>
        <div className="ingrevia-loader-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
