"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
      } else {
        setError(json.error || "Failed to send reset email");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white/90 mb-2">Check Your Email</h1>
          <p className="text-white/40 mb-6">
            If an account exists for {email}, we&apos;ve sent a password reset link.
          </p>
          <Link href="/admin/login">
            <Button><ArrowLeft size={16} className="mr-2" /> Back to Login</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="glass-card p-5 sm:p-6 md:p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 mb-6 mx-auto">
            <Mail size={20} className="text-neon-cyan" />
          </div>
          <h1 className="text-xl font-semibold text-white/90 text-center mb-2">Forgot Password</h1>
          <p className="text-sm text-white/40 text-center mb-6">
            Enter your email address and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 flex items-center gap-2">
                <AlertCircle size={14} />{error}
              </div>
            )}

            <div>
              <label className="text-white/60 text-sm block mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="glass-input" placeholder="admin@example.com" required />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold
                hover:shadow-lg hover:shadow-neon-cyan/20 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/admin/login" className="text-sm text-white/30 hover:text-neon-cyan transition-colors">
              <ArrowLeft size={14} className="inline mr-1" /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
