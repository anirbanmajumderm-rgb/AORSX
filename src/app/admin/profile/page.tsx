"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Eye, EyeOff, User } from "lucide-react";
import { toast } from "sonner";

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", username: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/profile");
      const json = await res.json();
      if (json.success && json.data) {
        setProfile({ name: json.data.name || "", email: json.data.email || "", username: json.data.username || "" });
      }
    } catch { toast.error("Failed to load profile"); }
    finally { setLoading(false); }
  }

  async function handleSaveProfile() {
    if (!profile.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      const json = await res.json();
      if (json.success) toast.success("Profile updated");
      else toast.error(json.error || "Failed to save");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (!passwordForm.currentPassword) { toast.error("Current password is required"); return; }
    if (!passwordForm.newPassword) { toast.error("New password is required"); return; }
    if (passwordForm.newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Password changed");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else toast.error(json.error || "Failed to change password");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 animate-pulse space-y-6"><div className="h-8 w-48 bg-white/5 rounded-lg" /><div className="h-64 bg-white/5 rounded-2xl" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Profile</h1>
          <p className="text-sm text-white/40 mt-1">Manage your account settings</p>
        </div>
      </div>

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <User size={16} className="text-neon-cyan" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">Account Info</h3>
              <p className="text-xs text-white/30">Your name, email, and username</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Username</label>
              <input value={profile.username} disabled
                className="w-full h-9 px-3 rounded-lg bg-white/[0.01] border border-white/[0.04] text-sm text-white/40 outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Email</label>
              <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Name</label>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
              />
            </div>
          </div>
          <div className="mt-5">
            <button onClick={handleSaveProfile} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04] mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <Eye size={16} className="text-neon-orange" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold">Change Password</h3>
              <p className="text-xs text-white/30">Update your login password (min 8 characters)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Current Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full h-9 px-3 pr-9 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">New Password</label>
              <input type={showPassword ? "text" : "password"} value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Confirm New Password</label>
              <input type={showPassword ? "text" : "password"} value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
              />
            </div>
          </div>
          <div className="mt-5">
            <button onClick={handleChangePassword} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neon-cyan/10 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Change Password
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
