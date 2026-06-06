export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40 text-sm">Loading...</p>
      </div>
    </div>
  );
}
