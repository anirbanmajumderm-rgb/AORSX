"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
        <div className="w-full max-w-md text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-white/90 mb-2">Invalid Link</h1>
          <p className="text-white/40 mb-6">This password reset link is invalid or missing a token.</p>
          <Button onClick={() => router.push("/admin/login")}>
            <ArrowLeft size={16} className="mr-2" /> Back to Login
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setError(json.error || "Failed to reset password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
        <div className="w-full max-w-md text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white/90 mb-2">Password Reset</h1>
          <p className="text-white/40 mb-6">Your password has been reset successfully.</p>
          <Button onClick={() => router.push("/admin/login")}>
            <ArrowLeft size={16} className="mr-2" /> Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 mb-6 mx-auto">
            <Lock size={20} className="text-neon-cyan" />
          </div>
          <h1 className="text-xl font-semibold text-white/90 text-center mb-2">Reset Your Password</h1>
          <p className="text-sm text-white/40 text-center mb-6">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-white/60 mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                placeholder="Min. 8 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                placeholder="Repeat your password"
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
