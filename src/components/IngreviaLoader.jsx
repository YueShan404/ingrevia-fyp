import "@/components/IngreviaLoader.css";

export default function IngreviaLoader({ message = "Loading your journey...", fullScreen = false, compact = false }) {
  return (
    <div className={`ingrevia-loader ${fullScreen ? "ingrevia-loader-full" : ""} ${compact ? "ingrevia-loader-compact" : ""}`} role="status">
      <div className="ingrevia-loader-symbol" aria-hidden="true">
        <img src="/ingrevia-mark-transparent.png" alt="" className="ingrevia-loader-mark" />
        <svg className="ingrevia-loader-path" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="ingreviaLoaderGradient" x1="22%" y1="80%" x2="86%" y2="16%">
              <stop offset="0%" stopColor="#6336b4" />
              <stop offset="58%" stopColor="#d63d8c" />
              <stop offset="100%" stopColor="#ff861f" />
            </linearGradient>
          </defs>
          <path
            className="ingrevia-loader-progress"
            d="M34 94 C80 92 94 72 66 59 C43 48 52 31 83 25"
          />
        </svg>
        <span className="ingrevia-loader-light" />
      </div>

      <div className="ingrevia-loader-text">
        <p>{message}</p>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
