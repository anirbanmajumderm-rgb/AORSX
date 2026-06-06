"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const typeColors: Record<string, string> = {
  info: "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20",
  warning: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  success: "text-green-400 bg-green-500/10 border-green-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [showPrefs, setShowPrefs] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([loadNotifications(), loadPreferences()]);
  }, []);

  async function loadNotifications() {
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      if (json.success) setNotifications(json.data?.notifications || json.notifications || []);
    } catch {} finally { setLoading(false); }
  }

  async function loadPreferences() {
    try {
      const res = await fetch("/api/admin/notifications/preferences");
      const json = await res.json();
      if (json.success) setPreferences(json.data || json);
    } catch {}
  }

  async function markRead(id?: number) {
    try {
      const res = await fetch("/api/admin/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      if ((await res.json()).success) {
        toast.success(id ? "Marked as read" : "All marked as read");
        loadNotifications();
      }
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      if ((await res.json()).success) {
        toast.success("Notification deleted");
        loadNotifications();
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if ((await res.json()).success) {
        toast.success("Preferences saved");
        setShowPrefs(false);
      }
    } catch {
      toast.error("Failed to save");
    } finally { setSaving(false); }
  }

  const filtered = tab === "unread" ? notifications.filter((n: any) => !n.read) : notifications;

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Notifications</h1>
          <p className="text-sm text-white/40 mt-1">Stay updated with site events</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => markRead()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
          <button onClick={() => setShowPrefs(!showPrefs)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all">
            <Settings className="w-4 h-4" /> Preferences
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/[0.04] pb-2">
        <button onClick={() => setTab("all")} className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", tab === "all" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}>
          All ({notifications.length})
        </button>
        <button onClick={() => setTab("unread")} className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-all", tab === "unread" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}>
          Unread ({notifications.filter((n: any) => !n.read).length})
        </button>
      </div>

      {/* Preferences Panel */}
      {showPrefs && preferences && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/70">Notification Preferences</h3>
          <div className="space-y-3">
            {[
              { key: "newUserSignup", label: "New User Signup" },
              { key: "newFaqSubmission", label: "New FAQ Submission" },
              { key: "newContactSubmission", label: "New Contact Form Submission" },
              { key: "analyticsAnomaly", label: "Analytics Anomaly" },
              { key: "failedLogin", label: "Failed Login Attempt" },
              { key: "contentPublish", label: "Content Published" },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between py-2">
                <span className="text-sm text-white/70">{pref.label}</span>
                <button
                  onClick={() => setPreferences((p: any) => ({ ...p, [pref.key]: !p[pref.key] }))}
                  className={cn("relative w-11 h-6 rounded-full transition-colors", preferences[pref.key] ? "bg-neon-cyan" : "bg-white/[0.08]")}
                >
                  <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm", preferences[pref.key] && "translate-x-5")} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowPrefs(false)} className="px-4 py-2 rounded-xl border border-white/[0.06] text-sm text-white/50">Cancel</button>
            <button onClick={savePreferences} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        </motion.div>
      )}

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.map((notification: any) => {
          const Icon = typeIcons[notification.type] || Info;
          return (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl border p-5 transition-all flex items-start gap-4",
                notification.read ? "bg-white/[0.01] border-white/[0.04]" : "bg-white/[0.03] border-white/[0.08]"
              )}
            >
              <div className={cn("p-2.5 rounded-xl border", typeColors[notification.type] || typeColors.info)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", notification.read ? "text-white/50" : "text-white/80 font-medium")}>{notification.title}</p>
                {notification.description && <p className="text-xs text-white/30 mt-1">{notification.description}</p>}
                <p className="text-[10px] text-white/20 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!notification.read && (
                  <button onClick={() => markRead(notification.id)} className="p-1.5 rounded-lg hover:bg-neon-cyan/10 text-white/30 hover:text-neon-cyan transition-all">
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => handleDelete(notification.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
            <Bell className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30">{tab === "unread" ? "No unread notifications" : "No notifications yet"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
