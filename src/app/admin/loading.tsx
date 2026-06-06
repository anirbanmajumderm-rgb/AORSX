export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/[0.04] border-t-neon-cyan" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-neon-orange to-neon-cyan animate-breathe" />
          </div>
        </div>
        <p className="text-sm text-white/30 font-medium tracking-wide">Loading dashboard</p>
      </div>
    </div>
  );
}
