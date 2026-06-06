"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[AdminErrorBoundary]", error.message);
    if (info?.componentStack) {
      console.error("[AdminErrorBoundary] Component stack:", info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Admin Dashboard Error
            </h2>
            <p className="text-white/50 mb-4 text-sm leading-relaxed">
              A critical error occurred. This may be due to a session issue or
              temporary system failure.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#00E5FF] text-black font-semibold text-sm hover:shadow-lg transition-all"
              >
                Reload Page
              </button>
              <a
                href="/admin/login"
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:text-white transition-all"
              >
                Re-login
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
