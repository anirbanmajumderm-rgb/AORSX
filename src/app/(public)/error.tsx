"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
      <div className="text-center max-w-lg">
        <div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B00]/20 to-[#00E5FF]/20 flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-4xl">⚡</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-white/50 mb-1 leading-relaxed">
          An unexpected error occurred. Please try again.
        </p>
        {isDev && error.message && (
          <p className="text-[#FF6B00]/60 text-xs mb-4 p-2 bg-[#FF6B00]/5 rounded-lg break-words">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="text-white/20 text-xs mb-6">Ref: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#00E5FF] text-black font-semibold hover:shadow-lg hover:shadow-[#00E5FF]/20 transition-all"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
