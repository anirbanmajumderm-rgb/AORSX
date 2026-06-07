"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Shield, KeyRound, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [siteName, setSiteName] = useState("Admin");
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>(
    searchParams.get("error") === "CredentialsSignin"
      ? "Invalid email or password"
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [requiresEmailOTP, setRequiresEmailOTP] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/site-data")
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const name = json.data?.company?.name || json.data?.settings?.site_name || json.data?.settings?.site_name || "Admin";
          setSiteName(name);
        }
      })
      .catch(() => {});
  }, []);

  async function handleInitialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/2fa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (data.data?.requiresEmailOTP) {
        setTempToken(data.data.tempToken);
        setRequiresEmailOTP(true);
        setLoading(false);
      } else if (data.data?.requires2FA) {
        setTempToken(data.data.tempToken);
        setRequires2FA(true);
        setLoading(false);
      } else {
        const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
        router.push(callbackUrl);
      }
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  async function handleOTPSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = useBackupCode ? "/api/admin/2fa/backup-code" : "/api/admin/2fa/verify-login";
      const body = useBackupCode
        ? { tempToken, backupCode }
        : { tempToken, otp };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid code. Please try again.");
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
      router.push(callbackUrl);
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  async function handleEmailOTPSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, otp }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Invalid code. Please try again.");
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
      router.push(callbackUrl);
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  if (requiresEmailOTP) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-orange to-neon-cyan bg-clip-text text-transparent">
              {siteName}
            </h1>
            <p className="text-white/40 mt-2 text-sm">Email Verification</p>
          </div>

          <form onSubmit={handleEmailOTPSubmit} className="glass-card p-5 sm:p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10 mb-2">
              <Mail size={20} className="text-neon-cyan shrink-0" />
              <p className="text-sm text-white/60">
                Enter the verification code sent to your email
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-white/60 text-sm block mb-2">Verification Code</label>
              <div className="relative">
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="glass-input text-center text-2xl tracking-[0.5em] font-mono" placeholder="000000"
                  maxLength={6} required autoFocus />
              </div>
            </div>

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold
                hover:shadow-lg hover:shadow-neon-cyan/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : <><KeyRound size={18} /> Verify</>}
            </button>

            <div className="flex justify-center pt-2">
              <button type="button" onClick={() => { setRequiresEmailOTP(false); setTempToken(""); setOtp(""); setError(""); }}
                className="text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1">
                <ArrowLeft size={12} /> Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (requires2FA) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-orange to-neon-cyan bg-clip-text text-transparent">
              {siteName}
            </h1>
            <p className="text-white/40 mt-2 text-sm">Two-Factor Authentication</p>
          </div>

          <form onSubmit={handleOTPSubmit} className="glass-card p-5 sm:p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10 mb-2">
              <Shield size={20} className="text-neon-cyan shrink-0" />
              <p className="text-sm text-white/60">
                Enter the verification code from your authenticator app{!useBackupCode ? ":" : ":"}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {!useBackupCode ? (
              <div>
                <label className="text-white/60 text-sm block mb-2">Authenticator Code</label>
                <div className="relative">
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="glass-input text-center text-2xl tracking-[0.5em] font-mono" placeholder="000000"
                    maxLength={6} required autoFocus />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-white/60 text-sm block mb-2">Backup Code</label>
                <input type="text" value={backupCode} onChange={(e) => setBackupCode(e.target.value)}
                  className="glass-input text-center font-mono" placeholder="XXXX-XXXXXX" required autoFocus />
              </div>
            )}

            <button type="submit" disabled={loading || (!useBackupCode && otp.length !== 6) || (useBackupCode && backupCode.length < 4)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold
                hover:shadow-lg hover:shadow-neon-cyan/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : <><KeyRound size={18} /> Verify</>}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setError(""); }}
                className="text-xs text-white/30 hover:text-neon-cyan transition-colors">
                {useBackupCode ? "Use authenticator app instead" : "Use a backup code instead"}
              </button>
              <button type="button" onClick={() => { setRequires2FA(false); setTempToken(""); setOtp(""); setBackupCode(""); setUseBackupCode(false); setError(""); }}
                className="text-xs text-white/30 hover:text-white/50 transition-colors flex items-center gap-1">
                <ArrowLeft size={12} /> Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-orange to-neon-cyan bg-clip-text text-transparent">
            {siteName}
          </h1>
          <p className="text-white/40 mt-2 text-sm">Admin Dashboard Login</p>
        </div>

          <form onSubmit={handleInitialSubmit} className="glass-card p-5 sm:p-6 md:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-white/60 text-sm block mb-2">Email or Username</label>
            <input type="text" value={login} onChange={(e) => setLogin(e.target.value)}
              className="glass-input" placeholder="Email or Username" required />
          </div>

          <div>
            <label className="text-white/60 text-sm block mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input pr-10" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/admin/forgot-password" className="text-xs text-white/30 hover:text-neon-cyan transition-colors">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold
              hover:shadow-lg hover:shadow-neon-cyan/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-6">
          Admin access only
        </p>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
        <div className="text-white/40">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
