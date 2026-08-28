export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-white shadow-lg overflow-hidden animate-pulse">
          <img src="/logo.png" alt="Ingrevia" className="h-full w-full object-cover" />
        </div>
        <div className="w-9 h-9 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
