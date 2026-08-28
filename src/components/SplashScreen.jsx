export default function SplashScreen({ leaving = false }) {
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#fffaf7] transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(242,104,62,0.12),transparent_28%),radial-gradient(circle_at_70%_65%,rgba(99,64,177,0.12),transparent_30%)]" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative mb-6 h-44 w-44 sm:h-56 sm:w-56">
          <div className="absolute inset-3 rounded-full border-2 border-primary/15 animate-[splash-ring_2.4s_ease-out_forwards]" />
          <div className="absolute -right-1 top-8 h-6 w-6 rounded-full bg-accent opacity-0 shadow-[0_0_28px_rgba(249,115,22,0.45)] animate-[splash-star_2.2s_ease-out_0.7s_forwards]" />
          <div className="absolute inset-0 rounded-[2rem] bg-white shadow-2xl shadow-primary/10 opacity-0 animate-[splash-card_2.8s_ease-out_forwards]" />
          <img
            src="/logo.png"
            alt="Ingrevia"
            className="relative h-full w-full object-contain opacity-0 animate-[splash-logo_2.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-primary/70 opacity-0 animate-[splash-copy_0.7s_ease_1.2s_forwards]">
          Scan Learn Cook Share
        </p>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground opacity-0 animate-[splash-copy_0.7s_ease_1.45s_forwards]">
          Your journey from ingredient to insight.
        </p>
      </div>
    </div>
  );
}
