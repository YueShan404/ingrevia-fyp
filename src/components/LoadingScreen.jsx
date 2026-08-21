export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[hsl(175,100%,11%)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center animate-pulse">
          <span className="text-white font-heading font-extrabold text-xl">i</span>
        </div>
        <div className="w-8 h-8 border-4 border-white/20 border-t-[hsl(85,54%,51%)] rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
