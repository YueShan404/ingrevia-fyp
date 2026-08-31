import "@/components/IngreviaLoader.css";

export default function IngreviaLoader({ message = "Loading your journey...", fullScreen = false, compact = false }) {
  return (
    <div className={`ingrevia-loader ${fullScreen ? "ingrevia-loader-full" : ""} ${compact ? "ingrevia-loader-compact" : ""}`} role="status">
      <div className="ingrevia-loader-symbol" aria-hidden="true">
        <img src="/ingrevia-mark-transparent.png" alt="" className="ingrevia-loader-mark" />
      </div>

      <div className="ingrevia-loader-text">
        <p>{message}</p>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
