"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Save, Trash2, Edit3, X, Shield, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

const defaultPermissions = [
  { key: "edit_content", label: "Edit Content" },
  { key: "manage_users", label: "Manage Users" },
  { key: "manage_team", label: "Manage Team" },
  { key: "view_analytics", label: "View Analytics" },
  { key: "manage_roles", label: "Manage Roles" },
  { key: "manage_ai", label: "Manage AI" },
  { key: "manage_notifications", label: "Manage Notifications" },
  { key: "manage_features", label: "Manage Features" },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [editingPerms, setEditingPerms] = useState<Record<string, boolean>>({});
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => { loadRoles(); }, []);

  async function loadRoles() {
    try {
      const res = await fetch("/api/admin/roles");
      const json = await res.json();
      if (json.success) setRoles(json.data || json.roles || json);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  function parsePermissions(perms: any): Record<string, boolean> {
    if (typeof perms === "string") {
      try { return JSON.parse(perms); } catch { return {}; }
    }
    return perms || {};
  }

  function selectRole(role: any) {
    setSelectedRole(role);
    setEditingPerms(parsePermissions(role.permissions));
    setShowNewRole(false);
    setDeleteConfirm(null);
  }

  async function handleSavePermissions() {
    if (!selectedRole || selectedRole.name === "Founder") return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedRole.name,
          description: selectedRole.description,
          permissions: JSON.stringify(editingPerms),
        }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("Permissions updated");
        loadRoles();
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) { toast.error("Role name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          description: newRoleDesc.trim(),
          permissions: JSON.stringify({}),
        }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("Role created");
        setShowNewRole(false);
        setNewRoleName("");
        setNewRoleDesc("");
        loadRoles();
      }
    } catch {
      toast.error("Failed to create role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRole(id: number) {
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      if ((await res.json()).success) {
        toast.success("Role deleted");
        setDeleteConfirm(null);
        setSelectedRole(null);
        loadRoles();
      }
    } catch {
      toast.error("Cannot delete role with assigned users");
    }
  }

  function togglePermission(key: string) {
    setEditingPerms(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    Founder: "border-purple-500/20 bg-purple-500/5",
    Admin: "border-neon-cyan/20 bg-neon-cyan/5",
    Editor: "border-blue-500/20 bg-blue-500/5",
    Viewer: "border-white/[0.06] bg-white/[0.02]",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Roles & Permissions</h1>
          <p className="text-sm text-white/40 mt-1">Manage roles and their permissions</p>
        </div>
        <button
          onClick={() => { setShowNewRole(!showNewRole); setSelectedRole(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      {/* New Role Form */}
      {showNewRole && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 mb-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/70">Create Custom Role</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Role Name</label>
              <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
              <input value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowNewRole(false)} className="px-4 py-2 rounded-xl border border-white/[0.06] text-sm text-white/50">Cancel</button>
            <button onClick={handleCreateRole} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-2">
          {roles.map((role: any) => (
            <button
              key={role.id}
              onClick={() => selectRole(role)}
              className={cn(
                "w-full text-left rounded-2xl border p-4 transition-all",
                selectedRole?.id === role.id
                  ? "bg-white/[0.04] border-white/20"
                  : roleColors[role.name] || "bg-white/[0.02] border-white/[0.04] hover:border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white/80">{role.name}</span>
                {role.name === "Founder" && <Lock className="w-3 h-3 text-purple-400" />}
              </div>
              {role.description && <p className="text-xs text-white/40">{role.description}</p>}
              <p className="text-[10px] text-white/20 mt-2">{role._count?.users || role.users?.length || 0} users</p>
            </button>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedRole.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{selectedRole.description || "No description"}</p>
                </div>
                {selectedRole.name !== "Founder" && (
                  <div className="flex items-center gap-2">
                    {selectedRole._count?.users === 0 && selectedRole.name !== "Admin" && (
                      <button onClick={() => setDeleteConfirm(selectedRole.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={handleSavePermissions} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all">
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {defaultPermissions.map((perm) => (
                  <div key={perm.key} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <span className="text-sm text-white/70">{perm.label}</span>
                    <button
                      onClick={() => selectedRole.name !== "Founder" && togglePermission(perm.key)}
                      disabled={selectedRole.name === "Founder"}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        editingPerms[perm.key] ? "bg-neon-cyan" : "bg-white/[0.08]",
                        selectedRole.name === "Founder" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                        editingPerms[perm.key] && "translate-x-5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
              <Shield className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/30">Select a role to view and edit its permissions</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDeleteRole(deleteConfirm!)}
        title="Delete Role?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
