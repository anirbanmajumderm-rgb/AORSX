import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
      <div className="text-center max-w-lg">
        <div className="text-8xl font-bold font-heading bg-gradient-to-r from-[#FF6B00] to-[#00E5FF] bg-clip-text text-transparent mb-6">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-white/50 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#00E5FF] text-black font-semibold hover:shadow-lg hover:shadow-[#00E5FF]/20 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
