"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Save, RefreshCw, AlertTriangle, Globe, Palette,
  SearchIcon, Code, Shield, Smartphone, User, Lock,
  Key, CheckCircle, X, Eye, EyeOff, Type, ImageUp,
  Trash2, Link
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { cn } from "@/lib/utils";

const fontCombos = [
  {
    id: "elegant",
    label: "Elegant",
    body: "Poppins",
    heading: "Playfair Display",
    mono: "JetBrains Mono",
    preview: "The quick brown fox jumps over the lazy dog.",
  },
  {
    id: "modern",
    label: "Modern",
    body: "Inter",
    heading: "Sora",
    mono: "Space Grotesk",
    preview: "The quick brown fox jumps over the lazy dog.",
  },
];

const sections = [
  {
    key: "general", label: "General", icon: Globe,
    fields: [
      { key: "site_title", label: "Site Title", type: "text", desc: "Your website brand name" },
      { key: "tagline", label: "Tagline", type: "text", desc: "Brief site description" },
      { key: "admin_email", label: "Admin Email", type: "email", desc: "Primary contact email" },
    ],
  },
  {
    key: "branding", label: "Branding", icon: Palette,
    fields: [
      { key: "hero_headline", label: "Hero Heading", type: "text", desc: "Main headline on homepage" },
      { key: "hero_subtitle", label: "Hero Subtitle", type: "text", desc: "Sub-headline text" },
      { key: "primary_color", label: "Primary Color", type: "text", desc: "Brand primary color hex" },
    ],
  },
  {
    key: "seo", label: "SEO", icon: SearchIcon,
    fields: [
      { key: "meta_description", label: "Meta Description", type: "textarea", desc: "Default SEO description" },
      { key: "meta_keywords", label: "Meta Keywords", type: "text", desc: "Comma-separated keywords" },
    ],
  },
  {
    key: "advanced", label: "Advanced", icon: Code,
    fields: [
      { key: "google_analytics_id", label: "Google Analytics ID", type: "text", desc: "GA4 measurement ID" },
      { key: "custom_css", label: "Custom CSS", type: "textarea", desc: "Additional CSS styles" },
      { key: "custom_js", label: "Custom JavaScript", type: "textarea", desc: "Additional JS scripts" },
    ],
  },
];

export default function AdminSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASaving, setTwoFASaving] = useState(false);
  const [twoFASetupStep, setTwoFASetupStep] = useState<"idle" | "qr" | "verify" | "codes">("idle");
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFAQrCode, setTwoFAQrCode] = useState("");
  const [twoFASetupOtp, setTwoFASetupOtp] = useState("");
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
  const [twoFADisablePassword, setTwoFADisablePassword] = useState("");
  const [twoFAShowDisable, setTwoFAShowDisable] = useState(false);
  const [twoFASetupLoading, setTwoFASetupLoading] = useState(false);
  const [fontCombo, setFontCombo] = useState("elegant");

  // Logo
  const [companyLogo, setCompanyLogo] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState(false);

  async function handleUploadLogo(file: File) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: formData });
      const d = await r.json();
      if (d.success) {
        const url = d.data.url;
        setCompanyLogo(url);
        setLogoError(false);
        await fetch("/api/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo: url }),
        });
        toast.success("Logo uploaded successfully");
      } else {
        toast.error(d.error || "Failed to upload");
      }
    } catch { toast.error("Network error"); }
    setUploadingLogo(false);
  }

  async function handleRemoveLogo() {
    setCompanyLogo("");
    try {
      await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: "" }),
      });
      toast.success("Logo removed");
    } catch { toast.error("Network error"); }
  }

  async function fetchSettings() {
    setLoading(true); setError(null);
    try {
      const [settingsRes, companyRes, profileRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/company"),
        fetch("/api/admin/profile"),
      ]);
      if (!settingsRes.ok) throw new Error("Network error");
      const d = await settingsRes.json();
      if (d.success) setSettings(d.data);
      else throw new Error(d.error || "Failed to load");
      if (d.data?.font_combination) setFontCombo(d.data.font_combination);

      if (companyRes.ok) {
        const cd = await companyRes.json();
        if (cd.success && cd.data?.logo) { setCompanyLogo(cd.data.logo); setLogoError(false); }
      }

      if (profileRes.ok) {
        const pd = await profileRes.json();
        if (pd.success && typeof pd.data?.twoFactorEnabled === "boolean") {
          setTwoFAEnabled(pd.data.twoFactorEnabled);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    }
    setLoading(false);
  }

  useEffect(() => { queueMicrotask(() => fetchSettings()); }, []);

  useEffect(() => {
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileName(session.user.name || "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileEmail(session.user.email || "");
    }
  }, [session]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const d = await r.json();
      if (d.success) toast.success("Settings saved");
      else toast.error(d.error || "Failed to save");
    } catch { toast.error("Network error"); }
    setSaving(false);
  }

  async function handleSaveFonts() {
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ font_combination: fontCombo }),
      });
      const d = await r.json();
      if (d.success) toast.success("Font settings saved — refresh to see changes");
      else toast.error(d.error || "Failed to save");
    } catch { toast.error("Network error"); }
    setSaving(false);
  }

  async function handleUpdateProfile() {
    if (!profileName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      const d = await r.json();
      if (d.success) toast.success("Profile updated");
      else toast.error(d.error || "Failed to update profile");
    } catch { toast.error("Network error"); }
    setSaving(false);
  }

  async function handleChangePassword() {
    if (!currentPassword) { toast.error("Current password is required"); return; }
    if (!newPassword || newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setPasswordSaving(true);
    try {
      const r = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await r.json();
      if (d.success) {
        toast.success("Password changed successfully");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        toast.error(d.error || "Failed to change password");
      }
    } catch { toast.error("Network error"); }
    setPasswordSaving(false);
  }

  async function handleStart2FASetup() {
    setTwoFASetupLoading(true);
    setTwoFASetupStep("qr");
    try {
      const r = await fetch("/api/admin/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const d = await r.json();
      if (d.success) {
        setTwoFASecret(d.data.secret);
        setTwoFAQrCode(d.data.qrCode);
        setTwoFASetupStep("verify");
      } else {
        toast.error(d.error || "Failed to start setup");
        setTwoFASetupStep("idle");
      }
    } catch { toast.error("Network error"); setTwoFASetupStep("idle"); }
    setTwoFASetupLoading(false);
  }

  async function handleVerify2FASetup() {
    if (twoFASetupOtp.length !== 6) { toast.error("Enter a 6-digit code"); return; }
    setTwoFASaving(true);
    try {
      const r = await fetch("/api/admin/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: twoFASecret, token: twoFASetupOtp }),
      });
      const d = await r.json();
      if (d.success) {
        setTwoFABackupCodes(d.data.backupCodes);
        setTwoFASetupStep("codes");
        setTwoFAEnabled(true);
        toast.success("2FA enabled successfully");
      } else {
        toast.error(d.error || "Invalid code. Try again.");
      }
    } catch { toast.error("Network error"); }
    setTwoFASaving(false);
  }

  async function handleDisable2FA() {
    if (!twoFADisablePassword) { toast.error("Password is required"); return; }
    setTwoFASaving(true);
    try {
      const r = await fetch("/api/admin/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: twoFADisablePassword }),
      });
      const d = await r.json();
      if (d.success) {
        setTwoFAEnabled(false);
        setTwoFASetupStep("idle");
        setTwoFASecret("");
        setTwoFAQrCode("");
        setTwoFABackupCodes([]);
        setTwoFADisablePassword("");
        setTwoFAShowDisable(false);
        toast.success("2FA disabled");
      } else {
        toast.error(d.error || "Failed to disable 2FA");
      }
    } catch { toast.error("Network error"); }
    setTwoFASaving(false);
  }

  async function handleBackupCodesCopied() {
    setTwoFASetupStep("idle");
    toast.success("Backup codes saved");
  }

  if (!session) return null;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] p-6">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/10 mx-auto mb-4">
            <AlertTriangle size={28} className="text-amber-400/70" />
          </div>
          <p className="text-white/60 text-sm mb-4">{error}</p>
          <Button onClick={fetchSettings} variant="outline" size="sm" className="gap-2">
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Settings" description="Manage your profile, security, and site configuration">
        <Badge variant="outline" className="gap-1.5 text-[10px]">
          <Shield size={10} /> Secure
        </Badge>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile" className="gap-2"><User size={14} /> Profile</TabsTrigger>
          <TabsTrigger value="password" className="gap-2"><Lock size={14} /> Password</TabsTrigger>
          <TabsTrigger value="2fa" className="gap-2"><Key size={14} /> Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="general" className="gap-2"><Globe size={14} /> General</TabsTrigger>
          <TabsTrigger value="branding" className="gap-2"><Palette size={14} /> Branding</TabsTrigger>
          <TabsTrigger value="fonts" className="gap-2"><Type size={14} /> Fonts</TabsTrigger>
          <TabsTrigger value="seo" className="gap-2"><SearchIcon size={14} /> SEO</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2"><Code size={14} /> Advanced</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 max-w-2xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <User size={16} className="text-neon-cyan" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold">Admin Profile</h3>
                <p className="text-xs text-white/30">Update your name and email</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Name</label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)}
                className="bg-white/[0.02] border-white/[0.04] text-sm" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Email</label>
              <Input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)}
                className="bg-white/[0.02] border-white/[0.04] text-sm" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpdateProfile} disabled={saving} size="sm" className="gap-1.5">
                {saving ? "Saving..." : <><Save size={12} /> Save Profile</>}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 max-w-2xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Lock size={16} className="text-neon-cyan" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold">Change Password</h3>
                <p className="text-xs text-white/30">Update your admin password</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Current Password</label>
              <div className="relative">
                <Input type={showCurrent ? "text" : "password"} value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white/[0.02] border-white/[0.04] text-sm pr-10" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">New Password</label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/[0.02] border-white/[0.04] text-sm pr-10" />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/[0.02] border-white/[0.04] text-sm pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={passwordSaving} size="sm" className="gap-1.5">
                {passwordSaving ? "Changing..." : <><Lock size={12} /> Change Password</>}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* 2FA Tab */}
        <TabsContent value="2fa" className="mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 max-w-2xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <Key size={16} className="text-neon-cyan" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold">Two-Factor Authentication</h3>
                <p className="text-xs text-white/30">Add an extra layer of security to your account</p>
              </div>
            </div>

            {twoFASetupStep === "idle" && !twoFAEnabled && (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-white/20" />
                    <div>
                      <p className="text-sm font-medium text-white/70">Two-Factor Authentication</p>
                      <p className="text-xs text-white/30">Disabled</p>
                    </div>
                  </div>
                  <Button onClick={handleStart2FASetup} disabled={twoFASetupLoading} size="sm" className="gap-1.5">
                    {twoFASetupLoading ? "Preparing..." : <><Shield size={12} /> Enable 2FA</>}
                  </Button>
                </div>
                <p className="text-xs text-white/20">
                  2FA adds an extra layer of security by requiring a verification code from your authenticator app in addition to your password.
                </p>
              </>
            )}

            {twoFASetupStep === "verify" && twoFAQrCode && (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <p className="text-sm text-white/60 text-center">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <img src={twoFAQrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl bg-white p-2" />
                  <p className="text-xs text-white/30 text-center">
                    Or enter the secret key manually in your authenticator app
                  </p>
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1.5">Verification Code</label>
                  <input type="text" value={twoFASetupOtp}
                    onChange={(e) => setTwoFASetupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="glass-input text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6} placeholder="000000" autoFocus />
                </div>

                <div className="flex justify-end gap-3">
                  <Button onClick={() => { setTwoFASetupStep("idle"); setTwoFASecret(""); setTwoFAQrCode(""); setTwoFASetupOtp(""); }}
                    variant="outline" size="sm">Cancel</Button>
                  <Button onClick={handleVerify2FASetup} disabled={twoFASaving || twoFASetupOtp.length !== 6} size="sm" className="gap-1.5">
                    {twoFASaving ? "Verifying..." : <><CheckCircle size={12} /> Verify & Enable</>}
                  </Button>
                </div>
              </div>
            )}

            {twoFASetupStep === "codes" && twoFABackupCodes.length > 0 && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-amber-400 flex items-start gap-2">
                  <Shield size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Save These Backup Codes</p>
                    <p className="text-xs text-amber-400/70">
                      Each code can only be used once. Store them in a secure location.
                      If you lose your authenticator app, these codes are the only way to access your account.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {twoFABackupCodes.map((code, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] font-mono text-sm text-white/70 text-center tracking-wider">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleBackupCodesCopied} size="sm" className="gap-1.5">
                    <CheckCircle size={12} /> I&apos;ve Saved These Codes
                  </Button>
                </div>
              </div>
            )}

            {twoFAEnabled && twoFASetupStep === "idle" && (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-white/70">Two-Factor Authentication</p>
                      <p className="text-xs text-white/30">Enabled</p>
                    </div>
                  </div>
                  <Button onClick={() => setTwoFAShowDisable(!twoFAShowDisable)}
                    variant="outline" size="sm" className="gap-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10">
                    Disable 2FA
                  </Button>
                </div>

                {twoFAShowDisable && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-4">
                    <p className="text-sm text-red-400">
                      Enter your password to disable two-factor authentication.
                    </p>
                    <div>
                      <label className="text-xs text-white/50 block mb-1.5">Password</label>
                      <input type="password" value={twoFADisablePassword}
                        onChange={(e) => setTwoFADisablePassword(e.target.value)}
                        className="glass-input" placeholder="Current password" />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button onClick={() => { setTwoFAShowDisable(false); setTwoFADisablePassword(""); }}
                        variant="outline" size="sm">Cancel</Button>
                      <Button onClick={handleDisable2FA} disabled={twoFASaving || !twoFADisablePassword}
                        size="sm" className="gap-1.5 bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                        {twoFASaving ? "Disabling..." : "Confirm Disable"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* Fonts Tab */}
        <TabsContent value="fonts" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <Type size={16} className="text-neon-cyan" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold">Font Settings</h3>
                    <p className="text-xs text-white/30">Choose a font combination for your website</p>
                  </div>
                </div>
                <Button onClick={handleSaveFonts} size="sm" disabled={saving} className="h-9 text-xs gap-1.5">
                  {saving ? "Saving..." : <><Save size={12} /> Save Fonts</>}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {fontCombos.map((combo) => (
                  <button
                    key={combo.id}
                    onClick={() => setFontCombo(combo.id)}
                    className={`relative rounded-2xl border p-5 text-left transition-all duration-300 ${
                      fontCombo === combo.id
                        ? "border-neon-cyan bg-neon-cyan/[0.04] shadow-[0_0_20px_rgba(0,229,255,0.08)]"
                        : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.03]"
                    }`}
                  >
                    {fontCombo === combo.id && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-neon-cyan flex items-center justify-center">
                        <CheckCircle size={12} className="text-black" />
                      </div>
                    )}
                    <h4 className="font-heading text-sm font-bold text-white/80 mb-3">{combo.label}</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-white/30">Body</span>
                        <span className="text-white/60" style={{ fontFamily: `"${combo.body}", sans-serif` }}>{combo.body}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/30">Heading</span>
                        <span className="text-white/60" style={{ fontFamily: `"${combo.heading}", serif` }}>{combo.heading}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/30">Mono</span>
                        <span className="text-white/60" style={{ fontFamily: `"${combo.mono}", monospace` }}>{combo.mono}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.04]">
                      <p className="text-xs text-white/30">Body preview:</p>
                      <p className="text-sm text-white/70 mt-1">{combo.preview}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-white/30">Heading preview:</p>
                      <p className="text-base font-bold text-white/80 mt-1" style={{ fontFamily: `"${combo.heading}", serif` }}>{combo.preview}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/20 mt-4">Changes take effect after page refresh. Fonts are loaded via Google Fonts with <code className="text-neon-cyan">display=swap</code> for optimal performance.</p>
            </div>
          </motion.div>
        </TabsContent>

        {/* General Settings */}
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <TabsContent key={sec.key} value={sec.key} className="mt-6">
              <motion.form
                onSubmit={handleSaveSettings}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <Icon size={16} className="text-neon-cyan" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-bold">{sec.label}</h3>
                        <p className="text-xs text-white/30">Manage {sec.label.toLowerCase()} settings</p>
                      </div>
                    </div>
                    <Button type="submit" size="sm" disabled={saving || loading} className="h-9 text-xs gap-1.5">
                      {saving ? "Saving..." : <><Save size={12} /> Save {sec.label}</>}
                    </Button>
                  </div>
                  <div className="space-y-5">
                    {sec.fields.map((field) => (
                      <div key={field.key}>
                        <label className="text-xs text-white/50 block mb-1.5 capitalize">{field.label}</label>
                        {field.type === "textarea" ? (
                          <Textarea
                            value={settings[field.key] || ""}
                            onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                            className="bg-white/[0.02] border-white/[0.04] text-sm min-h-[80px]"
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={settings[field.key] || ""}
                            onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                            className="bg-white/[0.02] border-white/[0.04] text-sm"
                          />
                        )}
                        <p className="text-[10px] text-white/20 mt-1">{field.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.form>

              {/* Logo Upload Section (only in Branding tab) */}
              {sec.key === "branding" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-6"
                >
                  <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <ImageUp size={16} className="text-neon-cyan" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-bold">Site Logo</h3>
                        <p className="text-xs text-white/30">Upload your brand logo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center overflow-hidden shrink-0">
                        {companyLogo && !logoError ? (
                          <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-2" onError={() => setLogoError(true)} />
                        ) : (
                          <ImageUp size={28} className="text-white/20" />
                        )}
                      </div>
                      <div className="space-y-3 flex-1">
                        <label className="relative inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:bg-white/[0.06] transition-all duration-300">
                          <ImageUp size={14} />
                          {uploadingLogo ? "Uploading..." : "Choose Image"}
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadLogo(file);
                            }}
                            disabled={uploadingLogo}
                          />
                        </label>
                        {companyLogo && (
                          <button
                            onClick={handleRemoveLogo}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-all duration-300"
                          >
                            <Trash2 size={14} /> Remove Logo
                          </button>
                        )}
                        {companyLogo && (
                          <p className="text-[10px] text-white/20 flex items-center gap-1">
                            <Link size={10} /> {companyLogo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="text-[10px] gap-1">
          <Shield size={10} /> Secure connection
        </Badge>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-white/[0.02] animate-pulse shimmer-overlay" />
      ))}
    </div>
  );
}
